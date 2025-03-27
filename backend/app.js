import express from "express";
import cors from "cors";
import urlRoutes from "./routes/url.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [];

app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`Blocked CORS request from: ${origin}`);
          callback(null, false); // Reject request silently instead of throwing an error
        }
      },
      credentials: true, // Enable if using cookies/authentication
    })
  );

app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Routes
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
app.use("/", urlRoutes);

export { app };
