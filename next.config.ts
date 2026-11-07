import { requireLocalBackendUrl } from "./src/data/localBackendUrl";
import type { NextConfig } from "next";

const httpEnabled = Object.entries(process.env).some(([key,value]) =>
  (key === "MARKET_LENS_DATA_SOURCE" || /^MARKET_LENS_[A-Z0-9_]+_SOURCE$/.test(key)) && value === "http"
);
if (httpEnabled) requireLocalBackendUrl(process.env.DONGHAK_API_BASE_URL);

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
