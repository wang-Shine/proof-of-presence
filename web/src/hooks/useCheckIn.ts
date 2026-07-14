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
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
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
    chainId: ACTIVE_CHAIN_ID, // 显式指定链,不受钱包当前所在链影响
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
/**
 * 拉取最近的历史签到事件
 *
 * 知识点:
 *  - useWatchContractEvent 只监听挂载之后的新事件,进页面前的事件看不到
 *  - 想显示"最近发生了什么"必须主动 getLogs 查一次历史
 *  - Alchemy 免费额度对 block range 有限制(通常 500 块),这里只回溯 1 万块
 *    Sepolia 大概 12 秒一个块 → 10000 块 ≈ 33 小时
 *
 * @param limit 最多返回多少条(倒序)
 */
export function useRecentCheckedIn(limit = 10) {
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN_ID });

  return useQuery({
    queryKey: ["recentCheckedIn", ACTIVE_CHAIN_ID, limit],
    enabled: !!publicClient,
    // 30 秒内不重复拉,配合 useWatchContractEvent 实时补充新事件
    staleTime: 30_000,
    queryFn: async () => {
      if (!publicClient) return [];
      const latest = await publicClient.getBlockNumber();
      // 回溯 1 万个块,够看最近一天多的签到
      const fromBlock = latest > 10_000n ? latest - 10_000n : 0n;

      const logs = await publicClient.getLogs({
        address: CONTRACTS[ACTIVE_CHAIN_ID].checkIn,
        event: parseAbiItem(
          "event CheckedIn(address indexed user, uint256 streak, uint256 reward, uint256 timestamp)",
        ),
        fromBlock,
        toBlock: latest,
      });

      // 倒序(最新的在前),截断
      return logs
        .slice()
        .reverse()
        .slice(0, limit)
        .map((log) => ({
          user: log.args.user!,
          streak: log.args.streak ?? 0n,
          reward: log.args.reward ?? 0n,
          timestamp: log.args.timestamp ?? 0n,
        }));
    },
  });
}

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
    chainId: ACTIVE_CHAIN_ID, // 显式指定 Sepolia,不受钱包当前链影响
    // 走 wagmi transport 的默认策略:配了 WebSocket 就 eth_subscribe 实时推送,
    // 否则自动 fallback 到 HTTP 轮询。见 config/wagmi.ts 里 sepoliaTransport。
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
