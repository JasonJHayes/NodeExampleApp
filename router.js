"use strict";

var path = require("path");
var fs = require("fs");
var express = require("express");
var ExpressBrute = require("express-brute"); // https://github.com/AdamPflug/express-brute
var MongooseStore = require("express-brute-mongoose"); // https://github.com/cbargren/express-brute-mongoose
var mongoose = require("mongoose");
var BruteForceSchema = require("express-brute-mongoose/dist/schema");

server.secureRouter = express.Router();
server.publicRouter = express.Router();

// HTTPS
server.app.all("*", function (req, res, next) {
    if (server.settings.requireHttps && !req.secure) {
        res.redirect("https://" + req.get("host") + req.originalUrl);
    } else next();
});

// request limiter
var limiterStore = new MongooseStore(mongoose.model("bruteforce", BruteForceSchema));
var limiter = new ExpressBrute(limiterStore, {
    freeRetries: server.settings.maxRequestsPerWindow,
    failCallback: function (req, res, next, nextValidRequestDate) {
        res.status(429).sendFile(path.join(server.webroot + "/429.html"));
    },
    handleStoreError: function (err) {
        console.log(ts(), "ERROR", "request rate limiter store error", err);
        if (!plannedDisconnect) throw "request rate limiter store connection lost";
    }
});
server.app.all("*", limiter.prevent);

// public content
server.app.get("/", function (req, res, next) {
    res.redirect(PUBLIC_URL + "/");
});

// secure content protection
// covers all paths with secure as the base
server.secureRouter.use(function (req, res, next) {
    if (!req.session.userToken) {
        //res.status(401).sendFile(path.join(server.webroot + "/401.html"));
        res.cookie(COOKIE_MSG, MSG_UNAUTHORIZED);
        res.redirect(SIGNIN_URL);
    } else next();
});

// API
// when possible use an isolated router
// when needed use the secure router
server.app.use("/API", require("./API/public.js"));
// route /secure/API/*
server.secureRouter.use("/API/user", require("./API/user.js"));

// AngularJS
server.publicRouter.get("/*", function (req, res, next) {
    // pass the session information in a cookie, which
    // will be deleted immediately in the AngularJS page
    if (req.session.userToken) res.cookie(COOKIE_SESSION, req.session.userToken.userId);
    var file = path.join(server.webroot + PUBLIC_URL + "/public.html");
    fs.readFile(file, "utf8", function (err, data) {
        if (err) return next(err);
        // use non-minified scripts in development
        res.send(data.replace(/<!--AngularJSScripts-->/g, server.settings.angularJSScripts));
    });
});
server.secureRouter.get("/*", function (req, res, next) {
    // pass the session information in a cookie, which
    // will be deleted immediately in the AngularJS page
    res.cookie(COOKIE_SESSION, req.session.userToken.userId);
    var file = path.join(server.webroot + SECURE_URL + "/secure.html");
    fs.readFile(file, "utf8", function (err, data) {
        if (err) return next(err);
        // use non-minified scripts in development
        res.send(data.replace(/<!--AngularJSScripts-->/g, server.settings.angularJSScripts));
    });
});

// add public and secure routes before error handling
server.app.use(PUBLIC_URL, server.publicRouter);
server.app.use(SECURE_URL, server.secureRouter);

// errors
// call 500 to log errors
server.app.get("/500", function (req, res, next) {
    next("fake server error");
});
server.app.post("/500", function (req, res, next) {
    // make sure this handler does not use default error handler
    // don't want the message cookie or redirect here
    errorHandler.processError({
        message: req.body.message,
        source: req.body.source,
        lineno: req.body.lineno,
        colno: req.body.colno,
        stack: req.body.stack,
        status: req.body.status,
        statusUrl: req.body.statusUrl
    }, req);
    res.send();
});
server.app.use(function (req, res, next) {
    errorHandler.processError({
        message: MSG_404_ERROR,
        status: 404,
        statusUrl: req.get("host") + req.originalUrl
    }, req);
    // don't do redirect on the server because it is bad for API calls
    res.status(404).sendFile(path.join(server.webroot + "/404.html"));
});
server.app.use(function (err, req, res, next) {
    errorHandler.processError(err, req);
    //res.status(500).sendFile(path.join(server.webroot + "/500.html"));
    res.cookie(COOKIE_MSG, MSG_UNKNOWN_ERROR);
    res.redirect("/");
});