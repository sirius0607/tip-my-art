'use client';

import { useState } from 'react';
import { useContractWrite, useTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { NFT_MARKETPLACE_ADDRESS } from '@/config/contracts';
import { nftMarketplaceABI } from '@/config/abis';
import Link from 'next/link';

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

  const { write: buyNFT, data: buyData } = useContractWrite({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: nftMarketplaceABI,
    functionName: 'buyNFT',
  });

  useTransaction({
    hash: buyData?.hash,
    onSuccess() {
      toast.success('NFT purchased successfully!');
      setIsLoading(false);
    },
    onError() {
      toast.error('Error purchasing NFT');
      setIsLoading(false);
    },
  });

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      await buyNFT({
        args: [nft.tokenId, parseEther(nft.price)],
      });
    } catch (error) {
      toast.error('Error purchasing NFT');
      setIsLoading(false);
    }
  };

  return (
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
  );
} 