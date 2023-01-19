import { AppStrings } from "../../utils/appStrings";

import { NextFunction, Request, Response } from "express";

const User = require("../users/models/userModel");
import commonUtils, { fileFilter, fileFilterPdf, fileFilters, fileStorage, fileStoragePdf } from "../../utils/commonUtils";
import mongoose from "mongoose";
import moment from "moment";

import multer from "multer";
import path from "path";
import { EventTypeVisibility } from "../../utils/enum";
import { AppConstants } from "../../utils/appConstants";

const Event = require('./models/eventModel')
const fs = require('fs')
const BlockEvent = require('./models/blockEvent')
const EventInvitation = require('./models/eventInvitation')

const createEvent = async (req: any, res: Response) => {

    const date = moment(new Date())

    const startDate = req.body.startDate
    const start_ = moment(startDate, 'YYYY-MM-DD hh:mm a')

    const endDate = req.body.endDate
    const end_ = moment(endDate, 'YYYY-MM-DD hh:mm a')

    if (start_ <= date)
        return commonUtils.sendError(req, res, { message: "Please select date after today" })

    if (end_ < start_)
        return commonUtils.sendError(req, res, { message: "Please select date after start date" })

    if (!moment(end_, 'hh:mm a').isAfter(moment(start_, 'hh:mm a'))) {
        return commonUtils.sendError(req, res, { message: AppStrings.TIME_INVALID }, 422);
    }

    // const start_time = moment(req.body.startTime, "HH:mm a").utc()
    // const start_time1 = moment.utc(moment(req.body.startTime, "HH:mm a")).format('HH:mm a')

    // const end_time = moment(req.body.endTime, "HH:mm a").utc()
    // const end_time1 = moment.utc(moment(req.body.endTime, "HH:mm a")).format('HH:mm a')

    // let duration = '';

    try {

        // if (start_.isSame(end_)) {

        //     //Both dates are same
        //     if (end_time <= start_time) {
        //         return commonUtils.sendError(req, res, {
        //             message: "End time should not be less than start time"
        //         })
        //     }

        //     const durationAsSeconds = moment.duration(end_time.diff(start_time)).asSeconds()
        //     duration = commonUtils.secondsToHms(durationAsSeconds)
        // } else {            
        //     //Both dates are different
        //     let startTime = moment(`${startDate} ${req.body.startTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)            
        //     let endTime = moment(`${endDate} ${req.body.endTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)

        //     const durationAsSeconds = endTime.diff(startTime, 'seconds')            

        //     if (durationAsSeconds > 259200)
        //         return commonUtils.sendError(req, res, { message: "Event duration Should not be more than 72 Hours(3 Days)" })

        //     duration = commonUtils.secondsToDhms(durationAsSeconds)
        //     console.log(duration)
        // }

        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        const event = new Event({
            userId: userId,
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            video: req.body.video,
            inviteId: req.body.inviteId,
            address: {
                name: req.body.address.name,
                location: {
                    type: "Point",
                    coordinates: [req.body.address.longitude, req.body.address.latitude]
                },
            },
            startDate: start_,
            // startDate: startDate,
            endDate: end_,
            // endDate: endDate,
            // duration: duration,
            // startTime: start_time1,
            // endTime: end_time1,
            visibility: req.body.visibility,
            status: req.body.status
        })

        await event.save()


        if (req.body.deleteImage) {
            let images = req.body.deleteImage;
            images.map((element: any) => {

                if (fs.existsSync(path.join(__dirname, '../../../src/uploads/images') + path.basename(element))) {
                    fs.unlinkSync(path.join(__dirname, '../../../src/uploads/images') + path.basename(element));
                }
            });
        }

        return commonUtils.sendSuccess(req, res, event)

    } catch (e: any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }

}

