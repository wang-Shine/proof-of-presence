// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BadgeNFT - 签到徽章
 * @notice 一个 ERC721 NFT,用 LBR 代币兑换
 *
 * 知识点:
 *  1. ERC721 = 非同质化代币(每个 tokenId 独一无二)
 *  2. 每个徽章有不同稀有度,需要不同数量的 LBR 兑换
 *  3. tokenURI 返回元数据 URL(包含图片、属性等),钱包/OpenSea 会读取
 */
contract BadgeNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId; // 下一个要铸造的 tokenId(从 0 开始递增)
    address public minter; // 授权铸造者(CheckIn 合约)
    string public baseURI; // 元数据 baseURI

    // 每个 tokenId 对应的徽章等级 (1=普通, 2=稀有, 3=史诗)
    mapping(uint256 => uint8) public tokenLevel;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint8 level);
    event MinterUpdated(address indexed previousMinter, address indexed newMinter);

    constructor() ERC721("LiberCex Badge", "LBADGE") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        address oldMinter = minter;
        minter = _minter;
        emit MinterUpdated(oldMinter, _minter);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
    }

    /**
     * @notice 铸造徽章
     * @dev 只有 minter(CheckIn 合约)能调用
     */
    function mint(address to, uint8 level) external returns (uint256) {
        require(msg.sender == minter, "Badge: not minter");
        require(level >= 1 && level <= 3, "Badge: invalid level");

        uint256 tokenId = nextTokenId++;
        tokenLevel[tokenId] = level;
        _safeMint(to, tokenId); // OZ 提供的安全铸造方法(接收方是合约时会检查 onERC721Received)

        emit BadgeMinted(to, tokenId, level);
        return tokenId;
    }

    /**
     * @notice 返回 NFT 元数据 URI
     * @dev 钱包和 NFT 市场通过这个 URL 获取图片、名字、属性
     *      格式:baseURI + level + ".json",比如 ipfs://xxx/1.json
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 level = tokenLevel[tokenId];
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, uint256(level).toString(), ".json"))
                : "";
    }

    /**
     * @notice 查询某地址持有的所有徽章 tokenId
     * @dev 注意:链上枚举开销大,生产项目应该用事件 + 链下索引
     *      这里为了 demo 方便提供这个方法
     */
    function badgesOf(address owner) external view returns (uint256[] memory) {
        uint256 total = nextTokenId;
        uint256 balance = balanceOf(owner);
        uint256[] memory ids = new uint256[](balance);
        uint256 idx;
        for (uint256 i = 0; i < total && idx < balance; i++) {
            if (_ownerOf(i) == owner) {
                ids[idx++] = i;
            }
        }
        return ids;
    }
}
