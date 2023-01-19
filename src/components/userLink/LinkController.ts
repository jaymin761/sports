import {AppStrings} from "../../utils/appStrings";

import {NextFunction, Request, Response} from "express";

import commonUtils, {fileFilter, fileStorage} from "../../utils/commonUtils";
import mongoose, {Schema} from "mongoose";
import {FriendStatus, NotificationType} from "../../utils/enum";
import {AppConstants} from "../../utils/appConstants";
import {userMap, userMapMobile} from "../../index";

const User = require('../users/models/userModel');
const Friends = require('./models/friends');
const Contacts = require('./models/contact');
const Business = require('../business/models/businessModel');
const {v4} = require('uuid');

// const data = await Friends.findOne({
//     $or: [
//     { $and: [{ requester: new mongoose.Types.ObjectId(recipientId) }, { recipient: new mongoose.Types.ObjectId(userId) } ] },
//     { $and: [{ requester: new mongoose.Types.ObjectId(userId) }, { recipient: new mongoose.Types.ObjectId(recipientId) }] },
//     ], 
//     businessId: {$exists: false},
//     status: {$ne:FriendStatus.REJECT}
// });
// if(data) return commonUtils.sendError(req, res, {message:AppStrings.ALREADY_ADDED_LINKING})

const approveFriend = async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const userId = req.headers.userid as string;
    try {
        await Friends.findOneAndUpdate(
            {link: requestId, status: FriendStatus.PENDING},
            {$set: {status: FriendStatus.FRIENDS}}
        )
        await Friends.findOneAndUpdate(
            {link: requestId, requester: userId, status: FriendStatus.REQUESTED},
            {$set: {status: FriendStatus.FRIENDS}}
        )

        const recipientData = await Friends.findOne({link: requestId, requester: userId, status: FriendStatus.FRIENDS})

        // notify code
        if (recipientData) {
            const pushToken = await User.getPushToken(recipientData.recipient); //get pushtoken of end user
            const {fullName} = await User.findById(userId); //get pushtoken of end user

            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.SINGLE_REQUEST_APPROVE.TITLE,
                    body: AppStrings.SINGLE_REQUEST_APPROVE.BODY.replace(':name', fullName)
                },
                data: {
                    recipient: recipientData.recipient.toString(), senderId: userId.toString(), link: requestId,
                    status: FriendStatus.FRIENDS.toString(), type: NotificationType.SINGLE_REQUEST_APPROVE.toString()
                }
            }, pushToken, recipientData.recipient.toString())
        }
        // notify code end

        return commonUtils.sendSuccess(req, res, {message: AppStrings.REQUEST_APPROVED})
    } catch (error: any) {
        console.log(error.message);

        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const rejectFriend = async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const userId = req.headers.userid as string;
    try {
        await Friends.findOneAndDelete(
            {link: requestId, status: FriendStatus.PENDING},
            {$set: {status: FriendStatus.REJECT}}
        )
        await Friends.findOneAndDelete(
            {link: requestId, requester: userId, status: FriendStatus.REQUESTED},
            {$set: {status: FriendStatus.REJECT}}
        )

        const recipientData = await Friends.findOne({link: requestId, requester: userId, status: FriendStatus.REJECT})

        // notify code
        if (recipientData) {
            const pushToken = await User.getPushToken(recipientData.recipient); //get pushtoken of end user
            const {fullName} = await User.findById(userId); //get pushtoken of end user

            await commonUtils.sendNotification({
                notification: {
                    title: AppStrings.SINGLE_REQUEST_REJECT.TITLE,
                    body: AppStrings.SINGLE_REQUEST_REJECT.BODY.replace(':name', fullName)
                },
                data: {
                    recipient: recipientData.recipient.toString(), senderId: userId.toString(), link: requestId,
                    status: FriendStatus.REJECT.toString(), type: NotificationType.SINGLE_REQUEST_REJECT.toString()
                }
            }, pushToken, recipientData.recipient.toString())
        }
        // notify code end

        return commonUtils.sendSuccess(req, res, {message: AppStrings.REQUEST_REJECTED})
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const addFriend = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const recipientId = req.params.id;

    if (userId === recipientId) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_ID})

    try {
        const refrence = v4();

        const checkForAlreadyFriend = await Friends.findOne({$or:[
            {requester: recipientId, recipient: userId,businessId: {$exists: false}},
            {requester: userId, recipient:recipientId ,businessId: {$exists: false}}
        ]})
        
        if(checkForAlreadyFriend)return commonUtils.sendError(req,res,{message:AppStrings.ALREADY_ADDED_LINKING})

        await Friends.findOneAndUpdate(
            {requester: recipientId, recipient: userId, businessId: {$exists: false}},
            {$set: {status: FriendStatus.REQUESTED, link: refrence}},
            {upsert: true, new: true}
        )
        await Friends.findOneAndUpdate(
            {recipient: recipientId, requester: userId, businessId: {$exists: false}},
            {$set: {status: FriendStatus.PENDING, link: refrence}},
            {upsert: true, new: true}
        )

        // notify code
        const pushToken = await User.getPushToken(recipientId); //get pushtoken of end user
        const {fullName} = await User.findById(userId); //get pushtoken of end user

        await commonUtils.sendNotification({
            notification: {
                title: AppStrings.SINGLE_REQUEST.TITLE,
                body: AppStrings.SINGLE_REQUEST.BODY.replace(':name', fullName)
            },
            data: {
                recipient: recipientId, senderId: userId, link: refrence,
                status: FriendStatus.REQUESTED.toString(), type: NotificationType.SINGLE_REQUEST.toString()
            }
        }, pushToken, recipientId)
        // notify code end

        return commonUtils.sendSuccess(req, res, {message: AppStrings.REQUEST_SENT});
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
};
const deleteFriend = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;

    const unlinks = req.body.unlinks;

    try {

        await Promise.all(unlinks.map(async (value: any) => {

            await Friends.deleteOne({
                requester: new mongoose.Types.ObjectId(value.userId),
                recipient: new mongoose.Types.ObjectId(userId),
                businessId: value.businessId ? new mongoose.Types.ObjectId(value.businessId) : {$exists: false}
            })
            await Friends.deleteOne({
                recipient: new mongoose.Types.ObjectId(value.userId),
                requester: new mongoose.Types.ObjectId(userId),
                businessId: value.businessId ? new mongoose.Types.ObjectId(value.businessId) : {$exists: false}
            })
        }))


        return commonUtils.sendSuccess(req, res, {message: AppStrings.UNLINK_SUCCESS});
    } catch (error: any) {
        console.log(error);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
};


