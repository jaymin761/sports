import { AppStrings } from "../../../utils/appStrings";

const config = require('config');
const Twilio = require('twilio');
let twilioClient = new Twilio(
    config.get('TWILIO_API_KEY'), config.get('TWILIO_API_SECRET'), { accountSid: config.get('TWILIO_ACCOUNT_SID'), }
);

const client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'), config.get('TWILIO_AUTH_TOKEN'));
const Admin = require("../models/admin");
const User = require("../../users/models/userModel");
const Role = require("../models/role");
const Trust = require("../models/trustModel");
import { NextFunction, query, Request, Response } from "express";
import commonUtils, { fileFilter, fileStoragePdf, fileFilterPdf, fileStorage } from "../../../utils/commonUtils";
import Auth from "../../../auth";
import { AdminRole, FriendStatus, NotificationType, TrustStatus, UserType } from "../../../utils/enum";
import { AppConstants } from "../../../utils/appConstants";
import mongoose, { ObjectId } from "mongoose";
import trustController from "../../trust/trustController";
import eventEmitter from "../../../utils/event";

const bcrypt = require("bcryptjs");
const multer = require("multer");
const Trace = require('../../users/models/traceUser');
const Employee = require('../../employee/employeeModel');
const Friends = require('../../userLink/models/friends');
const Business = require('../../business/models/businessModel');
const Category = require('../../admin/models/category');
const TraceRequest = require('../../users/models/requestModel');
const Address = require('../../business/models/addressModel');
const UserHistory = require('../../admin/models/userHistory');
const Event = require('../../event/models/eventModel');
const DeleteRequest = require('../../users/models/userDeleteRequest');
const ReportIssue = require('../../raiseIssue/models/reportToModel');

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

// TODO: Subadmin Update
async function adminUpdate(req: Request, res: Response) {
    const adminId = req.body.admin_id
    const admin = await Admin.findById(adminId)
    if (!admin) return commonUtils.sendAdminError(req, res, { message: "admin not found" }, 409)

    admin.username = req.body.username || admin.username;
    admin.email = req.body.email || admin.email;
    admin.adminrole = req.body.adminrole || admin.adminrole;
    admin.isActive = req.body.isActive || admin.isActive;
    admin.mobile = req.body.mobile || admin.mobile;
    admin.about = req.body.about || admin.about;

    await admin.save()
    return commonUtils.sendAdminSuccess(req, res, { message: "Admin Updated successfully", id: admin._id })
}

// TODO: Change admin status active or inactive 
async function adminStatus(req: Request, res: Response) {
    const adminId = req.params.id
    const admin = await Admin.findById(adminId)
    if (!admin) return commonUtils.sendAdminError(req, res, { message: "admin not found" }, 409)

    admin.isActive = admin.isActive ? 0 : 1
    await admin.save()

    return commonUtils.sendAdminSuccess(req, res, { message: "Admin Status Change Successfully." })

}

// TODO: Admin Login
async function login(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    const device = req.body.device ?? 3;

    if (!email)
        return commonUtils.sendAdminError(req, res, { message: AppStrings.EMAIL_REQUIRED }, 400);

    const admin = await Admin.findOne({ email: email, isActive: false }).lean();
    if (admin)
        return commonUtils.sendAdminError(req, res, { message: "your account is inactive." }, 400);

    try {
        let find_filed;
        let message;
        if (email) {
            find_filed = { email: email };
            message = AppStrings.EMAIL_NOT_EXISTS;
        }

        const admin = await Admin.findOne(find_filed).lean();
        if (!admin)
            return commonUtils.sendAdminError(req, res, { message: message }, 409);

        const role = await Role.findOne({ _id: admin.adminrole })

        const valid_password = await bcrypt.compare(password, admin.password);
        if (!valid_password) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return commonUtils.sendAdminError(req, res, { message: AppStrings.INVALID_PASSWORD }, 409);
        }
        const { refreshToken, accessToken } = await Auth.login(admin._id, admin.adminrole, admin.createdAt, device);
        await Admin.findByIdAndUpdate(admin._id, { $set: { lastLogin: new Date() } }).exec();
        res.cookie("accessToken", accessToken, { maxAge: 900000, httpOnly: true });
        res.cookie("refreshToken", refreshToken, { maxAge: 900000, httpOnly: true });

        const responseObj = {
            role: admin.adminrole,
            permission: role.permission,
            accessToken: accessToken,
            user: {
                displayName: admin.username,
                id: admin._id,
                photoURL: admin.image ?? null
            },
        }

        return commonUtils.sendAdminSuccess(req, res, responseObj);

    } catch (error) {
        return commonUtils.sendAdminError(req, res, { error: error }, 409);
    }
}

// TODO: Subadmin delete
async function adminDelete(req: Request, res: Response) {
    const adminId = req.params.id

    await Admin.deleteOne({ _id: new mongoose.Types.ObjectId(adminId) })

    return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.ADMIN_DELETE })

}

// TODO: Super admin access to subadmin
async function loginAccess(req: Request, res: Response) {
    const admin_id = req.body.admin_id;
    const admin = await Admin.findOne({ _id: admin_id });
    const device = parseInt(req.headers.device as string) || 3;

    if (!admin)
        return commonUtils.sendAdminError(req, res, { message: AppStrings.ADMINID_INVALID }, 409);

    if (!admin.isActive)
        return commonUtils.sendAdminError(req, res, { message: AppStrings.NOT_ACTIVE }, 401);

    const { refreshToken, accessToken } = await Auth.login(admin._id, admin.adminrole, admin.createdAt, device);
    await Admin.findByIdAndUpdate(admin._id, { $set: { lastLogin: new Date() } }).exec();

    res.cookie("accessToken", accessToken, { maxAge: 900000, httpOnly: true });
    res.cookie("refreshToken", refreshToken, { maxAge: 900000, httpOnly: true });

    res.cookie("refreshToken", refreshToken, { httpOnly: false, secure: true, maxAge: 24 * 60 * 60 * 1000 });

    const responseObj = {
        role: admin.adminrole,
        accessToken: accessToken,
        user: {
            displayName: admin.username,
            id: admin._id,
            photoURL: admin.image ?? null
        },
    }

    return commonUtils.sendAdminSuccess(req, res, responseObj);
}

