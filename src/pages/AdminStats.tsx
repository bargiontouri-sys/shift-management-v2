import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { nameColor, yen } from '../lib/utils'
import { api } from '../lib/api'

export default function AdminStats() {
  const [vd,setVd]=useState(new Date())
  const [stats,setStats]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const y=vd.getFullYear(),m=vd.getMonth()
  const ym=`${y}-${String(m+1).padStart(2,'0')}`
  // 11日締め: 当月11日〜翌月10日
  const from=`${ym}-11`
  const nextM = m===11 ? `${y+1}-01` : `${y}-${String(m+2).padStart(2,'0')}`
  const to=`${nextM}-10`

  useEffect(()=>{fetch()},[y,m])
  const fetch=async()=>{
    setLoading(true)
    try{const{data}=await api.get(`/api/stats?from=${from}&to=${to}`);setStats(data)}
    catch(e:any){toast.error(e.response?.data?.error||'集計に失敗しました')}
    finally{setLoading(false)}
  }
  const maxW=stats?.staff?Math.max(...stats.staff.map((s:any)=>s.totalWage),1):1

  return(
    <div className="fu" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><BarChart3 size={15} color="var(--ac)"/><h2 style={{fontSize:14,fontWeight:900}}>実績・人件費集計</h2></div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={()=>setVd(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronLeft size={14}/></button>
          <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,minWidth:80,textAlign:'center'}}>{y}.{m+1}/11〜{m===11?y+1:y}.{m===11?1:m+2}/10</span>
          <button onClick={()=>setVd(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronRight size={14}/></button>
          <button className="btn btn-g" onClick={()=>setVd(new Date())} style={{padding:'5px 10px',fontSize:9}}>今月</button>
        </div>
      </div>
      {loading&&<div style={{textAlign:'center',padding:'40px 0',color:'var(--tx3)',fontSize:11,fontWeight:700}}>集計中...</div>}
      {stats&&!loading&&(<>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[['総労働時間',`${stats.totalHours.toFixed(1)}h`,'var(--tx)'],['人件費合計',yen(stats.totalWage),'var(--ac)']].map(([l,v,c])=>(
            <div key={l} className="card" style={{padding:14}}>
              <div style={{fontSize:8,color:'var(--tx3)',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>{l}</div>
              <div style={{fontFamily:'var(--mono)',fontSize:22,fontWeight:700,color:c as string,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {stats.staff.map((s:any)=>(
            <div key={s.staff.id} className="card" style={{padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,background:nameColor(s.staff.name),borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:13,flexShrink:0}}>{s.staff.name[0]}</div>
                  <div>
                    <div style={{fontWeight:900,fontSize:12}}>{s.staff.name}</div>
                    <div style={{fontSize:9,color:'var(--tx3)',fontWeight:700}}>{s.staff.type==='full-time'?'正社員':'アルバイト'} · ¥{s.staff.wage.toLocaleString()}{s.staff.type==='full-time'?'/月':'/h'}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:15,fontWeight:700,color:'var(--ac)'}}>{yen(s.totalWage)}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--tx3)'}}>{s.totalHours.toFixed(1)}h</div>
                </div>
              </div>
              <div style={{height:3,background:'var(--bg3)',borderRadius:2,marginBottom:10,overflow:'hidden'}}>
                <div style={{height:'100%',background:nameColor(s.staff.name),width:`${Math.round(s.totalWage/maxW*100)}%`,transition:'width 0.6s ease',borderRadius:2}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
                {[['深夜時間',`${s.totalLNHours.toFixed(1)}h`,'var(--purple)'],['残業時間',`${s.totalOTHours.toFixed(1)}h`,'var(--red)'],['休憩時間',`${s.totalBreakHours.toFixed(1)}h`,'var(--tx3)'],['勤務日数',`${s.days.length}日`,'var(--tx2)']].map(([l,v,c])=>(
                  <div key={l} style={{background:'var(--bg3)',padding:'6px 8px',borderRadius:'var(--r)'}}>
                    <div style={{fontSize:7,color:'var(--tx3)',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{l}</div>
                    <div style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,color:c as string}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  )
}
