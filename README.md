# Web3 Check-in Demo

> 💡 **这是一个学习型项目，不用于生产环境**

一个**完整的、最小的、教学向**的全栈 Web3 DApp 演示项目，专为前端开发者学习区块链集成而设计。已部署到 Sepolia 测试网 + Vercel，可直接在线体验。

## 📖 项目简介

这是一个基于以太坊的去中心化应用（DApp），实现了完整的**签到奖励 + NFT 徽章兑换**系统：

- 🎯 **核心功能**：用户每日链上签到获得 ERC20 代币奖励，消耗代币兑换不同等级的 ERC721 NFT 徽章
- 📚 **学习目的**：覆盖 DApp 开发的核心知识点，包括钱包连接、智能合约交互、交易生命周期管理、事件监听等
- 🛠️ **技术栈**：Next.js 16 + React 19 + wagmi v2 + viem + Reown AppKit + Solidity 0.8.24 + Foundry
- 🌐 **运行链**：Sepolia 测试网（部署地址见 `web/src/config/contracts.ts`）
- ⚠️ **重要说明**：仅用于学习演示，测试网代币无价值，不涉及真实资金

## 🎯 适合人群

- ✅ 已熟悉 React/Next.js 开发
- ✅ 想要学习 Web3 前端开发
- ✅ 对智能合约和钱包交互了解薄弱
- ✅ 需要一个完整的 DApp 参考项目

## 🚀 快速开始

有三种方式使用本项目，按投入递增：

### 方式 A：直接体验线上版本

