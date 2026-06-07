import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { admin } from '../middleware/auth.js'
const router = Router(), db = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const { staffId, from, to } = req.query
    const where = {}
    if (req.staff.isAdmin) {
      if (staffId) { where.staffId = staffId }
      else {
        const ss = await db.staff.findMany({ where:{ storeId:req.staff.storeId }, select:{ id:true } })
        where.staffId = { in: ss.map(s=>s.id) }
      }
    } else {
      where.staffId = staffId || req.staff.id
    }
    if (from) where.date = { gte: from }
    if (to)   where.date = { ...where.date, lte: to }
    const punches = await db.punch.findMany({ where, orderBy:[{ date:'asc' },{ createdAt:'asc' }] })
    res.json(punches)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req, res) => {
  try {
    const { type, lat, lng } = req.body
    if (!type || !['in','out'].includes(type)) return res.status(400).json({ error: 'type must be in or out' })
    const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const date = jst.toISOString().slice(0, 10)
    const time = jst.toISOString().slice(11, 16)
    const punch = await db.punch.create({ data:{ staffId:req.staff.id, date, type, time, lat, lng } })
    res.status(201).json(punch)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// 管理者用: 任意スタッフの打刻を手動追加
router.post('/manual', admin, async (req, res) => {
  try {
    const { staffId, date, type, time } = req.body
    if (!staffId || !date || !type || !time) return res.status(400).json({ error: 'staffId, date, type, time required' })
    if (!['in','out'].includes(type)) return res.status(400).json({ error: 'type must be in or out' })
    const punch = await db.punch.create({ data:{ staffId, date, type, time } })
    res.status(201).json(punch)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.patch('/:id', admin, async (req, res) => {
  try {
    const { type, time } = req.body
    const punch = await db.punch.update({ where:{ id:req.params.id }, data:{ type, time } })
    res.json(punch)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', admin, async (req, res) => {
  try {
    await db.punch.delete({ where:{ id:req.params.id } })
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
