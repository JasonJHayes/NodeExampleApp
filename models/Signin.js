"use strict";

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
    userId: {
        type: String,
        index: true
    },
    sessionId: {
        type: String,
        index: true
    },
    ipAddress: String,
    signinSource: String,
    headers: mongoose.Schema.Types.Mixed,
    success: {
        type: Boolean,
        default: false
    },
    signoutSource: String
}, {
    timestamps: true
});

module.exports = mongoose.model("signins", schema);