import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorBoundary from "./components/ErrorBoundary.jsx"; // ✅ import

const clientId =
  "729140689303-ep2ukqta4ov9knke95u6ma47vhc54v6m.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
