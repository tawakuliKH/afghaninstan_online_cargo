import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import { prisma } from './lib/prisma'
import authRoutes from './routes/auth.routes'
import tripRoutes from './routes/trip.routes'
import packageRoutes from './routes/package.routes'
import deliveryRoutes from './routes/delivery.routes'
import reviewRoutes from './routes/review.routes'
import messageRoutes from './routes/message.routes'
import notificationRoutes from './routes/notification.routes'
import adminRoutes from './routes/admin.routes'
import agreementRoutes from './routes/agreement.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://afghancargo.online',
    'https://www.afghancargo.online'
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('Health check failed — database unreachable:', err)
    res.status(503).json({ status: 'error', error: 'Database unreachable' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/deliveries', deliveryRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/agreements', agreementRoutes)

async function start() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection established')
  } catch (err) {
    console.error('Failed to connect to the database. Server will not start.')
    console.error(err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()