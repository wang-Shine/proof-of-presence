// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";
import {LBRToken} from "../src/LBRToken.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";

/**
 * @title CheckInTest - 签到合约单元测试
 *
 * 知识点:
 *  1. Foundry 测试 = 继承 Test 合约的 Solidity 合约
 *  2. test_ 开头的函数会被自动识别为测试
 *  3. setUp() 在每个测试前运行,相当于 beforeEach
 *  4. vm 是 Foundry 注入的"作弊码",可以操纵区块链状态
 *
 * 运行: forge test -vv (-vv 显示日志, -vvv 显示 trace)
 */
contract CheckInTest is Test {
    LBRToken token;
    BadgeNFT badge;
    CheckIn checkIn;

    address alice = makeAddr("alice"); // makeAddr 生成确定性地址
    address bob = makeAddr("bob");

    function setUp() public {
        // 1. 部署 LBR 代币
        token = new LBRToken();

        // 2. 部署 NFT 徽章
        badge = new BadgeNFT();

        // 3. 部署签到合约
        checkIn = new CheckIn(address(token), address(badge));

        // 4. 把签到合约加入 LBR 的 minter 白名单
        token.setMinter(address(checkIn), true);

        // 5. 把签到合约设为 NFT 的 minter
        badge.setMinter(address(checkIn));

        // 6. 把链时间推到一个真实的 Unix 时间戳
        //    Foundry 默认 block.timestamp = 1,会让 _currentDay() 算出 0,
        //    与新用户的 lastCheckInDay 默认 0 相等,导致首次签到就被判为"今天已签"
        vm.warp(1_700_000_000); // 2023-11-14
    }

    /// 测试基本签到流程
    function test_CheckIn_FirstTime() public {
        vm.prank(alice); // 下一笔交易模拟由 alice 发起
        checkIn.checkIn();

        (
            ,
            uint256 streak,
            uint256 totalCheckIns,
            ,
            bool canCheckInToday,
            uint256 lbrBalance
        ) = checkIn.getUserStatus(alice);

        assertEq(streak, 1, "first check-in should have streak=1");
        assertEq(totalCheckIns, 1);
        assertEq(canCheckInToday, false, "should not be able to check in again today");
        assertEq(lbrBalance, 10 ether, "first reward should be 10 LBR");
    }

    /// 测试同一天不能重复签到
    function test_Revert_When_AlreadyCheckedIn() public {
        vm.prank(alice);
        checkIn.checkIn();

        vm.prank(alice);
        vm.expectRevert(CheckIn.AlreadyCheckedInToday.selector);
        checkIn.checkIn();
    }

    /// 测试连续签到 7 天的奖励递增
    function test_StreakRewards() public {
        for (uint256 day = 1; day <= 7; day++) {
            vm.prank(alice);
            checkIn.checkIn();
            // 时间推进 1 天(skip 是 forge-std 的封装,等价于 vm.warp(block.timestamp + t))
            skip(1 days);
        }

        (, uint256 streak, uint256 total, , , uint256 balance) = checkIn
            .getUserStatus(alice);

        assertEq(streak, 7, "streak should max at 7");
        assertEq(total, 7);
        // 累计奖励: 10 + 15 + 20 + 25 + 30 + 35 + 40 = 175 LBR
        assertEq(balance, 175 ether);
    }

    /// 测试中断后 streak 重置
    function test_StreakBreaks_OnSkippedDay() public {
        vm.prank(alice);
        checkIn.checkIn();

        // 跳过 2 天
        vm.warp(block.timestamp + 2 days);

        vm.prank(alice);
        checkIn.checkIn();

        (, uint256 streak, , , , ) = checkIn.getUserStatus(alice);
        assertEq(streak, 1, "streak should reset");
    }

    /// 测试 NFT 兑换流程
    function test_RedeemBadge() public {
        // 先签到 10 次拿够 LBR
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(alice);
            checkIn.checkIn();
            skip(1 days);
        }

        uint256 balanceBefore = token.balanceOf(alice);
        assertGe(balanceBefore, 100 ether, "should have enough LBR");

        // ★ 关键步骤:approve
        // 用户必须先授权 CheckIn 合约花他的 LBR
        vm.prank(alice);
        token.approve(address(checkIn), 100 ether);

        // 兑换 1 级徽章
        vm.prank(alice);
        uint256 tokenId = checkIn.redeemBadge(1);

        assertEq(badge.ownerOf(tokenId), alice, "alice should own the badge");
        assertEq(badge.tokenLevel(tokenId), 1);
        assertEq(token.balanceOf(alice), balanceBefore - 100 ether);
    }

    /// 测试 LBR 不够时无法兑换
    function test_Revert_When_InsufficientBalance() public {
        vm.prank(alice);
        checkIn.checkIn(); // 只签 1 次,余额 10 LBR

        vm.prank(alice);
        token.approve(address(checkIn), 100 ether);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                CheckIn.InsufficientBalance.selector,
                100 ether,
                10 ether
            )
        );
        checkIn.redeemBadge(1);
    }
}
