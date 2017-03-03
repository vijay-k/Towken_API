'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema({
    businessTypeId: { type: mongoose.Schema.Types.ObjectId },
    businessName: { type: mongoose.Schema.Types.String, required: true },
    imageBase64: { type: mongoose.Schema.Types.String, required: true }
});

var model = mongoose.model('BusinessType', Schema);

module.exports = model;