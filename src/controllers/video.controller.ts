import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model"
import {User} from "../models/user.model"
import ApiError from "../utils/apiError"
import ApiResponse from "../utils/apiResponse"
import {asyncHandler} from "../utils/asyncHandler"
import {uploadToCloudinary} from "../utils/cloudinary"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    const pageNumber = Math.max(1, Number(page))
    const limitNumber = Math.max(Number(limit), 1)

    
    const sortField = sortBy || "createdAt"
    const sortOrder = sortType === "asc" ? 1 : -1

    const filter  = { isPublished: true }

    if (query) {
        filter.title = { $regex: query, $options: "i" }
    }

    if (userId && isValidObjectId(userId)) {
        filter.owner = userId
    }

    const videos = await Video.find(filter)
                   .populate("owner", "username avatar")
                   .sort({[sortBy] : sortType === "asc" ? 1 : -1})
                   .skip((pageNumber -1) * limitNumber)
                     .limit(limitNumber)
                    
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))


    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Video title is required")
    }
    const videoLocalPath = req.files?.videoFile?.[0]?.path
     const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

     if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

        const videoUpload = await uploadToCloudinary(videoLocalPath)
        const thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath)

        if (!videoUpload || !thumbnailUpload) {
            throw new ApiError(500, "Failed to upload video or thumbnail")
        }
    const newVideo = await Video.create({
        title: title,
        description: description || "",
        videoFile: videoUpload.secure_url,
        thumbnail: thumbnailUpload.secure_url,
        owner: req.user._id,
        isPublished: true,
        views : 0

    })

    return res.status(201).json(new ApiResponse(201, newVideo, "Video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId).populate("owner", "username avatar")
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

        if (
        !video.isPublished &&
        video.owner._id.toString() !== req.user?._id?.toString()
    ) {
        throw new ApiError(403, "This video is not published")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description  , thumbnail} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const thumbnailLocalPath = req.file?.path

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At least one field is required (title, description, or thumbnail)")
    }

    const video = await Video.findById(videoId)

    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }

    if (thumbnailLocalPath) {
        const thumbnail = await uploadToCloudinary(thumbnailLocalPath)
        if (!thumbnail.url) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        video.thumbnail = thumbnail.url
        
    }

    if (title) {
        video.title = title
    }
    if (description) {
        video.description = description
    }
    await video.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })
    const status = video.isPublished ? "published" : "unpublished"
    return res.status(200).json(new ApiResponse(200, video, `Video ${status} successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}