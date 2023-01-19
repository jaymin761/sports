import { AppStrings } from "../../../utils/appStrings";

const Event = require("../../event/models/eventModel");
const User = require("../../users/models/userModel");
const BlockEvent = require("../../event/models/blockEvent");
import { Request, Response } from "express";
import commonUtils, { fileFilter, fileStorage } from "../../../utils/commonUtils";
import mongoose, { ObjectId } from "mongoose";
import moment from "moment";
import { AppConstants } from "../../../utils/appConstants";

const eventList = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 10;
    const skip_ = (page - 1) * limit_;
    const total_ = await Event.countDocuments();
    const search = req.query.search;
    let filter: any = {};
    if (search) {
        filter = {
            $or: [
                { name: { $regex: search, $options: "i" } },
            ]
        };
    }

    let eventData = await Event.aggregate([
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
                ],
            },
        },

        { $sort: { createdAt: -1 } },
    ]);

    return commonUtils.sendAdminSuccess(req, res, eventData);
}

const userEventList = async (req: Request, res: Response) => {
    let userId = req.query.userId;

    if (!userId)
        return commonUtils.sendSuccess(req, res, { message: AppStrings.USER_NOT_FOUND })

    let eventUser = await Event.find({ userId: userId });
    return commonUtils.sendSuccess(req, res, eventUser)
}

const blockEventList = async (req: Request, res: Response) => {
    let blockEvent = await BlockEvent.find().sort({ createdAt: -1 });

    if (!blockEvent)
        return commonUtils.sendError(req, res, { message: AppStrings.BLOCK_EVENT_NOT_FOUND })

    return commonUtils.sendSuccess(req, res, blockEvent);
}

// TODO: admin can change status enable and disable
const updateEventStatus = async (req: Request, res: Response) => {
    let eventId = req.params.id;

    const event = await Event.findById({ _id: eventId });
    if (event) {
        event.isBlockEvent = event.isBlockEvent ? 0 : 1
        await event.save()

        let blockEvent = await BlockEvent.find().sort({ createdAt: -1 });
        blockEvent.forEach(async (data: any) => {
            if (eventId == data.eventId) {
                data.status = event.isBlockEvent
                await data.save()
            }
        })
        let mes = '';
        event.isBlockEvent == 0 ? mes = 'disable' : mes = 'enable';
        return commonUtils.sendSuccess(req, res, { message: "Event " + mes + " successfully." })
    } else {
        return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
    }
}

const deleteEvent = async (req: Request, res: Response) => {
    const eventId = req.params.id
    var event = await Event.findOneAndDelete({ _id: eventId })
    if (event) {
        let blockEvent = await BlockEvent.find().sort({ createdAt: -1 });
        blockEvent.forEach(async (data: any) => {
            if (eventId == data.eventId) {
                await BlockEvent.findOneAndDelete({ _id: data });
            }
        })
        return commonUtils.sendSuccess(req, res, { message: AppStrings.EVENT_DELETE })
    } else {
        return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
    }
}

const eventUpdate = async (req: any, res: Response) => {

    let eventId = req.body.eventId

    if (!eventId) {
        return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
    }

    try {

        const event = await Event.findOne({
            _id: new mongoose.Types.ObjectId(eventId),
        });

        if (!event) return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND }, 409);

        // ONCE EVENT WAS FOUND THEN CHECK CONDITIONS FOR DATE RELATED

        const date = moment(new Date())

        const startDate = req.body.startDate || event.startDate
        const start_ = moment(startDate)

        const endDate = req.body.endDate || event.endDate
        const end_ = moment(endDate)

        if (start_ <= date)
            return commonUtils.sendError(req, res, { message: "Please select date after today" })

        if (end_ < start_)
            return commonUtils.sendError(req, res, { message: "Please select date after start date" })

        const start_time = moment(req.body.startTime || event.startTime, "HH:mm a")
        const end_time = moment(req.body.endTime || event.endTime, "HH:mm a")

        let duration = '';

        if (start_.isSame(end_)) {
            //Both dates are same
            if (end_time <= start_time) {
                return commonUtils.sendError(req, res, {
                    message: "End time should not be less than start time"
                })
            }

            const durationAsSeconds = moment.duration(end_time.diff(start_time)).asSeconds()
            duration = commonUtils.secondsToHms(durationAsSeconds)
        } else {
            //Both dates are different
            let startTime = moment(`${startDate} ${req.body.startTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)
            let endTime = moment(`${endDate} ${req.body.endTime}`, AppConstants.DATE_FORMAT_WITH_AM_OR_PM)

            const durationAsSeconds = endTime.diff(startTime, 'seconds')

            if (durationAsSeconds > 259200)
                return commonUtils.sendError(req, res, { message: "Event duration Should not be more than 72 Hours(3 Days)" })

            duration = commonUtils.secondsToDhms(durationAsSeconds)
        }

        event.name = req.body?.name || event.name;
        event.inviteId = req.body?.inviteId || event.inviteId;
        event.description = req.body?.description || event.description;
        event.image = req.body?.image || event.image;
        event.address = {
            name: req.body?.address?.name || event.address.name,
            location: {
                type: "Point",
                coordinates: (req.body.address.longitude && req.body.address.latitude) ? [req.body.address.longitude, req.body.address.latitude] : event.coordinates,
            },
        };
        event.startDate = start_ || event.startDate
        event.endDate = end_ || event.endDate
        event.startTime = req.body?.startTime || event.startTime
        event.endTime = req.body?.endTime || event.endTime
        event.duration = duration || event.duration
        event.visibility = req.body?.visibility || event.visibility
        event.status = req.body?.status || event.status

        await event.save()
        return commonUtils.sendSuccess(req, res, { message: AppStrings.UPDATE })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }

}

const blockEventListUser = async (req: any, res: Response) => {

    let eventId = req.params.id

    const pipeline = [
        { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'reportUserId',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                userId: "$reportUserId",
                userName: "$userData.fullName",
                eventId: "$eventId",
                reason: "$reason",
                status: "$status",
                createdAt: "$createdAt",
            }
        },
    ];

    let event = await BlockEvent.aggregate(pipeline)

    var eventData: any = [];
    event.forEach(async (data: any) => {
        if (data.userName) {
            eventData.push(data);
        }
    })

    if (!eventData) {
        return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
    }

    return commonUtils.sendSuccess(req, res, event)

}


export default {
    eventList,
    userEventList,
    blockEventList,
    updateEventStatus,
    deleteEvent,
    eventUpdate,
    blockEventListUser
}