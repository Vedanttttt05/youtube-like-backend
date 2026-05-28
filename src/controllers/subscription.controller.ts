import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model"
import { Subscription } from "../models/subscription.model"
import  ApiError  from "../utils/apiError"
import apiResponse from "../utils/apiResponse"
import {asyncHandler} from "../utils/asyncHandler"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channel ID")
    }
    if (channelId.toString() === req.user._id.toString()) {
        throw new apiError(400, "You cannot subscribe to your own channel")
    }
    
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        // Unsubscribe
        await existingSubscription.deleteOne()
        return res.status(200).json(new apiResponse(200 , null , "Unsubscribed successfully"))
    }
    // Subscribe
    
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })
    return res.status(200).json(new apiResponse(200,null, "Subscribed successfully"))


    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
  {
    $match: {
      channel: new mongoose.Types.ObjectId(channelId)
    }
  },

  {
    $lookup: {
      from: "users",             
      localField: "subscriber",   
      foreignField: "_id",       
      as: "subscriber"
    }
  },

  {
    $unwind: "$subscriber"
  },

  {
    $project: {
      _id: 0,
      "subscriber._id": 1,
      "subscriber.username": 1,
      "subscriber.avatar": 1,
      "subscriber.createdAt": 1
    }
  }
])


    return res.status(200).json(new apiResponse(200, subscribers, "Subscribers fetched successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new apiError(400, "Invalid subscriber ID")
    }
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
            
        },
        {
    $lookup: {
      from: "users",             
      localField: "channel",   
      foreignField: "_id",       
      as: "subscribedChannel"
    }
    },
      {
    $unwind: "$subscribedChannel"
  },
   {
    $project: {
      _id: 0,
      "subscribedChannel._id": 1,
      "subscribedChannel.username": 1,
      "subscribedChannel.avatar": 1,
      "subscribedChannel.createdAt": 1
    }
  }


    ])
    return res.status(200).json(new apiResponse(200, subscriptions, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}