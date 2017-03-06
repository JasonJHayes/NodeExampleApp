"use strict";

module.exports = {
    webPort: 3000,
    requireHttps: false,
    maxRequestsPerWindow: 100,
    maxRequestBodySize: MAX_REQUEST_BODY_SIZE,
    compressResponse: true,
    useSecureCookies: false, // requires HTTPS
    cookieMaxAge: 8 * 60 * 60 * 1000, // ms -> 8 hours
    secret: "Node Example App",
    saltLength: 16,
    dbURI: "mongodb://NodeJS:Node3xamp!eApp@office-pc:27017/NodeDB",
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
        sendEmail: false,
        emailTo: "error-address@outlook.com",
        emailSubject: "Node Example App: An Error Has Occurred!"
    },
    angularJSScripts:
    "<script src='/javascript/angular/angular.js'></script>\n\
    <script src='/javascript/angular/angular-route.js'></script>\n\
    <script src='/javascript/angular/angular-cookies.js'></script>"
};

// override the email server with environment variable information
// allows for personalized information security
if (process.env.NODE_EMAIL_SERVER) {
    module.exports.email.server = JSON.parse(process.env.NODE_EMAIL_SERVER);
}