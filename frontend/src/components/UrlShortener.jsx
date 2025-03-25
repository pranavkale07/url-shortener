import React, { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa"; // Import icons
import { API_BASE_URL, FRONTEND_BASE_URL } from "../config.js";

const URLShortener = () => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidURL = (url) => {
    const urlPattern = new RegExp(
      "^(https?:\\/\\/)" + // Protocol (http or https)
      "((([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})|" + // Domain name
      "localhost|" + // Localhost
      "\\d{1,3}(\\.\\d{1,3}){3})" + // OR IP (v4) address
      "(:\\d{1,5})?" + // Optional port
      "(\\/.*)?$", // Path
      "i"
    );
    return urlPattern.test(url);
  };

  const handleShorten = async () => {
    if (originalUrl.trim() === "") return;
    if (!isValidURL(originalUrl)) {
      setError("Please enter a valid URL!");
      return;
    }
    setLoading(true);
    setError("");
  
    try {
      const response = await fetch(`${API_BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_url: originalUrl }), // Updated key
      });
  
      const data = await response.json();
    //   console.log("Backend Response:", data); // Debugging line

      const shortUrl = `${FRONTEND_BASE_URL}/${data.data.short_code}`;
  
      if (response.ok) {
        setShortUrl(shortUrl); // ✅ Corrected: accessing short_url from data object
        setCopied(false);
      } else {
        setError(data.message || "Something went wrong!");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="url-card">
      <h4 className="text-center">🔗 Shorten Your URL</h4>
      
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Paste your long URL here..."
        value={originalUrl}
        onChange={(e) => setOriginalUrl(e.target.value)}
      />

      <button className="btn btn-primary w-100" onClick={handleShorten} disabled={loading}>
        {loading ? "Shortening..." : "Shorten URL"}
      </button>

      {error && <p className="error-msg">{error}</p>}

      {shortUrl && (
        <div className="short-url-container">
          <span className="short-url">{shortUrl}</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? <FaCheck color="#28a745" /> : <FaCopy />}
          </button>
        </div>
      )}
    </div>
  );
};

export default URLShortener;
