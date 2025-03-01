'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nftGalleryABI } from '@/config/abis';
import { NFT_GALLERY_ADDRESS_SEPOLIA } from '@/config/contracts';
import { Alchemy, Network } from 'alchemy-sdk';
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BaseError, parseEther } from 'viem';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

const configSepolia = {
  apiKey: process.env.ALCHEMY_API_KEY_SEPOLIA,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(configSepolia);

export default function NFTDetailPage({ params }: { params: Promise<{ contract: string, tokenId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nft, setNft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tipAmount, setTipAmount] = useState('');

  const {
    data: listHash,
    error: listError,
    isPending: listIsPending,
    writeContract: listItem
  } = useWriteContract();

  const {
    data: tipHash,
    error: tipError,
    isPending: tipIsPending,
    writeContract: tipCreator
  } = useWriteContract();

  const { isLoading: isListing, isSuccess: isListingSuccess } =
    useWaitForTransactionReceipt({
      hash: listHash
    });

  const { isLoading: isTipping, isSuccess: isTippingSuccess } =
    useWaitForTransactionReceipt({
      hash: tipHash
    });

  const handleListItem = async (contract: string, tokenId: string) => {
    await listItem({
      address: NFT_GALLERY_ADDRESS_SEPOLIA,
      abi: nftGalleryABI,
      functionName: 'listItem',
      args: [contract, tokenId],
    });
  };

  const handleTipCreator = async (contract: string, tokenId: string) => {
    await tipCreator({
      address: NFT_GALLERY_ADDRESS_SEPOLIA,
      abi: nftGalleryABI,
      functionName: 'tipCreator',
      args: [contract, tokenId, parseEther(tipAmount)],
    });
  };

  useEffect(() => {
    async function fetchNFT() {
      try {
        const { contract, tokenId } = await params;
        const data = await alchemy.nft.getNftMetadata(contract, tokenId);
        setNft(data);
        console.log('NFT Data:', data); // For debugging
      } catch (error) {
        console.error('Error fetching NFT:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFT();
  }, [params]);

  if (loading) return <div>Loading...</div>;
  if (!nft) return <div>NFT not found</div>;

  const sourceTab = searchParams.get('sourceTab');

  return (
    <>
      {isListingSuccess ? 'Listing successful!' : ''}
      {isListing ? 'Listing...' : ''}
      {listError && (
        <div>Error: {(listError as BaseError).shortMessage || listError?.message}</div>
      )}
      {listIsPending ? 'Listing pending...' : ''}

      {isTippingSuccess ? 'Tip successful!' : ''}
      {isTipping ? 'Creator tipped!' : ''}
      {tipError && (
        <div>Error: {(tipError as BaseError).shortMessage || tipError?.message}</div>
      )}
      {tipIsPending ? 'Tipping pending...' : ''}

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/marketplace')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
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
        <div className="flex justify-end mt-6">
          {sourceTab === 'browse' ? (
            <>
              <Input
                id="tipAmount"
                type="number"
                step="0.000000000000000001"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="Tip amount in TMA"
                required
              />
              <Button
                variant="primary"
                onClick={async () => {
                  const { contract, tokenId } = await params;
                  handleTipCreator(contract, tokenId);
                }}
                className="flex items-center gap-2"
              >
                Tip
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={async () => {
                const { contract, tokenId } = await params;
                handleListItem(contract, tokenId);
              }}
              className="flex items-center gap-2"
            >
              Publish
            </Button>
          )}
        </div>
      </div>
    </>
  );
}