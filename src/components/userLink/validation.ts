import {NextFunction, Request, Response} from "express"
import validator from "../../utils/validate";
import commonUtils from "../../utils/commonUtils";
import {AdminRole, Device, Gender, ProviderType, UserData, UserType} from "../../utils/enum";
import {AppStrings} from "../../utils/appStrings";
import mongoose from "mongoose";

const syncContactValidation = async (req: Request, res: Response, next: NextFunction) => {

    const contacts = req.body.contacts
    const emails = req.body.emails

    const validationRule = {
        "contacts.*.name": "required|string",
        "emails.*.name": "required|string",
    }
    // "contacts.*.mobile": "required|different:contacts.*.mobile",

    const mobile:any = []
    const email:any = []
    
    contacts?.map((item: any) => {
        if(item.mobile)mobile.push(item.mobile)
    })
    emails?.map((item: any) => {
        if(item.email) email.push(item.email)
    })
    
    const uniqueMobile = [...new Set(mobile)];
    if (uniqueMobile.length !== mobile?.length) return commonUtils.sendError(req, res, {error: AppStrings.MOBILE_SHOULD_BE_UNIQUE})

    const uniqueEmail = [...new Set(email)];
    if (uniqueEmail.length !== email?.length) return commonUtils.sendError(req, res, {error: AppStrings.EMAIL_SHOULD_BE_UNIQUE})

    validator.validatorUtil(req.body, validationRule, {}, (err: any, success: any) => {
        if (err) {
            return commonUtils.sendError(req, res, {errors: commonUtils.formattedErrors(err)})
        }
        if (success) {
            next()
        }
    })
}

export default {
    syncContactValidation
}