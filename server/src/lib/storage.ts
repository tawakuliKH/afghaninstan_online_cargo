import { supabase } from './supabase'

export async function uploadKycFile(filePath: string, buffer: Buffer, contentType: string) {
  const { error } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, buffer, { contentType, upsert: false })

  if (error) throw new Error(`Failed to upload ${filePath}: ${error.message}`)
  return filePath
}