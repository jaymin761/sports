import { Request, Response } from "express";
import mongoose, { ObjectId } from "mongoose";
import { AppConstants } from "../../utils/appConstants";
import { AppStrings } from "../../utils/appStrings";
import commonUtils from "../../utils/commonUtils";
import { NotificationType, Recognise, TrustStatus } from "../../utils/enum";
import { LatLng } from "../../utils/locationUtils/LatLng";
import { computeDistanceBetween } from "../../utils/locationUtils/SphericalUtil";
import { myTrustLevel } from "../../utils/trustLevelUtils";

const User = require("../users/models/userModel");
const Business = require("../business/models/businessModel");
const Endorsed = require("./models/endorsed");

const LocationTrace = require("../users/models/locationTrace");
const Trust = require("../admin/models/trustModel");
import moment from "moment";

const getTrustLevel = async () => { };

/** not use anymore */
const checkForSelfEndorsed = async (data: any) => {
    const { email, mobile, userId } = data;
    const findFiled = email ? { "reference.$.email": email } : { "reference.$.mobile": mobile };

    const remainingEndorse = await User.find({ ...findFiled, isEndorsed: Recognise.PENDING });
    if (!remainingEndorse.length) return [null, "no user data"];

    await Promise.all(
        remainingEndorse.map(async (element: any) => {
            await endorsed(userId, element._id, Recognise.PENDING);
        })
    );

    return [true, null];
};

const notifyUserForCheckReference = async (notify: any, fullName: any, userId: any) => {
    // notify code
    const pushToken = await User.getPushToken(notify); //get pushtoken of business user

    await commonUtils.sendNotification(
        {
            notification: {
                title: AppStrings.REFERENCE_REQUEST.TITLE,
                body: AppStrings.REFERENCE_REQUEST.BODY.replace(":name", fullName),
            },
            data: {
                senderId: userId.toString(),
                notify: notify.toString(),
                type: NotificationType.REFERENCE_REQUEST.toString(),
            },
        },
        pushToken,
        notify.toString()
    );
    // notify code end
};

const checkOnreferencesEndorsed = async (data: any) => {
    try {
        const { userId, referenceId, fullName } = data;
        const [res, err] = await endorsed(referenceId, userId, Recognise.PENDING);
        await notifyUserForCheckReference(referenceId, fullName, userId);
        await updateRefrenceLogic(userId)
        return [res, err];
    } catch (err: any) {
        console.log(err.message);
        return [null, err.message];
    }
};

const checkOnBusinessReferencesEndorsed = async (data: any) => {
    const { businessId } = data;
    try {
        const business = await Business.findById(businessId);
        if (!business) return [null, "no business data"];

        if (!business.reference || !business.reference.length) return [null, "no references found"];

        await Promise.all(
            business.reference.map(async (element: any) => {
                if (element.id && element.isEndorsed === Recognise.PENDING) {
                    await endorsed(element.id, business.userId, Recognise.PENDING, businessId);
                }
                if (!element.id && element.isEndorsed === Recognise.PENDING) {
                    // send notification to download app and endorsed
                }
            })
        );

        return [true, null];
    } catch (err: any) {
        console.log(err.message);
        return [null, err.message];
    }
};

async function referanceDelete(req: Request, res: Response) {
    try {
        let userId = req.headers.userid as string;
        let referenceId = req.body.id;

        let userData = await User.findById(userId);
        if (!userData) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });

        let refe = await Endorsed.findOne({ endorsedTo: userId, userId: referenceId });
        if (!refe) return commonUtils.sendError(req, res, { message: AppStrings.REFERENCES_NOT_FOUND });

        await Endorsed.findOneAndDelete({ endorsedTo: userId, userId: referenceId });

        const markRefrence = userData.reference.find((i: any) => i.id.toString() === referenceId.toString());
        userData.reference = userData.reference.filter((a: any) => a.id.toString() !== referenceId.toString());
        await userData.save();

        await updateRefrenceLogic(userId)

        /**
         if(markRefrence?.isEndorsed === Recognise.YESIKNOW){
             userData.trustLevel.reference = TrustStatus.INVALID
         }
         await user.save()
         await updateAvgTrustLevel(user._id) 
         */
        return commonUtils.sendSuccess(req, res, { message: AppStrings.REFERANCE_DELETE });
    } catch (error) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
}

