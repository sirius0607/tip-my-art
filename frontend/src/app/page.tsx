'use client';

import { NFTList } from "@/components/gallery/NFTList";
import { SearchBar } from "@/components/gallery/SearchBar";
import { useState } from "react";
import { useAccount } from "wagmi";

//import Body from "./components/Body";

export default function Home() {

  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <SearchBar onSearch={setSearchTerm} />
      {isConnected ? (
        <NFTList searchTerm={searchTerm} />
      ) : (
        <p className="text-center py-8">Please connect your wallet on the correct network.</p>
      )}
    </div>
  );
}
