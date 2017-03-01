// get an instance of the router for api routes
var express = require('express');
var jwt = require('jsonwebtoken');

// route middleware to decode a token
module.exports = function(req, res, next) {
    if (typeof req.query.access_token != 'undefined') {
        var token = req.query.access_token;
        if (token) {
            var decoded = jwt.decode(token, 'towken');
            if (decoded) {
                req.json_op_userId = decoded._doc;
            }
        }
    }
    next();
}