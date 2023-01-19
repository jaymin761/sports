import { AppStrings } from "../../utils/appStrings";
import { Request, Response } from "express";
import { FriendStatus, ImageType, NotificationType, Recognise, TrustStatus, UserData, UserType } from "../../utils/enum";

import commonUtils, { fileFilter, fileFilterPdf, fileStorage, fileStoragePdf } from "../../utils/commonUtils";
import { AppConstants } from "../../utils/appConstants";
import eventEmitter from "../../utils/event";
import { computeDistanceBetween } from "../../utils/locationUtils/SphericalUtil";
import { LatLng } from "../../utils/locationUtils/LatLng";
import agenda from "../../utils/schedule";
import { myTrustLevel } from "../../utils/trustLevelUtils";
import mongoose from "mongoose";
import { userMap, userMapMobile } from "../../index";
import { documentTypes, verifyDocumentId } from "../../utils/idVerificationUtils";
import moment from "moment/moment";

import userAuth from "../userAuth/authController"
import Phone from "../phone";
import trustController from "../trust/trustController";
import { log } from "console";
import Auth from "../../auth";
import path from "path";
const md5 = require("md5");
const multer = require("multer");
const fs = require("fs");

const User = require('./models/userModel');
const Configurable = require('../admin/models/configurable');
const Trust = require('../admin/models/trustModel');
const Event = require('../event/models/eventModel');
const Post = require('../socials/models/post');
const Category = require('../admin/models/category');
const Group = require('../chat/models/groupModel');
// import Employee from "../employee/employeeModel";

const Address = require('../business/models/addressModel');
const Business = require('../business/models/businessModel');
const Trace = require('../users/models/traceUser');
const tranceRequest = require('../users/models/requestModel');
const LocationTrace = require("./models/locationTrace")
const Token = require("../userAuth/tokenModel")
const Endorsed = require('../trust/models/endorsed');
const DeleteRequest = require('../users/models/userDeleteRequest');
const Friend = require('../userLink/models/friends');
const { curly } = require('node-libcurl');

const vision = require('@google-cloud/vision');
const { getAuth } = require('firebase-admin/auth');
import crypto from "crypto";
const bcrypt = require("bcryptjs");
const config = require("config");

/**
 * ignore for now
 */
const setLocation = async (req: any, res: Response) => {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id).exec();
    const { longitude, latitude } = req.body.location || user.location;

    try {
        const location = {
            type: "Point",
            coordinates: [longitude, latitude],
        }
        await User.updateOne({ _id: user_id }, { $set: { "address.location": location } }, { upsert: true }).exec();

        return commonUtils.sendSuccess(req, res, {});
    } catch (error) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }

}

/**
 * Update Location at every hour
 * */
const updateLocationEveryHour = async (req: any, res: Response) => {
    const user_id = req.headers.userid;
    const location = req.body.location;

    let user = await User.findOne({
        _id: user_id
    }).select("address").lean()

    let userHomeLocationLng = user.address.location.coordinates?.[0]
    let userHomeLocationLat = user.address.location.coordinates?.[1]

    const coordinates = new LatLng()
    coordinates.latitude = req.body.location?.latitude
    coordinates.longitude = req.body.location?.longitude

    const homeCoordinates = new LatLng()
    homeCoordinates.latitude = userHomeLocationLat
    homeCoordinates.longitude = userHomeLocationLng

    /**
     * COMPUTE DISTANCE BETWEEN HOME ADDRESS AND CURRENT LOCATION
     */
    let distance = computeDistanceBetween(coordinates, coordinates)

    /**
     *  Add Location Trace for user
     * */
    let locationTrace = new LocationTrace()
    locationTrace.user_id = user_id
    locationTrace.location = location
    locationTrace.distance = distance
    locationTrace.result = distance <= AppConstants.DISTANCE_LIMIT_IN_METER
    await locationTrace.save()

    return commonUtils.sendSuccess(req, res, {});
}

const uploadImage = async (req: Request, res: Response) => {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);
    if (!user)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    const image_ = multer({
        storage: fileStorage,
        fileFilter: fileFilter,
    }).single("image");

    image_(req, res, async (err: any) => {
        if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);
        if (!req.file) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);
        const image_name = req.file.filename;

        switch (parseInt(req.body.type)) {
            case ImageType.USER_IMAGE:
                user.image.userImage = image_name
                break;
            case ImageType.PROFILE_PIC:
                user.image.profilePic = image_name
                break;
            default:
                return commonUtils.sendError(req, res, { message: AppStrings.INVALID_LIST_TYPE })
        }

        await user.save();

        return commonUtils.sendSuccess(req, res, {
            imageName: image_name,
            message: AppStrings.IMAGE_UPLOADED
        }, 200);
    });
}

async function getProfile(req: any, res: Response) {
    let user_id = req.headers.userid;
    const user = await User.findById(user_id).exec();
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    const myTrustConstant: number = myTrustLevel(
        user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
    )

    // const trustLevel = trustLevelStars(myTrustConstant, 2)
    // const trustLevelMsg = trustLevelMessage(myTrustConstant)
    //TODO:create new function name of trust level message
    /*let trustLevelMsg = await Trust.findOne({
        combine: myTrustConstant
    })*/

    const trust = await Trust.findOne({
        combine: myTrustConstant
    }).select("message name star")

    if (trust?.star == 5) {
        user.isProfileComplete = 1
        await user.save()
    }

    let parent

    if (user.document.parentId) {
        parent = await User.findOne({
            _id: new mongoose.Types.ObjectId(user.document.parentId)
        })
    }

    let event = await Event.find({ userId: user_id }).count()
    let post = await Post.find({ userId: user_id }).count()
    let link = await Friend.find({ recipient: user_id, status: FriendStatus.FRIENDS}).count()
    console.log("Link Count",link);
    

    let business = await Business.findOne({ userId: user_id }).lean()

    const common_fileds = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        mobile: user.mobile,
        profilePic: user.image.profilePic,
        userType: user.userType ?? null,
        isProfileComplete: user.isProfileComplete,
        // isProfileComplete: (trust?.star ?? 0) == 5 ? 1 : 0,
        fullName: user.fullName,
        status: user.status,
        optionalMobile: user.optionalMobile,
        address: user.address,
        // tempAddress: user.tempAddress,
        temporaryAddress: user.temporaryAddress ? user.temporaryAddress : null,
        document: user.document,
        bio: user.bio,
        userStatus: user.userStatus,
        reference: user.reference,
        trust: trust?.star ?? 0,
        message: trust?.message ?? "",
        trustLevel: trust?.name ?? "",
        permissions: user.permissions,
        idVerifySelfie: user?.idVerifySelfie,
        trustDetails: user.trustLevel,
        documentUpdateCount: user.documentUpdateCount,
        totalEvent: event,
        totalPost: post,
        totalLink: link,
        parent: user.document.parentId ? {
            _id: parent._id.toString(),
            userName: parent.userName,
            fullName: parent.fullName,
            profilePic: parent.image.profilePic,
            name: parent.userName,
            email: parent.email,
            mobile: parent.mobile,
            permissions: parent.permissions,
        } : {},
        businessId: business?._id?.toString() ?? "",
        selfieUpdateAt: user?.selfieUpdateAt
    };


    return commonUtils.sendSuccess(req, res, { ...common_fileds }, 200);
}

