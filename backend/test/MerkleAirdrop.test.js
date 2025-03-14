const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MerkleAirdrop", function () {
  let token;
  let merkleAirdrop;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let merkleTree;
  let merkleRoot;
  let leafNodes;
  let leaves;
  let abiCoder;

  before(function () {
    abiCoder =  new ethers.AbiCoder();
  });

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    // Deploy TipMyArt Token
    // owner has all the tokens initially 1.000.000 TMA
    const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
    token = await TipMyArtToken.deploy();
    await token.waitForDeployment();
    //console.log('Owner token balance: ', await token.balanceOf(owner.address));
   
    // Generate Merkle tree
    leaves = [
      { account: addr1.address, amount: ethers.parseEther("1000") },
      { account: addr2.address, amount: ethers.parseEther("2000") },
    ];
    leafNodes = leaves.map((leaf) => keccak256(abiCoder.encode(["address", "uint256"], [leaf.account, leaf.amount])));
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    merkleAirdrop = await MerkleAirdrop.deploy(await token.getAddress(), owner.address);
    await merkleAirdrop.waitForDeployment();

    // Set Merkle root
    await merkleAirdrop.setMerkleRoot(merkleRoot);

    // Transfer all tokens from owner to MerkleAirdrop contract
    const ownerBalance = await token.balanceOf(owner.address);
    await token.transfer(await merkleAirdrop.getAddress(), ownerBalance);
  });

  it("Should set the Merkle root correctly", async function () {
    expect(await merkleAirdrop.merkleRoot()).to.equal(merkleRoot);
  });

  it("Should allow eligible accounts to claim tokens", async function () {
    const leaf = keccak256(abiCoder.encode(["address", "uint256"], [addr1.address, ethers.parseEther("1000")]));
    const proof = merkleTree.getHexProof(leaf);
    await merkleAirdrop.connect(addr1).claim(addr1.address, ethers.parseEther("1000"), proof);

    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));
    expect(await merkleAirdrop.hasClaimed(addr1.address)).to.be.true;
  });

  it("Should reject claims with invalid proof", async function () {
    const leaf = keccak256(abiCoder.encode(["address", "uint256"], [addr1.address, ethers.parseEther("1000")]));
    const proof = merkleTree.getHexProof(leaf);

    await expect(
      merkleAirdrop.connect(addr2).claim(addr2.address, ethers.parseEther("1000"), proof)
    ).to.be.revertedWith("MerkleAirdrop: Invalid proof");
  });

  it("Should reject claims for already claimed accounts", async function () {
    const leaf = keccak256(abiCoder.encode(["address", "uint256"], [addr1.address, ethers.parseEther("1000")]));
    const proof = merkleTree.getHexProof(leaf);

    await merkleAirdrop.connect(addr1).claim(addr1.address, ethers.parseEther("1000"), proof);

    await expect(
      merkleAirdrop.connect(addr1).claim(addr1.address, ethers.parseEther("1000"), proof)
    ).to.be.revertedWith("MerkleAirdrop: Already claimed");
  });

  it("Should allow the owner to withdraw remaining tokens", async function () {

    console.log('MerkleAirdrop token balance before claim: ',ethers.formatEther(await token.balanceOf(await merkleAirdrop.getAddress())));
    console.log('Owner token balance before claim: ', ethers.formatEther(await token.balanceOf(owner.address)));
    // addr1 claims 10 tokens
    const leaf = keccak256(abiCoder.encode(["address", "uint256"], [addr1.address, ethers.parseEther("1000")]));
    const proof = merkleTree.getHexProof(leaf);
    await merkleAirdrop.connect(addr1).claim(addr1.address, ethers.parseEther("1000"), proof);

    // addr2 claims 20 tokens
    const leaf2 = keccak256(abiCoder.encode(["address", "uint256"], [addr2.address, ethers.parseEther("2000")]));
    const proof2 = merkleTree.getHexProof(leaf2);
    await merkleAirdrop.connect(addr2).claim(addr2.address, ethers.parseEther("2000"), proof2);

    console.log('MerkleAirdrop token balance after addr1 and addr2 claims: ', ethers.formatEther(await token.balanceOf(await merkleAirdrop.getAddress())));

    // Withdraw remaining tokens
    await merkleAirdrop.withdrawTokens(owner.address);

    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("997000"));
  });
});