const getProfile = async (req: any, res: Response) => {
    const adminId = req.headers.userid;
    const pipline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(adminId)
            }
        },
        {
            $lookup: {
                from: 'roles',
                localField: 'adminrole',
                foreignField: '_id',
                as: 'roleData'
            }
        },
        { $unwind: { path: "$roleData", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                "_id": 0,
                "id": "$_id",
                "name": "$username",
                "email": "$email",
                "image": "$image",
                "mobile": "$mobile",
                "about": "$about",
                // "roleCode": "$adminrole",
                "adminrole": {
                    "id": "$roleData._id",
                    "name": "$roleData.name",
                },
                "status": { $cond: { if: "$isActive", then: "Active", else: "Deactive" } }
            }
        }
    ]
    const admin = await Admin.aggregate(pipline);
    return commonUtils.sendAdminSuccess(req, res, admin.length ? admin[0] : {});
}

// TODO: Admin assign role to user
const assignRole = async (req: any, res: Response) => {
    const admin_id = req.body.id;
    const updateData = {
        adminrole: req.body.adminRole,
        isActive: req.body.isActive
    }
    const data = await Admin.findByIdAndUpdate(admin_id, updateData)
    return commonUtils.sendAdminSuccess(req, res, data, 200);
}

async function checkUnique(req: any, res: Response) {
    return commonUtils.sendAdminSuccess(req, res, {});
}

async function methodAllowance(req: any, res: Response) {
    return commonUtils.sendAdminError(
        req,
        res,
        { message: "Request method now allowed." },
        405
    );
}

const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    const image_ = multer({
        storage: fileStorage,
        fileFilter: fileFilter,
    }).single("image");

    image_(req, res, async (err: any) => {
        if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);
        if (!req.file) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);
        const image_name = req.file.filename;
        return commonUtils.sendAdminSuccess(req, res, {
            image_url: image_name,
            message: AppStrings.IMAGE_UPLOADED
        });
    });
}

// admin listing not include admminrole=2
async function adminList(req: Request, res: Response) {
    const search = req.query.search;
    let filter: any = {};
    if (search) {
        filter = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { "roleData.name": { $regex: search, $options: "i" } },
            ]
        };
    }

    const pipline = [
        {
            $lookup: {
                from: 'roles',
                localField: 'adminrole',
                foreignField: '_id',
                as: 'roleData'
            }
        },
        { $unwind: { path: "$roleData", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        {
            $project: {
                "name": "$username",
                "id": "$_id",
                "email": "$email",
                "image": "$image",
                "mobile": "$mobile",
                "about": "$about",
                // "roleCode": "$adminrole",
                "adminrole": {
                    "id": "$roleData._id",
                    "name": "$roleData.name",
                },
                "status": { $cond: { if: "$isActive", then: "Active", else: "Deactive" } }
            }
        }
    ]
    const adminList = await Admin.aggregate(pipline);

    return commonUtils.sendAdminSuccess(req, res, adminList);
}

async function changePassword(req: any, res: Response) {
    const userId = req.headers.userid;
    const adminRole = req.headers.adminrole;
    const adminId = req.body.admin_id;
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    const admin = await Admin.findById(adminId).exec();
    if (!admin) return commonUtils.sendAdminError(req, res, { errors: { message: AppStrings.ADMIN_NOT_FOUND } }, 409);

    const valid_password = await bcrypt.compare(old_password, admin.password);
    if (!valid_password) return commonUtils.sendAdminError(req, res, { errors: { message: AppStrings.INVALID_PASSWORD } }, 409);

    if (adminRole !== AdminRole.SUPER_ADMIN && userId !== adminId) {
        return commonUtils.sendAdminError(req, res, { errors: { message: AppStrings.NOT_AUTHORIZED } }, 409);
    }
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(new_password, salt);
    await admin.save();

    return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.PASSWORD_CHANGED }, 200);
}

async function userDocumentList(req: Request, res: Response) {

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    // const total_ = await User.countDocuments();


    var total_ = await User.find({
        document: { $ne: null },
    }).sort({ createdAt: -1 }).countDocuments();


    var userData = await User.aggregate([
        {
            $match: {
                document: { $ne: null },
            }
        }, {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            userName: 1,
                            document: 1,
                        },
                    },
                ],
            },
        },
    ])
    return commonUtils.sendAdminSuccess(req, res, userData);

}

async function userImageVerify(req: Request, res: Response) {
    const userId = req.body.userId;
    const status = req.body.status;

    var userExitsOrNot = await User.findById(userId).exec();
    if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    userExitsOrNot.document.imageVerifyByAdmin = status
    await userExitsOrNot.save()

    return commonUtils.sendAdminSuccess(req, res, {});
}

