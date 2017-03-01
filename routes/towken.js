var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');
var Grid = require('gridfs-stream');
var path = require('path');
var multer = require('multer');
var voucher_codes = require('voucher-code-generator');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({
    storage: storage
});


router.get('/towkencost', function (req, res, next) {

    var tokenPrices = req.Collection_TowkenPrices;

    tokenPrices.find(function (error, data) {
        if (error) {
            req.json_op_status = 0;
            req.succeeded = false;
            req.json_op_message = error;
            req.json_op_data = null;
            next();
        }
        else {
            req.json_op_status = 1;
            req.succeeded = true;
            req.json_op_message = 'Success';
            req.json_op_data = data;
            next();
        }
    })
});


router.post('/create', function (req, res, next) {
    var TowkenModel = req.Collection_Towkens;

    var mile = req.body.mile;
    var businessName = req.body.business_name;
    var discount = req.body.discount;
    var timeRemaining = req.body.time_remaining;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;
    var startTime = req.body.start_time;

    var towkenDetails = req.body.towken_details;
    var towkenType = req.body.type_of_towken;
    var towkenQuantity = req.body.towken_quantity;

    if (userId && type.toLowerCase() == 'business') {

        if (businessName && timeRemaining && mile && discount
            && latitude && longitude && towkenDetails && towkenType && startTime) {

            TowkenModel.find({}, function (error, record) {
                if (error) {
                    req.json_op_status = 0;
                    req.json_op_message = error;
                    next();
                } else {
                    var post = new TowkenModel({
                        user_id: userId,
                        business_name: businessName,
                        time_remaining: timeRemaining,
                        mile: mile,
                        discount: discount,
                        Used: false,
                        geo_location: [
                            latitude,
                            longitude
                        ],
                        start_time: startTime,
                        views: 0,
                        towken_details: towkenDetails,
                        type_of_towken: towkenType,
                        towken_quantity: towkenQuantity
                    });

                    post.save(function (myErr, result) {
                        if (myErr) {
                            req.json_op_status = 0;
                            req.json_op_message = myErr;
                            next();
                        } else {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            next();
                        }
                    });
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var userId = req.json_op_userId._id;
    var CurrentDate = moment().unix();

    if (userId) {
        TowkenModel.find({
            Used: false
        }).populate('user_id').exec(function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {
                var myData = [];
                _(data).forEach(function (value, index) {
                    var timeRemain = value.time_remaining;
                    var laterToken = value.token_later;
                    laterToken = parseInt(laterToken);
                    if (laterToken) {
                        if (CurrentDate < timeRemain && CurrentDate > laterToken) {
                            myData.push(value);
                        }
                    } else {
                        if (CurrentDate < timeRemain) {
                            myData.push(value);
                        }
                    }
                    if (index == data.length - 1) {
                        if (myData.length > 0) {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = myData;
                            next();
                        } else {
                            req.json_op_status = 0;
                            req.json_op_message = 'Record not found';
                            next();
                        }
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
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var where, users_withn_distance = 50;
    var CurrentDate = moment().unix();
    var myData = [];

    where = {};
    if (userId) {
        if (latitude && longitude) {
            if (typeof latitude != 'undefined' && typeof longitude != 'undefined') {
                where.geo_location = {
                    $geoWithin: {
                        $centerSphere: [
                            [latitude, longitude], users_withn_distance / 3963.2
                        ]
                    }
                };
            }
            where.Used = false;
            where.time_remaining = {
                $gt: CurrentDate
            };
            TowkenModel.find(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data.length > 0) {
                    _(data).forEach(function (value, index) {
                        //                        var timeRemain = value.time_remaining;
                        var view = value.views;
                        newView = view + 1;
                        var id = value._id;
                        var distance = value.mile;
                        var Dlatitude = value.geo_location[0];
                        var Dlongitude = value.geo_location[1];

                        var radlat1 = Math.PI * Dlatitude / 180;
                        var radlat2 = Math.PI * latitude / 180;
                        var theta = Dlongitude - longitude;
                        var radtheta = Math.PI * theta / 180;
                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                        dist = Math.acos(dist);
                        dist = dist * 180 / Math.PI;
                        dist = dist * 60 * 1.1515;
                        dist = dist * 0.8684;

                        //                        var R = 6371e3; // metres
                        //                        var lat1Rad = Dlatitude * Math.PI / 180;
                        //                        var lat2Rad = latitude * Math.PI / 180;
                        //                        var latTheta = (latitude - Dlatitude) * Math.PI / 180;
                        //                        var longTheta = (longitude - Dlongitude) * Math.PI / 180;
                        //                        var a = Math.sin(latTheta / 2) * Math.sin(latTheta / 2) +
                        //                                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                        //                                Math.sin(longTheta / 2) * Math.sin(longTheta / 2);
                        //                        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        //                        var dist = R * c;
                        //                        dist = dist * 0.62137119;
                        if (dist <= distance) {
                            // myData.push({allDetail: value, Distance: dist});
                            // myData.push(value);
                            myData.push({
                                _id: value._id,
                                Distance: dist,
                                geo_location: value.geo_location,
                                type_of_token: value.type_of_token,
                                token_details: value.token_details,
                                views: value.views,
                                start_time: value.start_time,
                                Used: value.Used,
                                discount: value.discount,
                                mile: value.mile,
                                time_remaining: value.time_remaining,
                                business_name: value.business_name,
                                user_id: value.user_id,
                                token_quantity: value.token_quantity
                            });
                            TowkenModel.update({
                                _id: id
                            }, {
                                    $set: {
                                        views: newView
                                    }
                                },
                                function (myErr) {
                                    if (myErr) {
                                        req.json_op_status = 0;
                                        req.json_op_message = myErr;
                                    }
                                    //                                        else {
                                    //                                            req.json_op_status = 1;
                                    //                                            req.json_op_message = 'Success';
                                    //                                            // req.json_op_data = data;
                                    //                                        }
                                });
                        }

                        if (index == data.length - 1) {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = myData;
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/select/:token_id/', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var TowkenRedeemModel = req.Collection_tokenRedeem;
    var tokenId = req.params.token_id;
    var userId = req.json_op_userId._id;
    var where;
    var redeemCode = [];

    if (userId) {
        if (tokenId) {
            where = {
                _id: tokenId
            };
            TowkenModel.findOne(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    var tokQuanity = data.token_quantity;
                    redeemCode = voucher_codes.generate({
                        length: 15
                    });
                    var code = new TowkenRedeemModel({
                        user_id: userId,
                        redeem_code: redeemCode,
                        token_id: tokenId,
                        used: false
                    });
                    code.save(function (error) {
                        if (error) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            if (tokQuanity > 0) {
                                if (tokQuanity == 1) {
                                    TowkenModel.update(where, {
                                        $set: {
                                            Used: true,
                                            token_quantity: tokQuanity - 1
                                        }
                                    }, function (err) {
                                        if (err) {
                                            req.json_op_status = 0;
                                            req.json_op_message = err;
                                            next();
                                        } else {
                                            req.json_op_status = 1;
                                            req.json_op_message = 'Success';
                                            req.json_op_data = redeemCode;
                                            next();
                                        }
                                    });
                                } else {
                                    TowkenModel.update(where, {
                                        $set: {
                                            token_quantity: tokQuanity - 1
                                        }
                                    }, function (err) {
                                        if (err) {
                                            req.json_op_status = 0;
                                            req.json_op_message = err;
                                            next();
                                        } else {
                                            req.json_op_status = 1;
                                            req.json_op_message = 'Success';
                                            req.json_op_data = redeemCode;
                                            next();
                                        }
                                    });
                                }
                            }
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
            req.json_op_message = 'Missing few fields';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/used/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var where;
    var myData = [];

    if (userId) {
        where = {
            Used: true
        }
        TowkenModel.find(where).populate('user_id').exec(function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {
                _(data).forEach(function (value, index) {
                    var id = value._id;
                    var Dlatitude = value.geo_location[0];
                    var Dlongitude = value.geo_location[1];
                    var radlat1 = Math.PI * Dlatitude / 180;
                    var radlat2 = Math.PI * latitude / 180;
                    var theta = Dlongitude - longitude;
                    var radtheta = Math.PI * theta / 180;
                    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                    dist = Math.acos(dist);
                    dist = dist * 180 / Math.PI;
                    dist = dist * 60 * 1.1515;
                    dist = dist * 0.8684;
                    myData.push({
                        _id: value._id,
                        Distance: dist,
                        geo_location: value.geo_location,
                        type_of_token: value.type_of_token,
                        token_details: value.token_details,
                        views: value.views,
                        start_time: value.start_time,
                        Used: value.Used,
                        discount: value.discount,
                        mile: value.mile,
                        time_remaining: value.time_remaining,
                        business_name: value.business_name,
                        user_id: value.user_id,
                        token_quantity: value.token_quantity
                    });
                    if (index == data.length - 1) {
                        req.json_op_status = 1;
                        req.json_op_message = 'Success';
                        req.json_op_data = myData;
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
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/delete/:token_id/', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var tokenId = req.params.token_id;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;
    var where;

    if (userId && type.toLowerCase() == 'business') {
        if (tokenId) {
            where = {
                _id: tokenId
            }
            TowkenModel.findOne(where, function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    TowkenModel.remove(where, function (err) {
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
            req.json_op_message = 'Missing few fields';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/business/list', function (req, res, next) {
    var TowkenModel = req.Collection_Towkens;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;
    var CurrentDate = moment().unix();

    if (userId && type.toLowerCase() == 'business') {

        var result = TowkenModel.find({ user_id: userId }).then(function (data, err) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {

                var myData = [];

                _(data).forEach(function (value, index) {
                    var timeRemain = value.time_remaining;
                    if (CurrentDate < timeRemain) {
                        myData.push(value);
                    }
                    if (index == data.length - 1) {
                        if (myData.length > 0) {
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = myData;
                            next();
                        } else {
                            req.json_op_status = 0;
                            req.json_op_message = 'Record not found';
                            next();
                        }
                    }
                });
            }
            else {
                req.json_op_status = 0;
                req.json_op_message = 'Record not found';
                next();
            }
        });
    }
});

router.all('/upload', upload.single('file'), function (req, res, next) {
    var dirname = require('path').dirname(__dirname);
    var filename = req.file.filename;
    var path = req.file.path;
    var type = req.file.mimetype;

    var read_stream = fs.createReadStream(dirname + '/' + path);

    var conn = req.mongo;
    Grid.mongo = mongoose.mongo;
    var gfs = Grid(conn.db);
    var writestream = gfs.createWriteStream({
        filename: filename
    });
    read_stream.pipe(writestream);
    req.json_op_status = 1;
    req.json_op_message = 'Success';
    next();
});

router.get('/showCustomer', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;

    if (userId && type.toLowerCase() == 'business') {
        TowkenModel.find({
            user_id: userId,
            Used: true
        }).populate('user_id').exec(function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {
                req.json_op_status = 1;
                req.json_op_message = 'Success';
                req.json_op_data = data;
                next();
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Record not found';
                next();
            }
        });
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/rating', function (req, res, next) {
    var TowkenRatingModel = req.Collection_tokenRating;
    var UserModel = req.Collection_users;
    var TowkenModel = req.Collection_token;
    var tokenId = req.body.token_id;
    var userId = req.json_op_userId._id;
    var givenRating = req.body.rating;
    var givenComment = req.body.comment;

    if (userId) {
        if (tokenId) {
            TowkenModel.findOne({
                _id: tokenId
            }, function (error, result) {
                if (error) {
                    req.json_op_status = 0;
                    req.json_op_message = error;
                    next();
                } else if (result) {
                    var businessId = result.user_id;
                    TowkenRatingModel.find({}, function (err) {
                        if (err) {
                            req.json_op_status = 0;
                            req.json_op_message = err;
                            next();
                        } else {
                            var new_post = new TowkenRatingModel({
                                token_id: tokenId,
                                user_id: userId,
                                rating: givenRating,
                                comment: givenComment,
                                business_id: businessId
                            });
                            new_post.save(function (err) {
                                if (err) {
                                    req.json_op_status = 0;
                                    req.json_op_message = err;
                                    next();
                                } else {
                                    TowkenRatingModel.find({
                                        business_id: businessId
                                    }, function (myErr, myResult) {
                                        var totalRating = 0;
                                        _(myResult).forEach(function (value, index) {
                                            var rating = value.rating;
                                            totalRating = totalRating + rating;
                                            if (index == myResult.length - 1) {
                                                var avgRating = totalRating / myResult.length;
                                                UserModel.findOne({
                                                    _id: businessId
                                                }, function (error, res) {
                                                    if (error) {
                                                        req.json_op_status = 0;
                                                        req.json_op_message = error;
                                                        next();
                                                    } else {
                                                        UserModel.update({
                                                            _id: businessId
                                                        }, {
                                                                $set: {
                                                                    rating: avgRating
                                                                }
                                                            },
                                                            function (err1) {
                                                                if (err1) {
                                                                    req.json_op_status = 0;
                                                                    req.json_op_message = err1;
                                                                } else {
                                                                    req.json_op_status = 1;
                                                                    req.json_op_message = 'Success';
                                                                    next();
                                                                }
                                                            });
                                                    }
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record Not found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Missing few fields';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list/:sortbyType/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var sortType = req.params.sortbyType;
    var where, users_withn_distance = 50;
    var CurrentDate = moment().unix();
    var myData = [];

    where = {}
    if (userId) {
        if (latitude && longitude) {
            if (typeof latitude != 'undefined' && typeof longitude != 'undefined') {
                where.geo_location = {
                    $geoWithin: {
                        $centerSphere: [
                            [latitude, longitude], users_withn_distance / 3963.2
                        ]
                    }
                };
            }
            where.Used = false;
            where.time_remaining = {
                $gt: CurrentDate
            };
            where.type_of_token = sortType;
            TowkenModel.find(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data.length > 0) {
                    _(data).forEach(function (value, index) {
                        var timeRemain = value.time_remaining
                        var view = value.views;
                        newView = view + 1;
                        var id = value._id;
                        var distance = value.mile;
                        var Dlatitude = value.geo_location[0];
                        var Dlongitude = value.geo_location[1];
                        var radlat1 = Math.PI * Dlatitude / 180;
                        var radlat2 = Math.PI * latitude / 180;
                        var theta = Dlongitude - longitude;
                        var radtheta = Math.PI * theta / 180;
                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                        dist = Math.acos(dist);
                        dist = dist * 180 / Math.PI;
                        dist = dist * 60 * 1.1515;
                        dist = dist * 0.8684;
                        if (dist <= distance) {
                            myData.push({
                                _id: value._id,
                                Distance: dist,
                                geo_location: value.geo_location,
                                type_of_token: value.type_of_token,
                                token_details: value.token_details,
                                views: value.views,
                                start_time: value.start_time,
                                Used: value.Used,
                                discount: value.discount,
                                mile: value.mile,
                                time_remaining: value.time_remaining,
                                business_name: value.business_name,
                                user_id: value.user_id,
                                token_quantity: value.token_quantity
                            });
                            // TowkenModel.update({
                            //         _id: id
                            //     }, {
                            //         $set: {
                            //             views: newView
                            //         }
                            //     },
                            //     function(myErr) {
                            //         if (myErr) {
                            //             req.json_op_status = 0;
                            //             req.json_op_message = myErr;
                            //         } else {
                            //             req.json_op_status = 1;
                            //             req.json_op_message = 'Success';
                            //         }
                            //     });
                        }
                        if (index == data.length - 1) {
                            var sortedData = _(myData).chain().sortBy(function (o) {
                                return o.type_of_token;
                            }).value();
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = sortedData;
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list/sortedbyDistance/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var where, users_withn_distance = 50;
    var CurrentDate = moment().unix();
    var myData = [];

    where = {}
    if (userId) {
        if (latitude && longitude) {
            if (typeof latitude != 'undefined' && typeof longitude != 'undefined') {
                where.geo_location = {
                    $geoWithin: {
                        $centerSphere: [
                            [latitude, longitude], users_withn_distance / 3963.2
                        ]
                    }
                };
            }
            where.Used = false;
            where.time_remaining = {
                $gt: CurrentDate
            };
            TowkenModel.find(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data.length > 0) {
                    _(data).forEach(function (value, index) {
                        var timeRemain = value.time_remaining
                        var view = value.views;
                        newView = view + 1;
                        var id = value._id;
                        var distance = value.mile;
                        var Dlatitude = value.geo_location[0];
                        var Dlongitude = value.geo_location[1];
                        var radlat1 = Math.PI * Dlatitude / 180;
                        var radlat2 = Math.PI * latitude / 180;
                        var theta = Dlongitude - longitude;
                        var radtheta = Math.PI * theta / 180;
                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                        dist = Math.acos(dist);
                        dist = dist * 180 / Math.PI;
                        dist = dist * 60 * 1.1515;
                        dist = dist * 0.8684;
                        if (dist <= distance) {
                            myData.push({
                                _id: value._id,
                                Distance: dist,
                                geo_location: value.geo_location,
                                type_of_token: value.type_of_token,
                                token_details: value.token_details,
                                views: value.views,
                                start_time: value.start_time,
                                Used: value.Used,
                                discount: value.discount,
                                mile: value.mile,
                                time_remaining: value.time_remaining,
                                business_name: value.business_name,
                                user_id: value.user_id,
                                token_quantity: value.token_quantity
                            });
                            // TowkenModel.update({
                            //         _id: id
                            //     }, {
                            //         $set: {
                            //             views: newView
                            //         }
                            //     },
                            //     function(myErr) {
                            //         if (myErr) {
                            //             req.json_op_status = 0;
                            //             req.json_op_message = myErr;
                            //         } else {
                            //             req.json_op_status = 1;
                            //             req.json_op_message = 'Success';
                            //         }
                            //     });
                        }
                        if (index == data.length - 1) {
                            var sortedData = _(myData).chain().sortBy(function (o) {
                                return o.Distance;
                            }).value();
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = sortedData;
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list/sortedbyRating/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var where, users_withn_distance = 50;
    var CurrentDate = moment().unix();
    var myData = [];

    where = {}
    if (userId) {
        if (latitude && longitude) {
            if (typeof latitude != 'undefined' && typeof longitude != 'undefined') {
                where.geo_location = {
                    $geoWithin: {
                        $centerSphere: [
                            [latitude, longitude], users_withn_distance / 3963.2
                        ]
                    }
                };
            }
            where.Used = false;
            where.time_remaining = {
                $gt: CurrentDate
            };
            TowkenModel.find(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data.length > 0) {
                    _(data).forEach(function (value, index) {
                        var timeRemain = value.time_remaining
                        var view = value.views;
                        newView = view + 1;
                        var id = value._id;
                        var distance = value.mile;
                        var Dlatitude = value.geo_location[0];
                        var Dlongitude = value.geo_location[1];
                        var radlat1 = Math.PI * Dlatitude / 180;
                        var radlat2 = Math.PI * latitude / 180;
                        var theta = Dlongitude - longitude;
                        var radtheta = Math.PI * theta / 180;
                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                        dist = Math.acos(dist);
                        dist = dist * 180 / Math.PI;
                        dist = dist * 60 * 1.1515;
                        dist = dist * 0.8684;
                        if (dist <= distance) {
                            myData.push({
                                _id: value._id,
                                Distance: dist,
                                geo_location: value.geo_location,
                                type_of_token: value.type_of_token,
                                token_details: value.token_details,
                                views: value.views,
                                start_time: value.start_time,
                                Used: value.Used,
                                discount: value.discount,
                                mile: value.mile,
                                time_remaining: value.time_remaining,
                                business_name: value.business_name,
                                user_id: value.user_id,
                                token_quantity: value.token_quantity
                            });
                            // TowkenModel.update({
                            //         _id: id
                            //     }, {
                            //         $set: {
                            //             views: newView
                            //         }
                            //     },
                            //     function(myErr) {
                            //         if (myErr) {
                            //             req.json_op_status = 0;
                            //             req.json_op_message = myErr;
                            //         } else {
                            //             req.json_op_status = 1;
                            //             req.json_op_message = 'Success';
                            //         }
                            //     });
                        }
                        if (index == data.length - 1) {
                            var sortedData = _(myData).chain().sortBy(function (o) {
                                return o.rating;
                            }).value();
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = sortedData;
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/list/sortedbyDiscount/:latitude/:longitude', function (req, res, next) {
    var TowkenModel = req.Collection_token;
    var latitude = req.params.latitude;
    var longitude = req.params.longitude;
    var userId = req.json_op_userId._id;
    var where, users_withn_distance = 50;
    var CurrentDate = moment().unix();
    var myData = [];

    where = {}
    if (userId) {
        if (latitude && longitude) {
            if (typeof latitude != 'undefined' && typeof longitude != 'undefined') {
                where.geo_location = {
                    $geoWithin: {
                        $centerSphere: [
                            [latitude, longitude], users_withn_distance / 3963.2
                        ]
                    }
                };
            }
            where.Used = false;
            where.time_remaining = {
                $gt: CurrentDate
            };
            TowkenModel.find(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data.length > 0) {
                    _(data).forEach(function (value, index) {
                        var timeRemain = value.time_remaining
                        var view = value.views;
                        newView = view + 1;
                        var id = value._id;
                        var distance = value.mile;
                        var Dlatitude = value.geo_location[0];
                        var Dlongitude = value.geo_location[1];
                        var radlat1 = Math.PI * Dlatitude / 180;
                        var radlat2 = Math.PI * latitude / 180;
                        var theta = Dlongitude - longitude;
                        var radtheta = Math.PI * theta / 180;
                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                        dist = Math.acos(dist);
                        dist = dist * 180 / Math.PI;
                        dist = dist * 60 * 1.1515;
                        dist = dist * 0.8684;
                        if (dist <= distance) {
                            myData.push({
                                _id: value._id,
                                Distance: dist,
                                geo_location: value.geo_location,
                                type_of_token: value.type_of_token,
                                token_details: value.token_details,
                                views: value.views,
                                start_time: value.start_time,
                                Used: value.Used,
                                discount: value.discount,
                                mile: value.mile,
                                time_remaining: value.time_remaining,
                                business_name: value.business_name,
                                user_id: value.user_id,
                                token_quantity: value.token_quantity
                            });
                            // TowkenModel.update({
                            //         _id: id
                            //     }, {
                            //         $set: {
                            //             views: newView
                            //         }
                            //     },
                            //     function(myErr) {
                            //         if (myErr) {
                            //             req.json_op_status = 0;
                            //             req.json_op_message = myErr;
                            //         } else {
                            //             req.json_op_status = 1;
                            //             req.json_op_message = 'Success';
                            //         }
                            //     });
                        }
                        if (index == data.length - 1) {
                            var sortedData = _(myData).chain().sortBy(function (o) {
                                return o.discount * -1;
                            }).value();
                            req.json_op_status = 1;
                            req.json_op_message = 'Success';
                            req.json_op_data = sortedData;
                            next();
                        }
                    });
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not Found.';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Fill all fields.';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/redeem', function (req, res, next) {
    var TowkenRedeemModel = req.Collection_tokenRedeem;
    var redeemCode = req.body.redeem_code;
    var userId = req.json_op_userId._id;
    var where;
    var myData = [];

    if (userId) {
        if (redeemCode) {
            where = {
                redeem_code: redeemCode
            };
            TowkenRedeemModel.findOne(where).populate('user_id').exec(function (err, data) {
                if (err) {
                    req.json_op_status = 0;
                    req.json_op_message = err;
                    next();
                } else if (data) {
                    myData.push(data);
                    req.json_op_status = 1;
                    req.json_op_message = 'Success';
                    req.json_op_data = myData;
                    next();
                } else {
                    req.json_op_status = 0;
                    req.json_op_message = 'Record not found';
                    next();
                }
            });
        } else {
            req.json_op_status = 0;
            req.json_op_message = 'Missing few fields';
            next();
        }
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/showRedeemCode', function (req, res, next) {
    var TowkenRedeemModel = req.Collection_tokenRedeem;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;
    var myData = [];

    if (userId && type.toLowerCase() == 'business') {
        TowkenRedeemModel.find({
        }).populate('user_id').exec(function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {
                for (var a = 0; a < data.length; a++) {
                    var row = data[a];
                    var email = row.get('user_id').email;
                    var fullName = row.get('user_id').fullname;
                    var redeemCode = row.get('redeem_code');
                    myData.push({ email: email, fullName: fullName, redeemCode: redeemCode });
                }
                req.json_op_status = 1;
                req.json_op_message = 'Success';
                req.json_op_data = myData;
                next();
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Record not found';
                next();
            }
        });
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.post('/showComment', function (req, res, next) {
    var TowkenRatingModel = req.Collection_tokenRating;
    var TowkenModel = req.Collection_token;
    var userId = req.json_op_userId._id;
    var tokenId = req.body.token_id;
    var myData = [];

    if (userId) {
        TowkenModel.findOne({
            _id: tokenId
            //        }).populate('user_id').exec(function (err, data) {
        }, function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data) {
                var businessId = data.user_id;
                TowkenRatingModel.find({
                    business_id: businessId
                }).populate('user_id').exec(function (err, result) {
                    for (var a = 0; a < result.length; a++) {
                        var row = result[a];
                        var name = row.get('user_id').fullname;
                        var rating = row.get('rating');
                        var comment = row.get('comment');
                        myData.push({ name: name, rating: rating, comment: comment });
                    }
                    if (myData.length > 0) {
                        req.json_op_status = 1;
                        req.json_op_message = 'Success';
                        req.json_op_data = myData;
                        next();
                    } else {
                        req.json_op_status = 0;
                        req.json_op_message = 'Record not found.';
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
        req.json_op_message = 'Invalid User.';
        next();
    }
});

router.get('/showBusinessRating', function (req, res, next) {
    var UserModel = req.Collection_users;
    var userId = req.json_op_userId._id;
    var type = req.json_op_userId.type;
    var myData = [];

    if (userId && type.toLowerCase() == 'business') {
        UserModel.find({
            _id: userId
        }, function (err, data) {
            if (err) {
                req.json_op_status = 0;
                req.json_op_message = err;
                next();
            } else if (data.length > 0) {
                for (var a = 0; a < data.length; a++) {
                    var row = data[a];
                    var rating = row.get('rating');
                    if (rating) {
                        myData.push({ rating: rating });
                    }
                }
                req.json_op_status = 1;
                req.json_op_message = 'Success';
                req.json_op_data = myData;
                next();
            } else {
                req.json_op_status = 0;
                req.json_op_message = 'Record not found';
                next();
            }
        });
    } else {
        req.json_op_status = 0;
        req.json_op_message = 'Invalid User.';
        next();
    }
});

module.exports = router;