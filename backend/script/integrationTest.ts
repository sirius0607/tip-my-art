import { ethers } from "hardhat";

async function main() {

    const marketplaceAddress: any = process.env[`MARKETPLACE_CONTRACT_ADDRESS_SEPOLIA`];
    const nftAddress: any = process.env[`NFT_CONTRACT_ADDRESS_SEPOLIA`];
    const tipMyArtTokenAddress: any = process.env[`TIP_MY_ART_TOKEN_ADDRESS`];


    const marketplaceContract = await ethers.getContractAt('NFTMarketplace', marketplaceAddress);
    const nftContract = await ethers.getContractAt('NFTCollection', nftAddress);
    //const nftContractAddress = await nftContract.getAddress();

    // Get TipMyArt Token
    const tipMyArtToken = await ethers.getContractAt("TipMyArt", tipMyArtTokenAddress);

    const [seller, buyer] = await ethers.getSigners();

    console.log('seller address: ' + await seller.getAddress());
    console.log('buyer address: ' + await buyer.getAddress());

    // const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
    // // Setup initial token balances
    // await tipMyArtToken.transfer(buyer.address, INITIAL_TOKEN_SUPPLY);

    const tokenId = BigInt("18");
    // approve NFT
    //const approveTx = await nftContract.approve(await marketplaceContract.getAddress(), tokenId);

    const TOKEN_PRICE = ethers.parseEther("100");
    // Approve and List NFT
    // const approveTx = await nftContract.connect(seller).approve(await marketplaceContract.getAddress(), tokenId);
    // await marketplaceContract.connect(seller).listNFT(
    //     await nftContract.getAddress(),
    //     tokenId,
    //     TOKEN_PRICE
    // );
    // // Get Listing from Marketplace
    // const listing = await marketplaceContract.getListing(await nftContract.getAddress(), tokenId);
    // console.log('listing.seller: ' + listing.seller);
    // console.log('listing.price: ' + listing.price);
    // console.log('listing.isActive: ' + listing.isActive);

    // // console.log('approveTx: ' + approveTx);

    // // Buy NFT from Marketplace
    // await tipMyArtToken.connect(buyer).approve(
    //     await marketplaceContract.getAddress(),
    //     TOKEN_PRICE
    // );
    // marketplaceContract.on('NFTListed', async (nftAddress, tokenId, sellerAddress, price) => {
    //     console.log('NFT listed. {nftAddress, tokenId, sellerAddress, price}: ', { nftAddress, tokenId, sellerAddress, price });
    // });


    // marketplaceContract.connect(buyer).buyNFT(await nftContract.getAddress(), tokenId);

    // marketplaceContract.on('NFTSold', async (nftAddress, tokenId, sellerAddress, buyerAddress, price) => {
    //     console.log('NFT Sold. {nftAddress, tokenId, sellerAddress, buyerAddress, price}: ', { nftAddress, tokenId, sellerAddress, buyerAddress, price });
    // });

    // Get NFT Owner
    const buyerAddress = await nftContract.ownerOf(tokenId);
    console.log('buyerAddress: ' + buyerAddress);
}

main();