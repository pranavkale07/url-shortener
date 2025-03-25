import express from "express";
// import { shortenUrl, redirectUrl, getUrlStats } from "../controllers/url.controller.js";
import { shortenUrl, redirectToOriginalUrl, getUrlStats } from "../controllers/url.controller.js";

const router = express.Router();

router.post("/shorten", shortenUrl);  // POST api/v1/url/shorten
router.get("/:shortCode", redirectToOriginalUrl);  // Redirect to original URL  // GET api/v1/url/:short_code
router.get("/stats/:short_code", getUrlStats);  // GET api/v1/url/stats/:short_code

export default router;
