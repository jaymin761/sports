import { AppStrings } from "../../utils/appStrings";

import { NextFunction, Request, Response } from "express";

import commonUtils from "../../utils/commonUtils";
import mongoose from "mongoose";
import path from "path";
const MobileDetect = require('mobile-detect')
const User = require('../users/models/userModel')
const Post = require('../socials/models/post')
const Like = require('../socials/models/like')
const Comment = require('../socials/models/comment')
const postReports = require('../socials/models/report')
const ejs = require('ejs')

const createSocialMedia = async (req: Request, res: Response) => {
    try {
        const userId = req.headers.userid;

        let user = await User.findById(userId);
        if (!user) return commonUtils.sendError(req, res, { message: AppStrings.USER_NOT_FOUND }, 409);

        const socialMedia = new Post({
            userId: userId,
            visibility: req.body.visibility,
            description: req.body.description,
            image: req.body.image,
            video: req.body.video,
            thumbnail: req.body.thumbnail,
            address: {
                name: req.body?.name,
                location: {
                    type: "Point",
                    coordinates: [req.body?.longitude, req.body?.latitude]
                },
            }
        })

        await socialMedia.save()
        return commonUtils.sendSuccess(req, res, { _id: socialMedia._id })

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const listSocialMedia = async (req: Request, res: Response) => {
    let lat = parseFloat(req.query.lat as string);
    let long = parseFloat(req.query.long as string);
    const minRange = parseInt(req.query.minRange as string) || 0;
    const maxRange = parseInt(req.query.maxRange as string) || 1000;
    const userId: any = req.query.userId
    const loginUserId: any = req.headers.userid
    let lastId = req.query.lastId as string

    let filter: any = { isDelete: 0 };
    try {
        if (userId) {
            filter = {
                ...filter,
                userId: new mongoose.Types.ObjectId(userId)
            }
        }
        if (req.query.visibility) {
            filter = {
                ...filter,
                visibility: req.query.visibility === 'true' ? 1 : 0
            }
        }

        if (lastId) {
            filter = {
                ...filter,
                // @ts-ignore
                _id: {
                    $lt: new mongoose.Types.ObjectId(lastId)
                }
            }
        }
        const pipeline = [
            {
                $match: {
                    $and: [filter]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $limit: 10
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
                $lookup: {
                    from: "likes",
                    let: { postId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$postId", "$$postId"] },
                                        { $eq: ["$userId", new mongoose.Types.ObjectId(loginUserId)] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "isLike"
                },
            },
            { $unwind: { path: "$isLike", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    userId: "$userId",
                    userName: "$userData.fullName",
                    userImage: "$userData.image.profilePic",
                    image: "$image",
                    video: "$video",
                    thumbnail: "$thumbnail",
                    description: "$description",
                    address: "$address",
                    visibility: "$visibility",
                    isBlockPost: "$isBlockPost",
                    isDelete: "$isDelete",
                    createdAt: "$createdAt",
                    isLike: { $cond: { if: "$isLike", then: 1, else: 0 } },
                    totalLikes: { $size: "$totalLikes" },
                    totalComments: { $size: "$totalComments" },
                    distance: { $round: ["$distance", 2] },
                }
            },
        ]

        if (lat && long) {
            const geoNear = {
                near: {
                    type: "Point",
                    coordinates: [long, lat]
                },
                key: "address.location",
                distanceField: "distance",
                spherical: true,
                maxDistance: maxRange,
                minDistance: minRange
            }
            //@ts-ignore
            pipeline.unshift({ $geoNear: geoNear });
            console.log(geoNear)
        }

        let socialMedia = await Post.aggregate(pipeline)

        return commonUtils.sendSuccess(req, res, socialMedia)

    } catch (e) {
        console.log(e)
        return commonUtils.sendError(req, res, {
            message: AppStrings.SOMETHING_WENT_WRONG
        })
    }
}

const postLike = async (req: Request, res: Response) => {

    const userId = req.headers.userid;
    const {
        postId,
    } = req.body

    try {
        var like = await Like.findOne({
            postId: postId,
            userId: userId
        })

        var post = await Post.findOne({
            _id: postId
        })

        if (!post) {
            return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })
        }

        if (like) {
            await Like.deleteOne({
                postId: postId,
                userId: userId
            })
            const likeCount = await Like.find({ postId }).count()
            return commonUtils.sendSuccess(req, res, { message: AppStrings.UNLIKE_SUCCESSFULLY, isLike: 0, likeCount }, 200);
        }
        const like_ = await new Like({
            postId: postId,
            userId: userId
        });

        await like_.save();
        const likeCount = await Like.find({ postId }).count()
        return commonUtils.sendSuccess(req, res, { message: AppStrings.LIKE_SUCCESSFULLY, isLike: 1, likeCount }, 200);
    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }
}

const postComment = async (req: Request, res: Response) => {

    const userId = req.headers.userid;
    try {
        var post = await Post.findOne({
            _id: req.body.postId
        })

        if (!post) {
            return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })
        }

        const comment = await new Comment({
            userId: userId,
            postId: req.body.postId,
            comment: req.body.comment
        });

        await comment.save();

        const commentCount = await Comment.find({ postId: req.body.postId }).count()
        return commonUtils.sendSuccess(req, res, { message: AppStrings.COMMENT_SUCCESSFULLY, commentCount }, 200);

    } catch (error) {
        console.log(error);
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG })
    }

}

