import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller"
import {verifyJwt} from "../middlewares/auth.middleware"

const router = Router();

router.use(verifyJwt); 

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router