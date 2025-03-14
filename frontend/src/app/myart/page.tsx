'use client';

import { NFTList } from "@/components/gallery/NFTList";
import { SearchBar } from "@/components/gallery/SearchBar";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function Page() {

    const { isConnected } = useAccount();
    const [searchTerm, setSearchTerm] = useState('');
    
    return (
        <div>
              <SearchBar onSearch={setSearchTerm} />
            {isConnected ? (
            <NFTList searchTerm={searchTerm} ownerOnly />
            ) : (
            <p className="text-center py-8">Please connect your wallet to view your NFTs</p>
            )}
        </div>
    );
}