'use strict';

//TowkenRating Model
var mongoose = require('mongoose');

var towkenRatingSchema = mongoose.Schema({
    towken_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Towken'
    },
    rating: Number,
    comment: String,
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    business_id: {
        type: mongoose.Schema.Types.ObjectId
    }
});

var model = mongoose.model('TokenRating', towkenRatingSchema);

module.exports = model;