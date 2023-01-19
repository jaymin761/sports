import {AppStrings} from "../../utils/appStrings";
import {Request, Response} from "express";
import commonUtils from "../../utils/commonUtils";
import {Device, TrustStatus, UserData, UserType} from "../../utils/enum";
import mongoose, {ObjectId} from "mongoose";
import Auth from "../../auth";
import crypto from "crypto";
import eventEmitter from "../../utils/event";
import Phone from "../phone"
import {myTrustLevel} from "../../utils/trustLevelUtils";
import business from "../business";

const User = require('../users/models/userModel');
const Business = require('../business/models/businessModel');
const ChangeRequest = require('../users/models/changeRequest');
const Token = require("./tokenModel");
const Address = require('../business/models/addressModel');

const bcrypt = require("bcryptjs");
const config = require("config");

const Trust = require('../admin/models/trustModel');
const Configurable = require('../admin/models/configurable');
const { getAuth } = require('firebase-admin/auth');

async function register(req: Request, res: Response) {

    let traceRequests = await Configurable.findOne();

    const user = new User({
        fullName: req.body.fullName,
        email: req.body.userName?.[UserData.EMAIL.toString()],
        mobile: req.body.userName?.[UserData.MOBILE.toString()],
        password: req.body.password,
        pushToken: req.body.pushToken,
        device: req.body.device,
        userTrace: traceRequests?.trace?.traceRequest,
        permissions: {
            chatPermission: {
                public: true,
                contact: true,
                marketing: true
            },
            visibility: {
                picture: true,
                status: true,
                post: true
            },
            locationPermission: {
                whileUsingApp: false,
                withLinkedContact: false,
                withPublic: true,
                notShared: false,
            },
        }
    });

    if (!user.email && !user.mobile)
        return commonUtils.sendError(req, res, {errors: {"userName": AppStrings.EMAIL_MOBILE_REQUIRED}}, 400);
    // hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    eventEmitter.emit("registerChatUser", {
        "userId": user._id,
        "name": user.userName ?? "",
        "image": user.image?.profilePic ?? "",
    })
    const trustLevelMsg =  await updateAvgTrustLevel(user._id)


    if (user.email) {
        await sendVerifyOTP(user._id, user.email, user.device, 'email', 'forSignUp', 'please verify your email' , null, null, user.fullName)

        // this event is no longer required.
        // eventEmitter.emit('user.checkForSelfEndorsed', {userId: user._id, email: user.email})
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
    } else if (user.mobile) {
        // await sendVerifyOTP(user._id, user.mobile, user.device, 'mobile', 'forSignUp', 'please verify your mobile', null, null, user.fullName)
        // this event is no longer required.
        // eventEmitter.emit('user.checkForSelfEndorsed', {userId: user._id, mobile: user.mobile})
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
    } else {
        return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
    }
}

async function login(req: Request, res: Response) {
    const email = req.body.userName[UserData.EMAIL.toString()];
    const mobile = req.body.userName[UserData.MOBILE.toString()];
    const password = req.body.password;
    const device = req.body.device ?? 3;
    const terminateSession = req.body.terminateSession || false;

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    const find_filed = email ? {email: email} : {mobile: mobile};

    try {
        const user = await User.findOne(find_filed);     

        const business = await Business.findOne({userId: new mongoose.Types.ObjectId(user._id)})

        if (user.isDeleted == 1) {
            const responseObj = {
                user: {
                    displayName: user.fullName,
                    userName: user.userName,
                    _id: user._id,
                    email: user.email,
                    mobile: user.mobile,
                    profilePic: user.image.profilePic ?? null,
                    isDeleted: user.isDeleted, // TODO: for use delete account request from Admin
                    status: user.status // TODO: for use user deactive your account
                },
    
            }
            return commonUtils.sendSuccess(req, res, responseObj)
        }

        if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

        const valid_password = await bcrypt.compare(password, user.password);
        if (!valid_password) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return commonUtils.sendError(req, res, {message: AppStrings.INVALID_PASSWORD}, 409);
        }

        if (!user.isVerify || parseInt(user.isVerify) === 0) {
            if (email) {
                await sendVerifyOTP(user._id, email, user.device, 'email', 'forSignUp', 'Your email has been verified', null, null, user.fullName)
                return commonUtils.sendSuccess(req, res, {isVerify: 0})
            }
            // if (mobile) {
            //     await sendVerifyOTP(user._id, mobile, user.device, 'mobile', 'forSignUp', 'Your mobile has been verified', null, null, user.fullName)
            //     return commonUtils.sendSuccess(req, res, {isVerify: 0})
            // }
        }

        if (device !== Device.WEB && !terminateSession) {
            const [noPreviousToken, errOnPreviousToken] = await Auth.checkSession(user._id, UserType.CUSTOMER, user.createdAt, device);
            if (errOnPreviousToken) {
                return commonUtils.sendSuccess(req, res, {message: errOnPreviousToken, session: !!errOnPreviousToken});
            }
        }

        const response_ = await Auth.login(user._id, UserType.CUSTOMER, user.createdAt, device);
        if (req.body?.pushToken) {
            await User.findByIdAndUpdate(user._id, {$set: {pushToken: req.body.pushToken}})
        }
        await User.findByIdAndUpdate(user._id, {$set: {lastLogin: new Date()}}).exec();

        res.cookie("accessToken", response_.accessToken, {maxAge: 900000, httpOnly: true});
        res.cookie("refreshToken", response_.refreshToken, {maxAge: 900000, httpOnly: true});

        eventEmitter.emit("updateChatUser", {
            "userId": user._id,
            "name": user.fullName ?? "",
            "image": user.image?.profilePic ?? "",
        })
        const trustLevelMsg =  await updateAvgTrustLevel(user._id)

        const responseObj = {
            usertype: user.usertype,
            isProfileComplete: user.isProfileComplete,
            accessToken: response_.accessToken,
            isVerify: user.isVerify,
            user: {
                displayName: user.fullName,
                userName: user.userName,
                _id: user._id,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.image.profilePic ?? null,
                status: user.status, // TODO: for use user deactive your account
                businessId: business?._id?.toString() ?? "0",
            },
            // session: response_.oldValue,
            message: trustLevelMsg ? trustLevelMsg : 'message not found in db',

        }

        return commonUtils.sendSuccess(req, res, responseObj);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}

