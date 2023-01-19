import {AppStrings} from "../../utils/appStrings";

const Business = require('./models/businessModel');
const Address = require('./models/addressModel');
const Category = require('../admin/models/category');
const Friends = require('../userLink/models/friends');
import express, {NextFunction, Request, Response} from "express";


import userAuth from "../userAuth/authController";

import commonUtils, {
    fileFilter,
    fileFilterAudio, fileFilterVideo,
    fileStorage,
    fileStorageAudio,
    fileStorageVideo
} from "../../utils/commonUtils";
import {FriendStatus, Recognise, TrustStatus} from "../../utils/enum";
import mongoose from "mongoose";
import {AppConstants} from "../../utils/appConstants";
import eventEmitter from "../../utils/event";
import {documentTypes} from "../../utils/idVerificationUtils";
import {LogContext} from "twilio/lib/rest/serverless/v1/service/environment/log";
import moment from "moment";
import email from "../email";

const multer = require("multer");
const fs = require("fs");
const User = require('../users/models/userModel');
const ffmpeg = require('fluent-ffmpeg');

const uploadImage = async (req: Request, res: Response) => {
    const image_ = multer({
        storage: fileStorage,
        fileFilter: fileFilter,
    }).single("image");

    image_(req, res, async (err: any) => {
        if (err) return commonUtils.sendError(req, res, {message: AppStrings.IMAGE_NOT_UPLOADED}, 409);
        if (!req.file) return commonUtils.sendError(req, res, {message: AppStrings.IMAGE_NOT_FOUND}, 409);
        const image = req.file.filename;
        return commonUtils.sendSuccess(req, res, {
            image: image,
        }, 200);
    });
}

async function createBusiness(req: any, res: Response) {
    const user_id = req.headers.userid;
    let user = await User.findById(user_id);
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    const start_time = req.body.workHours.startTime;    
    const end_time = req.body.workHours.endTime;
    // const start_time_ = moment(`${start_time}`, 'hh:mm a').toISOString();
    // const end_time_ = moment(`${end_time}`, 'hh:mm a').toISOString();

    if (start_time >= end_time)
        return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID})

    // if (moment(start_time, 'YYYY-MM-DD hh:mm a').isAfter(moment(end_time, 'YYYY-MM-DD hh:mm a'))) return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID}, 422);

    try {

        const business = new Business({
            userId: new mongoose.Types.ObjectId(user_id),
            name: req.body.name,
            image: req.body.image,
            businessCategory: new mongoose.Types.ObjectId(req.body.categoryId),
            mobile: req.body.mobile,
            email: req.body.email,
            bio: req.body.bio,
            businessStatus: req.body.businessStatus,
            optionalMobile: {
                secondary: req.body?.secondary || "",
                alternative: req.body?.alternative || "",
            },
            isApprove: /*user.averageTrust == 4 ? 1 :*/ 0,
            permissions: {
                acceptMessage: {
                    public: true,
                    contact: true,
                    marketing: true
                },
                visibility: {
                    picture: true,
                    status: true,
                    post: true
                },
                location: {
                    whileUsingApp: false,
                    withLinkedContact: false,
                    withPublic: true,
                    notShared: false,
                },
            },
            designation: req.body.designation,
            workHours: {
                startTime: start_time,
                endTime: end_time
            },
        })

        await business.save();


        const address = new Address({
            userId: new mongoose.Types.ObjectId(user_id),
            businessId: business._id,
            businessName: req.body.name,
            businessLocationName: req.body.address.businessLocationName,
            physicalAddress: req.body.address.physicalAddress,
            image: business.image,
            location: {
                type: "Point",
                coordinates: [req.body.address.longitude, req.body.address.latitude]
            },
            description: "",
            email: req.body.email,
            categoryId: req.body.businessCategory,
            mobile: req.body.mobile,
            primaryAddress: true
        });

        await address.save();


        return commonUtils.sendSuccess(req, res, {"_id": business._id});
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
}