const userList = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await User.countDocuments();
    const search = req.query.search;
    let filter: any = {};
    if (search) {
        filter = {
            $or: [
                { userName: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ]
        };
    }

    let userData = await User.aggregate([
        {
            $match: filter,
        },
        { $sort: { createdAt: -1 } },
        {
            $addFields: {
                emailVerify: { $cond: { if: "$email", then: 1, else: 0 } },
                mobileVerify: { $cond: { if: "$mobile", then: 1, else: 0 } },
            },
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },

                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            userName: 1,
                            email: 1,
                            mobile: 1,
                            createdAt: 1,
                            status: 1,
                            emailVerify: 1,
                            mobileVerify: 1,
                            trustLevel: 1,
                            averageTrust: 1,
                            isUserRejected: 1,
                            userTrace: 1,
                            fullName: 1
                        },
                    },
                ],
            },
        },

        { $sort: { createdAt: -1 } },
    ]);


    return commonUtils.sendAdminSuccess(req, res, userData);
};
const userStatusUpdate = (async (req: Request, res: Response) => {

    const userId = req.body.userId;
    const userExitsOrNot = await User.findById(userId).exec();
    if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);
    userExitsOrNot.status = userExitsOrNot.status == 1 ? 0 : 1
    await userExitsOrNot.save()
    return commonUtils.sendAdminSuccess(req, res, {});

})
const userEdit = (async (req: Request, res: Response) => {

    const userId: any = req.query.userId;

    // const userExitsOrNot = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) }).select('-password -device -__v').exec();
    // if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    // return commonUtils.sendAdminSuccess(req, res, userExitsOrNot);

    let pipeline: any = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $project: {
                _id: 1,
                document: "$document",
                optionalMobile: "$optionalMobile",
                image: "$image.profilePic",
                averageRating: "$averageRating",
                trustLevel: "$trustLevel",
                userName: "$userName",
                email: "$email",
                isVerify: "$isVerify",
                isProfileCmplt: "$isProfileCmplt",
                bio: "$bio",
                contacts: "$contacts",
                userStatus: "$userStatus",
                isProfileComplete: "$isProfileComplete",
                mobile: "$mobile",
                fullName: "$fullName",
                permissions: "$permissions",
                reference: "$reference",
                address: "$address",
                employee: "$employee",
                averageTrust: "$averageTrust",
                status: "$status",
                userTrace: "$userTrace",
                idVerifySelfie: "$idVerifySelfie",
                isMark: "$isMark"
            },
        },
    ];

    const response = await User.aggregate(pipeline)
    return commonUtils.sendSuccess(req, res, response)

})
const userUpdate = (async (req: Request, res: Response) => {

    const userId: any = req.body.user_id;

    const userExitsOrNot = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) }).select('-password -device -__v').exec();

    if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    // let trace = await Trace.find({userId: userId}).count();

    userExitsOrNot.userName = req.body.userName
    userExitsOrNot.address = {
        name: req.body.address.name,
        location: {
            type: "Point",
            coordinates: [req.body.address.longitude, req.body.address.latitude]
        },
    }
    userExitsOrNot.userStatus = req.body.userStatus
    userExitsOrNot.fullName = req.body.fullName
    userExitsOrNot.secondary = req.body.secondary
    userExitsOrNot.alternative = req.body.alternative

    // if (req.body.userTrace) {
    //     console.log(userExitsOrNot.userTrace)
    //     if (req.body.userTrace > trace) {
    //         userExitsOrNot.userTrace = req.body.userTrace
    //         await userExitsOrNot.save()
    //     }else {
    //         let msg = 'User have used ' + trace + ' user trace/track request already.'
    //         return commonUtils.sendError(req, res, {message: msg})
    //     }
    // }
    await userExitsOrNot.save()
    return commonUtils.sendAdminSuccess(req, res, {});

})

const userProfileUpdate = (async (req: Request, res: Response) => {
    try {
        const userId: any = req.body.user_id;
        const refs: any = req.body.reference;
        let reference: any = [];
        let trace = await Trace.find({ userId: userId }).count();
        const userExitsOrNot = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });

        if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        userExitsOrNot.image.profilePic = req.body.profilePic || userExitsOrNot.image.profilePic
        userExitsOrNot.optionalMobile = {
            "secondary": req.body.secondaryNumber || userExitsOrNot.optionalMobile.secondary,
            "alternative": req.body.alternativeNumber || userExitsOrNot.optionalMobile.alternative,
        }

        userExitsOrNot.document = {
            "idNumber": req.body.idNumber || userExitsOrNot.document.idNumber,
            "image": req.body.image || userExitsOrNot.document.image,
            // "homeAddress": {
            //     name: req.body.homeAddress.name || userExitsOrNot.homeAddress.name,
            //     location: {
            //         type: "Point",
            //         coordinates: [
            //             req.body.homeAddress.longitude,
            //             req.body.homeAddress.latitude
            //         ]
            //     },
            // }
        }
        userExitsOrNot.bio = req.body.bio || userExitsOrNot.bio
        userExitsOrNot.permissions = {
            location: {
                whileUsingApp: req.body.location?.whileUsingApp || userExitsOrNot.permissions.location.whileUsingApp,
                withLinkedContact: req.body.location?.withLinkedContact || userExitsOrNot.permissions.location.withLinkedContact,
                withPublic: req.body.location?.withPublic || userExitsOrNot.permissions.location.withPublic,
                notShared: req.body.location?.notShared || userExitsOrNot.permissions.location.notShared,
            },
            visibility: {
                picture: req.body.visibility?.picture || userExitsOrNot.permissions.visibility.picture,
                status: req.body.visibility?.status || userExitsOrNot.permissions.visibility.status,
                post: req.body.visibility?.post || userExitsOrNot.permissions.visibility.post,
            },
            acceptMessage: {
                public: req.body.acceptMessage?.public || userExitsOrNot.permissions.acceptMessage.public,
                contact: req.body.acceptMessage?.contact || userExitsOrNot.permissions.acceptMessage.contact,
                marketing: req.body.acceptMessage?.marketing || userExitsOrNot.permissions.acceptMessage.marketing,
            },

        }

        if (req.body.userTrace) {

            if (req.body.userTrace > trace) {
                userExitsOrNot.userTrace = req.body.userTrace
                await userExitsOrNot.save()
            } else {
                let msg = 'User have used ' + trace + ' user trace/track request already.'
                return commonUtils.sendError(req, res, { message: msg })
            }
        }

        /*await Promise.all(refs.map(async (element: any) => {
            const checkUser = await User.findOne({
                $or: [
                    {email: element.email},
                    {mobile: element.mobile},
                    {"optionalMobile.secondary": element.mobile},
                    {"optionalMobile.alternative": element.mobile},
                ],
            }).select("_id");
            const ref: any = {
                name: element?.name,
                email: element?.email,
                mobile: element?.mobile,
                isEndorsed: Recognise.PENDING
            }
            if (checkUser) ref.id = checkUser._id
            reference.push(ref)
        }))
        userExitsOrNot.reference = reference.length > 0 ? reference : userExitsOrNot.reference*/

        await userExitsOrNot.save()

        return commonUtils.sendAdminSuccess(req, res, {});
    } catch (error) {
        return commonUtils.sendAdminError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }

})

