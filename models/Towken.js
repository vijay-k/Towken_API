'use strict';

//Towken Model
var mongoose = require('mongoose');

var towkenSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    mile: Number,
    business_name: String,
    discount: Number,
    time_remaining: Number,
    latitude: Number,
    longitude: Number,
    Used: Boolean,
    geo_location: Array,
    start_time: String,
    views: Number,
    towken_details: String,
    type_of_towken: String,
    towken_quantity: Number
});

var model = mongoose.model('Towken', towkenSchema);

module.exports = model;