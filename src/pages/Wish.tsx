import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { WEEKDAYS, HOLIDAYS, TIME_OPTS, dk } from '../lib/utils'
import { api } from '../lib/api'

export default function Wish() {
  const n=new Date()
  const [y,setY]=useState(n.getFullYear())
  const [m,setM]=useState(n.getMonth())
  const [wishes,setWishes]=useState<Record<string,any>>({})
  const [deadline,setDeadline]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  const ym=`${y}-${String(m+1).padStart(2,'0')}`

  useEffect(()=>{
    api.get(`/api/wishes?month=${ym}`).then(r=>{const map:any={};r.data.forEach((w:any)=>map[w.date]=w);setWishes(map)}).catch(()=>{})
    api.get('/api/wishes/deadline').then(r=>setDeadline(r.data?.deadline||null)).catch(()=>{})
  },[y,m])

  const key=(d:number)=>dk(y,m,d)
  const toggle=(k:string)=>{
    const cur=wishes[k]?.status||'none',next=cur==='none'?'ok':cur==='ok'?'ng':'none'
    setWishes(p=>({...p,[k]:{...p[k],date:k,status:next,start:p[k]?.start||'18:00',end:p[k]?.end||'24:00'}}))
  }
  const updT=(k:string,f:'start'|'end',v:string)=>setWishes(p=>({...p,[k]:{...p[k],[f]:v}}))
  const submit=async()=>{
    setSaving(true)
    try{ await api.post('/api/wishes/bulk',{wishes:Object.values(wishes).filter((w:any)=>w.status!=='none')}); toast.success('希望を提出しました！') }
    catch{ toast.error('提出に失敗しました') }
    finally{ setSaving(false) }
  }

  const fd=new Date(y,m,1).getDay(),ld=new Date(y,m+1,0).getDate()
  const cells:[number|null][]=[...Array(fd).fill(null),...Array.from({length:ld},(_,i)=>[i+1])]
  const okDays=Object.values(wishes).filter((w:any)=>w.status==='ok')

  return(
    <div className="fu" style={{display:'flex',flexDirection:'column',gap:16}}>
      {deadline&&<div style={{background:'rgba(255,61,90,0.08)',border:'1px solid rgba(255,61,90,0.25)',borderRadius:'var(--r)',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}><AlertCircle size={12} color="var(--red)"/><span style={{fontSize:9,fontWeight:900,color:'var(--red)',textTransform:'uppercase',letterSpacing:'0.15em'}}>提出期限</span></div>
        <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,color:'var(--red)'}}>{deadline}</span>
      </div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontSize:14,fontWeight:900}}>{y}年{m+1}月 希望提出</h2>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>{if(m===0){setY(y-1);setM(11)}else setM(m-1)}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronLeft size={14}/></button>
          <button onClick={()=>{if(m===11){setY(y+1);setM(0)}else setM(m+1)}} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronRight size={14}/></button>
        </div>
      </div>
      <div className="card" style={{padding:14}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:6}}>
          {WEEKDAYS.map((d,i)=><div key={d} style={{textAlign:'center',fontSize:9,fontWeight:900,color:i===0?'var(--red)':i===6?'var(--blue)':'var(--tx3)'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
          {cells.map((cell,i)=>{
            const d=cell?cell[0]:null
            if(!d) return <div key={`e${i}`}/>
            const k=key(d),st=wishes[k]?.status||'none',hw=HOLIDAYS[k],dw=new Date(y,m,d).getDay()
            const bg=st==='ok'?'rgba(0,232,122,0.12)':st==='ng'?'rgba(255,61,90,0.12)':'var(--bg3)'
            const bc=st==='ok'?'rgba(0,232,122,0.4)':st==='ng'?'rgba(255,61,90,0.4)':'var(--bd)'
            const tc=st!=='none'?(st==='ok'?'var(--green)':'var(--red)'):dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)'
            return(
              <button key={k} onClick={()=>toggle(k)} style={{aspectRatio:'1',background:bg,border:`1.5px solid ${bc}`,borderRadius:'var(--r)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.12s',gap:1}}>
                <span style={{fontSize:9,fontWeight:900,color:tc,fontFamily:'var(--mono)'}}>{d}</span>
                {st==='ok'?<CheckCircle2 size={10} color="var(--green)"/>:st==='ng'?<XCircle size={10} color="var(--red)"/>:<div style={{height:10}}/>}
              </button>
            )
          })}
        </div>
      </div>
      {okDays.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <p style={{fontSize:9,color:'var(--tx3)',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em'}}>出勤希望時間</p>
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:220,overflowY:'auto'}}>
            {(okDays as any[]).sort((a,b)=>a.date.localeCompare(b.date)).map((w:any)=>(
              <div key={w.date} style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700}}>{m+1}/{parseInt(w.date.split('-')[2])}</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <select value={w.start} onChange={e=>updT(w.date,'start',e.target.value)} style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'4px 6px',fontSize:10,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none',borderRadius:'var(--r)'}}>
                    {TIME_OPTS.map(t=><option key={t}>{t}</option>)}
                  </select>
                  <span style={{color:'var(--tx3)',fontSize:12}}>〜</span>
                  <select value={w.end} onChange={e=>updT(w.date,'end',e.target.value)} style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'4px 6px',fontSize:10,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none',borderRadius:'var(--r)'}}>
                    {TIME_OPTS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button className="btn btn-p" onClick={submit} disabled={saving||okDays.length===0} style={{width:'100%'}}>
        <Send size={12}/>{saving?'送信中...':`希望を提出する（${okDays.length}日）`}
      </button>
    </div>
  )
}
