// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LBRToken} from "./LBRToken.sol";
import {BadgeNFT} from "./BadgeNFT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CheckIn - 签到主合约
 * @notice 每日签到 → 获得 LBR 代币 → 兑换 NFT 徽章
 *
 * ============= 核心知识点 =============
 *  1. 状态变量 vs 局部变量:状态变量永久存在链上,局部变量只在函数执行期间存在
 *  2. mapping:键值对存储,key 不会被存(只存哈希),所以查询省 Gas
 *  3. block.timestamp:当前区块时间戳,矿工可小幅操纵(~15 秒)
 *  4. require vs revert:失败时全部回滚,Gas 退还剩余部分
 *  5. event:链下可订阅的日志,前端实时刷新就靠它
 *  6. external vs public:external 只能外部调用,public 内外都行,external 更省 Gas
 */
contract CheckIn is Ownable {
    // ==================== 状态变量 ====================

    LBRToken public immutable rewardToken; // immutable 表示部署后不可改,只能 constructor 赋值
    BadgeNFT public immutable badge;

    // 每天的奖励基数:10 LBR
    uint256 public constant BASE_REWARD = 10 ether; // ether 是单位字面量 = 10^18

    // 连续签到的最大计数(超过 7 天封顶)
    uint256 public constant MAX_STREAK_DAYS = 7;

    // 兑换徽章需要消耗的 LBR(对应 3 个等级)
    uint256[3] public badgeCosts = [
        100 ether, // 1 级:普通
        500 ether, // 2 级:稀有
        2000 ether // 3 级:史诗
    ];

    struct UserInfo {
        uint256 lastCheckInDay; // 上次签到是哪一天(unix 日)
        uint256 streak; // 当前连续签到天数
        uint256 totalCheckIns; // 总签到次数
    }

    mapping(address => UserInfo) public userInfo;

    // ==================== 事件 ====================

    event CheckedIn(
        address indexed user,
        uint256 streak,
        uint256 reward,
        uint256 timestamp
    );

    event BadgeRedeemed(
        address indexed user,
        uint8 level,
        uint256 cost,
        uint256 tokenId
    );

    // ==================== 错误(Solidity 0.8.4+ 的 custom error,比 require string 省 Gas)====================

    error AlreadyCheckedInToday();
    error InsufficientBalance(uint256 required, uint256 actual);
    error InvalidLevel(uint8 level);

    // ==================== 构造函数 ====================

    constructor(address _token, address _badge) Ownable(msg.sender) {
        rewardToken = LBRToken(_token);
        badge = BadgeNFT(_badge);
    }

    // ==================== 核心函数 ====================

    /**
     * @notice 每日签到
     * @dev 调用方式:用户钱包直接调用,无需任何参数
     */
    function checkIn() external {
        UserInfo storage info = userInfo[msg.sender]; // storage:引用,改了会同步到链上
        uint256 today = _currentDay();

        // 检查今天是否已签到
        if (info.lastCheckInDay == today) {
            revert AlreadyCheckedInToday(); // 比 require 省 Gas
        }

        // 更新连续签到天数
        if (info.lastCheckInDay == today - 1) {
            // 昨天也签了 → 连续
            info.streak = info.streak < MAX_STREAK_DAYS
                ? info.streak + 1
                : MAX_STREAK_DAYS;
        } else {
            // 中断了 → 重置为 1
            info.streak = 1;
        }

        info.lastCheckInDay = today;
        info.totalCheckIns += 1;

        // 计算奖励:基础 + 连续奖励
        // 连续 1 天 = 10 LBR
        // 连续 7 天 = 10 + 6*5 = 40 LBR
        uint256 reward = BASE_REWARD + (info.streak - 1) * 5 ether;

        // 调用 LBR 合约 mint
        // 注意:CheckIn 合约必须被加入 LBR 的 minters 白名单
        rewardToken.mint(msg.sender, reward);

        emit CheckedIn(msg.sender, info.streak, reward, block.timestamp);
    }

    /**
     * @notice 用 LBR 兑换 NFT 徽章
     * @param level 徽章等级:1=普通, 2=稀有, 3=史诗
     *
     * 重要知识点:这里演示了"销毁代币兑换 NFT"模式
     *  1. 用户先 approve 这个合约花他的 LBR(在前端单独调用)
     *  2. 这个合约调 transferFrom 把 LBR 转走(销毁地址 = address(0xdead))
     *  3. 调 BadgeNFT.mint 铸造 NFT 给用户
     */
    function redeemBadge(uint8 level) external returns (uint256 tokenId) {
        if (level < 1 || level > 3) revert InvalidLevel(level);

        uint256 cost = badgeCosts[level - 1];
        uint256 balance = rewardToken.balanceOf(msg.sender);

        if (balance < cost) {
            revert InsufficientBalance(cost, balance);
        }

        // 销毁用户的 LBR:转到 0xdead 地址(eth 社区约定的"黑洞地址")
        // 前提:用户已经 approve 过 CheckIn 合约,允许它花 cost 数量的 LBR
        bool success = rewardToken.transferFrom(
            msg.sender,
            address(0x000000000000000000000000000000000000dEaD),
            cost
        );
        require(success, "Transfer failed");

        // 铸造 NFT
        tokenId = badge.mint(msg.sender, level);

        emit BadgeRedeemed(msg.sender, level, cost, tokenId);
    }

    // ==================== 只读查询函数 ====================

    /**
     * @notice 查询用户能否签到
     * @dev view 函数不耗 Gas,前端直接读取
     */
    function canCheckIn(address user) external view returns (bool) {
        return userInfo[user].lastCheckInDay < _currentDay();
    }

    /**
     * @notice 查询用户的完整状态(一次调用拿全部信息,省 RPC 请求)
     * @dev 返回多个值时使用 tuple,前端 destructure 接收
     */
    function getUserStatus(
        address user
    )
        external
        view
        returns (
            uint256 lastCheckInDay,
            uint256 streak,
            uint256 totalCheckIns,
            uint256 nextReward,
            bool canCheckInToday,
            uint256 lbrBalance
        )
    {
        UserInfo memory info = userInfo[user];
        uint256 today = _currentDay();
        bool canCheck = info.lastCheckInDay < today;

        // 计算下次签到能拿多少
        uint256 nextStreak;
        if (info.lastCheckInDay == today - 1) {
            nextStreak = info.streak < MAX_STREAK_DAYS
                ? info.streak + 1
                : MAX_STREAK_DAYS;
        } else {
            nextStreak = 1;
        }

        return (
            info.lastCheckInDay,
            info.streak,
            info.totalCheckIns,
            BASE_REWARD + (nextStreak - 1) * 5 ether,
            canCheck,
            rewardToken.balanceOf(user)
        );
    }

    /**
     * @notice 当前 unix 日(从 1970-01-01 算起的天数)
     * @dev internal 函数只能合约内部调用
     */
    function _currentDay() internal view returns (uint256) {
        return block.timestamp / 1 days; // 1 days = 86400 秒
    }

    // ==================== 管理员函数 ====================

    function updateBadgeCost(uint8 level, uint256 cost) external onlyOwner {
        require(level >= 1 && level <= 3, "invalid level");
        badgeCosts[level - 1] = cost;
    }
}
