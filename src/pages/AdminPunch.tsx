import { useState, useEffect } from 'react'
import { Edit2, RefreshCw, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { WEEKDAYS, HOLIDAYS, dateDk, todayDk } from '../lib/utils'
import { api } from '../lib/api'

export default function AdminPunch() {
  const [allStaff, setAllStaff] = useState<any[]>([])
  const [selStaff, setSelStaff] = useState<any>(null)
  const [punches, setPunches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [selDay, setSelDay] = useState<string>(todayDk())
  const [editPunch, setEditPunch] = useState<any>(null)
  const [editTime, setEditTime] = useState('')
  const [editType, setEditType] = useState<'in'|'out'>('in')
  const [addMode, setAddMode] = useState(false)
  const [newTime, setNewTime] = useState('18:00')
  const [newType, setNewType] = useState<'in'|'out'>('in')

  const y = viewDate.getFullYear(), m = viewDate.getMonth()
  const lastDate = new Date(y, m+1, 0).getDate()
  const today = todayDk()

  // 過去6ヶ月以内かチェック
  const minDate = new Date()
  minDate.setMonth(minDate.getMonth() - 6)

  useEffect(() => {
    api.get('/api/staff').then(r => {
      setAllStaff(r.data)
      if (r.data.length > 0) setSelStaff(r.data[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selStaff) return
    fetchPunches()
  }, [selStaff, y, m])

  const fetchPunches = async () => {
    if (!selStaff) return
    setLoading(true)
    try {
      const from = `${y}-${String(m+1).padStart(2,'0')}-01`
      const to = `${y}-${String(m+1).padStart(2,'0')}-${String(lastDate).padStart(2,'0')}`
      const { data } = await api.get(`/api/punches?staffId=${selStaff.id}&from=${from}&to=${to}`)
      setPunches(data)
    } catch {} finally { setLoading(false) }
  }

  const getDayPunches = (date: string) => punches.filter(p => p.date === date)

  const saveEdit = async () => {
    if (!editPunch) return
    try {
      await api.patch(`/api/punches/${editPunch.id}`, { type: editType, time: editTime })
      toast.success('修正しました')
      setEditPunch(null)
      fetchPunches()
    } catch { toast.error('修正に失敗しました') }
  }

  const deletePunch = async (id: string) => {
    if (!confirm('この打刻を削除しますか？')) return
    try {
      await api.delete(`/api/punches/${id}`)
      toast.success('削除しました')
      fetchPunches()
    } catch { toast.error('削除に失敗しました') }
  }

  const addPunch = async () => {
    if (!selStaff) return
    try {
      // 管理者が手動で打刻を追加（既存のPOSTエンドポイントを使い、date/timeを直接指定）
      await api.post('/api/punches/manual', {
        staffId: selStaff.id,
        date: selDay,
        type: newType,
        time: newTime,
      })
      toast.success('打刻を追加しました')
      setAddMode(false)
      fetchPunches()
    } catch (e: any) {
      // fallback: patch existing or handle error
      toast.error(e.response?.data?.error || '追加に失敗しました')
    }
  }

  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']
  const nc = (n: string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

  const days = Array.from({ length: lastDate }, (_, i) => new Date(y, m, i+1))
  const selDayPunches = getDayPunches(selDay)
  const isInRange = (d: Date) => d >= minDate

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontSize:14, fontWeight:900 }}>退勤管理</h2>
        <button onClick={fetchPunches} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)', display:'flex', alignItems:'center' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
      </div>

      {/* スタッフ選択 */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {allStaff.map((s, i) => (
          <button key={s.id} onClick={() => { setSelStaff(s); setEditPunch(null); setAddMode(false) }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', border:`2px solid ${selStaff?.id===s.id?'var(--tx)':'var(--bd)'}`, background:selStaff?.id===s.id?'var(--tx)':'var(--bg3)', color:selStaff?.id===s.id?'var(--bg)':'var(--tx2)', borderRadius:'var(--r)', fontSize:11, fontWeight:700, transition:'all 0.12s' }}>
            <div style={{ width:20, height:20, background:nc(s.name), borderRadius:'2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff', fontWeight:900 }}>{s.name[0]}</div>
            {s.name}
          </button>
        ))}
      </div>

      {selStaff && (<>
        {/* 月ナビ */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--tx)' }}>{y}年{m+1}月</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
              style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)' }}><ChevronLeft size={14}/></button>
            <button onClick={() => setViewDate(new Date())}
              style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx3)', padding:'6px 10px', borderRadius:'var(--r)', fontSize:10, fontWeight:700 }}>今月</button>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
              disabled={new Date(y, m+1, 1) > new Date()}
              style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)', opacity: new Date(y, m+1, 1) > new Date() ? 0.3 : 1 }}><ChevronRight size={14}/></button>
          </div>
        </div>

        {/* カレンダー */}
        <div className="card" style={{ padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
            {WEEKDAYS.map((d,i) => <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:900, color:i===0?'var(--red)':i===6?'var(--blue)':'var(--tx3)' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {Array(new Date(y,m,1).getDay()).fill(null).map((_,i) => <div key={`e${i}`}/>)}
            {days.map(date => {
              const k = dateDk(date)
              const dp = getDayPunches(k)
              const dw = date.getDay()
              const hw = HOLIDAYS[k]
              const isToday = k === today
              const isSel = k === selDay
              const inRange = isInRange(date)
              const hasPunch = dp.length > 0
              const lastP = dp[dp.length-1]
              const dotColor = lastP?.type === 'in' ? 'var(--green)' : hasPunch ? 'var(--red)' : null

              return (
                <button key={k} onClick={() => { if(inRange){ setSelDay(k); setEditPunch(null); setAddMode(false) } }}
                  style={{ aspectRatio:'1', background:isSel?'var(--tx)':isToday?'rgba(255,255,255,0.06)':'var(--bg3)', border:`1.5px solid ${isSel?'var(--tx)':isToday?'var(--tx2)':'var(--bd)'}`, borderRadius:'var(--r)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:inRange?'pointer':'not-allowed', opacity:inRange?1:0.3, gap:2 }}>
                  <span style={{ fontSize:9, fontWeight:900, fontFamily:'var(--mono)', color:isSel?'var(--bg)':dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)' }}>{date.getDate()}</span>
                  {dotColor && <div style={{ width:4, height:4, borderRadius:'50%', background:isSel?'var(--bg)':dotColor }}/>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 選択日の打刻詳細 */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <span style={{ fontSize:12, fontWeight:900, fontFamily:'var(--mono)', color:'var(--ac)' }}>{selDay.split('-').slice(1).join('/')}</span>
              <span style={{ fontSize:11, color:'var(--tx3)', marginLeft:8 }}>{selStaff.name}</span>
            </div>
            <button onClick={() => { setAddMode(v => !v); setEditPunch(null) }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'rgba(240,192,64,0.1)', border:'1px solid rgba(240,192,64,0.3)', color:'var(--ac)', borderRadius:'var(--r)', fontSize:10, fontWeight:900, cursor:'pointer' }}>
              <Plus size={12}/> 打刻追加
            </button>
          </div>

          {/* 打刻追加フォーム */}
          {addMode && (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:'var(--r)', padding:12, marginBottom:12, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <select value={newType} onChange={e => setNewType(e.target.value as 'in'|'out')}
                style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'6px 10px', fontSize:11, color:'var(--tx)', outline:'none', borderRadius:'var(--r)', fontWeight:700 }}>
                <option value="in">出勤</option>
                <option value="out">退勤</option>
              </select>
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'6px 10px', fontSize:11, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}/>
              <button onClick={addPunch}
                style={{ padding:'6px 14px', background:'var(--ac)', border:'none', color:'#000', borderRadius:'var(--r)', fontSize:10, fontWeight:900, cursor:'pointer' }}>追加</button>
              <button onClick={() => setAddMode(false)}
                style={{ padding:'6px 14px', background:'var(--bg4)', border:'1px solid var(--bd)', color:'var(--tx3)', borderRadius:'var(--r)', fontSize:10, cursor:'pointer' }}>キャンセル</button>
            </div>
          )}

          {/* 打刻リスト */}
          {selDayPunches.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--tx3)', fontSize:11 }}>打刻記録なし</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {selDayPunches.map((p: any) => (
                <div key={p.id}>
                  {editPunch?.id === p.id ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:'var(--r)', padding:10 }}>
                      <select value={editType} onChange={e => setEditType(e.target.value as 'in'|'out')}
                        style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'5px 8px', fontSize:11, color:'var(--tx)', outline:'none', borderRadius:'var(--r)', fontWeight:700 }}>
                        <option value="in">出勤</option>
                        <option value="out">退勤</option>
                      </select>
                      <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                        style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'5px 8px', fontSize:12, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}/>
                      <button onClick={saveEdit} style={{ padding:'6px 14px', background:'var(--green)', border:'none', color:'#000', borderRadius:'var(--r)', fontSize:10, fontWeight:900, cursor:'pointer' }}>保存</button>
                      <button onClick={() => setEditPunch(null)} style={{ padding:'6px 12px', background:'var(--bg4)', border:'1px solid var(--bd)', color:'var(--tx3)', borderRadius:'var(--r)', fontSize:10, cursor:'pointer' }}>×</button>
                      <button onClick={() => deletePunch(p.id)} style={{ padding:'6px 12px', background:'rgba(255,61,90,0.1)', border:'1px solid rgba(255,61,90,0.25)', color:'var(--red)', borderRadius:'var(--r)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><Trash2 size={12}/>削除</button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg3)', border:`1px solid ${p.type==='in'?'rgba(0,232,122,0.2)':'rgba(255,61,90,0.2)'}`, borderRadius:'var(--r)', padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:10, fontWeight:900, padding:'3px 10px', borderRadius:'3px', background:p.type==='in'?'rgba(0,232,122,0.1)':'rgba(255,61,90,0.1)', color:p.type==='in'?'var(--green)':'var(--red)', border:`1px solid ${p.type==='in'?'rgba(0,232,122,0.25)':'rgba(255,61,90,0.25)'}` }}>{p.type==='in'?'出勤':'退勤'}</span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:'var(--tx)' }}>{p.time}</span>
                      </div>
                      <button onClick={() => { setEditPunch(p); setEditTime(p.time); setEditType(p.type) }}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'var(--bg4)', border:'1px solid var(--bd)', color:'var(--tx2)', borderRadius:'var(--r)', fontSize:10, fontWeight:700, cursor:'pointer' }}>
                        <Edit2 size={12}/> 修正
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>)}
    </div>
  )
}
