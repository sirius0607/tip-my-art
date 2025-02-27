'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { useState } from 'react';

interface NFTCardProps {
  nft: {
    tokenId: string;
    name: string;
    image: string;
    description?: string;
    price: string;
    seller: string;
    isListed: boolean;
    contract?: {
      address: string;
    };
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  const [isLoading, setIsLoading] = useState(false);
 
  const handleBuy = async () => {
    setIsLoading(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>{nft.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link 
          href={`/nft/${nft.contract?.address}/${nft.tokenId}`}
          className="block hover:opacity-90 transition-opacity"
        >
          <img 
            src={nft.image.originalUrl} 
            alt={nft.name}
            className="w-full h-48 object-cover rounded-md cursor-pointer"
          />
        </Link>
        <p className="mt-4">Tip: {nft.price ? nft.price : '0'} TMA</p>
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