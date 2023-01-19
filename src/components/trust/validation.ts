import { NextFunction, Request, Response } from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import { AdminRole, Device, Gender, ProviderType, UserData, UserType } from "../../utils/enum";
import { AppStrings } from "../../utils/appStrings";
import { AppConstants } from "../../utils/appConstants";
import mongoose from "mongoose";
const User = require('./userModel');

const hasUserValidation = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers.userid as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        return commonUtils.sendError(req, res, { message: AppStrings.USERID_MISSING }, 404);

    const user = await User.findById(userId);
    if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

    next();
}

const locationValidation = async (req: Request, res: Response, next: NextFunction) => {
    const ValidationRule = {
        "location": {
            "longitude": "required|numeric|min:-180|max:180",
            "latitude": "required|numeric|min:-90|max:90",
        },
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}


export default {
    hasUserValidation,
    locationValidation,
}