async function updateBusiness(req: any, res: Response) {
    const businessId = req.headers.businessid as string;

    const business = await Business.findById(businessId);

    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    const address = await Address.findOne({businessId: new mongoose.Types.ObjectId(businessId), primaryAddress: true})

    const start_time = req.body.workHours?.startTime;
    const end_time = req.body.workHours?.endTime;
    // const start_time_ = moment(`${start_time}`, 'hh:mm a').toISOString();
    // const end_time_ = moment(`${end_time}`, 'hh:mm a').toISOString();
    if (start_time >= end_time)
        return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID})
    // if (moment(start_time, 'YYYY-MM-DD hh:mm a').isAfter(moment(end_time, 'YYYY-MM-DD hh:mm a'))) return commonUtils.sendError(req, res, {message: AppStrings.TIME_INVALID}, 422);
    
    try {
        business.name = req.body.name || business.name;
        business.image = req.body.image || business.image;
        business.businessCategory = req.body.categoryId || business.businessCategory;
        business.mobile = req.body.mobile || business.mobile;
        business.email = req.body.email || business.email;
        business.bio = req.body.bio || business.bio;
        business.optionalMobile.secondary = req.body.secondary || business.optionalMobile.secondary;
        business.optionalMobile.alternative = req.body.alternative || business.optionalMobile.alternative;
        business.businessStatus = req.body.businessStatus || business.businessStatus;
        business.permissions = req.body.permissions || business.permissions;
        business.designation = req.body.designation || business.designation;

        if (req.body.workHours) {
            business.workHours.startTime = start_time || business.workHours.startTime;
            business.workHours.endTime = end_time || business.workHours.endTime;
        }
        
        await business.save();

        if (req.body.mobile || req.body.email) {
           let check = await Address.findOne({ businessId: new mongoose.Types.ObjectId(businessId), primaryAddress: true})
           if (req.body.mobile) {
               check.mobile = req.body.mobile || check.mobile;
           }if (req.body.email) {
               check.email = req.body.email || check.email;
           }
           await check.save();
        }
        
        if (req.body?.address) {
            const query = {businessId: new mongoose.Types.ObjectId(businessId), primaryAddress: true}
            const updateDocument = {
                $set: {
                    "businessLocationName": req.body.address.businessLocationName ,
                    "physicalAddress": req.body.address.physicalAddress ,
                    "location": {
                        type: "Point",
                        coordinates: (req.body.address.longitude && req.body.address.latitude) ? [req.body.address.longitude, req.body.address.latitude] : business.coordinates,
                    }
                }
            };

            await Address.updateOne(query, updateDocument, {
                new: true
            });
        }

        return commonUtils.sendSuccess(req, res, {message: AppStrings.UPDATE});
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

async function listBusiness(req: any, res: Response) {
    const user_id = req.headers.userid;
    // const business = await Business.find({userId: new mongoose.Types.ObjectId(user_id)}).select('_id name image');
    const pipeline = [
        {$match: {userId: new mongoose.Types.ObjectId(user_id)}},
        {
            $project: {
                _id: 1,
                name: "$name",
                image: "$image",
                permissions: "$permissions",
                isDeleted: "$isDeleted"
            },
        },
    ]

    if (!pipeline.length) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);
    const userData = await Business.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, userData);
}