const imageUpload = (async (req: Request, res: Response) => {

    const image_ = multer({
        storage: fileStorage,
        fileFilter: fileFilter,
    }).single("image");

    image_(req, res, async (err: any) => {
        if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);
        if (!req.file) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);
        const image_name = req.file.filename;

        return commonUtils.sendSuccess(req, res, {
            imageName: image_name,
            message: AppStrings.IMAGE_UPLOADED
        }, 200);
    });
})

async function uploadFile(req: Request, res: Response) {
    const file = multer({
        storage: fileStoragePdf,
        fileFilter: fileFilterPdf,
    }).single("file");

    file(req, res, async (err: any) => {
        if (err) {
            return commonUtils.sendError(req, res, { message: AppStrings.FILE_NOT_UPLOADED }, 409);
        }
        if (!req.file) return commonUtils.sendError(req, res, { message: AppStrings.FILE_NOT_FOUND }, 404);
        const image_name = req.file.filename;
        return commonUtils.sendSuccess(req, res, {
            file: image_name
        }, 200);
    });
}

// TODO: Update password 
async function setting(req: Request, res: Response) {
    const adminId = req.headers.userid;
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    const admin = await Admin.findById(adminId)
    if (!admin) return commonUtils.sendAdminError(req, res, { message: "admin not found" })

    try {
        if (old_password) {
            const valid_password = await bcrypt.compare(old_password, admin.password);
            if (!valid_password)
                return commonUtils.sendError(req, res, { message: AppStrings.INVALID_PASSWORD }, 409);
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(new_password, salt);
        }
        admin.image = req.body?.image || admin.image
        admin.username = req.body?.username || admin.username
        admin.email = req.body?.email || admin.email
        admin.mobile = req.body?.mobile || admin.mobile

        await admin.save();

        return commonUtils.sendSuccess(req, res, admin)
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: Admin dashboard 
async function dashboard(req: Request, res: Response) {
    const user = await User.find().count();
    const business = await Business.find().count();
    const category = await Category.find({ parentId: { $exists: true, $ne: null } }).count();
    const trace = await TraceRequest.find({ status: 0 }).count();
    const event = await Event.find({ isBlockEvent: 1 }).count();
    const reportIssue = await ReportIssue.find().count();
    const deleteRequest = await DeleteRequest.find({ isDelete: 0 }).count();
    const businessRequest = await Business.find({ isApprove: 0 }).count();


    return commonUtils.sendSuccess(req, res, {
        User: user,
        Business: business,
        Category: category,
        TraceRequest: trace,
        Event: event,
        ReportIssue: reportIssue,
        DeleteRequest: deleteRequest,
        BusinessRequest: businessRequest
    }, 200);

}

// TODO: List of business
async function listBusiness(req: Request, res: Response) {
    // let business = await Business.find({isApprove:0}).sort({ createdAt: -1 })

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const type = req.query.type ? parseInt(req.query.type as string) : null;
    const search = req.query.search

    let filter: any = {};
    let filterName: any = {};

    if (search) {
        filterName = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { "userData.fullName": { $regex: search, $options: "i" } },
            ]
        };
    }
    if (type || type == 0) {
        filter = {
            isApprove: type,
        };
    }

    var total_ = await Business.count({
        $and: [filter],
    })

    const business = await Business.aggregate([
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        {
            $match: {
                $and: [filter],
                ...filterName
            },
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'businessCategory',
                foreignField: '_id',
                as: 'categoryData'
            }
        },
        { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [{ $skip: skip_ }, { $limit: limit_ },
                {
                    $project: {
                        _id: 0,
                        "id": '$_id',
                        "userId": 1,
                        "userName": "$userData.fullName",
                        "userMobile": "$userData.mobile",
                        "userEmail": "$userData.email",
                        "averageTrust": "$userData.averageTrust",
                        "businessCategory": 1,
                        "categoryName": "$categoryData.name",
                        "chatPermissions": "$chatPermissions",
                        "name": 1,
                        "businessStatus": 1,
                        "bio": 1,
                        "mobile": 1,
                        "image": 1,
                        "email": 1,
                        "address": 1,
                        "optionalMobile": 1,
                        "isApprove": 1,
                        "createdAt": 1,
                        "isMobileVerified": 1,
                        "isEmailVerified": 1,
                        "document": 1
                    }
                }]
            }
        },
    ])
    return commonUtils.sendSuccess(req, res, business)
}

