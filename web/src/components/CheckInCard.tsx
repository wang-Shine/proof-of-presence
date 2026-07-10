"use client";

/**
 * CheckInCard - 签到主面板
 *
 * 这个组件覆盖了 DApp 前端最核心的交互模式:
 *   1. 用 useReadContract 读取链上状态
 *   2. 用 useWriteContract 发起写交易
 *   3. 用 useWaitForTransactionReceipt 追踪交易确认
 *   4. 区分"等签名"和"等上链"两种 loading 状态
 *   5. 错误友好提示
 */

import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useUserStatus, useCheckInTx } from "@/hooks/useCheckIn";

export default function CheckInCard() {
  const { isConnected } = useAccount();
  const { data: status, isLoading: isLoadingStatus } = useUserStatus();

  const {
    checkIn,
    isPending, // 等待用户在钱包里点确认
    isConfirming, // 已发送,等链上确认
    isConfirmed, // 已上链
    error,
    reset,
  } = useCheckInTx();

  // ======== 未连接钱包 ========
  if (!isConnected) {
    return (
      <Card>
        <h2 className="text-xl font-semibold mb-3">每日签到</h2>
        <p className="text-[#848E9C]">请先连接钱包</p>
      </Card>
    );
  }

  // ======== 加载链上状态中 ========
  if (isLoadingStatus || !status) {
    return (
      <Card>
        <p className="text-[#848E9C] animate-pulse">加载链上状态...</p>
      </Card>
    );
  }

  // ======== 主面板 ========
  const canCheckIn = status.canCheckInToday;
  const isBusy = isPending || isConfirming;

  console.log(status.streak)

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">每日签到</h2>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat
          label="连续天数"
          value={`${status.streak} 天`}
          accent
        />
        <Stat label="总签到" value={`${status.totalCheckIns} 次`} />
        <Stat
          label="LBR 余额"
          value={`${formatUnits(status.lbrBalance, 18)}`}
        />
      </div>

      <div className="bg-[#0D0F16] border border-[#2B3139] rounded p-3 mb-4 text-sm">
        <div className="text-[#848E9C]">下次签到可获得</div>
        <div className="text-[#F0B90B] text-xl font-semibold">
          {formatUnits(status.nextReward, 18)} LBR
        </div>
      </div>

      <button
        disabled={!canCheckIn || isBusy}
        onClick={checkIn}
        className="w-full py-3 bg-[#F0B90B] text-black rounded-md font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      >
        {isPending && "请在钱包中确认..."}
        {isConfirming && "交易上链中..."}
        {isConfirmed && "签到成功 🎉"}
        {!isBusy && (canCheckIn ? "立即签到" : "今日已签到")}
      </button>

      {error && (
        <div className="mt-3 p-2 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded text-[#F6465D] text-xs">
          <div className="font-semibold">交易失败</div>
          <div className="break-all">{prettifyError(error.message)}</div>
          <button
            onClick={reset}
            className="mt-1 text-[#F0B90B] underline text-xs"
          >
            重置
          </button>
        </div>
      )}

      {isConfirmed && (
        <p className="text-xs text-[#02C076] mt-2">
          ✓ 已上链,状态会自动刷新
        </p>
      )}
    </Card>
  );
}

// ============================================================
// 子组件 + 工具函数
// ============================================================

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-5">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0D0F16] border border-[#2B3139] rounded p-2">
      <div className="text-[10px] text-[#848E9C]">{label}</div>
      <div
        className={`text-base font-semibold ${
          accent ? "text-[#F0B90B]" : "text-[#EAECEF]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * 把链上原始错误信息翻译成对用户友好的语言
 *
 * 实战中遇到的错误大致几类:
 *   1. 用户在钱包里拒绝了:"User rejected the request"
 *   2. 余额不足付 Gas:"insufficient funds"
 *   3. 合约 revert:"reverted with reason..."
 *   4. RPC 限流/超时
 */
function prettifyError(msg: string): string {
  if (msg.includes("User rejected") || msg.includes("user rejected")) {
    return "您在钱包中取消了交易";
  }
  if (msg.includes("AlreadyCheckedInToday")) {
    return "今天已经签到过了";
  }
  if (msg.includes("insufficient funds")) {
    return "ETH 余额不足以支付 Gas";
  }
  if (msg.includes("nonce")) {
    return "交易 nonce 错误,请刷新页面后重试";
  }
  // 截断过长的错误
  return msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
}
