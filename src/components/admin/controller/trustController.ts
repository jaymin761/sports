import { AppStrings } from "../../../utils/appStrings";
const User = require("../../users/models/userModel");
const Trust = require("../models/trustModel");
import { NextFunction, query, Request, Response } from "express";
import commonUtils, { fileFilter, fileStoragePdf, fileFilterPdf, fileStorage } from "../../../utils/commonUtils";
import mongoose, { ObjectId } from "mongoose";

import trustController from "../../trust/trustController";
async function trust(req: Request, res: Response) {

    try {

        const {
            name,
            image,
            idNumber,
            reference,
            homeAddress,
            message,
            star
        } = req.body


        let combineValue = '' + image + idNumber + reference + homeAddress

        const trustCheckExitsOrNot = await Trust.findOne({ combine: combineValue })

        if (trustCheckExitsOrNot) {
            return commonUtils.sendError(req, res, { message: AppStrings.TRUST_ALREADY_EXITS }, 409);
        }

        let trust = new Trust()
        trust.name = name
        trust.image = image
        trust.idNumber = idNumber
        trust.reference = reference
        trust.homeAddress = homeAddress,
            trust.combine = combineValue,
            trust.star = star,
            trust.message = message,
            await trust.save()

        return commonUtils.sendSuccess(req, res, trust, 200)

    } catch (err) {
        console.log(err)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG }, 409);
    }
}
async function trustUpdate(req: Request, res: Response) {

    try {
        const {
            name,
            message,
            star
        } = req.body


        const trustCheckExitsOrNot = await Trust.findOne({
            _id: req.params.id
        })

        if (!trustCheckExitsOrNot) {
            return commonUtils.sendError(req, res, { message: AppStrings.TRUST_NOT_FOUND, }, 409);
        }

        const trust = await Trust.findById(req.params.id)
        trust.name = name || trustCheckExitsOrNot.name
        trust.star = star || trustCheckExitsOrNot.star
        trust.message = message || trustCheckExitsOrNot.message
        await trust.save()

        return commonUtils.sendSuccess(req, res, {}, 200)

    } catch (err) {
        console.log(err)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG }, 409);
    }
}
async function trustList(req: Request, res: Response) {

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const search:any = req.query.search;
    let filter: any = {};
   

    var total_ = await Trust.countDocuments();
   
    if (search) {
        filter = {
            $or:[{
                name: { $regex: `${search}`, $options: "i" },
            },{
                star:parseInt(search) ,
            }]
        };
      }
      console.log(filter);
      
    const trust = await Trust.aggregate([
        {
            $match:filter
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: page,
                            limit: limit_,
                            total: total_,
                            hasMoreData: total_ > page * limit_ ? true : false,
                        },
                    },
                ],
                data: [{ $skip: skip_ }, { $limit: limit_ },
                {
                    $project: {
                        _id: 0,
                        "id": '$_id',
                        "name": 1,
                        "star": 1,
                        "isActive": 1,
                        "image": 1,
                        "idNumber": 1,
                        "reference": 1,
                        "homeAddress": 1,
                        "message": 1,
                    }
                }]
            }
        },
    ])
    return commonUtils.sendSuccess(req, res, trust, 200)

}

async function userTrustUpdate(req: Request, res: Response) {

    try {

        const userData = await User.findOne({
            _id: new mongoose.Types.ObjectId(req.params.id)
        })

        if (!userData) {
            return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND, }, 409);
        }


        let trustLevel = {
            image: req.body.image || userData.trustLevel.image,
            id: req.body.idNumber || userData.trustLevel.idNumber,
            reference: req.body.reference || userData.trustLevel.reference,
            address: req.body.homeAddress || userData.trustLevel.homeAddress,
        }

        userData.trustLevel = trustLevel
        await userData.save()
        await trustController.updateAvgTrustLevel(userData._id) // FOR TEST PURPOSE
        return commonUtils.sendSuccess(req, res, {}, 200)

    } catch (err) {
        console.log(err)
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG }, 409);
    }
}

export default {

    trust,
    trustUpdate,
    trustList,
    userTrustUpdate
};