import { z } from 'zod'

export const createTripSchema = z.object({
  originCountry: z.string().min(1, 'Required'),
  originCity: z.string().min(1, 'Required'),
  destCountry: z.string().min(1, 'Required'),
  destCity: z.string().min(1, 'Required'),
  departureDate: z.coerce.date(),
  capacityWeight: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().positive().optional()
  ),
  capacityNote: z.string().optional(),
  notes: z.string().optional(),
})

export const updateTripSchema = createTripSchema.partial()