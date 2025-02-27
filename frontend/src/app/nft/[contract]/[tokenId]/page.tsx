'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useContractWrite, usePrepareContractWrite, useTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { nftCollectionABI, nftMarketplaceABI } from '@/config/abis';
import { NFT_COLLECTION_ADDRESS, NFT_MARKETPLACE_ADDRESS } from '@/config/contracts';
import { parseEther } from 'viem';

const configSepolia = {
  apiKey: process.env.ALCHEMY_API_KEY_SEPOLIA,
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(configSepolia);

export default function NFTDetailPage({ params }: { params: { contract: string, tokenId: string } }) {
  const { contract, tokenId } =  params;
  const router = useRouter();
  const [nft, setNft] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const gasPrice = '20000000000'; // 20 Gwei
  const gasLimit = '100000'; // 100,000 gas units

  // const { config } = usePrepareContractWrite({
  //   address: 'YOUR_MARKETPLACE_CONTRACT_ADDRESS', // Replace with your contract address
  //   abi: nftMarketplaceABI,
  //   functionName: 'listNFT',
  //   args: [params.contract, params.tokenId, nft?.price], // Adjust the args as necessary
  // });

  // const { write: listNFT } = useContractWrite(config);
  //const { writeContract } = useWriteContract()


  // Approve NFT for marketplace
  // const { write: approveNft, data: approvalData } = useContractWrite({
  //   address: NFT_CONTRACT_ADDRESS,
  //   abi: NftCollectionABI,
  //   functionName: 'setApprovalForAll',
  // });

  // // List NFT on marketplace
  // const { write: listNft, data: listingData } = useContractWrite({
  //   address: MARKETPLACE_CONTRACT_ADDRESS,
  //   abi: NftMarketplaceABI,
  //   functionName: 'listItem',
  // });

  // // Wait for transactions
  // const { isLoading: isApprovalLoading, isSuccess: isApprovalSuccess } = 
  //   useWaitForTransaction({
  //     hash: approvalData?.hash,
  //   });

  // const { isLoading: isListingLoading, isSuccess: isListingSuccess } = 
  //   useWaitForTransaction({
  //     hash: listingData?.hash,
  //   });


  const { 
    data: approveHash,
    approveError,
    approveIsPending, 
    writeContract: approveNFT 
  } = useWriteContract() 

  const { 
    data:  publishHash,
    publishError,
    publishIsPending, 
    writeContract: publishNFT
  } = useWriteContract()

     // Wait for approval transaction
    //await useWaitForTransactionReceipt({ hash: approveHash })
    const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    })

      // Wait for listNft transaction
    const { isLoading: isPublishConfirming, isSuccess: isPublishConfirmed } =
    useWaitForTransactionReceipt({
      hash: publishHash,
    })

  //const { writeContract: approveNFT } = useWriteContract()

  const handleApproveAndList = async () => {

    const price = '0.1' // Price in ETH
    // Approve NFT
    await approveNFT({
      address: NFT_COLLECTION_ADDRESS,
      abi: nftCollectionABI,
      functionName: 'approve',
      args: [NFT_MARKETPLACE_ADDRESS, tokenId],
      overrides: {
        gasPrice,
        gasLimit,
      },
    })

    // List NFT
    await publishNFT({
      address: NFT_MARKETPLACE_ADDRESS,
      abi: nftMarketplaceABI,
      functionName: 'listNFT',
      args: [NFT_COLLECTION_ADDRESS, tokenId, parseEther(price)],
    })
  }

  // const { data: hash, isPending, writeContract } = useWriteContract()

  // const { isLoading: isConfirming, isSuccess: isConfirmed } =
  //   useWaitForTransactionReceipt({
  //     hash,
  //   })

  // writeContract({
  //   address: NFT_COLLECTION_ADDRESS,
  //   abi: nftCollectionABI,
  //   functionName: 'approve',
  //   args: [NFT_MARKETPLACE_ADDRESS, BigInt(tokenId)],
  // })


  //   // Approve marketplace to handle NFT
  //   const { data: writeApproveData, write: approveMarketplace } = useContractWrite({
  //     address: NFT_COLLECTION_ADDRESS,
  //     abi: nftCollectionABI,
  //     functionName: 'approve',
  //   });
  
  //   // List NFT on marketplace
  //   const { data: writeListData, write: listNFT } = useContractWrite({
  //     address: NFT_MARKETPLACE_ADDRESS,
  //     abi: nftMarketplaceABI,
  //     functionName: 'listNFT',
  //   });
  
  //   // Wait for transactions
  //   const { isLoading: isApproving } = useTransaction({
  //     hash: writeApproveData?.hash,
  //     onSuccess() {
  //       listNFT({
  //         args: [NFT_COLLECTION_ADDRESS, BigInt(tokenId), parseEther(price)],
  //       });
  //     },
  //   });
  
  //   const { isLoading: isListing } = useTransaction({
  //     hash: writeListData?.hash,
  //     onSuccess() {
  //       toast.success('NFT listed successfully!');
  //       setTokenId('');
  //       setPrice('');
  //     },
  //   });

  useEffect(() => {
    async function fetchNFT() {
      try {
        const data = await alchemy.nft.getNftMetadata(
          await params.contract as string,
          await params.tokenId as string
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
    <>
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
      <div className="flex justify-end mt-6">
        <Button 
          variant="primary" 
          onClick={() => handleApproveAndList?.()}
          className="flex items-center gap-2"
        >
          Publish
        </Button>
      </div>
    </div>
    </>
  );
}