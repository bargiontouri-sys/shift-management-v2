import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { admin } from '../middleware/auth.js'
const router = Router(), db = new PrismaClient()

function calcPay(staff, inT, outT) {
  const pt = t => { const [h,m]=t.split(':').map(Number); return h+m/60 }
  const s=pt(inT); let e=pt(outT); if(e<s) e+=24
  const raw=e-s
  const breakH = raw>8?1:raw>6?0.75:0
  const total=raw-breakH, ot=Math.max(0,total-8), ln=Math.max(0,Math.min(e,29)-Math.max(s,22))
  const bh=staff.type==='full-time'?staff.wage/(staff.standardMonthlyHours||160):staff.wage
  const base=staff.type==='part-time'?(total-ot)*bh:0
  const otP=staff.type==='part-time'?ot*bh*1.25:0
  return { total, ot, ln, breakH, pay:base+otP+ln*bh*0.25 }
}

router.get('/', admin, async (req, res) => {
  try {
    const { from, to } = req.query
    if (!from||!to) return res.status(400).json({ error:'from and to required' })
    const allStaff = await db.staff.findMany({ where:{ storeId:req.staff.storeId }, select:{ id:true, name:true, type:true, wage:true, fixedOvertimeHours:true, standardMonthlyHours:true }, orderBy:{ sortOrder:'asc' } })
    const punches = await db.punch.findMany({ where:{ staffId:{ in:allStaff.map(s=>s.id) }, date:{ gte:from, lte:to } }, orderBy:[{ staffId:'asc' },{ date:'asc' },{ createdAt:'asc' }] })

    const staffStats = allStaff.map(staff => {
      const sp=punches.filter(p=>p.staffId===staff.id)
      const byDate={}
      sp.forEach(p=>{ if(!byDate[p.date]) byDate[p.date]=[]; byDate[p.date].push(p) })
      let totalHours=0,totalLN=0,totalOT=0,totalPay=0,totalBreak=0
      const days=[]
      Object.entries(byDate).forEach(([date,logs])=>{
        const ins=logs.filter(l=>l.type==='in'),outs=logs.filter(l=>l.type==='out')
        let dh=0,dl=0,do_=0,dp=0,db=0
        for(let i=0;i<Math.min(ins.length,outs.length);i++){
          const c=calcPay(staff,ins[i].time,outs[i].time)
          dh+=c.total;dl+=c.ln;do_+=c.ot;dp+=c.pay;db+=c.breakH
        }
        totalHours+=dh;totalLN+=dl;totalOT+=do_;totalPay+=dp;totalBreak+=db
        days.push({date,hours:dh,lnHours:dl,otHours:do_,pay:dp,breakHours:db})
      })
      let totalWage
      if(staff.type==='full-time'){
        const bh=staff.wage/(staff.standardMonthlyHours||160)
        totalWage=staff.wage+Math.max(0,totalOT-(staff.fixedOvertimeHours||0))*bh*1.25+totalLN*bh*0.25
      } else { totalWage=totalPay }
      return { staff:{ id:staff.id, name:staff.name, type:staff.type, wage:staff.wage }, totalHours, totalLNHours:totalLN, totalOTHours:totalOT, totalBreakHours:totalBreak, totalWage, days }
    })

    res.json({ from, to, totalWage:staffStats.reduce((a,s)=>a+s.totalWage,0), totalHours:staffStats.reduce((a,s)=>a+s.totalHours,0), staff:staffStats })
  } catch(e) { console.error(e); res.status(500).json({ error:'Server error' }) }
})
export default router
