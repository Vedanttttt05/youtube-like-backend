import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model"
import {User} from "../models/user.model"
import ApiError from "../utils/apiError"
import ApiResponse  from "../utils/apiResponse"
import {asyncHandler} from "../utils/asyncHandler"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const userId = req.user._id

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    });
    return res
        .status(201)
        .json(new ApiResponse(true, "Tweet created successfully", tweet));


})

const getUserTweets = asyncHandler(async (req, res) => {

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
}
const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
    
return res
        .status(200)
        .json(new ApiResponse(true, "User tweets fetched successfully", tweets));

})


const updateTweet = asyncHandler(async (req, res) => {

    const { content } = req.body;
    const tweet = req.resource;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "tweet content cannot be empty");
    }

    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(true, "tweet updated successfully", tweet));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const tweet = req.resource;
    const  check = await tweet.deleteOne();
    if (!check) {
        throw new ApiError(500, "Failed to delete tweet");
    }
    return res
        .status(200)
        .json(new ApiResponse(true, "Tweet deleted successfully", null));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}