import {NextFunction, Request, Response} from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import {AdminRole, Device, Gender, ProviderType, UserData, UserType} from "../../utils/enum";
import {AppStrings} from "../../utils/appStrings";
import {AppConstants} from "../../utils/appConstants";
import mongoose from "mongoose";
import {phone} from "phone";
// import Employee from "../employee";

//sample
// const User = require('./models/businessModel');
const Business = require('./models/businessModel');
const Employee = require('../employee/employeeModel');

const hasBusinessValidation = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.headers.businessid as string;
    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId))
        return commonUtils.sendError(req, res, {message: AppStrings.BUSINESSID_MISSING}, 404);

    const business = await Business.findById(businessId);
    if (!business) return commonUtils.sendError(req, res, {message: AppStrings.BUSINESS_NOT_FOUND}, 409);

    next();
}

const authorizedValidation = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.headers.businessid as string;
    const userId = req.headers.userid as string;

    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId))
        return commonUtils.sendError(req, res, {message: AppStrings.BUSINESSID_MISSING}, 404);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return commonUtils.sendError(req, res, {message: AppStrings.USERID_MISSING}, 404);
    }

    const business = await Business.findOne({_id: businessId, userId: userId});
    const employee = await Employee.findOne({businessId: businessId, employeeId: userId, authorized: true})

    if (business || employee) {
        next();
    }

    if (!business || !employee) return commonUtils.sendError(req, res, {message: AppStrings.NOT_AUTHORIZED}, 409);
}

const locationValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "location": {
            "longitude": "required|numeric|min:-180|max:180",
            "latitude": "required|numeric|min:-90|max:90",
        },
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}
const settingValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "permissions.location": {
            "whileUsingApp": "boolean",
            "withLinkedContact": "boolean",
            "withPublic": "boolean",
            "notShared": "boolean",
        },
        "permissions.visibility": {
            "picture": "boolean",
            "status": "boolean",
            "post": "boolean",
        },
        "permissions.acceptMessage": {
            "public": "boolean",
            "contact": "boolean",
            "marketing": "boolean"
        }
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const createBusinessValidation = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "bio": "required|string",
        "businessStatus": "required|string",
        "name": "required|string",
        "image": "required|string",
        "mobile": `valid_phone|exist:Business,mobile`,
        "email": `string|email|max:255|exist:Business,email`,
        "secondary": `valid_phone|different:mobile|different:alternative`,
        "alternative": `valid_phone|different:mobile|different:secondary`,
        "address": "required",
        "address.businessLocationName": "required",
        "address.physicalAddress": "required",
        "address.longitude": "required|numeric|min:-180|max:180",
        "address.latitude": "required|numeric|min:-180|max:180",
        "designation":"required",
         "workHours": {
            "startTime": "required",
            "endTime": "required",
        },
    }

    if (!req.body.email && !req.body.mobile) {
        return commonUtils.sendError(req, res, { error: AppStrings.EMAIL_MOBILE_REQUIRED })
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);

}
const updateBusinessValidation = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.headers.businessid;
    const userId = req.headers.userid;

    const validationRule: any = {
        "bio": "required|string",
        "businessStatus": "required|string",
        "name": "required|string",
        "image": "required|string",
        "mobile": `valid_phone|exist_value_business:Business,mobile,${businessId},${userId}`,
        "email": `string|email|max:255|exist_value_business:Business,email,${businessId},${userId}`,
        "secondary": `valid_phone|different:mobile|different:alternative`,
        "alternative": `valid_phone|different:mobile|different:secondary`,
        "address.longitude": "numeric|min:-180|max:180",
        "address.latitude": "numeric|min:-180|max:180",
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);

}

const refrenceValidation = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule = {
        "reference": [{
            'array': true,
        }],
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
const advertisementValidation = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule = {
        "message": "required|string",
        "audio": "required",
    }
    if (!req.body.image && !req.body.video) {
        return commonUtils.sendError(req, res, {error: AppStrings.PLEASE_UPLOAD_IMAGE})
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const verifyDocumentValidation = async (req: Request, res: Response, next: NextFunction) => {
    const businessId = req.headers.businessid;
    let ValidationRule: any = {
        "registrationNumber": "required|string",
        "image": "required|string",
        //"address": "required",
        /*"address.name": "required",
        "address.longitude": "required",
        "address.latitude": "required",
        "secondaryNumber": `valid_phone|exist_value:Business,mobile,${businessId}|exist_value:Business,optionalMobile.secondary,${businessId}|exist_value:Business,optionalMobile.alternative,${businessId}`,*/
    }
    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}
const addressValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "addressDetails.*.businessName": "required|string",
        "addressDetails.*.businessLocationName": "required|string",
        "addressDetails.*.physicalAddress": "required|string",
        "addressDetails.*.longitude": "required|numeric|min:-180|max:180",
        "addressDetails.*.latitude": "required|numeric|min:-90|max:90",
        "addressDetails.*.description": 'required',
        "addressDetails.*.email": 'required|string|email|max:255',
        "addressDetails.*.mobile": 'required'
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const addressUpdateValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "id": "required",
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
export default {
    hasBusinessValidation,
    authorizedValidation,
    locationValidation,
    createBusinessValidation,
    updateBusinessValidation,
    settingValidation,
    verifyDocumentValidation,
    advertisementValidation,
    refrenceValidation,
    addressValidation,
    addressUpdateValidation
}