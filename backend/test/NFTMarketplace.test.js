const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
    let nftMarketplace;
    let nftCollection;
    let tipMyArtToken;
    let owner;
    let seller;
    let buyer;
    let platformFeeReceiver;

    const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
    const TOKEN_PRICE = ethers.parseEther("100");
    const PLATFORM_FEE = 250; // 2.5%

    beforeEach(async function () {
        // Get signers
        [owner, seller, buyer, platformFeeReceiver] = await ethers.getSigners();

        // Deploy TipMyArt Token
        const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
        tipMyArtToken = await TipMyArtToken.deploy();
        await tipMyArtToken.waitForDeployment();

        // Deploy NFT Collection
        const NFTCollection = await ethers.getContractFactory("NFTCollection");
        nftCollection = await NFTCollection.deploy();
        await nftCollection.waitForDeployment();

        // Deploy NFT Marketplace
        const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
        nftMarketplace = await NFTMarketplace.deploy(await tipMyArtToken.getAddress());
        await nftMarketplace.waitForDeployment();

        // Setup initial token balances
        await tipMyArtToken.transfer(buyer.address, INITIAL_TOKEN_SUPPLY);

        // Mint NFT for seller
        await nftCollection.safeMint(seller.address, "ipfs://test");
    });

    describe("Deployment", function () {
        it("Should set the correct TipMyArt token address", async function () {
            expect(await nftMarketplace.tipMyArtToken()).to.equal(await tipMyArtToken.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await nftMarketplace.owner()).to.equal(owner.address);
        });

        it("Should set the correct platform fee", async function () {
            expect(await nftMarketplace.platformFeePercentage()).to.equal(PLATFORM_FEE);
        });
    });

    describe("Listing NFTs", function () {
        beforeEach(async function () {
            // Approve marketplace for NFT transfer
            await nftCollection.connect(seller).approve(await nftMarketplace.getAddress(), 0);
        });

        it("Should list NFT successfully", async function () {
            await expect(nftMarketplace.connect(seller).listNFT(
                await nftCollection.getAddress(),
                0,
                TOKEN_PRICE
            )).to.emit(nftMarketplace, "NFTListed")
              .withArgs(await nftCollection.getAddress(), 0, seller.address, TOKEN_PRICE);

            const listing = await nftMarketplace.getListing(await nftCollection.getAddress(), 0);
            expect(listing.seller).to.equal(seller.address);
            expect(listing.price).to.equal(TOKEN_PRICE);
            expect(listing.isActive).to.be.true;
        });

        it("Should revert if price is zero", async function () {
            await expect(
                nftMarketplace.connect(seller).listNFT(await nftCollection.getAddress(), 0, 0)
            ).to.be.revertedWith("Price must be greater than zero");
        });

        it("Should revert if not owner", async function () {
            await expect(
                nftMarketplace.connect(buyer).listNFT(await nftCollection.getAddress(), 0, TOKEN_PRICE)
            ).to.be.revertedWith("Not the owner");
        });
    });

    describe("Buying NFTs", function () {
        beforeEach(async function () {
            // List NFT
            await nftCollection.connect(seller).approve(await nftMarketplace.getAddress(), 0);
            await nftMarketplace.connect(seller).listNFT(
                await nftCollection.getAddress(),
                0,
                TOKEN_PRICE
            );

            // Approve marketplace for token spending
            await tipMyArtToken.connect(buyer).approve(
                await nftMarketplace.getAddress(),
                TOKEN_PRICE
            );
        });

        it("Should complete purchase successfully", async function () {
            const platformFee = TOKEN_PRICE * BigInt(PLATFORM_FEE) / BigInt(10000);
            const sellerAmount = TOKEN_PRICE - platformFee;

            await expect(
                nftMarketplace.connect(buyer).buyNFT(await nftCollection.getAddress(), 0)
            ).to.emit(nftMarketplace, "NFTSold")
             .withArgs(
                await nftCollection.getAddress(),
                0,
                seller.address,
                buyer.address,
                TOKEN_PRICE
             );

            // Check NFT ownership
            expect(await nftCollection.ownerOf(0)).to.equal(buyer.address);

            // Check token transfers
            expect(await tipMyArtToken.balanceOf(seller.address)).to.equal(sellerAmount);
            expect(await tipMyArtToken.balanceOf(owner.address)).to.equal(platformFee);
        });

        it("Should revert if NFT not listed", async function () {
            await expect(
                nftMarketplace.connect(buyer).buyNFT(await nftCollection.getAddress(), 1)
            ).to.be.revertedWith("NFT not listed");
        });

        it("Should revert if buyer is seller", async function () {
            await expect(
                nftMarketplace.connect(seller).buyNFT(await nftCollection.getAddress(), 0)
            ).to.be.revertedWith("Cannot buy your own NFT");
        });
    });

    describe("Unlisting NFTs", function () {
        beforeEach(async function () {
            await nftCollection.connect(seller).approve(await nftMarketplace.getAddress(), 0);
            await nftMarketplace.connect(seller).listNFT(
                await nftCollection.getAddress(),
                0,
                TOKEN_PRICE
            );
        });

        it("Should unlist successfully", async function () {
            await expect(
                nftMarketplace.connect(seller).unlistNFT(await nftCollection.getAddress(), 0)
            ).to.emit(nftMarketplace, "NFTUnlisted")
             .withArgs(await nftCollection.getAddress(), 0, seller.address);

            const listing = await nftMarketplace.getListing(await nftCollection.getAddress(), 0);
            expect(listing.isActive).to.be.false;
        });

        it("Should revert if not seller", async function () {
            await expect(
                nftMarketplace.connect(buyer).unlistNFT(await nftCollection.getAddress(), 0)
            ).to.be.revertedWith("Not the seller");
        });
    });

    describe("Platform fee management", function () {
        it("Should update platform fee", async function () {
            const newFee = 300; // 3%
            await expect(nftMarketplace.updatePlatformFee(newFee))
                .to.emit(nftMarketplace, "PlatformFeeUpdated")
                .withArgs(newFee);

            expect(await nftMarketplace.platformFeePercentage()).to.equal(newFee);
        });

        it("Should revert if fee too high", async function () {
            await expect(nftMarketplace.updatePlatformFee(1100))
                .to.be.revertedWith("Fee too high");
        });

        it("Should revert if not owner", async function () {
            await expect(nftMarketplace.connect(buyer).updatePlatformFee(300))
                .to.be.revertedWithCustomError(nftMarketplace, "OwnableUnauthorizedAccount");
        });
    });
}); 