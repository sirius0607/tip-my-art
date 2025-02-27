const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftGallery", function () {
    let nftGallery;
    let nftCollection;
    let tipMyArtToken;
    let owner;
    let creator;
    let tipper;

    const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
    const TIP_AMOUNT = ethers.parseEther("100");
    const PLATFORM_FEE_PERCENT = 250; // 2.5%

    beforeEach(async function () {
        // Get signers
        [owner, creator, tipper] = await ethers.getSigners();

        // Deploy TipMyArt Token
        const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
        tipMyArtToken = await TipMyArtToken.deploy();
        await tipMyArtToken.waitForDeployment();

        // Deploy NFT Collection
        const NFTCollection = await ethers.getContractFactory("NFTCollection");
        nftCollection = await NFTCollection.deploy();
        await nftCollection.waitForDeployment();

        // Deploy NftGallery
        const NftGallery = await ethers.getContractFactory("NftGallery");
        nftGallery = await NftGallery.deploy(await tipMyArtToken.getAddress(), PLATFORM_FEE_PERCENT);
        await nftGallery.waitForDeployment();

        // Setup initial token balances
        await tipMyArtToken.transfer(tipper.address, INITIAL_TOKEN_SUPPLY);

        // Mint NFT for creator
        await nftCollection.safeMint(creator.address, "ipfs://test");
    });

    describe("Deployment", function () {
        it("Should set the correct TipMyArt token address", async function () {
            expect(await nftGallery.tipMyArtToken()).to.equal(await tipMyArtToken.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await nftGallery.owner()).to.equal(owner.address);
        });

        it("Should set the correct platform fee percentage", async function () {
            expect(await nftGallery.platformFeePercent()).to.equal(PLATFORM_FEE_PERCENT);
        });
    });

    describe("Listing NFTs", function () {
        beforeEach(async function () {
            // Approve gallery for NFT transfer
            await nftCollection.connect(creator).approve(await nftGallery.getAddress(), 0);
        });

        it("Should list NFT successfully", async function () {
            await expect(nftGallery.connect(creator).listItem(
                await nftCollection.getAddress(),
                0
            )).to.emit(nftGallery, "ItemListed")
                .withArgs(1, creator.address, await nftCollection.getAddress(), 0);

            const items = await nftGallery.getAllActiveItems();
            expect(items.length).to.equal(1);
            expect(items[0].creator).to.equal(creator.address);
            expect(items[0].nftContract).to.equal(await nftCollection.getAddress());
            expect(items[0].tokenId).to.equal(0);
            expect(items[0].status).to.equal(0); // Active
        });

        it("Should revert if not NFT owner", async function () {
            await expect(
                nftGallery.connect(tipper).listItem(await nftCollection.getAddress(), 0)
            ).to.be.revertedWith("Not NFT owner");
        });

        it("Should revert if NFT already listed", async function () {
            await nftGallery.connect(creator).listItem(
                await nftCollection.getAddress(),
                0
            );
            await expect(
                nftGallery.connect(creator).listItem(await nftCollection.getAddress(), 0)
            ).to.be.revertedWith("NFT already listed");
        });
    });

    describe("Tipping NFTs", function () {
        beforeEach(async function () {
            // List NFT
            await nftGallery.connect(creator).listItem(
                await nftCollection.getAddress(),
                0
            );

            // Approve gallery for token spending
            await tipMyArtToken.connect(tipper).approve(
                await nftGallery.getAddress(),
                TIP_AMOUNT
            );
        });

        it("Should tip creator successfully", async function () {
            await expect(
                nftGallery.connect(tipper).tipCreator(
                    await nftCollection.getAddress(),
                    0,
                    TIP_AMOUNT
                )
            ).to.emit(nftGallery, "ItemTipped")
                .withArgs(
                    tipper.address,
                    creator.address,
                    await nftCollection.getAddress(),
                    0,
                    TIP_AMOUNT
                );

            // Check token transfers
            const platformFee = (TIP_AMOUNT * BigInt(await nftGallery.platformFeePercent())) / BigInt(10000);
            expect(await tipMyArtToken.balanceOf(await nftGallery.getAddress())).to.equal(platformFee);
            expect(await tipMyArtToken.balanceOf(creator.address)).to.equal(TIP_AMOUNT - platformFee);
        });

        it("Should revert if tip amount is zero", async function () {
            await expect(
                nftGallery.connect(tipper).tipCreator(
                    await nftCollection.getAddress(),
                    0,
                    0
                )
            ).to.be.revertedWith("Tip amount must be positive");
        });

        it("Should revert if NFT not listed", async function () {
            await expect(
                nftGallery.connect(tipper).tipCreator(
                    await nftCollection.getAddress(),
                    1,
                    TIP_AMOUNT
                )
            ).to.be.revertedWith("NFT not listed");
        });
    });

    describe("Removing NFTs", function () {
        beforeEach(async function () {
            await nftCollection.connect(creator).approve(await nftGallery.getAddress(), 0);
            await nftGallery.connect(creator).listItem(
                await nftCollection.getAddress(),
                0
            );
        });

        it("Should remove NFT successfully", async function () {
            await expect(
                nftGallery.connect(creator).removeItem(1)
            ).to.emit(nftGallery, "ItemRemoved")
                .withArgs(1);

            const items = await nftGallery.getAllActiveItems();
            expect(items.length).to.equal(0);
        });

        it("Should revert if not creator", async function () {
            await expect(
                nftGallery.connect(tipper).removeItem(1)
            ).to.be.revertedWith("Not creator");
        });

        it("Should revert if item not active", async function () {
            await nftGallery.connect(creator).removeItem(1);
            await expect(
                nftGallery.connect(creator).removeItem(1)
            ).to.be.revertedWith("Item not active");
        });
    });

    describe("Platform fee management", function () {
        it("Should update platform fee", async function () {
            const newFee = 300; // 3%
            await expect(nftGallery.setPlatformFeePercent(newFee))
                .to.emit(nftGallery, "PlatformFeeUpdated")
                .withArgs(newFee);

            expect(await nftGallery.platformFeePercent()).to.equal(newFee);
        });

        it("Should revert if fee too high", async function () {
            await expect(nftGallery.setPlatformFeePercent(11000))
                .to.be.revertedWith("Fee too high");
        });

        it("Should revert if not owner", async function () {
            await expect(nftGallery.connect(tipper).setPlatformFeePercent(300))
                .to.be.revertedWithCustomError(nftGallery, "OwnableUnauthorizedAccount");
        });

        it("Should withdraw fees", async function () {
            // List NFT
            await nftCollection.connect(creator).approve(await nftGallery.getAddress(), 0);
            await nftGallery.connect(creator).listItem(
                await nftCollection.getAddress(),
                0
            );

            // Approve gallery for token spending
            await tipMyArtToken.connect(tipper).approve(
                await nftGallery.getAddress(),
                TIP_AMOUNT
            );

            // Tip creator
            await nftGallery.connect(tipper).tipCreator(
                await nftCollection.getAddress(),
                0,
                TIP_AMOUNT
            );

            const platformFee = (TIP_AMOUNT * BigInt(await nftGallery.platformFeePercent())) / BigInt(10000);
            expect(await nftGallery.totalFees()).to.equal(platformFee);

            // Withdraw fees
            await expect(nftGallery.withdrawFees())
                .to.emit(tipMyArtToken, "Transfer")
                .withArgs(await nftGallery.getAddress(), owner.address, platformFee);

            expect(await nftGallery.totalFees()).to.equal(0);
            expect(await tipMyArtToken.balanceOf(owner.address)).to.equal(platformFee);
        });
    });
});
