import { NextRequest } from 'next/server';
import PinataSDK from '@pinata/sdk';

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

export async function POST(req: NextRequest) {
  try {
    const metadata = await req.json();
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: metadata.name || 'NFT-Metadata',
      },
    });
    // return new Response(JSON.stringify(result), {
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // });
    console.log('Metadata pinning result:', result);
     return Response.json({'metadataCid' : result.IpfsHash});
  } catch (error) {
    console.error('Metadata pinning error:', error);
    return new Response('Failed to pin metadata', { status: 500 });
  }
}
