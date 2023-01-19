import { AppStrings } from "../../../utils/appStrings";
const Category = require("../models/category");
import { NextFunction, query, Request, Response } from "express";
import commonUtils, { fileFilter, fileStorage } from "../../../utils/commonUtils";
import mongoose from "mongoose";

async function category(req: Request, res: Response) {

    const {
        name,
        parentId,
        image,
    } = req.body

    if (!parentId) {
        let checkExitsOrNot = await Category.findOne({
            parentId: null,
            name
        })
        if (checkExitsOrNot) {
            return commonUtils.sendAdminError(req, res, { message: AppStrings.CATEGORY_ALREADY_EXITS }, 409)
        }
    }

    var category = new Category({
        name,
        parentId,
        image,
    })
    await category.save()

    return commonUtils.sendAdminSuccess(req, res, category);
}
async function categoryList(req: Request, res: Response) {

    var data = await Category.find({
        parentId: null,
    }).sort({ createdAt: -1 });

    return commonUtils.sendAdminSuccess(req, res, data);
}

// TODO: Parant category and child Category both list 
async function getCategory(req: Request, res: Response) {
    try {
        let search = req.query.search as string
        search = search.toLowerCase()
        const page = parseInt(req.query.page as string) || 1;
        const limit_ = parseInt(req.query.limit as string) || 50;
        const skip_ = (page - 1) * limit_;

        let fillter: any = {
            parentId: null,
        }
        const pipeline: any = [
            {
                $match: fillter
            },
            {
                $graphLookup: {
                    from: "categories",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "parentId",
                    as: "child",
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$name",
                    image: "$image",
                    'child': {
                        $map: {
                            input: '$child',
                            as: 'childs',
                            in: {
                                "id": "$$childs._id",
                                "name": "$$childs.name"
                            }
                        },
                    },
                    id: "$_id",
                }
            }
        ]

        let category = await Category.aggregate(pipeline)
        if (category.length && search) {
            category = category.filter((i: any) => {
                return i?.name.toLowerCase().includes(search) || i.child.map((j: any) => j.name.toLowerCase().includes(search)).includes(true)
            })
        }

        var total = await Category.find(fillter).countDocuments();

        const hasMoreData = total > skip_ + limit_;

        const metaData = {
            page: page,
            limit: limit_,
            total: total,
            hasMoreData: hasMoreData,
        };

        return commonUtils.sendAdminSuccess(req, res, [{ metadata: [metaData], data: category.slice(skip_, skip_ + limit_) }]);
    } catch (er: any) {
        return commonUtils.sendAdminError(req, res, { error: AppStrings.SOMETHING_WENT_WRONG });
    }
}
async function getSubCategory(req: Request, res: Response) {

    let subCategory = await Category.aggregate([
        {
            $match: {
                parentId: { $ne: null }
            },
        }, {
            $graphLookup: {
                from: "categories",
                startWith: "$parentId",
                connectFromField: "parentId",
                connectToField: "_id",
                as: "parent"
            }
        },
        { $unwind: '$parent' },
        {
            $project: {
                _id: 1,
                name: 1,
                isActive: 1,
                'parent._id': 1,
                'parent.name': 1
            }
        }
    ])
    return commonUtils.sendAdminSuccess(req, res, subCategory);
}

async function deleteCategory(req: Request, res: Response) {
    let categoryId = req.params.id;

    await Category.deleteMany({ parentId: categoryId })

    await Category.findByIdAndDelete(categoryId)
    return commonUtils.sendAdminSuccess(req, res, {});
}
async function deleteSubCategory(req: Request, res: Response) {
    let categoryId = req.params.id;

    await Category.findByIdAndDelete(categoryId)

    return commonUtils.sendAdminSuccess(req, res, {});
}
async function categoryUpdate(req: Request, res: Response) {

    let categoryId = req.params.id;
    let name = req.body.name;

    await Category.findByIdAndUpdate(categoryId, { name: name })

    return commonUtils.sendAdminSuccess(req, res, {});
}

export default {
    category,
    getCategory,
    getSubCategory,
    categoryList,
    deleteCategory,
    deleteSubCategory,
    categoryUpdate
};