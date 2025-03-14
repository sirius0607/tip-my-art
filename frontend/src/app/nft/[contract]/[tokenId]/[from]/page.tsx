'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nftGalleryABI, tipMyArtTokenABI } from '@/config/abis';
import { NFT_GALLERY_ADDRESS_SEPOLIA, TIP_MY_ART_TOKEN_ADDRESS_SEPOLIA } from '@/config/contracts';
import { GalleryItem } from "@/types/GalleryItem";
import { Alchemy, Network, Nft } from 'alchemy-sdk';
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BaseError, ContractFunctionExecutionError, formatEther, parseEther } from 'viem';
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

const configSepolia = {
  apiKey: process.env.ALCHEMY_API_KEY_SEPOLIA,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(configSepolia);

export default function NFTDetailPage({ params }: { params: Promise<{ contract: string, tokenId: string, from: string }> }) {
  const router = useRouter();
  const [nft, setNft] = useState<Nft>();
  const [loading, setLoading] = useState(true);
  const [tipAmount, setTipAmount] = useState('');
  const [from, setFrom] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [contract, setContract] = useState('');

  const {
    data: item,
    isItemPending,
    isItemError,
    refetch: refetchItem
  } = useReadContract({
    address: NFT_GALLERY_ADDRESS_SEPOLIA,
    abi: nftGalleryABI,
    functionName: 'getItem',
    args: [contract, tokenId],
  }) as { data: GalleryItem; isPending: boolean; isError: boolean };

  const {
    data: platformFeePercent,
    isFeePending,
    isFeeError
  } = useReadContract({
    address: NFT_GALLERY_ADDRESS_SEPOLIA,
    abi: nftGalleryABI,
    functionName: 'platformFeePercent'
  });

  const {
    data: listHash,
    error: listError,
    isPending: listIsPending,
    writeContract: listItem
  } = useWriteContract();

  const {
    data: approveHash,
    error: approveError,
    isPending: approveIsPending,
    writeContract: approveERC20
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

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash
    });

  const { isLoading: isTippingLoading, isSuccess: isTippingSuccess } =
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


  const approveGallery = async () => {
    try {
      try {
        console.log(`Approve tipmyart gallery to use ${tipAmount} TMA`);
        // approve tipmyart gallery to use tip amount in TMA token
        // from the visitor's wallet to tip the creator
        await approveERC20({
          address: TIP_MY_ART_TOKEN_ADDRESS_SEPOLIA,
          abi: tipMyArtTokenABI,
          functionName: 'approve',
          args: [NFT_GALLERY_ADDRESS_SEPOLIA, parseEther(tipAmount)],
        });
      } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
          console.error('Insufficient funds for transaction')
        } else {
          console.error('Transaction failed:', error)
        }
      }

    } catch (error) {
      //toast.error('Error tipping creator');
      console.error(error);
    }
  }

  const handleTipCreator = async () => {
    console.log(`Tip the creator nft Id ${tokenId}, contract ${contract} with ${tipAmount} TMA`);
    console.log('contract:', contract);
    console.log('tokenId:', tokenId);
    console.log('Tip amount:', tipAmount);
    await tipCreator({
      address: NFT_GALLERY_ADDRESS_SEPOLIA,
      abi: nftGalleryABI,
      functionName: 'tipCreator',
      args: [contract, tokenId, parseEther(tipAmount)]
    });
  };

  useEffect(() => {
    async function fetchNFT() {
      try {
        const { contract, tokenId, from } = await params;
        setContract(contract);
        setTokenId(tokenId);
        setFrom(from);
        const data: Nft = await alchemy.nft.getNftMetadata(contract, tokenId);
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

  useEffect(() => {
        console.log('isApprovalSuccess');
        // if approval is successful, tip the creator
        handleTipCreator();
  }, [isApproveSuccess]);

  useEffect(() => {
        console.log('isTippingSuccess');
        // refetch item from gallery to display updated tip amount
        refetchItem();
  }, [isTippingSuccess]);

  if (loading) return <div>Loading...</div>;
  if (!nft) return <div>NFT not found</div>;

  return (
    <>
      {isListingSuccess ? 'Listing successful!' : ''}
      {isListing ? 'Listing...' : ''}
      {/* {listError && (
      <div>Error: {(listError as BaseError).shortMessage || listError?.message}</div>
      )} */}
      {listIsPending ? 'Listing pending...' : ''}

      {isTippingSuccess ? 'Tip successful!' : ''}
      {isTippingLoading ? 'Creator tipped!' : ''}
      {/* {tipError && (
      <div>Error: {(tipError as BaseError).shortMessage || tipError?.message}</div>
      )} */}
      {tipIsPending ? 'Tipping pending...' : ''}

      <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push(from === 'gallery' ? '/' : '/myart')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {from === 'gallery' ? 'Back to Gallery' : 'Back to My Art'}
      </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{nft.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
          src={nft.image.originalUrl}
          alt={nft.name}
          className="w-full rounded-lg shadow-lg"
          />
          <div className="mt-4 flex items-center gap-2">
          {from === 'gallery' ? (
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
              variant="ghost"
              onClick={async () => {
              approveGallery();
              }}
              className="flex items-center gap-2"
            >
              Tip
            </Button>
            </>
          ) : (
            (!item && (
            <Button
              variant="ghost"
              onClick={async () => {
              handleListItem(contract, tokenId);
              }}
              className="flex items-center gap-2 mt-2"
            >
              Publish
            </Button>
            ))
          )}
          </div>
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
            <p><span className="font-medium">Tip amount:</span> {item?.totalTips ? formatEther(item.totalTips) : '0'} TMA</p>
            {from === 'gallery' && (
            <p><span className="font-medium">Plateform fee:</span> {Number(platformFeePercent) / 100} %</p>
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

      {(isApproveLoading || isTippingLoading) && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="flex items-center space-x-2">
        <Spinner />
        <span>{isApproveLoading ? 'Approval is pending...' : 'Tipping is pending...'}</span>
        </div>
      </div>
      )}
    </>
  );
}