async function getBusiness(req: any, res: Response) {
    const userId = req.headers.userid as string;
    const businessId = req.params.id as string;
    const addressId = req.query.addressId?.length > 0 ? req.query.addressId : null;
    const business = await Business.findOne({_id: new mongoose.Types.ObjectId(businessId)}).exec();
    let filter = {}
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    let friendStatus;
    if (userId) {
        friendStatus = await Friends.findOne({requester: userId, businessId: businessId});
    }
    // if (addressId) {
    //     filter = {
    //         "address._id": addressId
    //     }
    // }

    // TODO : GET ADDRESS OBJECT FROM ADDRESS LIST WHERE PRIMARY IS TRUE

    const pipeline = [
        {$match: {_id: new mongoose.Types.ObjectId(businessId)}},
        {
            $lookup: {
                from: 'addresses',
                let: {businessId: "$_id"},
                // localField: '_id',
                // foreignField: 'businessId',
                pipeline: [{
                    $match: {
                        $expr: {
                        $and: [
                            {"$eq": ["$_id",  new mongoose.Types.ObjectId(addressId)]},
                            {"$eq": ["$businessId", "$$businessId"]},
                            // {"$eq": ["$primaryAddress", true]}
                        ]}
                    }
                }],
                as: 'addressData',
            }
        },
        {$unwind: {path: "$addressData", preserveNullAndEmptyArrays: true}},
        {
            $lookup: {
                from: "contacts",
                let: {linkedWith: "$userId"},
                pipeline: [
                    {
                        "$match": {
                            "$expr": {
                                $and: [
                                    {"$eq": ["$userId", new mongoose.Types.ObjectId(userId)]},
                                    {"$eq": ["$linkedWith", "$$linkedWith"]},
                                    // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                ]
                            }
                        }
                    },
                ],
                as: "contactStatus"
            }
        }, {$unwind: {path: "$contactStatus", preserveNullAndEmptyArrays: true}},
        {
            $lookup: {
                from: 'friends',
                let: {
                    recId: "$_id",
                    ownerId: "$userId"
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [
                                {$eq: ['$businessId', '$$recId']},
                                {
                                    $ne: ['$recipient', '$$ownerId']
                                }
                            ]
                        }
                    }
                }, {
                    $count: "linkedCount"
                }, {
                    $project: {linkedCount: 1}
                }],
                as: 'linkedCount'
            }
        },
        {
            $unwind: {
                path: '$linkedCount',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                id: "$_id",
                userId: "$userId",
                name: "$name",
                image: "$image",
                bio: "$bio",
                isMobileVerified: "$isMobileVerified",
                isEmailVerified: "$isEmailVerified",
                businessStatus: "$businessStatus",
                optionalMobile: "$optionalMobile",
                address: "$addressData",
                trustLevelCount: "$trustLevelCount" ?? 0,
                postCount: 56,
                eventsCount: 56,
                linkedUserCount: {$cond: {if: "$linkedCount", then: "$linkedCount.linkedCount", else: 0}},
                contact: {$cond: {if: "$contactStatus", then: 1, else: 0}},
                permissions: {
                    $cond: {
                        if: "$permissions",
                        then: "$permissions",
                        else: {
                            acceptMessage: {
                                public: true,
                                contact: true,
                                marketing: true
                            },
                            visibility: {
                                picture: true,
                                status: true,
                                post: true
                            },
                            location: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            },
                        }
                    }
                },
                designation:"$designation",
                workHours:{
                    startTime:"$startTime",
                    endTime:"$endTime"
                },
                isDeleted:"$isDeleted"
            },
        },
    ]
    let userData = await Business.aggregate(pipeline);

    if (friendStatus && userData) {
        userData[0].friendStatus = friendStatus.status
    } else if (userData) {
        userData[0].friendStatus = 0
    }
    return commonUtils.sendSuccess(req, res, userData ? userData[0] : {});
}

async function idTypes(req: any, res: Response) {
    return commonUtils.sendSuccess(req, res, documentTypes, 200);
}

async function verifyDocument(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    const business = await Business.findById(businessId);
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    let {
        registrationNumber,
        image,
        secondaryNumber,
        countryCode,
        documentType
    } = req.body

    try {
        business.document = {
            registrationNumber: registrationNumber,
            image: image,
            secondaryNumber: secondaryNumber,
            address: {
                name: req.body?.address?.name ?? "",
                location: {
                    type: "Point",
                    coordinates: [req.body?.address?.longitude ?? 0.0, req.body?.address?.latitude ?? 0.0]
                }
            },
            country: documentTypes[countryCode]?.code,
            docType: documentType,
        }
        // user.trustLevel.id = TrustStatus.ACCEPT // FOR TEST PURPOSE
        await business.save();

        return commonUtils.sendSuccess(req, res, {"_id": business._id});

    } catch (e) {
        console.log(e)
    }
}