//TODO: set current user friend status with
async function getOtherProfile(req: any, res: Response) {
    const userID = req.headers.userid as string;
    const isGuest = req.headers.isguest || false;
    let userId = req.params.id;
    try {
        const user = await User.findById(userId).exec();
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        const myTrustConstant: number = myTrustLevel(
            user.trustLevel?.image?.valueOf() ?? 1,
            user.trustLevel?.id?.valueOf() ?? 1,
            user.trustLevel?.reference?.valueOf() ?? 1,
            user.trustLevel?.address?.valueOf() ?? 1,
        )

        let event = await Event.find({ userId: userID }).count()
        let post = await Post.find({ userId: userID }).count()

        const trust = await Trust.findOne({
            combine: myTrustConstant
        }).select("star message name")

        const trustLevel = trust.star

        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(userId) } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "friends",
                    let: { userId: "$_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    // {$eq: ["$requester", "$$userId"]},
                                    { $eq: ["$recipient", "$$userId"] },
                                    { $eq: ["$status", FriendStatus.FRIENDS] },
                                    { $ne: ['$businessId', '$employee.businessId']}
                                ]
                            }
                        }
                    }, { "$count": "count" }],
                    as: "linkedUserCount",
                }
            },
            {
                "$addFields": {
                    "linkCount": { "$sum": "$linkedUserCount.count" }
                }
            },
            {
                $lookup: {
                    from: "contacts",
                    let: { linkedWith: "$_id" },
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        { "$eq": ["$userId", new mongoose.Types.ObjectId(userId)] },
                                        { "$eq": ["$linkedWith", "$$linkedWith"] },
                                        // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                    ]
                                }
                            }
                        },
                    ],
                    as: "contactStatus"
                }
            }, { $unwind: { path: "$contactStatus", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: "$userName",
                    fullName: "$fullName",
                    bio: "$bio",
                    address: "$tempAddress.name",
                    location: "$tempAddress.location",
                    userStatus: "$userStatus",
                    trust: "$averageTrust",
                    linkedUserCount: "$linkCount",
                    profilePic: "$image.profilePic",
                    chatPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.acceptMessage",
                            else: {
                                public: true,
                                contact: true,
                                marketing: true
                            }
                        }
                    },
                    visibility: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.visibility",
                            else: {
                                picture: true,
                                status: true,
                                post: true,
                                designation: true
                            }
                        }
                    },
                    locationPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.location",
                            else: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            }
                        }
                    },
                    employee: {
                        $cond: {
                            if: "$employee", then: {
                                businessId: "$employee.businessId",
                                businessName: "$employee.empBusiness.businessName",
                                businessLocationName: "$employee.empBusiness.businessLocationName",
                                designation: "$employee.designation",
                                workHours: "$employee.workHours",
                                authorized: "$employee.authorized",
                                available: "$employee.available",
                                status: "$employee.status",
                            }, else: {}
                        }
                    },
                    friendStatus: { $cond: { if: "$friendStatus", then: "$friendStatus.status", else: 0 } },
                    contact: { $cond: { if: "$contactStatus", then: 1, else: 0 } },
                    distance: { $round: ["$distance", 2] }
                },
            },
        ];
        if (!isGuest && userID) {
            const friendObj = [{
                $lookup: {
                    from: "friends",
                    let: { recipient: "$_id" },
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    "$and": [
                                        { "$eq": ["$requester", "$$recipient"] },
                                        { "$eq": ["$recipient", new mongoose.Types.ObjectId(userID)] },
                                        //{ "$eq": ["$status", FriendStatus.FRIENDS] },
                                    ]
                                },
                                "businessId": { $exists: false },
                            }
                        },
                    ],
                    as: "friendStatus"
                }
            },
            { $unwind: { path: "$friendStatus", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "employees",
                    let: { employeeId: "$_id" },
                    // localField: '_id',
                    // foreignField: 'employeeId',
                    as: "employee",
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$employeeId", '$$employeeId'] },
                                    { $eq: ["$status", 2] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "addresses",
                            let: { branchId: "$businessBranch" },
                            // localField: 'businessBranch',
                            // foreignField: '_id',
                            as: "empBusiness",
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $eq: ["$_id", '$$branchId']
                                        }
                                    }
                                }
                            ]
                        }
                    }, {
                        $unwind: {
                            path: "$empBusiness",
                            preserveNullAndEmptyArrays: true
                        }
                    }
                    ]
                }
            }, {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true
                }
            }]
            //@ts-ignore
            pipeline.splice(2, 0, ...friendObj);
        }


        const userData = await User.aggregate(pipeline);
        if (userData.length) {
            userData[0].trust = trustLevel
            userData[0].postCount = 56;
            userData[0].eventsCount = 56;
            const businessData = await Business.findById(userData[0].employee.businessId);
            if (businessData && businessData.businessCategory) {
                userData[0].employee.categoryId = businessData.businessCategory.toString()
            }
        }

        return commonUtils.sendSuccess(req, res, userData.length ? userData[0] : {});
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG }, 404);
    }
}

async function profileCompleted(req: any, res: Response) {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);

    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);
    try {
        user.optionalMobile = {
            secondary: req.body.optionalMobile?.secondary || req.body?.secondary || "",
            alternative: req.body.optionalMobile?.alternative || req.body?.alternative || "",
        }

        user.bio = req.body.bio || user.bio;
        user.fullName = req.body.fullName || user.fullName;
        user.userStatus = req.body.userStatus || user.userStatus;
        user.userName = req.body?.userName || user.userName

        if (!user.email && req.body?.email) {
            user.email = req.body.email
        }

        if (!user.mobile && req.body?.mobile) {
            user.mobile = req.body.mobile
        }
        await user.save();

        let users = {
            _id: user._id,
            displayName: user.fullName,
            userName: user.userName,
            email: user.email,
            mobile: user.mobile,
            profilePic: user.image.profilePic ?? null
        }

        eventEmitter.emit("updateChatUser", {
            "userId": user._id,
            "name": user.fullName ?? "",
            "image": user.image?.profilePic ?? "",
        })

        return commonUtils.sendSuccess(req, res, { users });

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function profileSetting(req: any, res: Response) {
    const user_id = req.headers.userid;
    const user = await User.findOne({ '_id': user_id }).exec();

    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);
    try {
        const setting = {
            permissions: {
                location: {
                    whileUsingApp: req.body.location.whileUsingApp,
                    withLinkedContact: req.body.location.withLinkedContact,
                    withPublic: req.body.location.withPublic,
                    notShared: req.body.location.notShared,
                },
                visibility: {
                    picture: req.body.visibility.picture,
                    status: req.body.visibility.status,
                    post: req.body.visibility.post,
                    designation: req.body.visibility.designation
                },
                acceptMessage: {
                    public: req.body.acceptMessage.public,
                    contact: req.body.acceptMessage.contact,
                    marketing: req.body.acceptMessage.marketing,
                },
            },
        }

        user.permissions = setting.permissions;

        await user.save();

        if (!(req.body.permissions?.location?.notShared ?? true) && user.address) {

            const coordinates = new LatLng()
            coordinates.longitude = user.address?.location?.coordinates?.[0]
            coordinates.latitude = user.address?.location?.coordinates?.[1]
            let distance = computeDistanceBetween(coordinates, coordinates)

            // todo Removed by Ajay
            // eventEmitter.emit("addLocationTrace", {
            //     "userId": user_id,
            //     "address": user.address?.location,
            //     "distance": distance,
            //     "result": distance <= AppConstants.DISTANCE_LIMIT_IN_METER
            // })

            /**
             * start agenda for 72 hours  => make 1st verification of home address
             * Removed bcos it will be run only after home address update
             * */
            // await agenda.start()
            // await agenda.schedule("in 1 minute", "evaluateHomeAddressVerification", {
            //     "userId": user_id,
            //     "key": 72
            // })
        }

        return commonUtils.sendSuccess(req, res, user, 200);
    } catch (e) {
        console.log(e);
    }
}

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
        await commonUtils.AddImage(image_name, 2);
        return commonUtils.sendSuccess(req, res, {
            file: image_name
        }, 200);
    });
}