const updateAvgTrustLevel = async(userId:ObjectId|string) => {
    const user = await User.findById(userId)
    const myTrustConstant: number = myTrustLevel(
        user.trustLevel?.image?.valueOf() ?? 1,
        user.trustLevel?.id?.valueOf() ?? 1,
        user.trustLevel?.reference?.valueOf() ?? 1,
        user.trustLevel?.address?.valueOf() ?? 1,
    )

    const trust = await Trust.findOne({
        combine: myTrustConstant
    }).select("star message name")

    user.averageTrust = trust?.star
    await user.save()
    return trust?.message
}


async function guestLogin(req: Request, res: Response) {
    try {
        const deviceId = req.body.deviceId;
        if (!deviceId) return commonUtils.sendError(req, res, AppStrings.INVALID_DEVICEID)
        const device = req.body.device ?? 3;

        const response_ = await Auth.login(deviceId, UserType.CUSTOMER, new Date().toISOString(), device, true);
        res.cookie("accessToken", response_.accessToken, {maxAge: 900000, httpOnly: true});
        res.cookie("refreshToken", response_.refreshToken, {maxAge: 900000, httpOnly: true});

        const responseObj = {
            usertype: UserType.CUSTOMER,
            isProfileComplete: false,
            accessToken: response_.accessToken,
            isVerify: 0,
            isGuest: 1,
        }

        return commonUtils.sendSuccess(req, res, responseObj);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}

async function sendVerifyOTP(userId: ObjectId, credential: any, device: any, median: string, reason: any, subject: string, businessId = "", choice = 0, fullName: any): Promise<number> {

    try {
        const otp = Number((Math.random() * (999999 - 100000) + 100000).toFixed()); //TODO: logic wise generate
        // console.log(otp);
        
        // if (median === 'mobile') {
        //     // comment for now
        //     eventEmitter.emit("send_phone_otp", {to: credential});
        // } else
         if (median === 'email') {
            eventEmitter.emit("send_email_otp", {
                to: credential,
                subject: subject,
                data: {
                    otp: otp,
                    message: "Your email has been verified",
                    fullName: fullName
                },
            });
        } else {
            return 0
        }

        let resetToken = crypto.randomBytes(64).toString("hex");
        resetToken = await genrateUniqueToken(resetToken);
        const hash_ = await bcrypt.hash(resetToken, Number(config.get("saltRounds")));

        await Token.deleteOne({userId});

        if (businessId == "") businessId = null

        const tokenData = new Token({
            userId: userId,
            businessId: businessId,
            otp: otp,
            token: hash_,
            choice: choice,
            device: device,
            forSignUp: reason === 'forSignUp'
        });

        await tokenData.save();

        return otp;
    } catch (error: any) {
        console.log(error.message);
    }
}

async function methodAllowance(req: any, res: Response) {
    return commonUtils.sendError(req, res, {message: "Request method now allowed."}, 405);
}

async function forgotPassword(req: any, res: Response) {
    const token = req.body.token;
    
    const password = req.body.password;

    const device = req.body.device;


    const token_ = await Token.findOne({token: token, device: device, isVerified: true}).exec();

    if (!token_) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_TOKEN}, 409);

    const user = await User.findById(token_.userId).exec();
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.updateOne({password: user.password}).exec();

    await Token.deleteOne({token: token}).exec();

    // TODO blackList old tokens

    return commonUtils.sendSuccess(req, res, {message: AppStrings.PASSWORD_CHANGED,}, 200);
}

