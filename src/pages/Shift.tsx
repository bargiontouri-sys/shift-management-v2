// ===== Shift.tsx =====
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/store'
import { WEEKDAYS, HOLIDAYS, nameColor, dateDk, todayDk } from '../lib/utils'
import { api } from '../lib/api'

export function Shift() {
  const { staff } = useAuth()
  const [vd, setVd] = useState(new Date())
  const [allStaff, setAllStaff] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const y=vd.getFullYear(),m=vd.getMonth()
  const last=new Date(y,m+1,0).getDate()
  const days=Array.from({length:last},(_,i)=>new Date(y,m,i+1))
  const today=todayDk()

  useEffect(()=>{
    api.get('/api/staff').then(r=>setAllStaff(r.data)).catch(()=>{})
    const from=`${y}-${String(m+1).padStart(2,'0')}-01`,to=`${y}-${String(m+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`
    api.get(`/api/shifts?from=${from}&to=${to}`).then(r=>setShifts(r.data)).catch(()=>{})
  },[y,m])

  const gs=(sid:string,d:string)=>shifts.find(s=>s.staffId===sid&&s.date===d)
  const nav=(dir:number)=>setVd(d=>new Date(d.getFullYear(),d.getMonth()+dir,1))

  return (
    <div className="fu">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h2 style={{ fontSize:14, fontWeight:900 }}>シフト確認</h2>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={()=>nav(-1)} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)' }}><ChevronLeft size={14}/></button>
          <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, minWidth:52, textAlign:'center' }}>{y}.{m+1}</span>
          <button onClick={()=>nav(1)} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)' }}><ChevronRight size={14}/></button>
        </div>
      </div>
      <div style={{ overflowX:'auto', border:'1px solid var(--bd)', borderRadius:'var(--r2)', background:'var(--bg2)' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, minWidth:600 }}>
          <thead>
            <tr style={{ background:'var(--bg)', position:'sticky', top:0, zIndex:10 }}>
              <th style={{ position:'sticky', left:0, zIndex:20, background:'var(--bg)', padding:'8px 10px', textAlign:'left', fontSize:8, fontWeight:900, color:'var(--tx3)', textTransform:'uppercase', borderBottom:'1px solid var(--bd)', borderRight:'1px solid var(--bd)', width:86 }}>スタッフ</th>
              {days.map(d=>{const k=dateDk(d),hw=HOLIDAYS[k],dw=d.getDay(),it=k===today;return(
                <th key={k} style={{ padding:'5px 2px', textAlign:'center', borderBottom:'1px solid var(--bd)', borderRight:'1px solid var(--bd)', minWidth:44, background:it?'rgba(255,255,255,0.03)':'transparent' }}>
                  <div style={{ fontSize:9, fontFamily:'var(--mono)', fontWeight:900, color:dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)' }}>{d.getDate()}</div>
                  <div style={{ fontSize:7, fontWeight:900, color:dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)', opacity:.6 }}>{WEEKDAYS[dw]}</div>
                </th>
              )})}
            </tr>
          </thead>
          <tbody>
            {allStaff.map(s=>(
              <tr key={s.id}>
                <td style={{ position:'sticky', left:0, zIndex:5, background:'var(--bg)', padding:'6px 10px', borderBottom:'1px solid var(--bd)', borderRight:'1px solid var(--bd)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:18, height:18, background:nameColor(s.name), borderRadius:'2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#fff', fontWeight:900, flexShrink:0 }}>{s.name[0]}</div>
                    <span style={{ fontSize:9, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:54 }}>{s.name}</span>
                  </div>
                </td>
                {days.map(d=>{const k=dateDk(d),sh=gs(s.id,k),it=k===today;return(
                  <td key={k} style={{ padding:3, borderBottom:'1px solid var(--bd)', borderRight:'1px solid var(--bd)', textAlign:'center', background:it?'rgba(255,255,255,0.02)':'transparent' }}>
                    {sh&&sh.type!=='off'
                      ?<div style={{ fontSize:7, fontFamily:'var(--mono)', fontWeight:700, padding:'2px', background:'rgba(0,232,122,0.12)', color:'var(--green)', borderRadius:'2px', lineHeight:1.4 }}>{sh.start}<br/>{sh.end}</div>
                      :<span style={{ fontSize:7, color:'var(--tx3)', fontWeight:700 }}>—</span>}
                  </td>
                )})}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Shift
