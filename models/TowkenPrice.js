'use strict';

//TowkenPrice Model
var mongoose = require('mongoose');

var towkenPriceSchema = mongoose.Schema({
    towken_price_id: { type: mongoose.Schema.Types.ObjectId },
    price: { type: mongoose.Schema.Types.Number, required: true },
    currency: { type: mongoose.Schema.Types.String, required: true },
    currencySymbol: { type: mongoose.Schema.Types.String, require: true }
});

var model = mongoose.model('TowkenPrice', towkenPriceSchema);

module.exports = model;