async function submitUserReferences(req: any, res: Response) {
    try {
        const user_id = req.headers.userid;
        const referenceId = req.body.referenceId;

        const user = await User.findById(user_id);

        const check = user.reference.filter((a: any) => a.id.toString() === referenceId.toString())
        if (check.length) return commonUtils.sendError(req, res, { message: AppStrings.ALREADY_ADDED_REFERENCE })

        user.reference.push({
            id: referenceId,
            isEndorsed: Recognise.PENDING
        })

        await user.save()

        eventEmitter.emit('user.checkOnReferencesEndorsed', { userId: user._id, referenceId, fullName: user.fullName })
        return commonUtils.sendSuccess(req, res, { message: AppStrings.REFERENCES_ADDED_SUCCESSFULLY });
    } catch (error) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

async function submitUserDocumentId(req: any, res: Response) {
    const user_id = req.headers.userid;

    const user = await User.findOne({ _id: user_id }).exec();
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    let {
        idNumber,
        countryCode,
        documentType,
        documentName,
        gender,
        dateOfBirth
    } = req.body

    const duplicate = await User.findOne({ 'document.idNumber': idNumber }).exec()

    if (duplicate && !user._id.equals(duplicate._id)) return commonUtils.sendError(req, res, { message: AppStrings.ID_ALREADY_USED })

    try {
        user.document = {
            idNumber: idNumber,
            image: req.body?.image,
            // idVerifySelfie: req.body?.idVerifySelfie,
            country: documentTypes[countryCode]?.code,
            docType: documentType,
            docName: documentName,
            gender: gender,
            dateOfBirth: dateOfBirth
        }

        // CHECK FOR ID VERIFICATION
        if (documentType == 1 || documentType == 2) {

            let validateResult = verifyDocumentId(countryCode, documentType, idNumber, dateOfBirth, gender)

            user.trustLevel.id = documentType === 0 ? TrustStatus.PENDING : validateResult ? TrustStatus.ACCEPT : TrustStatus.INVALID

            user.document.isVerify = documentType === 0 ? 0 : validateResult ? 1 : 0
        }


        if (documentType == -2 && user.trustLevel.id == 2) {
            user.trustLevel.id = TrustStatus.PENDING
        }

        user.isMark = 1

        await user.save();
        await User.findByIdAndUpdate(user._id,{$inc:{documentUpdateCount:1}});
        
        // await commonUtils.deleteImage(user.document.image);
        await trustController.updateAvgTrustLevel(user._id)

        return commonUtils.sendSuccess(req, res, { message: AppStrings.DOCUMENT_SUBMITTED_SUCCESSFULLY }, 200);

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function submitUserDocumentMinor(req: any, res: Response) {
    const user_id = req.headers.userid;

    const user = await User.findOne({ '_id': user_id }).exec();
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    let {
        parentUserId,
        gender,
        dateOfBirth
    } = req.body

    try {
        user.document = {
            gender: gender,
            dateOfBirth: dateOfBirth,
            parentId: parentUserId,
            isVerify: 0
        }

        user.trustLevel.id = TrustStatus.PENDING
        await user.save();
        await trustController.updateAvgTrustLevel(user._id)
        //send parent notification
        const pushToken = await User.getPushToken(parentUserId); //get pushtoken of requestId user
        await commonUtils.sendNotification({
            notification: {
                title: AppStrings.PARENT_VERIFICATION_REQUEST.TITLE,
                body: AppStrings.PARENT_VERIFICATION_REQUEST.BODY.replace(':name', user.fullName)
            },
            data: {
                parentUserId: parentUserId.toString(), senderId: user_id,
                type: NotificationType.PARENT_VERIFICATION_REQUEST.toString()
            }
        }, pushToken, parentUserId.toString())
        // notify code end

        return commonUtils.sendSuccess(req, res, { message: AppStrings.DOCUMENT_SUBMITTED_SUCCESSFULLY }, 200);

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function userDocumentsMinor(req: any, res: Response) {
    const user_id = req.headers.userid

    try {
        const users = await User.find({ 'document.parentId': user_id, 'document.isVerify': 0 }, {
            "fullName": 1, _id: 1, "userName": 1, name: 1, image: 1,
            bio: 1,
            isProfileComplete: 1,
        }).exec();

        return commonUtils.sendSuccess(req, res, users, 200);

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function userDocumentsMinorVerify(req: any, res: Response) {
    const user_id = req.headers.userid

    const minorId = req.params.id
    const status = Number(req.params.status ?? 0)


    try {

        await User.updateOne({
            _id: new mongoose.Types.ObjectId(minorId)
        }, status === 1 ? {
            "document.isVerify": 1,
            "trustLevel.id": TrustStatus.ACCEPT
        } : {
            "document.isVerify": 0,
            "trustLevel.id": TrustStatus.INVALID,
            "document.parentId": ""
        })
        await trustController.updateAvgTrustLevel(minorId)

        //send notification to child
        const pushToken = await User.getPushToken(minorId); //get pushtoken of minor
        const user = await User.findById(user_id); //get pushtoken of minor
        if (status === 1) {
            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.PARENT_VERIFICATION_APPROVE.TITLE,
                    body: AppStrings.PARENT_VERIFICATION_APPROVE.BODY.replace(':name', user.fullName ?? 'parent')
                },
                data: {
                    senderId: user_id.toString(), childId: minorId,
                    type: NotificationType.PARENT_VERIFICATION_APPROVE.toString()
                }
            }, pushToken, minorId.toString())
        } else {
            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.PARENT_VERIFICATION_REJECT.TITLE,
                    body: AppStrings.PARENT_VERIFICATION_REJECT.BODY.replace(':name', user.fullName ?? 'parent')
                },
                data: {
                    senderId: user_id.toString(), childId: minorId,
                    type: NotificationType.PARENT_VERIFICATION_REJECT.toString()
                }
            }, pushToken, minorId.toString())
        }

        // notify code end

        return commonUtils.sendSuccess(req, res, {}, 200);

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function requestUserDocumentOtp(req: any, res: Response) {
    const user_id = req.headers.userid;

    const user = await User.findOne({ '_id': user_id }).exec();
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);
    const email = req.body.userName?.[UserData.EMAIL.toString()];
    const mobile = req.body.userName?.[UserData.MOBILE.toString()];

    try {
        if (email) {
            await userAuth.sendVerifyOTP(user._id, email, user.device, 'email', 'forDocument', 'please verify your email', "", 5, user.fullName)
            return commonUtils.sendSuccess(req, res, { message: AppStrings.CHECK_MAIL })
        }
        //  else {
        //     await userAuth.sendVerifyOTP(user._id, mobile, user.device, 'mobile', 'forDocument', 'please verify your mobile', "", 5, user.fullName)
        //     return commonUtils.sendSuccess(req, res, { message: AppStrings.CHECK_PHONE })
        // }

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function requestUserDocumentOtpVerify(req: any, res: Response) {
    const user_id = req.headers.userid;

    const user = await User.findOne({ '_id': user_id }).exec();
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);
    const otp = req.body.otp
    const mobile = req.body.userName[UserData.MOBILE.toString()]
    const choice = req.body.choice

    if (choice == 2) {
        const [success, _] = await Phone.verifyPhoneOtp(mobile, otp)
        if (success) {

            await User.updateOne({
                _id: new mongoose.Types.ObjectId(user_id)
            }, {
                "document.isVerify": 1,
                "trustLevel.id": TrustStatus.ACCEPT
            })

            return commonUtils.sendSuccess(req, res, {}, 200);
        } else {
            return commonUtils.sendError(req, res, { message: AppStrings.INCORRECT_OTP }, 409);
            // return commonUtils.sendError(req, res, {message: err === "Authenticate" ? AppStrings.INCORRECT_OTP : err}, 409);
        }


    } else {
        const token = await Token.findOne({
            userId: user_id,
            otp: otp,
            choice: 5,
            forSignUp: false
        });
        if (!token) return commonUtils.sendError(req, res, { message: AppStrings.INCORRECT_OTP }, 400);

        if (token.otp !== otp) return commonUtils.sendError(req, res, { message: AppStrings.INVALID_OTP }, 400);

        token.isVerified = true;
        await token.deleteOne();


        await User.updateOne({
            _id: new mongoose.Types.ObjectId(user_id)
        }, {
            "document.isVerify": 1,
            "trustLevel.id": TrustStatus.ACCEPT
        })

        return commonUtils.sendSuccess(req, res, { token: token.token }, 200);

    }


}

async function idTypes(req: any, res: Response) {
    return commonUtils.sendSuccess(req, res, documentTypes, 200);
}

async function checkUserNameAvailability(req: any, res: Response) {

    let { username } = req.query

    let users = await User.find({
        userName: username
    }).select("_id").lean()

    if (users.length > 0) {
        return commonUtils.sendError(req, res, AppStrings.USERNAME_EXISTS, 409)
    }

    return commonUtils.sendError(req, res, {})

}

//for mobile
async function listOfUserLocation(req: Request, res: Response) {
    const userId = req.headers.userid as string;
    const isGuest = req.headers.isguest || false
    const skipId: any = req.query.skipId;
    const search: any = req.query.search;

    let lat = parseFloat(req.query.lat as string);
    let long = parseFloat(req.query.long as string);
    const range = parseInt(req.query.range as string) || 1000;

    try {

        // let filter:any = {$or:[{"permissions.location.withLinkedContact":true,"permissions.location.withPublic":true}]};
        let filter: any = {};
        if (!lat && !long && userId && !isGuest) {
            const { address } = await User.findById(userId)
            if (address && address.location) {
                [long, lat] = address.location.coordinates
            }
        }
        if (skipId && !isGuest) {
            filter = {
                ...filter,
                _id: { $ne: new mongoose.Types.ObjectId(skipId) }
            };
        }

        if (search) {
            filter = {
                ...filter,
                'fullName': { $regex: `${search}`, $options: "i" }
            }
        }

        const pipeline = [
            { $match: filter },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    address: "$tempAddress.name",
                    location: "$tempAddress.location",
                    profilePic: "$image.profilePic",
                    userStatus: "$userStatus",
                    name: "$userName",
                    fullName: "$fullName",
                    status: { $cond: { if: "$friendStatus", then: "$friendStatus.status", else: 0 } },
                    contact: { $cond: { if: "$contactStatus", then: 1, else: 0 } },
                    online: {
                        $cond: {
                            if: "$_id", then: (!!userMap["$_id"] || !!userMapMobile["$_id"]), else: false
                        }
                    },
                    chatPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.acceptMessage",
                            else: {
                                public: true,
                                contact: true,
                                marketing: true
                            }
                        }
                    },
                    visibility: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.visibility",
                            else: {
                                picture: true,
                                status: true,
                                post: true,
                                designation: true
                            }
                        }
                    },
                    locationPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.location",
                            else: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            }
                        }
                    },
                    employee: {
                        $cond: {
                            if: "$employee", then: {
                                businessId: "$employee.businessId",
                                businessName: "$employee.empBusiness.businessName",
                                businessLocationName: "$employee.empBusiness.businessLocationName",
                                designation: "$employee.designation",
                                workHours: "$employee.workHours",
                                authorized: "$employee.authorized",
                                available: "$employee.available",
                                status: "$employee.status",
                                // CategoryId: "$business.businessCategory"
                            }, else: {}
                        }
                    }
                    ,
                    distance: { $round: ["$distance", 2] },
                    trustLevel: "$averageTrust"
                }
            },
        ];

        if (lat && long && range) {
            const geoNear = {
                near: {
                    type: "Point",
                    coordinates: [long, lat]
                },
                key: "tempAddress.location",
                distanceField: "distance",
                spherical: true,
                distanceMultiplier: 0.001,
                maxDistance: range * 1000
            }
            //@ts-ignore
            pipeline.unshift({ $geoNear: geoNear });
        }

        if (!isGuest && userId) {
            const friendObj = [
                {
                    $lookup: {
                        from: "friends",
                        let: { recipient: "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        $and: [
                                            { "$eq": ["$requester", new mongoose.Types.ObjectId(userId)] },
                                            { "$eq": ["$recipient", "$$recipient"] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },                                            
                                        ]
                                    },
                                    "businessId": { $exists: false },
                                }
                            },
                        ],
                        as: "friendStatus"
                    }
                },
                { $unwind: { path: "$friendStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "contacts",
                        let: { linkedWith: "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        $and: [
                                            { "$eq": ["$userId", new mongoose.Types.ObjectId(userId)] },
                                            { "$eq": ["$linkedWith", "$$linkedWith"] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                        ]
                                    }
                                }
                            },
                        ],
                        as: "contactStatus"
                    }
                }, { $unwind: { path: "$contactStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "employees",
                        let: { employeeId: "$_id" },
                        // localField: '_id',
                        // foreignField: 'employeeId',
                        as: "employee",
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$employeeId", '$$employeeId'] },
                                        { $eq: ["$status", 2] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "addresses",
                                let: { branchId: "$businessBranch" },
                                // localField: 'businessBranch',
                                // foreignField: '_id',
                                as: "empBusiness",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", '$$branchId']
                                            }
                                        }
                                    }
                                ]
                            }
                        }, {
                            $unwind: {
                                path: "$empBusiness",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        ]
                    }
                }, {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },
            ]
            //@ts-ignore
            pipeline.splice(2, 0, ...friendObj);
        }

        const User_ = await User.aggregate(pipeline);

        const check = await Promise.all(User_.map(async (item: any) => {

            const businessData = await Business.findById(item.employee.businessId);

            if (businessData && businessData.businessCategory) {
                item.employee.categoryId = businessData.businessCategory.toString()
            }
            // User_.push(item);
            return item
        }))

        const record = check?.filter((i: any) => {
            if ((i.locationPermission.withLinkedContact && i.status === 3) || i.locationPermission.withPublic) return i
        })
        // onlyLink: "$permissions.location.withLinkedContact"

        return commonUtils.sendSuccess(req, res, record);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function listOfUser(req: Request, res: Response) {
    const userId = req.headers.userid as string;
    const isGuest = req.headers.isguest || false
    const skipId: any = req.query.skipId;
    const search: any = req.query.search;

    let lat = parseFloat(req.query.lat as string);
    let long = parseFloat(req.query.long as string);

    try {

        // let long, lat;
        let filter = {};

        if (skipId && !isGuest) {
            filter = { _id: { $ne: new mongoose.Types.ObjectId(skipId) } };
        }

        if (search) {
            filter = {
                ...filter,
                'fullName': { $regex: `${search}`, $options: "i" }
            }
        }

        const pipeline = [
            { $match: filter },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    address: "$tempAddress.name",
                    location: "$tempAddress.location",
                    profilePic: "$image.profilePic",
                    userStatus: "$userStatus",
                    userName: "$userName",
                    fullName: "$fullName",
                    email: "$email",
                    mobile: "$mobile",
                    isProfileComplete: "$isProfileComplete",
                    status: { $cond: { if: "$friendStatus", then: "$friendStatus.status", else: 0 } },
                    contact: { $cond: { if: "$contactStatus", then: 1, else: 0 } },
                    online: {
                        $cond: {
                            if: "$_id", then: (!!userMap["$_id"] || !!userMapMobile["$_id"]), else: false
                        }
                    },
                    chatPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.acceptMessage",
                            else: {
                                public: true,
                                contact: true,
                                marketing: true
                            }
                        }
                    },
                    visibility: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.visibility",
                            else: {
                                picture: true,
                                status: true,
                                post: true
                            }
                        }
                    },
                    locationPermission: {
                        $cond: {
                            if: "$permissions",
                            then: "$permissions.location",
                            else: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            }
                        }
                    },
                    employee: {
                        $cond: {
                            if: "$employee", then: {
                                businessId: "$employee.businessId",
                                businessName: "$employee.empBusiness.businessName",
                                businessLocationName: "$employee.empBusiness.businessLocationName",
                                designation: "$employee.designation",
                                workHours: "$employee.workHours",
                                authorized: "$employee.authorized",
                                available: "$employee.available",
                                status: "$employee.status",
                            }, else: {}
                        }
                    }
                    ,
                    distance: { $round: ["$distance", 2] },
                    trustLevel: "$averageTrust"
                }
            },
        ];

        if (lat && long) {
            const geoNear = {
                near: {
                    type: "Point",
                    coordinates: [long, lat]
                },
                key: "tempAddress.location",
                distanceField: "distance",
                spherical: true,
                distanceMultiplier: 0.001,
                // maxDistance: range * 1000
            }
            //@ts-ignore
            pipeline.unshift({ $geoNear: geoNear });
        }

        if (!isGuest && userId) {
            const friendObj = [
                {
                    $lookup: {
                        from: "friends",
                        let: { recipient: "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        $and: [
                                            { "$eq": ["$requester", new mongoose.Types.ObjectId(userId)] },
                                            { "$eq": ["$recipient", "$$recipient"] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                        ]
                                    },
                                    "businessId": { $exists: false },
                                }
                            },
                        ],
                        as: "friendStatus"
                    }
                },
                { $unwind: { path: "$friendStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "contacts",
                        let: { linkedWith: "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        $and: [
                                            { "$eq": ["$userId", "$$linkedWith"] },
                                            { "$eq": ["$linkedWith", new mongoose.Types.ObjectId(userId)] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                        ]
                                    }
                                }
                            },
                        ],
                        as: "contactStatus"
                    }
                }, { $unwind: { path: "$contactStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "employees",
                        let: { employeeId: "$_id", bId: "$friendStatus.businessId" },
                        // localField: '_id',
                        // foreignField: 'employeeId',
                        as: "employee",
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$employeeId", '$$employeeId'] },
                                        { $eq: ["$businessId", '$$bId'] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "addresses",
                                let: { branchId: "$businessBranch" },
                                // localField: 'businessBranch',
                                // foreignField: '_id',
                                as: "empBusiness",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", '$$branchId']
                                            }
                                        }
                                    }
                                ]
                            }
                        }, {
                            $unwind: {
                                path: "$empBusiness",
                                preserveNullAndEmptyArrays: true
                            }
                        }
                        ]
                    }
                }, {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },]
            //@ts-ignore
            pipeline.splice(2, 0, ...friendObj);
        }

        const User_ = await User.aggregate(pipeline);

        return commonUtils.sendSuccess(req, res, User_);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function methodAllowance(req: any, res: Response) {
    return commonUtils.sendError(req, res, { message: "Request method now allowed." }, 405);
}

