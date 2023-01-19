import { NextFunction, Request, Response } from "express"
import { AppStrings } from "../../utils/appStrings";
import commonUtils from "../../utils/commonUtils";

import validator from "../../utils/validate";

const eventValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule: any = {
        "name": "required|string",
        "description": "required|string|min:20",
        "address.longitude": "required|numeric|min:-180|max:180",
        "address.latitude": "required|numeric|min:-180|max:180",
        "visibility": "numeric|in:0,1",
        "status": "numeric|in:0,1",
        "startDate": "required|date_compare",
        "endDate": "required"
    }

    if (!req.body.image && !req.body.video) {
        return commonUtils.sendError(req, res, { error: AppStrings.PLEASE_UPLOAD_IMAGE })
    }

    // if (req.body.visibility == 0) {
    //     validationRule.inviteId = "required"
    // }
    if (req.body.reportStatus == 0) {
        validationRule.reportReason = "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const updateEventValidation = async (req: Request, res: Response, next: NextFunction) => {

    const validationRule: any = {
        "name": "required|string",
        "description": "required|string|min:20",
        "address.longitude": "required|numeric|min:-180|max:180",
        "address.latitude": "required|numeric|min:-180|max:180",
        "visibility": "required|numeric|in:0,1",
        "status": "numeric|in:0,1",
        "startDate": "required|date_compare",
        "endDate": "required",
        "startTime": "required",
        "endTime": "required"
    }
    // if (req.body.visibility == 0) {
    //     validationRule.inviteId = "required"
    // }
    if (req.body.reportStatus == 0) {
        validationRule.reportReason = "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const eventCancel = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "status": "required|in:2"
    }
    if (req.body.status == 2) {
        validationRule.cancelledReason = "required|string"
    }
    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const eventBlock = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "eventId": "required",
        "reason": "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const eventInvitation = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "eventId": "required",
        "invitedUserId": "required"
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

const eventInvitationAccept = async (req: Request, res: Response, next: NextFunction) => {
    const validationRule: any = {
        "status": "required|in:1,2",
    }

    validator.validatorUtilWithCallback(validationRule, {}, req, res, next);
}

export default {
    eventValidation,
    updateEventValidation,
    eventCancel,
    eventBlock,
    eventInvitation,
    eventInvitationAccept
}
