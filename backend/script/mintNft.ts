import { ethers } from "hardhat";

async function main() {
  try {
    // Deploy NFT Collection
    // const NFTCollection = await ethers.getContractFactory("NFTCollection");
    // const nftCollection = await NFTCollection.deploy();
    // await nftCollection.waitForDeployment();

    const nftAddress: any = process.env[`NFT_COLLECTION_TIPMYART_SEPOLIA`];
    const nftCollection = await ethers.getContractAt('NFTCollection', nftAddress);
    console.log('NFTCollection address: ', nftCollection.target);

    //const [account1, accountBlast] = await ethers.getSigners();
    //console.log('AccountBlast address: ', await accountBlast.getAddress());
    const signer0 = await ethers.provider.getSigner(0);
    // Mint covcat NFT for AccountBlast
    // https://visible-sapphire-turkey.myfilebase.com/ipfs/QmT663BFXG5LSVy6JvvUUfCVmzjSuSSq5whuZBeE6crDio
    //const tokenId = await mintNft(nftCollection, await signer0.getAddress(), "https://ipfs.io/ipfs/QmT663BFXG5LSVy6JvvUUfCVmzjSuSSq5whuZBeE6crDio");
    const tokenId = await mintNft(nftCollection, await signer0.getAddress(), "https://visible-sapphire-turkey.myfilebase.com/ipfs/QmT663BFXG5LSVy6JvvUUfCVmzjSuSSq5whuZBeE6crDio");
    console.log('Minted Token ID:', tokenId);
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

async function mintNft(nftCollection: any, creatorAddress: string, metadataUrl: string) {
  try {
    // Mint NFT for creator
    console.log('Mint nft for ' + creatorAddress);
    const mintTx = await nftCollection.safeMint(creatorAddress, metadataUrl);
    const receipt = await mintTx.wait();

    // Extract the `Transfer` event from the transaction receipt
    const event = receipt!.logs.find((log: { topics: string[]; }) => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
    if (!event) {
      throw new Error('Transfer event not found in transaction receipt');
    }

    // The third argument of the Transfer event is the minted token ID
    const tokenId = BigInt(event!.topics[3]);
    return tokenId;
  } catch (error) {
    console.error('Error in mintNft function:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Error in script execution:', error);
  process.exitCode = 1;
});