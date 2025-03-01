import { ethers } from "hardhat";

async function main() {

  // Deploy TipMyArt Token
  //  const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
  //  const tipMyArtToken = await TipMyArtToken.deploy();
  //  await tipMyArtToken.waitForDeployment();

  //  // Deploy NFT Collection
  //  const NFTCollection = await ethers.getContractFactory("NFTCollection");
  //  const nftCollection = await NFTCollection.deploy();
  //  await nftCollection.waitForDeployment();

  //const tipMyArtToken = await ethers.getContractAt('TipMyArt', NFT_CONTRACT_ADDRESS_SEPOLIA);
  //const nftCollection = await ethers.getContractAt('NFTCollection', NFT_CONTRACT_ADDRESS_SEPOLIA);

  //const marketplaceAddress: any = process.env[`MARKETPLACE_CONTRACT_ADDRESS_SEPOLIA`];

  // redeploy markeplace contract
  const nftAddress: any = process.env[`NFT_CONTRACT_ADDRESS_SEPOLIA`];
  const tipMyArtTokenAddress: any = process.env[`TIP_MY_ART_TOKEN_ADDRESS`];


  //const marketplaceContract = await ethers.getContractAt('NFTMarketplace', marketplaceAddress);
  const nftCollection = await ethers.getContractAt('NFTCollection', nftAddress);
  const tipMyArtToken = await ethers.getContractAt("TipMyArt", tipMyArtTokenAddress);

  // Deploy NFT Marketplace
  // const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  // const nftMarketplace = await NFTMarketplace.deploy(await tipMyArtToken.getAddress());
  // await nftMarketplace.waitForDeployment();

  // Deploy NFT Gallery
  const platformFeePercent: number = 250; // 2.5% in basis points
  const NftGallery = await ethers.getContractFactory("NftGallery");
  const nftGallery = await NftGallery.deploy(await tipMyArtToken.getAddress(), platformFeePercent);
  await nftGallery.waitForDeployment();

  console.log('NftGallery address: ' + await nftGallery.getAddress());
  console.log('TipMyArt address: ' + await tipMyArtToken.getAddress());
  console.log('NFTCollection address: ' + await nftCollection.getAddress());
  //console.log('NFTMarketplace address: ' + await nftMarketplace.getAddress());
}

main();