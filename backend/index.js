import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

console.log("Running in", process.env.NODE_ENV, "mode");

import { connectDB } from "./db/index.js";  // Supabase connection
import { app } from "./app.js";

const startServer = async () => {
    try {
        await connectDB(); // Check Supabase connection

        const serverPORT = process.env.PORT || 8000;
        app.on("error", (err) => {
            console.error("App listening error!! ", err);
            process.exit(1);
        });

        app.listen(serverPORT, () => {
            console.log(`🚀 Server is running at: ${process.env.BASE_URL}`);
        });

    } catch (err) {
        console.log("❌ Supabase connection failed: ", err);
        process.exit(1);
    }
};

startServer();