const postReport = async (req: Request, res: Response) => {

    let userId = req.headers.userid

    let posts = await postReports.findOne({
        reportUserId: userId,
        postId: req.body.postId
    })

    if (posts)
        return commonUtils.sendError(req, res, { message: AppStrings.ALREADT_REQUEST_POST })

    const postReport = await new postReports({
        postId: req.body.postId,
        reportUserId: userId,
        reason: req.body.reason,
    })

    await postReport.save()

    return commonUtils.sendSuccess(req, res, postReport)
}

const postUpdate = async (req: Request, res: Response) => {

    let postId = req.params.id
    let userId: any = req.headers.userid

    let post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId) })

    if (!post)
        return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })

    try {
        post.visibility = req.body.visibility || post.visibility;
        post.description = req.body.description || post.description;
        post.image = req.body.image || post.image;
        post.video = req.body.video || post.video;
        post.thumbnail = req.body.thumbnail || post.thumbnail;
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

    let userId: any = req.headers.userid

    let postId = req.params.id

    let post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId), userId: new mongoose.Types.ObjectId(userId), isDelete: 0 })

    if (!post)
        return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })

    post.isDelete = post.isDelete == 0 ? 1 : 0

    await post.save();

    return commonUtils.sendSuccess(req, res, { message: AppStrings.POST_DELETE })

}

const commentList = async (req: Request, res: Response) => {
    try {
        let postId = req.params.id
        let lastId = req.query.lastId as string

        let post = await Post.findById(postId)

        if (!post) {
            return commonUtils.sendError(req, res, { message: AppStrings.POST_NOT_FOUND })
        }

        let andFilter = { postId: new mongoose.Types.ObjectId(postId) }

        if (lastId) {
            andFilter = {
                ...andFilter,
                // @ts-ignore
                _id: {
                    $lt: new mongoose.Types.ObjectId(lastId)
                }
            }
        }

        const pipeline = [
            { $sort: { createdAt: -1 } },
            {
                $match: {
                    $and: [andFilter]
                }
            },
            {
                $limit: 10
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
            }
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

const sharePost = async (req: Request, res: Response) => {

    let md = new MobileDetect(req.headers['user-agent']);
    const url_path = path.join(__dirname, '/views/share.ejs')    

    try {
       res.render(url_path, { isiOS: md.is('iPhone'), postId: req.query.id });

    } catch (error: any) {
        console.log(error.message);
        
        return commonUtils.sendError(req, res, { message: AppStrings.SOMETHING_WENT_WRONG }, 422);
    }
}

export default {
    createSocialMedia,
    listSocialMedia,
    postLike,
    postComment,
    postReport,
    postUpdate,
    postDelete,
    commentList,
    sharePost
}