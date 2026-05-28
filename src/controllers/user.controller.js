import {asyncHandler} from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import  apiResponse  from '../utils/apiResponse.js';
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async(user) => {
  try {
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});

    return { accessToken, refreshToken };
    
  } catch (error) {
    throw new apiError(500, "Error generating tokens");
    
  }

}

const registerUser = asyncHandler(async (req, res ) => {

    let { fullName, email, username, password } = req.body
  fullName = fullName?.trim();
  email = email?.trim()?.toLowerCase();
  username = username?.trim()?.toLowerCase();
  
  if ([fullName, email, username, password].some((field) => !field)) {
    throw new apiError(400, "All fields are required");
  }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    throw new apiError(409, "User with given email or username already exists");
  }

    const avatarLocalPath = req.files?.avatar[0]?.path;  

    let coverImageLocalPath;

    if (req.files?.coverImage) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath ) {
        throw new apiError(400 , "Avatar image is required")
    };
    const avatar  = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    
    if(!avatar ){
        throw new apiError(500 , "Error uploading avatar image")
    }


  const user = await  User.create({

        fullName,
        avatar : avatar.secure_url,
        avatarPublicId : avatar.public_id,
        coverImage : coverImage?.secure_url||"",
        coverImagePublicId: coverImage?.public_id || "",
        email,
        username : username,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
    )

    if(!createdUser){
        throw new apiError (500 , "Error creating user")
    }
    return res.status(201).json(new apiResponse(201 , "User registered successfully" , createdUser));
});

const loginUser = asyncHandler(async (req,res) =>{

  let {email, username, password} = req.body;
  email = email?.trim()?.toLowerCase();
  username = username?.trim()?.toLowerCase();

  if((!email && !username ) || !password){
    throw new apiError (400 , "Email or username and password are required");
  } 

const user = await User.findOne({ $or: [{ email }, { username }] });

if (!user) {
  throw new apiError(404, "User not found");
}

const isPasswordCorrect = await user.comparePassword(password);

if (!isPasswordCorrect) {
  throw new apiError(401, "Password is incorrect");
}
const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user);

const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

const options = {
  httpOnly: true,
  secure : true,

}
return res.status(200).cookie("accessToken" , accessToken , options)
.cookie("refreshToken" , refreshToken , options)
.json(new apiResponse(200 , {
  user : loggedInUser, accessToken, refreshToken
},
"user logged in successfully" 
))
});

const logOutUser  = asyncHandler(async (req,res) => {

 await User.findByIdAndUpdate(
     req.user._id,
    {
      $set: { refreshToken: undefined  }
    }
    
  )

  
const options = {
  httpOnly: true,
  secure : true,

}
return res.status(200).clearCookie("accessToken" , options)
.clearCookie("refreshToken" , options).json(new apiResponse(200 ,{}, "User logged out successfully"))

});

const refreshAccessToken = asyncHandler (async (req,res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken){
      throw new apiError (401 , "unauthorized , no token provided");
  }
 try {
   const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
   const user = await User.findById(decodedToken?.userId)
 
   if(!user){
     throw new apiError (401 , "Invalid token , user not found");
   }
   if (incomingRefreshToken !== user.refreshToken){
     throw new apiError (401 , "Invalid refresh token");
   }
 
   const options = {
     httpOnly: true,
     secure : true,
   }
   const { accessToken , newRefreshToken} = await generateAccessandRefreshTokens(user._id)
 
   return res.status(200).cookie("accessToken" , accessToken , options ).cookie("refreshToken" , newRefreshToken , options)
   .json (new apiResponse (200 , { accessToken , refreshToken : newRefreshToken } , "Access token refreshed successfully"))
   
 } catch (error) {
    throw new apiError (401 , error?.message ||"Invalid token");
  
 }
});

