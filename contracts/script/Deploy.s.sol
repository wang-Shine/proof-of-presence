// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {LBRToken} from "../src/LBRToken.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";
import {CheckIn} from "../src/CheckIn.sol";

/**
 * @title Deploy - 一键部署 3 个合约并完成初始化
 *
 * 使用:
 *   本地 anvil:  forge script script/Deploy.s.sol --rpc-url anvil --broadcast --private-key <key>
 *   Sepolia:    forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --private-key $PRIVATE_KEY --verify
 *
 * 部署后会打印 3 个合约地址,记得复制到前端的 web/src/config/contracts.ts
 */
contract Deploy is Script {
    function run() external {
        vm.startBroadcast(); // 后续操作都会被打包成真实交易

        // 1. 部署 LBR 代币
        LBRToken token = new LBRToken();
        console.log("LBR Token:", address(token));

        // 2. 部署 NFT 徽章
        BadgeNFT badge = new BadgeNFT();
        console.log("Badge NFT:", address(badge));

        // 3. 部署签到主合约
        CheckIn checkIn = new CheckIn(address(token), address(badge));
        console.log("CheckIn:  ", address(checkIn));

        // 4. 授权 CheckIn 合约铸造 LBR 和 NFT
        token.setMinter(address(checkIn), true);
        badge.setMinter(address(checkIn));

        // 5. 设置 NFT 元数据 baseURI(可选,使用 IPFS 真实图片时需要换)
        badge.setBaseURI("https://raw.githubusercontent.com/libercex-demo/badges/main/");

        vm.stopBroadcast();
    }
}
