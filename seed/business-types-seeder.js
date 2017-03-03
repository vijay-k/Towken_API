
//This file will be need to run manually through node js
//To seed the Towken Prices into the initial databases
var Model = require('../models/BusinessTypes');
var CONSTANTS = require('../constants.js');
var mongoose = require('mongoose');

mongoose.connect(CONSTANTS.DATABASE_CONNECTION_STRING);

mongoose.connection.collections['businesstypes'].drop(function (err) {
    console.log('dropping existing collection.');
    console.log('creating new one...');
});

var types = [
    new Model({
        businessName: 'Automotive'
    }),
    new Model({
        businessName: 'Beauty & Spas'
    }),
    new Model({
        businessName: 'Entertainment'
    }),
    new Model({
        businessName: 'Fitness'
    }),
    new Model({
        businessName: 'Food & Drink'
    }),
    new Model({
        businessName: 'Retail'
    }),
    new Model({
        businessName: 'Other'
    })
];

var done = 0;

for (var i = 0; i < types.length; i++) {
    types[i].save(function (err, result) {
        done++;
        if (done === types.length) {
            console.log(types.length + ' business types created.');
            exit();
        }
    });
}

function exit() {
    mongoose.disconnect();
}


