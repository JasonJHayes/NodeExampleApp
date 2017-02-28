"use strict";

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
    userId: {
        type: String,
        uppercase: true,
        trim: true,
        required: true,
        minLength: 4, // validation does not seem to work?
        index: true,
        unique: true
    },
    fullname: String,
    pictureId: mongoose.Schema.Types.ObjectId
}, {
    timestamps: true
});

module.exports = mongoose.model("users", schema);