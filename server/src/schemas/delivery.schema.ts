import { z } from 'zod'

export const proposeDeliverySchema = z.object({
  packageId: z.string().uuid(),
  travelerId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  agreedAmount: z.coerce.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AFN', 'AED', 'TRY', 'CAD', 'AUD']),
  paymentLocation: z.enum(['ORIGIN', 'DESTINATION']),
})

export const acceptDeliverySchema = z.object({
  estimatedDeliveryDate: z.coerce.date(),
})