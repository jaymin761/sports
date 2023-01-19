import {AppStrings} from "../../utils/appStrings";

import {NextFunction, Request, Response} from "express";

import commonUtils from "../../utils/commonUtils";

import {ReportType} from "../../utils/enum";

const User = require("../users/models/userModel");
const Report = require("../report/reportModel")
const Business = require("../business/models/businessModel")
const Event = require('../event/models/eventModel')

const report = async (req: any, res: Response) => {
    try {
        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

        if (req.body.reportType === ReportType.EVENT) {
            // const eventId = req.body.reportId
            // console.log(eventId)
            // const event = await Event.findOne({
            //     _id: new mongoose.Types.ObjectId(eventId)
            // });
            const eventId = req.body.reportId as string;
            const event = await Event.findById(eventId);
            if (!event) return commonUtils.sendError(req, res, {message: AppStrings.EVENT_NOT_FOUND}, 409);

        } else if (req.body.reportType === ReportType.BUSINESS) {

            const businessId = req.body.reportId as string;
            const business = await Business.findById(businessId);
            if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

        } else if (req.body.reportType === ReportType.USER) {

            const userId = req.body.reportId as string;
            const user = await User.findById(userId);
            if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

        }

        const report = new Report({
            userId: userId,
            reportId: req.body.reportId,
            reportType: req.body.reportType,
            reportReason: req.body.reportReason
        })

        await report.save()
        return commonUtils.sendSuccess(req, res, {
            message: AppStrings.REPORTED_SUCCESS
        })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const reportList = async (req: any, res: Response) => {
    try {
        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

        Report.find({}, function (error: any, result: any) {
            if (error) {
                console.log(error)
            } else {
                return commonUtils.sendSuccess(req, res, result)
            }
        })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

export default {
    report,
    reportList
}