const locationList = async (req: Request, res: Response) => {
    try {
        const userId = req.headers.userid as string;
        const isGuest = req.headers.isguest || false;

        let lat = parseFloat(req.query.lat as string);
        let long = parseFloat(req.query.long as string);
        const range = parseInt(req.query.range as string) || 1000;
        const skipId: any = req.query.skipId;
        const type = req.query.type;
        const types = ["business", "people", "group"];
        const search = req.query.search;
        const categoryId = req.query.categoryId as string;


        // let filter:any = {$or:[{"permissions.location.withLinkedContact":true,"permissions.location.withPublic":true}]};
        let filter: any = {};
        let businessFilter: any = {};
        let groupFilter: any = {};

        if (!isGuest && userId) {

            groupFilter = {
                $or: [{
                    private: false
                }, {
                    $or: [
                        { 'members': new mongoose.Types.ObjectId(userId) },
                        { 'admins': new mongoose.Types.ObjectId(userId) }
                    ]
                }
                ]
            };
        }

        if (search) {

            filter = {
                ...filter,
                fullName: { $regex: `${search}`, $options: "i" },
            };
            businessFilter = {
                businessName: { $regex: `${search}`, $options: "i" },
            };
            groupFilter = {
                ...groupFilter,
                name: { $regex: `${search}`, $options: "i" },
            };
        }

        if (skipId && !isGuest) {
            filter = {
                ...filter,
                _id: { $ne: new mongoose.Types.ObjectId(skipId) },
            };
        }

        const userPipeline = [
            {
                $match: {
                    ...filter,
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    address: "$tempAddress.name",
                    location: "$tempAddress.location",
                    profilePic: "$image.profilePic",
                    name: "$userName",
                    fullName: "$fullName",
                    status: { $cond: { if: "$friendStatus", then: "$friendStatus.status", else: 0 } },
                    distance: { $round: ["$distance", 2] },
                    selfAsContact: { $cond: { if: "$contactStatus", then: 1, else: 0 } },
                    userStatus: "$userStatus",
                    permissions: "$permissions",
                    averageTrust: "$averageTrust",
                    online: {
                        $cond: {
                            if: "$_id", then: (!!userMap["$_id"] || !!userMapMobile["$_id"]), else: false
                        }
                    },
                    employee: {
                        $cond: {
                            if: "$employee",
                            then: {
                                businessId: "$employee.businessId",
                                businessName: "$employee.empBusiness.businessName",
                                businessLocationName: "$employee.empBusiness.businessLocationName",
                                designation: "$employee.designation",
                                workHours: "$employee.workHours",
                                authorized: "$employee.authorized",
                                available: "$employee.available",
                                status: "$employee.status",
                            },
                            else: {},
                        },
                    },
                },
            },
        ];

        const businessPipeline = [
            { $match: businessFilter },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryObj",
                },
            },
            { $unwind: { path: "$categoryObj", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "businesses",
                    let: { businessId: "$businessId" },
                    as: "businessObj",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$businessId"] },
                                        { $eq: ["$isApprove", 1] },
                                    ]
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: "categories",
                                let: { categoryId: "$businessCategory" },
                                as: "categoryObj",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$categoryId"],
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                        { $unwind: { path: "$categoryObj", preserveNullAndEmptyArrays: true } },
                    ],
                },
            },
            { $unwind: { path: "$businessObj", preserveNullAndEmptyArrays: false } },
            { $addFields: { isBusiness: true } },
            {
                $project: {
                    _id: 0,
                    id: "$businessId",
                    addressId: "$_id",
                    // "category": {_id: "$categoryObj._id", name: "$categoryObj.name", image: "$categoryObj.image"},
                    name: "$businessName",
                    email: "$email",
                    mobile: "$mobile",
                    locationName: "$businessLocationName",
                    address: "$physicalAddress",
                    isBusiness: "$isBusiness",
                    // @ts-ignore
                    image: { $cond: { if: "$image", then: "$image", else: null } },
                    status: { $cond: { if: "$friendStatus", then: "$friendStatus.status", else: 0 } },
                    location: "$location",
                    distance: { $round: ["$distance", 2] },
                    permissions: "$businessObj.permissions",
                    category: {
                        $cond: {
                            if: "$businessObj.categoryObj",
                            then: {
                                _id: "$businessObj.categoryObj._id",
                                name: "$businessObj.categoryObj.name",
                                image: "$businessObj.categoryObj.image",
                            },
                            else: {},
                        },
                    },
                    userStatus: "$businessObj.businessStatus",
                },
            },
        ];

        const groupPipeline = [
            { $match: { $and: [groupFilter] } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "userId",
                    foreignField: "user_id",
                    as: "creator",
                },
            },
            {
                $lookup:
                {
                    from: "userprofiles",
                    localField: "members",
                    foreignField: "_id",
                    as: "members_info"
                }
            }, {
                $lookup:
                {
                    from: "userprofiles",
                    localField: "admins",
                    foreignField: "_id",
                    as: "admins_info"
                }
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
            { $addFields: { isGroup: true } },
            {
                $project: {
                    _id: 1,
                    chatId: "$chatId",
                    name: "$name",
                    email: "$email",
                    // @ts-ignore
                    image: { $cond: { if: "$image", then: "$image", else: null } },
                    description: "$description",
                    private: "$private",
                    members: "$members_info",
                    admins: "$admins_info",
                    createdBy: {
                        id: "$userId",
                        name: "$creator.name",
                        image: "$creator.image",
                    },
                    location: "$geoTag.location",
                    isGroup: "$isGroup",
                    distance: { $round: ["$distance", 2] },
                },
            },
        ];

        /**
         * DYNAMIC condition for pipeline
         */
        if (!isGuest && userId) {
            const friendObj = [
                {
                    $lookup: {
                        from: "friends",
                        let: { recipient: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    "$expr": {
                                        $and: [
                                            { "$eq": ["$requester", new mongoose.Types.ObjectId(userId)] },
                                            { "$eq": ["$recipient", "$$recipient"] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },                                            
                                        ]
                                    },
                                    "businessId": { $exists: false },
                                },
                            },
                        ],
                        as: "friendStatus",
                    },
                },
                { $unwind: { path: "$friendStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "contacts",
                        let: { linkedWith: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] },
                                            { $eq: ["$linkedWith", "$$linkedWith"] },
                                            // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                        ],
                                    },
                                },
                            },
                        ],
                        as: "contactStatus",
                    },
                },
                { $unwind: { path: "$contactStatus", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "employees",
                        let: { employeeId: "$_id" },
                        // localField: '_id',
                        // foreignField: 'employeeId',
                        as: "employee",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$employeeId", '$$employeeId'] },
                                            { $eq: ["$status", 2] }
                                        ]
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "addresses",
                                    let: { branchId: "$businessBranch" },
                                    // localField: 'businessBranch',
                                    // foreignField: '_id',
                                    as: "empBusiness",
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$_id", "$$branchId"],
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                $unwind: {
                                    path: "$empBusiness",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ];
            //@ts-ignore
            userPipeline.splice(2, 0, ...friendObj);

            const friendObjBusiness = [{
                $lookup: {
                    from: "friends",
                    let: { recipient: "$userId", businessId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$requester", new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ["$recipient", "$$recipient"] },
                                        { $eq: ["$businessId", "$$businessId"] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "friendStatus",
                },
            },
            { $unwind: { path: "$friendStatus", preserveNullAndEmptyArrays: true } }]

            //@ts-ignore
            businessPipeline.splice(2, 0, ...friendObjBusiness);
        }

        if (lat && long && range) {
            const geoNearFun = (key: any) => {
                return {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [long, lat],
                        },
                        key: key,
                        distanceField: "distance",
                        spherical: true,
                        distanceMultiplier: 0.001,
                        maxDistance: range * 1000,
                    },
                };
            };

            types.map(async (el) => {
                switch (el) {
                    case "business":
                        //@ts-ignore
                        businessPipeline.unshift(geoNearFun("location"));
                        break;
                    case "people":
                        //@ts-ignore
                        userPipeline.unshift(geoNearFun("tempAddress.location"));
                        break;
                    case "group":
                        //@ts-ignore
                        groupPipeline.unshift(geoNearFun("geoTag.location"));
                        break;

                    default:
                        break;
                }
            });
        }

        let data: any[];

        switch (type) {
            case "business":
                data = await Address.aggregate(businessPipeline);
                break;

            case "people":
                let userData = await User.aggregate(userPipeline);
                data = userData?.filter((i: any) => {
                    if ((i?.permissions?.location?.withLinkedContact && i.status === 3) || i?.permissions?.location?.withPublic) return i
                })
                break;

            case "group":
                data = await Group.aggregate(groupPipeline);
                break;

            default:
                let User_ = await User.aggregate(userPipeline);
                User_ = User_?.filter((i: any) => {
                    if ((i?.permissions?.location?.withLinkedContact && i.status === 3) || i?.permissions?.location?.withPublic) return i
                })
                User_ = User_.concat(await Address.aggregate(businessPipeline)).concat(await Group.aggregate(groupPipeline));
                data = User_;
                break;
        }

        if (categoryId && data?.length && type === 'business') {
            data = data.filter(i => i.category?._id == categoryId)
        }

        return commonUtils.sendSuccess(req, res, data);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const traceUser = async (req: Request, res: Response) => {
    const userId = req.headers.userid;
    const traceUserId = req.params.id

    if (!traceUserId)
        return commonUtils.sendError(req, res, { message: AppStrings.TRACE_USER_NOT_FOUND })

    if (!userId)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

    // let traceRequests = await Configurable.findOne();
    // if(traceRequests.trace.traceRequest == 0){
    //     return commonUtils.sendError(req, res, {message:AppStrings.LIMIT_NOT_SET})
    // }

    try {
        const user = await User.findOne({ _id: userId });

        const trace_ = await Trace.find({ userId: userId }).count();

        let requests = await tranceRequest.findOne({ userId: userId, status: 0 })
        if (requests)
            return commonUtils.sendSuccess(req, res, { userTrace: 1, message: AppStrings.ALREADY_SEND_REQUEST })

        // const traceRequest = await Trace.findOne({traceUserId: traceUserId, status: 2})
        // if (traceRequest) {
        //     return commonUtils.sendError(req, res, {message: AppStrings.USER_REQUEST_REJECTED})
        // }

        const traceRequest = await Trace.findOne({ userId: userId, traceUserId: traceUserId })
        if (traceRequest) {

            switch (traceRequest.status) {
                case 0:
                    return commonUtils.sendSuccess(req, res, {
                        userTrace: 1,
                        message: AppStrings.REQUEST_ALREADY_SENT_USER
                    })

                case 1:
                    return commonUtils.sendSuccess(req, res, { userTrace: 3, message: AppStrings.USER_CAN_TRACK_NOW })
                case 2:
                    break;
            }

        }

        if (trace_ < user.userTrace) {
            if (userId) {
                const trace = new Trace({
                    userId: userId,
                    traceUserId: traceUserId
                })

                await trace.save();
                // TODO : send notification to traceUserId by userId (trace)
                // notify code
                const pushToken = await User.getPushToken(traceUserId); //get pushtoken of traceUserId user
                await commonUtils.sendNotification({
                    notification: {
                        title: AppStrings.TRACE_USER_REQUEST.TITLE,
                        body: AppStrings.TRACE_USER_REQUEST.BODY.replace(':name', user.fullName)
                    },
                    data: {
                        senderId: userId.toString(), traceUserId: traceUserId,
                        type: NotificationType.TRACE_USER_REQUEST.toString()
                    }
                }, pushToken, traceUserId.toString())
                // notify code end
                return commonUtils.sendSuccess(req, res, { userTrace: 1, message: AppStrings.REQUEST_SENT })
            }
        }
        return commonUtils.sendSuccess(req, res, { userTrace: 2, message: AppStrings.YOUR_LIMIT })
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const traceUserAccpted = async (req: Request, res: Response) => {
    // const traceUserId = req.params.id
    try {

        const traceReqId = req.params.id


        if (!traceReqId)
            return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_NOT_FOUND });
        const userId: any = req.headers.userid;
        if (!userId)
            return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });

        const trace_ = await Trace.findOne({
            _id: traceReqId,
            traceUserId: userId,
            status: 0
        })

        if (!trace_ && req.body.status == 1)
            return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_NOT_FOUND });

        if (req.body.status == 1) {
            await Trace.updateOne({
                _id: new mongoose.Types.ObjectId(traceReqId),
                traceUserId: new mongoose.Types.ObjectId(userId),
                status: 0
            }, { $set: { "status": req.body.status } })

            // TODO : send notification to userId by traceUserId  (trace)
            // notify code
            const pushToken = await User.getPushToken(trace_.userId); //get pushtoken of userId user
            const userData = await User.findById(trace_.traceUserId);
            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.TRACE_USER_REQUEST_APPROVE.TITLE,
                    body: AppStrings.TRACE_USER_REQUEST_APPROVE.BODY.replace(':name', userData.fullName)
                },
                data: {
                    userId: trace_.userId.toString(), traceUserId: trace_.traceUserId.toString(), senderId: trace_.traceUserId.toString(),
                    type: NotificationType.TRACE_USER_REQUEST_APPROVE.toString()
                }
            }, pushToken, trace_.userId.toString())
            // notify code end
            return commonUtils.sendSuccess(req, res, { message: AppStrings.REQUEST_APPROVED, status: 1 })
        } else if (req.body.status == 2) {
            await Trace.deleteOne({
                _id: new mongoose.Types.ObjectId(traceReqId),
                traceUserId: new mongoose.Types.ObjectId(userId),
            })
            // notify code
            const pushToken = await User.getPushToken(trace_.userId); //get pushtoken of userId user
            const userData = await User.findById(trace_.traceUserId);
            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.TRACE_USER_REQUEST_REJECT.TITLE,
                    body: AppStrings.TRACE_USER_REQUEST_REJECT.BODY.replace(':name', userData.fullName)
                },
                data: {
                    userId: trace_.userId.toString(), traceUserId: trace_.traceUserId.toString(), senderId: trace_.traceUserId.toString(),
                    type: NotificationType.TRACE_USER_REQUEST_REJECT.toString()
                }
            }, pushToken, trace_.userId.toString())
            // notify code end
            return commonUtils.sendSuccess(req, res, { message: AppStrings.REQUEST_REJECTED, status: 2 })
        }
    } catch (error) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const deleteTraceUser = async (req: Request, res: Response) => {

    const traceId = req.params.id

    const trace = await Trace.findOne({ _id: traceId })

    if (!trace)
        return commonUtils.sendError(req, res, { message: AppStrings.TRACE_USER_NOT_FOUND }, 404)

    await Trace.deleteOne({ _id: new mongoose.Types.ObjectId(traceId) })

    return commonUtils.sendSuccess(req, res, { message: AppStrings.TRACE_USER_DELETE })

}

