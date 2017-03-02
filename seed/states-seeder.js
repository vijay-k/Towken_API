//This file will be need to run manually through node js
//To seed the Towken Prices into the initial databases
var StatesModel = require('../models/States');
var CONSTANTS = require('../constants.js');

var fs = require('fs');
var mongoose = require('mongoose');
var csv = require('fast-csv');

//connect to database
mongoose.connect(CONSTANTS.DATABASE_CONNECTION_STRING);

var states = [];

fs.createReadStream('.././csv/us_states.csv', 'utf8')
    .pipe(csv())
    .on('data', function (data) { console.log(data); states.push(data[0]); })
    .on('end', function (resultsTotal, data) {
        var done = 0;
        for (var i = 0; i < states.length; i++) {
            var model = new StatesModel({ "stateName": states[i], "stateAbvr": states[i] });
            model.save(function (err, res) {
                done++;
                if (done === states.length) {
                    exit();
                }
            })
        }
    });

function exit() {
    mongoose.disconnect();
    states = [];
}