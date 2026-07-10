"use client";

/**
 * useCheckIn - 签到相关的合约读写 hooks
 *
 * 这里集中演示 wagmi v2 的几个核心 hook:
 *  - useReadContract:       单个合约 view 函数(自动缓存、自动刷新)
 *  - useWriteContract:      发起一笔写交易(钱包弹窗签名)
 *  - useWaitForTransactionReceipt: 等交易上链确认
 *  - useWatchContractEvent: WebSocket 监听合约事件
 */

import { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  ACTIVE_CHAIN_ID,
  CONTRACTS,
  checkInAbi,
} from "@/config/contracts";

/**
 * 查询用户的完整签到状态
 *
 * 知识点:
 *  - getUserStatus 是一个 view 函数,返回 tuple,wagmi 自动解构成 readonly 数组
 *  - query.enabled 控制只在地址存在时才发起请求
 *  - staleTime 控制缓存时间(配合 Providers 里全局的 30 秒)
 */
export function useUserStatus() {
  const { address } = useAccount();
  const addr = CONTRACTS[ACTIVE_CHAIN_ID].checkIn;

  return useReadContract({
    address: addr,
    abi: checkInAbi,
    functionName: "getUserStatus",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      // 数据返回后处理:把 tuple 变成 object
      select: (data) => ({
        lastCheckInDay: data[0],
        streak: data[1],
        totalCheckIns: data[2],
        nextReward: data[3],
        canCheckInToday: data[4],
        lbrBalance: data[5],
      }),
    },
  });
}

/**
 * 发起签到交易
 *
 * 知识点 - 一笔写交易的完整生命周期:
 *   1. writeContract():  钱包弹窗,等用户点确认
 *   2. data (txHash):    用户确认后立刻返回,但交易还在 mempool
 *   3. isLoading (从 useWaitForTransactionReceipt): 等待打包
 *   4. isSuccess:        交易已上链
 *   5. 上链后要刷新所有相关查询(React Query 的 invalidate)
 */
export function useCheckInTx() {
  const queryClient = useQueryClient();

  // Step 1: 发起交易
  const {
    writeContract,
    data: hash, // 交易哈希,签名后立刻有值
    isPending, // 等待用户在钱包里点确认
    error: writeError,
    reset,
  } = useWriteContract();

  // Step 2: 等待交易确认
  const {
    isLoading: isConfirming, // 已发出,等待打包
    isSuccess: isConfirmed, // 已上链
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  // Step 3: 确认后,让所有相关的读查询自动刷新
  // queryKey 是 wagmi 的内部约定:["readContract", { address, functionName, ... }]
  // 但我们用一个简单粗暴的方式:让 wagmi 域下所有 query 失效
  useEffect(() => {
    if (isConfirmed) {
      queryClient.invalidateQueries();
    }
  }, [isConfirmed, queryClient]);

  const checkIn = () => {
    writeContract({
      address: CONTRACTS[ACTIVE_CHAIN_ID].checkIn,
      abi: checkInAbi,
      functionName: "checkIn",
    });
  };

  return {
    checkIn,
    hash,
    isPending, // 等用户签名
    isConfirming, // 等链上确认
    isConfirmed, // 已成功
    error: writeError || confirmError,
    reset,
  };
}

/**
 * 实时监听 CheckedIn 事件
 *
 * 知识点:
 *  - useWatchContractEvent 底层用 WebSocket 订阅,有新事件立刻触发
 *  - 这里演示"全局监听",不限制 user,可以看到其他人的签到
 *  - 如果只想看自己的:加 args: { user: address }(只有 indexed 字段能 filter)
 *
 * @param onCheckedIn 收到新签到事件时的回调
 */
export function useCheckedInEvents(
  onCheckedIn: (event: {
    user: `0x${string}`;
    streak: bigint;
    reward: bigint;
    timestamp: bigint;
  }) => void,
) {
  useWatchContractEvent({
    address: CONTRACTS[ACTIVE_CHAIN_ID].checkIn,
    abi: checkInAbi,
    eventName: "CheckedIn",
    poll: true,             // 强制走 HTTP 轮询,避开 WebSocket 订阅报错
    pollingInterval: 4_000, // 4 秒查一次新事件
    onLogs(logs) {
      for (const log of logs) {
        // log.args 是解码后的事件参数
        const args = log.args as {
          user?: `0x${string}`;
          streak?: bigint;
          reward?: bigint;
          timestamp?: bigint;
        };
        if (args.user && args.streak !== undefined) {
          onCheckedIn({
            user: args.user,
            streak: args.streak,
            reward: args.reward ?? 0n,
            timestamp: args.timestamp ?? 0n,
          });
        }
      }
    },
  });
}