const historyList = async (req: Request, res: Response) => {
    const userId: any = req.headers.userid;

    const pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "traceUserId",
                foreignField: "_id",
                as: "userObj",
            },
        },
        {
            $unwind: { path: '$userObj' }
        },
        {
            $project: {
                _id: 1,
                'userId': "$traceUserId",
                'fullName': "$userObj.fullName",
                'userName': "$userObj.userName",
                'image': "$userObj.image.profilePic",
                'address': "$userObj.tempAddress",
                'permissions': "$userObj.permissions",
                'status': "$status",
                'createdAt': "$createdAt",
            },
        },
    ];

    const trace = await Trace.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, trace)

}

const requestList = async (req: Request, res: Response) => {
    const userId: any = req.headers.userid;
    const track = [
        {
            $match: {
                traceUserId: new mongoose.Types.ObjectId(userId),
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userObj",
            },
        },
        {
            $unwind: { path: '$userObj' }
        },
        {
            $project: {
                _id: 1,
                'userId': "$userId",
                'fullName': "$userObj.fullName",
                'userName': "$userObj.userName",
                'image': "$userObj.image.profilePic",
                'permissions': "$userObj.permissions",
                'status': "$status",
                'createdAt': "$createdAt",
            },
        },
    ];

    const trace = await Trace.aggregate(track);
    return commonUtils.sendSuccess(req, res, trace)
}

