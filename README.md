# Web3 Check-in Demo

> 💡 **这是一个学习型项目，不用于生产环境**

一个**完整的、最小的、教学向**的全栈 Web3 DApp 演示项目，专为前端开发者学习区块链集成而设计。

## 📖 项目简介

这是一个基于以太坊的去中心化应用（DApp），实现了完整的**签到奖励 + NFT 徽章兑换**系统：

- 🎯 **核心功能**：用户每日链上签到获得 ERC20 代币奖励，消耗代币兑换不同等级的 ERC721 NFT 徽章
- 📚 **学习目的**：覆盖 DApp 开发的核心知识点，包括钱包连接、智能合约交互、交易生命周期管理、事件监听等
- 🛠️ **技术栈**：Next.js 16 + React 19 + wagmi v2 + viem + Solidity 0.8.24 + Foundry
- ⚠️ **重要说明**：仅用于本地开发学习，所有操作在 Anvil 本地链上进行，不涉及真实资金

## 🎯 适合人群

- ✅ 已熟悉 React/Next.js 开发
- ✅ 想要学习 Web3 前端开发
- ✅ 对智能合约和钱包交互了解薄弱
- ✅ 需要一个完整的 DApp 参考项目

## 🚀 快速开始

### 前置要求

确保你已安装以下工具：

| 工具 | 版本 | 用途 | 安装指南 |
|------|------|------|---------|
| Node.js | 20+ | 运行前端 | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | 包管理器 | `npm i -g pnpm` |
| Foundry | 最新 | 合约开发工具链 | 见下方 |
| MetaMask | 最新 | 浏览器钱包插件 | [metamask.io](https://metamask.io) |

#### 安装 Foundry

**Windows 用户**：在 Git Bash 中执行
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**验证安装**：
```bash
forge --version
```

### 启动项目（三步走）

#### 1️⃣ 启动本地区块链

新开终端 1：
```bash
anvil
```

Anvil 会：
- 在 `http://127.0.0.1:8545` 启动本地以太坊节点
- 自动创建 10 个测试账户，每个账户 10000 ETH
- 打印测试账户的私钥（⚠️ **仅限本地测试使用**）

**📝 记下第一个账户的私钥**，下一步部署合约时需要用到。

#### 2️⃣ 部署智能合约

新开终端 2，进入合约目录：
```bash
cd contracts

# 安装依赖
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# 编译合约
forge build

# 运行测试（可选，验证合约逻辑）
forge test -vv

# 部署到本地链
# 将 <YOUR_PRIVATE_KEY> 替换为 anvil 打印的第一个私钥
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key <YOUR_PRIVATE_KEY>
```

部署成功后，会看到三个合约地址：
```
LBR Token: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Badge NFT: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CheckIn:   0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

> 💡 **提示**：Anvil 的部署地址是确定性的，默认配置已写在代码中，无需手动修改。

#### 3️⃣ 启动前端

新开终端 3，进入 web 目录：
```bash
cd web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

浏览器访问 **http://localhost:3000**

### 配置 MetaMask

在使用前需要将 MetaMask 连接到本地链：

1. **添加网络**：
   - 打开 MetaMask → 网络下拉 → "添加网络" → "手动添加"
   - **网络名称**：`Anvil Local`
   - **RPC URL**：`http://127.0.0.1:8545`
   - **链 ID**：`31337`
   - **货币符号**：`ETH`

2. **导入测试账户**：
   - MetaMask 右上角 → "导入账户"
   - 粘贴 anvil 打印的第一个私钥

3. **切换到 Anvil Local 网络**，余额应显示 10000 ETH

### 开始使用

在 http://localhost:3000 页面：

1. 点击右上角 **"Connect Wallet"** 连接 MetaMask
2. 点击 **"立即签到"** 按钮
3. 在 MetaMask 弹窗中确认交易
4. 等待几秒，签到成功后余额增加 10 LBR
5. 继续签到积累代币，兑换 NFT 徽章

---

## 💡 学习要点

### 你能学到什么

业务虽简单，但覆盖了 **DApp 前端 90% 的核心技术点**：

| 知识点 | 在项目中怎么体现 |
|--------|------------------|
| ✅ 钱包连接 / 多链切换 | `ConnectButton` + Reown AppKit |
| ✅ 读合约 view 函数 | `useReadContract` 查签到状态 |
| ✅ 写合约交易 | `useWriteContract` 触发签到 |
| ✅ 交易生命周期 | `useWaitForTransactionReceipt` 追踪确认 |
| ✅ 事件监听 | `useWatchContractEvent` WebSocket 订阅 |
| ✅ Multicall 批量读 | `useReadContracts` 一次性查多个 tokenLevel |
| ✅ ERC20 标准 | `transfer` / `balanceOf` / `decimals` |
| ✅ approve + transferFrom 两步授权 | 兑换 NFT 时 |
| ✅ ERC721 NFT | mint / ownerOf / tokenURI |
| ✅ 错误处理 | 钱包拒绝、Gas 不足、合约 revert 翻译 |
| ✅ BigInt / wei 单位换算 | `parseUnits` / `formatUnits` |
| ✅ ABI / encode / decode | viem 类型化合约调用 |
| ✅ 自定义本地链 (Anvil) | wagmi config 加 chainId 31337 |

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
│       └── Deploy.s.sol               一键部署脚本
│
└── web/                              Next.js 16 前端
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
    │   │   └── ActivityFeed.tsx        实时事件流
    │   ├── config/
    │   │   ├── wagmi.ts                wagmi + Reown 配置
    │   │   └── contracts.ts            合约地址 + ABI
    │   └── hooks/
    │       ├── useCheckIn.ts           签到读写 + 事件
    │       ├── useToken.ts             ERC20 操作
    │       └── useBadge.ts             NFT 操作
    └── package.json
```

---

## ⚠️ 免责声明

本项目仅用于学习和教学目的，不应用于生产环境。所有智能合约均未经过安全审计，请勿在主网使用或存入真实资金。

---

## 📄 License

MIT License - 可自由使用、修改和分发。