const updateEvent = async (req: any, res: Response) => {
    try {
        const eventId = req.params.id
        const userId = req.headers.userid;
        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        const event = await Event.findOne({
            _id: new mongoose.Types.ObjectId(eventId),
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!event) return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND }, 409);

        // ONCE EVENT WAS FOUND THEN CHECK CONDITIONS FOR DATE RELATED

        const date = moment(new Date())

        const startDate = req.body.startDate || event.startDate
        const start_ = moment(startDate, 'YYYY-MM-DD hh:mm a').utc()

        const endDate = req.body.endDate || event.endDate
        const end_ = moment(endDate, 'YYYY-MM-DD hh:mm a').utc()

        if (start_ <= date)
            return commonUtils.sendError(req, res, { message: "please select date after today" })

        if (end_ < start_)
            return commonUtils.sendError(req, res, { message: "please select date after start date" })

        if (!moment(end_, 'hh:mm a').isAfter(moment(start_, 'hh:mm a'))) {
            return commonUtils.sendError(req, res, { message: AppStrings.TIME_INVALID }, 422);
        }

        // const start_time = moment(req.body.startTime || event.startTime, "HH:mm a")
        // const end_time = moment(req.body.endTime || event.endTime, "HH:mm a")

        // let duration = '';

        // if (start_.isSame(end_)) {
        //     //Both dates are same
        //     if (end_time <= start_time) {
        //         return commonUtils.sendError(req, res, {
        //             message: "End time should not be less than start time"
        //         })
        //     }

        //     const durationAsSeconds = moment.duration(end_time.diff(start_time)).asSeconds()
        //     duration = commonUtils.secondsToHms(durationAsSeconds)
        // } else {
        //     //Both dates are different
        //     let startTime = moment(`${startDate} ${req.body.startTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)
        //     let endTime = moment(`${endDate} ${req.body.endTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)

        //     const durationAsSeconds = endTime.diff(startTime, 'seconds')

        //     if (durationAsSeconds > 259200)
        //         return commonUtils.sendError(req, res, { message: "Event duration Should not be more than 72 Hours(3 Days)" })

        //     duration = commonUtils.secondsToDhms(durationAsSeconds)
        // }

        event.name = req.body.name || event.name;
        event.inviteId = req.body.inviteId || event.inviteId;
        event.description = req.body.description || event.description;
        event.image = req.body.image || event.image;
        event.video = req.body.video || event.video;
        event.address = {
            name: req.body.address.name || event.address.name,
            location: {
                type: "Point",
                coordinates: (req.body.address.longitude && req.body.address.latitude) ? [req.body.address.longitude, req.body.address.latitude] : event.coordinates,
            },
        };
        event.startDate = start_ || event.startDate
        event.endDate = end_ || event.endDate
        // event.startTime = req.body.startTime || event.startTime
        // event.endTime = req.body.endTime || event.endTime
        // event.duration = duration || event.duration
        event.visibility = req.body.visibility || event.visibility
        event.status = req.body.status || event.status

        await event.save()
        return commonUtils.sendSuccess(req, res, { message: AppStrings.UPDATE })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const cancelEvent = async (req: any, res: Response) => {
    try {
        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        const eventId = req.params.id
        const event = await Event.findOne({
            _id: new mongoose.Types.ObjectId(eventId),
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!event) return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND }, 409);

        await Event.updateOne({
            _id: new mongoose.Types.ObjectId(eventId),
            userId: new mongoose.Types.ObjectId(userId)
        }, { $set: { "status": req.body.status, "cancelledReason": req.body.cancelledReason } })

        return commonUtils.sendSuccess(req, res, { message: AppStrings.CANCEL })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const myEvents = async (req: any, res: Response) => {
    try {
        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        try {
            const pipeline = [
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
                    $project: {
                        _id: 1,
                        userId: "$userId",
                        userName: "$userData.fullName",
                        address: "$address.name",
                        location: "$address.location",
                        image: "$image",
                        video: "$video",
                        name: "$name",
                        description: "$description",
                        inviteId: "$inviteId",
                        startDate: "$startDate",
                        startTime: "$startTime",
                        endDate: "$endDate",
                        endTime: "$endTime",
                        duration: "$duration",
                        visibility: "$visibility",
                        isBlockEvent: "$isBlockEvent",
                        status: "$status",
                        cancelledReason: "$cancelledReason",
                        createdAt: "$createdAt",
                    }
                },
            ];

            let event = await Event.aggregate(pipeline)

            return commonUtils.sendSuccess(req, res, event ? event : [])

        } catch (e) {
            console.log(e)
            return commonUtils.sendError(req, res, {
                message: AppStrings.SOMETHING_WENT_WRONG
            })
        }

        return commonUtils.sendSuccess(req, res, event)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const eventDetails = async (req: any, res: Response) => {
    try {
        const eventId = req.params.id;

        if (!eventId) {
            return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
        }

        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
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
                $project: {
                    _id: 1,
                    userId: "$userId",
                    userName: "$userData.fullName",
                    userImage: "$userData.image.profilePic",
                    averageTrust: "$userData.averageTrust",
                    address: "$address.name",
                    location: "$address.location",
                    image: "$image",
                    video: "$video",
                    name: "$name",
                    description: "$description",
                    inviteId: "$inviteId",
                    startDate: "$startDate",
                    startTime: "$startTime",
                    endDate: "$endDate",
                    endTime: "$endTime",
                    duration: "$duration",
                    visibility: "$visibility",
                    isBlockEvent: "$isBlockEvent",
                    status: "$status",
                    cancelledReason: "$cancelledReason",
                    createdAt: "$createdAt",
                }
            },
        ];

        let event = await Event.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, event ? event[0] : {})

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const StatusWiseEvent = async (req: any, res: Response) => {

    let userId = req.headers.userid

    try {
        let EventStatus = req.query.status
        let event = [];

        if (EventStatus === "upcoming") {
            event = await Event.find({ startDate: { $gte: new Date() }, userId: userId, status: { $nin: [2] } })
        }

        if (EventStatus === "posted") {
            var d = new Date(); // Today!
            d.setDate(d.getDate() - 1);
            event = await Event.find({ startDate: { $lt: new Date(d) }, userId: userId })
        }

        if (EventStatus === "cancelled") {
            event = await Event.find({ cancelledReason: { $exists: true, $ne: null }, userId: userId })
        }

        return commonUtils.sendSuccess(req, res, event)
    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const allEvents = async (req: any, res: Response) => {

    let lat = parseFloat(req.query.lat as string);
    let long = parseFloat(req.query.long as string);
    const range = parseInt(req.query.range as string) || 1000;

    try {
        const pipeline = [
            {
                $match: { status: { $in: [1, 0] }, visibility: EventTypeVisibility.PUBLIC, isBlockEvent: 1 }
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
                $project: {
                    _id: 1,
                    userId: "$userId",
                    inviteId: "$inviteId",
                    userName: "$userData.fullName",
                    address: "$address.name",
                    name: "$name",
                    image: "$image",
                    video: "$video",
                    location: "$address.location",
                    description: "$description",
                    startDate: "$startDate",
                    startTime: "$startTime",
                    endDate: "$endDate",
                    endTime: "$endTime",
                    duration: "$duration",
                    visibility: "$visibility",
                    status: "$status",
                    cancelledReason: "$cancelledReason",
                    createdAt: "$createdAt",
                    distance: { $round: ["$distance", 2] },
                }
            },
        ];

        if (lat && long) {
            const geoNear = {
                near: {
                    type: "Point",
                    coordinates: [long, lat]
                },
                key: "address.location",
                distanceField: "distance",
                spherical: true,
                maxDistance: range
            }
            //@ts-ignore
            pipeline.unshift({ $geoNear: geoNear });
        }

        const event = await Event.aggregate(pipeline);

        return commonUtils.sendSuccess(req, res, event);

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const blockEvent = async (req: any, res: Response) => {

    let userId = req.headers.userid

    let events = await BlockEvent.findOne({
        reportUserId: userId,
        eventId: req.body.eventId
    })

    if (events)
        return commonUtils.sendError(req, res, { message: AppStrings.ALREADT_REQUEST_EVENT })

    const event = await new BlockEvent({
        eventId: req.body.eventId,
        reportUserId: userId,
        reason: req.body.reason,
    })

    await event.save()

    return commonUtils.sendSuccess(req, res, event)
}

const eventInvitation = async (req: any, res: Response) => {

    const userId = req.headers.userid;

    const eventId = req.body.eventId

    let event = await Event.findOne({ _id: new mongoose.Types.ObjectId(eventId), visibility: 0 })

    if (!event)
        return commonUtils.sendError(req, res, { mesage: AppStrings.EVENT_NOT_FOUND })

    if (!userId)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

    let invited_ = await EventInvitation.findOne({ invitedUserId: req.body.invitedUserId, eventId: req.body.eventId })

    if (invited_)
        return commonUtils.sendError(req, res, { messgae: AppStrings.ALREADY_SEND_INVITATION })

    const invited = await new EventInvitation({
        userId: userId,
        eventId: req.body.eventId,
        invitedUserId: req.body.invitedUserId,
    })

    await invited.save();

    return commonUtils.sendSuccess(req, res, { message: AppStrings.EVENT_INVITATION_SEND })
}


const eventInvitationAccept = async (req: Request, res: Response) => {
    const eventInviId = req.params.id

    if (!eventInviId)
        return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_NOT_FOUND });
    const userId: any = req.headers.userid;
    if (!userId)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND });

    const invitation = await EventInvitation.findOne({
        _id: eventInviId,
        invitedUserId: userId,
        status: 0
    })

    if (!invitation)
        return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_NOT_FOUND });

    if (req.body.status == 1) {
        await EventInvitation.updateOne({
            _id: new mongoose.Types.ObjectId(eventInviId),
            invitedUserId: new mongoose.Types.ObjectId(userId),
        }, { $set: { "status": req.body.status } })
        return commonUtils.sendSuccess(req, res, { message: AppStrings.INVITATION_APPROVED, status: 1 })
    } else if (req.body.status == 2) {
        await EventInvitation.deleteOne({
            _id: new mongoose.Types.ObjectId(eventInviId),
            invitedUserId: new mongoose.Types.ObjectId(userId),

        })
        return commonUtils.sendSuccess(req, res, { message: AppStrings.INVITATION_REJECTED, status: 2 })
    }

}

