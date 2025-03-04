'use client';

import { nftGalleryABI } from '@/config/abis';
import { NFT_GALLERY_ADDRESS_SEPOLIA } from '@/config/contracts';
import { GalleryItem } from '@/types/GalleryItem';
import { Alchemy, Network, Nft } from 'alchemy-sdk';
import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { NFTCard } from './NFTCard';

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
  const [tokenDataObjects, setTokenDataObjects] = useState<Nft[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [from, setFrom] = useState('');

  const {
    data: items,
    isPending, 
    isError
  } = useReadContract({
    address: NFT_GALLERY_ADDRESS_SEPOLIA,
    abi: nftGalleryABI,
    functionName: 'getAllActiveItems'
  }) as { data: GalleryItem[]; isPending: boolean; isError: boolean };

  const getNFTsForOwner = async (ownerAddress: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const data = await alchemy.nft.getNftsForOwner(ownerAddress);
      //console.log('NFTs data:', data);

      const tokenDataPromises = data.ownedNfts.map((nft) =>
        alchemy.nft.getNftMetadata(nft.contract.address, nft.tokenId)
      );

      const tokenDataObjectsArray = await Promise.all(tokenDataPromises);
      //console.log('Token data objects:', tokenDataObjectsArray);
      setTokenDataObjects(tokenDataObjectsArray);
      setHasQueried(true);
      setFrom('wallet');
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getListingFromGallery = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('Get all items pending...', isPending);
      console.log('Get all items error:', isError);
      console.log('Nft Gallery items:', items);
      if (items && items.length > 0) {
        const tokenDataPromises = items?.map((item: GalleryItem) =>
          alchemy.nft.getNftMetadata(item.nftContract, item.tokenId)
        );

        const tokenDataObjectsArray = await Promise.all(tokenDataPromises);
        console.log('Token data objects:', tokenDataObjectsArray);
        setTokenDataObjects(tokenDataObjectsArray);
        setHasQueried(true);
        setFrom('gallery');
      }
    } catch (error) {
      console.error('Error fetching gallery items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address && ownerOnly) {
      getNFTsForOwner(address);
    }
  }, [address, ownerOnly]);

  useEffect(() => {
    if (!ownerOnly) {
      getListingFromGallery();
    }
  }, [address, items]);

  const filteredNFTs = tokenDataObjects.filter(nft =>
    nft.name!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Loading...</div>;

  return hasQueried ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredNFTs.map((nft) => (
        <NFTCard
          key={`${nft.contract.address}-${nft.tokenId}`}
          nft={nft}
          item={items.find((item) => item.tokenId === BigInt(nft.tokenId))}
          from={from}
        />
      ))}
    </div>
  ) : (
    <div>No NFTs found</div>
  );
}
