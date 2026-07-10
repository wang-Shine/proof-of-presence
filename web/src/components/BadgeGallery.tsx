"use client";

/**
 * BadgeGallery - 展示当前用户持有的所有 NFT 徽章
 *
 * 演示的知识点:
 *  - 用 useReadContracts 一次性读取多个 tokenLevel(自动用 multicall 合并)
 *  - NFT 的 tokenId、tokenLevel、tokenURI 三层关系
 */

import { useAccount, useReadContracts } from "wagmi";
import { ACTIVE_CHAIN_ID, CONTRACTS, badgeAbi } from "@/config/contracts";
import { useMyBadges } from "@/hooks/useBadge";

const badgeAddr = CONTRACTS[ACTIVE_CHAIN_ID].badge;

const LEVEL_META: Record<number, { name: string; emoji: string; color: string }> =
  {
    1: { name: "普通徽章", emoji: "🥉", color: "#CD7F32" },
    2: { name: "稀有徽章", emoji: "🥈", color: "#C0C0C0" },
    3: { name: "史诗徽章", emoji: "🥇", color: "#F0B90B" },
  };

export default function BadgeGallery() {
  const { isConnected } = useAccount();
  const { data: tokenIds, isLoading } = useMyBadges();

  // ★ 关键:useReadContracts 自动用 multicall 合并多次读取
  // 这里同时查 N 个 tokenId 的 level,只发 1 次 RPC 请求
  const { data: levels } = useReadContracts({
    contracts:
      tokenIds?.map((tokenId) => ({
        address: badgeAddr,
        abi: badgeAbi,
        functionName: "tokenLevel" as const,
        args: [tokenId],
      })) ?? [],
    query: { enabled: !!tokenIds && tokenIds.length > 0 },
  });

  if (!isConnected) {
    return (
      <Card>
        <h2 className="text-xl font-semibold mb-3">我的徽章</h2>
        <p className="text-[#848E9C]">请先连接钱包</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3">
        我的徽章 {tokenIds && `(${tokenIds.length})`}
      </h2>

      {isLoading && (
        <p className="text-[#848E9C] text-sm animate-pulse">加载中...</p>
      )}

      {tokenIds && tokenIds.length === 0 && (
        <p className="text-[#848E9C] text-sm">还没有徽章,去签到攒 LBR 兑换吧</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {tokenIds?.map((tokenId, idx) => {
          const level = (levels?.[idx]?.result ?? 0) as number;
          const meta = LEVEL_META[level] ?? LEVEL_META[1];

          return (
            <div
              key={tokenId.toString()}
              className="p-3 bg-[#0D0F16] border border-[#2B3139] rounded text-center"
              style={{ borderColor: meta.color + "33" }}
            >
              <div className="text-3xl">{meta.emoji}</div>
              <div
                className="text-xs font-semibold mt-1"
                style={{ color: meta.color }}
              >
                {meta.name}
              </div>
              <div className="text-[10px] text-[#848E9C] font-mono">
                #{tokenId.toString()}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
      {children}
    </div>
  );
}
