import { ethers } from "hardhat";

async function main() {

   // Deploy TipMyArt Token
   const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
   const tipMyArtToken = await TipMyArtToken.deploy();
   await tipMyArtToken.waitForDeployment();

   // Deploy NFT Collection
   const NFTCollection = await ethers.getContractFactory("NFTCollection");
   const nftCollection = await NFTCollection.deploy();
   await nftCollection.waitForDeployment();

   // Deploy NFT Marketplace
   const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
   const nftMarketplace = await NFTMarketplace.deploy(await tipMyArtToken.getAddress());
   await nftMarketplace.waitForDeployment();

  console.log('TipMyArt address: ' + await tipMyArtToken.getAddress());
  console.log('NFTCollection address: ' + await nftCollection.getAddress());
  console.log('NFTMarketplace address: ' + await nftMarketplace.getAddress());
}

main();