import { ethers } from "hardhat";

const dogsMetadataUrl = 'https://ipfs.io/ipfs/Qma1wY9HLfdWbRr1tDPpVCfbtPPvjnai1rEukuqSxk6PWb?filename=undefined'

interface ListingData {
    seller: string;
    price: string;
    isActive: boolean;
  }

  interface Listings {
    nftContracts: string[];
    tokenIds: bigint[];
    activeListings: ListingData[];
  }

async function main() {

   // Deploy TipMyArt Token
   const TipMyArtToken = await ethers.getContractFactory("TipMyArt");
   const tipMyArtToken = await TipMyArtToken.deploy();
   await tipMyArtToken.waitForDeployment();

  //  // Deploy NFT Collection
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

  // get test accounts
  const [seller, buyer] = await ethers.getSigners();

  console.log('Seller address: ' + await seller.getAddress());
  console.log('Buyer address: ' + await buyer.getAddress());

  // Mint NFT for seller
  console.log('Mint nft for ' + await seller.getAddress());
  const mintTx = await nftCollection.safeMint(seller.address, dogsMetadataUrl);
  const receipt = await mintTx.wait();
  // get minted token id
    // const event = mintTx.events.find(x => x.event === 'ProposalCreated');
    // const tokenId = (await mintTx.wait())!.events[0].args[2].toBigInt();
    // const tokenId = await getMintedTokenId(mintTx);
    // const receipt = await mintTx.wait();
    const event = receipt!.logs.find(log => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
    //console.log("event: ", event);
    const tokenId = BigInt(event!.topics[3]);

    // // Extract the `Transfer` event from the transaction receipt
    // const transferEvent = receipt!.events[0]?.find((event) => event.event === "Transfer");
    // if (!transferEvent) {
    //   throw new Error("Transfer event not found in transaction receipt");
    // }

    // // The third argument of the Transfer event is the minted token ID
    // const tokenId = transferEvent.args?.tokenId;
    console.log("Minted Token ID:", tokenId);

    const TOKEN_PRICE = ethers.parseEther("100");

     // Approve and List NFT
    const approveTx = await nftCollection.connect(seller).approve(await nftMarketplace.getAddress(), tokenId);
    await nftMarketplace.connect(seller).listNFT(
        await nftCollection.getAddress(),
        tokenId,
        TOKEN_PRICE
    );
    // Get Listing from Marketplace
    const listing = await nftMarketplace.getListing(await nftCollection.getAddress(), tokenId);
    console.log('listing.seller: ' + listing.seller);
    console.log('listing.price: ' + listing.price);
    console.log('listing.isActive: ' + listing.isActive);

     // Get all Listings from Marketplace
     const listings: any = await nftMarketplace.getAllListings();
     console.log('listings.nftContracts: ' + listings.nftContracts);
     listings.activeListings.map((activeListing: any) => {
        console.log('listings.seller: ' + activeListing.seller);
        console.log('listings.price: ' + activeListing.price);
        console.log('listings.isActive: ' + activeListing.isActive);
    });
 
     console.log('listings: ', listings);

     // read events
    //  const receipt1 = await tx1.wait();
    //  const event = receipt1.events.find(x => x.event === 'ProposalCreated');
    //  const { proposalId } = event.args;
    //  console.log("proposalId = ", proposalId.toString());
}

async function getMintedTokenId (transaction: any) {
    const transactionResult = await transaction.wait()
    const event = transactionResult.events[0]
    const value = event.args[2]
    return value.toNumber()
}

main();