const addRequest = async (req: Request, res: Response) => {
    let userId = req.headers.userid;
    if (!userId)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })
    const requestUserId = req.params.id
    if (!requestUserId) {
        return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_USER_NOT_FOUND })
    }
    try {
        const user = await User.findOne({ _id: userId });
        const trace_ = await Trace.find({ userId: userId }).count();
        if (trace_ >= user.userTrace) {
            let requests = await tranceRequest.findOne({ userId: userId, status: 0 })
            if (!requests) {
                const request = new tranceRequest({
                    userId: userId,
                    requestUserId: requestUserId,
                    requestedTrace: req.body.requestedTrace
                })

                await request.save();

                return commonUtils.sendSuccess(req, res, request);
            }
            return commonUtils.sendError(req, res, { userTrace: 1, message: AppStrings.ALREADY_SEND_REQUEST }, 409)
        }

        return commonUtils.sendError(req, res, { userTrace: 3, message: AppStrings.YOUR_LIMIT_PENDING })
    } catch (e) {
        console.log(e);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }

}

async function configurableFieldList(req: Request, res: Response) {
    let filed = await Configurable.findOne().sort({ createdAt: -1 })

    if (!filed)
        return commonUtils.sendError(req, res, { message: AppStrings.CONFIGURABLE_NOT_FOUND })

    return commonUtils.sendSuccess(req, res, filed)
}

async function searchUser(req: Request, res: Response) {
    let filter = {};
    var filterTextValue: any = req.query.search;

    const skipIds = req.query?.skipIds;
    const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const name = /[A-z]/;

    if (filterTextValue) {
        if (emailPattern.test(filterTextValue)) {
            filter = { email: filterTextValue };
        } else if (name.test(filterTextValue)) {
            filter = { fullName: { $regex: filterTextValue, $options: "i" } }
        } else {
            filter = { mobile: `+${filterTextValue.trim()}` }
        }
    } else {
        return commonUtils.sendSuccess(req, res, [])
    }

    if (skipIds !== "" && typeof skipIds === "string") {
        //validate skipId array and check mongoose objectId format
        const skipArray = skipIds
            ?.split(",")
            .filter((item) => mongoose.Types.ObjectId.isValid(item))
            ?.map((item) => new mongoose.Types.ObjectId(item));

        filter = {
            $and: [{ _id: { $nin: skipArray } }, filter],
        };
    }

    let user: any = [];

    if (Object.keys(filter).length !== 0) {
        user = await User.find(filter);
    }

    return commonUtils.sendSuccess(req, res, user);
}

async function googleData(req: Request, res: Response) {
    var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + req.body.origin + "&destination=" + req.body.destination + "&mode=" + req.body.mode + "&key=AIzaSyCI-T5kfFDaBGWiLZPAJXzbQa9v7miTYuE";

    const { data } = await curly.get(url)

    return commonUtils.sendSuccess(req, res, data);
}

async function googleNearByData(req: Request, res: Response) {
    var url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?locationbias=circle:30000@" + req.body.location + "&inputtype=textquery&input=" + req.body.keyword + "&key=AIzaSyCI-T5kfFDaBGWiLZPAJXzbQa9v7miTYuE&fields=place_id,formatted_address,name,geometry";
    console.log(url);    
    const { data } = await curly.get(url)    
    var arr: any = [];
    await Promise.all(data.candidates.map(async (val: any, index: any) => {
        if (index < 5) {
            // var phone_url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=" + val.place_id + "&key=AIzaSyCI-T5kfFDaBGWiLZPAJXzbQa9v7miTYuE&fields=formatted_phone_number"
            // const phone_data = await curly.get(phone_url)
            // val.phone_data = phone_data?.data?.result?.formatted_phone_number ?? "";
            val.phone_data = "";
            arr.push(val);
        }
    })
    )
    return commonUtils.sendSuccess(req, res,arr);
}

async function googleDistanceMatrixData(req: Request, res: Response) {
    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + req.body.origins + "&destinations=" + req.body.destinations + "&mode=" + req.body.mode + "&key=AIzaSyCI-T5kfFDaBGWiLZPAJXzbQa9v7miTYuE";

    const { data } = await curly.get(url)

    return commonUtils.sendSuccess(req, res, data);
}

