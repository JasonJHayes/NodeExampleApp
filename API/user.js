"use strict";

var router = require("express").Router();

// user picture
router.get("/:userId/picture/:pictureId", function (req, res, next) {
    // can only get for currently logged in userId
    var userId = req.params.userId.toUpperCase();
    if (userId !== req.session.userToken.userId) {
        return res.json({ err: "Unauthorized." });
    }
    // find the picture
    server.models.File.findById(req.params.pictureId, function (err, picture) {
        if (err) return next(err);
        if (!picture) {
            errorHandler.processError("Invalid database state. Picture missing for " + userId, req);
            return res.json({ err: "No picture available." });
        }
        // can only access picture if the user is the owner
        if (userId !== picture.ownerUserId) return res.status(401).end();
        // send the picture
        res.set("Content-Type", picture.type);
        res.set("Content-Length", picture.size);
        return res.send(picture.bytes);
    });
});

// user signins
router.get("/:userId/signins", function (req, res, next) {
    // can only get for currently logged in userId
    var userId = req.params.userId.toUpperCase();
    if (userId !== req.session.userToken.userId) {
        return res.json({ err: "Unauthorized." });
    }
    // find the signins
    server.models.Signin.find({ userId: req.params.userId }, function (err, signins) {
        if (err) return next(err);
        return res.send(signins);
    });
});

// CRUD
router.route("/:userId")
    // get a user by userId from the database
    .get(function (req, res, next) {
        // can only get for currently logged in userId
        var userId = req.params.userId.toUpperCase();
        if (userId !== req.session.userToken.userId) {
            return res.json({ err: "Unauthorized." });
        }
        // find the user
        server.models.User.findOne({
            userId: userId
        }, function (err, user) {
            if (err) return next(err);
            return res.json(user);
        });
    })
    // update a user by userId in the database
    // also update the users picture file
    .post(function (req, res, next) {
        // can only update for currently logged in userId
        var userId = req.params.userId.toUpperCase();
        if (userId !== req.session.userToken.userId) {
            return res.json({ err: "Unauthorized." });
        }
        // find the user
        server.models.User.findOne({
            userId: userId
        }, function (err, user) {
            if (err) return next(err);
            // update the user information
            user.fullname = req.body.fullname;
            user.pictureId = req.body.pictureId;
            // update the user picture
            if (req.body.picture) {
                // remove the existing picture
                server.models.File.findByIdAndRemove(user.pictureId).exec();
                // create and store the new picture
                var file = new server.models.File({
                    bytes: Buffer.from(req.body.picture.base64, "base64"),
                    size: req.body.picture.size,
                    type: req.body.picture.type,
                    name: req.body.picture.name,
                    ownerUserId: userId
                });
                file.save();
                // it is possible the user will have a pictureId, but
                // the picture will have failed to save to the database
                user.pictureId = file ? file.id : undefined;
            }
            // save the user to the database
            user.save(function (err) {
                if (err) return next(err);
                return res.end();
            });
        });
    });

module.exports = router;