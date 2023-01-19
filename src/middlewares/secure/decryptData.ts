import commonUtils from "../../utils/commonUtils";

const config = require("config")
import {NextFunction, Request, Response} from "express"
import {AppStrings} from "../../utils/appStrings";
import multer, {FileFilterCallback, MulterError} from 'multer'

const crypto = require("crypto");

const API_KEY_DEC = config.get("API_KEY_DEC")
const API_DECRYPT_IV_KEY = config.get("API_DECRYPT_IV_KEY")

async function DecryptedDataResponse(req: Request, res: Response, next: NextFunction) {
    try {
        const decipher = await crypto.createDecipheriv("aes-256-cbc", API_KEY_DEC, API_DECRYPT_IV_KEY);

        if (req.body && req.body.value && req.body.value !== "") {
            let encryptedData = req.body.value;
            let decryptedData = decipher.update(encryptedData, "base64", "utf-8");
            decryptedData += decipher.final("utf-8");
            req.body = JSON.parse(decryptedData);
            next();
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.DECRYPT_DATA_IS_REQUIRED}, 400);
        }
    } catch (e) {
        return commonUtils.sendError(req, res, {
            "message": e
        })
    }
}

async function DecryptData(req: Request, res: Response, next: NextFunction) {
    if (req.method === "GET") return next()

    if (req.headers.env && req.headers.env === "test") {
        next();
    } else {
        return DecryptedDataResponse(req, res, next);
    }
}

async function DecryptedDataRequest(req: Request, res: Response, next: NextFunction) {
    const API_KEY_DEC = req.query.API_KEY_DEC as string
    const API_DECRYPT_IV_KEY = req.query.API_DECRYPT_IV_KEY as string

    if (!API_KEY_DEC || !API_DECRYPT_IV_KEY) {
        return res.status(400).send({
            message: "API_KEY_DEC and API_DECRYPT_IV_KEY are required"
        })
    }

    try {
        const decipher = await crypto.createDecipheriv("aes-256-cbc", API_KEY_DEC.trim(), API_DECRYPT_IV_KEY.trim());
        if (req.body && req.body.value && req.body.value !== "") {
            let encryptedData = req.body.value;

            let decryptedData = decipher.update(encryptedData, "base64", "utf-8");
            decryptedData += decipher.final("utf-8");
            const data = JSON.parse(decryptedData);
            return commonUtils.sendSuccess(req, res, data);
        } else {
            return commonUtils.sendError(req, res, {message: AppStrings.INVALID_REQUEST}, 400);
        }
    } catch (e) {
        return commonUtils.sendError(req, res, {
            "message": e
        })
    }

}

export default {
    DecryptedData: DecryptData,
    DecryptedDataRequest: DecryptedDataRequest
}