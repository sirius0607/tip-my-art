import { keccak256 } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { TipMyArt } from "../typechain-types";
import { ERC20Airdrop } from "../typechain-types";

async function main() {

    // get test accounts
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy TipMyArt Token
    const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
    const tipMyArtToken: TipMyArt = await TipMyArtToken.deploy();
    await tipMyArtToken.waitForDeployment();

    console.log('owner initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(owner.address)));

    // Deploy Airdrop contract
    const AirdropFactory = await ethers.getContractFactory("ERC20Airdrop");
    const airdrop: ERC20Airdrop = await AirdropFactory.deploy(tipMyArtToken.target);
    await airdrop.waitForDeployment();

    //await tipMyArtToken.mint(airdrop.target, REGULAR_AMOUNT);
    // Transfer all tokens from owner to MerkleAirdrop contract
    const ownerBalance = await tipMyArtToken.balanceOf(owner.address);
    //await tipMyArtToken.transfer(airdrop.target, ownerBalance);
    await tipMyArtToken.transfer(airdrop.target, ethers.parseEther("899000"));

    console.log('airdrop initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(airdrop.target)));
    console.log('addr1 initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(addr1.address)));
    console.log('addr2 initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(addr2.address)));

    // Addr1 claims 1000 tokens
    await airdrop.connect(addr1).claim();

    console.log('addr1 balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(addr1.address)));

    // build white list with addr2 and addr3
    const whitelistAddresses = [
        addr2.address,
        addr3.address
    ];
    const leaves = whitelistAddresses.map(addr => keccak256(addr));
    // Generate Merkle tree of eligible addresses
    const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });
    const merkleRoot = merkleTree.getHexRoot();
    // set merkle root in airdrop contract
    await airdrop.setMerkleRoot(merkleRoot);

    // addr2 claims 2000 tokens
    const leaf = keccak256(addr2.address);
    const proof: string[] = merkleTree.getHexProof(leaf);
    await airdrop.connect(addr2).claimWhitelist(proof);

    console.log('addr2 balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(addr2.address)));

    console.log('final airdrop balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(airdrop.target)));
    console.log('owner  balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(owner.address)));
    
    // Addr1 claims again and should fail
    try {
        await airdrop.connect(addr1).claim();
    } catch (error) {
        if (error instanceof Error) {
            console.log('addr1 claim failed as expected:', error.message);
        } else {
            console.log(error);
        }
    }
}

main();