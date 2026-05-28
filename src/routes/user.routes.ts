import { Router } from "express";
import { registerUser , loginUser ,
   logOutUser , refreshAccessToken  ,
    changePassword , getCurrentUser ,
     updateDetails , updateAvatar ,
      updateCoverImage , getUserChannelProfile , getWatchHistory} from "../controllers/user.controller";
import {upload} from  "../middlewares/multer.middleware"
import { verifyJwt } from "../middlewares/auth.middleware";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);

//secured routes

userRouter.route("/logout").post(verifyJwt, logOutUser);
userRouter.route("/refresh-token").post(refreshAccessToken)

userRouter.route("/change-password").post(verifyJwt, changePassword)
userRouter.route("/current-user").get(verifyJwt, getCurrentUser)
userRouter.route("/update-account").patch(verifyJwt, updateDetails)

userRouter.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatar)
userRouter.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateCoverImage)

userRouter.route("/c/:username").get(verifyJwt, getUserChannelProfile)
userRouter.route("/history").get(verifyJwt, getWatchHistory)



export default userRouter;