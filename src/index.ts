import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 

import connectDB from "./db/index";
import { app } from "./app";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`\nserver is running on port ${process.env.PORT || 8000}`);
    });

    app.on("error", (err) => {
      console.error("server error:", err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("failed to connect to the database", err);
  });
