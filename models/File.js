"use strict";

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
    bytes: Buffer,
    size: Number,
    type: String,
    name: String,
    ownerUserId: String
}, {
    timestamps: true
});

module.exports = mongoose.model("files", schema);