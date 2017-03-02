'use strict';

var mongoose = require('mongoose');

var StatesSchema = mongoose.Schema({
    stateId: { type: mongoose.Schema.Types.ObjectId },
    stateName: { type: mongoose.Schema.Types.String, required: true },
    stateAbvr: { type: mongoose.Schema.Types.String, required: true },
});

var model = mongoose.model('State', StatesSchema);

module.exports = model;