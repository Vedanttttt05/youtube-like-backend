import {Comment} from "../models/comment.model"
import ApiError from "../utils/apiError"
import ApiResponse from "../utils/apiResponse"
import {asyncHandler} from "../utils/asyncHandler"

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })   // latest first
        .skip(skip)
        .limit(Number(limit));

    return res
        .status(200)
        .json(new ApiResponse(true, "Comments fetched successfully", comments));


})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Comment added successfully", comment));
});


const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const comment = req.resource;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(true, "Comment updated successfully", comment));
});



const deleteComment = asyncHandler(async (req, res) => {
    const comment = req.resource;

    await comment.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(true, "Comment deleted successfully", null));
});


export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }