import { AppStrings } from "../../utils/appStrings";

import { NextFunction, Request, Response } from "express";

import commonUtils from "../../utils/commonUtils";
import mongoose from "mongoose";

const ReportTo = require('./models/reportToModel')
const Subject = require('./models/subjectModel')

const createReport = async (req: Request, res: Response) => {
    try {
        const userId = req.headers.userid;
        const {subject,message,reportType,image,video,files} = req.body;

        const rep = await ReportTo.create({subject,message,reportType,image,video,files,userId})
        return commonUtils.sendSuccess(req, res, { _id: rep._id })

    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const listReport = async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const type = req.query.type ? parseInt(req.query.type as string) : null;
    const search = req.query.search;
    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;

    let filter: any = {};
    let filterName: any = {};

    try {
        if (userId) {
            filter = {
                userId: new mongoose.Types.ObjectId(userId),
            };
        }
        if (type) {
            filter = {
                reportType: type,
            };
        }
        if (search) {
            filterName = {
                $or: [
                    { "userData.fullName": { $regex: search, $options: "i" } },
                ]
            };
        }
        var total_ = await ReportTo.count({
            $and: [filter],
        })

        const pipeline = [
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $and: [filter],
                    ...filterName
                },
            },
            {
                $facet: {
                    metadata: [
                        { $count: "total" },
                        { $addFields: { page: page, limit: limit_, total: total_, hasMoreData: total_ > page * limit_ ? true : false } },
                    ],
                    data: [
                        { $skip: skip_ },
                        { $limit: limit_ },
                        {
                            $project: {
                                _id: 0,
                                reportId: "$_id",
                                subject: "$subject",
                                message: "$message",
                                reportType: "$reportType",
                                image: "$image",
                                video: "$video",
                                files: "$files",
                                action: "$action",
                                isReply: "$isReply",
                                user: {
                                    $cond: {
                                        if: "$userData",
                                        then: {
                                            _id: "$userData._id",
                                            name: "$userData.fullName",
                                            image: "$userData.image.profilePic",
                                        },
                                        else: {
                                            _id: "",
                                            name: "",
                                            image: "",
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ];
        const reports = await ReportTo.aggregate(pipeline);
        return commonUtils.sendAdminSuccess(req, res, reports);
    } catch (e: any) {
        console.log(e.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const singleReport = async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const type = req.query.type ? parseInt(req.query.type as string) : null;

    try {
        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(reportId),
                },
            },        
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                },
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    reportId: "$_id",
                    subject: "$subject",
                    message: "$message",
                    reportType: "$reportType",
                    image: "$image",
                    video: "$video",
                    files: "$files",
                    action: "$action",
                    user: {
                        $cond: {
                            if: "$userData",
                            then: {
                                _id: "$userData._id",
                                name: "$userData.fullName",
                                image: "$userData.image.profilePic",
                            },
                            else: {
                                _id: "",
                                name: "",
                                image: "",
                            },
                        },
                    },
                },
            },
        ];
        const reports = await ReportTo.aggregate(pipeline);
        return commonUtils.sendAdminSuccess(req, res, reports.length ? reports[0] : {});
    } catch (e: any) {
        console.log(e.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG });
    }
};

const deleteReport = async (req: Request, res: Response) => {
    const reportId = req.params.id;

    try {
        await ReportTo.findByIdAndDelete(reportId)
        return commonUtils.sendAdminSuccess(req, res, { message: AppStrings.REPORT_DELETED });
    } catch (er:any) {
        console.log(er.message);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}


const createSubject = async (req: Request, res: Response) => {
    try {        
        const {subject,reportType} = req.body;
        
        const sub = await Subject.findOne({reportType,subject})
        if(sub) return commonUtils.sendError(req, res, {message: AppStrings.SUBJECT_EXIST})

        const rep = await Subject.create({reportType,subject})
        return commonUtils.sendAdminSuccess(req, res, {_id:rep._id})
    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const updateSubject = async (req: Request, res: Response) => {
    try {        
        const subjectId = req.params.id;
        const {subject,reportType} = req.body;

        const sub = await Subject.findOne({_id:{$ne: new mongoose.Types.ObjectId(subjectId)}, reportType,subject})
        if(sub) return commonUtils.sendError(req, res, {message: AppStrings.SUBJECT_EXIST})

        await Subject.findByIdAndUpdate(subjectId, {reportType,subject})
        return commonUtils.sendAdminSuccess(req, res, {message:AppStrings.SUBJECT_UPDATED})
    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const deleteSubject = async (req: Request, res: Response) => {
    try {        
        const subjectId = req.params.id;

        await Subject.findByIdAndDelete(subjectId)
        return commonUtils.sendAdminSuccess(req, res, {message:AppStrings.SUBJECT_DELETED})
    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}


const getTypeOfSubject = async (req: Request, res: Response) => {
    try {
        const reportType = req.params.id;
        const rep = await Subject.find({reportType}).select('_id subject reportType')
        return commonUtils.sendSuccess(req, res, rep)
    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

const getAllSubject = async (req: Request, res: Response) => {
    try {        
        const rep = await Subject.find({}).sort('createdAt')
        return commonUtils.sendAdminSuccess(req, res, rep)
    } catch (e:any) {
        console.log(e.message)
        return commonUtils.sendError(req, res, {message: AppStrings.SOMETHING_WENT_WRONG})
    }
}

export default {
    createReport,
    listReport,
    singleReport,
    deleteReport,
    createSubject,
    updateSubject,
    deleteSubject,
    getTypeOfSubject,
    getAllSubject,
};