import React from "react";
import URLShortener from "./components/UrlShortener.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; // Custom styles

const App = () => {
  return (
    <div className="bg-container d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="text-center text-white mb-4">
        <h1 className="fw-bold">Shorten Your Links Instantly</h1>
        <p className="lead">Make your links shorter, professional, and easier to share.</p>
      </div>
      <URLShortener />
    </div>
  );
};

export default App;
