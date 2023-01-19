import { NextFunction, Request, Response } from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import { AdminRole, SocialsTypeVisibility } from "../../utils/enum";
import { AppStrings } from "../../utils/appStrings";
import { AppConstants } from "../../utils/appConstants";
import mongoose from "mongoose";
const Admin = require('./models/admin');

const adminRoles = Object.values(AdminRole).filter(value => typeof value === 'number');

async function adminregisterValidation(req: Request, res: Response, next: NextFunction) {

    const validationRule = {
        "username": `required|string|exist:${AppConstants.MODEL_ADMIN},username`,
        "email": `required|string|min:4|max:255|exist:${AppConstants.MODEL_ADMIN},email`,
        "mobile": `required|min:10|exist:${AppConstants.MODEL_ADMIN},mobile`,
        "password": "required|min:4|max:50",
        "adminrole": "required"
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function adminUpdateValidation(req: Request, res: Response, next: NextFunction) {
    const role = req.headers.adminrole as string
    const userId = req.headers.userid as string

    console.log(role, userId);

    // let adminRole_ =  parseInt(role) !== AdminRole.SUPER_ADMIN ? adminRoles.filter(role => role !== AdminRole.SUPER_ADMIN) : adminRoles

    // console.log(adminRole_);

    const validationRule = {
        "username": `required|string|exist_value:${AppConstants.MODEL_ADMIN},username,${req.body.admin_id}`,
        "email": `required|string|min:4|max:255|exist_value:${AppConstants.MODEL_ADMIN},email,${req.body.admin_id}`,
        "adminrole": "required",
        "mobile": `required|min:10|exist_value:${AppConstants.MODEL_ADMIN},mobile,${req.body.admin_id}`,
        "admin_id": "required|string|validObjectId",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function loginValidation(req: Request, res: Response, next: NextFunction) {
    const adminroles = [AdminRole.SUPER_ADMIN];

    const validationRule = {
        "email": "required",
        "password": "required|min:4|max:50",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function changePasswordValidation(req: any, res: any, next: NextFunction) {
    const validationRule = {
        "admin_id": "required|string|validObjectId",
        "old_password": "required",
        "new_password": "required|min:4|max:50|different:old_password",
    }

    validator.validatorUtilWithCallback(validationRule, { "different.new_password": "New password and old Password must be diffrent" }, req, res, next);
}


const hasAdminValidation = async (req: Request, res: Response, next: NextFunction) => {
    const adminId = req.headers.adminid as string;
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId))
        return commonUtils.sendAdminError(req, res, { message: AppStrings.ADMINID_MISSING }, 404);

    const admin = await Admin.findById(adminId);
    if (!admin) return commonUtils.sendAdminError(req, res, { message: AppStrings.ADMIN_NOT_FOUND }, 409);

    next();
}

async function JobCategoryValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "title": `required|string|exist:${AppConstants.MODEL_JOBS_CATEGORY},title`,
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function setJobCategoryValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "category_id": "required|string|validObjectId",
        "title": `required|string|exist_value:${AppConstants.MODEL_JOBS_CATEGORY},title,${req.body.category_id}`,
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}


async function jobCancelValidation(req: Request, res: Response, next: NextFunction) {

    const validationRule = {
        "reason_id": "required|string|validObjectId",
        "reason": `required|string|exist_value:${AppConstants.MODEL_JOB_CANCEL},reason,${req.body.reason_id}`,
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function referalValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "user_id": "required|string|validObjectId",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function balanceValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "user_id": "required|string|validObjectId",
        "provider_id": "required|string|validObjectId",
        "referal_code": "required|string",
        "amount": "required|numeric",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function loginAccessValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "admin_id": "required|string|validObjectId",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers.userid as string;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        return commonUtils.sendAdminError(req, res, { message: AppStrings.ADMINID_MISSING }, 404);

    const admin = await Admin.findById(userId);
    if (!admin) return commonUtils.sendAdminError(req, res, { message: AppStrings.ADMIN_NOT_FOUND }, 409);

    if (parseInt(admin.adminrole) !== AdminRole.SUPER_ADMIN) {
        return commonUtils.sendAdminError(req, res, { message: AppStrings.NOT_AUTHORIZED }, 409);
    }
    next();
}

async function disputeValidation(req: Request, res: Response, next: NextFunction) {
    const validationRule = {
        "dispute_id": "required|string|validObjectId",
        "disputeStatus": `required|string`,
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function categoryValidation(req: Request, res: Response, next: NextFunction) {

    if (req.body.parentId) {

        const validationRule = {
            "name": `required|string|exist_value:${AppConstants.MODEL_CATEGORY},name,${req.body.parentId}`,
        }
        validator.validatorUtilWithCallback(validationRule, {}, req, res, next);

    } else {

        const validationRule = {
            "name": `required|string`,
        }
        validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
    }
}
async function categoryUpdateValidation(req: Request, res: Response, next: NextFunction) {

    const validationRule = {
        "name": `required|string|exist_value:${AppConstants.MODEL_CATEGORY},name,${req.params.id}`,
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function userIdVerifyValidation(req: Request, res: Response, next: NextFunction) {

    const validationRule = {
        "userId": "required|string|validObjectId",
        "status": "required|in:1,2",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function userUpdate(req: Request, res: Response, next: NextFunction) {

    const userId = req.body.user_id;
    const validationRule: any = {
        "user_id": "required|string|validObjectId",
        "bio": "required|string",
        "userStatus": "required|string",
        "fullName": "required|string",
        "userName": `required|string|exist_value:User,userName,${userId}`,
        "secondary": `valid_phone|different:mobile|different:alternative|exist_value:User,mobile,${userId}|exist_value:User,optionalMobile.secondary,${userId}|exist_value:User,optionalMobile.alternative,${userId}`,
        "alternative": `valid_phone|different:mobile|different:secondary|exist_value:User,mobile,${userId}|exist_value:User,optionalMobile.secondary,${userId}|exist_value:User,optionalMobile.alternative,${userId}`,
        "address": "required",
        "address.name": "required",
        "address.longitude": "required|numeric|min:-180|max:180",
        "address.latitude": "required|numeric|min:-180|max:180",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function userValidation(req: Request, res: Response, next: NextFunction) {

    const userId = req.body.user_id;

    const validationRule: any = {
        "user_id": "required|string|validObjectId",
        "bio": "required|string",
        "secondary": `valid_phone|different:mobile|different:alternative|exist_value:User,mobile,${userId}|exist_value:User,optionalMobile.secondary,${userId}|exist_value:User,optionalMobile.alternative,${userId}`,
        "alternative": `valid_phone|different:mobile|different:secondary|exist_value:User,mobile,${userId}|exist_value:User,optionalMobile.secondary,${userId}|exist_value:User,optionalMobile.alternative,${userId}`,
        "homeAddress": "required",
        "homeAddress.name": "required",
        "homeAddress.longitude": "required|numeric|min:-180|max:180",
        "homeAddress.latitude": "required|numeric|min:-180|max:180",
        "reference": "required",
        "reference.*.name": "required|string",
        "reference.*.email": "required|email|different:reference.*.email",
        "reference.*.mobile": "required|different:reference.*.mobile",
    }

    if (req.body.reference) {

        const uniqueMobile = [...new Set(req.body.reference.map((item: any) => item.mobile))];

        if (uniqueMobile.length !== req.body.reference.length) return commonUtils.sendError(req, res, { error: AppStrings.MOBILE_SHOULD_BE_UNIQUE })

        const uniqueEmail = [...new Set(req.body.reference.map((item: any) => item.email))];
        if (uniqueEmail.length !== req.body.reference.length) return commonUtils.sendError(req, res, { error: AppStrings.EMAIL_SHOULD_BE_UNIQUE })
    }

    // validator.validatorUtil({},validationRule,{}, (err:any,success:any) => {
    //     if(err){
    //         return commonUtils.sendError(req, res, {errors: commonUtils.formattedErrors(err)})
    //     }
    //     if(success){
    //        next()
    //     }
    // })

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function trustValidation(req: Request, res: Response, next: NextFunction) {


    let validationRule: any = {
        "name": "required|string",
        "image": "required",
        "idNumber": "required",
        "reference": "required",
        "homeAddress": "required",
        "message": "required|string",
        "star": "between:0,5",
    }


    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}
async function roleValidation(req: Request, res: Response, next: NextFunction) {

    let validationRule: any = {
        "name": "required|string|exist:Role,name",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function trustUpdateValidation(req: Request, res: Response, next: NextFunction) {

    let validationRule: any = {
        "name": "required|string",
        "message": "required|string",
        "star": "between:0,5",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);

}
async function trustUserValidation(req: Request, res: Response, next: NextFunction) {

    let validationRule: any = {
        "image": "between:1,3",
        "idNumber": "between:1,3",
        "reference": "between:1,3",
        "homeAddress": "between:1,3",
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);

}

async function requestApprove(req: Request, res: Response, next: NextFunction) {
    let validationRule: any = {
        "status": "required|in:1,2"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

async function setting(req: any, res: any, next: NextFunction) {
    if (req.headers.userid === undefined)
        return commonUtils.sendError(req, res, { message: AppStrings.USERID_MISSING }, 409);

    const validationRule = {
        "old_password": "min:4",
        "new_password": "min:4|different:old_password",
        "email": `string|exist_value:Admin,email,${req.headers.userid}`,
        "username": `string|exist_value:Admin,username,${req.headers.userid}`,
        "mobile": `valid_phone|exist_value:Admin,mobile,${req.headers.userid}`,
    }
    if (req.body.new_password) {
        validationRule.old_password = "required"
    }
    if (req.body.old_password) {
        validationRule.new_password = "required|different:old_password"
    }

    validator.validatorUtilWithCallback(validationRule, { "different.new_password": "New password and old Password must be diffrent" }, req, res, next);
}

async function businessRequestApprove(req: Request, res: Response, next: NextFunction) {
    let validationRule: any = {
        "isApprove": "required|in:1,2"
    }

    if(req.body.isApprove == 2){
        validationRule.rejectReason = "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const addressValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "businessId": "required",
        "userId": "required",
        "businessName": "required|string",
        "businessLocationName": "required|string",
        "physicalAddress": "required|string",
        "longitude": "required|numeric|min:-180|max:180",
        "latitude": "required|numeric|min:-90|max:90",
        "description": 'required',
        "email": 'required|string|email|max:255',
        "mobile": 'required'
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const addressUpdateValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "id": "required",
        "businessId": "required",
        "userId": "required",
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const mulAddressValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "userId": "required",
        "businessId": "required",
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


const documentApproveValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule = {
        "result": "required|in:1,0",
        "userId": "required",
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const socialMediaAddValidation = async (req: Request, res: Response, next: NextFunction) => {

    const visiblity = [SocialsTypeVisibility.PUBLIC, SocialsTypeVisibility.PRIVATE];

    const ValidationRule: any = {
        "userId": "required",
        "visibility": "numeric|in:" + visiblity.join(","),
        "description": "required",
        "image": "string",
        "video": "string",
        "name": "required",
        "longitude": "required",
        "latitude": "required"
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const PostDeleteValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "userId": "required"
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const ChatCategoryValidation = async (req: Request, res: Response, next: NextFunction) => {

    const ValidationRule: any = {
        "parentId": "required",
        "name": `required|string|exist_value:${AppConstants.MODEL_CHAT_CATEGORY},name,${req.body.parentId}`,
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

export default {
    loginAccessValidation,
    adminregisterValidation,
    adminUpdateValidation,
    changePasswordValidation,
    loginValidation,
    hasAdminValidation,
    JobCategoryValidation,
    setJobCategoryValidation,
    jobCancelValidation,
    referalValidation,
    balanceValidation,
    isSuperAdmin,
    disputeValidation,
    categoryValidation,
    categoryUpdateValidation,
    userIdVerifyValidation,
    userUpdate,
    userValidation,
    trustValidation,
    trustUpdateValidation,
    trustUserValidation,
    requestApprove,
    roleValidation,
    setting,
    businessRequestApprove,
    addressValidation,
    addressUpdateValidation,
    documentApproveValidation,
    mulAddressValidation,
    socialMediaAddValidation,
    PostDeleteValidation,
    ChatCategoryValidation,
}