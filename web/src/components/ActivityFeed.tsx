"use client";

/**
 * ActivityFeed - 显示链上签到事件
 *
 * 知识点:
 *  - 打开时:主动 getLogs 拉最近的历史签到
 *  - 之后:useWatchContractEvent 轮询新事件,增量追加到顶部
 *  - 这是"链上即数据库"的体现:不需要后端,直接读链
 *  - 实际项目里高频事件建议用 The Graph 等索引服务,DApp 直接监听 RPC 会被限流
 */

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useCheckedInEvents, useRecentCheckedIn } from "@/hooks/useCheckIn";

interface FeedItem {
  user: `0x${string}`;
  streak: bigint;
  reward: bigint;
  timestamp: bigint;
  // 用 txHash + logIndex 组合当唯一 key,防重复
  key: string;
}

export default function ActivityFeed() {
  const { isConnected } = useAccount();
  const [items, setItems] = useState<FeedItem[]>([]);
  const { data: history, isLoading, error } = useRecentCheckedIn(10);

  // 首次拿到历史数据后灌入列表
  useEffect(() => {
    if (!history) return;
    setItems(
      history.map((e, i) => ({
        ...e,
        key: `history-${i}-${e.timestamp}`,
      })),
    );
  }, [history]);

  // 实时监听新事件,追加到顶部
  useCheckedInEvents((event) => {
    setItems((prev) => {
      const key = `live-${event.user}-${event.timestamp}`;
      // 简单去重:同 key 不重复插入
      if (prev.some((x) => x.key === key)) return prev;
      return [{ ...event, key }, ...prev].slice(0, 10);
    });
  });

  // 断开钱包时不展示任何记录:直接在渲染层短路,而不是清空 items
  // (items 清空后,history 查询若因缓存过期重新触发,又会把数据填回来)
  const visibleItems = isConnected ? items : [];

  return (
    <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-semibold">实时动态</h2>
        <span className="inline-block w-2 h-2 bg-[#02C076] rounded-full animate-pulse" />
      </div>
      <p className="text-xs text-[#848E9C] mb-4">
        最近的签到记录 · 新签到通过 WebSocket 实时推送到这里
      </p>

      {!isConnected && (
        <p className="text-sm text-[#5E6673] py-4 text-center">
          请先连接钱包
        </p>
      )}

      {isConnected && isLoading && (
        <p className="text-sm text-[#5E6673] py-4 text-center animate-pulse">
          加载历史签到中...
        </p>
      )}

      {isConnected && error && (
        <p className="text-sm text-[#F6465D] py-4 text-center">
          读取历史事件失败: {(error as Error).message.slice(0, 80)}
        </p>
      )}

      {isConnected && !isLoading && visibleItems.length === 0 && (
        <p className="text-sm text-[#5E6673] py-4 text-center">
          最近还没有签到记录
        </p>
      )}

      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={item.key}
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
