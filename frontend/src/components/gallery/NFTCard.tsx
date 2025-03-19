'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryItem } from "@/types/GalleryItem";
import { Nft } from "alchemy-sdk";
import Link from 'next/link';
import { useState } from 'react';
import { formatEther } from "viem";

// interface NFTCardProps {
//   nft: {
//     tokenId: string;
//     name: string;
//     image: string;
//     description?: string;
//     price: string;
//     seller: string;
//     isListed: boolean;
//     contract?: {
//       address: string;
//     };
//   };
// }
interface NFTCardProps {
  nft: Nft;
  from: string;
  item: GalleryItem;
}

export function NFTCard(nFTCard: NFTCardProps) {
  const [isLoading, setIsLoading] = useState(false);
 const nft: Nft = nFTCard.nft;
 const item: GalleryItem = nFTCard.item;
 const totalTips = item?.totalTips ? formatEther(item.totalTips) : '0';

  const handleBuy = async () => {
    setIsLoading(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>{nft.name}</CardTitle>
        <p className="text-sm text-gray-500">{nft.contract?.name}</p>
      </CardHeader>
      <CardContent>
        <Link 
          href={`/nft/${nft.contract?.address}/${nft.tokenId}/${nFTCard.from}`}
          className="block hover:opacity-90 transition-opacity"
        >
          <img
            src={nft.image.originalUrl}
            alt={nft.name}
            className="w-full h-48 object-cover rounded-md cursor-pointer"
          />
        </Link>
        <p className="mt-4">Tip: {totalTips} TMA</p>
      </CardContent>
      <CardFooter>
        {nft.isListed && (
          <Button 
            onClick={handleBuy} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Buy Now'}
          </Button>
        )}
      </CardFooter>
    </Card>
    </>
  );
}