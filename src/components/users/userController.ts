import { AppStrings } from "../../utils/appStrings";
import { Request, Response } from "express";
import { FriendStatus, ImageType, NotificationType, Recognise, TrustStatus, UserData, UserType } from "../../utils/enum";

import commonUtils, { fileFilter, fileFilterPdf, fileStorage, fileStoragePdf } from "../../utils/commonUtils";
import { AppConstants } from "../../utils/appConstants";
import eventEmitter from "../../utils/event";
import { computeDistanceBetween } from "../../utils/locationUtils/SphericalUtil";
import { LatLng } from "../../utils/locationUtils/LatLng";
import agenda from "../../utils/schedule";
import mongoose from "mongoose";
import { userMap, userMapMobile } from "../../index";
import moment from "moment/moment";

import userAuth from "../userAuth/authController"
import Phone from "../phone";
import { log } from "console";
import Auth from "../../auth";
import path from "path";
const md5 = require("md5");
const multer = require("multer");
const fs = require("fs");

const User = require('./models/userModel');

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

export default {
    uploadImage,
    uploadFile
}