var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

//To retrieve us businesstypes list
//URL () => /v1/businesstypes/list
router.get('/list', function (req, res, next) {

    var BusinessTypes = req.Collection_BusinessTypes;

    BusinessTypes.find({}, function (error, record) {
        if (error) {
            req.json_op_status = 0;
            req.json_op_message = error;
            next();
        } else if (record.length > 0) {
            req.json_op_data = record;
            req.json_op_status = 1;
            req.json_op_message = 'Success';
            next();
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'No records found.';
            next();
        }
    });
});

module.exports = router;
