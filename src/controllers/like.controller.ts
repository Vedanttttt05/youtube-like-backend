
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model"
import ApiError from "../utils/apiError"
import ApiResponse from "../utils/apiResponse"
import {asyncHandler} from "../utils/asyncHandler"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()

        return res.status(200).json(
            new ApiResponse(
                200,
                { liked: false },
                "Video unliked successfully"
            )
        )
    }

    await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            { liked: true },
            "Video liked successfully"
        )
    )
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()

        return res
            .status(200)
            .json(new ApiResponse(200, { liked: false }, "Comment unliked"))
    }

        await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    
    return res
        .status(200)
        .json(new ApiResponse(200, { liked: true }, "Comment liked"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res
            .status(200)
            .json(new ApiResponse(200, { liked: false }, "Tweet unliked"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { liked: true }, "Tweet liked"))
})


const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos  = await Like.aggregate([
        {
             $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true } 
             }
        },
         {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        } , 
                { $unwind: "$video" }
    ])
      return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos.map(like => like.video),
                "Liked videos fetched successfully"
            )
        )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
