import { z } from 'zod'


export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    legalFullName: z.string().min(2),
    nickname: z.string().min(2),
    dateOfBirth: z.coerce.date(),
    whatsappNumber: z.string().min(5),
    documentType: z.enum(['PASSPORT', 'TAZKIRA']),
    documentNumber: z.string().min(3),
    documentIssuingCountry: z.string().optional(),
    permanentCountry: z.string().min(2),
    permanentCity: z.string().min(2),
    currentCountry: z.string().min(2),
    currentCity: z.string().min(2),
  })
  .superRefine((data, ctx) => {
    if (data.documentType === 'PASSPORT' && !data.documentIssuingCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documentIssuingCountry'],
        message: 'Issuing country is required for passports',
      })
    }
  })

  export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})