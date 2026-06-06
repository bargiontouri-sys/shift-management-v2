import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Send, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { WEEKDAYS, HOLIDAYS, TIME_OPTS, dk } from '../lib/utils'
import { api } from '../lib/api'

const CLOSED_DAYS = [1]

export default function Wish() {
  const n = new Date()
  const [y, setY] = useState(n.getFullYear())
  const [m, setM] = useState(n.getMonth())
  const [wishes, setWishes] = useState<Record<string,any>>({})
  const [deadline, setDeadline] = useState<string|null>(null)
  const [periodStart, setPeriodStart] = useState<string|null>(null)
  const [periodEnd, setPeriodEnd] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  // 一括時間設定
  const [bulkStart, setBulkStart] = useState('18:00')
  const [bulkEnd, setBulkEnd] = useState('24:00')
  const [bulkMode, setBulkMode] = useState(false)
  const ym = `${y}-${String(m+1).padStart(2,'0')}`

  useEffect(() => {
    api.get(`/api/wishes?month=${ym}&staffId=${staff?.id}`).then(r => {
      const map: any = {}
      r.data.forEach((w: any) => map[w.date] = w)
      setWishes(map)
    }).catch(() => {})
    api.get('/api/wishes/deadline').then(r => {
      setDeadline(r.data?.deadline || null)
      setPeriodStart(r.data?.periodStart || null)
      setPeriodEnd(r.data?.periodEnd || null)
    }).catch(() => {})
  }, [y, m])

  const key = (d: number) => dk(y, m, d)

  const isInPeriod = (k: string) => {
    if (!periodStart && !periodEnd) return true
    if (periodStart && k < periodStart) return false
    if (periodEnd && k > periodEnd) return false
    return true
  }

  const toggle = (k: string) => {
    const dw = new Date(k).getDay()
    if (CLOSED_DAYS.includes(dw)) { toast.error('月曜日は定休日です'); return }
    if (!isInPeriod(k)) { toast.error('提出期間外の日付です'); return }
    const cur = wishes[k]?.status || 'none'
    const next = cur === 'none' ? 'ok' : cur === 'ok' ? 'ng' : 'none'
    const start = bulkMode ? bulkStart : (wishes[k]?.start || '18:00')
    const end = bulkMode ? bulkEnd : (wishes[k]?.end || '24:00')
    setWishes(p => ({ ...p, [k]: { ...p[k], date:k, status:next, start, end } }))
  }

  // 一括時間変更をOK済みの日付に適用
  const applyBulkTime = () => {
    setWishes(p => {
      const updated = { ...p }
      Object.keys(updated).forEach(k => {
        if (updated[k]?.status === 'ok') {
          updated[k] = { ...updated[k], start: bulkStart, end: bulkEnd }
        }
      })
      return updated
    })
    toast.success('出勤希望日に時間を一括適用しました')
  }

  const updT = (k: string, f: 'start'|'end', v: string) =>
    setWishes(p => ({ ...p, [k]: { ...p[k], [f]: v } }))

  const submit = async () => {
    setSaving(true)
    try {
      await api.post('/api/wishes/bulk', {
        wishes: Object.values(wishes)
      })
      toast.success('希望を提出しました！')
    } catch { toast.error('提出に失敗しました') }
    finally { setSaving(false) }
  }

  const fd = new Date(y, m, 1).getDay(), ld = new Date(y, m+1, 0).getDate()
  const cells = [...Array(fd).fill(null), ...Array.from({ length:ld }, (_, i) => i+1)]
  const okDays = Object.values(wishes).filter((w: any) => w.status === 'ok')
  const ngDays = Object.values(wishes).filter((w: any) => w.status === 'ng')

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* 定休日バナー */}
      <div style={{ background:'rgba(77,159,255,0.08)', border:'1px solid rgba(77,159,255,0.2)', borderRadius:'var(--r)', padding:'8px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:9, fontWeight:900, color:'var(--blue)', textTransform:'uppercase', letterSpacing:'0.1em' }}>定休日</span>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>毎週月曜日</span>
      </div>

      {/* 提出期限・期間 */}
      {(deadline || periodStart || periodEnd) && (
        <div style={{ background:'rgba(255,61,90,0.08)', border:'1px solid rgba(255,61,90,0.25)', borderRadius:'var(--r)', padding:'10px 14px', display:'flex', flexDirection:'column', gap:6 }}>
          {deadline && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <AlertCircle size={12} color="var(--red)"/>
                <span style={{ fontSize:9, fontWeight:900, color:'var(--red)', textTransform:'uppercase', letterSpacing:'0.15em' }}>提出期限</span>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'var(--red)' }}>{deadline}</span>
            </div>
          )}
          {(periodStart || periodEnd) && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Clock size={12} color="var(--red)"/>
                <span style={{ fontSize:9, fontWeight:900, color:'var(--red)', textTransform:'uppercase', letterSpacing:'0.15em' }}>提出期間</span>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'var(--red)' }}>
                {periodStart || '—'} 〜 {periodEnd || '—'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 月ナビ */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ fontSize:14, fontWeight:900 }}>{y}年{m+1}月 希望提出</h2>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => { if(m===0){setY(y-1);setM(11)}else setM(m-1) }} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)' }}><ChevronLeft size={14}/></button>
          <button onClick={() => { if(m===11){setY(y+1);setM(0)}else setM(m+1) }} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', padding:6, borderRadius:'var(--r)' }}><ChevronRight size={14}/></button>
        </div>
      </div>

      {/* 一括時間設定 */}
      <div className="card" style={{ padding:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:bulkMode?10:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={13} color="var(--ac)"/>
            <span style={{ fontSize:10, fontWeight:900, color:'var(--ac)', textTransform:'uppercase', letterSpacing:'0.1em' }}>一括時間設定</span>
          </div>
          <button onClick={() => setBulkMode(v => !v)}
            style={{ fontSize:10, fontWeight:700, padding:'4px 10px', background:bulkMode?'var(--tx)':'var(--bg3)', color:bulkMode?'var(--bg)':'var(--tx3)', border:'1px solid var(--bd)', borderRadius:'var(--r)', cursor:'pointer' }}>
            {bulkMode ? 'ON' : 'OFF'}
          </button>
        </div>
        {bulkMode && (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <select value={bulkStart} onChange={e => setBulkStart(e.target.value)}
              style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'6px 8px', fontSize:11, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}>
              {TIME_OPTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <span style={{ color:'var(--tx3)' }}>〜</span>
            <select value={bulkEnd} onChange={e => setBulkEnd(e.target.value)}
              style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'6px 8px', fontSize:11, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}>
              {TIME_OPTS.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={applyBulkTime}
              style={{ padding:'6px 12px', background:'rgba(240,192,64,0.1)', border:'1px solid rgba(240,192,64,0.3)', color:'var(--ac)', borderRadius:'var(--r)', fontSize:10, fontWeight:700, cursor:'pointer' }}>
              既存の希望日に適用
            </button>
            <span style={{ fontSize:9, color:'var(--tx3)' }}>OFFにすると日別設定に戻ります</span>
          </div>
        )}
      </div>

      {/* カレンダー */}
      <div className="card" style={{ padding:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:8 }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:900, color:i===0?'var(--red)':i===1?'var(--blue)':i===6?'var(--blue)':'var(--tx3)' }}>
              {d}{i===1 ? <span style={{ fontSize:8 }}> 休</span> : ''}
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`}/>
            const k = key(d as number)
            const st = wishes[k]?.status || 'none'
            const hw = HOLIDAYS[k]
            const dw = new Date(y, m, d as number).getDay()
            const isClosed = CLOSED_DAYS.includes(dw)
            const inPeriod = isInPeriod(k)
            const disabled = isClosed || !inPeriod
            const bg = isClosed ? 'var(--bg)' : !inPeriod ? 'var(--bg)' : st==='ok' ? 'rgba(0,232,122,0.12)' : st==='ng' ? 'rgba(255,61,90,0.12)' : 'var(--bg3)'
            const bc = disabled ? 'var(--bd)' : st==='ok' ? 'rgba(0,232,122,0.4)' : st==='ng' ? 'rgba(255,61,90,0.4)' : 'var(--bd)'
            const tc = disabled ? 'var(--tx3)' : st!=='none' ? (st==='ok'?'var(--green)':'var(--red)') : dw===0||hw ? 'var(--red)' : dw===6 ? 'var(--blue)' : 'var(--tx3)'
            return (
              <button key={k} onClick={() => toggle(k)}
                style={{ aspectRatio:'1', background:bg, border:`1.5px solid ${bc}`, borderRadius:'var(--r)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:disabled?'not-allowed':'pointer', transition:'all 0.12s', gap:1, opacity:disabled?0.35:1 }}>
                <span style={{ fontSize:10, fontWeight:900, color:tc, fontFamily:'var(--mono)' }}>{d}</span>
                {isClosed ? <span style={{ fontSize:7, color:'var(--tx3)' }}>休</span>
                  : !inPeriod ? <span style={{ fontSize:7, color:'var(--tx3)' }}>—</span>
                  : st==='ok' ? <CheckCircle2 size={10} color="var(--green)"/>
                  : st==='ng' ? <XCircle size={10} color="var(--red)"/>
                  : <div style={{ height:10 }}/>}
              </button>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:10, justifyContent:'center' }}>
          {[['○ 出勤OK', 'var(--green)'], ['× 出勤NG', 'var(--red)']].map(([l, c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:c as string, fontWeight:700 }}>{l}</div>
          ))}
          <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700 }}>タップで切替</div>
        </div>
      </div>

      {/* 個別時間設定（一括モードOFF時） */}
      {!bulkMode && okDays.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <p style={{ fontSize:9, color:'var(--tx3)', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em' }}>出勤希望時間（個別設定）</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:220, overflowY:'auto' }}>
            {(okDays as any[]).sort((a, b) => a.date.localeCompare(b.date)).map((w: any) => (
              <div key={w.date} style={{ background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700 }}>{m+1}/{parseInt(w.date.split('-')[2])}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <select value={w.start} onChange={e => updT(w.date,'start',e.target.value)} style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'4px 6px', fontSize:10, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}>
                    {TIME_OPTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span style={{ color:'var(--tx3)', fontSize:12 }}>〜</span>
                  <select value={w.end} onChange={e => updT(w.date,'end',e.target.value)} style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', padding:'4px 6px', fontSize:10, color:'var(--tx)', fontFamily:'var(--mono)', outline:'none', borderRadius:'var(--r)' }}>
                    {TIME_OPTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 集計 */}
      {(okDays.length > 0 || ngDays.length > 0) && (
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, background:'rgba(0,232,122,0.06)', border:'1px solid rgba(0,232,122,0.2)', borderRadius:'var(--r)', padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:8, color:'rgba(0,232,122,0.6)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>出勤OK</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, color:'var(--green)' }}>{okDays.length}日</div>
          </div>
          <div style={{ flex:1, background:'rgba(255,61,90,0.06)', border:'1px solid rgba(255,61,90,0.2)', borderRadius:'var(--r)', padding:'8px 12px', textAlign:'center' }}>
            <div style={{ fontSize:8, color:'rgba(255,61,90,0.6)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>出勤NG</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, color:'var(--red)' }}>{ngDays.length}日</div>
          </div>
        </div>
      )}

      <button className="btn btn-p" onClick={submit} disabled={saving || (okDays.length===0 && ngDays.length===0)} style={{ width:'100%' }}>
        <Send size={12}/>{saving ? '送信中...' : `希望を提出する（OK:${okDays.length}日 / NG:${ngDays.length}日）`}
      </button>
    </div>
  )
}
