var mongoose = require('mongoose');
const passport = require('passport');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var ejs = require('ejs');
var mine = require('mime-types');
var fs = require('fs');
var nodemailer = require('nodemailer');
var constants = require('../../models/modelConstants');
var adminModel = mongoose.model(constants.adminSchema);


var testAccount = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.USEREMAIL,
        pass: process.env.USERPASSWORD,
    }
});



const authController = {

    login: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Login';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        res.render('pages/auth/login', responseData);
    },

    loginPost: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Login';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        try {
            passport.authenticate('local', (err, user, info) => {

                if (err) {
                    responseData.error = err;
                    responseData.success = false;
                    return res.send(responseData);
                }
                if (!user) {
                    responseData.error = info;
                    responseData.success = false;
                    return res.send(responseData);
                }
                // establish session
                req.logIn(user, function(err) {
                    if (err) {
                        responseData.error = 'Wrong Credentials';
                        responseData.success = false;
                        return res.send(responseData);
                    } else {
                        responseData.success = true;
                        return res.send(responseData);
                    }
                });
            })(req, res, next);
        } catch (error) {
            console.log('err' + error);
        }
    },

    profile: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Profile';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        try {
            var data = await adminModel.findById(req.user.id).exec();
            if (data) {
                responseData.user = data;
                res.render('pages/auth/profile', responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }
    },

    editProfile: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Profile';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        try {
            var data = await adminModel.findById(req.user.id).exec();
            if (data) {
                responseData.user = data;
                res.render('pages/auth/editProfile', responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }
    },

    editProfilePost: async function(req, res, next) {

        var responseData = {};
        var userId = req.user.id;
        req.newData = {}
        var result = await adminModel.findById({ '_id': userId }).exec();

        var { firstName, lastName, contactNo, email } = req.body;

        if (req.file) {
            filename = Date.now() + "." + mine.extension(req.file.mimetype);
            var file = APPDIR + '/public/images/admin/' + filename;
            fs.rename(req.file.path, file, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("image upload");
                }
            });
            req.newData.avatar = "images/admin/" + filename;
            if (result.avatar) {
                fs.unlink(APPDIR + '/public/' + result.avatar, () => {
                    console.log("delete");
                });
            }
        }
        if (firstName.length > 0) {
            req.newData.firstName = firstName;
        }
        if (lastName.length > 0) {
            req.newData.lastName = lastName;
        }
        if (contactNo.length > 0) {
            req.newData.contactNo = contactNo;
        }
        try {
            await adminModel.findOneAndUpdate({ _id: userId }, req.newData, { upsert: true }, async function(err, result) {
                if (err) {
                    if (err.name == "ValidationError") {
                        responseData.success = false;
                        responseData.dbError = err.errors;
                    } else {
                        responseData.success = false;
                        responseData.error = 'Something went wrong !';
                    }
                    return res.redirect('/admin/profile');

                    // return res.send(responseData);
                } else {
                    responseData.success = true;
                    return res.redirect('/admin/profile');
                    // return res.send(responseData);
                }
            })
        } catch (error) {
            console.log(error);
        }

    },

    changePassword: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Chnage Password';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        try {
            var data = await adminModel.findById(req.user.id).exec();
            if (data) {
                responseData.user = data;
                res.render('pages/auth/changePassword', responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }

    },

    changePasswordPost: async function(req, res, next) {
        var responseData = {};
        var { oldpassword, newpassword, confirmpassword } = req.body;


        try {
            var result = await adminModel.findById(req.user.id).exec();
            var comparePassword = await bcrypt.compare(oldpassword, result.password);
            var bcryptPassword = await bcrypt.hash(newpassword, 10);
            if (newpassword.length >= 5 && confirmpassword.length >= 5) {
                if (newpassword == confirmpassword) {
                    if (comparePassword) {
                        var data = await adminModel.findByIdAndUpdate(req.user.id, { password: bcryptPassword }).exec();
                        if (data) {
                            responseData.success = true;
                            responseData.message = 'Password change successfully !';
                        }
                    } else {
                        responseData.success = false;
                        responseData.error = 'Old password is mis match !';
                    }
                } else {
                    responseData.success = false;
                    responseData.error = 'New password and Confirm_password are mis match !';
                }
            } else {
                responseData.success = false;
                responseData.error = 'Password must be at least 5 characters !'
            }
            return res.send(responseData);
        } catch (error) {
            console.log('err' + error);
        }
    },

    forgotPassword: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Forgot Password';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        res.render('pages/auth/forgotPassword', responseData);
    },

    forgotPasswordPost: async function(req, res, next) {
        var { email } = req.body;
        var checkEmail = { email: email };

        if (email) {
            await adminModel.findOne({ email: email }).exec()
                .then((result) => {
                    var responseData = {};
                    if (result) {
                        if (result.email == email) {
                            req.newData = {};
                            var token = crypto.randomBytes(20).toString('hex');
                            req.newData.forgotPasswordToken = token;
                            var link = `${process.env.WEBURL}admin/reset-password/${token}`;
                            adminModel.findOneAndUpdate(checkEmail, req.newData, { upsert: true },
                                async function(err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        ejs.renderFile(APPDIR + '/views/email/web/forgotPassword.ejs', { link: link, email: email }, function(err, result) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                var mailOptions = {
                                                    from: process.env.USEREMAIL,
                                                    to: email,
                                                    subject: "Forgot Password",
                                                    html: result
                                                };
                                                testAccount.sendMail(mailOptions, function(err, result) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        responseData.message = "Mail send successfully !",
                                                            responseData.success = true
                                                            // console.log(responseData);
                                                        res.send(responseData);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }).exec();
                        }

                    } else {
                        responseData.error = "invaild email !"
                        responseData.success = false
                            // console.log(responseData);
                        res.send(responseData);
                    }
                })
        } else {
            responseData.error = "please enter email !"
            responseData.success = false
            return res.send(responseData);
        }
    },

    resetPassword: async function(req, res, next) {
        var responseData = {};
        var token = req.params.token;
        responseData.token = token;
        responseData.pageName = 'Reset Password';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        var result = await adminModel.findOne({ forgotPasswordToken: token })
        if (result) {
            var today = new Date();
            var to = new Date(result.updatedAt);
            var diffMs = (today - to);
            var minutes = Math.floor((diffMs / 1000) / 60);
            if (minutes > 3) {
                res.send({ "status": false, responseData });
            } else {
                if (result.forgotPasswordToken == token) {
                    responseData.token = token;
                    return res.render('pages/auth/resetPassword', responseData);
                } else {
                    return res.send('page not found');
                }
            }
        } else {
            return res.send('page not found');
        }
    },

    resetPasswordPost: async function(req, res, next) {
        console.log('req.body');
        var responseData = {};
        var { token, newpassword, confirmpassword } = req.body
        var bcryptPassword = await bcrypt.hash(newpassword, 10);
        req.newData = {};

        req.newData.password = bcryptPassword;
        req.newData.forgotPasswordToken = null;

        if (newpassword.length >= 5 && confirmpassword.length >= 5) {
            if (newpassword == confirmpassword) {
                var result = await adminModel.findOneAndUpdate({ forgotPasswordToken: token }, req.newData, { upsert: true }).exec();
                if (result) {
                    responseData.message = 'Password has been reset !';
                    responseData.success = true;
                    return res.send(responseData);
                } else {
                    console.log('error');
                }
            } else {
                responseData.error = 'password or confirm password dose not match !';
                responseData.success = false;
                return res.send(responseData);
            }
        } else {
            responseData.error = 'Password must be at least 5 characters';
            responseData.success = false;
            return res.send(responseData);
        }
    },
    subAdminList: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Sub Admin List';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        try {
            var data = await adminModel.find({ "isMaster": false }).sort({ createdAt: -1 }).exec();
            if (data) {
                responseData.data = data;
                res.render('pages/subAdmin/listOfSubadmin', responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }
    },

    addSubAdmin: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Add Sub Admin';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;

        res.render('pages/subAdmin/addSubAdmin', responseData);
    },

    addSubAdminPost: async function(req, res, next) {
        var responseData = {};
        // let filename;
        // let contact_number;
        let statusValue;

        var { email, password, firstName, lastName, contactNo } = req.body;
        console.log(req.body);

        var emailCheck = await adminModel.find({ email: email });
        if (emailCheck.length != 0) {
            responseData.error = 'Already exists this email !'
            responseData.success = false;
            return res.send(responseData);
        } else {
            if (password.length >= 5) {
                var bcryptPassword = await bcrypt.hash(password, 10);
                try {
                    await adminModel.create({
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        contactNo: contactNo,
                        avatar: null,
                        password: bcryptPassword,
                        is_master: 0,
                        forgot_password_token: null,
                        createdBy: req.user.id,
                        updatedBy: req.user.id,
                    }, async function(err, result) {
                        if (err) {
                            if (err.name == "ValidationError") {
                                responseData.dbError = err.errors;
                            } else {
                                responseData.error = 'Something went wrong !';
                            }
                            return res.send(responseData);
                        } else {
                            responseData.success = true;
                            return res.send(responseData);
                        }
                    });
                } catch (error) {
                    console.log('error');
                }
            } else {
                // console.log('no');
                responseData.error = 'Password must be at least 5 characters !'
                responseData.success = false;
                return res.send(responseData);
            }
        }
    },

    editSubAdmin: async function(req, res, next) {
        var responseData = {};
        responseData.pageName = 'Edit Sub Admin';
        responseData.pageTitle = process.env.APPNAME + " | " + responseData.pageName;
        var id = req.params.id;

        try {
            var data = await adminModel.findById(id).exec();
            if (data) {
                responseData.data = data;
                res.render('pages/subAdmin/editSubAdmin', responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }
    },

    editSubAdminPost: async function(req, res, next) {
        var responseData = {};
        var id = req.params.id;
        req.newData = {};
        var { firstName, lastName, contactNo, email, password } = req.body;
        if (contactNo) {
            req.newData.contactNo = contactNo
        }
        if (firstName) {
            req.newData.firstName = firstName
        }
        if (lastName) {
            req.newData.lastName = lastName
        }
        if (email) {
            req.newData.email = email
        }

        let check = await adminModel.findOne({ _id: { $ne: id }, email: email }).countDocuments().exec();
        if (check > 0) {
            responseData.error = 'Already exists this email !'
            responseData.success = false;
            return res.send(responseData);
        }

        if (password.length > 0) {
            if (password.length >= 5) {
                var new_pass = password.trim();
                var bcryptPassword = await bcrypt.hash(new_pass, 10);
                req.newData.password = bcryptPassword;
            } else {
                responseData.error = 'Password must be at least 5 characters !'
                responseData.success = false;
                return res.send(responseData);
            }
        }

        try {
            req.newData.updatedBy = req.user.id;
            await adminModel.findOneAndUpdate({ _id: id }, req.newData, { upsert: true }, async function(err, result) {
                if (err) {
                    if (err.name == "ValidationError") {
                        responseData.success = false;
                        responseData.dbError = err.errors;
                    } else {
                        responseData.success = false;
                        console.log(err);
                        responseData.error = 'Something went wrong !';
                    }
                    return res.send(responseData);
                } else {
                    responseData.success = true;
                    return res.send(responseData);
                }
            })
        } catch (error) {
            console.log(error);
        }


    },

    addSubAdminDelete: async function(req, res, next) {
        var responseData = {};

        try {
            var result = await adminModel.findByIdAndDelete(req.body.id);
            if (result) {
                if (result.avatar) {
                    fs.unlink(APPDIR + '/public/' + result.avatar, () => {
                        console.log("delete");
                    });
                }
                responseData.success = true;
                return res.send(responseData);
            }
        } catch (error) {
            console.log('err' + error);
        }
    },

    logout: async function(req, res, next) {
        req.logout(function(err) {
            if (err) { return next(err); }
            req.session.destroy();
            res.redirect('/');
        });
    },


}
module.exports = authController