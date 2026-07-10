"use client";

/**
 * ConnectButton - 钱包连接按钮
 *
 * 使用 Reown AppKit 提供的 Web Component <appkit-button />
 * 它会自动渲染成"连接钱包 / 已连接显示地址"的智能按钮
 *
 * 知识点:
 *  - useAccount() 拿当前连接状态
 *  - appkit-button 是 Reown 注入的自定义 HTML 元素,不需要 import
 */

import { useAccount } from "wagmi";

// 声明给 TypeScript 知道 appkit-button 是合法的 JSX 元素
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "appkit-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export default function ConnectButton() {
  const { isConnected, address, chain } = useAccount();

  return (
    <div className="flex items-center gap-3">
      {isConnected && (
        <div className="text-xs text-[#848E9C]">
          <div>链:{chain?.name ?? "未知"}</div>
          <div className="font-mono">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
      )}
      <appkit-button />
    </div>
  );
}
