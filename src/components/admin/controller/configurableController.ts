import {AppStrings} from "../../../utils/appStrings";

const Configurable = require("../models/configurable");
import {NextFunction, query, Request, Response} from "express";
import commonUtils, {fileFilter, fileStorage} from "../../../utils/commonUtils";
import mongoose from "mongoose";
import employee from "../../employee";

async function configurableFieldAdd(req: Request, res: Response) {
    const ConfigurableId = req.body.id;
    try {
        if (!ConfigurableId) {
            let data = new Configurable({
                chats: {
                    voiceNote: req.body?.chats?.voiceNote,
                    images: req.body?.chats?.images,
                    files: req.body?.chats?.files,
                    video: req.body?.chats?.video
                },
                posts: {
                    images: req.body?.posts?.images,
                    video: req.body?.posts?.video
                },
                ads: {
                    images: req.body?.ads?.images,
                    video: req.body?.ads?.video,
                    audio: req.body?.ads?.audio
                },
                streaming: {
                    video: req.body?.streaming?.video,
                    audio: req.body?.streaming?.audio
                },
                trace: {
                    traceRequest: req.body?.trace?.traceRequest
                },
                employee: {
                    employeeRequest: req.body?.employee?.employeeRequest
                }
            })
            await data.save()

            return commonUtils.sendSuccess(req, res, data)
        }

        const filed = await Configurable.findById(ConfigurableId);

        if (!filed)
            return commonUtils.sendError(req, res, {message:AppStrings.CONFIGURABLE_NOT_FOUND})

        filed.chats = {
            voiceNote: req.body?.chats?.voiceNote || filed.chats.voiceNote,
            images: req.body?.chats?.images || filed.chats.images,
            files: req.body?.chats?.files || filed.chats.files,
            video: req.body?.chats?.video || filed.chats.video
        }
        filed.posts = {
            images: req.body?.posts?.images || filed.chats.images,
            video: req.body?.posts?.video || filed.chats.video
        }
        filed.ads = {
            images: req.body?.ads?.images || filed.ads.images,
            video: req.body?.ads?.video || filed.ads.video,
            audio: req.body?.ads?.audio || filed.ads.audio
        }
        filed.streaming = {
            video: req.body?.streaming?.video || filed.streaming.video,
            audio: req.body?.streaming?.audio || filed.streaming.audio
        }
        filed.trace = {
            traceRequest: req.body?.trace?.traceRequest || filed.trace.traceRequest
        }
        filed.employee = {
            employeeRequest: req.body?.employee?.employeeRequest || filed.employee.employeeRequest
        }

        await filed.save()

        return commonUtils.sendSuccess(req, res, filed)
    }
    catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {message:AppStrings.SOMETHING_WENT_WRONG})
    }

}

async function configurableFieldList(req: Request, res: Response) {
    let filed = await Configurable.findOne().sort({createdAt: -1})

    if (!filed)
        return commonUtils.sendError(req, res, {message:AppStrings.CONFIGURABLE_NOT_FOUND})

    return commonUtils.sendSuccess(req, res, filed)
}

export default {
    configurableFieldAdd,
    configurableFieldList
}