"use client";

/**
 * 主页 - 把所有模块组合起来
 *
 * 这是一个 DApp 完整功能的"入口面板":
 *  - 头部:连接钱包 / 切链
 *  - 左:签到 + 兑换
 *  - 右:我的徽章 + 实时动态
 */

import ConnectButton from "@/components/ConnectButton";
import CheckInCard from "@/components/CheckInCard";
import ExchangePanel from "@/components/ExchangePanel";
import BadgeGallery from "@/components/BadgeGallery";
import ActivityFeed from "@/components/ActivityFeed";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* 头部 */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-[#2B3139]">
        <div>
          <h1 className="text-2xl font-bold">Web3 Check-in Demo</h1>
          <p className="text-xs text-[#848E9C] mt-1">
            学习 DApp 开发的链上签到示例 · Next.js 16 + wagmi v2 + viem + Reown
          </p>
        </div>
        <ConnectButton />
      </header>

      {/* 主体:两列布局 */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <CheckInCard />
          <ExchangePanel />
        </div>
        <div className="space-y-5">
          <BadgeGallery />
          <ActivityFeed />
        </div>
      </div>
    </main>
  );
}