const addFriendForBusiness = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const businessId = req.params.id;

    try {
        const refrence = v4();
        const business = await Business.findById(businessId);
        if (!business) return commonUtils.sendError(req, res, {error: AppStrings.BUSINESS_NOT_FOUND})

        if (userId === business.userId) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_ID})

        await Friends.findOneAndUpdate(
            {requester: business.userId, recipient: userId, businessId: businessId},
            {$set: {status: FriendStatus.FRIENDS, link: refrence}},
            {upsert: true, new: true}
        )

        await Friends.findOneAndUpdate(
            {recipient: business.userId, requester: userId, businessId: businessId},
            {$set: {status: FriendStatus.FRIENDS, link: refrence}},
            {upsert: true, new: true}
        )

        // notify code
        const pushToken = await User.getPushToken(business.userId); //get pushtoken of business user
        const {fullName} = await User.findById(userId);

        await commonUtils.sendNotification({
            notification: {
                title: AppStrings.BUSINESS_REQUEST.TITLE,
                body: AppStrings.BUSINESS_REQUEST.BODY.replace(':name', fullName).replace(':business', business?.name)
            },
            data: {
                recipient: business.userId.toString(), senderId: userId, businessId: businessId,
                status: FriendStatus.FRIENDS.toString(), type: NotificationType.BUSINESS_REQUEST.toString()
            }
        }, pushToken, business.userId.toString())
        // notify code end

        return commonUtils.sendSuccess(req, res, {message: AppStrings.REQUEST_SENT});
    } catch (er: any) {
        console.log('line 205', er.message);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
};

