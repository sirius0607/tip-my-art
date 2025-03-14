'use client';

import { Button } from '@/components/ui/button';
import { airdropABI } from '@/config/abis';
import { AIRDROP_CONTRACT_ADDRESS_SEPOLIA } from '@/config/contracts';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

export default function AirdropPage() {
  const { address, isConnected } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);

  const {
    data: claimHash,
    error: claimError,
    isPending: claimIsPending,
    writeContract: claimTokens
  } = useWriteContract();

  const { isLoading: isClaimingLoading, isSuccess: isClaimingSuccess } =
    useWaitForTransactionReceipt({
      hash: claimHash
    });

  const handleClaim = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsClaiming(true);
    try {
      await claimTokens({
        address: AIRDROP_CONTRACT_ADDRESS_SEPOLIA,
        abi: airdropABI,
        functionName: 'claim'
      });
    } catch (error) {
      toast.error('Error claiming tokens');
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Claim Your Free TMA Tokens</h1>
      <p className="mb-6 text-center">Claim your free TMA token to tip artists on the website.</p>
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={handleClaim}
          disabled={isClaiming || isClaimingLoading}
          className="w-48 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 transition-colors"
        >
          {isClaiming || isClaimingLoading ? 'Claiming...' : 'Claim TMA Tokens'}
        </Button>
      </div>
      {claimError && (
        <div className="mt-4 text-red-500 text-center">
          Error: {claimError.message}
        </div>
      )}
      {isClaimingSuccess && (
        <div className="mt-4 text-green-500 text-center">
          Tokens claimed successfully!
        </div>
      )}
    </div>
  );
}
