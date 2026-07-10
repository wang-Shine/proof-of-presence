"use client";

/**
 * useBadge - NFT 徽章相关 hooks
 *
 * 演示 ERC721 NFT 的核心操作:
 *  - balanceOf:  查持有数量
 *  - badgesOf:   查持有的 tokenId 列表(自定义辅助方法)
 *  - 兑换流程:approve LBR → redeemBadge
 */

import { useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  ACTIVE_CHAIN_ID,
  CONTRACTS,
  badgeAbi,
  checkInAbi,
} from "@/config/contracts";

const badgeAddr = CONTRACTS[ACTIVE_CHAIN_ID].badge;
const checkInAddr = CONTRACTS[ACTIVE_CHAIN_ID].checkIn;

/**
 * 查询用户持有的所有 NFT tokenId
 */
export function useMyBadges() {
  const { address } = useAccount();

  return useReadContract({
    address: badgeAddr,
    abi: badgeAbi,
    functionName: "badgesOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * 查询某个 tokenId 的等级
 */
export function useBadgeLevel(tokenId: bigint | undefined) {
  return useReadContract({
    address: badgeAddr,
    abi: badgeAbi,
    functionName: "tokenLevel",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
}

/**
 * 兑换 NFT 徽章
 *
 * 注意:这一步需要用户先 approve LBR 给 checkIn 合约(在 ExchangePanel 里处理)
 */
export function useRedeemBadge() {
  const queryClient = useQueryClient();
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) queryClient.invalidateQueries();
  }, [isConfirmed, queryClient]);

  const redeem = (level: 1 | 2 | 3) => {
    writeContract({
      address: checkInAddr,
      abi: checkInAbi,
      functionName: "redeemBadge",
      args: [level],
    });
  };

  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}
