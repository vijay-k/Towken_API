var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var CONSTANTS = require('../constants.js');
var stripe = require("stripe")(CONSTANTS.STRIPE_API_KEY);
stripe.setTimeout(CONSTANTS.STRIPE_TIMEOUT);
stripe.setApiVersion(CONSTANTS.STRIPE_API_DATED_VERSION);

//To handle error response
function errorResponseHandler(request, error, next) {

    request.json_op_data = null;

    request.json_op_status = 0;

    //someone has specified error message
    if (typeof (error) === 'string') {
        request.json_op_message = error;
    }
    else {
        request.json_op_message = error.raw;
    }

    next();
};

//To handle success response
function successResponseHandler(request, type, next, message = 'Success') {
    request.json_op_data = type;
    request.json_op_status = 1;
    request.json_op_message = message;
    next();
};

//To retrieve a single coupon using couponId
//URL () => /v1/stripe/coupons/retrieve/FREE
router.get('/coupons/retrieve/:couponId', function (req, res, next) {

    var couponId = req.params.couponId.toUpperCase();

    if (couponId === null || couponId === '' || couponId === undefined) {
        errorResponseHandler(req, 'CouponId not found in the request.', next);
        return;
    }

    stripe.coupons.retrieve(couponId, function (err, coupon) {
        if (coupon !== null) {
            successResponseHandler(req, { 'coupon': coupon }, next);
        }
        else if (err !== null) {
            err.raw.message = 'Sorry this coupon code isn\'t valid.';
            errorResponseHandler(req, err, next);
        }
    });
});


//Create a new customer on stripe using email
//URL () => /v1/stripe/customer/create
router.post('/customer/create', function (req, res, next) {

    var email = req.body.email;

    if (email === null || email === '' || email === undefined) {
        errorResponseHandler(req, 'Email not found in body parameters.', next);
        return;
    }

    stripe.customers.create({ email: email }, function (error, customer) {
        if (error !== null) {
            errorResponseHandler(req, error, next);
        }
        else {
            successResponseHandler(req, { 'customer': customer }, next, 'Customer with email ' + customer.email + ' created successfully.');
        }
    });
});

//Since we are not creating profiles on stripe so we need to create a token first
//Need to get a stripe token based on credit card details
router.post('/token/createToken', function (req, res, next) {

    var type = req.body.type; //represent the type of the payment method

    var card = null, bankAccount = null;

    if (type === CONSTANTS.STRIPE_PAYMENT_METHOD_TYPES.Card.toLowerCase()) {
        card = {
            'number': req.body.cardNumber,
            'exp_month': req.body.expMonth,
            'exp_year': req.body.expYear,
            'cvc': req.body.cvc
        };
        stripe.tokens.create({ card: card }, function (err, token) {
            if (err !== null) {
                errorResponseHandler(req, err, next);
            }
            else {
                successResponseHandler(req, { 'token': token }, next);
            }
        });
    }
    else if (type === CONSTANTS.STRIPE_PAYMENT_METHOD_TYPES.BankAccount.toLowerCase()) {
        bankAccount = {
            currency: CONSTANTS.STRIPE_DEFAULT_CURRENCY_MODE,
            country: req.body.country,
            account_holder_name: req.body.accountHolderName,
            account_holder_type: req.body.accountHolderType,
            routing_number: req.body.routingNumber,
            account_number: req.body.accountNumber
        };
        stripe.tokens.create({ bank_account: bankAccount }, function (err, token) {
            if (err !== null) {
                errorResponseHandler(req, err, next);
            }
            else {
                successResponseHandler(req, { 'token': token }, next);
            }
        });
    }
    else {
        errorResponseHandler(req, 'Invalid Payment Method Type. Possible Types are Card/BankAccount', next);
    }
});


//Create a stripe charge based on the token received
router.post('/charge/create', function (req, res, next) {

    //var dbStripeCharges = req.CollectionModel_StripeCharges;
    var amount = req.body.amount;
    var token = req.body.token;
    var description = req.body.description;

    stripe.charges.create({
        amount: amount,
        currency: CONSTANTS.STRIPE_DEFAULT_CURRENCY_MODE,
        source: token,    // obtained with createToken stripe service
        description: description
    }, function (err, charge) {

        if (err !== null) {
            errorResponseHandler(req, err, next);
        }
        else {
            successResponseHandler(req, { 'charge': charge }, next);
        }
    });
});

module.exports = router;