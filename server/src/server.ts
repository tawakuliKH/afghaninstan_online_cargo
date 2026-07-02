import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import tripRoutes from './routes/trip.routes'
// ...

import authRoutes from './routes/auth.routes'
// ...
import packageRoutes from './routes/package.routes'
// ...
import deliveryRoutes from './routes/delivery.routes'
// ...

import reviewRoutes from './routes/review.routes'
// ...
import messageRoutes from './routes/message.routes'
import notificationRoutes from './routes/notification.routes'
// ...
import adminRoutes from './routes/admin.routes'
// ...

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/packages', packageRoutes)

app.use('/api/deliveries', deliveryRoutes)

app.use('/api/reviews', reviewRoutes)

app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)