async function changePassword(req: any, res: Response) {
    const user_id = req.headers.userid;
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    const user = await User.findById(user_id).exec();
    if (!user)
        return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    const valid_password = await bcrypt.compare(old_password, user.password);
    if (!valid_password)
        return commonUtils.sendError(req, res, {message: AppStrings.INVALID_PASSWORD}, 409);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.updateOne({password: user.password}).exec();

    // TODO blackList old tokens

    return commonUtils.sendSuccess(req, res, {message: AppStrings.PASSWORD_CHANGED,}, 200);
}

async function getOTP(req: Request, res: Response) {
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const device = req.body.device;

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let find_filed;
    if (email) {
        find_filed = {email: email};
    } else {
        find_filed = {mobile: mobile};
    }

    const user = await User.findOne(find_filed).exec();

    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    if (email) {
        await sendVerifyOTP(user._id, user.email,  device, 'email', 'forForgotPassword', 'Your otp has been verified', null, null, user.fullName)
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
    // } else if (mobile) {
    //     await sendVerifyOTP(user._id, user.mobile, device, 'mobile', 'forForgotPassword', 'Your Otp has been verified', null, null, user.fullName)
    //     return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
    } else {
        return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
    }
}

async function getVerifyOTP(req: Request, res: Response) {
    try {

        const email = req.body.userName?.[UserData.EMAIL.toString()];
        const mobile = req.body.userName?.[UserData.MOBILE.toString()];
        const businessId = req.body.businessId;
        const device = req.body.device;
        const userid = req.headers.userid?.toString() ?? ""

        if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

        const business = await Business.findOne({
            _id: new mongoose.Types.ObjectId(businessId)
        });

        const user = await User.findOne({
            _id: new mongoose.Types.ObjectId(userid)
        }).select("_id");

        if (!business) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

        if (email) {
            await sendVerifyOTP(user._id, email, device, 'email', 'forBusinessVerification', 'Your otp has been verified', businessId, 1, user.fullName)
            return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
        // } else if (mobile) {
        //     await sendVerifyOTP(user._id, mobile, device, 'mobile', 'forBusinessVerification', 'Your Otp has been verified', businessId, 2, user.fullName,)
        //     return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
        }
    } catch (er: any) {
        console.log(er.message);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

async function resendOTP(req: Request, res: Response) {
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const device = req.body.device;
    const reason = req.body.reason;

    if (!['forSignUp', 'forForgotPassword'].includes(reason)) {
        return commonUtils.sendError(req, res, {message: AppStrings.INVALID_REASON})
    }

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let find_filed;
    if (email) {
        find_filed = {email: email};
    } else {
        find_filed = {mobile: mobile};
    }

    const user = await User.findOne(find_filed).exec();
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    if (user.email) {
        await sendVerifyOTP(user._id, user.email, device, 'email', reason, 'Your otp has been verified', null, null, user.fullName)
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
    // } else if (user.mobile) {
    //     await sendVerifyOTP(user._id, user.mobile, device, 'mobile', reason, 'Your Otp has been verified', null, null, user.fullName)
    //     return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
    } else {
        return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
    }

}

async function genrateUniqueToken(token_: string) {
    let token = token_;
    let count = 0;
    while (true) {
        const token_ = await Token.findOne({token: token});
        if (!token_) break;
        count += 1;
        token = token_ + count;
    }
    return token;
}

async function verifyOTP(req: Request, res: Response) {
    const otp = req.body.otp;
    const device = req.body.device;
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let find_filed;
    if (email) {
        find_filed = {email: email};
    } else {
        find_filed = {mobile: mobile};
    }

    const user = await User.findOne(find_filed).exec();
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    if (mobile) {
        // comment for now 
        // const [success, err] = [otp === "1111", false]
        const [success, err] = await Phone.verifyPhoneOtp(mobile, otp)
        if (success) {
            /* const token = await Token.findOne({userId: new mongoose.Types.ObjectId(user._id), device: device, forSignUp: false});
             if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);

             token.isVerified = true;
             await token.save();*/

            return commonUtils.sendSuccess(req, res, {}, 200);
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 409);
            // return commonUtils.sendError(req, res, {message: err === "Authenticate" ? AppStrings.INCORRECT_OTP : err}, 409);
        }
    } else {
        const token = await Token.findOne({
            userId: new mongoose.Types.ObjectId(user._id),            
            device: device,
            forSignUp: false
        });
        if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);

        // increase request count
        token.requestCount += 1;
        await token.updateOne({requestCount: token.requestCount});

        // check if otp is valid
        if (token.requestCount > 3) return commonUtils.sendError(req, res, {message: AppStrings.OTP_REQUEST_LIMIT}, 400);
        if (token.isVerified) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED}, 400);
        if (token.otp !== otp) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_OTP}, 400);

        token.isVerified = true;
        await token.save();

        return commonUtils.sendSuccess(req, res, {token: token.token}, 200);
    }

}

