/**
 * Descriptor: React entry point for the Sigmund PBM application.
 * Usage: Vite loads this module from index.html in development and production.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
