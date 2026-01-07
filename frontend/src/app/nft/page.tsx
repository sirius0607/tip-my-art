'use client';

import { create } from 'ipfs-http-client';
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NFT_COLLECTION_ADDRESS } from '@/config/contracts';
import { nftCollectionABI } from '@/config/abis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Trait {
  trait_type: string;
  value: string;
}

// const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

export default function CreateNFTPage() {
  const { address, isConnected } = useAccount();
  const [image, setImage] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState<Trait[]>([{ trait_type: '', value: '' }]);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);
  const [imageCid, setImageCid] = useState('');
  const [metadataCid, setMetadataCid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const {
    data: mintHash,
    error: mintError,
    isPending: mintIsPending,
    writeContract: safeMint
  } = useWriteContract();

  const { isLoading: isMinting, isSuccess: isMintingSuccess } =
    useWaitForTransactionReceipt({
      hash: mintHash
    });

    const pinImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
    
        const response = await fetch('/api/pin-image', {
          method: 'POST',
          body: formData,
        });
    
        if (!response.ok) {
          throw new Error('Image upload failed');
        }
        console.log('Response before parsing JSON:', response);
        console.log('Response body:', response.body);
        const { imageCid } = await response.json();
        console.log('Pinned image CID:', imageCid);
        return imageCid;
      };

      const pinMetadata = async (cid: string): Promise<string> => {

        if(cid === '') {
          throw new Error('CID is required for pinning the metadata image reference.');
        }
        const metadata = {
          name,
          description,
          image: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${cid}`,
          //attributes: attributes.filter(attr => attr.trait_type && attr.value),
          attributes: traits.filter((trait) => trait.trait_type && trait.value),
        };
    
        const response = await fetch('/api/pin-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
    
        if (!response.ok) {
          throw new Error('Metadata upload failed');
        }
    
        const { metadataCid } = await response.json();
        console.log('Pinned metadata CID:', metadataCid);
        return metadataCid;
      };

  const handleAddTrait = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setTraits([...traits, { trait_type: '', value: '' }]);
  };

  const handleRemoveTrait = (index: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setTraits(traits.filter((_, i) => i !== index));
  };

  const handleTraitChange = (index: number, field: string, value: string) => {
    const updatedTraits = [...traits];
    // updatedTraits[index][field] = value;
    updatedTraits[index] = { ...updatedTraits[index], [field]: value };
    setTraits(updatedTraits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !name || !description) {
      toast.error('Please fill out all required fields.');
      return;
    }

    setIsUploading(true);
    try {
    //   // Upload image to IPFS
    //   const imageResult = await ipfs.add(image);
    //   const imageUrl = `https://ipfs.io/ipfs/${imageResult.path}`;

    //   // Create metadata object
    //   const metadata = {
    //     name,
    //     description,
    //     image: imageUrl,
    //     attributes: traits.filter((trait) => trait.trait_type && trait.value),
    //   };

      // Upload metadata to IPFS
    //   const metadataResult = await ipfs.add(JSON.stringify(metadata));
    //   const metadataUrl = `https://ipfs.io/ipfs/${metadataResult.path}`;

     // 1. Pin image to IPFS
     if (!image) {
       throw new Error('File is required for pinning the image.');
     }
     const cid = await pinImage(image);
     setImageCid(cid);
     
     // 2. Pin metadata with image reference
     const metaCid = await pinMetadata(cid);
     setMetadataCid(metaCid);
     
     const metadataUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${metaCid}`;
      // Mint NFT
      await safeMint({
        address: NFT_COLLECTION_ADDRESS,
        abi: nftCollectionABI,
        functionName: 'safeMint',
        args: [address, metadataUrl],
      });
      console.log('Metadata URL for minting:', metadataUrl);
      toast.success('NFT created successfully!');
    } catch (error) {
      toast.error('Error creating NFT.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create NFT</h1>
      {isConnected ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Traits</Label>
            {traits.map((trait, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Trait Type"
                  value={trait.trait_type}
                  onChange={(e) =>
                    handleTraitChange(index, 'trait_type', e.target.value)
                  }
                />
                <Input
                  type="text"
                  placeholder="Value"
                  value={trait.value}
                  onChange={(e) =>
                    handleTraitChange(index, 'value', e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(e) => handleRemoveTrait(index, e)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="ghost" type="button" onClick={handleAddTrait}>
              Add Trait
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isUploading || isMinting}
            className="w-full"
          >
            {isUploading || isMinting ? 'Creating...' : 'Create NFT'}
          </Button>
          {mintError && (
            <div className="mt-4 text-red-500">
              Error: {mintError.message}
            </div>
          )}
          {isMintingSuccess && (
            <div className="mt-4 text-green-500">
              NFT created successfully!
            </div>
          )}
        </form>
      ) : (
        <p className="text-center py-8">Please connect your wallet to create an NFT.</p>
      )}
    </div>
  );
}
