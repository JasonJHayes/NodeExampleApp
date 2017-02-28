"use strict";

var crypto = require("crypto"); // https://nodejs.org/api/crypto.html

// https://code.ciphertrick.com/2016/01/18/salt-hash-passwords-using-nodejs-crypto/

/**
 * generates a random string of characters, i.e salt
 * @param {number} length - length of the random string
 * @returns {string} random string of characters
 */
module.exports.genRandomString = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
};

/**
 * hash string with sha512
 * @param {string} string - string to hash
 * @param {string} salt - salt to combine with string
 * @returns {Object} { hash, salt }
 */
module.exports.hashSha512 = function (string, salt) {
    var hash = crypto.createHmac("sha512", salt);
    hash.update(string);
    return {
        hash: hash.digest("hex"),
        salt: salt
    };
};