const deleteFriendForBusiness = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const unlinks = req.body.unlinks as [];

    try {
        // if (userId === recipientId) return commonUtils.sendError(req, res, {message: AppStrings.INVALID_ID})

        await Promise.all(unlinks.map(async (value: any) => {
            await Friends.deleteOne(
                {recipient: value.userId, requester: userId, businessId: value.businessId},
            )

            await Friends.deleteOne(
                {recipient: userId, requester: value.userId, businessId: value.businessId},
            )
        }))


        return commonUtils.sendSuccess(req, res, {message: AppStrings.UNLINK_SUCCESS});
    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG});
    }
};


// ignore
const getFriends = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const search = req.query.search;
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    // const
    let filter = {}
    if (search) {
        filter = {
            $or: [{"$fullName": {$regex: search, $options: "i"}}, {"$userName": {$regex: search, $options: "i"}}],
        };
    }

    try {
        const pipline = [{
            $match: {
                $and: [
                    {$or: [{requester: new mongoose.Types.ObjectId(userId)}, {recipient: new mongoose.Types.ObjectId(userId)}]},
                    {status: FriendStatus.FRIENDS},
                ]
            }
        },
            {
                $lookup: {
                    from: "users",
                    let: {requester: "$requester", recipient: "$recipient"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {
                                            "$cond": [
                                                {"$eq": ["$$requester", new mongoose.Types.ObjectId(userId)]},
                                                {"$eq": ["$_id", "$$recipient"]},
                                                {"$eq": ["$_id", "$$requester"]}
                                            ]
                                        },
                                        filter
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                "id": '$_id',
                                "name": '$fullName',
                                "image": "$image.profilePic",
                            }
                        }
                    ],
                    as: "userFriends",
                }
            },
            {$unwind: "$userFriends"},
            {
                $facet: {
                    metadata: [{$count: "total"}, {$addFields: {page: page}}],
                    data: [{$skip: skip_}, {$limit: limit_},
                        {
                            $project: {
                                _id: 0,
                                "id": '$userFriends.id',
                                "name": '$userFriends.name',
                                "mobile": '$userFriends.mobile',
                                // @ts-ignore
                                "image": {$cond: {if: "$userFriends.image", then: "$userFriends.image", else: null}},
                                "status": "$status"
                            }
                        }]
                }
            },
        ]

        const friendLists = await Friends.aggregate(pipline)
        return commonUtils.sendSuccess(req, res, friendLists ? friendLists[0] : {})
    } catch (error: any) {
        console.log(error.message);

        return commonUtils.sendSuccess(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }


}

