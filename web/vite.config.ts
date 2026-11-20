import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev only: proxy API calls to the gateway. In production Caddy does this.
const gatewayUrl = process.env.VITE_GATEWAY_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/v1": gatewayUrl } },
});
