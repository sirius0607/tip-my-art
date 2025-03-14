export interface Nft {
      tokenId: string;
      name: string;
      image: string;
      description?: string;
      price: string;
      seller: string;
      isListed: boolean;
      contract?: {
        address: string;
      }
  }