"use client";

/**
 * Providers - 把 wagmi + Reown AppKit + React Query 都包起来
 *
 * 这是整个 DApp 的"地基",所有用到链上交互的组件必须在它包裹之下
 */

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, networks, anvil } from "@/config/wagmi";

// 1. 在模块加载时初始化 AppKit (它是单例,只能初始化一次)
//    这里调一次后,全局都能用 <appkit-button /> 这个 Web Component 弹出钱包连接弹窗
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...networks],
  defaultNetwork: anvil,
  metadata: {
    name: "Web3 Check-in Demo",
    description: "学习 DApp 开发的签到 demo",
    url: "http://localhost:3000",
    icons: [],
  },
  features: {
    analytics: false,
    email: false, // 关闭邮箱登录,纯钱包模式
    socials: false,
  },
  themeMode: "dark",
});

export default function Providers({ children }: { children: ReactNode }) {
  // useState 包一层确保 SSR 时每个请求都有独立的 QueryClient
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 30 秒内同一个 query key 不会重新请求 RPC
            staleTime: 30_000,
            // 失败后重试 2 次
            retry: 2,
            // 窗口聚焦时不重新查(避免频繁打 RPC)
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