// TODO: Admin can approve or reject business(Send via mail and mobile)
async function businessApproved(req: Request, res: Response) {
    let businessId = req.params.id
    let business = await Business.findOne({ _id: businessId });

    if (!business)
        return commonUtils.sendError(req, res, { message: AppStrings.BUSINESS_NOT_FOUND })

    let user = await User.findOne({ _id: new mongoose.Types.ObjectId(business.userId) })

    if (req.body.isApprove == 1) {
        business.isApprove = req.body.isApprove;
        if (business.email) {
            eventEmitter.emit("send_email_business", {
                to: business.email,
                subject: "your business has been approved",
                data: {
                    fullName: user.fullName,
                    businessName: business.name,
                    email: business.email,
                    isApprove: business.isApprove,
                    message: "your business has been approved",
                },
            });
        } else if (business.mobile) {
            var client = require('twilio')(
                config.TWILIO_ACCOUNT_SID,
                config.TWILIO_AUTH_TOKEN
            );
            var demo = await client.messages.create({
                body: 'dear business, your request for the' + business.name + ' has been approved by the admin.',
                from: config.TWILIO_NUMBER,
                to: business.mobile
            });
        }
        await business.save();
        return commonUtils.sendSuccess(req, res, { message: AppStrings.BUSINESS_APPROVED })
    } else if (req.body.isApprove == 2) {
        business.isApprove = req.body.isApprove;
        business.rejectReason = req.body.rejectReason;
        if (business.email) {
            eventEmitter.emit("send_email_business", {
                to: business.email,
                subject: "your business has been rejected",
                data: {
                    fullName: user.fullName,
                    businessName: business.name,
                    email: business.email,
                    rejectReason: business.rejectReason,
                    isApprove: business.isApprove,
                    message: "your business has been rejected",
                },
            });
        } else if (business.mobile) {
            var client = require('twilio')(
                config.TWILIO_ACCOUNT_SID,
                config.TWILIO_AUTH_TOKEN
            );
            var demo = await client.messages.create({
                body: 'dear business, your request for the' + business.name + ' has been rejecte by the admin, for reason' + business.rejectReason + '',
                from: config.TWILIO_NUMBER,
                to: business.mobile
            });
        }
        await business.save();
        return commonUtils.sendSuccess(req, res, { message: AppStrings.BUSINESS_REJECTED })
    }
}

async function userBusinessList(req: Request, res: Response) {

    let userId = req.params.id

    const pipline = [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        // {
        //     $lookup: {
        //         from: 'addresses',
        //         localField: 'userId',
        //         foreignField: 'userId',
        //         as: 'addressObj'
        //     }
        // },
        {
            $project: {
                "id": "$_id",
                "userId": "$userId",
                "name": "$name",
                "email": "$email",
                "mobile": "$mobile",
                "optionalMobile": "$optionalMobile",
                "image": "$image",
                "businessCategory": "$businessCategory",
                "bio": "$bio",
                "address": "$address",
                "businessStatus": "$businessStatus",
                "isMobileVerified": "$isMobileVerified",
                "isEmailVerified": "$isEmailVerified",
                // "addresses": "$addressObj",
            }
        }
    ]

    const business = await Business.aggregate(pipline);

    return commonUtils.sendSuccess(req, res, business);

}

// TODO: Admin update user business
async function businessUpdate(req: Request, res: Response) {

    const businessId = req.params.id

    const business = await Business.findById(businessId);

    if (!business) return commonUtils.sendError(req, res, { message: AppStrings.BUSINESS_NOT_FOUND }, 409);

    try {
        business.name = req.body.name || business.name;
        business.image = req.body.image || business.image;
        business.businessCategory = req.body.categoryId || business.businessCategory;
        // business.mobile = req.body.mobile || business.mobile;
        // business.email = req.body.email || business.email;
        //     business.address = {
        //         name: req.body.address.name || business.address.name,
        //         location: {
        //             type: "Point",
        //             coordinates: (req.body.address.longitude && req.body.address.latitude) ? [req.body.address.longitude, req.body.address.latitude] : business.coordinates,
        //         },
        // };
        business.bio = req.body.bio || business.bio;
        business.optionalMobile.secondary = req.body.secondary || business.optionalMobile.secondary;
        business.optionalMobile.alternative = req.body.alternative || business.optionalMobile.alternative;
        business.businessStatus = req.body.businessStatus || business.businessStatus;
        business.permissions = req.body.permissions || business.permissions;
        business.chatPermissions = req.body.chatPermissions || business.chatPermissions;

        await business.save();
        return commonUtils.sendSuccess(req, res, { message: AppStrings.UPDATE });
    }
    catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }

}

async function userRejected(req: Request, res: Response) {
    let userId = req.params.id
    let user = await User.findOne({ _id: userId })
    if (!user)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

    user.isUserRejected = user.isUserRejected ? 0 : 1;

    await user.save();

    return commonUtils.sendSuccess(req, res, { message: AppStrings.STATUS_UPDATED_SUCCESSFULLY })
}

// TODO: Admin added business address
async function businessAddressAdd(req: Request, res: Response) {
    let businessId = req.body.businessId;
    const business = await Business.findById(businessId)
    if (!business) return commonUtils.sendError(req, res, { error: AppStrings.BUSINESS_NOT_FOUND })

    const address = new Address({
        userId: req.body.userId,
        businessId: businessId,
        businessName: req.body.businessName,
        businessLocationName: req.body.businessLocationName,
        physicalAddress: req.body.physicalAddress,
        image: business.image,
        location: {
            type: "Point",
            coordinates: [req.body?.longitude, req.body?.latitude]
        },
        categoryId: new mongoose.Types.ObjectId(business.businessCategory),
        description: req.body.description,
        email: req.body.email,
        mobile: req.body.mobile
    });

    await address.save();
    return commonUtils.sendSuccess(req, res, address);
}

