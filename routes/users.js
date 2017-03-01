var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'exceltes@gmail.com', // my mail
        pass: 'java@123'
    }
}));

router.post('/register', function (req, res, next) {
    var UserModel = req.Collection_users;
    var fullName = req.body.fullname;
    var email = req.body.email;
    var password = req.body.password;
    var loginType = req.body.type;
    var facebookId = req.body.facebook_id;
    var googleId = req.body.google_id;
    if (password.length > 0) {
        var hash_password = crypto
            .createHash("md5")
            .update(password)
            .digest('hex');
    }
    if (fullName && email && loginType) {
        var add = 0;
        if (loginType.toLowerCase() == 'business') {
            if (password || facebookId || googleId) {
                add = 1;
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Few fields missing';
                next();
            }
        } else if (loginType.toLowerCase() == 'user') {
            if (password.length > 0 || facebookId || googleId) {
                add = 2;
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Few fields missing';
                next();
            }
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'loginType should be user or business';
            next();
        }
        if (add == 1) {
            UserModel.findOne({
                email: email
            }, function (error, record) {
                if (error) {
                    req.json_op_status = 0;
                    req.json_op_message = error;
                    next();
                } else if (!record || record.length == '0') {
                    var post = new UserModel({
                        fullname: fullName,
                        email: email,
                        password: hash_password,
                        type: loginType.toLowerCase(),
                        facebook_id: facebookId,
                        google_id: googleId,
                        paid: false
                    });
                    post.save(function (err, result) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            var token = jwt.sign(result, 'towken');
                            req.json_op_data = token;
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'User already registered';
                    next();
                }
            });
        } else if (add == 2) {
            UserModel.findOne({
                email: email
            }, function (error, record) {
                if (error) {
                    req.json_op_status = 0;
                    req.json_op_message = error;
                    next();
                } else if (!record || record.length == '0') {
                    var post = new UserModel({
                        fullname: fullName,
                        email: email,
                        password: hash_password,
                        type: loginType.toLowerCase(),
                        facebook_id: facebookId,
                        google_id: googleId,
                        total_checkin: 0
                    });
                    post.save(function (err, result) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            var token = jwt.sign(result, 'towken');
                            req.json_op_data = token;
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'User already registered';
                    next();
                }
            });
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Fill all fields.';
        next();
    }
});


//Business signup 
// api/v1/customer/signup/business
router.post('/signup/business', function (req, res, next) {

    var model = req.Collection_users;

    var address = req.body.address;
    var businessType = req.body.businessType;
    var city = req.body.city;
    var email = req.body.email;
    var hours = req.body.hours
    var businessName = req.body.name;
    var password = req.body.password;
    var phone = req.body.phone;
    var state = req.body.state;
    var userType = req.body.userType;
    var zip = req.body.zip;

    if (password.length > 0) {
        var hash_password = crypto
            .createHash("md5")
            .update(password)
            .digest('hex');
    }

    model.findOne({ email: email }, function (error, record) {

        //means for this email record doesn't exists   
        //save a new record
        if (record == null) {

            var post = new model({
                fullname: businessName,
                email: email,
                password: hash_password,
                type: userType.toLowerCase(),
                businessType: businessType,
                phone: phone,
                address: address,
                city: city,
                state: state,
                zip: zip,
                hours: hours
            });

            post.save(function (err, result) {

                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else {
                    var token = jwt.sign(result, 'towken');
                    req.json_op_data = token;
                    req.json_op_status = 1;
                    req.json_op_message = 'Success';
                    next();
                }
            });

        }
        else {
            req.json_op_status = 0;
            req.json_op_message = 'User already registered';
            next();
        }
    });
});

router.post('/login', function (req, res, next) {
    var UserModel = req.Collection_users;
    var email = req.body.email;
    var password = req.body.password;
    var facebookId = req.body.facebook_id;
    var googleId = req.body.google_id;
    var type = req.body.type.toLowerCase();
    if (password.length > 0) {
        var hash_password = crypto
            .createHash("md5")
            .update(password)
            .digest('hex');
    }
    var where;
    var count = 0;
    // if (email && password.length > 0) {
    //     where = {
    //         email: email,
    //         password: hash_password,
    //         type: type
    //     };
    // } else if (googleId) {
    //     where = {
    //         google_id: googleId,
    //         type: type
    //     };
    // } else if (facebookId) {
    //     where = {
    //         facebook_id: facebookId,
    //         type: type
    //     };
    // } else {
    //     req.json_op_status = 0;
    //     req.json_op_message = 'Not available required fields.'
    //     next();
    // }
    UserModel.findOne({
        email: email,
        type: type
    }, function (error, record) {
        if (error) {
            req.json_op_status = 0;
            req.json_op_message = error;
            next();
        } else if (record) {
            if (password.length > 0) {
                // if (record.password) {
                if (hash_password == record.password) {
                    count = 1;
                } else {
                    count = 0;
                }
                // } 
                // else {
                //     UserModel.find({
                //         email: email
                //     }, function(err, docs) {
                //         if (!err) {
                //             if (docs.length > 0) {
                //                 var row = docs[0];
                //                 UserModel.update({
                //                     email: row.get('email')
                //                 }, {
                //                     $set: {
                //                         password: hash_password
                //                     }
                //                 }, function(err) {
                //                     if (!err) {
                //                         console.log('Update Done');
                //                         count = 1;
                //                     }
                //                 });
                //             }
                //         }
                //     });
                // }
            } else if (facebookId) {
                if (record.facebook_id) {
                    if (facebookId == record.facebook_id) {
                        count = 1;
                    } else {
                        count = 0;
                    }
                } else {
                    UserModel.find({
                        email: email
                    }, function (err, docs) {
                        if (!err) {
                            if (docs.length > 0) {
                                var row = docs[0];
                                UserModel.update({
                                    email: row.get('email')
                                }, {
                                        $set: {
                                            facebook_id: facebookId
                                        }
                                    }, function (err) {
                                        if (!err) {
                                            console.log('Update Done');
                                            count = 1;
                                        }
                                    });
                            }
                        }
                    });
                }
            } else if (googleId) {
                if (record.google_id) {
                    if (googleId == record.google_id) {
                        count = 1;
                    } else {
                        count = 0;
                    }
                } else {
                    UserModel.find({
                        email: email
                    }, function (err, docs) {
                        if (!err) {
                            if (docs.length > 0) {
                                var row = docs[0];
                                UserModel.update({
                                    email: row.get('email')
                                }, {
                                        $set: {
                                            google_id: googleId
                                        }
                                    }, function (err) {
                                        if (!err) {
                                            console.log('Update Done');
                                            count = 1;
                                        }
                                    });
                            }
                        }
                    });
                }
            }

            if (count == 1) {
                if (record.type == 'business') {
                    if (record.paid) {
                        var paid = true;
                    } else {
                        paid = false;
                    }
                    var name = record.fullname;
                    var token = jwt.sign(record, 'towken');
                    req.json_op_data = {
                        token: token,
                        name: name,
                        paid: paid,
                        businessType: record.businessType
                    };
                    req.json_op_status = 1;
                    req.json_op_message = 'Success';
                    next();
                } else {
                    var name = record.fullname;
                    var token = jwt.sign(record, 'towken');
                    req.json_op_data = {
                        token: token,
                        name: name
                    };
                    req.json_op_status = 1;
                    req.json_op_message = 'Success';
                    next();
                }
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Failure';
                next();
            }
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'No record found.';
            next();
        }
    });
});

router.get('/list', function (req, res, next) {

    var UserModel = req.Collection_users;
    UserModel.find({
    }, function (error, record) {
        if (error) {
            req.json_op_status = 0;
            req.json_op_message = error;
            next();
        } else if (record.length > 0) {
            req.json_op_data = record;
            req.json_op_status = 1;
            req.json_op_message = 'Success';
            next();
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Record not found';
            next();
        }
    });
});

router.post('/profile', function (req, res, next) {
    var UserModel = req.Collection_users;
    var firstName = req.body.firstname;
    var lastName = req.body.lastname;
    var userId = req.json_op_userId._id;
    var where;
    if (userId) {
        if (firstName && lastName) {
            where = {
                _id: userId
            }
            UserModel.findOne(where, function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    UserModel.update(where, {
                        $set: {
                            firstname: firstName,
                            lastname: lastName
                        }
                    }, function (err) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all required fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User';
        next();
    }
});

router.post('/password', function (req, res, next) {
    var UserModel = req.Collection_users;
    var password = req.body.password;
    var userId = req.json_op_userId._id;
    var where;
    if (userId) {
        if (password) {
            where = {
                _id: userId
            }
            UserModel.findOne(where, function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    UserModel.update(where, {
                        $set: {
                            password: crypto
                                .createHash("md5")
                                .update(password)
                                .digest('hex')
                        }
                    }, function (err) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all required fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/forgot_password', function (req, res, next) {
    var UserModel = req.Collection_users;
    var userId = req.body.email;
    var password = Math.round(Math.random() * 1000000).toString();
    var myPassword = crypto
        .createHash("md5")
        .update(password)
        .digest('hex');
    var where;
    if (userId) {
        if (myPassword) {
            where = {
                email: userId
            }
            UserModel.findOne(where, function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    UserModel.update(where, {
                        $set: {
                            password: myPassword
                        }
                    }, function (err) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            // setup e-mail data with unicode symbols
                            var mailOptions = {
                                from: 'exceltes@gmail.com', // sender address
                                to: userId, // list of receivers
                                subject: 'New Password', // Subject line
                                html: '<b>Password: ' + password + '</b>' // html body
                            };
                            // send mail with defined transport object
                            transporter.sendMail(mailOptions, function (error) {
                                if (error) {
                                    req.json_op_status = 0;
                                    req.json_op_message = error;
                                    next();
                                } else {
                                    console.log('mail sent');
                                    req.json_op_status = 1;
                                    req.json_op_message = 'Success';
                                    next();
                                }
                            });
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all required fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/paid', function (req, res, next) {
    var UserModel = req.Collection_users;
    var userId = req.json_op_userId._id;
    var loginType = req.body.type;
    var where;

    if (userId) {
        if (loginType.toLowerCase() == 'business') {
            where = {
                _id: userId
            }
            UserModel.find(where, function (error, data) {
                if (error) {
                    req.json_op_status = 0;
                    req.json_op_message = error;
                    next();
                } else if (data.length > 0) {
                    UserModel.update(where, {
                        $set: {
                            paid: true
                        }
                    }, function (err) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Its not business.';
            next();
        }

    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/checkIn', function (req, res, next) {
    var UserModel = req.Collection_users;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var userId = req.json_op_userId._id;
    var loginType = req.json_op_userId.type;
    var where = {};

    if (userId && loginType.toLowerCase() == 'user') {
        where = {
            _id: userId
        };
        UserModel.findOne(where, function (error, record) {
            if (error) {
                req.json_op_status = 0;
                req.json_op_message = error;
                next();
            } else if (record) {
                if (record.total_checkin) {
                    var myCheckin = record.total_checkin + 1;
                } else {
                    myCheckin = 1;
                }
                UserModel.update(where, {
                    $set: {
                        total_checkin: myCheckin,
                        user_location: [
                            latitude,
                            longitude
                        ]
                    }
                }, function (err) {
                    if (err) {
                        req.json_op_status = 0;
                        req.json_op_message = err;
                        next();
                    } else {
                        req.json_op_status = 1;
                        req.json_op_message = 'Success';
                        req.json_op_data = myCheckin;
                        next();
                    }
                });
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Invalid Request';
                next();
            }
        });
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User';
        next();
    }

});

module.exports = router;