async function permissionSetting(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    const business = await Business.findOne({_id: new mongoose.Types.ObjectId(businessId)}).exec();
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

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
                },
                acceptMessage: {
                    public: req.body.acceptMessage.public,
                    contact: req.body.acceptMessage.contact,
                    marketing: req.body.acceptMessage.marketing,
                },
            },
        }

        business.permissions = setting.permissions;
        await business.save();

        return commonUtils.sendSuccess(req, res, {"_id": business._id});

    } catch (e) {
        console.log(e);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
}

async function advertisement(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    const business = await Business.findById(businessId).exec();
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    try {
        business.advertisement = {
            message: req.body.message,
            video: req.body.video,
            image: req.body.image,
            audio: req.body.audio
        }

        await business.save();
        return commonUtils.sendSuccess(req, res, {"_id": business._id});
    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
}

async function submitReferences(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    let reference: any = [];
    const refs = req.body;

    const business = await Business.findById(businessId);

    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    if (!Array.isArray(refs) && !refs.length) {
        return commonUtils.sendError(req, res, {error: AppStrings.INVALID_DATA})
    }

    await Promise.all(refs.map(async (element: any) => {
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

    business.reference = reference
    // Business.trustLevel.reference = TrustStatus.ACCEPT // FOR TEST PURPOSE
    await business.save()
    eventEmitter.emit('business.checkOnReferencesEndorsed', {businessId: business._id})

    return commonUtils.sendSuccess(req, res, {"_id": business._id});
}

async function getProfile(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    const business = await Business.findById(businessId).exec();

    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    let businessCategoryData: any = null
    if (business.businessCategory) {
        const data = await Category.findById(business.businessCategory).select('_id name')
        if (data) {
            businessCategoryData = {
                id: data._id,
                name: data.name,
            }
        }
    }


    const pipeline = [
        {$match: {_id: new mongoose.Types.ObjectId(businessId)}},
        {
            $lookup: {
                from: 'addresses',
                localField: '_id',
                foreignField: 'businessId',
                as: 'addressData',
                pipeline: [{
                    $match: {
                        $expr: {$eq: ["$primaryAddress", true]}
                    }
                }]
            }
        },
        {$unwind: {path: "$addressData", preserveNullAndEmptyArrays: true}},
        {
            $project: {
                _id: 0,
                id: "$_id",
                userId: "$userId",
                name: "$name",
                image: "$image",
                bio: "$bio",
                isProfileComplete: "$isProfileComplete",
                businessCategory: businessCategoryData,
                isMobileVerified: "$isMobileVerified",
                isEmailVerified: "$isEmailVerified",
                businessStatus: "$businessStatus",
                optionalMobile: "$optionalMobile",
                address: "$addressData",
                trustLevelCount: "$trustLevelCount" ?? 0,
                document: "$document",
                postCount: 56,
                eventsCount: 56,
                permissions: {
                    $cond: {
                        if: "$permissions",
                        then: "$permissions",
                        else: {
                            acceptMessage: {
                                public: true,
                                contact: true,
                                marketing: true
                            },
                            visibility: {
                                picture: true,
                                status: true,
                                post: true
                            },
                            location: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            },
                        }
                    }
                },
                designation:"$designation",
                "workHours.startTime":1,
                "workHours.endTime":1,
                isDeleted:"$isDeleted"
            },
        },
    ]
    let userData = await Business.aggregate(pipeline);

    return commonUtils.sendSuccess(req, res, userData ? userData[0] : {});
}

async function uploadAudio(req: any, res: Response) {
    const audio = multer({
        storage: fileStorageAudio,
        fileFilter: fileFilterAudio,
    }).single("audio");

    audio(req, res, async (err: any) => {
        if (err) {
            return commonUtils.sendError(req, res, {message: AppStrings.AUDIO_NOT_UPLOADED}, 409);
        }
        if (!req.file) return commonUtils.sendError(req, res, {message: AppStrings.AUDIO_NOT_FOUND}, 404);
        const image_name = req.file.filename;
        return commonUtils.sendSuccess(req, res, {
            audio: image_name
        }, 200);
    });
}

async function uploadVideo(req: any, res: Response) {
    try {
        const video = multer({
            storage: fileStorageVideo,
            fileFilter: fileFilterVideo,
        }).single("video");

        video(req, res, async (err: any) => {
            if (err) {
                return commonUtils.sendError(req, res, {message: AppStrings.VIDEO_NOT_UPLOADED}, 409);
            }
            if (!req.file) return commonUtils.sendError(req, res, {message: AppStrings.VIDEO_NOT_FOUND}, 404);

            ffmpeg('./src/uploads/video/' + req.file.filename)
                .on('filenames', function (filenames: any) {
                    console.log('Will generate ' + filenames.join(', '))
                }).on('error', function (err: any, stdout: any, stderr: any) {
                console.log(err);
                console.log(stderr);
                return res.status(422).json({
                    'message': "oops ,Something Went Wrong !!",
                });
            }).on('end', function () {
                const responseData = {
                    "video": req.file.filename,
                    "thumbnail": 'thumb/' + req.file.filename.substring(0, req.file.filename.indexOf(".")) + ".jpg"
                }
                return commonUtils.sendSuccess(req, res, responseData);
            }).screenshots({
                filename: req.file.filename.substring(0, req.file.filename.indexOf(".")) + ".jpg",
                count: 1,
                folder: './src/uploads/video/thumb/',
                size: '320x240'
            });
        });
    } catch (error) {
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
}

//TODO::(nensi) set validation -> only authorized user can add address [not anyone]
async function addAddress(req: any, res: Response) {
    let businessId = req.headers.businessid;
    const business = await Business.findById(businessId)
    if (!business) return commonUtils.sendError(req, res, {error: AppStrings.BUSINESS_NOT_FOUND})

    const address = new Address({
        userId: req.headers.userid,
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

async function updateAddress(req: any, res: Response) {
    let businessId = req.headers.businessid;
    let userId = req.headers.userid
    if (!req.body.id) {
        return commonUtils.sendError(req, res, {message: AppStrings.INVALID_DATA}, 409);
    }
    const addressCheck = await Address.findOne({_id: req.body.id, userId: userId, businessId: businessId}).exec();
    if (!addressCheck) return commonUtils.sendError(req, res, {message: AppStrings.ADDRESS_NOT_FOUND}, 409);

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

    return commonUtils.sendSuccess(req, res, {message: AppStrings.UPDATE});
}

async function listAddress(req: any, res: Response) {
    let businessId = "";
    if(req.query.businessId){
        businessId = req.query.businessId as string;
    }else{
        businessId = req.headers.businessid as string;
    }
    
    let filterText = {};

    if (req.query.businessName) {
        filterText = {
            $or: [
                {businessName: {$regex: `${req.query.businessName}`, $options: "i"}},
            ],
        }
    }
    if (req.query.physicalAddress) {
        filterText = {
            $or: [
                {physicalAddress: {$regex: `${req.query.physicalAddress}`, $options: "i"}},
            ],
        }
    }
    if (req.query.email) {
        filterText = {
            $or: [
                {email: {$regex: `${req.query.email}`, $options: "i"}},
            ],
        }
    }

    if (req.query.mobile) {
        filterText = {
            $or: [
                {mobile: {$regex: `${req.query.mobile.trim()}`, $options: "i"}},
            ],
        }
    }


    const business = await Address.find(req.query ? {
        ...filterText,
        businessId: new mongoose.Types.ObjectId(businessId)
    } : {businessId: new mongoose.Types.ObjectId(businessId)});

    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    return commonUtils.sendSuccess(req, res, business ?? []);
}

async function deleteAddress(req: any, res: Response) {
    const businessId = req.headers.businessid as string;
    const userId = req.headers.userid as string;
    const addressId = req.params.id as string;
    try {
        const result = await Address.deleteOne({
            _id: new mongoose.Types.ObjectId(addressId),
            businessId: new mongoose.Types.ObjectId(businessId),
            userId: new mongoose.Types.ObjectId(userId),
        });
        if(result.deletedCount){
            return commonUtils.sendSuccess(req, res, {message: AppStrings.DELETE});
        }else{
            return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});            
        }        
    } catch (error) {
        return commonUtils.sendError(req, res, {error: AppStrings.SOMETHING_WENT_WRONG});
    }
}

async function categoryList(req: any, res: Response) {

    let category = await Category.aggregate([
        {
            $match: {
                parentId: null
            }
        },
        {
            $graphLookup: {
                from: "categories",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "parentId",
                as: "child"
            }
        },
        // { $unwind: '$child' },
        {
            $project: {
                _id: 0,
                name: "$name",
                image: "$image",
                'child': {
                    $map: {
                        input: '$child',
                        as: 'childs',
                        in: {
                            "id": "$$childs._id",
                            "name": "$$childs.name"
                        }
                    },
                },
                id: "$_id",
            }
        }
    ])

    return commonUtils.sendAdminSuccess(req, res, category);

}

//ignore
async function subCategoryList(req: Request, res: Response) {

    let subCategory = await Category.aggregate([
        {
            $match: {
                parentId: {$ne: null}
            },
        }, {
            $graphLookup: {
                from: "categories",
                startWith: "$parentId",
                connectFromField: "parentId",
                connectToField: "_id",
                as: "parent"
            }
        },
        {$unwind: '$parent'},
        {
            $project: {
                _id: 1,
                name: 1,
                isActive: 1,
                'parent._id': 1,
                'parent.name': 1
            }
        }
    ])
    return commonUtils.sendAdminSuccess(req, res, subCategory);
}

const getBusinessClusterApi = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const isGuest = req.headers.isguest || false
    const search: any = req.query.search;
    const skipId: any = req.query.skipId;

    let lat = parseFloat(req.query.lat as string);
    let long = parseFloat(req.query.long as string);
    const range = req.query.range || 1000;

    let filter: any = {};
    if (!lat && !long && userId && !isGuest) {
        let {address} = await User.findById(userId)
        if (address?.location) {
            [long, lat] = address.location.coordinates
        }
    }

    if (skipId && !isGuest) {
        filter = {
            userId: {$ne: new mongoose.Types.ObjectId(skipId)}
        };
    }

    if (search) {
        filter = {
            ...filter,
            'businessName': {$regex: `${search}`, $options: "i"}
        }
    }

    try {
        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [long, lat]
                    },
                    key: "location",
                    distanceField: "distance",
                    spherical: true,
                    distanceMultiplier: 0.001,
                    maxDistance: Number(range) * 1000
                }
            },
            {$match: filter},
            {$sort: {createdAt: -1}},
            {
                $lookup: {
                    from: "businesses",
                    // localField: "businessId",
                    // foreignField: "_id",
                    let: {businessId: "$businessId"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {$eq: ["$_id", "$$businessId"]},
                                        {$eq: ["$isApprove", 1]},
                                    ]
                                },
                            },
                        }
                    ],
                    as: "businessObj",
                }
            },
            {$unwind: {path: "$businessObj", preserveNullAndEmptyArrays: false}},
            {
                $lookup: {
                    from: "categories",
                    localField: "businessObj.businessCategory",
                    foreignField: "_id",
                    as: "categoryObj",
                }
            },
            {$unwind: {path: "$categoryObj", preserveNullAndEmptyArrays: true}},
            // {$unwind: {path: "$addressDetails", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 0,
                    "addressId": "$_id",
                    "category": {
                        _id: "$businessObj.businessCategory",
                        name: "$categoryObj.name",
                        image: "$categoryObj.image"
                    },
                    "businessId": "$businessId",
                    "businessUserId": "$userId",
                    "businessName": "$businessName",
                    "physicalAddress": "$physicalAddress",
                    "businessLocationName": "$businessLocationName",
                    // @ts-ignore
                    "image": "$businessObj.image" ?? null,
                    "businessStatus": "$businessObj.businessStatus",
                    "status": {$cond: {if: "$businessFriends", then: "$businessFriends.status", else: 0}},
                    "location": "$location",
                    "distance": {$round: ["$distance", 2]},
                    chatPermission: {
                        $cond: {
                            if: "$businessObj.permissions",
                            then: "$businessObj.permissions.acceptMessage",
                            else: {
                                public: true,
                                contact: true,
                                marketing: true
                            }
                        }
                    },
                    visibility: {
                        $cond: {
                            if: "$businessObj.permissions",
                            then: "$businessObj.permissions.visibility",
                            else: {
                                picture: true,
                                status: true,
                                post: true
                            }
                        }
                    },
                    locationPermission: {
                        $cond: {
                            if: "$businessObj.permissions",
                            then: "$businessObj.permissions.location",
                            else: {
                                whileUsingApp: false,
                                withLinkedContact: false,
                                withPublic: true,
                                notShared: false,
                            }
                        }
                    },
                }
            }
        ]
        if (!isGuest && userId) {
            const friendObj = [{
                $lookup: {
                    from: "friends",
                    let: {businessId: "$businessId"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$recipient", new mongoose.Types.ObjectId(userId)]},
                                        {"$eq": ["$businessId", "$$businessId"]},
                                        // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                    ]
                                }
                            }
                        },
                    ],
                    as: "businessFriends"
                }
            },
                {$unwind: {path: "$businessFriends", preserveNullAndEmptyArrays: true}},]
            //@ts-ignore
            pipeline.splice(2, 0, ...friendObj);
        }

        const businessAddress = await Address.aggregate(pipeline);
        return commonUtils.sendSuccess(req, res, businessAddress);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendSuccess(req, res, AppStrings.SOMETHING_WENT_WRONG);
    }

}

