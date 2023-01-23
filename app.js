var createError = require('http-errors');
var https = require('https');
var express = require('express');
var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
const bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var logger = require('morgan');
var multer = require('multer');
const basicAuth = require('express-basic-auth')
const process = require('process');
process.traceDeprecation = true;

var app = express();


// define env-files connection ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
require('dotenv').config({
    path: `./env-files/${process.env.ENV || 'dev'}.env`,
});
var PORT = process.env.PORT

global.APPDIR = path.resolve(__dirname).toString();

global.CONFIGS = require('./configs/config.json');
global.MESSAGES = require('./configs/message/en.json');
// global.CONFIGS = require('./configs/config.json');

// global.DE = require('./configs/message/de.json');
// global.EN = require('./configs/message/en.json');
// global.NL = require('./configs/message/nl.json');

// define databse connection~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
require('./models/dbConnection');

// App setup
if (process.env.ENV == "stg" || process.env.ENV == "prod") {
    console.log(`Listening on port ${PORT}`);

    const options1 = {
        key: fs.readFileSync(process.env.PRIVATEKEY),
        cert: fs.readFileSync(process.env.FULLCHAIN)
    };
    https.createServer(options1, app).listen(PORT);
} else {
    const server = app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// route core 


app.use(logger('dev'));
app.use(express.json());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SECRETKEY,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// passportAuthenticate(initialise the passport session)
require('./services/passportAuthenticate')(passport);
app.use(passport.initialize());
app.use(passport.session());

// var common = require('./controllers/admin/commonController');

app.use(async function(req, res, next) {


    res.locals = { siteUrl: process.env.WEBURL, sess: req.user, routeUrl: process.env.WEBURL + 'admin/' };

    next();
});

app.use('/admin', require('./routes/admin'));
app.use('/user', require('./routes/user'));
// app.use('/api', require('./routes/api'));
app.use('/', require('./routes/admin'));
app.get('*', function(req, res, next) {
    return res.render('errors/404.ejs');
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// var storage = multer.diskStorage({
//     destination: function(req, file, callback) {
//         callback(null, './uploads');
//     },
//     filename: function(req, file, callback) {
//         callback(null, file.fieldname + '-' + Date.now());
//     }
// });
// var upload = multer({ storage: storage }).array('userPhoto', 2);

module.exports = app;