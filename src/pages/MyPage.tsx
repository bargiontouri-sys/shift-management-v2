import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/store'
import { api } from '../lib/api'
import { dateDk, yen } from '../lib/utils'

const ICON_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#3b82f6','#06b6d4','#84cc16','#f97316',
  '#e11d48','#7c3aed','#0891b2','#059669','#d97706',
]

function getPayPeriod(date: Date) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
  if (d >= 11) {
    return { start: new Date(y, m, 11), end: new Date(y, m+1, 10), label: `${m+1}/11 〜 ${m+2}/10` }
  }
  return { start: new Date(y, m-1, 11), end: new Date(y, m, 10), label: `${m}/11 〜 ${m+1}/10` }
}

function calcPay(wage: number, type: string, stdH: number, fixOT: number, inT: string, outT: string) {
  const pt = (t: string) => { const [h,m] = t.split(':').map(Number); return h+m/60 }
  const s = pt(inT); let e = pt(outT); if (e < s) e += 24
  const raw = e-s
  const breakH = raw>8?1:raw>6?0.75:0
  const total = raw-breakH, ot = Math.max(0, total-8), ln = Math.max(0, Math.min(e,29)-Math.max(s,22))
  const bh = type === 'full-time' ? wage/(stdH||160) : wage
  const base = type === 'part-time' ? (total-ot)*bh : 0
  const otP = type === 'part-time' ? ot*bh*1.25 : 0
  const lnP = ln*bh*0.25
  return { total, ot, ln, breakH, base, otP, lnP, pay: base+otP+lnP, bh }
}

