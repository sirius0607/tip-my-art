'use client';

import { useState } from 'react';
import { useContractWrite, useContractRead, useAccount, useTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from "../ui/button";
import { Input } from "../ui/input"; 
import { Label } from "../ui/label";
import { NFT_COLLECTION_ADDRESS, NFT_MARKETPLACE_ADDRESS } from "../../config/contracts";
import { nftMarketplaceABI, nftCollectionABI } from "../../config/abis";
import { toast } from "sonner";

export function ListNFTForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');

  // Approve marketplace to handle NFT
  const { data: writeApproveData, write: approveMarketplace } = useContractWrite({
    address: NFT_COLLECTION_ADDRESS,
    abi: nftCollectionABI,
    functionName: 'approve',
  });

  // List NFT on marketplace
  const { data: writeListData, write: listNFT } = useContractWrite({
    address: NFT_MARKETPLACE_ADDRESS,
    abi: nftMarketplaceABI,
    functionName: 'listNFT',
  });

  // Wait for transactions
  const { isLoading: isApproving } = useTransaction({
    hash: writeApproveData?.hash,
    onSuccess() {
      listNFT({
        args: [NFT_COLLECTION_ADDRESS, BigInt(tokenId), parseEther(price)],
      });
    },
  });

  const { isLoading: isListing } = useTransaction({
    hash: writeListData?.hash,
    onSuccess() {
      toast.success('NFT listed successfully!');
      setTokenId('');
      setPrice('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await approveMarketplace({
        args: [NFT_MARKETPLACE_ADDRESS, BigInt(tokenId)],
      });
    } catch (error) {
      toast.error('Error listing NFT');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <Label htmlFor="tokenId">Token ID</Label>
        <Input
          id="tokenId"
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (in TMA)</Label>
        <Input
          id="price"
          type="number"
          step="0.000000000000000001"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <Button 
        type="submit" 
        disabled={isApproving || isListing}
        className="w-full"
      >
        {isApproving ? 'Approving...' : isListing ? 'Listing...' : 'List NFT'}
      </Button>
    </form>
  );
} 