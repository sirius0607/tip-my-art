import { ethers } from "hardhat";

const dogsMetadataUrl = 'https://ipfs.io/ipfs/Qma1wY9HLfdWbRr1tDPpVCfbtPPvjnai1rEukuqSxk6PWb?filename=undefined'
const webArMetadataUrl = 'https://ipfs.io/ipfs/QmSzFfx3rNqdJwSsrFpfMcxZCncaATsCceaFEr6Lmq3VUz?filename=Showing%20off%20WebAR'

enum ListingStatus {
  ACTIVE = 0,
  SOLD = 1,
  CANCELLED = 2
}
interface GalleryItem {
  itemId: BigInt;
  creator: string;
  nftContract: string;
  tokenId: BigInt;
  totalTips: BigInt;
  status: BigInt;
}

async function mintNft(nftCollection: any, creatorAddress: string, metadataUrl: string) {
  // Mint NFT for creator
  console.log('Mint nft for ' + creatorAddress);
  const mintTx = await nftCollection.safeMint(creatorAddress, metadataUrl);
  const receipt = await mintTx.wait();
  // get minted token id
  // Extract the `Transfer` event from the transaction receipt
  const event = receipt!.logs.find((log: { topics: string[]; }) => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
  // The third argument of the Transfer event is the minted token ID
  const tokenId = BigInt(event!.topics[3]);

  console.log("Minted Token ID:", tokenId);
  return tokenId;
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

  // Deploy NFT gallery
  const platformFeePercent: number = 250; // 2.5% in basis points
  const NftGallery = await ethers.getContractFactory("NftGallery");
  const nftGallery = await NftGallery.deploy(await tipMyArtToken.getAddress(), platformFeePercent);
  await nftGallery.waitForDeployment();

  console.log('TipMyArt token address: ' + await tipMyArtToken.getAddress());
  console.log('NFTCollection address: ' + await nftCollection.getAddress());
  console.log('NftGallery address: ' + await nftGallery.getAddress());

  // get test accounts
  const [owner, creator1, creator2, tipper] = await ethers.getSigners();

  console.log('Creator address: ' + await creator1.getAddress());
  console.log('Creator2 address: ' + await creator2.getAddress());
  console.log('Tipper address: ' + await tipper.getAddress());

  // Mint NFT for creators
  const tokenId = await mintNft(nftCollection, await creator1.getAddress(), dogsMetadataUrl);
  const tokenId2 = await mintNft(nftCollection, await creator2.getAddress(), webArMetadataUrl);


  // Approve NFT Gallery to spend creator's erc721 token
  // const approveTx = await nftCollection.connect(creator).approve(await nftGallery.getAddress(), tokenId);
  // List NFT in Gallery
  await nftGallery.connect(creator1).listItem(
    await nftCollection.getAddress(),
    tokenId
  );

  // Approve NFT Gallery to spend creator's erc721 token
  // const approveTx = await nftCollection.connect(creator).approve(await nftGallery.getAddress(), tokenId);
  // List NFT in Gallery
  await nftGallery.connect(creator2).listItem(
    await nftCollection.getAddress(),
    tokenId2
  );

  // 10*10**18
  const TIP_AMOUNT = ethers.parseEther("10");
  const TIP_AMOUNT2 = ethers.parseEther("50");
  console.log('TIP_AMOUNT: ', ethers.formatEther(TIP_AMOUNT));
  console.log('TIP_AMOUNT2: ', ethers.formatEther(TIP_AMOUNT2));
  // 500*10**18
  const TIPPER_TOKEN_AIRDROP = ethers.parseEther("500");
  //const NFTGALLERY_INITIAL_TOKEN_SUPPLY = ethers.parseEther("500");

  console.log('creator balance before receiving tip: ', ethers.formatEther(await tipMyArtToken.balanceOf(creator1.address)));
  // Setup initial token balances for tipper
  await tipMyArtToken.transfer(tipper.address, TIPPER_TOKEN_AIRDROP);
  console.log('tipper balance before tipping: ', ethers.formatEther(await tipMyArtToken.balanceOf(tipper.address)));
  // Setup initial token balances for nft gallery
  //await tipMyArtToken.transfer(await nftGallery.getAddress(), NFTGALLERY_INITIAL_TOKEN_SUPPLY);
  //console.log('Nft gallery balance before receiving tip: ', ethers.formatEther(await tipMyArtToken.balanceOf(await nftGallery.getAddress())));

  // approve NFT Gallery to spend tipper's erc20 token 
  await tipMyArtToken.connect(tipper).approve(
    await nftGallery.getAddress(),
    TIP_AMOUNT
  );
  // Tip Creator 1
  await nftGallery.connect(tipper).tipCreator(
    await nftCollection.getAddress(),
    tokenId,
    TIP_AMOUNT
  );

  // approve NFT Gallery to spend tipper's erc20 token 
  await tipMyArtToken.connect(tipper).approve(
    await nftGallery.getAddress(),
    TIP_AMOUNT2
  );
  // Tip Creator 2
  await nftGallery.connect(tipper).tipCreator(
    await nftCollection.getAddress(),
    tokenId2,
    TIP_AMOUNT2
  );

  console.log('tipper balance after tipping: ', ethers.formatEther(await tipMyArtToken.balanceOf(tipper.address)));
  console.log('creator1 balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(creator1.address)));
  console.log('creator2 balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(creator2.address)));
  console.log('Nft gallery balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(await nftGallery.getAddress())));

  // Get all items from NFT Gallery
  console.log('Get all items from NFT Gallery');
  const items: GalleryItem[] = await nftGallery.getAllActiveItems();
  items.map((item: any) => {
    console.log('item.itemId: ' + item.itemId);
    console.log('item.creator: ' + item.creator);
    console.log('item.nftContract: ' + item.nftContract);
    console.log('item.tokenId: ' + item.tokenId);
    console.log('item.totalTips: ' + ethers.formatEther(item.totalTips));
    console.log('item.status: ' + item.status);

  });

  // get item by nft contract and token id
  console.log('Get item by nft contract and token id', await nftCollection.getAddress(), tokenId2);
  const item: GalleryItem = await nftGallery.connect(creator2).getItem(nftCollection, tokenId2);
  console.log('item.itemId: ' + item.itemId);
  console.log('item.creator: ' + item.creator);
  console.log('item.nftContract: ' + item.nftContract);
  console.log('item.tokenId: ' + item.tokenId);
  console.log('item.totalTips: ' + ethers.formatEther(item.totalTips.toString()));
  console.log('item.status: ' + item.status);

  // get item by nft contract and token id
  console.log('Get item by nft contract and token id', await nftCollection.getAddress(), tokenId);
  const itemCreator1: GalleryItem = await nftGallery.connect(creator1).getItem(nftCollection, tokenId);
  console.log('item.itemId: ' + itemCreator1.itemId);
  console.log('item.creator: ' + itemCreator1.creator);
  console.log('item.nftContract: ' + itemCreator1.nftContract);
  console.log('item.tokenId: ' + itemCreator1.tokenId);
  console.log('item.totalTips: ' + ethers.formatEther(itemCreator1.totalTips.toString()));
  console.log('item.status: ' + itemCreator1.status);

  // unlist nft from gallery
  console.log('Unlist nft from gallery', itemCreator1.itemId);
  await nftGallery.connect(creator1).removeItem(itemCreator1.itemId.toString());

  // Get all items from NFT Gallery
  console.log('Get all items from NFT Gallery');
  const items2: GalleryItem[] = await nftGallery.getAllActiveItems();
  items2.map((item: any) => {
    console.log('item.itemId: ' + item.itemId);
    console.log('item.creator: ' + item.creator);
    console.log('item.nftContract: ' + item.nftContract);
    console.log('item.tokenId: ' + item.tokenId);
    console.log('item.totalTips: ' + ethers.formatEther(item.totalTips));
    console.log('item.status: ' + item.status);

  });
}

main();