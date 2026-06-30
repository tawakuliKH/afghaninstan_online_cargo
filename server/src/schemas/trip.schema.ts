import { z } from 'zod'

export const createTripSchema = z.object({
  originCountry: z.string().min(2),
  originCity: z.string().min(1),
  destCountry: z.string().min(2),
  destCity: z.string().min(1),
  capacityWeight: z.coerce.number().positive().optional(),
  capacityNote: z.string().optional(),
  departureDate: z.coerce.date(),
  notes: z.string().optional(),
})

export const updateTripSchema = createTripSchema.partial()