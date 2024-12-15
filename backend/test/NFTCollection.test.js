const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTCollection", function () {
    let nftCollection;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy NFTCollection
        const NFTCollection = await ethers.getContractFactory("NFTCollection");
        nftCollection = await NFTCollection.deploy();
        await nftCollection.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await nftCollection.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await nftCollection.name()).to.equal("TipMyArt NFT");
            expect(await nftCollection.symbol()).to.equal("TMANFT");
        });
    });

    describe("Minting", function () {
        const tokenURI = "ipfs://QmTest";

        it("Should mint a new token with correct URI", async function () {
            await nftCollection.safeMint(addr1.address, tokenURI);
            expect(await nftCollection.ownerOf(0)).to.equal(addr1.address);
            expect(await nftCollection.tokenURI(0)).to.equal(tokenURI);
        });

        it("Should increment token IDs correctly", async function () {
            await nftCollection.safeMint(addr1.address, tokenURI);
            await nftCollection.safeMint(addr2.address, tokenURI + "2");
            
            expect(await nftCollection.ownerOf(0)).to.equal(addr1.address);
            expect(await nftCollection.ownerOf(1)).to.equal(addr2.address);
        });

        it("Should emit Transfer event", async function () {
            await expect(nftCollection.safeMint(addr1.address, tokenURI))
                .to.emit(nftCollection, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, 0);
        });
    });

    describe("Token URI", function () {
        it("Should revert when querying non-existent token", async function () {
            await expect(nftCollection.tokenURI(0))
                .to.be.revertedWithCustomError(nftCollection, "ERC721NonexistentToken");
        });
    });

    describe("Enumerable", function () {
        beforeEach(async function () {
            // Mint some tokens
            await nftCollection.safeMint(addr1.address, "uri1");
            await nftCollection.safeMint(addr1.address, "uri2");
            await nftCollection.safeMint(addr2.address, "uri3");
        });

        it("Should track total supply", async function () {
            expect(await nftCollection.totalSupply()).to.equal(3);
        });

        it("Should return correct token by index", async function () {
            expect(await nftCollection.tokenByIndex(0)).to.equal(0);
            expect(await nftCollection.tokenByIndex(1)).to.equal(1);
            expect(await nftCollection.tokenByIndex(2)).to.equal(2);
        });

        it("Should return correct token of owner by index", async function () {
            expect(await nftCollection.tokenOfOwnerByIndex(addr1.address, 0)).to.equal(0);
            expect(await nftCollection.tokenOfOwnerByIndex(addr1.address, 1)).to.equal(1);
            expect(await nftCollection.tokenOfOwnerByIndex(addr2.address, 0)).to.equal(2);
        });
    });
}); 