export default function MyPage() {
  const { staff, setAuth } = useAuth()
  const [cur, setCur] = useState('')
  const [nxt, setNxt] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNxt, setShowNxt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [punches, setPunches] = useState<any[]>([])
  const [viewDate, setViewDate] = useState(new Date())
  const [selDay, setSelDay] = useState<string|null>(null)
  const [iconColor, setIconColor] = useState('')

  useEffect(() => {
    if (staff?.iconColor) setIconColor(staff.iconColor)
  }, [staff?.iconColor])

  if (!staff) return null

  const pp = getPayPeriod(viewDate)

  useEffect(() => {
    const from = dateDk(pp.start)
    const to = dateDk(pp.end)
    api.get(`/api/punches?from=${from}&to=${to}&staffId=${staff.id}`).then(r => setPunches(r.data)).catch(() => {})
  }, [viewDate])

  const prevPeriod = () => { const d = new Date(viewDate); d.setMonth(d.getMonth()-1); setViewDate(d) }
  const nextPeriod = () => { const d = new Date(viewDate); d.setMonth(d.getMonth()+1); setViewDate(d) }

  const byDate: Record<string, any[]> = {}
  punches.forEach(p => { if (!byDate[p.date]) byDate[p.date] = []; byDate[p.date].push(p) })

  let totalHours = 0, totalLN = 0, totalOT = 0, totalPay = 0, totalBreak = 0
  const dayStats: any[] = []

  Object.entries(byDate).sort().forEach(([date, logs]) => {
    const ins = logs.filter(l => l.type==='in'), outs = logs.filter(l => l.type==='out')
    for (let i=0; i<Math.min(ins.length,outs.length); i++) {
      const c = calcPay(staff.wage, staff.type, staff.standardMonthlyHours||160, staff.fixedOvertimeHours||20, ins[i].time, outs[i].time)
      totalHours += c.total; totalLN += c.ln; totalOT += c.ot; totalPay += c.pay; totalBreak += c.breakH
      dayStats.push({ date, inT:ins[i].time, outT:outs[i].time, hours:c.total, ln:c.ln, ot:c.ot, pay:c.pay, breakH:c.breakH })
    }
  })

  let totalWage = 0
  if (staff.type === 'full-time') {
    const bh = staff.wage / (staff.standardMonthlyHours||160)
    const extraOT = Math.max(0, totalOT - (staff.fixedOvertimeHours||0))
    totalWage = staff.wage + extraOT*bh*1.25 + totalLN*bh*0.25
  } else { totalWage = totalPay }

  const changePin = async () => {
    if (nxt.length!==4||!/^\d+$/.test(nxt)) { toast.error('4桁の数字を入力してください'); return }
    setSaving(true)
    try {
      await api.patch('/api/auth/pin', { currentPin:cur, newPin:nxt })
      toast.success('PINを変更しました'); setCur(''); setNxt('')
    } catch(e:any) { toast.error(e.response?.data?.error||'変更に失敗しました') }
    finally { setSaving(false) }
  }

  const changeIconColor = async (color: string) => {
    setIconColor(color)
    try {
      await api.patch('/api/staff/icon-color', { iconColor: color })
      // storeのstaffも更新
      const me = await api.get('/api/auth/me')
      toast.success('アイコンカラーを変更しました')
    } catch { toast.error('変更に失敗しました') }
  }

  const currentColor = iconColor || '#6366f1'

  const inpStyle: React.CSSProperties = {
    flex:1, background:'var(--bg3)', border:'1px solid var(--bd2)', padding:'9px 12px',
    fontSize:14, color:'var(--tx)', outline:'none', borderRadius:'var(--r)',
    fontFamily:'var(--mono)', letterSpacing:'0.3em', boxSizing:'border-box' as any
  }

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2 style={{ fontSize:14, fontWeight:900 }}>マイページ</h2>

      {/* プロフィール */}
      <div className="card">
        <p className="lbl" style={{ marginBottom:14 }}>プロフィール</p>
        {[
          ['名前', staff.name, 'var(--tx)'],
          ...(staff.isAdmin ? [
            ['雇用形態', staff.type==='full-time'?'正社員':'アルバイト', 'var(--tx)'],
            ['役割', staff.role, 'var(--tx)'],
            [staff.type==='full-time'?'月給':'時給', `¥${staff.wage.toLocaleString()}${staff.type==='full-time'?'':'/h'}`, 'var(--ac)'],
            ['権限', '管理者', 'var(--ac)'],
          ] : [
            [staff.type==='full-time'?'月給':'時給', `¥${staff.wage.toLocaleString()}${staff.type==='full-time'?'':'/h'}`, 'var(--ac)'],
          ]),
        ].map(([l, v, c]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--bd)' }}>
            <span style={{ fontSize:11, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</span>
            <span style={{ fontWeight:900, color:c as string, fontSize:13, fontFamily:'var(--mono)' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* アイコンカラー */}
      <div className="card">
        <p className="lbl" style={{ marginBottom:14 }}>アイコンカラー</p>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <div style={{ width:48, height:48, background:currentColor, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:900 }}>{staff.name[0]}</div>
          <span style={{ fontSize:12, color:'var(--tx3)' }}>選択中: <span style={{ color:currentColor, fontWeight:700 }}>{currentColor}</span></span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {ICON_COLORS.map(color => (
            <button key={color} onClick={() => changeIconColor(color)}
              style={{ aspectRatio:'1', background:color, borderRadius:'6px', border:`3px solid ${currentColor===color?'var(--tx)':'transparent'}`, cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {currentColor===color && <span style={{ color:'#fff', fontSize:16, fontWeight:900 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 勤怠・給与 */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p className="lbl" style={{ margin:0 }}>勤怠・給与明細</p>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={prevPeriod} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:'4px 8px', borderRadius:'var(--r)', fontSize:11 }}>＜</button>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--tx)', minWidth:120, textAlign:'center' }}>{pp.label}</span>
            <button onClick={nextPeriod} disabled={viewDate >= new Date()} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:'4px 8px', borderRadius:'var(--r)', fontSize:11, opacity: viewDate >= new Date() ? 0.3 : 1 }}>＞</button>
          </div>
        </div>

        <div style={{ background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:14, marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:8, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:4 }}>概算給与</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:700, color:'var(--ac)', lineHeight:1 }}>{yen(totalWage)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:8, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:4 }}>総労働時間</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, color:'var(--tx)', lineHeight:1 }}>{totalHours.toFixed(1)}h</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['深夜手当', `${totalLN.toFixed(1)}h`, 'var(--purple)'], ['残業時間', `${totalOT.toFixed(1)}h`, 'var(--red)']].map(([l,v,c]) => (
              <div key={l} style={{ background:'var(--bg2)', padding:'8px 10px', borderRadius:'var(--r)' }}>
                <div style={{ fontSize:8, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:c as string }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {dayStats.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', color:'var(--tx3)', fontSize:11 }}>この期間の勤務記録はありません</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {dayStats.map(d => (
              <div key={d.date}>
                <button onClick={() => setSelDay(selDay===d.date?null:d.date)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:selDay===d.date?'var(--bg4)':'var(--bg3)', border:`1px solid ${selDay===d.date?'var(--bd2)':'var(--bd)'}`, borderRadius:'var(--r)', padding:'10px 12px', cursor:'pointer', transition:'all 0.12s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:'var(--tx)', minWidth:40 }}>{d.date.split('-').slice(1).join('/')}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--tx2)' }}>{d.inT} 〜 {d.outT}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--tx2)' }}>{d.hours.toFixed(1)}h</span>
                    {staff.type === 'part-time' && <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:'var(--ac)' }}>{yen(d.pay)}</span>}
                  </div>
                </button>
                {selDay===d.date&&(
                  <div style={{ background:'var(--bg4)', border:'1px solid var(--bd2)', borderTop:'none', borderRadius:`0 0 var(--r) var(--r)`, padding:'10px 14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                      {[['深夜',`${d.ln.toFixed(1)}h`,'var(--purple)'],['残業',`${d.ot.toFixed(1)}h`,'var(--red)'],['給与',yen(d.pay),'var(--ac)']].map(([l,v,c])=>(
                        <div key={l} style={{ textAlign:'center' }}>
                          <div style={{ fontSize:8, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', marginBottom:3 }}>{l}</div>
                          <div style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:c as string }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PIN変更 */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <Lock size={13} color="var(--ac)"/>
          <p className="lbl" style={{ margin:0 }}>PINコード変更</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            ['現在のPIN', cur, setCur, showCur, setShowCur],
            ['新しいPIN', nxt, setNxt, showNxt, setShowNxt],
          ].map(([l, v, fn, show, setShow]: any) => (
            <div key={l}>
              <label className="lbl">{l}</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type={show ? 'text' : 'password'} maxLength={4} value={v} onChange={e => fn(e.target.value.replace(/\D/g,''))} placeholder="••••" style={inpStyle}/>
                <button onClick={() => setShow((s: boolean) => !s)}
                  style={{ background:'var(--bg3)', border:'1px solid var(--bd2)', color:'var(--tx3)', borderRadius:'var(--r)', padding:'9px 12px', cursor:'pointer', flexShrink:0 }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-p" onClick={changePin} disabled={saving||cur.length!==4||nxt.length!==4} style={{ width:'100%', marginTop:4 }}>
            {saving ? '変更中...' : 'PINを変更する'}
          </button>
        </div>
      </div>
    </div>
  )
}
