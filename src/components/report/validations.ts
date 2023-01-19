import {NextFunction, Request, Response} from "express";
import validator from "../../utils/validate";

const reportValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule: any = {
        "reportId": "required",
        "reportType": "required|numeric|in:0,1,2",
        "reportReason": "required|string"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next)
}

export default {
    reportValidation
}