// send email to user verify singup 
async function signupVerifyOTP(req: Request, res: Response) {
    const otp = req.body.otp;
    const device = req.body.device;
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let find_filed;
    if (email) {
        find_filed = {email: email};
    } else {
        find_filed = {mobile: mobile};
    }

    const user = await User.findOne(find_filed).exec();
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    if (email) {
        if (user.isVerify) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED})
    }

    if (email) {
        // comment for now
        // const [success, err] = [otp === "1111", false]
        // const [success, err] = await Phone.verifyPhoneOtp(mobile, otp)
        // console.log(success);

        // if (err) {
        //     return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 409);
        //     // return commonUtils.sendError(req, res, {message: err === "Authenticate" ? AppStrings.INCORRECT_OTP : err}, 409);
        // }
        // if (success) {
        //     user.isVerify = 1;
        //     await user.save();
        //     await Token.findOneAndUpdate({
        //         userId: new mongoose.Types.ObjectId(user._id),
        //         device: device,
        //         forSignUp: true
        //     }, {$set: {isVerified: true}})
        // }
        const token = await Token.findOne({userId: user._id,device: device,forSignUp: true});
        if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);
        // increase request count
        token.requestCount += 1;
        await token.updateOne({requestCount: token.requestCount});
    
        // check if otp is valid
        if (token.requestCount > 3) return commonUtils.sendError(req, res, {message: AppStrings.OTP_REQUEST_LIMIT}, 400);
        if (token.isVerified) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED}, 400);
        if (token.otp != otp) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_OTP}, 400);
    
        token.isVerified = true;
        await token.updateOne({isVerified: token.isVerified});
    
        user.isVerify = 1;
        await user.save()
    } 
   
    const response_ = await Auth.login(user._id, UserType.CUSTOMER, user.createdAt, device);

    res.cookie("accessToken", response_.accessToken, {maxAge: 900000, httpOnly: true});
    res.cookie("refreshToken", response_.refreshToken, {maxAge: 900000, httpOnly: true});

    const responseObj = {
        isProfileComplete: user.isProfileComplete,
        usertype: user.usertype,
        isVerify: user.isVerify,
        accessToken: response_.accessToken,
        user: {
            displayName: user.fullName,
            userName: user.userName,
            _id: user._id,
            email: user.email,
            mobile: user.mobile,
            profilePic: user.image.profilePic ?? null
        },
    }
    return commonUtils.sendSuccess(req, res, responseObj);
}

async function changeRequest(req: any, res: Response) {
    const userid = req.headers.userid
    const businessId = req.body.businessId ?? ""
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const device = req.body.device;

    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    const userData = await User.findOne({email: email, mobile: mobile})
    console.log(userData);

    if (userData) {
        return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_ALREADY_EXITS})
    }

    const token = await Token.findOne({userid: new mongoose.Types.ObjectId(userid)})

    if (token?.requestCount > 3) {
        let change = await ChangeRequest.findOne({userId: userid})
        await change.delete();
    }
    
    let filterExists: {}

    if (email) {
        filterExists = {
            email: email,
            type: 1
        }
    } else {
        filterExists = {
            mobile: mobile,
            type: 2
        }
    }

    if (businessId) {
        filterExists = {
            ...filterExists, ...{
                businessId: businessId
            }
        }
    }

    let emailReq = await ChangeRequest.count(filterExists)
    if (emailReq > 0) {
        return commonUtils.sendError(req, res, {
            message: AppStrings.REQUEST_ALREADY_SENT
        })
    }
    let changeRequest = ChangeRequest()

    changeRequest.userId = userid
    if (businessId)
        changeRequest.businessId = businessId

    if (email) {
        changeRequest.email = email
        changeRequest.type = 1
    } else {
        changeRequest.mobile = mobile
        changeRequest.type = 2
    }

    await changeRequest.save();

    let user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userid)
    })

    if (email) {
        changeRequest.otp = await sendVerifyOTP(userid, email, device, 'email', "forChange", 'Your otp has been verified', businessId, null, user.fullName)
        await changeRequest.save()
        await sendVerifyOTP(userid, email, device, 'email', "forChange", 'Your otp has been verified', businessId, null, user.fullName)
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
    } else if (mobile) {
        // changeRequest.otp = await sendVerifyOTP(user._id, mobile, device, 'mobile', "forChange", 'Your Otp has been verified', businessId, null, user.fullName)
        // await changeRequest.save()
        // await sendVerifyOTP(user._id, mobile, device, 'mobile', "forChange", 'Your Otp has been verified', businessId, null, user.fullName)
        return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
    } else {
        return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
    }
}

