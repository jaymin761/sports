import { AppStrings } from "../../../utils/appStrings";

const config = require('config');
const Twilio = require('twilio');
let twilioClient = new Twilio(
    config.get('TWILIO_API_KEY'), config.get('TWILIO_API_SECRET'), { accountSid: config.get('TWILIO_ACCOUNT_SID'), }
);

const client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'), config.get('TWILIO_AUTH_TOKEN'));
const Admin = require("../models/admin");
const User = require("../../users/models/userModel");
import { NextFunction, query, Request, Response } from "express";
import commonUtils, { fileFilter, fileStoragePdf, fileFilterPdf, fileStorage } from "../../../utils/commonUtils";
import Auth from "../../../auth";
import { AdminRole, FriendStatus, NotificationType, TrustStatus, UserType } from "../../../utils/enum";
import mongoose, { ObjectId } from "mongoose";
import eventEmitter from "../../../utils/event";

const passport = require('passport');
const bcrypt = require("bcryptjs");
const multer = require("multer");

// TODO: Subadmin registation(assign admin role)
async function adminRegister(req: Request, res: Response) {
    const admin = new Admin({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        adminrole: req.body.adminrole,
        about: req.body.about,
        mobile: req.body.mobile,
        image: req.body.image_url,
        isActive: true
    });

    if (parseInt(req.body.adminrole) === AdminRole.SUPER_ADMIN) {
        const CheckSuperAdmin = await Admin.findOne({ adminrole: AdminRole.SUPER_ADMIN }).exec();
        if (CheckSuperAdmin) {
            return commonUtils.sendAdminError(req, res, { message: AppStrings.SUPER_ADMIN_ALREADY_EXISTS }, 409);
        }
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);

    await admin.save();
    return commonUtils.sendAdminSuccess(req, res, { message: "Admin Register successfully", id: admin._id });
}
async function adminDashboard(req: Request, res: Response) {
    res.render('dashboard/dashboard');
}
async function adminLogin(req: Request, res: Response) {
    res.render('login');
}
// async function adminLoginPost(req: Request, res: Response) {
//     try {
//         passport.authenticate('local', (err: any, user: any, info: any) => {
//             var responseData = {};
            
//             if (err) {
//                 // responseData.error = err;
//                 // responseData.success = false;
//                 // return res.send(responseData);
//                 console.log(err);
                
//             }
//             if (!user) {
//                 // responseData.error = info;
//                 // responseData.success = false;
//                 // return res.send(responseData);
//                 console.log(info);

//             }
//             // establish session
//             req.logIn(user, function(err: any) {
//                 if (err) {
//                     // responseData.error = 'Wrong Credentials';
//                     // responseData.success = false;
//                     // return res.send(responseData);
//                     console.log("Wrong Credentials");
                    
//                 } else {
//                     console.log("login success");
//                     // responseData.success = true;
//                     // return res.send(responseData);
//                 }
//             });
//         })(req, res);
//     } catch (error) {
//         console.log('err' + error);
//     }
// }
export default {
    adminRegister,
    adminDashboard,
    adminLogin,
    // adminLoginPost
};