// TODO: Admin update business addres
async function businessAddressUpdate(req: any, res: Response) {
    let businessId = req.body.businessId;
    let userId = req.body.userId
    if (!req.body.id) {
        return commonUtils.sendError(req, res, { message: AppStrings.INVALID_DATA }, 409);
    }
    const addressCheck = await Address.findOne({ _id: req.body.id, userId: userId, businessId: businessId }).exec();
    if (!addressCheck) return commonUtils.sendError(req, res, { message: AppStrings.ADDRESS_NOT_FOUND }, 409);

    let updateAddressData = {
        businessName: req.body?.businessName || addressCheck.addressCheck,
        businessLocationName: req.body?.businessLocationName || addressCheck.businessLocationName,
        physicalAddress: req.body?.physicalAddress || addressCheck.physicalAddress,
        location: {
            type: "Point",
            coordinates: (req.body.longitude && req.body.latitude) ? [req.body.longitude, req.body.latitude] : addressCheck.coordinates,
        },
        description: req.body?.description || addressCheck.description,
        email: req.body?.email || addressCheck.email,
        mobile: req.body?.mobile || addressCheck.mobile
    }

    await Address.findByIdAndUpdate(req.body.id, updateAddressData).exec();

    return commonUtils.sendSuccess(req, res, { message: AppStrings.BUSINESS_UPDATED_SUCCESSFULLY });
}

// TODO: Admin delete business addres
async function deleteBusinessAddress(req: any, res: Response) {
    const addressId = req.params.id as string;
    try {
        await Address.deleteOne({
            _id: new mongoose.Types.ObjectId(addressId),
        });
        return commonUtils.sendSuccess(req, res, { message: AppStrings.DELETE }, 200);
    } catch (error) {
        return commonUtils.sendError(req, res, { error: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function businessAddressList(req: any, res: Response) {
    let businessId = req.params.id

    try {
        let addresses = await Address.find({ businessId: new mongoose.Types.ObjectId(businessId) });
        return commonUtils.sendSuccess(req, res, addresses)
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

async function employeeList(req: any, res: Response) {
    let businessId = req.params.id
    try {
        // let employee = await Employee.find({businessId: new mongoose.Types.ObjectId(businessId)})
        const pipline = [
            { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'userObj'
                }
            },
            {
                $unwind: {
                    path: '$userObj',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'businesses',
                    localField: 'businessId',
                    foreignField: '_id',
                    as: 'businessObj'
                }
            },
            {
                $unwind: {
                    path: '$businessObj',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "_id": 0,
                    "id": "$_id",
                    "userId": "$userId",
                    "businessId": "$businessId",
                    "businessName": "$businessObj.name",
                    "name": "$userObj.fullName",
                    "email": "$userObj.email",
                    "mobile": "$userObj.mobile",
                    "image": "$userObj.image.profilePic",
                    "workHours": "$workHours",
                    "designation": "$designation",
                    "available": "$available",
                    "address": "$userObj.address",
                    "status": "$status",
                    "authorized": "$authorized",
                    "createdAt": "$createdAt",
                }
            }
        ]

        const employee = await Employee.aggregate(pipline);
        return commonUtils.sendSuccess(req, res, employee)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}
// TODO: User and business linked list
async function linkList(req: Request, res: Response) {

    let linkerId = req.params.id as string;
    try {
        // const skipIds = req.query?.skipIds;
        //
        // let filter = {};
        // if (skipIds !== '' && typeof skipIds === 'string') {
        //     //validate skipId array and check mongoose objectId format
        //     const skipArray = skipIds?.split(',').filter(item => mongoose.Types.ObjectId.isValid(item))?.map(item => new mongoose.Types.ObjectId(item));
        //     filter = {requester: {$nin: skipArray}}
        // }

        const pipline = [{
            $match: {
                $and: [
                    { recipient: new mongoose.Types.ObjectId(linkerId) },
                    { status: FriendStatus.FRIENDS }
                    // filter,
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "requester",
                foreignField: "_id",
                as: "userFriends",
            }
        },
        { $unwind: "$userFriends" },
        {
            $lookup: {
                from: "businesses",
                localField: "businessId",
                foreignField: "_id",
                as: "businessObject",
            }
        },
        { $unwind: { path: "$businessObject", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                "requestId": "$link",
                "id": '$userFriends._id',
                "name": '$userFriends.fullName',
                "image": "$userFriends.image.profilePic",
                "mobile": '$userFriends.mobile',
                "email": '$userFriends.email',
                'userName': "$userFriends.userName",
                'permissions': "$userFriends.permissions",
                'userStatus': "$userFriends.userStatus",
                // @ts-ignore
                'businessName': { $cond: { if: "$businessObject", then: "$businessObject.name", else: "" } },
                // "image":{$cond: { if: "$userFriends.image", then: "$userFriends.image", else: null }},
            }
        }
        ]

        const friendLists = await Friends.aggregate(pipline)


        if (friendLists.length && linkerId) {
            await Promise.all(friendLists.map(async (element: any) => {
                const selfStatus = await Friends.findOne({
                    $or: [{ requester: new mongoose.Types.ObjectId(element.id) }]
                })
                element.selfStatus = selfStatus ? selfStatus.status : 0
            }))
        }

        return commonUtils.sendSuccess(req, res, friendLists)
    } catch (error: any) {
        return commonUtils.sendSuccess(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }
}

async function businessList(req: Request, res: Response) {
    let businessId = req.params.id
    try {
        let business = await Business.findOne({ _id: new mongoose.Types.ObjectId(businessId) }).select('_id userId name email mobile image optionalMobile businessCategory bio address businessStatus isMobileVerified isEmailVerified document chatPermissions')
        if (!business)
            return commonUtils.sendError(req, res, { message: AppStrings.BUSINESS_NOT_FOUND })

        return commonUtils.sendSuccess(req, res, business)
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: Admin added multiple business addres
async function MulAddressAdd(req: Request, res: Response) {
    let businessId: any = req.body.businessId;
    let addressDetails = req.body.addressDetails
    const business = await Business.findById(businessId)
    if (!business) return commonUtils.sendError(req, res, { error: AppStrings.BUSINESS_NOT_FOUND })

    try {
        await Promise.all(addressDetails.map(async (item: any) => {
            const address = new Address({
                userId: req.body.userId,
                businessId: businessId,
                businessName: item.businessName,
                businessLocationName: item.businessLocationName,
                physicalAddress: item.physicalAddress,
                image: business.image,
                location: {
                    "type": "Point",
                    "coordinates": [item.longitude, item.latitude]
                },
                categoryId: new mongoose.Types.ObjectId(business.businessCategory),
                description: item.description,
                email: item.email,
                mobile: item.mobile,
                primaryAddress: false
            });

            await address.save()

        }))
        return commonUtils.sendSuccess(req, res, { message: AppStrings.ADDRESS_ADDED_SUCCESSFULLY })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: Pending document uploaded list
async function pendingDocument(req: Request, res: Response) {

    let user = await User.find({
        "document.docType": 0,
        "trustLevel.id": TrustStatus.PENDING
    })

    if (!user)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

    return commonUtils.sendSuccess(req, res, user)

}

async function approveDocument(req: Request, res: Response) {

    let validateResult = req.body.result
    let userId = req.body.userId

    let user = await User.findById(userId)

    user.trustLevel.id = validateResult === 1 ? TrustStatus.ACCEPT : TrustStatus.INVALID

    await user.save();

    await trustController.updateAvgTrustLevel(user._id)

    return commonUtils.sendSuccess(req, res, { message: AppStrings.APPROVE })
}

async function userDelete(req: Request, res: Response) {
    let userId = req.params.id
    try {
        let user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) })

        if (!user)
            return commonUtils.sendAdminError(req, res, { message: AppStrings.USER_NOT_FOUND })

        let history = await new UserHistory({
            userData: user
        })

        await history.save()

        await User.findByIdAndDelete({ _id: userId })

        await DeleteRequest.deleteOne({ userId: new mongoose.Types.ObjectId(userId) })

        await Address.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })

        await Business.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })

        await Event.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })

        await Trace.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })

        await TraceRequest.deleteMany({ userId: new mongoose.Types.ObjectId(userId) })

        return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.USER_DELETE });
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendAdminError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: User and business can requested admin delete your business and user 
async function deleteRequestList(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;

    var total_ = await DeleteRequest.find({
        isDelete: { $ne: 1 },
    }).sort({ createdAt: -1 }).countDocuments();

    const search = req.query.search;
    let filter: any = { isDelete: { $ne: 1 } };
    if (search) {
        filter = {
            ...filter,
            'userData.fullName': { $regex: `${search}`, $options: "i" },
        };
    }

    const pipeline = [
        {
            $match: { $and: [filter] }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'businesses',
                localField: 'businessId',
                foreignField: '_id',
                as: 'businessData'
            }
        },
        { $unwind: { path: "$businessData", preserveNullAndEmptyArrays: true } },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },
                    {
                        $project: {
                            _id: 1,
                            userId: "$userId",
                            businessId: "$businessId",
                            businessName: "$businessData.name",
                            userName: "$userData.fullName",
                            email: "$userData.email",
                            reason: "$reason",
                            status: "$status",
                            isDelete: "$isDelete",
                            createdAt: "$createdAt",
                        }
                    },
                ],
            },
        },

    ];

    let requestList = await DeleteRequest.aggregate(pipeline)

    return commonUtils.sendSuccess(req, res, requestList)
}

