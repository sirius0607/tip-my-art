'use client';

import { Button } from '@/components/ui/button';
import { airdropABI } from '@/config/abis';
import { AIRDROP_CONTRACT_ADDRESS_SEPOLIA } from '@/config/contracts';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

export default function AirdropPage() {
  const { address, isConnected } = useAccount();

  // Read if user has already claimed
  const { data: hasClaimed } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS_SEPOLIA,
    abi: airdropABI,
    functionName: 'hasClaimed',
    args: [address || '0x'],
    query: {
      enabled: !!address,
    }
  });

  const {
    data: claimHash,
    error: claimError,
    isPending: claimIsPending,
    writeContract: claimTokens
  } = useWriteContract();

  const { isLoading: isClaimingLoading, isSuccess: isClaimingSuccess, error: claimingError } =
    useWaitForTransactionReceipt({
      hash: claimHash
    });

  const handleClaim = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    await claimTokens({
      address: AIRDROP_CONTRACT_ADDRESS_SEPOLIA,
      abi: airdropABI,
      functionName: 'claim'
    });
  };

  // Error handling effect
  useEffect(() => {
    if (claimingError) {
      const reason = claimingError.message.includes('Already claimed')
        ? 'You have already claimed your tokens!'
        : claimingError.message;
      //setErrorMessage(reason);
      console.log(reason);
    }
  }, [claimingError]);

  return (
    <div className="container mx-auto px-4 py-8 pb-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Claim Your Free TMA Tokens</h1>
      <p className="mb-6 text-center">Claim your free TMA token to tip artists on the website.</p>
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={handleClaim}
          disabled={isClaimingLoading || hasClaimed}
          className="w-48 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 transition-colors"
        >
          {isClaimingLoading ? 'Claiming...' : 'Claim TMA Tokens'}
        </Button>
      </div>
      {Boolean(hasClaimed) && (
        <div className="mt-4 text-red-500 text-center">You&apos;ve already claimed your tokens!</div>
      )}
      {claimingError && (
        <div className="mt-4 text-red-500 text-center">
          Error: {claimingError.message}
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
