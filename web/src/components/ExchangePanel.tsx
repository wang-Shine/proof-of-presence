"use client";

/**
 * ExchangePanel - NFT 兑换面板
 *
 * 完整演示 ERC20 的 approve + transferFrom 两步授权模式:
 *   Step 1: 检查 allowance,若不够则 approve
 *   Step 2: 调 redeemBadge,合约内部 transferFrom + mint NFT
 *
 * 这是 DApp 最经典的"两步交易"流程,DEX、NFT 市场、借贷全用这套
 */

import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import {
  ACTIVE_CHAIN_ID,
  CONTRACTS,
} from "@/config/contracts";
import { useLBRBalance, useLBRAllowance, useApproveLBR } from "@/hooks/useToken";
import { useRedeemBadge } from "@/hooks/useBadge";

const BADGES = [
  { level: 1 as const, name: "普通徽章", cost: "100", emoji: "🥉", color: "#CD7F32" },
  { level: 2 as const, name: "稀有徽章", cost: "500", emoji: "🥈", color: "#C0C0C0" },
  { level: 3 as const, name: "史诗徽章", cost: "2000", emoji: "🥇", color: "#F0B90B" },
];

const checkInAddr = CONTRACTS[ACTIVE_CHAIN_ID].checkIn;

export default function ExchangePanel() {
  const { isConnected } = useAccount();
  const { data: balance } = useLBRBalance();
  const { data: allowance } = useLBRAllowance(checkInAddr);

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
  } = useApproveLBR();

  const {
    redeem,
    isPending: isRedeemPending,
    isConfirming: isRedeemConfirming,
    isConfirmed: isRedeemConfirmed,
    error: redeemError,
  } = useRedeemBadge();

  if (!isConnected) {
    return (
      <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
        <h2 className="text-xl font-semibold mb-3">兑换 NFT 徽章</h2>
        <p className="text-[#848E9C]">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
      <h2 className="text-xl font-semibold mb-1">兑换 NFT 徽章</h2>
      <p className="text-xs text-[#848E9C] mb-5">
        消耗 LBR 兑换 NFT。当前余额:
        <span className="text-[#F0B90B] ml-1">
          {balance ? formatUnits(balance, 18) : "0"} LBR
        </span>
      </p>

      <div className="space-y-3">
        {BADGES.map((badge) => (
          <BadgeRow
            key={badge.level}
            badge={badge}
            balance={balance ?? 0n}
            allowance={allowance ?? 0n}
            onApprove={approve}
            onRedeem={redeem}
            isApproveBusy={isApprovePending || isApproveConfirming}
            isRedeemBusy={isRedeemPending || isRedeemConfirming}
          />
        ))}
      </div>

      {isRedeemConfirmed && (
        <p className="text-xs text-[#02C076] mt-3">✓ NFT 兑换成功</p>
      )}
      {redeemError && (
        <p className="text-xs text-[#F6465D] mt-3">
          兑换失败:{redeemError.message.slice(0, 100)}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 单个徽章兑换行
// 这里集中演示 approve 的判断逻辑
// ============================================================

function BadgeRow({
  badge,
  balance,
  allowance,
  onApprove,
  onRedeem,
  isApproveBusy,
  isRedeemBusy,
}: {
  badge: (typeof BADGES)[number];
  balance: bigint;
  allowance: bigint;
  onApprove: (spender: `0x${string}`, amount: string) => void;
  onRedeem: (level: 1 | 2 | 3) => void;
  isApproveBusy: boolean;
  isRedeemBusy: boolean;
}) {
  const costBigInt = parseUnits(badge.cost, 18);

  // 关键逻辑:三种状态判断
  // 1. 余额不够 → 灰掉,不能买
  // 2. 余额够但 allowance 不够 → 显示"授权"按钮
  // 3. 余额够且 allowance 够 → 显示"兑换"按钮
  const hasBalance = balance >= costBigInt;
  const hasAllowance = allowance >= costBigInt;

  let actionLabel: string;
  let onClick: () => void;
  let disabled = false;
  let isAction = false;

  if (!hasBalance) {
    actionLabel = "余额不足";
    onClick = () => {};
    disabled = true;
  } else if (!hasAllowance) {
    actionLabel = isApproveBusy ? "授权中..." : "1️⃣ 授权 LBR";
    onClick = () => onApprove(checkInAddr, badge.cost);
    disabled = isApproveBusy;
    isAction = true;
  } else {
    actionLabel = isRedeemBusy ? "兑换中..." : "2️⃣ 兑换 NFT";
    onClick = () => onRedeem(badge.level);
    disabled = isRedeemBusy;
    isAction = true;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-[#0D0F16] border border-[#2B3139] rounded">
      <div className="text-3xl">{badge.emoji}</div>

      <div className="flex-1">
        <div
          className="font-semibold"
          style={{ color: badge.color }}
        >
          {badge.name}
        </div>
        <div className="text-xs text-[#848E9C]">
          需要 {badge.cost} LBR
        </div>
      </div>

      <button
        disabled={disabled}
        onClick={onClick}
        className={`px-4 py-2 rounded text-sm font-medium ${
          isAction
            ? "bg-[#F0B90B] text-black hover:opacity-90"
            : "bg-[#2B3139] text-[#5E6673]"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