const eventInvitationList = async (req: Request, res: Response) => {
    const userId: any = req.headers.userid;
    const event = [
        {
            $match: {
                invitedUserId: new mongoose.Types.ObjectId(userId),
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
            $lookup: {
                from: "events",
                localField: "eventId",
                foreignField: "_id",
                as: "eventObj",
            }
        },
        {
            $unwind: { path: '$eventObj' }
        },
        {
            $unwind: { path: '$userObj' }
        },
        {
            $project: {
                _id: 1,
                'eventName': "$name",
                'startDate': "$startDate",
                'startTime': "$startTime",
                'endDate': "$endDate",
                'endTime': "$endTime",
                'duration': "$duration",
                'visibility': "$visibility",
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

    const events = await EventInvitation.aggregate(event);
    return commonUtils.sendSuccess(req, res, events)
}

const eventDelete = async (req: Request, res: Response) => {

    const eventId = req.params.id

    let event = await Event.findOneAndDelete({ _id: eventId })

    if (!event)
        return commonUtils.sendError(req, res, { message: AppStrings.EMPLOYEE_NOT_FOUND })

    return commonUtils.sendSuccess(req, res, { message: AppStrings.EVENT_DELETE })

}

const uploadMultipleImage = async (req: Request, res: Response, next: NextFunction) => {

    const image_ = multer({
        storage: fileStorage,
        fileFilter: fileFilter
    }).array("images");

    image_(req, res, async (err: any) => {

        console.log(err);
        if (err) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_UPLOADED }, 409);

        if (!req.files) return commonUtils.sendError(req, res, { message: AppStrings.IMAGE_NOT_FOUND }, 409);

        const image_name: any = req.files;

        var arr: any = [];

        image_name.map((element: any) => {
            arr.push(element.filename);
        })

        return commonUtils.sendSuccess(req, res, arr, 200);
    }
    );
}

const uploadMultiplefile = async (req: Request, res: Response, next: NextFunction) => {

    const image_ = multer({
        storage: fileStoragePdf,
        fileFilter: fileFilterPdf
    }).array("files");

    image_(req, res, async (err: any) => {

        console.log(err);
        if (err) return commonUtils.sendError(req, res, { message: AppStrings.FILE_NOT_UPLOADED }, 409);

        if (!req.files) return commonUtils.sendError(req, res, { message: AppStrings.FILE_NOT_FOUND }, 409);

        const file: any = req.files;

        var arr: any = [];

        file.map((element: any) => {
            arr.push(element.filename);
        })

        return commonUtils.sendSuccess(req, res, arr, 200);
    }
    );
}

export default {
    createEvent,
    updateEvent,
    cancelEvent,
    myEvents, // Get all event list which are created by that user
    allEvents,
    eventDetails,
    blockEvent,
    eventInvitation,
    eventInvitationAccept,
    uploadMultipleImage,
    eventDelete,
    StatusWiseEvent,
    eventInvitationList,
    uploadMultiplefile
    // Get all event list Except whose status are 2 (Cancel Event)report,
    // reportList
}