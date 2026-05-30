// routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { signToken, auth } from '../middleware/auth.js'
const r = Router(), db = new PrismaClient()

r.get('/store-staff/:storeId', async (req, res) => {
  try {
    const s = await db.staff.findMany({ where:{ storeId:req.params.storeId }, select:{ id:true, name:true, role:true }, orderBy:{ name:'asc' } })
    res.json(s)
  } catch { res.status(500).json({ error:'Server error' }) }
})
r.post('/login', async (req, res) => {
  try {
    const { staffId, pin } = req.body
    if (!staffId||!pin) return res.status(400).json({ error:'staffId and pin required' })
    const s = await db.staff.findUnique({ where:{ id:staffId }, include:{ store:{ select:{ id:true, name:true } } } })
    if (!s||!(await bcrypt.compare(pin, s.pin))) return res.status(401).json({ error:'認証に失敗しました' })
    const { pin:_, ...safe } = s
    res.json({ token: signToken({ id:s.id, storeId:s.storeId, name:s.name, isAdmin:s.isAdmin }), staff:safe })
  } catch { res.status(500).json({ error:'Server error' }) }
})
r.get('/me', auth, async (req, res) => {
  try {
    const s = await db.staff.findUnique({ where:{ id:req.staff.id }, include:{ store:{ select:{ id:true, name:true } } } })
    if (!s) return res.status(404).json({ error:'Not found' })
    const { pin:_, ...safe } = s; res.json(safe)
  } catch { res.status(500).json({ error:'Server error' }) }
})
r.patch('/pin', auth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body
    if (!newPin||newPin.length!==4||!/^\d+$/.test(newPin)) return res.status(400).json({ error:'4桁の数字を入力してください' })
    const s = await db.staff.findUnique({ where:{ id:req.staff.id } })
    if (!(await bcrypt.compare(currentPin, s.pin))) return res.status(401).json({ error:'現在のPINが正しくありません' })
    await db.staff.update({ where:{ id:req.staff.id }, data:{ pin: await bcrypt.hash(newPin, 10) } })
    res.json({ ok:true })
  } catch { res.status(500).json({ error:'Server error' }) }
})
export { r as authRouter }

// routes/staff.js
import { admin } from '../middleware/auth.js'
const sr = Router(), sdb = new PrismaClient()
sr.get('/', async (req, res) => {
  try {
    const s = await sdb.staff.findMany({ where:{ storeId:req.staff.storeId }, select:{ id:true, name:true, role:true, type:true, wage:true, isAdmin:true, fixedOvertimeHours:true, standardMonthlyHours:true }, orderBy:{ name:'asc' } })
    res.json(s)
  } catch { res.status(500).json({ error:'Server error' }) }
})
sr.post('/', admin, async (req, res) => {
  try {
    const { name, role, type, wage, pin, isAdmin, fixedOvertimeHours, standardMonthlyHours } = req.body
    if (!name||!pin||pin.length!==4) return res.status(400).json({ error:'名前と4桁のPINが必要です' })
    const cnt = await sdb.staff.count({ where:{ storeId:req.staff.storeId } })
    if (cnt>=30) return res.status(400).json({ error:'スタッフ上限に達しています' })
    const s = await sdb.staff.create({ data:{ storeId:req.staff.storeId, name, role:role||'スタッフ', type:type||'part-time', wage:wage||1000, pin: await bcrypt.hash(pin, 10), isAdmin:isAdmin||false, fixedOvertimeHours:fixedOvertimeHours||20, standardMonthlyHours:standardMonthlyHours||160 } })
    const { pin:_, ...safe } = s; res.status(201).json(safe)
  } catch { res.status(500).json({ error:'Server error' }) }
})
sr.patch('/:id', admin, async (req, res) => {
  try {
    const { pin, ...rest } = req.body; const data = { ...rest }
    if (pin) { if (pin.length!==4) return res.status(400).json({ error:'PINは4桁' }); data.pin = await bcrypt.hash(pin, 10) }
    const s = await sdb.staff.update({ where:{ id:req.params.id }, data })
    const { pin:_, ...safe } = s; res.json(safe)
  } catch { res.status(500).json({ error:'Server error' }) }
})
sr.delete('/:id', admin, async (req, res) => {
  try {
    if (req.params.id===req.staff.id) return res.status(400).json({ error:'自分自身は削除できません' })
    await sdb.staff.delete({ where:{ id:req.params.id } }); res.json({ ok:true })
  } catch { res.status(500).json({ error:'Server error' }) }
})
export { sr as staffRouter }
