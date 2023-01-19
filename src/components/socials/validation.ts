import { NextFunction, Request, Response } from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import { Gender } from "../../utils/enum";
import { AppStrings } from "../../utils/appStrings";
import mongoose from "mongoose";
import { SocialsTypeVisibility } from "../../utils/enum";

const socialMediaAddValidation = async (req: Request, res: Response, next: NextFunction) => {

    const visiblity = [SocialsTypeVisibility.PUBLIC, SocialsTypeVisibility.PRIVATE];

    const ValidationRule: any = {
        "visibility": "numeric|in:" + visiblity.join(","),
        "description": "required",
        "image": "string",
        "video": "string",
        "name": "required",
        "longitude": "required",
        "latitude": "required"
    }

    if (req.body.video) {
        ValidationRule.thumbnail = "required"
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const likeValidation = async (req: Request, res: Response, next: NextFunction) => {

    const visiblity = [SocialsTypeVisibility.PUBLIC, SocialsTypeVisibility.PRIVATE];

    const ValidationRule: any = {
        "postId": "required",
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const commnetValidation = async (req: Request, res: Response, next: NextFunction) => {

    const visiblity = [SocialsTypeVisibility.PUBLIC, SocialsTypeVisibility.PRIVATE];

    const ValidationRule: any = {
        "postId": "required",
        "comment": "required"
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const postBlockValidation = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "postId": "required",
        "reason": "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

export default {
    socialMediaAddValidation,
    likeValidation,
    commnetValidation,
    postBlockValidation
}