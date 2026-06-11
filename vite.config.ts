import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The Groq API key is read from .env.local as GROQ_API_KEY (NOT prefixed with
// VITE_). Because it has no VITE_ prefix, Vite never injects it into the client
// bundle. Instead the dev server proxies /api/groq -> api.groq.com and attaches
// the Authorization header here, server-side. The browser never sees the key.
//
// For any real deployment, replace this dev proxy with a proper backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const groqKey = env.GROQ_API_KEY ?? "";

  return {
    base: "./",
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 3000,
      proxy: {
        "/api/groq": {
          target: "https://api.groq.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/groq/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (groqKey) {
                proxyReq.setHeader("Authorization", `Bearer ${groqKey}`);
              }
            });
          },
        },
      },
    },
  };
});
