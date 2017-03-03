'use strict';

//User Model
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    type: String,
    facebook_id: String,
    google_id: String,
    paid: Boolean,
    rating: Number,
    total_checkin: Number,
    user_location: Array,
    phone: String,
    address: String,
    city: String,
    state: String,
    zip: Number,
    hours: String,
    businessTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessType'
    }
});

var model = mongoose.model('User', userSchema);

module.exports = model;