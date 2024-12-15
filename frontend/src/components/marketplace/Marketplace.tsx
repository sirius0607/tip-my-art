'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { NFTList } from './NFTList';
import { ListNFTForm } from './ListNFTForm';
import { SearchBar } from './SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Marketplace() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <SearchBar onSearch={setSearchTerm} />
      
      <Tabs defaultValue="browse" className="mt-8">
        <TabsList>
          <TabsTrigger value="browse">Browse NFTs</TabsTrigger>
          <TabsTrigger value="list">List NFT</TabsTrigger>
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <NFTList searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="list">
          {isConnected ? (
            <ListNFTForm />
          ) : (
            <p className="text-center py-8">Please connect your wallet to list NFTs</p>
          )}
        </TabsContent>

        <TabsContent value="my-nfts">
          {isConnected ? (
            <NFTList searchTerm={searchTerm} ownerOnly />
          ) : (
            <p className="text-center py-8">Please connect your wallet to view your NFTs</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 