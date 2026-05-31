import { useState, useEffect } from 'react'
import { Edit2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { todayDk, WEEKDAYS, dateDk } from '../lib/utils'
import { api } from '../lib/api'

export default function AdminPunch() {
  const [allPunches, setAllPunches] = useState<any[]>([])
  const [allStaff, setAllStaff] = useState<any[]>([])
  const [editPunch, setEditPunch] = useState<any>(null)
  const [editTime, setEditTime] = useState('')
  const [loading, setLoading] = useState(false)
  const today = todayDk()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        api.get(`/api/punches?from=${today}&to=${today}`),
        api.get('/api/staff'),
      ])
      setAllPunches(p.data.filter((x: any) => x.date === today))
      setAllStaff(s.data)
    } catch {} finally { setLoading(false) }
  }

  const savePunchEdit = async () => {
    if (!editPunch) return
    try {
      await api.patch(`/api/punches/${editPunch.id}`, { type: editPunch.type, time: editTime })
      toast.success('打刻を修正しました')
      setEditPunch(null)
      fetchData()
    } catch { toast.error('修正に失敗しました') }
  }

  const deletePunch = async (id: string) => {
    if (!confirm('この打刻を削除しますか？')) return
    try { await api.delete(`/api/punches/${id}`); toast.success('削除しました'); fetchData() }
    catch { toast.error('削除に失敗しました') }
  }

  const addPunch = async (staffId: string, type: 'in' | 'out') => {
    const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const time = jst.toISOString().slice(11, 16)
    try {
      await api.post('/api/punches/admin', { staffId, type, time, date: today })
      toast.success(`${type === 'in' ? '出勤' : '退勤'}を記録しました`)
      fetchData()
    } catch { toast.error('記録に失敗しました') }
  }

  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']
  const nc = (n: string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

  const clockedIn = allStaff.filter(s => {
    const sp = allPunches.filter(p => p.staffId === s.id)
    return sp[sp.length-1]?.type === 'in'
  }).length
  const clockedOut = allStaff.filter(s => {
    const sp = allPunches.filter(p => p.staffId === s.id)
    const last = sp[sp.length-1]
    return last && last.type === 'out'
  }).length

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontSize:14, fontWeight:900 }}>退勤管理</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, color:'var(--tx3)', fontFamily:'var(--mono)' }}>{today}</span>
          <button onClick={fetchData} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)', display:'flex', alignItems:'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
          </button>
        </div>
      </div>

      {/* 集計 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          ['出勤中', clockedIn, 'var(--green)'],
          ['退勤済', clockedOut, 'var(--tx2)'],
          ['未打刻', allStaff.length - clockedIn - clockedOut, 'var(--tx3)'],
        ].map(([l, v, c]) => (
          <div key={l as string} className="card" style={{ padding:12, textAlign:'center' }}>
            <div style={{ fontSize:8, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{l}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:700, color:c as string }}>{v}</div>
          </div>
        ))}
      </div>

      {/* スタッフ一覧 */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {allStaff.map(s => {
          const sp = allPunches.filter(p => p.staffId === s.id)
          const sl = sp[sp.length-1]
          const isClockedIn = sl?.type === 'in'
          const hasAny = sp.length > 0

          return (
            <div key={s.id} className="card" style={{ padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: hasAny ? 12 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, background:nc(s.name), borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', fontWeight:900 }}>{s.name[0]}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{s.name}</div>
                    <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700 }}>{s.role}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, fontWeight:900, padding:'3px 10px', borderRadius:'3px', background:isClockedIn?'rgba(0,232,122,0.1)':hasAny?'rgba(255,61,90,0.1)':'var(--bg3)', color:isClockedIn?'var(--green)':hasAny?'var(--red)':'var(--tx3)', border:`1px solid ${isClockedIn?'rgba(0,232,122,0.25)':hasAny?'rgba(255,61,90,0.25)':'var(--bd)'}` }}>
                    {isClockedIn ? `出勤中 ${sl.time}〜` : hasAny ? `退勤済 ${sl.time}` : '未打刻'}
                  </span>
                </div>
              </div>

              {/* 打刻一覧と修正 */}
              {hasAny && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {sp.map((p: any) => (
                    <div key={p.id}>
                      {editPunch?.id === p.id ? (
                        <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:'var(--r)', padding:'4px 8px' }}>
                          <span style={{ fontSize:9, color:p.type==='in'?'var(--green)':'var(--red)', fontWeight:700 }}>{p.type==='in'?'IN':'OUT'}</span>
                          <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                            style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'2px 6px', fontSize:11, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)', width:90 }}/>
                          <button onClick={savePunchEdit} style={{ background:'var(--green)', border:'none', color:'#000', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700 }}>保存</button>
                          <button onClick={() => setEditPunch(null)} style={{ background:'var(--bg4)', border:'1px solid var(--bd)', color:'var(--tx3)', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10 }}>×</button>
                          <button onClick={() => deletePunch(p.id)} style={{ background:'rgba(255,61,90,0.1)', border:'1px solid rgba(255,61,90,0.25)', color:'var(--red)', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10 }}>削除</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditPunch(p); setEditTime(p.time) }}
                          style={{ display:'flex', alignItems:'center', gap:4, background:p.type==='in'?'rgba(0,232,122,0.08)':'rgba(255,61,90,0.08)', border:`1px solid ${p.type==='in'?'rgba(0,232,122,0.2)':'rgba(255,61,90,0.2)'}`, borderRadius:'var(--r)', padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'var(--mono)', color:p.type==='in'?'var(--green)':'var(--red)', fontWeight:700 }}>
                          {p.type==='in'?'IN':'OUT'} {p.time} <Edit2 size={10}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 手動打刻ボタン */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => addPunch(s.id, 'in')} disabled={isClockedIn}
                  style={{ flex:1, padding:'8px', fontSize:10, fontWeight:900, background:isClockedIn?'var(--bg3)':'rgba(0,232,122,0.1)', color:isClockedIn?'var(--tx3)':'var(--green)', border:`1px solid ${isClockedIn?'var(--bd)':'rgba(0,232,122,0.3)'}`, borderRadius:'var(--r)', cursor:isClockedIn?'not-allowed':'pointer', opacity:isClockedIn?0.4:1 }}>
                  ＋ 出勤記録
                </button>
                <button onClick={() => addPunch(s.id, 'out')} disabled={!isClockedIn}
                  style={{ flex:1, padding:'8px', fontSize:10, fontWeight:900, background:!isClockedIn?'var(--bg3)':'rgba(255,61,90,0.1)', color:!isClockedIn?'var(--tx3)':'var(--red)', border:`1px solid ${!isClockedIn?'var(--bd)':'rgba(255,61,90,0.3)'}`, borderRadius:'var(--r)', cursor:!isClockedIn?'not-allowed':'pointer', opacity:!isClockedIn?0.4:1 }}>
                  ＋ 退勤記録
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
