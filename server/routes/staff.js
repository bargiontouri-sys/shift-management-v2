import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { admin } from '../middleware/auth.js'
const router = Router(), db = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const s = await db.staff.findMany({
      where:{ storeId:req.staff.storeId },
      select:{ id:true, name:true, role:true, type:true, wage:true, isAdmin:true, fixedOvertimeHours:true, standardMonthlyHours:true, sortOrder:true, iconColor:true },
      orderBy:{ sortOrder:'asc' },
    })
    res.json(s)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.post('/', admin, async (req, res) => {
  try {
    const { name, role, type, wage, pin, isAdmin, fixedOvertimeHours, standardMonthlyHours } = req.body
    if (!name||!pin||pin.length!==4) return res.status(400).json({ error:'名前と4桁のPINが必要です' })
    const cnt = await db.staff.count({ where:{ storeId:req.staff.storeId } })
    if (cnt>=30) return res.status(400).json({ error:'スタッフ上限に達しています' })
    const s = await db.staff.create({ data:{ storeId:req.staff.storeId, name, role:role||'スタッフ', type:type||'part-time', wage:wage||1000, pin: await bcrypt.hash(pin,10), isAdmin:isAdmin||false, fixedOvertimeHours:fixedOvertimeHours||20, standardMonthlyHours:standardMonthlyHours||160, sortOrder:cnt } })
    const { pin:_, ...safe } = s; res.status(201).json(safe)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.patch('/sort', admin, async (req, res) => {
  try {
    const { order } = req.body
    if (!Array.isArray(order)) return res.status(400).json({ error:'order[] required' })
    await Promise.all(order.map((id, i) => db.staff.update({ where:{ id }, data:{ sortOrder:i } })))
    res.json({ ok:true })
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.patch('/icon-color', async (req, res) => {
  try {
    const { iconColor } = req.body
    await db.staff.update({ where:{ id:req.staff.id }, data:{ iconColor } })
    res.json({ ok:true })
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.patch('/:id', admin, async (req, res) => {
  try {
    const { pin, ...rest } = req.body; const data = { ...rest }
    if (pin) { if (pin.length!==4) return res.status(400).json({ error:'PINは4桁' }); data.pin = await bcrypt.hash(pin,10) }
    const s = await db.staff.update({ where:{ id:req.params.id }, data })
    const { pin:_, ...safe } = s; res.json(safe)
  } catch { res.status(500).json({ error:'Server error' }) }
})
router.delete('/:id', admin, async (req, res) => {
  try {
    if (req.params.id===req.staff.id) return res.status(400).json({ error:'自分自身は削除できません' })
    await db.staff.delete({ where:{ id:req.params.id } }); res.json({ ok:true })
  } catch { res.status(500).json({ error:'Server error' }) }
})
export default router
