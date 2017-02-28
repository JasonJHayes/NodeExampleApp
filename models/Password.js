"use strict";

var mongoose = require("mongoose");

var schema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 4
    }
}, {
    // index reveals information about insertion time, which
    // can be used to match up with user information
    // it is likely still possible to match information by using
    // the natural order of the user, password and salt collections
    autoIndex: false
});

module.exports = mongoose.model("passwords", schema);