const updateRefrenceLogic = async (userId: ObjectId | string) => {
    try {
        /**References
       > 2 Reject : Rejected
       > 2 Pending : Pending
       > 3 Approved : Approve
       > All other case its : Pending
        */
        const userData = await User.findById(userId);
        const approveCount = userData?.reference?.filter((e: any) => e.isEndorsed === Recognise.YESIKNOW)?.length;
        const rejectCount = userData?.reference?.filter((e: any) => e.isEndorsed === Recognise.DONTKNOW)?.length;
        if (approveCount >= 3) {
            userData.trustLevel.reference = TrustStatus.ACCEPT;
        } else if (rejectCount >= 2) {
            userData.trustLevel.reference = TrustStatus.INVALID;
        } else {
            userData.trustLevel.reference = TrustStatus.PENDING;
        }
        await userData.save();
        await updateAvgTrustLevel(userData._id);
        return [true, null];
    } catch (err: any) {
        return [null, err.message];
    }
};

const updatereferencesEndorsed = async (data: any) => {
    try {
        const { userId, status, requestId } = data;

        const response = await Endorsed.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(requestId), userId: new mongoose.Types.ObjectId(userId) },
            { $set: { doYouKnow: status } }
        ).catch((err: any) => [null, err.message]);

        let userData = await User.findById(response.endorsedTo);
        if (!userData) return [null, "no user data"];
        if (!userData?.reference?.length) return [null, "no references found"];
        
        await User.findOneAndUpdate(
            {
                _id: response.endorsedTo,
                "reference.id": response.userId,
                "reference.isEndorsed": Recognise.PENDING,
            },
            { $set: { "reference.$.isEndorsed": status } }
        );

        await updateRefrenceLogic(response.endorsedTo);
        return [response.endorsedTo.toString(), null];
    } catch (err: any) {
        console.log(err.message);
        return [null, err.message];
    }
};

// updatereferencesEndorsed({userId:'62e75cbba055df5865130bd7',endorsedId:'62e38d58ddab1d7bffa0258e',status: Recognise.YESIKNOW})
// checkForSelfEndorsed({email:'nensi@elaunchinfotech.in',userId:'62e38d58ddab1d7bffa0258e'})

//update status on
const endorsed = async (userId: ObjectId, endorsedTo: ObjectId, status: Recognise, businessId: ObjectId = null) => {
    if (!userId || !endorsedTo) return [null, "both id is required"];
    if (businessId) {

        await Endorsed.findOneAndUpdate(
            {
                userId,
                endorsedTo,
                businessId,
            },
            { $set: { doYouKnow: status } },
            { upsert: true }
        ).catch((err: any) => [null, err.message]);
    } else {
        await Endorsed.findOneAndUpdate(
            {
                userId,
                endorsedTo,
            },
            { $set: { doYouKnow: status } },
            { upsert: true }
        ).catch((err: any) => [null, err.message]);
    }

    return [true, null];
};

const getReferencesRequests = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;

    try {
        const pipleine = [
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    doYouKnow: Recognise.PENDING,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "endorsedTo",
                    foreignField: "_id",
                    as: "userObject",
                },
            },
            { $unwind: { path: "$userObject" } },
            {
                $lookup: {
                    from: "businesses",
                    localField: "businessId",
                    foreignField: "_id",
                    as: "businessObject",
                },
            },
            { $unwind: { path: "$businessObject", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    requestId: "$_id",
                    userId: "$endorsedTo",
                    image: "$userObject.image.profilePic",
                    name: "$userObject.fullName",
                    userName: "$userObject.userName",
                    mobile: "$userObject.mobile",
                    endorsed: "$doYouKnow",
                    endorsedType: { $cond: { if: "$businessId", then: 2, else: 1 } },
                    businessName: "$businessObject.name",
                    permissions: "$userObject.permissions",
                },
            },
        ];
        const response = await Endorsed.aggregate(pipleine);
        return commonUtils.sendSuccess(req, res, response);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendSuccess(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};
