
//This file will be need to run manually through node js
//To seed the Towken Prices into the initial databases
var TowkenPriceModel = require('../models/TowkenPrice');

var mongoose = require('mongoose');

//database connection string
mongoose.connect('mongodb://vijayk:123456@ds161049.mlab.com:61049/towken');

var towkenPrices = [
    new TowkenPriceModel({
        price: 9.95,
        currency: "USD",
        currencySymbol: '$'
    })
];

var done = 0;

for (var i = 0; i < towkenPrices.length; i++) {
    towkenPrices[i].save(function (err, result) {
        done++;
        if (done === towkenPrices.length) {
            exit();
        }
    });
}

function exit() {
    mongoose.disconnect();
}


