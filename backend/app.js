import express from "express";
import cors from "cors";
import urlRoutes from "./routes/url.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Routes
// Prefix all routes with /api/v1
app.use("/", urlRoutes);

export { app };
