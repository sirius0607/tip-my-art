// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    IERC20 public immutable tipMyArtToken;
    
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }
    
    // NFT Contract => Token ID => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeePercentage = 250; // 2.5%
    
    event NFTListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event NFTUnlisted(address indexed nftContract, uint256 indexed tokenId, address indexed seller);
    event PlatformFeeUpdated(uint256 newFee);

    constructor(address _tipMyArtToken) Ownable(msg.sender) {
        tipMyArtToken = IERC20(_tipMyArtToken);
    }

    function listNFT(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(IERC721(nftContract).getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit NFTListed(nftContract, tokenId, msg.sender, price);
    }

    function buyNFT(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isActive, "NFT not listed");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - platformFee;

        // Transfer payment token from buyer to seller and platform
        require(tipMyArtToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Payment failed");
        if (platformFee > 0) {
            require(tipMyArtToken.transferFrom(msg.sender, owner(), platformFee), "Platform fee transfer failed");
        }

        // Transfer NFT to buyer
        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Remove listing
        delete listings[nftContract][tokenId];

        emit NFTSold(nftContract, tokenId, listing.seller, msg.sender, listing.price);
    }

    function unlistNFT(address nftContract, uint256 tokenId) external {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isActive, "NFT not listed");
        require(listing.seller == msg.sender, "Not the seller");

        delete listings[nftContract][tokenId];
        emit NFTUnlisted(nftContract, tokenId, msg.sender);
    }

    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    function getListing(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (address seller, uint256 price, bool isActive) 
    {
        Listing memory listing = listings[nftContract][tokenId];
        return (listing.seller, listing.price, listing.isActive);
    }
} 