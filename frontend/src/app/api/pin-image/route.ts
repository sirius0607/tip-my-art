import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import PinataSDK from '@pinata/sdk';
import fs from 'fs';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('File not found', { status: 400 });
  }

  // Convert web stream to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create Node.js Readable stream from Buffer
  const nodeStream = Readable.from(buffer);

  // Pin to IPFS
  const result = await pinata.pinFileToIPFS(nodeStream, {
    pinataMetadata: {
      name: file.name,
    },
  });
  console.log('Image pinning result:', result);
  return Response.json({'imageCid' : result.IpfsHash});
}

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: `Method not allowed ${req.method}` });
//   }

//   try {
//     // Parse form data (image file)
//     const form = new formidable.IncomingForm();
//     const { file } = await new Promise<{ file: formidable.File }>((resolve, reject) => {
//       form.parse(req, (err, _, files) => {
//         if (err) reject(err);
//         resolve(files as unknown as { file: formidable.File });
//       });
//     });

//     // Read file stream
//     const stream = fs.createReadStream(file.filepath);
//     const options = { pinataMetadata: { name: file.originalFilename || 'NFT-Image' } };

//     // Pin to IPFS
//     const { IpfsHash } = await pinata.pinFileToIPFS(stream, options);
//     fs.unlinkSync(file.filepath); // Delete temp file

//     return res.status(200).json({ imageCid: IpfsHash });
//   } catch (error) {
//     console.error('Image pinning error:', error);
//     return res.status(500).json({ error: 'Failed to pin image' });
//   }
// }