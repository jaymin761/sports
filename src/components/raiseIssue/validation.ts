import { NextFunction, Request, Response } from "express"
import validator from "../../utils/validate";
import {  ReportToType } from "../../utils/enum";

const reportValidation = async (req: Request, res: Response, next: NextFunction) => {    
    const reportToType = Object.values(ReportToType).filter(value => typeof value === 'number');

    let ValidationRule: any = {
        "reportType": "numeric|in:" + reportToType.join(","),
        "subject": "required|string",
        "message": "string",
        "image": "string",
    }

    if (req.body.video) {
        ValidationRule = {
            ...ValidationRule,
            "video.url" : "required",
            "video.thumbnail" : "required"
        }
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

const subjectValidation = async (req: Request, res: Response, next: NextFunction) => {    
    const reportToType = Object.values(ReportToType).filter(value => typeof value === 'number');

    let ValidationRule: any = {
        "reportType": "numeric|in:" + reportToType.join(","),
        "subject": "required|string",        
    }

    validator.validatorUtilWithCallback(ValidationRule, {}, req, res, next);
}

export default {
    reportValidation,
    subjectValidation
}