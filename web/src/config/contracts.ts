/**
 * 合约地址 + ABI 配置
 *
 * 部署完合约后,把 Deploy.s.sol 输出的地址填到这里
 * 本地 Anvil 和 Sepolia 各一套
 */

import type { Address } from "viem";

// === 当前使用的链 ID ===
// 切到本地 Anvil 用 31337,切到 Sepolia 用 11155111
export const ACTIVE_CHAIN_ID = 31337; // 改成 11155111 部署到 Sepolia

// === 合约地址 ===
// 部署完后从 forge script 的日志里复制过来
export const CONTRACTS: Record<
  number,
  { lbr: Address; badge: Address; checkIn: Address }
> = {
  // 本地 Anvil (Foundry 默认部署地址,每次 anvil 重启可能会变)
  31337: {
    lbr: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    badge: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    checkIn: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  },
  // Sepolia 测试网(部署后填)
  11155111: {
    lbr: "0x0000000000000000000000000000000000000000",
    badge: "0x0000000000000000000000000000000000000000",
    checkIn: "0x0000000000000000000000000000000000000000",
  },
};

// === ABI ===
// 这是从 Solidity 合约编译出来的接口定义
// 实际项目中 forge 编译后从 out/CheckIn.sol/CheckIn.json 复制 abi 字段
// 这里手写 ABI 节选,只列前端会用到的方法
// as const 让 viem/wagmi 能推断出完整的类型

export const checkInAbi = [
  // ===== 写方法 =====
  {
    name: "checkIn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "redeemBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "level", type: "uint8" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },

  // ===== 读方法 =====
  {
    name: "canCheckIn",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getUserStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "lastCheckInDay", type: "uint256" },
      { name: "streak", type: "uint256" },
      { name: "totalCheckIns", type: "uint256" },
      { name: "nextReward", type: "uint256" },
      { name: "canCheckInToday", type: "bool" },
      { name: "lbrBalance", type: "uint256" },
    ],
  },
  {
    name: "badgeCosts",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },

  // ===== 事件 =====
  {
    name: "CheckedIn",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "streak", type: "uint256", indexed: false },
      { name: "reward", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    name: "BadgeRedeemed",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "level", type: "uint8", indexed: false },
      { name: "cost", type: "uint256", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false },
    ],
  },
] as const;

export const lbrAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

export const badgeAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "badgesOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "tokenLevel",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "string" }],
  },
] as const;
