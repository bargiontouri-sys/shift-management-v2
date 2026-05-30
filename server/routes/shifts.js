import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { admin } from '../middleware/auth.js'
const router = Router(), db = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query
    const where = { storeId: req.staff.storeId }
    if (from) where.date = { gte: from }
    if (to)   where.date = { ...where.date, lte: to }
    const shifts = await db.shift.findMany({ where, include:{ staff:{ select:{ id:true, name:true } } }, orderBy:[{ date:'asc' },{ staffId:'asc' }] })
    res.json(shifts)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.put('/', admin, async (req, res) => {
  try {
    const { staffId, date, type, start, end } = req.body
    if (!staffId||!date) return res.status(400).json({ error:'staffId and date required' })
    const shift = await db.shift.upsert({
      where: { staffId_date:{ staffId, date } },
      update: { type, start:start||'', end:end||'' },
      create: { staffId, date, storeId:req.staff.storeId, type:type||'off', start:start||'', end:end||'' },
      include: { staff:{ select:{ id:true, name:true } } },
    })
    res.json(shift)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.post('/bulk', admin, async (req, res) => {
  try {
    const { shifts } = req.body
    if (!Array.isArray(shifts)) return res.status(400).json({ error:'shifts[] required' })
    const results = await Promise.all(shifts.map(s => db.shift.upsert({
      where: { staffId_date:{ staffId:s.staffId, date:s.date } },
      update: { type:s.type, start:s.start||'', end:s.end||'' },
      create: { staffId:s.staffId, date:s.date, storeId:req.staff.storeId, type:s.type||'off', start:s.start||'', end:s.end||'' },
    })))
    res.json({ count:results.length })
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.post('/reflect-wishes', admin, async (req, res) => {
  try {
    const { date } = req.body
    if (!date) return res.status(400).json({ error:'date required' })
    const ss = await db.staff.findMany({ where:{ storeId:req.staff.storeId }, select:{ id:true } })
    const wishes = await db.wish.findMany({ where:{ staffId:{ in:ss.map(s=>s.id) }, date } })
    const results = await Promise.all(wishes.map(w => db.shift.upsert({
      where: { staffId_date:{ staffId:w.staffId, date } },
      update: { type:w.status==='ok'?'eve':'off', start:w.start||'', end:w.end||'' },
      create: { staffId:w.staffId, date, storeId:req.staff.storeId, type:w.status==='ok'?'eve':'off', start:w.start||'', end:w.end||'' },
    })))
    res.json({ count:results.length })
  } catch { res.status(500).json({ error:'Server error' }) }
})
export default router
