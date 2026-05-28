import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller"
import { verifyOwnership } from "../middlewares/ownership.middleware";
import { Tweet } from "../models/tweet.model";
import {verifyJwt} from "../middlewares/auth.middleware"

const router = Router();
router.use(verifyJwt); 

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);

router
  .route("/:id")
  .patch(verifyOwnership(Tweet), updateTweet)
  .delete(verifyOwnership(Tweet), deleteTweet);

export default router