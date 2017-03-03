var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var db = require('./mods/db.js');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var token = require('./middleware/token.js');
var users = require('./routes/users');
var towken = require('./routes/towken');
var stripeRoutes = require('./routes/stripe');
var states = require('./routes/states');
var businessTypes = require('./routes/business-types');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(db());
app.use(cors());
app.use(token);

app.use('/v1/customer', users);
app.use('/v1/towken', towken);
app.use('/v1/stripe', stripeRoutes);
app.use('/v1/states', states);
app.use('/v1/businesstypes', businessTypes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    if (typeof req.json_op_status != 'undefined') {
        //means error has occurred
        if (req.json_op_status == '0') {
            res.json({
                'status': req.json_op_status,
                'data': null,
                'succeeded': false,
                'message': req.json_op_message
            });
        } else {
            res.json({
                'status': req.json_op_status,
                'succeeded': true,
                'message': req.json_op_message,
                'data': req.json_op_data
            });
        }
    }
    next();
});

// error handlers

// development error handler
// will print stack trace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.get('/', function (req, res) {
    res.sendfile('./index.html');
})

module.exports = app;