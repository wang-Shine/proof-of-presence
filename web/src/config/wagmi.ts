/**
 * wagmi + Reown AppKit 配置
 *
 * 知识点:
 *  1. wagmi 是 React 上的 DApp 状态管理库,封装了钱包连接、合约调用
 *  2. Reown AppKit 提供漂亮的钱包连接 UI(以前叫 WalletConnect v2)
 *  3. transports 配置每条链的 RPC,推荐用付费节点,Demo 用公开节点凑合
 *  4. 启动时需要在 https://cloud.reown.com 申请一个 projectId
 */

"use client";

import { cookieStorage, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// 1. 在 https://cloud.reown.com 创建项目获取 projectId(免费)
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "DEMO_PROJECT_ID";

// 2. 配置支持的链(顺序很重要,第一个是默认链)
//    只用 Sepolia 测试网,mainnet 作为备选(切换用)
export const networks = [sepolia, mainnet] as const;

// 3. Sepolia RPC:优先用环境变量里的 Alchemy/Infura,不填走 viem 内置公共节点
const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

// 4. wagmi adapter 配置
//    - ssr: true → SSR 友好,避免水合错误
//    - storage: 用 cookie 存储连接状态,刷新页面后自动重连
//    - transports: 显式指定每条链的 RPC 端点
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  networks: [...networks],
  projectId,
  transports: {
    [sepolia.id]: http(sepoliaRpc || undefined),
    [mainnet.id]: http(),
  },
});

// 5. 导出 wagmi config 供 WagmiProvider 使用
export const wagmiConfig = wagmiAdapter.wagmiConfig;
