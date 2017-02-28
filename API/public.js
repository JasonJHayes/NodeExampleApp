"use strict";

var router = require("express").Router();
var hash = require("../scripts/hash.js");

function hashString(string, salt) {
    if (!salt) salt = hash.genRandomString(server.settings.saltLength);
    return hash.hashSha512(string, salt);
}

function storeUserInSession(session, user) {
    // keep minimal information in session
    session.userToken = {
        userId: user.userId
    };
}

// signup
router.post("/signup", function (req, res, next) {
    // make sure required information is given
    if (!req.body.userId || !req.body.password) {
        return res.json({ err: "User ID and password required." });
    }
    // make sure userId is minimum length
    if (req.body.userId.length < server.models.User.schema.obj.userId.minLength) {
        return res.json({ err: "User ID must be at least 4 characters." });
    }
    // make sure password is minimum length
    if (req.body.userId.length < server.models.Password.schema.obj.password.minLength) {
        return res.json({ err: "Password must be at least 4 characters." });
    }
    // make sure passwords match
    if (req.body.password !== req.body.passwordRepeat) {
        return res.json({ err: "Password must match repeat password." });
    }
    // check if the user already exists
    var userId = req.body.userId.toUpperCase();
    server.models.User.findOne({
        userId: userId
    }).select("userId")
        .exec(function (err, user) {
            if (err) return next(err);
            if (user) return res.json({ err: "User ID already exists." });
            // insert the new user
            // removes previous inserted information if a step fails
            // two-phase commits might be an alternative to this approach
            // https://docs.mongodb.com/manual/tutorial/perform-two-phase-commits/
            user = new server.models.User({ userId: userId });
            user.save(function (err) {
                if (err) return next(err);
                // insert password
                var userHashForPwd = hashString(userId, "password").hash;
                var password = hashString(req.body.password);
                new server.models.Password({
                    _id: userHashForPwd,
                    password: password.hash
                }).save(function (err) {
                    if (err) {
                        server.models.User.findOneAndRemove({ userId: userId }).exec();
                        return next(err);
                    }
                    // insert salt
                    new server.models.Salt({
                        _id: hashString(userId, "salt").hash,
                        salt: password.salt
                    }).save(function (err) {
                        if (err) {
                            server.models.User.findOneAndRemove({ userId: userId }).exec();
                            server.models.Password.findByIdAndRemove(userHashForPwd).exec();
                            return next(err);
                        }
                        // user creation successful
                        storeUserInSession(req.session, user);
                        return res.end();
                    });
                });
            });
        });
});

// signin
router.post("/signin", function (req, res, next) {
    // record the signin
    var userId = (req.body.userId || "").toUpperCase();
    var signin = new server.models.Signin({
        userId: userId,
        ipAddress: req.ip,
        signinSource: req.body.source,
        headers: req.headers
    });
    signin.save(function (err) {
        if (err) errorHandler.processError(err, req);
    });
    // check if the signin information is valid
    // first check if the userId exists
    server.models.User.findOne({
        userId: userId
    }).select("userId password")
        .exec(function (err, user) {
            if (err) return next(err);
            if (!user) return res.json({ err: "Invalid signin." });
            // next get the hashed password
            server.models.Password.findOne({
                _id: hashString(userId, "password").hash
            }, function (err, password) {
                if (err) return next(err);
                if (!password) {
                    errorHandler.processError("Invalid database state. Password missing for " + userId, req);
                    return res.json({ err: "Invalid signin." });
                }
                // next get the users salt
                server.models.Salt.findOne({
                    _id: hashString(userId, "salt").hash
                }, function (err, salt) {
                    if (err) return next(err);
                    if (!salt) {
                        errorHandler.processError("Invalid database state. Salt missing for " + userId, req);
                        return res.json({ err: "Invalid signin." });
                    }
                    // next check if the hashed passwords match
                    var signinPassword = hashString(req.body.password, salt.salt).hash;
                    if (signinPassword !== password.password) {
                        return res.json({ err: "Invalid signin." });
                    }
                    // signin successful
                    storeUserInSession(req.session, user);
                    // update the signin
                    signin.success = true;
                    signin.sessionId = req.session.id;
                    signin.save(function (err) { if (err) errorHandler.processError(err, req); });
                    // end the response
                    return res.end();
                });
            });
        });
});

// signout
router.post("/signout", function (req, res, next) {
    // update the signin with the signout time
    // grab userId and sessionId in case session
    // is destroyed before signin update callback
    var userId = req.session.userToken.userId;
    var sessionId = req.session.id;
    server.models.Signin.findOne({
        userId: userId,
        sessionId: sessionId
    }, function (err, signin) {
        if (err) return errorHandler.processError(err, req);
        if (!signin) return errorHandler.processError("Invalid database state. Signin missing for " + userId + " " + sessionId, req);
        signin.signoutSource = req.body.source;
        signin.save(function (err) { if (err) errorHandler.processError(err, req); });
    });
    // end the session
    req.session.destroy(function () {
        return res.end();
    });
});

// user lookup
// this may be a security risk?
router.get("/user/:userId", function (req, res, next) {
    // find the user
    server.models.User.findOne({
        userId: req.params.userId.toUpperCase()
    }, function (err, user) {
        if (err) {
            errorHandler.processError(err, req);
            return res.json({ err: MSG_UNKNOWN_ERROR });
        }
        return res.json({ exists: user !== null });
    });
});

module.exports = router;