// TODO: Admin can accepted business request and delete business
async function businessDelete(req: Request, res: Response) {
    let businessId = req.params.id

    try {
        let business = await Business.findOne({ _id: new mongoose.Types.ObjectId(businessId) })

        if (!business)
            return commonUtils.sendAdminError(req, res, { message: AppStrings.BUSINESS_NOT_FOUND })

        await Business.deleteMany({ _id: new mongoose.Types.ObjectId(businessId) })

        await DeleteRequest.deleteOne({ businessId: new mongoose.Types.ObjectId(businessId) })

        return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.BUSINESS_DELETE })
    } catch (error) {
        console.log(error);
        return commonUtils.sendAdminError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}


// TODO: Admin cancel business delete request
async function requestCancel(req: Request, res: Response) {
    let requestId = req.params.id

    try {
        const cancel = await DeleteRequest.findOne({ _id: requestId });

        if (!cancel) {
            return commonUtils.sendAdminError(req, res, { message: AppStrings.REQUEST_NOT_FOUND })
        }

        await DeleteRequest.findByIdAndUpdate(cancel._id, { $set: { isDelete: 1 } })

        // const user = await User.findOne({ _id: new mongoose.Types.ObjectId(cancel.userId), "cancel.status": 0 })
        if (cancel.status == 0) {
            await User.update({ _id: new mongoose.Types.ObjectId(cancel.userId) }, { $set: { isDeleted: 0 } })
        } else if (cancel.status == 1) {
            await Business.update({ _id: new mongoose.Types.ObjectId(cancel.businessId) }, { $set: { isDeleted: 0 } })
        }

        return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.REQUEST_CANCEL })
    } catch (error) {
        console.log(error);
        return commonUtils.sendAdminError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: Document verification list
async function userIdVerifyList(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;

    var total_ = await User.find({
        'document.docType': -2,
    }).sort({ createdAt: -1 }).countDocuments();

    const search = req.query.search;
    let filter: any = { 'document.docType': -2 };
    if (search) {
        filter = {
            ...filter,
            $or: [
                { userName: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ]
        };
    }

    const pipline = [
        {
            $match: {
                ...filter
            }
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            userName: "$userName",
                            email: "$email",
                            mobile: "$mobile",
                            createdAt: "$createdAt",
                            status: "$status",
                            emailVerify: "$emailVerify",
                            mobileVerify: "$mobileVerify",
                            trustLevel: "$trustLevel",
                            averageTrust: "$averageTrust",
                            isUserRejected: "$isUserRejected",
                            userTrace: "$userTrace",
                            fullName: "$fullName",
                            document: "$document"
                        },
                    },
                ]
            }
        },
    ]
    const user = await User.aggregate(pipline);
    return commonUtils.sendSuccess(req, res, user)
}

