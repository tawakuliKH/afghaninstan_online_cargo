import { z } from 'zod'

export const createPackageSchema = z.object({
  title: z.string().min(2),
  weight: z.coerce.number().positive(),
  originCountry: z.string().min(2),
  originCity: z.string().min(1),
  destCountry: z.string().min(2),
  destCity: z.string().min(1),
  recipientName: z.string().min(2),
  recipientWhatsapp: z.string().min(5),
  recipientEmail: z.string().email(),
  notes: z.string().optional(),
})

export const updatePackageSchema = createPackageSchema.partial()