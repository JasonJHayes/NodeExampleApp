"use strict";

// this production environment uses Microsoft Azure
// https://docs.microsoft.com/en-us/azure/app-service-web/app-service-web-nodejs-get-started
// the node process is hosted inside IIS and uses iisnode https://github.com/tjanczuk/iisnode
module.exports = {
    webPort: process.env.PORT || 80, // IIS uses a special port for NodeJS apps
    requireHttps: false, // handled by IIS; everything is HTTP once Node is reached
    maxRequestsPerWindow: 100,
    maxRequestBodySize: MAX_REQUEST_BODY_SIZE,
    compressResponse: true,
    useSecureCookies: false, // can't use because of how IIS handles HTTPS
    cookieMaxAge: 8 * 60 * 60 * 1000, // ms -> 8 hours
    secret: "Node Example App",
    saltLength: 16,
    dbURI: "mongodb://NodeJS:Node3xamp!eApp@test-server.ddns.net:27017/NodeDB",
    email: {
        server: {
            host: "smtp.gmail.com",
            user: "",
            password: "",
            ssl: true
        },
        from: "server@NodeExampleApp.com"
    },
    error: {
        saveToDb: true,
        sendEmail: true,
        emailTo: "error-address@outlook.com",
        emailSubject: "Node Example App: An Error Has Occurred!"
    },
    angularJSScripts:
    "<script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular.min.js'></script>\n\
    <script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular-route.min.js'></script>\n\
    <script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular-cookies.min.js'></script>"
};

// override the email server with environment variable information
// allows for personalized information security
if (process.env.NODE_EMAIL_SERVER) {
    module.exports.email.server = JSON.parse(process.env.NODE_EMAIL_SERVER);
}