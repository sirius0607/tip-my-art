'use client';

import { useEffect, useState } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { NFTCard } from './NFTCard';
import { NFT_COLLECTION_ADDRESS } from '@/config/contracts';
import { nftCollectionABI } from '@/config/abis';
import { readContract } from 'viem/actions';
import {Alchemy, Network} from 'alchemy-sdk';

// Optional Config object, but defaults to demo api-key and eth-mainnet.
// const settings = {
//   apiKey: process.env.ALCHEMY_API_KEY_SEPOLIA, // Replace with your Alchemy API Key.
//   network: "sepolia", // Replace with your network.
// };

const configSepolia = {
  apiKey: process.env.ALCHEMY_API_KEY_SEPOLIA,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(configSepolia);

interface NFTListProps {
  searchTerm: string;
  ownerOnly?: boolean;
}

export function NFTList({ searchTerm, ownerOnly }: NFTListProps) {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<any[]>([]);
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);


  async function getNFTsForOwner(userAddress: any) {
    // const config = {
    //   apiKey: 'dvnNOOIQNmOKRwq_6EM8CDTwDYtEID1U',
    //   network: Network.ETH_MAINNET,
    // };
    // const configSepolia = {
    //   apiKey: 'Wv0dFwEX_xueX5Lj-Byexpdh-IEXWGKh',
    //   network: Network.ETH_SEPOLIA,
    // };
  
    // const alchemy = new Alchemy(configSepolia);
    let ownerAddress;
    // Check if the input is an ENS name
    if (userAddress.endsWith('.eth')) {
      // Resolve ENS name to address
      ownerAddress = await alchemy.core.resolveName(userAddress);
      if (!ownerAddress) {
        throw new Error('Unable to resolve ENS name');
      }
    } else {
      // Assume the userAddress is already an Ethereum address
      ownerAddress = userAddress;
    }
  
    const data = await alchemy.nft.getNftsForOwner(ownerAddress);
    console.log(data);
    setResults(data);
  
    const tokenDataPromises = [];
  
    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }
  
    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }

  // const { data: totalSupply } = useContractRead({
  //   address: NFT_COLLECTION_ADDRESS,
  //   abi: nftCollectionABI,
  //   functionName: 'totalSupply',
  // });

  // Fetch NFTs
  useEffect(() => {

    if(address) {
      getNFTsForOwner(address);
    }
    
    // const fetchNFTs = async () => {
    //   if (!totalSupply) return;
      
    //   const nftPromises = [];

    //   for (let i = 0; i < Number(totalSupply); i++) {
    //     nftPromises.push(fetchNFTData(i));
    //   }
      
    //   const nftData = await Promise.all(nftPromises);
    //   setNfts(nftData.filter(nft => nft !== null));
    // };

    //fetchNFTs();
  //}, [totalSupply, address]);
  }, []);

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !ownerOnly || nft.owner === address;
    return matchesSearch && matchesOwner;
  });

  return (
    hasQueried ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {tokenDataObjects.map((nft) => (
          <NFTCard key={nft.tokenId} nft={nft} />
        ))}
      </div>
  ) : (
    'Loading...'
  )
)
} 

async function fetchNFTData(i: number) {
  try {
    const tokenId = BigInt(i);
    const owner = await readContract({
      address: NFT_COLLECTION_ADDRESS,
      abi: nftCollectionABI, 
      functionName: 'ownerOf',
      args: [tokenId]
    });

    const tokenURI = await readContract({
      address: NFT_COLLECTION_ADDRESS,
      abi: nftCollectionABI,
      functionName: 'tokenURI', 
      args: [tokenId]
    });

    const response = await fetch(tokenURI as string);
    const metadata = await response.json();

    const isListed = await readContract({
      address: NFT_MARKETPLACE_ADDRESS,
      abi: nftMarketplaceABI,
      functionName: 'isListed',
      args: [tokenId]
    });

    const listing = isListed ? await readContract({
      address: NFT_MARKETPLACE_ADDRESS, 
      abi: nftMarketplaceABI,
      functionName: 'getListing',
      args: [tokenId]
    }) : null;

    return {
      tokenId: i.toString(),
      name: metadata.name,
      image: metadata.image,
      owner,
      isListed,
      price: listing ? formatEther(listing.price) : '0',
      seller: listing?.seller
    };

  } catch (error) {
    console.error(`Error fetching NFT ${i}:`, error);
    return null;
  }
}
