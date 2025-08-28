import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    base: "var(--bg-base)",
                    muted: "var(--bg-muted)",
                    night: "var(--bg-night)",
                },
                fg: {
                    title: "var(--fg-title)",
                    body: "var(--fg-body)",
                    muted: "var(--fg-muted)",
                    onNight: "var(--fg-onNight)",
                },
                brand: {
                    primary: "var(--brand-primary)",
                    secondary: "var(--brand-secondary)",
                    accent: "var(--brand-accent)",
                },
                state: {
                    success: "var(--state-success)",
                    warn: "var(--state-warn)",
                    error: "var(--state-error)",
                    info: "var(--state-info)",
                },
                border: {
                    subtle: "var(--border-subtle)",
                    strong: "var(--border-strong)",
                },
            },
            borderRadius: {
                sm: "8px",
                md: "12px",
                lg: "16px",
                xl: "24px",
            },
            boxShadow: {
                card: "0 8px 24px rgba(16,24,40,0.08)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;
