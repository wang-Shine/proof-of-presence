import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // React Compiler 需要 babel-plugin-react-compiler 才能开启,demo 中不强制
  // reactCompiler: true,
  // Next.js 16 默认使用 Turbopack,空配置即可消除迁移告警
  turbopack: {},
};

export default nextConfig;
