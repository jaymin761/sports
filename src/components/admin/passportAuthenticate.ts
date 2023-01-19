var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
const AdminModel = require("./models/admin");


module.exports = function(passport: any) {
    passport.use('admin-local',
        new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, (email: string, password : string, next: any) => {
            // console.log(email, password);
            AdminModel.findOne({ email: email }, function(err: any, user: any) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return next(null, false, "Wrong Credentials !");
                }
                if (user) {
                    if (user.status == true) {
                        bcrypt.compare(password, user.password, function(err: any, result: any) {
                            if (err) {
                                return next(err);
                            }
                            if (result) {
                                return next(null, user);
                            } else {
                                return next(null, false, "Wrong Credentials !");
                            }
                        });
                    } else {
                        return next(null, false, "Your account has been disabled temporary. for more information kindly contact admin");
                    }
                }
            })
        }));

    passport.serializeUser(function(user: any, next: any) {
        next(null, user._id);
    });

    passport.deserializeUser(function(id: any, next: any) {
        AdminModel.findById(id, function(err: any, user: any) {
            next(err, user);
        });
    });
};