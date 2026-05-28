import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();


app.use(cors({
    origin : process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials : true,
}));

app.use(express.json({  
    limit : "16kb",
}));  

app.use(express.urlencoded({
    extended : true,
    limit : "16kb",
}));

app.use(express.static("public"));

app.use(cookieParser());

//routes 
import userRouter from "./routes/user.routes";
import healthcheckRouter from "./routes/healthcheck..routes"
import tweetRouter from "./routes/tweet.routes"
import subscriptionRouter from "./routes/subscription.routes"
import videoRouter from "./routes/video.routes"
import commentRouter from "./routes/comment.routes"
import likeRouter from "./routes/likes.routes"
import playlistRouter from "./routes/playlist.routes"
import dashboardRouter from "./routes/dashboard.routes"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

    
export  {app}; 