const changePassword = asyncHandler (async (req,res) => {
  const { currentPassword , newPassword } = req.body;

  if (!currentPassword || !newPassword) {
  throw new apiError(400, "Current password and new password are required");
}

  const user = await User.findById(req.user._id)
  if (currentPassword === newPassword) {
  throw new apiError(400, "New password must be different from current password");
}
  const isPasswordCorrect = await user.comparePassword(currentPassword)

  if (!isPasswordCorrect) {
    throw new apiError (401 , "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
  return res.status(200).json (new apiResponse (200 , {} , "Password changed successfully"))
});

const getCurrentUser = asyncHandler(async (req,res) => {  
  return res
  .status(200)
  .json(new apiResponse(200, req.user, "current user fetched successfully"));
   }) 


const updateDetails = asyncHandler(async (req, res) => {
  let { fullName, email, username } = req.body;
  fullName = fullName?.trim();
  email = email?.trim()?.toLowerCase();
  username = username?.trim()?.toLowerCase();

  if ([fullName, email, username].some(field => typeof field !== "string" || field.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  const emailExists = await User.findOne({
    email,
    _id: { $ne: req.user._id }
  });

  if (emailExists) {
    throw new apiError(409, "Email is already in use");
  }

  const usernameExists = await User.findOne({
    username: username,
    _id: { $ne: req.user._id }
  });

  if (usernameExists) {
    throw new apiError(409, "Username is already taken");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
        username
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "User details updated successfully"));
});

const updateAvatar  = asyncHandler(async(req,res) => {

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath){
    throw new apiError(400 , "Avatar image is required")
  }

  const userBeforeUpdate = await User.findById(req.user._id);

 const avatar = await uploadToCloudinary(avatarLocalPath)




 if(!avatar.url ){
     throw new apiError(500 , "Error uploading avatar image")
 }

  if (userBeforeUpdate.avatarPublicId){
    await cloudinary.uploader.destroy(userBeforeUpdate.avatarPublicId);
  }

const user  =  await User.findByIdAndUpdate(
   req.user._id,
   {
     $set: { avatar : avatar.url ,
      avatarPublicId : avatar.public_id
      }
   },
   {
     new: true,
   }).select("-password -refreshToken");


   return res.status(200).json(new apiResponse(200 , user , "Avatar updated successfully") );

 

})



const updateCoverImage  = asyncHandler(async(req,res) => {

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath){
    throw new apiError(400 , "cover image is required")
  }

  const userBeforeUpdate = await User.findById(req.user._id);
  const coverImage = await uploadToCloudinary(coverImageLocalPath)

  if(!coverImage.url ){
     throw new apiError(500 , "Error uploading cover image")
   }

     if (userBeforeUpdate.coverImagePublicId){
    await cloudinary.uploader.destroy(userBeforeUpdate.coverImagePublicId);
  }

 const user = await User.findByIdAndUpdate(
   req.user._id,
   {
     $set: { coverImage : coverImage.url ,
      coverImagePublicId : coverImage.public_id
      }
   },
   {
     new: true,
   }).select("-password -refreshToken");

   return res.status(200).json(new apiResponse(200 , user , "Cover image updated successfully") );


})

const getUserChannelProfile = asyncHandler(async(req , res ) => {

  const {username} = req.params
  
  if (!username?.trim()){
    throw new apiError (400 , "username is required")
  }
  const channel = await User.aggregate([
    {
      $match : { username : username?.toLowerCase() }
    },
    {
    $lookup : {
      from : "subscriptions",
      localField : "_id",
      foreignField : "channel",
      as : "subscribers"
    }},
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "subscriber",
        as : "subscribedChannels"
      }
    }
    ,
    {
      $addFields:{
        subscribersCount : { $size : "$subscribers" },
        channelsSubscribedToCount : { $size : "$subscribedChannels"},
        isSubscribedToChannel : {
           $cond : {
            if : {$in : [ req.user?._id , "$subscribers.subscriber" ] } ,
            then : true ,
            else : false
           }
        }
      }
    },
    {
      $project : {
        fullName : 1 ,
        username : 1 ,
        subscribersCount : 1 ,
        channelsSubscribedToCount : 1 ,
        isSubscribedToChannel : 1 ,
        avatar : 1 ,
        coverImage : 1,
        email : 1 ,
        createdAt : 1
      }
    }
  ])
  if (!channel?.length){
    throw new apiError (404 , "Channel not found")
  }
  return res.status(200).json (new apiResponse (200 , channel[0] , "Channel profile fetched successfully"))

})

const getWatchHistory  = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})




export { registerUser , loginUser ,
   logOutUser , refreshAccessToken  ,
    changePassword , getCurrentUser ,
     updateDetails , updateAvatar ,
      updateCoverImage , getUserChannelProfile , getWatchHistory};

  