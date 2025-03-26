'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryItem } from "@/types/GalleryItem";
import { Nft } from "alchemy-sdk";
import Link from 'next/link';
import { useState } from 'react';
import { formatEther } from "viem";
import moment from 'moment';

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
  const nft: Nft = nFTCard.nft;
  const item: GalleryItem = nFTCard.item;
  const totalTips = item?.totalTips ? formatEther(item.totalTips) : '0';
  let formattedDate = '';
  if (item) {
    const timestamp = Number(item?.listingDate) * 1000;
    formattedDate = moment(timestamp).format('MMMM Do YYYY, h:mm:ss a');
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{nft.name}</CardTitle>
          <p className="text-sm text-gray-500">{nft.contract?.name}</p>
          {item && <p className="text-xs text-gray-400">{formattedDate}</p>}
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
      </Card>
    </>
  );
}
