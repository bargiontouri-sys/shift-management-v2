import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import authRouter    from './routes/auth.js'
import staffRouter   from './routes/staff.js'
import shiftsRouter  from './routes/shifts.js'
import punchesRouter from './routes/punches.js'
import wishesRouter  from './routes/wishes.js'
import statsRouter   from './routes/stats.js'
import { auth } from './middleware/auth.js'

const app = express()
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }))
app.use(express.json())
app.use('/api', rateLimit({ windowMs:15*60*1000, max:200 }))
app.use('/api/auth', rateLimit({ windowMs:15*60*1000, max:30 }))
app.use('/api/auth',    authRouter)
app.use('/api/staff',   auth, staffRouter)
app.use('/api/shifts',  auth, shiftsRouter)
app.use('/api/punches', auth, punchesRouter)
app.use('/api/wishes',  auth, wishesRouter)
app.use('/api/stats',   auth, statsRouter)
app.get('/api/health', (_, res) => res.json({ ok:true, time: new Date().toISOString() }))
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 BarShift v2 API on :${PORT}`))
