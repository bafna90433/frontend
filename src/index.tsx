import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

// ✅ YAHAN CSS IMPORT KARNI ZAROORI HAI
import "./styles/index.css"; 

import App from "./App";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  );

  container.classList.add("app-loaded");
}