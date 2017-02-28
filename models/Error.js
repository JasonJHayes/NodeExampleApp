"use strict";

var mongoose = require("mongoose");

// collection must be created manually in MongoDB to support capped
// db.createCollection("errors", { capped: true, size: 1048576 })
var schema = new mongoose.Schema({
    error: String,
    extraInfo: mongoose.Schema.Types.Mixed
}, {
    timestamps: true,
    capped: 1048576
});

module.exports = mongoose.model("errors", schema);