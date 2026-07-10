"use client";

/**
 * useToken - LBR 代币相关 hooks
 *
 * 演示 ERC20 代币的标准操作:
 *  - balanceOf:   查余额
 *  - allowance:   查授权额度
 *  - approve:     授权花费
 *  - transfer:    转账
 *
 * 关键概念:approve + transferFrom 两步授权模式
 *  用户先 approve(spender, amount),允许 spender 花他的代币
 *  然后 spender 调 transferFrom 把代币转走(常用于 DEX、NFT 市场)
 */

import { useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address } from "viem";
import { ACTIVE_CHAIN_ID, CONTRACTS, lbrAbi } from "@/config/contracts";

const lbrAddr = CONTRACTS[ACTIVE_CHAIN_ID].lbr;

/**
 * 查询用户的 LBR 余额
 */
export function useLBRBalance() {
  const { address } = useAccount();

  return useReadContract({
    address: lbrAddr,
    abi: lbrAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * 查询某个 spender 的授权额度
 * 知识点:allowance(owner, spender) 表示 owner 允许 spender 花多少
 *        默认是 0,必须先 approve 才能给别人花
 */
export function useLBRAllowance(spender: Address) {
  const { address } = useAccount();

  return useReadContract({
    address: lbrAddr,
    abi: lbrAbi,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * 发起 approve 交易
 *
 * 用法:
 *   const { approve, isPending, isConfirmed } = useApproveLBR();
 *   approve(spenderAddress, "100"); // 授权 100 LBR
 */
export function useApproveLBR() {
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

  const approve = (spender: Address, amountStr: string) => {
    writeContract({
      address: lbrAddr,
      abi: lbrAbi,
      functionName: "approve",
      // parseUnits 把人类可读的数字 "100" 转换成最小单位 100 * 10^18
      args: [spender, parseUnits(amountStr, 18)],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}

/**
 * LBR 转账
 *
 * 知识点:transfer 是直接转账,不需要 approve
 *        而 transferFrom 是"代花",需要先 approve
 */
export function useTransferLBR() {
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

  const transfer = (to: Address, amountStr: string) => {
    writeContract({
      address: lbrAddr,
      abi: lbrAbi,
      functionName: "transfer",
      args: [to, parseUnits(amountStr, 18)],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}
