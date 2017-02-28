"use strict";

function saveToDb(err, req) {
    if (server.settings.error.saveToDb) {
        var error = err.stack || err.message || err;
        var dbError = new server.models.Error({
            error: error,
            extraInfo: err.status ?
                err.statusUrl : // request error
                err.errors // mongoose validation error
        });
        dbError.save(function (err) {
            if (err) console.log(ts(), "ERROR", "error logging to database", err);
        });
        return dbError.id;
    }
}
module.exports.saveToDb = saveToDb;

function sendEmail(err, req, dbId, forceEmail) {
    if (server.settings.error.sendEmail || forceEmail) {
        if (!server.settings.email.from || !server.settings.error.emailTo) {
            console.log(ts(), "WARN", "email not sent, message requires from and to");
        } else { // setup the email information
            var source = err.source ? err.source.replace(/</g, "&lt;").replace(/>/, "&gt;") : "";
            var time = new Date().toString();
            var url = (req ? req.get("origin") : "") || source || (req ? req.get("host") + req.originalUrl : "");
            var referrer = req ? req.get("referrer") || "" : ""; // standard is misspelled
            var browser = req ? req.get("user-agent") : "";
            var user = req && req.session && req.session.userToken ? req.session.userToken.userId : "";
            var ipAddress = req && req.ip ? "<a href='https://www.browserleaks.com/whois/" + req.ip + "'>" + req.ip + "</a>" : "";
            var exceptionType = err.status ? "Request Error" : "JavaScript Error";
            var message = (err.message || err).replace(/ /g, "&nbsp;").replace(/\n/g, "<br />");
            source = source ? source + " at line " + err.lineno + " col " + err.colno : "";
            var stack = (source ? source + "<br />" : "") + (err.stack ? err.stack.replace(/ /g, "&nbsp;").replace(/\n/g, "<br />") : "");
            var validationErrors = "";
            if (err.errors) { // mongoose validation errors
                validationErrors += "<tr><td style='text-align:right;font-weight:bold;white-space:nowrap'>Validators</td><td>";
                for (var key in err.errors) validationErrors += err.errors[key] + "<br />";
                validationErrors += "</td></tr>";
            }
            // send the message
            server.email.send({
                from: server.settings.email.from,
                to: server.settings.error.emailTo,
                subject: server.settings.error.emailSubject,
                text: err.stack || err.message || err,
                attachment: [{
                    data:
"<html>\n\
<body>\n\
    <table cellpadding='5' cellspacing='0' border='1'>\n\
    <tr>\n\
        <td style='text-align:right;font-weight:bold;white-space:nowrap'>Time</td>\n\
            <td>" + time + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>URL</td>\n\
            <td>" + url + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Referrer</td>\n\
            <td>" + referrer + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Browser</td>\n\
            <td>" + browser + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>User</td>\n\
            <td>" + user + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>IP Address</td>\n\
            <td>" + ipAddress + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Database ID</td>\n\
            <td>" + dbId + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Exception Type</td>\n\
            <td>" + exceptionType + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Message</td>\n\
            <td>" + message + "</td>\n\
        </tr>\n\
        <tr>\n\
            <td style='text-align:right;font-weight:bold;white-space:nowrap'>Stack Trace</td>\n\
            <td>" + stack + "</td>\n\
        </tr>" +
        validationErrors + "\n\
    </table>\n\
</body>\n\
</html>",
                    type: "text/html",
                    name: "error.html",
                    alternative: true
                }]
            }, function (err) {
                if (err) console.log(ts(), "ERROR", "error sending email", err);
            });
        }
    }
}
module.exports.sendEmail = sendEmail;

module.exports.processError = function (err, req, forceEmail) {
    // log to console
    console.log(ts(), "ERROR", err.stack || err.message || err);
    if (err.status) console.log(ts(), "ERROR", err.statusUrl); // request error
    if (err.errors) console.log(ts(), "ERROR", err.errors); // mongoose validation error
    try { // log to database
        var dbId = saveToDb(err, req);
    } catch (ex) {
        console.log(ts(), "ERROR", "error saving to database", ex);
    }
    try { // send email
        sendEmail(err, req, dbId, forceEmail);
    } catch (ex) {
        console.log(ts(), "ERROR", "error sending email", ex);
    }
};