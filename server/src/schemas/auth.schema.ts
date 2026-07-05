import { z } from 'zod'


export const registerSchema = z
  .object({
    email: z.string().email('A valid email address is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    legalFullName: z.string().min(2, 'Legal full name is required'),
    nickname: z.string().min(2, 'Nickname is required'),
    dateOfBirth: z.coerce.date({ message: 'Date of birth is required' }),
    whatsappNumber: z.string().min(5, 'WhatsApp number is required'),
    documentType: z.enum(['PASSPORT', 'TAZKIRA'], { message: 'Document type is required' }),
    documentNumber: z.string().min(3, 'Document number is required'),
    documentIssuingCountry: z.string().optional(),
    permanentCountry: z.string().min(2, 'Permanent country is required'),
    permanentCity: z.string().min(2, 'Permanent city is required'),
    currentCountry: z.string().min(2, 'Current country is required'),
    currentCity: z.string().min(2, 'Current city is required'),
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