async function userIdVerify(req: Request, res: Response) {

    const userId = req.body.userId;
    const status = req.body.status;  // TODO:: 1 for Accpted, 2 for Invalid

    try {
        var userExitsOrNot = await User.findById(userId).exec();
        if (!userExitsOrNot) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        if (status == 1) {
            userExitsOrNot.trustLevel.id = 3
            await userExitsOrNot.save()
        } else if (status == 2) {
            userExitsOrNot.trustLevel.id = 2
            await userExitsOrNot.save()
        }

        return commonUtils.sendAdminSuccess(req, res, {});
    } catch (error) {
        console.log(error);
        return commonUtils.sendAdminError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

// TODO: user document not verification list
async function verifyUpdateDocumentList(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;

    var total_ = await User.find({
        isMark: 1,
    }).sort({ createdAt: -1 }).countDocuments();

    const search = req.query.search;
    let filter: any = { isMark: 1 };
    if (search) {
        filter = {
            ...filter,
            $or: [
                { userName: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ]
        };
    }

    const pipline = [
        {
            $match: {
                ...filter
            }
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            userName: "$userName",
                            email: "$email",
                            mobile: "$mobile",
                            fullName: "$fullName",
                            document: "$document",
                            isMark: "$isMark",
                            createdAt: "$createdAt"
                        },
                    },
                ]
            }
        },
    ]
    const user = await User.aggregate(pipline);
    return commonUtils.sendSuccess(req, res, user)
}

// TODO: User id verification
async function userIsMark(req: Request, res: Response) {

    const userId = req.body.userId;

    const user = await User.findById(userId);

    await User.findByIdAndUpdate(user._id, { $set: { isMark: 0 } })

    return commonUtils.sendSuccess(req, res, { message: AppStrings.STATUS_UPDATED_SUCCESSFULLY })

}

async function reportReplyToUser(req: Request, res: Response) {
    const reportId = req.body.reportId
    const replyMessage = req.body.message

    const report = await ReportIssue.findOne({ _id: new mongoose.Types.ObjectId(reportId) })


    if (!report) {
        return commonUtils.sendAdminError(req, res, { message: AppStrings.REPORT_NOT_FOUND })
    }

    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(report.userId) })


    if (user.email) {
        eventEmitter.emit("send_email_report_reply", {
            to: user.email,
            subject: "report response",
            data: {
                // otp: otp,
                message: replyMessage,
                fullName: user.fullName
            },
        });

        const pushToken = await User.getPushToken(report.userId); //get pushtoken of report user


        await commonUtils.sendNotification({
            notification: {
                title: AppStrings.REPLY_TO_USER_REPORT.TITLE,
                body: AppStrings.REPLY_TO_USER_REPORT.BODY.replace(':name', replyMessage)
            },
            data: {
                type: NotificationType.REPLY_TO_USER_REPORT.toString()
            }
        }, pushToken, report.userId.toString())

    } else {
        const pushToken = await User.getPushToken(report.userId); //get pushtoken of report user


        await commonUtils.sendNotification({
            notification: {
                title: AppStrings.REPLY_TO_USER_REPORT.TITLE,
                body: AppStrings.REPLY_TO_USER_REPORT.BODY.replace(':name', replyMessage)
            },
            data: {
                type: NotificationType.REPLY_TO_USER_REPORT.toString()
            }
        }, pushToken, report.userId.toString())
    }

    report.isReply = 1
    await report.save()

    return commonUtils.sendSuccess(req, res, { message: true })

}

async function idVerifyCountList(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    var total_ = await User.find({
        documentUpdateCount: { $eq: 3 },
    }).sort({ createdAt: -1 }).countDocuments();
    const search = req.query.search;
    let filter: any = {documentUpdateCount:3};
    if (search) {
        filter = {
            ...filter,
            $or: [
                { userName: { $regex: search, $options: "i" } },
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ]
        };
    }

    let userData = await User.aggregate([
        {
            $match: filter,
        },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [
                    { $skip: skip_ },
                    { $limit: limit_ },

                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            userName: 1,
                            email: 1,
                            mobile: 1,
                            status: 1,
                            averageTrust: 1,
                            isUserRejected: 1,
                            userTrace: 1,
                            fullName: 1,
                            documentUpdateCount:1
                        },
                    },
                ],
            },
        },

        { $sort: { createdAt: -1 } },
    ]);


    return commonUtils.sendAdminSuccess(req, res, userData);
}

async function idVerifyCountUpdate(req: Request, res: Response) {
    const userId = req.body.userId;

    const user = await User.findById(userId);

    await User.findByIdAndUpdate(user._id, { $set: { documentUpdateCount: 0 } })

    return commonUtils.sendSuccess(req, res, { message: AppStrings.ID_LIMIT_UPDATED_SUCCESSFULLY })
}

export default {
    adminRegister,
    adminUpdate,
    adminDelete,
    login,
    getProfile,
    assignRole,
    checkUnique,
    methodAllowance,
    loginAccess,
    adminList,
    uploadImage,
    changePassword,
    userDocumentList,
    userIdVerify,
    userImageVerify,
    userList,
    userStatusUpdate,
    userEdit,
    userUpdate,
    userProfileUpdate,
    imageUpload,
    uploadFile,
    setting,
    dashboard,
    listBusiness,
    businessApproved,
    userBusinessList,
    businessUpdate,
    userRejected,
    businessAddressAdd,
    businessAddressUpdate,
    deleteBusinessAddress,
    businessAddressList,
    employeeList,
    linkList,
    businessList,
    MulAddressAdd,
    adminStatus,
    pendingDocument,
    approveDocument,
    userDelete,
    deleteRequestList,
    businessDelete,
    requestCancel,
    userIdVerifyList,
    verifyUpdateDocumentList,
    userIsMark,
    reportReplyToUser,
    idVerifyCountList,
    idVerifyCountUpdate
};