async function userInactive(req: Request, res: Response) {
    let userId = req.headers.userid;
    let date = moment(new Date());
    let end_ = req.body.endDate;
    let end = moment(end_);

    try {

        if (end < date) {
            return commonUtils.sendError(req, res, { message: AppStrings.AFTER_TODAY })
        }

        const user = await User.findOne({ "_id": userId })
        if (!user)
            return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

        if (req.body.status == 0) {
            user.status = req.body.status
            // user.startDate = start.startOf('day'),
            user.endDate = end.endOf('day')

            await user.save()
            await agenda.start();
            await agenda.schedule(user.endDate, "activeUser", { user_id: user._id });
            return commonUtils.sendSuccess(req, res, { message: AppStrings.USER_INACTIVE })
        } else if (req.body.status == 1) {
            user.status = req.body.status
            user.endDate = null

            await user.save()
            return commonUtils.sendSuccess(req, res, { message: AppStrings.USER_ACTIVE })
        }

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

async function verifySelfie(req: Request, res: Response) {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);

    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });

    try {
        user.idVerifySelfie = req.body.idVerifySelfie || user.idVerifySelfie

        user.trustLevel.image = TrustStatus.ACCEPT
        await user.save();

        return commonUtils.sendSuccess(req, res, { message: AppStrings.SELFIE_VERIFY_SUCCESSFULLY }, 200);

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function homeAddressAdd(req: Request, res: Response) {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);

    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });

    let message = {}
    try {
        if (user.address) {

            var new_date = new Date(user.addressDate)
            new_date.setDate(new_date.getDate() + 30);

            if (new Date() > new_date) {

                user.address = {
                    name: req.body?.address?.name,
                    location: {
                        type: "Point",
                        coordinates: [req.body?.address?.longitude, req.body?.address?.latitude]
                    },
                }
                user.HomeAddressDate = new Date()

                user.trustLevel.address = TrustStatus.PENDING
                await user.save();

                message = { 'homeAddress': true };
            } else {
                message = { 'homeAddress': false }
            }
        } else {
            if (req.body.address) {
                user.address = {
                    name: req.body?.address?.name,
                    location: {
                        type: "Point",
                        coordinates: [req.body?.address?.longitude, req.body?.address?.latitude]
                    },
                }
                user.HomeAddressDate = new Date()
                user.trustLevel.address = TrustStatus.PENDING
                await user.save();
            }
        }

        if (user.temporaryAddress) {

            var new_date = new Date(user.addressDate)
            new_date.setDate(new_date.getDate() + 1);

            if (new Date() > new_date) {

                user.temporaryAddress = {
                    name: req.body?.tempAddress?.name,
                    location: {
                        type: "Point",
                        coordinates: [req.body?.temporaryAddress?.longitude, req.body?.temporaryAddress?.latitude]
                    },
                }
                user.addressDate = new Date()
                user.trustLevel.address = TrustStatus.PENDING
                await user.save();
                message = { ...message, 'temporaryAddress': true };
            } else {
                message = { ...message, 'temporaryAddress': false };

            }
        } else {
            if (req.body.temporaryAddress) {
                user.temporaryAddress = {
                    name: req.body?.temporaryAddress?.name,
                    location: {
                        type: "Point",
                        coordinates: [req.body?.temporaryAddress?.longitude, req.body?.temporaryAddress?.latitude]
                    },
                }
                user.addressDate = new Date()
                user.trustLevel.address = TrustStatus.PENDING
                await user.save();
            }
        }
        await user.save();

        if (!(user.permissions?.location?.notShared ?? true) && user.address) {

            const coordinates = new LatLng()
            coordinates.longitude = user.address?.location?.coordinates?.[0]
            coordinates.latitude = user.address?.location?.coordinates?.[1]
            let distance = computeDistanceBetween(coordinates, coordinates)

            // todo Removed by Ajay
            // eventEmitter.emit("addLocationTrace", {
            //     "userId": user_id,
            //     "address": user.address?.location,
            //     "distance": distance,
            //     "result": distance <= AppConstants.DISTANCE_LIMIT_IN_METER
            // })

            /**
             * start agenda after 72 hours  => make 1st verification of home address
             * */
            console.log("evaluateHomeAddressVerification before start");
            await agenda.start()
            console.log("evaluateHomeAddressVerification started for 72 hours");
            await agenda.schedule("72 hours", "evaluateHomeAddressVerification", {
                "userId": user_id,
                "key": 72
            })
        }

        if (message) {
            return commonUtils.sendSuccess(req, res, message, 200);
        }

        return commonUtils.sendSuccess(req, res, { ...message, message: AppStrings.ADDRESS_ADDED_SUCCESSFULLY })
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const processDataReq = async (req: any, res: Response) => {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });
    try {
        console.log("ProcessDataReq user: ", user_id);

        const image_ = multer({
            storage: fileStorage,
            // fileFilter: fileFilter,
        }).single("image");

        image_(req, res, async (err: any) => {

            console.log("ProcessDataReq : ");

            console.log("ERROR ", err)
            if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);
            if (!req.file) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);

            console.log("ProcessDataReq : ", req.file.filename);

            // let fileBuf = fs.readFileSync(req.file.path)

            let verified = await detectFacesGCS(req.file.path)
            console.log("ProcessDataReq AFTER FGCS: ", verified);

            if (verified) {
                const image_name = req.file.filename;

                user.idVerifySelfie = image_name || user.idVerifySelfie
                user.trustLevel.image = TrustStatus.ACCEPT

                const myTrustConstant: number = myTrustLevel(
                    user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
                )

                const trust = await Trust.findOne({
                    combine: myTrustConstant
                }).select("message name star")


                user.averageTrust = trust.star ?? user.averageTrust
                await user.save();
                return commonUtils.sendSuccess(req, res, { message: AppStrings.SELFIE_VERIFY, file: image_name, verifySelfie: 1 });

            } else {
                const image_name = req.file.filename;
                user.idVerifySelfie = image_name || user.idVerifySelfie
                user.trustLevel.image = TrustStatus.INVALID

                const myTrustConstant: number = myTrustLevel(
                    user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
                )

                const trust = await Trust.findOne({
                    combine: myTrustConstant
                }).select("message name star")


                user.averageTrust = trust.star ?? user.averageTrust
                await user.save();
                return commonUtils.sendSuccess(req, res, {
                    message: AppStrings.SELFIE_NOT_VERIFY,
                    file: image_name,
                    verifySelfie: 2
                });

            }

        });

    } catch (e) {
        console.log("ProcessDataReq :", e);

        if (!req.file)
            return commonUtils.sendError(
                req,
                res,
                { message: AppStrings.IMAGE_NOT_FOUND },
                409
            );
    }
}

async function detectFacesGCS(buffer: any) {
    try {
        const client = new vision.ImageAnnotatorClient()
        console.log("Client:", client)
        const [result] = await client.faceDetection(buffer)
        const faces = result.faceAnnotations;
        console.log('Face', faces);

        return faces.length == 1;
    } catch (e) {
        return false
    }

}


