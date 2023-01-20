var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var constants = require('../models/modelConstants');
var adminModel = mongoose.model(constants.adminSchema);



module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, (email, password, next) => {
            // console.log(email, password);
            adminModel.findOne({ email: email }, function(err, user) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return next(null, false, "Wrong Credentials !");
                }
                if (user) {
                        bcrypt.compare(password, user.password, function(err, result) {
                            if (err) {
                                return next(err);
                            }
                            if (result) {
                                return next(null, user);
                            } else {
                                return next(null, false, "Wrong Credentials !");
                            }
                        });
                }
            })
        }));

    passport.serializeUser(function(user, next) {
        next(null, user._id);
    });

    passport.deserializeUser(function(id, next) {
        adminModel.findById(id, function(err, user) {
            next(err, user);
        });
    });
};