async function changeNameRequest(req: any, res: Response) {
    const userid = req.headers.userid
    const userName = req.body.userName?.[UserData.USERNAME.toString()];
    const businessId = req.body.businessId ?? ""
    const choice = req.body.choice
    const device = req.body.device

    let user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userid)
    })

    const token = await Token.findOne({userid: new mongoose.Types.ObjectId(userid)})

    if (token?.requestCount > 3) {
        let change = await ChangeRequest.findOne({userId: userid})
        await change.delete();
    }

    let filterExists = {
        name: userName,
        type: 3
    }

    if (businessId) {
        filterExists = {
            ...filterExists,
            ...{
                businessId: businessId
            }
        }
    }

    let nameReq = await ChangeRequest.count(filterExists)
    if (nameReq > 0) {
        return commonUtils.sendError(req, res, {
            message: AppStrings.REQUEST_ALREADY_SENT
        })
    }

    let changeRequest = ChangeRequest()
    changeRequest.userId = userid
    if (businessId) changeRequest.businessId = businessId
    changeRequest.name = userName
    changeRequest.type = 3

    await changeRequest.save();

    if (businessId) {
        let business = await Business.findOne({
            _id: new mongoose.Types.ObjectId(businessId)
        })

        if (choice == 1) {
            changeRequest.otp = await sendVerifyOTP(userid, business.email, device, 'email', "forChange", 'Your otp has been verified', businessId, null, user.fullName)
            await changeRequest.save()
            return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
        } else if (choice == 2) {
            // await sendVerifyOTP(userid, business.mobile, device, 'mobile', "forChange", 'Your Otp has been verified', businessId, null, user.fullName)
            return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
        }
    } else {
        let user = await User.findOne({
            _id: new mongoose.Types.ObjectId(userid)
        })

        if (choice == 1) {
            changeRequest.otp = await sendVerifyOTP(userid, user.email, user.device, 'email', "forChange", 'Your otp has been verified', businessId, null, user.fullName)
            await changeRequest.save()

            return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_MAIL})
        } else if (choice == 2) {
        //     await sendVerifyOTP(user._id, user.mobile, user.device, 'mobile', "forChange", 'Your Otp has been verified', businessId, null, user.fullName)
            return commonUtils.sendSuccess(req, res, {message: AppStrings.CHECK_PHONE})
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
        }
    }
}

async function verifyNameChangeOTP(req: Request, res: Response) {
    let userid = req.headers.userid
    const otp = req.body.otp;
    const businessId = req.body.businessId;
    const device = req.body.device;
    const choice = req.body.choice;
    const mobile = req.body.userName[UserData.MOBILE.toString()];
    const email = req.body.userName[UserData.EMAIL.toString()];
    const token = req.body?.token

    

    let find_filed = {
        userId: new mongoose.Types.ObjectId(userid.toString()),
        type: 3
    };

    if (businessId) {
        find_filed = {
            ...find_filed, ...{
                businessId: businessId
            }
        }
    }

    const changeRequest = await ChangeRequest.findOne(find_filed).exec();
    const user = await User.findOne({_id:changeRequest.userId});
    if (!changeRequest) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    // const [success, err] = (choice == 2) ? await Phone.verifyPhoneOtp(mobile, otp) : [otp == changeRequest.otp, false]

    if (choice == 2 && token) {
        getAuth().verifyIdToken(token)
            .then(async (decodedToken: any) => {
                const uid = decodedToken.uid;
               
                if (businessId) {
                    await Business.findOneAndUpdate({
                        _id: new mongoose.Types.ObjectId(changeRequest.businessId)
                    }, {
                       $set : { name: changeRequest.name}
                    })
                    await Address.findOneAndUpdate({
                        businessId: new mongoose.Types.ObjectId(businessId), primaryAddress: true
                    }, { 
                        $set : { businessName: changeRequest.name}
                    })
                } else {
                    await User.findOneAndUpdate({
                        _id: new mongoose.Types.ObjectId(changeRequest.userId)
                    }, {
                        $set: { fullName: changeRequest.name}
                    })
                }
                await changeRequest.delete()
                eventEmitter.emit("updateChatUser", {
                    "userId": user._id,
                    "name": changeRequest.name ?? "",
                    "image": user.image?.profilePic ?? "",
                })
                return commonUtils.sendSuccess(req, res, {}, 200);
            
            })
            .catch((error: any) => {
                // Handle error
                console.log(error);
            });
    } else {
        
        const token = await Token.findOne({userId: userid,device: device});
        if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);
        // increase request count
        token.requestCount += 1;
        await token.updateOne({requestCount: token.requestCount});
    
        // check if otp is valid
        if (token.requestCount > 3) return commonUtils.sendError(req, res, {message: AppStrings.OTP_REQUEST_LIMIT}, 400);
        if (token.isVerified) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED}, 400);
        if (token.otp != otp) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_OTP}, 400);

        if (businessId) {
            await Business.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(changeRequest.businessId)
            }, {
                $set : { name: changeRequest.name}
            })
            await Address.findOneAndUpdate({
                businessId: new mongoose.Types.ObjectId(businessId), primaryAddress: true
            }, { 
                $set : { businessName: changeRequest.name}
            })
        } else {
            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(changeRequest.userId)
            }, {
                $set: { fullName: changeRequest.name}
            })
        }
        await changeRequest.delete()

        return commonUtils.sendSuccess(req, res, {}, 200);
    }

}

