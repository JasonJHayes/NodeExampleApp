"use strict";

// these types of tests are bad, but sometimes there is nothing else that can be done
var browserIsIE = navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident") !== -1;

// general JavaScript error handling
if (window.addEventListener)
    window.addEventListener("error", passErrorToServer, true);
else if (window.attachEvent)
    window.attachEvent("error", passErrorToServer);
else window.onerror = passErrorToServer;

// global function to call to process an error on the server
function passErrorToServer(message, source, lineno, colno, error) {
    // if the error is passed as an object
    // parse the error information
    if (message instanceof Event) {
        var ev = message;
        // if no message or filename is present and the event has a target
        // assuming that the link or script tag cannot find the requested file
        message = ev.message || (ev.target ? MSG_404_ERROR : "");
        source = ev.filename || (ev.target ? ev.target.outerHTML : "");
        lineno = ev.lineno;
        colno = ev.colno;
        error = ev.error;
    } else if (message.message) {
        error = message;
        message = error.message;
        source = error.source || source || "";
        lineno = error.lineno;
        colno = error.colno;
    }
    // IE does not display the stack trace for errors, output it here for easier debugging
    if (browserIsIE && error && error.stack) console.error(error.stack);
    // call to the server to handle the error
    var http = new XMLHttpRequest();
    http.open("POST", "/500", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var data = "message=" + encodeURIComponent(message);
    data += "&source=" + encodeURIComponent(source);
    data += "&lineno=" + encodeURIComponent(lineno);
    data += "&colno=" + encodeURIComponent(colno);
    if (error && error.stack) data += "&stack=" + encodeURIComponent(error.stack);
    if (error && error.status) {
        data += "&status=" + encodeURIComponent(error.status);
        data += "&statusUrl=" + encodeURIComponent(window.location);
    }
    http.send(data);
}