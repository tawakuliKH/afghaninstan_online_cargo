import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const KYC_BUCKET = 'kyc-documents'
const PHOTOS_BUCKET = 'package-photos'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

// Upload KYC document to private bucket — returns file path only
export async function uploadKycFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: KYC_BUCKET,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
  }))
  return filePath
}

// Generate signed URL for private KYC document (default 5 minutes)
export async function getKycSignedUrl(
  filePath: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: KYC_BUCKET,
    Key: filePath,
  })
  return getSignedUrl(r2, command, { expiresIn: expiresInSeconds })
}

// Upload package photo to public bucket — returns full public URL
export async function uploadPackagePhoto(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${R2_PUBLIC_URL}/${filePath}`
}

// Delete a file from either bucket
export async function deleteFile(
  bucket: 'kyc-documents' | 'package-photos',
  filePath: string
): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: filePath,
  }))
}