const getReferences = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;

    try {

        const pipleine = [
            {
                $match: {
                    endorsedTo: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userObject",
                },
            },
            { $unwind: { path: "$userObject" } },
            {
                $lookup: {
                    from: "businesses",
                    localField: "businessId",
                    foreignField: "_id",
                    as: "businessObject",
                },
            },
            { $unwind: { path: "$businessObject", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    requestId: "$_id",
                    userId: "$userId",
                    image: "$userObject.image.profilePic",
                    name: "$userObject.fullName",
                    userName: "$userObject.userName",
                    mobile: "$userObject.mobile",
                    endorsedType: { $cond: { if: "$businessId", then: 2, else: 1 } },
                    businessName: "$businessObject.name",
                    permissions: "$userObject.permissions",
                    endorsed: "$doYouKnow",
                },
            },
        ];
        const response = await Endorsed.aggregate(pipleine);
        return commonUtils.sendSuccess(req, res, response);
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendSuccess(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const approveReferences = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const requestId = req.params.id as string;

    try {
        const [response, err] = await updatereferencesEndorsed({ userId, requestId, status: Recognise.YESIKNOW });
        if (err) {
            return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
        }
        if (response) {
            // notify code
            const pushToken = await User.getPushToken(response); //get pushtoken of requestId user
            const { fullName } = await User.findById(userId);

            await commonUtils.sendNotification(
                {
                    notification: {
                        title: AppStrings.REFERENCE_REQUEST_APPROVE.TITLE,
                        body: AppStrings.REFERENCE_REQUEST_APPROVE.BODY.replace(":name", fullName),
                    },
                    data: {
                        status: Recognise.YESIKNOW.toString(),
                        senderId: userId.toString(),
                        requestId: response,
                        type: NotificationType.REFERENCE_REQUEST_APPROVE.toString(),
                    },
                },
                pushToken,
                response
            );
            // notify code end
            return commonUtils.sendSuccess(req, res, { message: AppStrings.STATUS_UPDATED_SUCCESSFULLY });
        }
    } catch (e: any) {
        console.log(e.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const rejectReferences = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const requestId = req.params.id as string;

    const [response, err] = await updatereferencesEndorsed({ userId, requestId, status: Recognise.DONTKNOW });
    if (err) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
    if (response) {
        // notify code
        const pushToken = await User.getPushToken(response); //get pushtoken of requestId user
        const { fullName } = await User.findById(userId);

        await commonUtils.sendNotification(
            {
                notification: {
                    title: AppStrings.REFERENCE_REQUEST_REJECT.TITLE,
                    body: AppStrings.REFERENCE_REQUEST_REJECT.BODY.replace(":name", fullName),
                },
                data: {
                    status: Recognise.DONTKNOW.toString(),
                    senderId: userId.toString(),
                    requestId: response,
                    type: NotificationType.REFERENCE_REQUEST_REJECT.toString(),
                },
            },
            pushToken,
            response
        );
        // notify code end
        return commonUtils.sendSuccess(req, res, { message: AppStrings.STATUS_UPDATED_SUCCESSFULLY });
    }
};

const addLocation = async (data: any) => {
    // TODO:: add location trace entry

    const location = {
        type: "Point",
        coordinates: [data.address.longitude, data.address.latitude],
    };
    /**
     *  Add Location Trace for user
     * */
    let locationTrace = new LocationTrace();
    locationTrace.user_id = data.userId;
    locationTrace.location = location;
    locationTrace.distance = data.distance;
    locationTrace.result = data.result;
    await locationTrace.save();
};

const setLocation = async (req: Request, res: Response) => {
    const userId = req.headers.userid as string;
    const isGuest = req.headers.isguest || false;
    try {
        const addresses = req.body.address;

        const long = req.body.location.longitude;
        const lat = req.body.location.latitude;

        const cord = new LatLng();
        cord.latitude = lat;
        cord.longitude = long;
        let distance;
        const location = {
            address: addresses,
            location: {
                type: "Point",
                coordinates: [long, lat],
            },
        };

        if (!isGuest && userId) {
            const user = await User.findById(userId).select("address").exec();
            const coordinates = new LatLng();
            coordinates.latitude = user.address?.location?.coordinates?.[1] ?? 0.0;
            coordinates.longitude = user.address?.location?.coordinates?.[0] ?? 0.0;

            // update temp location cord in user model for fetching data in cluster
            user.tempAddress = {
                address: addresses,
                name: addresses,
                location: {
                    type: "Point",
                    coordinates: [long, lat],
                },
            };
            await user.save();
            // await User.updateOne({_id:new mongoose.Types.ObjectId(userId)},{$set:{tempAddress:location}})

            distance = computeDistanceBetween(coordinates, cord);
        } else {
            distance = computeDistanceBetween(cord, cord);
        }
        /**
         *  Add Location Trace for user
         * */
        let locationTrace = new LocationTrace();
        if (isGuest) {
            locationTrace.guestId = userId;
        } else {
            locationTrace.user_id = userId;
        }
        locationTrace.location = location;
        locationTrace.distance = distance;
        locationTrace.result = distance <= AppConstants.DISTANCE_LIMIT_IN_METER;
        await locationTrace.save();

        return commonUtils.sendSuccess(req, res, {});
    } catch (error: any) {
        console.log(error.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const activitiesLog = async (req: Request, res: Response) => {
    let userId: any = req.headers.userid;

    let d = new Date();
    const start = moment(new Date());
    const end = moment(d.setDate(d.getDate() - 7));

    const end_ = end.startOf("day").toString();
    const start_ = start.endOf("day").toString();

    let pipeline: any = [
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                $expr: {
                    $and: [
                        {
                            $gte: ["$createdAt", new Date(end_)],
                        },
                        {
                            $lt: ["$createdAt", new Date(start_)],
                        },
                    ],
                },
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 0,
                id: "$_id",
                location: "$location",
                // user_id: "$user_id",
                distance: { $round: ["$distance", 2] },
                createdAt: "$createdAt",
            },
        },
    ];

    const activities = await LocationTrace.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, activities);
};

const activitiesLogUser = async (req: Request, res: Response) => {
    try {
        let userId: any = req.params.id;
        let d = new Date();
        const start = moment(new Date());
        const end = moment(d.setDate(d.getDate() - 7));

        const end_ = end.startOf("day").toString();
        const start_ = start.endOf("day").toString();

        let pipeline: any = [
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    $expr: {
                        $and: [
                            {
                                $gte: ["$createdAt", new Date(end_)],
                            },
                            {
                                $lt: ["$createdAt", new Date(start_)],
                            },
                        ],
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 0,
                    id: "$_id",
                    location: "$location",
                    // user_id: "$user_id",
                    distance: { $round: ["$distance", 2] },
                    createdAt: "$createdAt",
                },
            },
        ];

        const activities = await LocationTrace.aggregate(pipeline);
        return commonUtils.sendSuccess(req, res, activities);
    } catch (error) {
        return commonUtils.sendError(req, res, AppStrings.SOMETHING_WENT_WRONG);
    }
};

const updateAvgTrustLevel = async (userId: ObjectId) => {
    const user = await User.findById(userId);

    const myTrustConstant: number = myTrustLevel(
        user.trustLevel?.image?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.id?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.reference?.valueOf() ?? TrustStatus.PENDING,
        user.trustLevel?.address?.valueOf() ?? TrustStatus.PENDING
    );

    const trust = await Trust.findOne({
        combine: myTrustConstant,
    }).select("message name star");

    user.averageTrust = trust?.star ?? user.averageTrust;

    if (trust.star == 5) {
        user.isProfileComplete = 1
    }
    await user.save();
};

const sendHomeAddressNotification = async ({ userId }: any) => {
    try {
        const user = await User.findById(userId);
        const pushToken = await User.getPushToken(userId); //get pushtoken of minor

        if ([TrustStatus.ACCEPT, TrustStatus.INVALID].includes(user.trustLevel?.address)) {
            await commonUtils.sendNotification(
                {
                    notification: {
                        title: AppStrings.TRUST_LEVEL_UPDATE.TITLE,
                        body: AppStrings.TRUST_LEVEL_UPDATE.BODY.replace(
                            ":message",
                            user.trustLevel?.address === TrustStatus.ACCEPT
                                ? "congratulation!, your trust level updated due to verification of home address"
                                : "your trust level has been updated"
                        ),
                    },
                    data: {
                        userId: userId.toString(),
                        trustLevel: user.averageTrust.toString(),
                        bySystem: "true",
                        type: NotificationType.TRUST_LEVEL_UPDATE.toString(),
                    },
                },
                pushToken,
                userId.toString()
            );
        }
    } catch (e: any) {
        console.log("error on notify trust level", e.message);
    }
};

export default {
    getTrustLevel,
    endorsed,
    checkForSelfEndorsed,
    getReferencesRequests,
    getReferences,
    checkOnreferencesEndorsed,
    updatereferencesEndorsed,
    approveReferences,
    rejectReferences,
    addLocation,
    checkOnBusinessReferencesEndorsed,
    updateAvgTrustLevel,
    setLocation,
    activitiesLog,
    activitiesLogUser,
    sendHomeAddressNotification,
    referanceDelete,
};
