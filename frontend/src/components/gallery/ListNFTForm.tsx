'use client';

import { useState } from 'react';
import { toast } from "sonner";
import { useAccount, useGasPrice, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { nftGalleryABI } from "../../config/abis";
import { NFT_CONTRACT_ADDRESS_SEPOLIA_MarkKop, NFT_GALLERY_ADDRESS_SEPOLIA } from "../../config/contracts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
//import NFT from "../../config/NFT.json";


export function ListNFTForm() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState('');
  const [tip, setTip] = useState('');

  //const gasPrice = '20000000000'; // 20 Gwei
  const gasLimit = '1000000'; // 100,000 gas units

  // const marketplaceContract = await hre.ethers.getContractAt('Marketplace', NFT_MARKETPLACE_ADDRESS)
  // const nftContract = await hre.ethers.getContractAt('NFT', NFT_COLLECTION_ADDRESS)

  const { data: gasPrice } = useGasPrice({
    chainId: 11155111 // Sepolia chain ID
  })

  const {
    data: listHash,
    error: listError,
    isPending: listIsPending,
    writeContract: listItem
  } = useWriteContract();

  const { isLoading: isListing, isSuccess: isListingSuccess } =
    useWaitForTransactionReceipt({
      hash: listHash
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //try {

        try {
          //const nftContract = new ethers.Contract(data.nftAddress, NFT.abi, signer)
          //  const approveTx = await nftContract.approve(marketplaceContract.address, nft.tokenId)
        //   await approveNFT({
        //     address: NFT_COLLECTION_ADDRESS,
        //     abi: nftCollectionABI,
        //     functionName: 'approve',
        //     args: [NFT_MARKETPLACE_ADDRESS, BigInt(tokenId)],
        //     //gasPrice
        //     gas: BigInt(gasLimit)
        //   });
        // } catch (error) {
        //   if (error instanceof ContractFunctionExecutionError) {
        //     console.error('Insufficient funds for transaction')
        //   } else {
        //     console.error('Transaction failed:', error)
        //   }
        // }

        // // Wait for approval transaction
        // await new Promise(resolve => {
        //   const interval = setInterval(() => {
        //     if (isApprovalSuccess) {
        //       console.log('isApprovalSuccess');
        //       clearInterval(interval);
        //       resolve(true);
        //     }
        //   }, 1000);
        // });

        console.log('List the NFT on Nft Gallery');
        // List the NFT
        await listItem({
          address: NFT_GALLERY_ADDRESS_SEPOLIA,
          abi: nftGalleryABI,
          functionName: 'listItem',
          args: [NFT_CONTRACT_ADDRESS_SEPOLIA_MarkKop, BigInt(tokenId)]
        });

        // Wait for listing transaction
        // await new Promise(resolve => {
        //   const interval = setInterval(() => {
        //     if (isListingSuccess) {
        //       console.log('isListingSuccess');
        //       clearInterval(interval);
        //       resolve(true);
        //     }
        //   }, 1000);
        // });

        // const approveTx = await nftContract.approve(marketplaceContract.address, nft.tokenId)
        // await approveTx.wait()

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
        <Label htmlFor="tip">Tip (in TMA)</Label>
        <Input
          id="tip"
          type="number"
          step="0.000000000000000001"
          value={tip}
          onChange={(e) => setTip(e.target.value)}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isListing}
        className="w-full"
      >
        {isListing ? 'Listing...' : 'List NFT'}
      </Button>
      {/* {error && (
        <div>Error: {(approveError as BaseError).shortMessage || approveError?.message}</div>
      )}
        {approveIsPending ? 'Approve pending...' : ''} */}
    </form>
  );
}