/** @type {import('next').NextConfig} */
const nextConfig = {
  // The whole page is a client-only, animation/DOM-measurement tree. StrictMode
  // would double-invoke the ScrollSmoother / Lottie setup effects in dev (create
  // then immediately destroy + recreate), which is noise we don't want here.
  reactStrictMode: false,
  devIndicators: false,
  // Allow the LAN host used for on-device (phone) testing to fetch dev/HMR
  // resources, so live reload works when the site is opened from a phone.
  allowedDevOrigins: ["10.66.105.179"],
};

export default nextConfig;
