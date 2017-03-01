'use strict';

var TowkenPrice = require('./models/TowkenPrice.js');

var towkenPrices = [
    {
        "price": 9.95,
        "currency": "USD",
        "currencySymbol": "$"
    }
];

//Get all the data and check if data is less
TowkenPrice.find().then(function (data) {

    if (data.length < towkenPrices.length) {

        towkenPrices.forEach(function (data, index) {

            var towken = new TowkenPrice({
                price: data.price,
                currency: data.currency,
                currencySymbol: data.currencySymbol
            });

            towken.save();
        })
    }
});