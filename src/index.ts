import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 

import { app } from "./app";
import connectDB from "./db/index";


const PORT: number = Number(process.env.PORT) || 8000;


connectDB()
  .then(() => {
    app.listen(PORT || 8000, () => {
      console.log(`\nserver is running on port ${PORT || 8000}`);
    });

    app.on("error", (err : Error) => {
      console.error("server error:", err);
      process.exit(1);
    });
  })
  .catch((err : Error) => {
    console.error("failed to connect to the database", err);
  });