const mulAddressAdd = async (req: Request, res: Response) => {
    let businessId: any = req.headers.businessid;
    let addressDetails = req.body.addressDetails
    const business = await Business.findById(businessId)
    if (!business) return commonUtils.sendError(req, res, {error: AppStrings.BUSINESS_NOT_FOUND})

    try {
        await Promise.all(addressDetails.map(async (item: any) => {

            const address = new Address({
                userId: req.headers.userid,
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
        return commonUtils.sendSuccess(req, res, {message: AppStrings.ADDRESS_ADDED_SUCCESSFULLY})

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

async function demoFile(req: any, res: Response) {
    let data = {
        filename: "dc37a281ed47f60539ddc2c028f4cf0c-1663922735333.xlsx",
        path: "uploads/sampleFile/dc37a281ed47f60539ddc2c028f4cf0c-1663922735333.xlsx"
    }
    return commonUtils.sendSuccess(req, res, data)
}

async function methodAllowance(req: any, res: Response) {
    return commonUtils.sendError(req, res, {message: "Request method now allowed."}, 405);
}

export default {
    createBusiness,
    updateBusiness,
    getProfile,
    listBusiness,
    uploadImage,
    verifyDocument,
    permissionSetting,
    advertisement,
    submitReferences,
    uploadAudio,
    uploadVideo,
    addAddress,
    updateAddress,
    listAddress,
    deleteAddress,
    categoryList,
    subCategoryList,
    getBusinessClusterApi,
    getBusiness,
    methodAllowance,
    idTypes,
    mulAddressAdd,
    demoFile
}