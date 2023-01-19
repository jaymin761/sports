import { AppStrings } from "../../../utils/appStrings";

const Post = require("../../socials/models/post");
const User = require("../../users/models/userModel");
const Comment = require("../../socials/models/comment");
const postReports = require("../../socials/models/report");
import { Request, Response } from "express";
import commonUtils, { fileFilter, fileStorage } from "../../../utils/commonUtils";
import mongoose, { ObjectId } from "mongoose";
import moment from "moment";
import { AppConstants } from "../../../utils/appConstants";

const allPostList = async (req: Request, res: Response) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await Post.find({ isDelete: 0 }).countDocuments();

    try {
        const pipeline = [
            {
                $match: { isDelete: 0 }
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'totalLikes'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'totalComments'
                }
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
                    data: [
                        { $skip: skip_ },
                        { $limit: limit_ },
                        {
                            $project: {
                                _id: 1,
                                userId: "$userId",
                                userName: "$userData.fullName",
                                userImage: "$userData.image.profilePic",
                                image: "$image",
                                video: "$video",
                                description: "$description",
                                address: "$address",
                                visibility: "$visibility",
                                isBlockPost: "$isBlockPost",
                                isDelete: "$isDelete",
                                createdAt: "$createdAt",
                                totalLikes: { $size: "$totalLikes" },
                                totalComments: { $size: "$totalComments" },
                            },
                        },
                    ],
                },
            },
        ]

        let socialMedia = await Post.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, socialMedia)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const postList = async (req: Request, res: Response) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await Post.countDocuments();

    let userId = req.params.id

    let user = await User.findById(userId)

    if (!user)
        return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND })

    try {

        const pipeline = [
            {
                $match: { userId: new mongoose.Types.ObjectId(userId), isDelete: 0 }
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'totalLikes'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'totalComments'
                }
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
                    data: [
                        { $skip: skip_ },
                        { $limit: limit_ },
                        {
                            $project: {
                                _id: 1,
                                userId: "$userId",
                                userName: "$userData.fullName",
                                userImage: "$userData.image.profilePic",
                                image: "$image",
                                video: "$video",
                                description: "$description",
                                address: "$address",
                                visibility: "$visibility",
                                isBlockPost: "$isBlockPost",
                                isDelete: "$isDelete",
                                createdAt: "$createdAt",
                                totalLikes: { $size: "$totalLikes" },
                                totalComments: { $size: "$totalComments" },
                            },
                        },
                    ],
                },
            },
        ]

        let socialMedia = await Post.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, socialMedia)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }

}

const commentList = async (req: Request, res: Response) => {

    let postId = req.params.id

    let post = await Post.findById(postId)

    if (!post) {
        return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit_ = parseInt(req.query.limit as string) || 5;
    const skip_ = (page - 1) * limit_;
    const total_ = await Comment.countDocuments();

    try {
        const pipeline = [
            { $sort: { createdAt: -1 } },
            {
                $match: { postId: new mongoose.Types.ObjectId(postId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
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
                    data: [
                        { $skip: skip_ },
                        { $limit: limit_ },
                        {
                            $project: {
                                _id: 1,
                                userId: "$userId",
                                userName: "$userData.fullName",
                                userImage: "$userData.image.profilePic",
                                postId: "$postId",
                                comment: "$comment",
                                isDeleteAdmin: "$isDeleteAdmin",
                                createdAt: "$createdAt",
                            },
                        },
                    ],
                },
            },
        ]

        let comment = await Comment.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, comment)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const removeComment = async (req: Request, res: Response) => {

    try {

        let postId = req.body.postId
        let commentId = req.body.commentId

        let comment = await Comment.findOne({ _id: commentId, postId: postId })

        if (!comment)
            return commonUtils.sendError(req, res, { message: AppStrings.COMMENT_NOT_FOUND })

        comment.isDeleteAdmin = comment.isDeleteAdmin == 0 ? 1 : 0;

        await comment.save();

        return commonUtils.sendSuccess(req, res, { message: AppStrings.COMMENT_REMOVED })
    } catch (error) {
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const postReportList = async (req: Request, res: Response) => {

    let postId = req.params.id

    const pipeline = [
        { $match: { postId: new mongoose.Types.ObjectId(postId) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'reportUserId',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                userId: "$reportUserId",
                userName: "$userData.fullName",
                postId: "$postId",
                reason: "$reason",
                status: "$status",
                createdAt: "$createdAt",
            }
        },
    ];

    let post = await postReports.aggregate(pipeline)

    return commonUtils.sendSuccess(req, res, post)
}

const updatePostStatus = async (req: Request, res: Response) => {
    let postId = req.params.id;

    const post = await Post.findById({ _id: postId });
    if (post) {
        post.isBlockPost = post.isBlockPost ? 0 : 1
        await post.save()

        let blockPost = await postReports.find().sort({ createdAt: -1 });
        blockPost.forEach(async (data: any) => {
            if (postId == data.postId) {
                data.status = post.isBlockPost
                await data.save()
            }
        })
        let mes = '';
        post.isBlockPost == 0 ? mes = 'disable' : mes = 'enable';
        return commonUtils.sendSuccess(req, res, { message: "Post " + mes + " successfully." })
    } else {
        return commonUtils.sendError(req, res, { message: AppStrings.EVENT_NOT_FOUND })
    }
}

const postUpdate = async (req: Request, res: Response) => {

    let postId = req.params.id
    let userId: any = req.body.userId

    let post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId) })

    if (!post)
        return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })

    try {
        post.visibility = req.body.visibility || post.visibility;
        post.description = req.body.description || post.description;
        post.image = req.body.image || post.image;
        post.video = req.body.video || post.video;
        post.address.name = req.body?.name || post.address.name,
            post.address.location = {
                type: "Point",
                coordinates: (req.body.longitude && req.body.latitude) ? [req.body.longitude, req.body.latitude] : post.coordinates,
            }

        await post.save();

        return commonUtils.sendSuccess(req, res, { message: AppStrings.POST_UPDATED })
    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const postDelete = async (req: Request, res: Response) => {

    let userId: any = req.body.userId

    let postId = req.params.id

    let post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId), isDelete: 0 })

    if (!post)
        return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })

    post.isDelete = post.isDelete == 0 ? 1 : 0

    await post.save();

    return commonUtils.sendSuccess(req, res, { message: AppStrings.POST_DELETE })

}

export default {
    allPostList,
    postList,
    commentList,
    removeComment,
    postReportList,
    updatePostStatus,
    postUpdate,
    postDelete
}