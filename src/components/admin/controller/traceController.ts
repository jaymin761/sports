import { AppStrings } from "../../../utils/appStrings";

const traceRequest = require("../../users/models/requestModel");
const Trace = require("../../users/models/traceUser");
const User = require("../../users/models/userModel");
import { NextFunction, query, Request, Response } from "express";
import commonUtils, { fileFilter, fileStorage } from "../../../utils/commonUtils";
import mongoose from "mongoose";

const approveRequest = async (req: Request, res: Response) => {
    let userId = req.params.id
    let request = await traceRequest.findOne({ userId: userId, status: 0 });

    if (request) {
        if (req.body.status == 1) {
            await traceRequest.updateOne({
                userId: new mongoose.Types.ObjectId(userId),
                status: 0
            }, { $set: { "status": req.body.status } })

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });
            let requestCount = user.userTrace + request.requestedTrace;
            await User.updateOne({ _id: userId }, { $set: { "userTrace": requestCount } })

            return commonUtils.sendSuccess(req, res, { message: AppStrings.REQUEST_APPROVED })
        } else if (req.body.status == 2) {
            await traceRequest.updateOne({
                userId: new mongoose.Types.ObjectId(userId),
                status: 0
            }, { $set: { "status": req.body.status } })
            return commonUtils.sendSuccess(req, res, { message: AppStrings.REQUEST_REJECTED })
        }
    } else {
        return commonUtils.sendError(req, res, { message: AppStrings.REQUEST_NOT_FOUND })
    }

}

const listRequestPending = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await traceRequest.countDocuments({ status: 0 });
    const search = req.query.search;
    let filter: any = {};
    if (search) {
        filter = {
            $or: [
                { "userObj.fullName": { $regex: search, $options: "i" } },
            ]
        };
    }

    const pipeline = [
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
            $match: {
                status: 0,
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
                            _id: 1,
                            'userId': "$userId",
                            'fullName': "$userObj.fullName",
                            'status': "$status",
                            'requestedTrace': "$requestedTrace",
                            'createdAt': "$createdAt",
                        },
                    },
                ],
            },
        },
    ];

    const trace = await traceRequest.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, trace)
}

const listRequestApprove = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await traceRequest.countDocuments({ status: { $in: [1, 2] } });
    const search = req.query.search;
    let filter: any = {};
    if (search) {
        filter = {
            $or: [
                { "userObj.fullName": { $regex: search, $options: "i" } },
            ]
        };
    }
    const pipeline = [
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
            $match: {
                status: { $in: [1, 2] },
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
                            _id: 1,
                            'userId': "$userId",
                            'fullName': "$userObj.fullName",
                            'status': "$status",
                            'requestedTrace': "$requestedTrace",
                            'createdAt': "$createdAt",
                        },
                    },
                ],
            },
        },
    ];

    const Request = await traceRequest.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, Request)
}

const traceHistory = async (req: Request, res: Response) => {
    const userId: any = req.params.id;

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
                'address': "$userObj.address",
                'permissions': "$userObj.permissions",
                'status': "$status",
                'createdAt': "$createdAt",
            },
        },
    ];

    const trace = await Trace.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, trace)
}

const traceUserList = async (req: Request, res: Response) => {

    let userId = req.params.id

    let user = await User.findById(userId)

    if (!user)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

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
                'status': "$status",
            },
        },
    ];

    const trace = await Trace.aggregate(pipeline);
    return commonUtils.sendSuccess(req, res, trace)
}

const traceUserDelete = async (req: Request, res: Response) => {

    let traceId = req.params.id

    let trace = await Trace.findById(traceId);

    if (!trace) {
        return commonUtils.sendError(req, res, { message: AppStrings.TRACE_USER_NOT_FOUND })
    }

    await Trace.deleteOne({ _id: traceId })

    return commonUtils.sendSuccess(req, res, { message: AppStrings.DELETE })
}

export default {
    approveRequest,
    listRequestPending,
    listRequestApprove,
    traceHistory,
    traceUserList,
    traceUserDelete
}