const getFriendsWithAction = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;

    try {
        const pipline = [{
            $match: {
                $and: [
                    {recipient: new mongoose.Types.ObjectId(userId)},
                    {businessId: {$exists: false}},
                    {status: FriendStatus.PENDING},
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
            {$unwind: "$userFriends"},
            {
                $project: {
                    _id: 0,
                    "requestId": "$link",
                    "id": '$userFriends._id',
                    "name": '$userFriends.fullName',
                    "image": "$userFriends.image.profilePic",
                    "mobile": '$userFriends.mobile',
                    'userName': "$userFriends.userName",
                    'permissions': "$userFriends.permissions",
                    // // @ts-ignore
                    // "image":{$cond: { if: "$userFriends.image", then: "$userFriends.image", else: null }},
                }
            }
        ]

        const friendLists = await Friends.aggregate(pipline)
        return commonUtils.sendSuccess(req, res, friendLists)
    } catch (error: any) {
        return commonUtils.sendSuccess(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }


}

const getBusinessFriendRequestAction = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const businessId = req.headers.businessid as string;

    try {
        const pipline = [{
            $match: {
                $and: [
                    {recipient: new mongoose.Types.ObjectId(userId)},
                    {businessId: new mongoose.Types.ObjectId(businessId)},
                    {status: FriendStatus.PENDING},
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
            {$unwind: "$userFriends"},
            {
                $project: {
                    _id: 0,
                    "requestId": "$link",
                    "id": '$userFriends._id',
                    "name": '$userFriends.fullName',
                    "image": "$userFriends.image.profilePic",
                    "mobile": '$userFriends.mobile',
                    'userName': "$userFriends.userName",
                    'permissions': "$userFriends.permissions",
                    // // @ts-ignore
                    // "image":{$cond: { if: "$userFriends.image", then: "$userFriends.image", else: null }},
                }
            }
        ]

        const friendLists = await Friends.aggregate(pipline)
        return commonUtils.sendSuccess(req, res, friendLists)
    } catch (error: any) {
        return commonUtils.sendSuccess(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }


}

async function methodAllowance(req: any, res: Response) {
    return commonUtils.sendError(req, res, {message: "Request method now allowed."}, 405);
}


/**
 * 
 * @param req 
 * @param res 
 * @description 
 *  type: 0: self link list without business (link list) ::: no params required
 *  type: 1: other user check someone profile(link list) ::: userId required
 *  type: 2: other and login user business profile(link list) ::: pass businessId required
 *  type: 3: login user => individual + business both included(link list) ::: pass businessId | else 0
 * 
 * @returns 
 */
async function linkList(req: Request, res: Response) {
    let userId = req.headers.userid as string;

    let linkerId = req.params?.id as string;
    let type = Number(req.params.type ?? 0)

    const friendResult = Boolean(req.query.friendResult);
    console.table({linkerId,type,friendResult});

    try {

        const skipIds = req.query?.skipIds;
        
        let filter = {};
        if (skipIds !== '' && typeof skipIds === 'string') {
            //validate skipId array and check mongoose objectId format
            const skipArray = skipIds?.split(',').filter(item => mongoose.Types.ObjectId.isValid(item))?.map(item => new mongoose.Types.ObjectId(item));
            filter = {requester: {$nin: skipArray}}
        }

        let andFilter: any[] = [];
        let location: any = null;

        /**
         * for business link list
         * requester: business.userId, recipient: userId
         */

        switch (type) {
            case 0:
                andFilter = [
                    {recipient: new mongoose.Types.ObjectId(userId)},
                    {businessId: {$exists: false}}
                ]
                break
            case 1:
                // andFilter = [
                //     {recipient: new mongoose.Types.ObjectId(linkerId)},  
                //     {status: FriendStatus.FRIENDS},
                // ]
                andFilter = [{recipient: new mongoose.Types.ObjectId(linkerId)},{status: FriendStatus.FRIENDS}]

                const business = await Business.findOne({userId:linkerId})

                if (business) {
                    andFilter.push({
                        businessId: {
                            $ne: new mongoose.Types.ObjectId(business._id)
                        }
                    })
                }
                break
            case 3:
                andFilter = [{recipient: new mongoose.Types.ObjectId(userId)}]

                if (linkerId != "0") {
                    andFilter.push({
                        businessId: {
                            $ne: new mongoose.Types.ObjectId(linkerId)
                        }
                    })
                }
                break
            case 2:
                andFilter = [
                    {businessId: new mongoose.Types.ObjectId(linkerId)},
                    /*{
                    recipient: new mongoose.Types.ObjectId(userId)
                }*/]
                break
            }
        

        if (filter.hasOwnProperty("requester")) {
            andFilter.push(filter)
        }

        if (friendResult) andFilter.push({status: FriendStatus.FRIENDS})


        const pipline = [{
            $match: {
                $and: andFilter
            }},
            {
                $lookup: {
                    from: "users",
                    localField: "requester",
                    foreignField: "_id",
                    as: "userFriends",
                }
            },
            {$unwind: "$userFriends"},
           
            {
                $lookup: {
                    from: 'addresses',
                    localField: 'businessObject._id',
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
                $lookup: {
                    from: "users",
                    localField: "businessObject.userId",
                    foreignField: "_id",
                    as: "businessOwner",
                    
                }
            },
            {$unwind: {path: "$businessOwner", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "contacts",
                    let: {linkedWith: "$requester"},
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
            }, /*{$unwind: {path: "$contactStatus", preserveNullAndEmptyArrays: true}},*/
            {
                "$addFields": {
                    "contactStatus": {
                        "$arrayElemAt": ["$contactStatus", 0]
                    }
                }
            },
            {
                $lookup: {
                    from: "eventinvitations",
                    let: {linkedWith: "$requester"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$userId", new mongoose.Types.ObjectId(userId)]},
                                        {"$eq": ["$invitedUserId", "$$linkedWith"]},
                                        // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                    ]
                                }
                            }
                        },
                    ],
                    as: "eventStatus"
                }
            }, {
                "$addFields": {
                    "eventStatus": {
                        "$arrayElemAt": ["$eventStatus", 0]
                    }
                }
            },
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
                    'address': "$userFriends.tempAddress",
                    'isProfileComplete': "$userFriends.isProfileComplete",
                    'contact': {$cond: {if: "$contactStatus", then: 1, else: 0}},
                    'event': {$cond: {if: "$eventStatus", then: 1, else: 0}},
                    'friendStatus': "$status",
                    'isEmployee': {$cond: {if: "$userFriends.employee._id", then: 1, else:0}},
                    // @ts-ignore
                    'businessName': {$cond: {if: "$businessObject", then: "$businessObject.name", else: ""}},
                    'businessImage': {$cond: {if: "$businessObject", then: "$businessObject.image", else: ""}},
                    'businessId': {$cond: {if: "$businessObject", then: "$businessObject._id", else: ""}},
                    'businessOwner': {$cond: {if: "$businessOwner", then: "$businessOwner.fullName", else: ""}},
                    'businessAddressId': {$cond: {if: "$addressData", then: "$addressData._id", else: ""}},
                    'businessLocation': {$cond: {if: "$addressData", then: "$addressData.location", else: location}},
                    // "image":{$cond: { if: "$userFriends.image", then: "$userFriends.image", else: null }},
                }
            }
            
        ]

        const businessObj =  [{
            $lookup: {
                from: "businesses",
                let: {recip: "$recipient"},
                localField: "businessId",
                foreignField: "_id",
                as: "businessObject",
                pipeline :[
                    {
                        $match: {
                            $expr: {   
                                $ne: ["$userId", "$$recip"]
                             }
                        }
                    }
                ]
            }
        },{$unwind: {path: "$businessObject", preserveNullAndEmptyArrays: true}}]
        //@ts-ignore
        pipline.splice(2, 0, ...businessObj);

        let friendLists = await Friends.aggregate(pipline)

        if (friendLists && linkerId != "0") {
            friendLists = await Promise.all(friendLists.map(async (element: any) => {
                const selfStatus = await Friends.findOne({
                    $and: [{requester: new mongoose.Types.ObjectId(element.id)}, {recipient: new mongoose.Types.ObjectId(userId)}]
                })
                element.friendStatus = selfStatus ? selfStatus.status : 0
                return element
            }))
        }

        return commonUtils.sendSuccess(req, res, friendLists)
    } catch (error: any) {
        console.log("ERRROR ", error)
        return commonUtils.sendError(req, res, AppStrings.SOMETHING_WENT_WRONG)
    }
}

/**
 *  Sync Contacts
 * */
async function syncContacts(req: Request, res: Response) {
    let userId = req.headers.userid as string;
    let businessId = req.body.business_id
    const contacts = req.body.contacts
    const emails = req.body.emails


    try {
        await Promise.all(contacts.map(async (element: any) => {
            if (element?.mobile) {
                const checkUserExist = await User.findOne({
                    $or: [
                        {mobile: element.mobile},
                        {"optionalMobile.secondary": element.mobile},
                        {"optionalMobile.alternative": element.mobile},
                    ],
                    _id: {$ne: new mongoose.Types.ObjectId(userId)}
                }).select('_id fullName image')

                if (checkUserExist) {
                    await Contacts.findOneAndUpdate(
                        {userId: checkUserExist._id, linkedWith: new mongoose.Types.ObjectId(userId)},
                        {$set: {mobile: element.mobile, name: element.name, image: checkUserExist?.image?.profilePic}},
                        {upsert: true, new: true})
                }
            }
        }))
        await Promise.all(emails.map(async (element: any) => {
            if (element?.email) {
                const checkUserExist = await User.findOne({
                    email: String(element.email).toLowerCase(),
                    _id: {$ne: new mongoose.Types.ObjectId(userId)}
                }).select('_id fullName image')

                if (checkUserExist) {
                    await Contacts.findOneAndUpdate(
                        {userId: checkUserExist._id, linkedWith: new mongoose.Types.ObjectId(userId)},
                        {$set: {email: element.email, name: element.name, image: checkUserExist?.image?.profilePic}},
                        {upsert: true, new: true})
                }
            }
        }))

        /*else { // previous version
            await Contacts.findOneAndUpdate(
                {linkedWith: new mongoose.Types.ObjectId(userId), mobile: element.mobile},
                {$set: {name: element.name}},
                {upsert: true, new: true}
            );
        }*/

        const pipeline = [{
            $match: {
                linkedWith: new mongoose.Types.ObjectId(userId)
            }
        },
            {
                $lookup: {
                    from: "friends",
                    let: {recipient: "$userId"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$requester", new mongoose.Types.ObjectId(userId)]},
                                        {"$eq": ["$recipient", "$$recipient"]},
                                        // { "$eq": ["$status", FriendStatus.FRIENDS] },
                                    ]
                                },
                                "businessId": {$exists: false},
                            }
                        },
                    ],
                    as: "userFriends"
                }
            },
            {$unwind: {path: "$userFriends", preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: '_id',
                    as: "user"
                }
            },
            {
                $lookup: {
                    from: "employees",
                    let: {contactId: "$userId"},
                    pipeline: [
                        {
                            "$match": {
                                "$expr": {
                                    $and: [
                                        {"$eq": ["$employeeId", "$$contactId"]},
                                        {"$eq": ["$businessId", new mongoose.Types.ObjectId(businessId)]},
                                    ]
                                }
                            }
                        },
                    ],
                    as: "userEmployee"
                }
            },
            {$unwind: {path: "$user"}},
            {$unwind: {path: "$userEmployee", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 0,
                    //@ts-ignore
                    "requestId": {$cond: {if: "$userFriends", then: "$userFriends.link", else: null}},
                    "userId": {$cond: {if: '$user', then: "$user._id", else: ""}},
                    //@ts-ignore
                    "mobile": {$cond: {if: "$mobile", then: "$mobile", else: null}},
                    //@ts-ignore
                    "email": {$cond: {if: "$email", then: "$email", else: null}},
                    "name": "$name",
                    "image": "$user.image.profilePic",
                    "permissions": "$userFriends.permissions",
                    "isLinked": {$cond: {if: "$userFriends", then: "$userFriends.status", else: 0}},
                    "isRegister": {$cond: {if: "$user.isVerify", then: 1, else: 0}},
                    "isEmployee": {$cond: {if: "$userEmployee", then: "$userEmployee.status", else: 0}},
                    "isProfileComplete": "$user.isProfileComplete"
                    /*"permissions" : {
                        chatPermission: {
                            $cond: {
                                if: "$user.permissions",
                                then: "$user.permissions.acceptMessage",
                                else: {
                                    public: true,
                                    contact: true,
                                    marketing: true
                                }
                            }
                        },
                        visibility: {
                            $cond: {
                                if: "$user.permissions",
                                then: "$user.permissions.visibility",
                                else: {
                                    picture: true,
                                    status: true,
                                    post: true
                                }
                            }
                        },
                        locationPermission: {
                            $cond: {
                                if: "$user.permissions",
                                then: "$user.permissions.location",
                                else: {
                                    whileUsingApp: false,
                                    withLinkedContact: false,
                                    withPublic: true,
                                    notShared: false,
                                }
                            }
                        },
                    }*/
                    //  "isLinked": { $cond: { if: "$userFriends", then: 1, else: 0 } }
                }
            }
        ]

        const contactSyncWithFriend = await Contacts.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, contactSyncWithFriend)

    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, {error: error.message})
    }
}

export default {
    methodAllowance,
    approveFriend,
    rejectFriend,
    addFriend,
    deleteFriend,
    getFriends,
    getFriendsWithAction,
    getBusinessFriendRequestAction,
    linkList,
    syncContacts,
    addFriendForBusiness,
    deleteFriendForBusiness
}