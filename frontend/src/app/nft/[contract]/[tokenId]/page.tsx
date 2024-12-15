'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alchemy, Network } from 'alchemy-sdk';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const configSepolia = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY_SEPOLIA,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(configSepolia);

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [nft, setNft] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNFT() {
      try {
        const data = await alchemy.nft.getNftMetadata(
          params.contract as string,
          params.tokenId as string
        );
        setNft(data);
        console.log('NFT Data:', data); // For debugging
      } catch (error) {
        console.error('Error fetching NFT:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.contract && params.tokenId) {
      fetchNFT();
    }
  }, [params.contract, params.tokenId]);

  if (loading) return <div>Loading...</div>;
  if (!nft) return <div>NFT not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/marketplace')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{nft.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img 
              src={nft.image.originalUrl} 
              alt={nft.title}
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <div className="space-y-4">
                <p><span className="font-medium">Collection:</span> {nft.contract.name}</p>
                <p><span className="font-medium">Token ID:</span> {nft.tokenId}</p>
                <p><span className="font-medium">Token Type:</span> {nft.tokenType}</p>
                {nft.description && (
                  <div>
                    <p className="font-medium mb-2">Description:</p>
                    <p className="text-gray-600">{nft.description}</p>
                  </div>
                )}
              </div>
            </div>

            {nft.raw.metadata?.attributes && nft.raw.metadata.attributes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Attributes</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trait</TableHead>
                      <TableHead>Value</TableHead>
                      {nft.raw.metadata.attributes[0].rarity && (
                        <TableHead>Rarity</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nft.raw.metadata.attributes.map((attr: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {attr.trait_type}
                        </TableCell>
                        <TableCell>{attr.value}</TableCell>
                        {attr.rarity && (
                          <TableCell>{attr.rarity}%</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 