async function verifyChangeOTP(req: Request, res: Response) {
    const otp = req.body.otp;
    const businessId = req.body.businessId;
    const device = req.body.device;
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const token = req.body?.token


    if (!email && !mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let find_filed;
    if (email) {
        find_filed = {email: email};
    } else {
        find_filed = {mobile: mobile};
    }

    if (businessId) {
        find_filed = {
            ...find_filed,
            ...{
                businessId: businessId
            }
        }
    }
    

    const changeRequest = await ChangeRequest.findOne(find_filed).exec();
    
    if (!changeRequest) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);

    if (mobile && token) {
        // comment for now
        // const [success, err] = [otp === "1111", false]
        // const [success, err] = await Phone.verifyPhoneOtp(mobile, otp)

        getAuth().verifyIdToken(token)
        .then(async (decodedToken: any) => {
            
            const uid = decodedToken.uid;

            
                // const token = await Token.findOne({
                //     userId: new mongoose.Types.ObjectId(changeRequest.userId),
                //     device: device,
                //     forForgot: false
                // });
                // if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);
                // token.isVerified = true;
                // await token.deleteOne();
    
                if (businessId) {
                    await Business.findOneAndUpdate({
                        _id: new mongoose.Types.ObjectId(changeRequest.businessId)
                    }, {
                        $set: {mobile: changeRequest.mobile}
                    })
    
                    await Address.updateOne({
                        businessId: new mongoose.Types.ObjectId(businessId),
                        primaryAddress: true
                    }, {
                        $set: {
                            mobile: changeRequest.mobile
                        }
                    })
                } else {
                    await User.findOneAndUpdate({
                        _id: new mongoose.Types.ObjectId(changeRequest.userId)
                    }, {
                        $set: {mobile: changeRequest.mobile}
                    })
                }
    
                await changeRequest.deleteOne()
    
                return commonUtils.sendSuccess(req, res, {token: token.token}, 200);
            })
        .catch((error: any) => {
            // Handle error
            console.log(error);
        });
    } else {
        const token = await Token.findOne({
            userId: changeRequest.userId,            
            device: device,
            forSignUp: false
        });
        if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);

        // increase request count
        token.requestCount += 1;
        await token.updateOne({requestCount: token.requestCount});

        // check if otp is valid
        if (token.requestCount > 3) return commonUtils.sendError(req, res, {message: AppStrings.OTP_REQUEST_LIMIT}, 400);
        if (token.isVerified) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED}, 400);
        if (token.otp !== otp) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_OTP}, 400);

        token.isVerified = true;
        await token.save();

        if (businessId) {
            await Business.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(changeRequest.businessId)
            }, {
                $set: {email: changeRequest.email}
            })

            await Address.updateOne({
                businessId: new mongoose.Types.ObjectId(businessId),
                primaryAddress: true
            }, {
                $set: {
                    email: changeRequest.email
                }
            })
        } else {
            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(changeRequest.userId)
            }, {
                $set: {email: changeRequest.email}
            })
        }

        await changeRequest.delete()

        return commonUtils.sendSuccess(req, res, {token: token.token}, 200);
    }

}

