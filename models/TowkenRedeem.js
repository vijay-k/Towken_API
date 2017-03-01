'use strict';

//TowkenRedeem Model
var mongoose = require('mongoose');

var towkenRedeemSchema = mongoose.Schema({
    towken_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Towken'
    },
    redeem_code: String,
    used: String,
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

var model = mongoose.model('TowkenRedeem', towkenRedeemSchema);

module.exports = model;
