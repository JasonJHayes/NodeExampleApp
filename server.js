"use strict";

// https://expressjs.com/en/advanced/best-practice-performance.html

// https://nodejs.org/en/docs/
var path = require("path");
//var mongoDB = require("mongodb"); // http://mongodb.github.io/node-mongodb-native/
var emailjs = require("emailjs"); // https://github.com/eleith/emailjs
var express = require("express"); // http://expressjs.com/en/4x/api.html
var cookieParser = require("cookie-parser"); // https://github.com/expressjs/cookie-parser
var expressSession = require("express-session"); // https://github.com/expressjs/session
var MongoDBStore = require("connect-mongodb-session")(expressSession); // https://github.com/mongodb-js/connect-mongodb-session
var bodyParser = require("body-parser"); // https://github.com/expressjs/body-parser
//var multer = require("multer"); // https://github.com/expressjs/multer
var mongoose = require("mongoose"); // http://mongoosejs.com/docs/guide.html
var bluebird = require("bluebird"); // http://bluebirdjs.com/docs/getting-started.html

// setup NodeJS
require("./wwwroot/javascript/constants.js");
global.ts = function () {
    var timestamp = new Date();
    return timestamp.toLocaleDateString() + " " + timestamp.toLocaleTimeString();
};
global.errorHandler = require("./scripts/errorHandler.js");
//console.log(ts(), "LOG", "node related version information\n", process.versions);
// allow the node process to be killed
global.plannedDisconnect = false;
process.on("SIGINT", function () { // triggers on console <Ctrl>-C
    plannedDisconnect = true;
    server.httpServer.close(function () {
        mongoose.connection.close(function () {
            // force the process to exit
            // this helps to kill database connections
            // e.g. for session store
            if (server.db) {
                server.db.close(process.exit);
            } else process.exit();
        });
    });
}).on("uncaughtException", function (err) {
    // handling errors in here gives nodemon problems?
    //errorHandler.processError(err, undefined, true);
    //plannedDisconnect = true;
    //server.httpServer.close(function () {
    //    // delay shutdown so error handler can finish
    //    // email needs quite a lengthy delay
    //    setTimeout(function () {
    //        mongoose.connection.close(function () {
    //            if (server.db) {
    //                server.db.close(process.exit);
    //            } else process.exit();
    //        });
    //    }, 2000);
    //});
}).on("exit", function () {
    console.log(ts(), "LOG", "Node process terminated");
});

// setup server object
// expose server to all modules (global)
if (global.server) console.log(ts(), "WARN", "global server overwritten");
global.server = {};

// setup environment
server.environment = process.env.NODE_ENV;
console.log(ts(), "LOG", "environment", server.environment);
if (server.environment === ENV_DEVELOPMENT) {
    server.settings = require("./settings/development.js");
} else if (server.environment === ENV_PRODUCTION) {
    server.settings = require("./settings/production.js");
} else throw "unknown environment";
// directories and paths
server.wwwroot = path.join(__dirname + "/wwwroot");

// setup MongoClient
// test connection can be established
// use connection pooling
// https://docs.mongodb.com/manual/
//mongoDB.MongoClient.connect(server.settings.dbURI, function (err, db) {
//    if (err) return console.log(ts(), "ERROR", "could not connect to the database", err);
//    console.log(ts(), "LOG", "MongoClient connected to", db.databaseName, "on port", db.serverConfig.s.port);
//    server.db = db;
//    server.db.on("close", function () {
//        console.log(ts(), "LOG", "MongoClient disconnected");
//    });
//    server.mongoReady = true;
//    startWebServer();
//});
server.mongoReady = true; // not using MongoClient

// setup email
server.email = emailjs.server.connect(server.settings.email.server);

// setup express
server.app = express();
server.app.set("env", server.environment);
server.app.set("x-powered-by", false);
if (server.settings.compressResponse) {
    server.app.use(require("compression")()); // https://github.com/expressjs/compression
}
server.app.use(express.static(server.wwwroot, {
    index: false // don't use index.html by default
}));
// setup view engine
// using AngularJS instead
//server.app.set("view engine", "pug"); // https://pugjs.org/api/getting-started.html
//server.app.set("views", "./views");
//server.app.locals.pretty = server.environment === ENV_DEVELOPMENT;

// cookie parser
server.app.use(cookieParser(server.settings.secret)); // secret must match session state

// setup session state
// use the database for session store
// session remains even when node server stops and restarts
// does not share the connection pool https://github.com/mongodb-js/connect-mongodb-session/issues/15
var sessionStore = new MongoDBStore({
    uri: server.settings.dbURI,
    collection: "sessions"
});
sessionStore.on("error", function (err) {
    console.log(ts(), "ERROR", "session store error", err);
    if (!plannedDisconnect) throw "session store connection lost";
});
sessionStore.on("connected", function () {
    console.log(ts(), "LOG", "session store connected");
    server.sessionReady = true;
    startWebServer();
});
server.app.use(expressSession({
    secret: server.settings.secret, // must match cookie parser secret
    resave: false, // only save session to store when modified
    saveUninitialized: false, // no uninitialized sessions in store
    rolling: true, // maxAge reset after each response
    cookie: {
        maxAge: server.settings.cookieMaxAge,
        // secure cookies require HTTPS
        // may also require trust proxy; server.app.set("trust proxy", 1)
        secure: server.settings.useSecureCookies
    },
    store: sessionStore
}));

// use the body parser for easier POST data access
// https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
server.app.use(bodyParser.urlencoded({
    extended: true,
    limit: server.settings.maxRequestBodySize
}));
server.app.use(bodyParser.json({ // used by AngularJS
    limit: server.settings.maxRequestBodySize
}));

// handle multipart/form-data (files)
// it is more efficient to use this only on required routes
//server.upload = multer(); // uses in memory (buffer) storage

// setup routing
require("./router.js");

// use mongoose for easier data modeling
mongoose.Promise = bluebird; // use bluebird for promises, they are fast
// it appears the practice is to use a single always open connection (pool)
mongoose.connect(server.settings.dbURI);
mongoose.connection.on("error", function (err) {
    console.log(ts(), "ERROR", "mongoose error", err);
}).on("connected", function () {
    console.log(ts(), "LOG", "mongoose default connection to", mongoose.connection.name);
    server.mongooseReady = true;
    startWebServer();
}).on("disconnected", function () {
    console.log(ts(), "LOG", "mongoose default disconnected");
    if (!plannedDisconnect) throw "mongoose connection lost";
});

// setup models
server.models = require("./models.js");

// begin listening to web traffic
// wait until database is ready
function dbReady() {
    return server.mongoReady &&
        server.sessionReady &&
        server.mongooseReady;
}
function startWebServer() {
    if (!dbReady()) return;
    console.log(ts(), "LOG", "starting web server on port", server.settings.webPort);
    server.httpServer = server.app.listen(server.settings.webPort, function () {
        console.log(ts(), "LOG", "web server listening on port", this.address().port, "...");
    });
    server.httpServer.on("close", function () {
        console.log(ts(), "LOG", "HTTP server disconnected");
        if (!plannedDisconnect) throw "HTTP server connection lost";
    });
}

// NodeJS synchronous startup finished
console.log(ts(), "LOG", "done server.js");