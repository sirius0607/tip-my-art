import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { ERC20Airdrop, TipMyArt } from "../typechain-types";

describe("ERC20Airdrop", function () {
    let airdrop: ERC20Airdrop;
    let token: TipMyArt;
    let owner: HardhatEthersSigner;
    let user1: HardhatEthersSigner;
    let user2: HardhatEthersSigner;
    let whitelistedUser: HardhatEthersSigner;
    let merkleTree: MerkleTree;
    let validProof: string[];
    let invalidProof: string[];

    const DECIMALS = 18;
    const REGULAR_AMOUNT = ethers.parseUnits("1000", DECIMALS);
    const WHITELIST_AMOUNT = ethers.parseUnits("2000", DECIMALS);

    before(async () => {
        [owner, user1, user2, whitelistedUser] = await ethers.getSigners();

        // Deploy tipMyArt token
        const TipMyArtFactory = await ethers.getContractFactory("TipMyArt");
        token = await TipMyArtFactory.deploy();
        await token.waitForDeployment();

        // Deploy Airdrop contract
        const AirdropFactory = await ethers.getContractFactory("ERC20Airdrop");
        airdrop = await AirdropFactory.deploy(await token.getAddress());
        await airdrop.waitForDeployment();

        // Setup Merkle Tree
        const whitelistAddresses = [
            whitelistedUser.address,
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        ];

        const leaves = whitelistAddresses.map(addr => keccak256(addr));
        merkleTree = new MerkleTree(leaves, keccak256, { sort: true });
        validProof = merkleTree.getHexProof(keccak256(whitelistedUser.address));
        invalidProof = merkleTree.getHexProof(keccak256(user1.address));
    });

    describe("Deployment", () => {
        it("Should set correct token address", async () => {
            expect(await airdrop.token()).to.equal(await token.getAddress());
        });

        it("Should set correct airdrop amounts", async () => {
            expect(await airdrop.airdropAmount()).to.equal(REGULAR_AMOUNT);
            expect(await airdrop.whitelistAmount()).to.equal(WHITELIST_AMOUNT);
        });

        it("Should initialize with empty Merkle root", async () => {
            expect(await airdrop.merkleRoot()).to.equal(ethers.ZeroHash);
        });
    });

    describe("Regular Claims", () => {
        it("Should allow claiming regular airdrop", async () => {
            await token.mint(await airdrop.getAddress(), REGULAR_AMOUNT);

            await expect(airdrop.connect(user1).claim())
                .to.emit(token, "Transfer")
                .withArgs(await airdrop.getAddress(), user1.address, REGULAR_AMOUNT);

            expect(await token.balanceOf(user1.address)).to.equal(REGULAR_AMOUNT);
            expect(await airdrop.hasClaimed(user1.address)).to.be.true;
        });

        it("Should prevent double claiming", async () => {
            await expect(airdrop.connect(user1).claim())
                .to.be.revertedWith("Already claimed");
        });
    });

    describe("Whitelist Claims", () => {
        before(async () => {
            await airdrop.setMerkleRoot(merkleTree.getHexRoot());
            await token.mint(await airdrop.getAddress(), WHITELIST_AMOUNT);
        });

        it("Should allow whitelisted user to claim", async () => {
            await expect(airdrop.connect(whitelistedUser).claimWhitelist(validProof))
                .to.emit(token, "Transfer")
                .withArgs(await airdrop.getAddress(), whitelistedUser.address, WHITELIST_AMOUNT);

            expect(await token.balanceOf(whitelistedUser.address)).to.equal(WHITELIST_AMOUNT);
        });

        it("Should reject invalid Merkle proof", async () => {
            await expect(airdrop.connect(user2).claimWhitelist(invalidProof))
                .to.be.revertedWith("Invalid proof");
        });

        it("Should prevent whitelist claim without root set", async () => {
            await airdrop.setMerkleRoot(ethers.ZeroHash);
            await expect(airdrop.connect(whitelistedUser).claimWhitelist(validProof))
                .to.be.revertedWith("Merkle root not set");
        });
    });

    describe("Admin Functions", () => {
        it("Should allow owner to withdraw tokens", async () => {
            const balance = await token.balanceOf(await airdrop.getAddress());
            await expect(airdrop.connect(owner).withdrawTokens())
                .to.emit(token, "Transfer")
                .withArgs(await airdrop.getAddress(), owner.address, balance);

            expect(await token.balanceOf(await airdrop.getAddress())).to.equal(0);
        });

        it("Should prevent non-owners from withdrawing", async () => {
            await expect(airdrop.connect(user1).withdrawTokens())
                //.to.be.revertedWith("Ownable: caller is not the owner");
                .to.be.revertedWithCustomError(airdrop, "OwnableUnauthorizedAccount");
        });

        it("Should allow owner to update Merkle root", async () => {
            const newRoot = ethers.hexlify(ethers.randomBytes(32));
            await airdrop.setMerkleRoot(newRoot);
            expect(await airdrop.merkleRoot()).to.equal(newRoot);
        });
    });

    describe("Edge Cases", () => {
        it("Should handle zero-balance withdrawal", async () => {
            await expect(airdrop.connect(owner).withdrawTokens())
                .to.not.reverted;
        });

        it("Should reject invalid token implementations", async () => {
            const MaliciousToken = await ethers.getContractFactory("MaliciousERC20");
            const badToken = await MaliciousToken.deploy();

            const AirdropFactory = await ethers.getContractFactory("ERC20Airdrop");
            await expect(
                AirdropFactory.deploy(badToken.target)
            ).to.be.revertedWith("Invalid decimals");
        });
    });
});