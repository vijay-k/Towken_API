module.exports = function () {

    //var seeder = require('mongoose-seeder');
    var mongoose = require('mongoose');
    var Collection_Users = require('../models/User.js');
    var Collection_Towkens = require('../models/Towken.js');
    var Collection_TowkenRatings = require('../models/TowkenRating.js');
    var Collection_TowkenRedeems = require('../models/TowkenRedeem.js');
    var Collection_TowkenPrices = require('../models/TowkenPrice.js');

    //Development    
    //mongoose.connect('mongodb://localhost:27017/Towkens');

    //Production    
    mongoose.connect('mongodb://vijayk:123456@ds161049.mlab.com:61049/towken');

    var db = mongoose.connection;

    db.on('error', function (err) {
        process.exit();
    });

    // var SchemaTypes = mongoose.Schema.Types;

    // var model_schema_stripeCharge = mongoose.Schema({
    //     user_id: {
    //         type: SchemaTypes.ObjectId,
    //         ref: 'users'
    //     },
    //     status: SchemaTypes.String,
    //     charge_id: SchemaTypes.String,
    //     amount: SchemaTypes.Number,
    //     paid: SchemaTypes.Boolean
    // });

    //This collection will hold all the stripe charges done by Businees Users 
    //while signin up for the app.
    //var CollectionModel_stripeCharges = db.model('stripeCharge', model_schema_stripeCharge)

    return function (req, res, next) {
        req.mongo = db;
        req.Collection_users = Collection_Users;
        req.Collection_Towkens = Collection_Towkens;
        req.Collection_tokenRatings = Collection_TowkenRatings;
        req.Collection_tokenRedeems = Collection_TowkenRedeems;
        req.Collection_TowkenPrices = Collection_TowkenPrices;
        next();
    };
};