// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract NftGallery is Ownable, ReentrancyGuard {
    enum ListingStatus { Active, Removed }

    struct GalleryItem {
        uint256 itemId;
        address creator;
        address nftContract;
        uint256 tokenId;
        uint256 totalTips;
        ListingStatus status;
    }

    uint256 private _itemCounter = 0;
    mapping(uint256 => GalleryItem) private _items;
    uint256[] private _activeItemIds;
    mapping(uint256 => uint256) private _idToActiveIndex;
    mapping(address => mapping(uint256 => uint256)) private _nftToItemId;

    IERC20 public immutable tipMyArtToken;

    uint256 public platformFeePercent;
    uint256 public totalFees;
    mapping(address => uint256) public creatorEarnings;

    event ItemListed(
        uint256 itemId,
        address creator,
        address nftContract,
        uint256 tokenId
    );

    event ItemTipped(
        address tipper,
        address creator,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event ItemRemoved(uint256 itemId);
    event PlatformFeeUpdated(uint256 newFee);

    constructor(address _tipMyArtToken, uint256 _platformFeePercent) Ownable(msg.sender) {
        tipMyArtToken = IERC20(_tipMyArtToken);
        platformFeePercent = _platformFeePercent;
    }

    function listItem(address nftContract, uint256 tokenId) external nonReentrant {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        // require(
        //     IERC721(nftContract).getApproved(tokenId) == address(this) ||
        //     IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
        //     "Gallery not approved"
        // );
        require(_nftToItemId[nftContract][tokenId] == 0, "NFT already listed");

        _itemCounter++;
        _nftToItemId[nftContract][tokenId] = _itemCounter;

        GalleryItem storage item = _items[_itemCounter];
        item.itemId = _itemCounter;
        item.creator = msg.sender;
        item.nftContract = nftContract;
        item.tokenId = tokenId;
        item.status = ListingStatus.Active;
        item.totalTips = 0;

        _activeItemIds.push(_itemCounter);
        _idToActiveIndex[_itemCounter] = _activeItemIds.length - 1;

        emit ItemListed(_itemCounter, msg.sender, nftContract, tokenId);
    }

    function tipCreator(address nftContract, uint256 tokenId, uint256 amount) external nonReentrant {
        require(amount > 0, "Tip amount must be positive");
        
        uint256 itemId = _nftToItemId[nftContract][tokenId];
        require(itemId != 0, "NFT not listed");
        
        GalleryItem storage item = _items[itemId];
        require(item.status == ListingStatus.Active, "NFT not active");

        uint256 feeAmount = (amount * platformFeePercent) / 10000;
        uint256 creatorAmount = amount - feeAmount;
        address creator = item.creator;

        // Transfer amount tokens from tipper to contract (ex: amount = 1000)
        require(
            IERC20(tipMyArtToken).transferFrom(msg.sender, address(this), amount),
            "TMA transfer failed"
        );
        console.log("creator address: ", creator);
        // Transfer creator's share from contract to creator (ex: creatorAmount = 975)
        // contract keeps the fee (ex: feeAmount = 25)
        require(
            IERC20(tipMyArtToken).transfer(creator, creatorAmount),
            "Creator transfer failed"
        );

        // Update tracking
        item.totalTips += amount;
        creatorEarnings[creator] += creatorAmount;
        totalFees += feeAmount;

        emit ItemTipped(msg.sender, creator, nftContract, tokenId, amount);
    }

    function removeItem(uint256 itemId) external nonReentrant {
        GalleryItem storage item = _items[itemId];
        require(item.status == ListingStatus.Active, "Item not active");
        require(item.creator == msg.sender, "Not creator");

        item.status = ListingStatus.Removed;
        _removeActiveItem(itemId);
        delete _nftToItemId[item.nftContract][item.tokenId];

        emit ItemRemoved(itemId);
    }

    // function getItem(address nftContract, uint256 tokenId) external view returns (GalleryItem memory) {
    //     return _items[_nftToItemId[nftContract][tokenId]];
    // }

    function getItem(address nftContract, uint256 tokenId) external view returns (GalleryItem memory) {
        // Input validation
        // require(nftContract != address(0), "Invalid NFT contract");
        // require(tokenId > 0, "Invalid token ID");

        // Check item existence in mapping
        uint256 itemId = _nftToItemId[nftContract][tokenId];
        require(itemId != 0, "Item not registered");
        
        // Verify item existence in storage
        GalleryItem memory item = _items[itemId];
        // require(item.exists, "Item does not exist");
        // require(item.nftContract == nftContract, "Contract mismatch");
        // require(item.tokenId == tokenId, "Token ID mismatch");

        return item;
    }

    function getAllActiveItems() external view returns (GalleryItem[] memory) {
        GalleryItem[] memory itemsList = new GalleryItem[](_activeItemIds.length);
        for (uint256 i = 0; i < _activeItemIds.length; i++) {
            itemsList[i] = _items[_activeItemIds[i]];
        }
        return itemsList;
    }

    function setPlatformFeePercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 10000, "Fee too high");
        platformFeePercent = newPercent;
        emit PlatformFeeUpdated(newPercent);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFees;
        totalFees = 0;
        require(
            IERC20(tipMyArtToken).transfer(owner(), amount),
            "Fee withdrawal failed"
        );
    }

    function _removeActiveItem(uint256 itemId) private {
        uint256 lastIndex = _activeItemIds.length - 1;
        uint256 index = _idToActiveIndex[itemId];

        if (index != lastIndex) {
            uint256 lastItemId = _activeItemIds[lastIndex];
            _activeItemIds[index] = lastItemId;
            _idToActiveIndex[lastItemId] = index;
        }

        _activeItemIds.pop();
        delete _idToActiveIndex[itemId];
    }
}