const chatCategoryList = async (req: any, res: Response) => {
    try {
        const search = req.query.search

        var total_ = await Category.find({
            parentId: { $exists: true, $ne: null },
        }).sort({ createdAt: -1 }).countDocuments();

        let fillter = {}
        if (search) {
            fillter = {
                $or: [{
                    name: { $regex: `${search}`, $options: 'i' }
                }]
            }
        }
        var a: any = null
        let pipline = [
            {
                $match: {
                    'parentId': {
                        $ne: a
                    }
                }
            },
            {
                $lookup: {
                    from: 'chatcategories',
                    localField: '_id',
                    foreignField: 'parentId',
                    as: 'child'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: "$name",
                    // subCategory: "$Data",
                    "child._id": 1,
                    "child.name": 1
                }
            }
        ]

        const category = await Category.aggregate(pipline);

        return commonUtils.sendAdminSuccess(req, res, category);
    } catch (error) {
        console.log(error);

        return commonUtils.sendAdminError(req, res, { error: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function groupListing(req: Request, res: Response) {
    try {
        const userId = req.headers.userid as string;
        const isGuest = req.headers.isguest || false;
        console.log({ userId });

        let lat = parseFloat(req.query.lat as string);
        let long = parseFloat(req.query.long as string);
        const range = parseInt(req.query.range as string) || 1000;

        const search = req.query.search;

        let groupFilter: any = {
            $or: [{
                private: false
            }]
        };

        if (!isGuest && userId) {
            const memberCheck = {
                $or: [
                    { 'members': new mongoose.Types.ObjectId(userId) },
                    { 'admins': new mongoose.Types.ObjectId(userId) }
                ]
            }
            groupFilter.$or.push(memberCheck)
        }

        if (search) {
            console.log("SEARCH ", search);
            groupFilter = {
                ...groupFilter,
                name: { $regex: `${search}`, $options: "i" },
            };
        }

        const groupPipeline = [
            { $match: { $and: [groupFilter] } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "userId",
                    foreignField: "user_id",
                    as: "creator",
                },
            },
            { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
            { $addFields: { isGroup: true } },
            {
                $project: {
                    _id: 1,
                    chatId: "$chatId",
                    name: "$name",
                    email: "$email",
                    // @ts-ignore
                    image: { $cond: { if: "$image", then: "$image", else: null } },
                    description: "$description",
                    private: "$private",
                    members: "$members",
                    admins: "$admins",
                    createdBy: {
                        id: "$userId",
                        name: "$creator.name",
                        image: "$creator.image",
                    },
                    location: "$geoTag.location",
                    addressData: {
                        // @ts-ignore
                        name: { $cond: { if: "$geoTag.name", then: "$geoTag.name", else: null } },
                        // @ts-ignore
                        address: { $cond: { if: "$geoTag.address", then: "$geoTag.address", else: null } },
                    },
                    isGroup: "$isGroup",
                    distance: { $round: ["$distance", 2] },
                },
            },
        ];

        if (lat && long && range) {
            const geoNear = {
                near: {
                    type: "Point",
                    coordinates: [long, lat],
                },
                key: "geoTag.location",
                distanceField: "distance",
                spherical: true,
                distanceMultiplier: 0.001,
                maxDistance: range * 1000,
            };
            //@ts-ignore
            groupPipeline.unshift({ $geoNear: geoNear });
        }

        const data = await Group.aggregate(groupPipeline);

        return commonUtils.sendSuccess(req, res, data);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

async function userDeleteRequest(req: Request, res: Response) {
    let userId: any = req.headers.userid
    let businessId: any = req.body?.businessId
    let status = req.body.status

    let user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) })

    let business = Business.findOne({_id: new mongoose.Types.ObjectId(businessId)})

    try {

        if (businessId) {
            let data = await DeleteRequest.findOne({ businessId: new mongoose.Types.ObjectId(businessId), isDelete: 0, status: 1 })
            if (data)
                return commonUtils.sendError(req, res, { message: AppStrings.ALREADY_SEND_REQUEST })
        } else {
            let data = await DeleteRequest.findOne({ userId: new mongoose.Types.ObjectId(userId), isDelete: 0, status: 0 })
            if (data)
                return commonUtils.sendError(req, res, { message: AppStrings.ALREADY_SEND_REQUEST })
        }

        let request = new DeleteRequest({
            userId: userId,
            reason: req.body.reason,
            status: status, // user 0, business 1,
            businessId: businessId
        })

        await request.save()

        if (status == 0) {
            user.isDeleted = 1;
            await user.save()
        } else {
            await Business.findByIdAndUpdate(businessId, { $set: { isDeleted: 1 } })
        }

        return commonUtils.sendSuccess(req, res, { messgae: AppStrings.DELETE_REQUEST })

    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

async function trustList(req: Request, res: Response) {
    let userId: any = req.headers.userid

    let pipline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                _id: 0,
                trustDetails: "$trustLevel"
            }
        }
    ]

    const userTrust = await User.aggregate(pipline);

    return commonUtils.sendSuccess(req, res, userTrust[0])
}

const processDataReqWeb = async (req: any, res: Response) => {
    const user_id = req.headers.userid;
    const user = await User.findById(user_id);
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });
    try {
        const image_ = multer({
            storage: fileStorage,
            // fileFilter: fileFilter,
        }).single("image");

        image_(req, res, async (err: any) => {

            if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);
            if (!req.body.image.data) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);

            let fileBuf = Buffer.from(req.body.image.data)

            const hash = md5(Date.now()) + '.jpg';
            let filename = path.join(__dirname, '../../../src/uploads/images/' + hash)
            let newfileName = ('src/uploads/images/' + hash)

            await fs.writeFile(filename, fileBuf, function (err: any, data: any) {
                if (err) console.log('error', err);
            })

            let verified = await detectFacesGCS(newfileName)
            console.log("verified", verified)

            if (verified) {
                const image_name = hash;
                user.idVerifySelfie = image_name || user.idVerifySelfie
                user.trustLevel.image = TrustStatus.ACCEPT

                const myTrustConstant: number = myTrustLevel(
                    user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
                )

                const trust = await Trust.findOne({
                    combine: myTrustConstant
                }).select("message name star")


                user.averageTrust = trust.star ?? user.averageTrust
                await user.save();
                return commonUtils.sendSuccess(req, res, { message: AppStrings.SELFIE_VERIFY, file: image_name, verifySelfie: 1 });

            }
            else {
                const image_name = hash;
                user.idVerifySelfie = image_name || user.idVerifySelfie
                user.trustLevel.image = TrustStatus.INVALID

                const myTrustConstant: number = myTrustLevel(
                    user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
                    user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING,
                )

                const trust = await Trust.findOne({
                    combine: myTrustConstant
                }).select("message name star")


                user.averageTrust = trust.star ?? user.averageTrust
                await user.save();
                return commonUtils.sendSuccess(req, res, {
                    message: AppStrings.SELFIE_NOT_VERIFY,
                    file: image_name,
                    verifySelfie: 2
                });

            }

        });

    } catch (e) {
        console.log(e)

        if (!req.file)
            return commonUtils.sendError(
                req,
                res,
                { message: AppStrings.IMAGE_NOT_FOUND },
                409
            );
    }
}

async function genrateUniqueToken(token_: string) {
    let token = token_;
    let count = 0;
    while (true) {
        const token_ = await Token.findOne({ token: token });
        if (!token_) break;
        count += 1;
        token = token_ + count;
    }
    return token;
}

async function veriyFirebaseMobileOtp(req: Request, res: Response) {

    const idToken = req.body.verificationToken

    const device: any = req.body?.device


    getAuth().verifyIdToken(idToken)
        .then(async (decodedToken: any) => {
            const uid = decodedToken.uid;


            if (req.body.isForgot == true) {
                const user = await User.findOne({ mobile: decodedToken.phone_number })

                user.isVerify = 1;
                user.firebaseUid = decodedToken.user_id;

                await user.save()

                let resetToken = crypto.randomBytes(64).toString("hex");
                resetToken = await genrateUniqueToken(resetToken);
                const hash_ = await bcrypt.hash(resetToken, Number(config.get("saltRounds")));

                await Token.deleteOne(user._id);

                const tokenData = new Token({
                    userId: user._id,
                    token: resetToken,
                    otp: 1111,
                    device: device,
                    isForgot: req.body.isForgot,
                    isVerified: true
                });


                await tokenData.save();

                return commonUtils.sendSuccess(req, res, { token: tokenData.token })
            }

            const user = await User.findOne({ mobile: decodedToken.phone_number })

            user.isVerify = 1;
            user.firebaseUid = decodedToken.user_id;

            await user.save();

            return commonUtils.sendSuccess(req, res, {}, 200);

        })
        .catch((error: any) => {
            // Handle error
            console.log(error);

        });

}

async function existMobile(req: Request, res: Response) {

    const mobile = req.body.userName?.[UserData.MOBILE.toString()];
    const isAvailable = req.body.isAvailable // for check mobile already use for 0 
    const isBusiness = req.body.isBusiness  // 1 for business, 0 for user

    if (!mobile) {
        return commonUtils.sendError(req, res, { message: AppStrings.MOBILE_REQUIRED })
    }

    if (isAvailable == 1) {
        if (isBusiness == 1) {
            const business = await Business.findOne({ mobile: mobile })
            if (!business) {
                return commonUtils.sendError(req, res, { message: AppStrings.BUSINESS_NOT_FOUND })
            }
            return commonUtils.sendSuccess(req, res, { business: true })
        } else {
            const user = await User.findOne({ mobile: mobile })
            if (!user) {
                return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })
            }
            return commonUtils.sendSuccess(req, res, { user: true })
        }
    } else if (isAvailable == 0) {
        if (isBusiness == 1) {
            const business = await Business.findOne({ mobile: mobile })
            if (business) {
                return commonUtils.sendError(req, res, { message: AppStrings.MOBILE_EXISTS })
            }
            return commonUtils.sendSuccess(req, res, { business: true })
        } else {
            const user = await User.findOne({ mobile: mobile })
            if (user) {
                return commonUtils.sendError(req, res, { message: AppStrings.MOBILE_EXISTS })
            }
            return commonUtils.sendSuccess(req, res, { user: true })
        }
    }

}

async function contactToAdmin(req: Request, res: Response) {
    const replyMessage = req.body.message
    eventEmitter.emit("user_to_admin_contact_us", {
        to: req.body.email,
        subject: req.body.subject,
        data: {
            message: replyMessage,
            name: req.body.name,
            email: req.body.email
        },
    });

    return commonUtils.sendSuccess(req, res, { message: true })
}

//TODO: updated selfie verification filed in trust-leval
async function FaceVerification(req: Request, res: Response) {
    let userId = req.headers.userid

    let status = req.body.status

    let user = await User.findOne({ _id: userId })

    if (user) {
        var new_date = new Date(user?.selfieUpdateAt)
        new_date.setDate(new_date.getDate() + 30);

        if (status == 3) {
            if (new Date() > new_date) {
                user.trustLevel.image = status

                user.selfieUpdateAt = new Date()
                await user.save()

                return commonUtils.sendSuccess(req, res, { isAvailble: 1 })
            }
            else {
                return commonUtils.sendSuccess(req, res, { isAvailble: 0 })
            }
        } else {
            user.trustLevel.image = status
            await user.save()
            return commonUtils.sendSuccess(req, res, { isAvailble: 1 })
        }

    } else {
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })
    }
}

export default {
    searchUser,
    uploadImage,
    getProfile,
    setLocation,
    profileCompleted,
    profileSetting,
    uploadFile,
    updateLocationEveryHour,
    submitUserReferences,
    submitUserDocumentId,
    submitUserDocumentMinor,
    userDocumentsMinor,
    userDocumentsMinorVerify,
    requestUserDocumentOtp,
    requestUserDocumentOtpVerify,
    idTypes,
    checkUserNameAvailability,
    listOfUserLocation,
    methodAllowance,
    getOtherProfile,
    locationList,
    traceUser,
    traceUserAccpted,
    historyList,
    requestList,
    addRequest,
    configurableFieldList,
    googleData,
    googleNearByData,
    googleDistanceMatrixData,
    userInactive,
    verifySelfie,
    homeAddressAdd,
    processDataReq,
    listOfUser,
    detectFacesGCS,
    deleteTraceUser,
    chatCategoryList,
    groupListing,
    userDeleteRequest,
    trustList,
    processDataReqWeb,
    veriyFirebaseMobileOtp,
    existMobile,
    contactToAdmin,
    FaceVerification
}