async function verifyBusiness(req: Request, res: Response) {

    const otp = req.body?.otp
    const businessId = req.body.businessId
    const device = req.body.device
    const choice = req.body.choice
    const userId = req.headers.userid?.toString() ?? ""
    const mobile = req.body?.mobile
    const email = req.body?.email
    const token = req.body?.token


    if (choice == 2 && token) {

        
        const business = await Business.findOne({
            _id: new mongoose.Types.ObjectId(businessId)
        }).select("_id mobile")

        
    getAuth().verifyIdToken(token)
        .then(async(decodedToken: any) => {
            
            const uid = decodedToken.uid;
          
            const business = await Business.findOne({mobile: decodedToken.phone_number })
            
            if (business) {
                await Business.updateOne({
                    _id: new mongoose.Types.ObjectId(businessId)
                }, {
                    isMobileVerified: 1,
                })
    
                await Address.updateOne({
                    businessId: new mongoose.Types.ObjectId(businessId)
                },{
                    mobile: mobile
                })
                return commonUtils.sendSuccess(req, res, {}, 200);
    
            } else {
                return commonUtils.sendError(req, res, {message: AppStrings.INVALID_TOKEN}, 400);
            }
        })
        .catch((error: any) => {
            // Handle error
            console.log(error);
        });

        // if (success) {
        //     await Business.updateOne({
        //         _id: new mongoose.Types.ObjectId(businessId)
        //     }, {
        //         isMobileVerified: 1,
        //     })

        //     await Address.updateOne({
        //         businessId: new mongoose.Types.ObjectId(businessId)
        //     },{
        //         mobile: mobile
        //     })
        //     return commonUtils.sendSuccess(req, res, {}, 200);

        // } else {
        //     return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);
        // }

    } else {
        const token = await Token.findOne({
            userId: userId,
            businessId: businessId,
            otp: otp,
            choice: choice,
            device: device,
            forSignUp: false
        });


        if (!token) return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 400);

        /*// increase request count
        token.requestCount += 1;
        await token.updateOne({requestCount: token.requestCount});

        // check if otp is valid
        if (token.requestCount > 3) return commonUtils.sendError(req, res, {message: AppStrings.OTP_REQUEST_LIMIT}, 400);
        if (token.isVerified) return commonUtils.sendError(req, res, {message: AppStrings.OTP_ALREADY_VERIFIED}, 400);*/
        if (token.otp !== otp) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_OTP}, 400);

        token.isVerified = true;
        await token.deleteOne();

        await Business.updateOne({
            _id: new mongoose.Types.ObjectId(businessId)
        }, choice == 1 ? {
            isEmailVerified: 1
        } : {
            isMobileVerified: 1,
        })

        await Address.updateOne({
            businessId: new mongoose.Types.ObjectId(businessId)
        },{
            email: email
        })
        
        return commonUtils.sendSuccess(req, res, {token: token.token}, 200);
    }


}


