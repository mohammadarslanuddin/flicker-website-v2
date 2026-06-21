/** @type {import('next').NextConfig} */
const nextConfig = {
  // The whole page is a client-only, animation/DOM-measurement tree. StrictMode
  // would double-invoke the ScrollSmoother / Lottie setup effects in dev (create
  // then immediately destroy + recreate), which is noise we don't want here.
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
