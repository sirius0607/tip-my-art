'use client';

import { useState } from 'react';
import { BaseError, useAccount, useGasPrice, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { ContractFunctionExecutionError, parseEther } from 'viem';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NFT_COLLECTION_ADDRESS, NFT_MARKETPLACE_ADDRESS } from "../../config/contracts";
import { nftMarketplaceABI, nftCollectionABI } from "../../config/abis";
import { toast } from "sonner";
//import NFT from "../../config/NFT.json";


export function ListNFTForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');

  //const gasPrice = '20000000000'; // 20 Gwei
  const gasLimit = '1000000'; // 100,000 gas units

  // const marketplaceContract = await hre.ethers.getContractAt('Marketplace', NFT_MARKETPLACE_ADDRESS)
  // const nftContract = await hre.ethers.getContractAt('NFT', NFT_COLLECTION_ADDRESS)

  const { data: gasPrice } = useGasPrice({
    chainId: 11155111 // Sepolia chain ID
  })

  const {
    data: approveHash,
    error: approveError,
    isPending: approveIsPending,
    writeContract: approveNFT
  } = useWriteContract();

  const {
    data: listHash,
    error: listError,
    isPending: listIsPending,
    writeContract: listNFT
  } = useWriteContract();

  const {
    data: isApproved,
    error,
    isPending
  } = useReadContract({
    address: NFT_COLLECTION_ADDRESS,
    abi: nftCollectionABI,
    functionName: 'isApprovedForAll',
    args: [address, NFT_MARKETPLACE_ADDRESS],
  })

  const { isLoading: isApprovalLoading, isSuccess: isApprovalSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash
      // onSuccess() {
      //   listNFT({
      //     address: NFT_MARKETPLACE_ADDRESS,
      //     abi: nftMarketplaceABI,
      //     functionName: 'listNFT',
      //     args: [NFT_COLLECTION_ADDRESS, BigInt(tokenId), parseEther(price)],
      //     gas: BigInt(gasLimit)
      //   });
      // },
    });

  const { isLoading: isListing, isSuccess: isListingSuccess } =
    useWaitForTransactionReceipt({
      hash: listHash,
      // onSuccess() {
      //   toast.success('NFT listed successfully!');
      //   setTokenId('');
      //   setPrice('');
      // },
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('isApproved:', isApproved);
      if (!isApproved) {

        try {
          //const nftContract = new ethers.Contract(data.nftAddress, NFT.abi, signer)
          //  const approveTx = await nftContract.approve(marketplaceContract.address, nft.tokenId)
          await approveNFT({
            address: NFT_COLLECTION_ADDRESS,
            abi: nftCollectionABI,
            functionName: 'approve',
            args: [NFT_MARKETPLACE_ADDRESS, BigInt(tokenId)],
            //gasPrice
            gas: BigInt(gasLimit)
          });
        } catch (error) {
          if (error instanceof ContractFunctionExecutionError) {
            console.error('Insufficient funds for transaction')
          } else {
            console.error('Transaction failed:', error)
          }
        }

        // Wait for approval transaction
        await new Promise(resolve => {
          const interval = setInterval(() => {
            if (isApprovalSuccess) {
              console.log('isApprovalSuccess');
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });

        console.log('List the NFT on marketplace');
        // List the NFT
        await listNFT({
          address: NFT_MARKETPLACE_ADDRESS,
          abi: nftMarketplaceABI,
          functionName: 'listNFT',
          args: [NFT_COLLECTION_ADDRESS, BigInt(tokenId), parseEther(price)]
          //gas: BigInt(gasLimit)
        });

        // Wait for listing transaction
        await new Promise(resolve => {
          const interval = setInterval(() => {
            if (isListingSuccess) {
              console.log('isListingSuccess');
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });

        // const approveTx = await nftContract.approve(marketplaceContract.address, nft.tokenId)
        // await approveTx.wait()
      }

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
        disabled={isApprovalLoading || isListing}
        className="w-full"
      >
        {isApprovalLoading ? 'Approving...' : isListing ? 'Listing...' : 'List NFT'}
      </Button>
      {approveHash && <div>Tx hash: {approveHash}</div>}
      {isApprovalSuccess ? 'Approving Sucessful !' : ''}
      {error && (
        <div>Error: {(approveError as BaseError).shortMessage || approveError?.message}</div>
      )}
        {approveIsPending ? 'Approve pending...' : ''}
    </form>
  );
}