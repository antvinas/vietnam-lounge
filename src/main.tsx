// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ThemeProvider from "@/context/ThemeContext";
import AppProvider from "@/context/AppContext";
import ToastProvider from "@/components/Toast";
import { I18nProvider } from "@/i18n";
import "@/styles/theme.css";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AppProvider>
                    <I18nProvider>
                        <ToastProvider>
                            <App />
                        </ToastProvider>
                    </I18nProvider>
                </AppProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);

// PWA: service worker 등록 (프로덕션에서만)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
            console.error("Service Worker registration failed:", err);
        });
    });
}
