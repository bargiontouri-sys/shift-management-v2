import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { admin } from '../middleware/auth.js'
const router = Router(), db = new PrismaClient()

router.get('/deadline', async (req, res) => {
  try {
    const d = await db.wishDeadline.findFirst({ where:{ storeId:req.staff.storeId }, orderBy:{ createdAt:'desc' } })
    res.json(d||null)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.put('/deadline', admin, async (req, res) => {
  try {
    const { deadline, targetMonth, periodStart, periodEnd } = req.body
    const r = await db.wishDeadline.create({ data:{ storeId:req.staff.storeId, deadline, targetMonth, periodStart:periodStart||'', periodEnd:periodEnd||'' } })
    res.json(r)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.get('/', async (req, res) => {
  try {
    const { month, staffId } = req.query
    const where = {}
    // staffIdが指定されている場合は常にそのスタッフのみ返す
    if (staffId) {
      where.staffId = staffId
    } else if (req.staff.isAdmin) {
      // 管理者でstaffId未指定の場合のみ全員分
      const ss = await db.staff.findMany({ where:{ storeId:req.staff.storeId }, select:{ id:true } })
      where.staffId = { in: ss.map(s=>s.id) }
    } else {
      where.staffId = req.staff.id
    }
    if (month) where.date = { startsWith: month }
    const wishes = await db.wish.findMany({ where, include:{ staff:{ select:{ id:true, name:true } } }, orderBy:{ date:'asc' } })
    res.json(wishes)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.put('/', async (req, res) => {
  try {
    const { date, status, start, end, note } = req.body
    if (!date) return res.status(400).json({ error:'date required' })
    const w = await db.wish.upsert({
      where: { staffId_date:{ staffId:req.staff.id, date } },
      update: { status:status||'none', start:start||'18:00', end:end||'24:00', note:note||'' },
      create: { staffId:req.staff.id, date, status:status||'none', start:start||'18:00', end:end||'24:00', note:note||'' },
      include: { staff:{ select:{ id:true, name:true } } },
    })
    res.json(w)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.post('/bulk', async (req, res) => {
  try {
    const { wishes } = req.body
    if (!Array.isArray(wishes)) return res.status(400).json({ error:'wishes[] required' })
    const results = await Promise.all(wishes.map(w => db.wish.upsert({
      where: { staffId_date:{ staffId:req.staff.id, date:w.date } },
      update: { status:w.status, start:w.start||'18:00', end:w.end||'24:00', note:w.note||'' },
      create: { staffId:req.staff.id, date:w.date, status:w.status, start:w.start||'18:00', end:w.end||'24:00', note:w.note||'' },
    })))
    res.json({ count:results.length })
  } catch { res.status(500).json({ error:'Server error' }) }
})
export default router
