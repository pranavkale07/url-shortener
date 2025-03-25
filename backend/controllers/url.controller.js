import { log } from "console";
import { supabase } from "../db/index.js";
import crypto from "crypto";
// import useragent from "user-agent";
// import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js"
import validUrl from "valid-url";


const generateShortCode = async () => {
    const base62Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let shortCode;
    let isUnique = false;
    let count = 0;
    while (!isUnique) {
        shortCode = Array.from({ length: 7 }, () =>
            base62Chars[crypto.randomInt(0, 62)]
        ).join("");

        // Check if shortCode already exists in DB
        const { data } = await supabase
            .from("urls")
            .select("short_code")
            .eq("short_code", shortCode)
            .maybeSingle();

        if (!data) isUnique = true;  // If no matching short_code found, it's unique
        count = count + 1;
    }
    console.log(`Took ${count} number of generations for short_code`);
    return shortCode;
};

export const shortenUrl = async (req, res) => {
    try {
        const { original_url } = req.body;

        if (!original_url) {
            return res.status(400).json({ success: false, message: "Original URL is required" });
        }

        // Validate URL format
        if (!validUrl.isUri(original_url)) {
            return res.status(400).json({ success: false, message: "Invalid URL format!" });
        }

        const short_code = await generateShortCode();

        const { data, error } = await supabase
            .from("urls")
            .insert([{ original_url, short_code }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: "Short URL created successfully",
            data: {
                short_url: `${process.env.BASE_URL}/${short_code}`,
                short_code,
                original_url,
            },
        });
        console.log(`New short url created: original_url: ${original_url}  => short_url: ${process.env.BASE_URL}/${short_code}`)

    } catch (error) {
        console.error("Error creating short URL:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Function to get the client IP from request
const getClientIp = (req) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
    ip = ip.split(",")[0].trim(); // Handles multiple IPs in case of proxies

    // Replace localhost IPs with a dummy real external IP
    if (ip === "::1" || ip === "127.0.0.1") {
        ip = "101.173.206.91";
    }

    return ip;
};

export const logClick = async (req, urlId) => {
    try {
        // Extract Client IP
        const clientIp = getClientIp(req);
        // console.log("User IP:", clientIp);

        // Check User-Agent Header
        const userAgent = req.headers["user-agent"] || "Unknown";
        // console.log("User-Agent Header:", userAgent);

        // Parse User-Agent Properly
        const parser = new UAParser(userAgent);
        const deviceType = parser.getDevice().type || "Desktop";  // If undefined, assume Desktop
        const deviceBrand = parser.getDevice().vendor || "Unknown Brand";
        const deviceModel = parser.getDevice().model || "Unknown Model";
        const deviceOS = parser.getOS().name || "Unknown OS";
        const browser = parser.getBrowser().name || "Unknown Browser";

        // Combine into a readable format
        let device;
        if (deviceType === "Desktop") {
            device = `Desktop (${deviceOS}, ${browser})`;
        } else {
            device = `${deviceBrand} ${deviceModel} (${deviceType}, ${deviceOS})`;
        }

        // console.log("Parsed Device Info:", device);

        // Fetch Location Info from ipapi.co using the IP address
        let city = "Unknown";
        let country = "Unknown";

        try {
            const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            
            if (response.ok) {
                const geoData = await response.json();
                // console.log("Geo Data:", geoData);

                city = geoData.city || "Unknown";
                country = geoData.country_name || "Unknown";
            } else {
                console.error("Failed to fetch location data. Status:", response.status);
            }
        } catch (err) {
            console.error("Error fetching location data:", err.message);
        }

        // // Extract city and country from the response or default to "Unknown"
        // const city = geoData.city || "Unknown";
        // const country = geoData.country_name || "Unknown";

        // Log Click in `click_logs` Table
        const { error: insertError } = await supabase.from("click_logs").insert({
            url_id: urlId,
            ip_address: clientIp,
            city,
            country,
            device
        });

        if (insertError) {
            console.error("Error inserting click log:", insertError.message);
        } else {
            console.log(`Click logged successfully for urlID: ${urlId}`);
            console.log(`{ City: ${city}, Country: ${country}, Device: ${device}, IP: ${clientIp} }`);
        }

        // // Increment Click Counter in `urls` Table
        // const { error: incrementError } = await supabase.rpc("increment_clicks", { url_id: urlId });

        // if (incrementError) {
        //     console.error("Error incrementing clicks:", incrementError.message);
        // } else {
        //     console.log("Click count incremented.");
        // }

    } catch (err) {
        console.error("Error logging click:", err.message);
    }
};




export const redirectToOriginalUrl = async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Fetch the original URL and its ID
        const { data, error } = await supabase
            .from("urls")
            .select("id, original_url, clicks")
            .eq("short_code", shortCode)
            .maybeSingle();

        if (error) throw error;

        // If the URL doesn't exist, return 404
        if (!data || !data.id) {
            return res.status(404).json({ success: false, message: "Short URL not found" });
        }

        // Extract URL ID
        const urlId = data.id;

        // Update the click count
        const { error: updateError } = await supabase
            .from("urls")
            .update({ clicks: (data.clicks || 0) + 1 })
            .eq("id", urlId);

        if (updateError) throw updateError;

        // Insert log entry into click_logs table
        logClick(req, urlId).catch(err => console.error("Click logging failed:", err));

        console.log(`URL Redirected successfully from ${process.env.BASE_URL}/${shortCode} to ${data.original_url}`)

        // 🔥 302 Temporary Redirect to original URL
        res.redirect(302, data.original_url);
    } catch (error) {
        console.error("Error in URL redirection:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




export const getUrlStats = async (req, res) => {
    try {
        const { short_code } = req.params; // Get short_code from URL

        // Fetch URL ID (UUID) from short_code
        const { data: urlData, error: urlError } = await supabase
            .from("urls")
            .select("id")
            .eq("short_code", short_code)
            .single();

        if (urlError || !urlData) {
            console.error("Error fetching URL ID:", urlError?.message || "Not found");
            return res.status(404).json({ error: "Shortened URL not found" });
        }

        const urlId = urlData.id; // Extract UUID

        // Fetch Total Clicks
        const { count: totalClicks, error: countError } = await supabase
            .from("click_logs")
            .select("*", { count: "exact" })
            .eq("url_id", urlId);

        if (countError) {
            console.error("Error fetching total clicks:", countError.message);
            return res.status(500).json({ error: "Failed to fetch total clicks" });
        }

        // Fetch Unique Visitors (Distinct IPs) - FIXED
        const { data: uniqueIpsData, error: uniqueIpsError } = await supabase
            .from("click_logs")
            .select("ip_address", { distinct: true }) // FIX: Using distinct
            .eq("url_id", urlId);

        if (uniqueIpsError) {
            console.error("Error fetching unique visitors:", uniqueIpsError.message);
            return res.status(500).json({ error: "Failed to fetch unique visitors" });
        }

        const uniqueVisitors = uniqueIpsData.length; // Count distinct IPs

        // Fetch Detailed Click Logs
        const { data: logs, error: logsError } = await supabase
            .from("click_logs")
            .select("ip_address, city, country, device, created_at")
            .eq("url_id", urlId)
            .order("created_at", { ascending: false });

        if (logsError) {
            console.error("Error fetching click logs:", logsError.message);
            return res.status(500).json({ error: "Failed to fetch click logs" });
        }

        console.log(`Click stats fetched successfully for : ${process.env.BASE_URL}/${short_code}`)

        return res.status(200).json({
            short_code,
            totalClicks,
            uniqueVisitors,
            logs
        });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