1. 打开 Vercel 部署的地址（部署完成后自行填入）
2. 用 MetaMask（或任意支持 WalletConnect 的钱包）连接
3. 把钱包切到 **Sepolia** 网络
4. 到 [Sepolia Faucet](https://sepoliafaucet.com/) 领点测试 ETH 用于付 Gas
5. 点"立即签到"体验完整流程

### 方式 B：本地运行前端（连 Sepolia 上的合约）

前端跑在本地，读写的是我已经部署在 Sepolia 上的合约，无需自己部署合约。

#### 前置要求

| 工具 | 版本 | 用途 | 安装指南 |
|------|------|------|---------|
| Node.js | 20+ | 运行前端 | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | 包管理器 | `npm i -g pnpm` |
| MetaMask | 最新 | 浏览器钱包插件 | [metamask.io](https://metamask.io) |

#### 申请两个免费 key

| 名称 | 用途 | 申请地址 |
|---|---|---|
| Reown Project ID | 钱包连接协议标识 | [cloud.reown.com](https://cloud.reown.com) |
| Alchemy Sepolia RPC URL | 稳定的链上读写节点（公共 RPC 经常限流） | [dashboard.alchemy.com](https://dashboard.alchemy.com) |

> 💡 两个都有免费额度，注册各 1 分钟。

#### 启动步骤

```bash
# 1. 安装依赖
cd web
pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你上一步申请的两个 key

# 3. 启动开发服务器
pnpm dev
```

浏览器访问 **http://localhost:3000**，连接钱包并切换到 Sepolia 网络即可使用。

#### `.env.local` 变量说明

```bash
# 必填：Reown Cloud 的 Project ID
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# 强烈建议填：Alchemy Sepolia RPC，不填走公共节点容易 401/429
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key

# 可选：站点 URL（本地开发可省略，用默认 http://localhost:3000）
NEXT_PUBLIC_APP_URL=
```

### 方式 C：自己部署合约到 Sepolia

如果你想改合约代码或部署一套完全属于自己的实例，需要 Foundry。

#### 安装 Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version   # 验证
```

#### 部署到 Sepolia

```bash
cd contracts

# 安装依赖
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# 编译 & 测试
forge build
forge test -vv

# 配置部署密钥（不要用主网钱包！新建一个测试钱包）
cp .env.example .env
# 编辑 .env：填入 PRIVATE_KEY（测试钱包）、SEPOLIA_RPC_URL、ETHERSCAN_API_KEY

# 部署 + 自动验证到 Etherscan
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

部署成功后：
1. 从日志复制三个合约地址（`LBR`、`Badge`、`CheckIn`）
2. 更新 `web/src/config/contracts.ts` 里 `11155111` 那一段的地址

> ⚠️ **安全提醒**：
> - `.env` 已在 `.gitignore` 里，不要 commit
> - 部署用的钱包只放 Sepolia 测试 ETH，绝不放主网资产

## ☁️ 部署到 Vercel

前端在 `web/` 子目录，Vercel 需要指定 Root Directory。

1. **推 GitHub**：`git push`
2. **导入到 Vercel**：New Project → 选中仓库 → **Root Directory 设为 `web`**
3. **环境变量**（三个都要勾 `Production`）：
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_REOWN_PROJECT_ID` | Reown Project ID |
   | `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Alchemy Sepolia URL |
   | `NEXT_PUBLIC_APP_URL` | 部署后 Vercel 分配的域名，如 `https://xxx.vercel.app` |
4. **Deploy**
5. **回 Reown Cloud**：在 Project 的 **Allowed Domains** 里加上 Vercel 域名，否则钱包连接会被拒绝

之后每次 `git push` 到 main 会自动重新部署，改环境变量后需要手动触发一次 **Redeploy** 才能生效。

---

## 💡 学习要点

业务虽简单，但覆盖了 **DApp 前端 90% 的核心技术点**：

| 知识点 | 在项目中怎么体现 |
|--------|------------------|
| ✅ 钱包连接 / 多链切换 | `ConnectButton` + Reown AppKit |
| ✅ 显式 chainId 读合约 | 所有 `useReadContract` 都锁定 Sepolia，不受钱包当前链影响 |
| ✅ 读合约 view 函数 | `useReadContract` 查签到状态 |
| ✅ 写合约交易 | `useWriteContract` 触发签到 |
| ✅ 交易生命周期 | `useWaitForTransactionReceipt` 追踪确认 |
| ✅ 历史事件查询 | `publicClient.getLogs` 拉最近区块的 `CheckedIn` |
| ✅ 实时事件监听 | `useWatchContractEvent` 轮询新事件 |
| ✅ Multicall 批量读 | `useReadContracts` 一次性查多个 tokenLevel |
| ✅ ERC20 标准 | `transfer` / `balanceOf` / `decimals` |
| ✅ approve + transferFrom 两步授权 | 兑换 NFT 时 |
| ✅ ERC721 NFT | mint / ownerOf / tokenURI |
| ✅ 错误处理 | 钱包拒绝、Gas 不足、合约 revert 翻译 |
| ✅ BigInt / wei 单位换算 | `parseUnits` / `formatUnits` |
| ✅ ABI / encode / decode | viem 类型化合约调用 |
| ✅ SSR 友好的 wagmi 配置 | cookie storage + `ssr: true`，刷新自动重连 |

---

## 🏗️ 项目结构

```
web3-checkin-demo/
├── contracts/                       Foundry 合约工程
│   ├── foundry.toml                  Foundry 配置
│   ├── remappings.txt                导入路径别名
│   ├── src/
│   │   ├── LBRToken.sol               ERC20 奖励代币
│   │   ├── BadgeNFT.sol               ERC721 徽章
│   │   └── CheckIn.sol                签到主合约
│   ├── test/
│   │   └── CheckIn.t.sol              Foundry 单元测试
│   └── script/
│       └── Deploy.s.sol               一键部署脚本(支持本地+Sepolia)
│
└── web/                              Next.js 16 前端
    ├── .env.example                  环境变量模板
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx              根布局
    │   │   ├── page.tsx                主页(组合所有组件)
    │   │   ├── providers.tsx           Wagmi + AppKit + Query 提供者
    │   │   └── globals.css             全局样式
    │   ├── components/
    │   │   ├── ConnectButton.tsx       钱包连接
    │   │   ├── CheckInCard.tsx         签到面板(完整交易生命周期)
    │   │   ├── ExchangePanel.tsx       兑换面板(approve + redeem)
    │   │   ├── BadgeGallery.tsx        NFT 展示(useReadContracts)
    │   │   └── ActivityFeed.tsx        历史 + 实时事件流
    │   ├── config/
    │   │   ├── wagmi.ts                wagmi + Reown 配置
    │   │   └── contracts.ts            合约地址 + ABI
    │   └── hooks/
    │       ├── useCheckIn.ts           签到读写 + 历史 + 实时事件
    │       ├── useToken.ts             ERC20 操作
    │       └── useBadge.ts             NFT 操作
    └── package.json
```