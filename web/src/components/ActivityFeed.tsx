"use client";

/**
 * ActivityFeed - 实时显示链上签到事件
 *
 * 知识点:
 *  - useWatchContractEvent 用 WebSocket 订阅链上事件,有新事件实时推送
 *  - 这是"链上即数据库"的体现:不需要后端,直接监听链
 *  - 实际项目里高频事件建议用 The Graph 等索引服务,DApp 直接监听 RPC 会被限流
 */

import { useState } from "react";
import { formatUnits } from "viem";
import { useCheckedInEvents } from "@/hooks/useCheckIn";

interface FeedItem {
  user: `0x${string}`;
  streak: bigint;
  reward: bigint;
  timestamp: bigint;
  receivedAt: number;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useCheckedInEvents((event) => {
    setItems((prev) => {
      // 注意:Math.random/Date.now 在 React 内部 hook 回调里能用,
      // 但记得在 SSR 场景下小心 hydration 问题
      const newItem: FeedItem = {
        ...event,
        receivedAt: performance.now(),
      };
      return [newItem, ...prev].slice(0, 10); // 最多保留 10 条
    });
  });

  return (
    <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-semibold">实时动态</h2>
        <span className="inline-block w-2 h-2 bg-[#02C076] rounded-full animate-pulse" />
      </div>
      <p className="text-xs text-[#848E9C] mb-4">
        WebSocket 订阅 CheckedIn 事件,有人签到时实时刷新
      </p>

      {items.length === 0 && (
        <p className="text-sm text-[#5E6673] py-4 text-center">
          等待新的签到事件...
        </p>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 bg-[#0D0F16] border border-[#2B3139] rounded text-xs"
          >
            <div className="font-mono text-[#848E9C]">
              {item.user.slice(0, 6)}...{item.user.slice(-4)}
            </div>
            <div>
              <span className="text-[#F0B90B] font-semibold">
                +{formatUnits(item.reward, 18)} LBR
              </span>
              <span className="text-[#848E9C] ml-2">
                连续 {item.streak.toString()} 天
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
