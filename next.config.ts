export default {
  proxy: [
    {
      path: "/:path*",
      proxy: "./src/proxy.ts",
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mavellium.com.br",
      },
    ],
  },
};
