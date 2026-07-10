// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LBR Token - 签到奖励代币
 * @notice 一个标准的 ERC20 代币,作为签到系统的积分
 *
 * 知识点:
 *  1. ERC20 是同质化代币标准,所有 USDT/USDC/UNI 都遵循它
 *  2. 继承 OpenZeppelin 的实现,省去重复造轮子
 *  3. Ownable 提供"管理员"机制,只有 owner 能 mint
 *  4. decimals 默认 18 位(和 ETH 一致),意味着 1 LBR = 1 * 10^18 最小单位
 */
contract LBRToken is ERC20, Ownable {
    // 授权可以铸币的地址(签到合约会被加入白名单)
    mapping(address => bool) public minters;

    event MinterUpdated(address indexed minter, bool allowed);

    // constructor(string memory name, string memory symbol) ERC20(name, symbol)
    // Ownable(msg.sender) 表示部署者就是 owner
    constructor() ERC20("LiberCex Reward", "LBR") Ownable(msg.sender) {}

    /**
     * @notice 设置铸币权限
     * @dev 只有 owner 能调用。部署完成后,把 CheckIn 合约地址传进来即可
     */
    function setMinter(address minter, bool allowed) external onlyOwner {
        minters[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    /**
     * @notice 铸造代币(只有白名单地址能调用)
     * @dev modifier 是 Solidity 的"前置检查",reverse 后整笔交易回滚
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "LBR: not a minter");
        _mint(to, amount); // OpenZeppelin 内部的铸币函数
    }
}
