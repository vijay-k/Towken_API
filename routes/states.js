var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

//To retrieve us states list
//URL () => /api/v1/states/list
router.get('/list', function (req, res, next) {

    var States = req.Collection_States;

    States.find({}, function (error, record) {
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
            req.json_op_message = 'No states found.';
            next();
        }
    });
});

module.exports = router;