async function requestOptional(req: Request, res: Response) {

    const userid: any = req.headers.userid
    const businessId = req.body?.businessId ?? ""
    const device = req.body.device
    const mobileType = req.body.mobileType // type 1 for secondary 2 for alternative
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];


    let user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userid)
    })


    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);
    
    if (businessId == '') {
        
        if (user.optionalMobile.secondary == mobile || user.optionalMobile.alternative == mobile) {
            return commonUtils.sendError(req, res, { message: AppStrings.MOBILE_EXISTS})
        }
    } else {
        let business = await Business.findOne({_id: new mongoose.Types.ObjectId(businessId)})
        if (business.optionalMobile.secondary == mobile || business.optionalMobile.alternative == mobile) {
            return commonUtils.sendError(req, res, { message: AppStrings.MOBILE_EXISTS})
        }
    }

    let filterExists = {
        $or: [ { mobileType: mobileType }, { optionalMobile: mobile,type: 2,} ]
        // mobileType: mobileType
    }

    // if (mobileType) {
    //     filterExists = {
    //         ...filterExists,
    //         ...{
    //             mobileType: mobileType
    //         }
    //     }
    // }

    if (businessId) {
        filterExists = {
            ...filterExists,
            ...{
                businessId: businessId
            }
        }
    }

    let nameReq = await ChangeRequest.count(filterExists)
    if (nameReq > 0) {
        return commonUtils.sendError(req, res, {
            message: AppStrings.REQUEST_ALREADY_SENT
        })
    }

    let changeRequest = ChangeRequest()

    if (mobileType == 1) {
        changeRequest.userId = userid
        if (businessId) changeRequest.businessId = businessId
        changeRequest.optionalMobile = mobile // secondary
        changeRequest.type = 2
        changeRequest.mobileType = mobileType
    } else if (mobileType == 2) {
        changeRequest.userId = userid
        if (businessId) changeRequest.businessId = businessId
        changeRequest.optionalMobile = mobile // secondary
        changeRequest.type = 2
        changeRequest.mobileType = mobileType
    }

    await changeRequest.save();

    if (businessId) {
        let business = await Business.findOne({
            _id: new mongoose.Types.ObjectId(businessId)
        })
    
        if (mobile) {
            return commonUtils.sendSuccess(req, res, { message: AppStrings.CHECK_PHONE})
        } else {
            return commonUtils.sendError(req, res, { message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
        }

    } else {
        let user = await User.findOne({
            _id: new mongoose.Types.ObjectId(userid)
        })

        if (mobile) {
            return commonUtils.sendSuccess(req, res, { message: AppStrings.CHECK_PHONE})
        }else{
            return commonUtils.sendError(req, res, { message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
        }
    }

    // await sendVerifyOTP(user._id, mobile, device, 'mobile', "forChange", 'Your Otp has been verified', null, null, user.fullName)
}


async function verifyOptional(req: Request, res: Response) {

    const userid : any= req.headers.userid
    const businessId = req.body.businessId ?? ""
    const device = req.body.device
    const mobileType = req.body.mobileType // type 1 for secondary 2 for alternative
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const token = req.body.token
    

    if (!mobile) return commonUtils.sendError(req, res, {message: AppStrings.EMAIL_MOBILE_REQUIRED}, 400);

    let user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userid)
    })
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);
    let find_filed = {
        userId: new mongoose.Types.ObjectId(userid.toString()),
        type: 2,
        mobileType: mobileType
    };

    if (businessId) {
        find_filed = {
            ...find_filed, ...{
                businessId: businessId
            }
        }
    }

    const changeRequest = await ChangeRequest.findOne(find_filed).exec();
    if (!changeRequest) return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH}, 409);


    if (mobile && token) {
        getAuth().verifyIdToken(token)
            .then(async (decodedToken: any) => {
                const uid = decodedToken.uid;
                if (mobileType == 1) {
                    if (businessId) {
                        await Business.findOneAndUpdate({
                            _id: new mongoose.Types.ObjectId(changeRequest.businessId)
                        }, {
                           $set : { 'optionalMobile.secondary': changeRequest.optionalMobile}
                        })
                    } else {
                        await User.findOneAndUpdate({
                            _id: new mongoose.Types.ObjectId(changeRequest.userId)
                        }, {
                            $set : { 'optionalMobile.secondary': changeRequest.optionalMobile}
                        })
                    }
                    await changeRequest.delete()
            
                    return commonUtils.sendSuccess(req, res, {}, 200);
                } else {
                    if (businessId) {
                        await Business.findOneAndUpdate({
                            _id: new mongoose.Types.ObjectId(changeRequest.businessId)
                        }, {
                           $set : { 'optionalMobile.alternative': changeRequest.optionalMobile}
                        })
                    } else {
                        await User.findOneAndUpdate({
                            _id: new mongoose.Types.ObjectId(changeRequest.userId)
                        }, {
                            $set : { 'optionalMobile.alternative': changeRequest.optionalMobile}
                        })
                    }
                    await changeRequest.delete()
            
                    return commonUtils.sendSuccess(req, res, {}, 200);
                }
            
            })
            .catch((error: any) => {
                // Handle error
                console.log(error);
            });
    } else{

        return commonUtils.sendError(req, res, {message: AppStrings.USER_CREDENTIAL_DOES_NOT_MATCH})
    }
    
    // const [success, err] = await Phone.verifyPhoneOtp(mobile, otp)
    // if (success) {

    //     // update

    //     return commonUtils.sendSuccess(req, res, {
    //         message: AppStrings.OTP_VERIFIED
    //     }, 200);
    // } else {
    //     return commonUtils.sendError(req, res, {message: AppStrings.INCORRECT_OTP}, 409);
    //     // return commonUtils.sendError(req, res, {message: err === "Authenticate" ? AppStrings.INCORRECT_OTP : err}, 409);
    // }

}


async function checkUnique(req: any, res: Response) {
    return commonUtils.sendSuccess(req, res, {});
}

export default {
    register,
    login,
    guestLogin,
    methodAllowance,
    forgotPassword,
    changePassword,
    getOTP,
    verifyOTP,
    signupVerifyOTP,
    resendOTP,
    checkUnique,
    changeRequest,
    changeNameRequest,
    verifyChangeOTP,
    verifyNameChangeOTP,
    sendVerifyOTP,
    verifyBusiness,
    getVerifyOTP,
    requestOptional,
    verifyOptional
};