import {NextFunction, Request, Response} from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import {AdminRole, Device, Gender, ProviderType, UserData, UserType} from "../../utils/enum";
import {AppStrings} from "../../utils/appStrings";
import mongoose from "mongoose";
const Business = require('../business/models/businessModel');
const User = require('../users/models/userModel');

const hasUserValidation = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers.userid as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        return commonUtils.sendError(req, res, {message: AppStrings.USERID_MISSING}, 404);

    const user = await User.findById(userId);
    if (!user) return commonUtils.sendError(req, res, {message: AppStrings.USER_NOT_FOUND}, 409);

    next();
}

const employeeValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "employeeId":"required",
        "designation":"required|string",
        "workHours": {
            "startTime": "required",
            "endTime": "required",
        },
        "businessBranch":"required"
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const hasBusinessValidation = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.headers.businessid as string;
    if (!businessId || ! mongoose.Types.ObjectId.isValid(businessId))
        return commonUtils.sendError(req, res, {message: AppStrings.BUSINESSID_MISSING}, 404);

    const business = await Business.findById(businessId);
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    next();
}

const availableValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "available":"required", //remove in:0 from here
        "reason":"string",
    }
    if (req.body.available == 0){
        ValidationRule.reason = "required",
        ValidationRule.startDate = "required",
        ValidationRule.endDate = "required"
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const approvedEmployeeValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "status":"required|in:2,3",
        "rejectReason":"string",
    }
    if (req.body.status == 3)
    {
        ValidationRule.rejectReason = "required"
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

export default {
    hasUserValidation,
    hasBusinessValidation,
    employeeValidation,
    availableValidation,
    approvedEmployeeValidation
}