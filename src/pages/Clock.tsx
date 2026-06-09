import { useState, useEffect } from 'react'
import { Clock as ClockIcon, LogOut, CalendarDays, MapPin, AlertCircle, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/store'
import { todayDk } from '../lib/utils'
import { api } from '../lib/api'

// 職場の位置情報（ここを実際の職場の緯度経度に変更してください）
const WORKPLACE_LAT = 35.0037  // 例: 東京（実際の店舗に変更）
const WORKPLACE_LNG = 135.7789
const ALLOWED_RADIUS_M = 500

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function Clock() {
  const { staff } = useAuth()
  const [now, setNow] = useState(new Date())
  const [punches, setPunches] = useState<any[]>([])
  const [todayShift, setTodayShift] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [allPunches, setAllPunches] = useState<any[]>([])
  const [allStaff, setAllStaff] = useState<any[]>([])
  const [editPunch, setEditPunch] = useState<any>(null)
  const [editTime, setEditTime] = useState('')
  const [locStatus, setLocStatus] = useState<'checking'|'ok'|'far'|'denied'|'idle'>('idle')
  const [distance, setDistance] = useState<number|null>(null)
  const today = todayDk()

  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t) }, [])
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get(`/api/punches?from=${today}&to=${today}`),
        api.get(`/api/shifts?from=${today}&to=${today}`),
      ])
      setPunches(p.data.filter((x:any) => x.staffId===staff?.id && x.date===today))
      setTodayShift(s.data.find((x:any) => x.staffId===staff?.id && x.date===today) || null)
      if (staff?.isAdmin) {
        setAllPunches(p.data.filter((x:any) => x.date===today))
        const sr = await api.get('/api/staff')
        setAllStaff(sr.data)
      }
    } catch {}
  }

  const checkLocation = (): Promise<{lat:number; lng:number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('geolocation_unsupported')); return }
      setLocStatus('checking')
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords
          const dist = getDistance(latitude, longitude, WORKPLACE_LAT, WORKPLACE_LNG)
          setDistance(Math.round(dist))
          if (dist <= ALLOWED_RADIUS_M) {
            setLocStatus('ok')
            resolve({ lat: latitude, lng: longitude })
          } else {
            setLocStatus('far')
            reject(new Error('too_far'))
          }
        },
        err => {
          setLocStatus('denied')
          reject(new Error('denied'))
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const punch = async (type:'in'|'out') => {
    setLoading(true)
    try {
      const { lat, lng } = await checkLocation()
      const { data } = await api.post('/api/punches', { type, lat, lng })
      setPunches(p => [...p, data])
      setAllPunches(p => [...p, data])
      toast.success(type==='in' ? `出勤しました！ ${data.time}` : `退勤しました！ ${data.time}`)
    } catch(e:any) {
      if (e.message === 'too_far') {
        toast.error(`職場から${distance}m離れています（500m以内が必要）`)
      } else if (e.message === 'denied') {
        toast.error('位置情報の許可が必要です。ブラウザの設定を確認してください')
      } else if (e.message === 'geolocation_unsupported') {
        toast.error('このブラウザは位置情報に対応していません')
      } else {
        toast.error(e.response?.data?.error || 'エラーが発生しました')
      }
    }
    finally { setLoading(false) }
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

  const deletePunch = async (id:string) => {
    if (!confirm('この打刻を削除しますか？')) return
    try { await api.delete(`/api/punches/${id}`); toast.success('削除しました'); fetchData() }
    catch { toast.error('削除に失敗しました') }
  }

  const last = punches[punches.length-1]
  const isClockedIn = last?.type==='in'
  const timeStr = now.toLocaleTimeString('ja-JP',{ hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = now.toLocaleDateString('ja-JP',{ year:'numeric', month:'long', day:'numeric', weekday:'short' })
  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']
  const nc = (n:string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ textAlign:'center', padding:'20px 0 8px' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:48, fontWeight:700, color:'var(--tx)', letterSpacing:'-2px', lineHeight:1 }}>{timeStr}</div>
        <div style={{ color:'var(--ac)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3em', marginTop:10 }}>{dateStr}</div>
      </div>

      {todayShift?.type!=='off'&&todayShift&&(
        <div style={{ background:'rgba(0,232,122,0.06)', border:'1px solid rgba(0,232,122,0.2)', borderRadius:'var(--r2)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <CalendarDays size={15} color="var(--green)"/>
            <div>
              <div style={{ fontSize:9, color:'rgba(0,232,122,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>本日の予定</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:700, marginTop:1 }}>{todayShift.start} — {todayShift.end}</div>
            </div>
          </div>
          <span style={{ fontSize:9, fontWeight:900, color:'var(--green)', background:'rgba(0,232,122,0.1)', padding:'3px 8px', borderRadius:'3px', border:'1px solid rgba(0,232,122,0.2)' }}>{todayShift.type==='eve'?'夜勤':'日勤'}</span>
        </div>
      )}

      {/* 位置情報ステータス */}
      {locStatus !== 'idle' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:'var(--r)', border:`1px solid ${locStatus==='ok'?'rgba(0,232,122,0.3)':locStatus==='checking'?'var(--bd)':'rgba(255,61,90,0.3)'}`, background:locStatus==='ok'?'rgba(0,232,122,0.06)':locStatus==='checking'?'var(--bg3)':'rgba(255,61,90,0.06)' }}>
          <MapPin size={14} color={locStatus==='ok'?'var(--green)':locStatus==='checking'?'var(--tx3)':'var(--red)'}/>
          <span style={{ fontSize:11, fontWeight:700, color:locStatus==='ok'?'var(--green)':locStatus==='checking'?'var(--tx3)':'var(--red)' }}>
            {locStatus==='checking' ? '位置情報を取得中...'
              : locStatus==='ok' ? `職場から${distance}m — 打刻可能`
              : locStatus==='far' ? `職場から${distance}m離れています（500m以内が必要）`
              : '位置情報の許可が必要です'}
          </span>
        </div>
      )}

      {last&&(
        <div style={{ textAlign:'center', fontSize:10, fontWeight:700, color:isClockedIn?'var(--green)':'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.2em' }}>
          {isClockedIn?`● 出勤中 — ${last.time}〜`:`○ 退勤済 — ${last.time}`}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['in','出勤',ClockIcon],['out','退勤',LogOut]].map(([type,label,Icon]:any)=>{
          const dis=type==='in'?isClockedIn:!isClockedIn
          return (
            <button key={type} onClick={()=>punch(type)} disabled={dis||loading}
              style={{ padding:'26px 16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:dis?'var(--bg3)':type==='in'?'var(--tx)':'#c0202e', color:dis?'var(--tx3)':type==='in'?'var(--bg)':'#fff', border:`2px solid ${dis?'var(--bd)':type==='in'?'var(--tx)':'#c0202e'}`, borderRadius:'var(--r2)', opacity:dis?0.35:1, cursor:dis?'not-allowed':'pointer', transition:'all 0.15s' }}>
              <Icon size={26}/>
              <span style={{ fontWeight:900, fontSize:15, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
            </button>
          )
        })}
      </div>

      {punches.length>0&&(
        <div className="card">
          <p style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>本日の打刻履歴</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {punches.map((p:any)=>(
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.12em', padding:'3px 8px', background:p.type==='in'?'rgba(0,232,122,0.1)':'rgba(255,61,90,0.1)', color:p.type==='in'?'var(--green)':'var(--red)', border:`1px solid ${p.type==='in'?'rgba(0,232,122,0.25)':'rgba(255,61,90,0.25)'}`, borderRadius:'3px' }}>{p.type==='in'?'出勤':'退勤'}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {p.lat && <span style={{ fontSize:8, color:'var(--green)', display:'flex', alignItems:'center', gap:2 }}><MapPin size={9}/>位置OK</span>}
                  <span style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:14 }}>{p.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {staff?.isAdmin&&allStaff.length>0&&(
        <div className="card">
          <p style={{ fontSize:9, color:'var(--ac)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12 }}>本日の出勤状況（管理者）</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {allStaff.map((s:any)=>{
              const sp=allPunches.filter(p=>p.staffId===s.id)
              const sl=sp[sp.length-1]
              return (
                <div key={s.id} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:sp.length>0?8:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:24, height:24, background:nc(s.name), borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:900 }}>{s.name[0]}</div>
                      <span style={{ fontSize:12, fontWeight:700 }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize:9, fontWeight:900, padding:'2px 8px', borderRadius:'3px', background:sl?.type==='in'?'rgba(0,232,122,0.1)':sp.length>0?'rgba(255,61,90,0.1)':'var(--bg4)', color:sl?.type==='in'?'var(--green)':sp.length>0?'var(--red)':'var(--tx3)', border:`1px solid ${sl?.type==='in'?'rgba(0,232,122,0.25)':sp.length>0?'rgba(255,61,90,0.25)':'var(--bd)'}` }}>
                      {sl?.type==='in'?`出勤中 ${sl.time}〜`:sp.length>0?`退勤済 ${sl.time}`:'未打刻'}
                    </span>
                  </div>
                  {sp.length>0&&(
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {sp.map((p:any)=>(
                        <div key={p.id}>
                          {editPunch?.id===p.id?(
                            <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', border:'1px solid var(--bd2)', borderRadius:'var(--r)', padding:'4px 8px' }}>
                              <span style={{ fontSize:9, color:p.type==='in'?'var(--green)':'var(--red)', fontWeight:700 }}>{p.type==='in'?'IN':'OUT'}</span>
                              <input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)}
                                style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'2px 6px', fontSize:11, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)', width:90 }}/>
                              <button onClick={savePunchEdit} style={{ background:'var(--green)', border:'none', color:'#000', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10, fontWeight:700 }}>保存</button>
                              <button onClick={()=>setEditPunch(null)} style={{ background:'var(--bg4)', border:'1px solid var(--bd)', color:'var(--tx3)', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10 }}>×</button>
                              <button onClick={()=>deletePunch(p.id)} style={{ background:'rgba(255,61,90,0.1)', border:'1px solid rgba(255,61,90,0.25)', color:'var(--red)', borderRadius:'var(--r)', padding:'3px 8px', cursor:'pointer', fontSize:10 }}>削除</button>
                            </div>
                          ):(
                            <button onClick={()=>{ setEditPunch(p); setEditTime(p.time) }}
                              style={{ display:'flex', alignItems:'center', gap:4, background:p.type==='in'?'rgba(0,232,122,0.08)':'rgba(255,61,90,0.08)', border:`1px solid ${p.type==='in'?'rgba(0,232,122,0.2)':'rgba(255,61,90,0.2)'}`, borderRadius:'var(--r)', padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'var(--mono)', color:p.type==='in'?'var(--green)':'var(--red)', fontWeight:700 }}>
                              {p.type==='in'?'IN':'OUT'} {p.time} <Edit2 size={10}/>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
