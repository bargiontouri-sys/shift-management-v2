import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { WEEKDAYS, HOLIDAYS, TIME_OPTS, nameColor, dateDk, todayDk, yen } from '../lib/utils'
import { api } from '../lib/api'

export default function AdminShift() {
  const [vd, setVd] = useState(new Date())
  const [staff, setStaff] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [wishes, setWishes] = useState<any[]>([])
  const [selDay, setSelDay] = useState<string|null>(null)
  const [dragIdx, setDragIdx] = useState<number|null>(null)
  const [dragOver, setDragOver] = useState<number|null>(null)
  const [deadline, setDeadline] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const y=vd.getFullYear(), m=vd.getMonth()
  const last=new Date(y,m+1,0).getDate()
  const days=Array.from({length:last},(_,i)=>new Date(y,m,i+1))
  const today=todayDk()
  const ym=`${y}-${String(m+1).padStart(2,'0')}`

  useEffect(()=>{load()},[y,m])

  const load=async()=>{
    const from=`${ym}-01`,to=`${ym}-${String(last).padStart(2,'0')}`
    const [s,sh,w,dl]=await Promise.all([
      api.get('/api/staff').catch(()=>({data:[]})),
      api.get(`/api/shifts?from=${from}&to=${to}`).catch(()=>({data:[]})),
      api.get(`/api/wishes?month=${ym}`).catch(()=>({data:[]})),
      api.get('/api/wishes/deadline').catch(()=>({data:null})),
    ])
    setStaff(s.data); setShifts(sh.data); setWishes(w.data)
    if (dl.data) {
      setDeadline(dl.data.deadline || '')
      setPeriodStart(dl.data.periodStart || '')
      setPeriodEnd(dl.data.periodEnd || '')
    }
  }

  const gs=(sid:string,d:string)=>shifts.find(s=>s.staffId===sid&&s.date===d)
  const gw=(sid:string,d:string)=>wishes.find(w=>w.staffId===sid&&w.date===d)

  const toMin=(t:string)=>{const[h,mm]=t.split(':').map(Number);return h*60+mm}
  const shHours=(sh:any)=>sh&&sh.type!=='off'?Math.max(0,(toMin(sh.end)-toMin(sh.start))/60):0
  const dailyCost=(d:string)=>staff.reduce((sum,s)=>s.type==='full-time'?sum:sum+shHours(gs(s.id,d))*s.wage,0)
  const monthlyCost=(sid:string)=>{
    const st=staff.find(s=>s.id===sid)
    if(!st) return 0
    if(st.type==='full-time') return st.wage
    return shifts.filter(sh=>sh.staffId===sid).reduce((sum,sh)=>sum+shHours(sh)*st.wage,0)
  }

  const handleDragStart=(idx:number)=>setDragIdx(idx)
  const handleDragOver=(e:React.DragEvent,idx:number)=>{e.preventDefault();setDragOver(idx)}
  const handleDrop=async(idx:number)=>{
    if(dragIdx===null||dragIdx===idx){setDragIdx(null);setDragOver(null);return}
    const newStaff=[...staff]
    const[moved]=newStaff.splice(dragIdx,1)
    newStaff.splice(idx,0,moved)
    setStaff(newStaff)
    setDragIdx(null);setDragOver(null)
    try{await api.patch('/api/staff/sort',{order:newStaff.map(s=>s.id)})}
    catch{toast.error('並び替えの保存に失敗しました')}
  }

  const upd=async(staffId:string,date:string,type:string,start='',end='')=>{
    try{
      const{data}=await api.put('/api/shifts',{staffId,date,type,start,end})
      setShifts(p=>{const i=p.findIndex(s=>s.staffId===staffId&&s.date===date);if(i>=0){const n=[...p];n[i]=data;return n}return[...p,data]})
    }catch{toast.error('更新に失敗しました')}
  }

  const reflect=async(date:string)=>{
    try{await api.post('/api/shifts/reflect-wishes',{date});await load();toast.success('希望を反映しました')}
    catch{toast.error('反映に失敗しました')}
  }

  const setDl=async()=>{
    try{
      await api.put('/api/wishes/deadline',{deadline,targetMonth:ym,periodStart,periodEnd})
      toast.success('期限・期間を設定しました')
    }catch{toast.error('設定に失敗しました')}
  }

  return(
    <div className="fu" style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontSize:14,fontWeight:900}}>シフト管理</h2>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={()=>setVd(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronLeft size={14}/></button>
          <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:700,minWidth:52,textAlign:'center'}}>{y}.{m+1}</span>
          <button onClick={()=>setVd(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{background:'var(--bg3)',border:'1px solid var(--bd)',color:'var(--tx2)',padding:6,borderRadius:'var(--r)'}}><ChevronRight size={14}/></button>
        </div>
      </div>

      {/* 期限・期間設定 */}
      <div className="card" style={{padding:'14px'}}>
        <p className="lbl" style={{color:'var(--ac)',marginBottom:12}}>希望提出 期限・期間設定</p>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <label className="lbl">提出期限</label>
            <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="inp"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label className="lbl">提出期間（開始）</label>
              <input type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)} className="inp"/>
            </div>
            <div>
              <label className="lbl">提出期間（終了）</label>
              <input type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)} className="inp"/>
            </div>
          </div>
          {periodStart && periodEnd && (
            <div style={{background:'rgba(77,159,255,0.08)',border:'1px solid rgba(77,159,255,0.2)',borderRadius:'var(--r)',padding:'8px 12px',fontSize:11,color:'var(--blue)',fontWeight:700}}>
              {periodStart} 〜 {periodEnd} の日付のみ選択可能になります
            </div>
          )}
          <button className="btn btn-p" onClick={setDl} style={{width:'100%'}}>設定を保存する</button>
        </div>
      </div>

      {/* シフト表 */}
      <div style={{overflowX:'auto',border:'1px solid var(--bd)',borderRadius:'var(--r2)',background:'var(--bg2)',maxHeight:430}}>
        <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,minWidth:600}}>
          <thead>
            <tr style={{background:'var(--bg)',position:'sticky',top:0,zIndex:10}}>
              <th style={{position:'sticky',left:0,zIndex:20,background:'var(--bg)',padding:'8px 10px',textAlign:'left',fontSize:8,fontWeight:900,color:'var(--tx3)',textTransform:'uppercase',borderBottom:'1px solid var(--bd)',borderRight:'1px solid var(--bd)',width:86}}>スタッフ</th>
              {days.map(d=>{const k=dateDk(d),hw=HOLIDAYS[k],dw=d.getDay(),it=k===today,sel=k===selDay;return(
                <th key={k} onClick={()=>setSelDay(sel?null:k)} style={{padding:'5px 2px',textAlign:'center',borderBottom:'1px solid var(--bd)',borderRight:'1px solid var(--bd)',minWidth:44,background:sel?'rgba(240,192,64,0.08)':it?'rgba(255,255,255,0.03)':'transparent',cursor:'pointer'}}>
                  <div style={{fontSize:9,fontFamily:'var(--mono)',fontWeight:900,color:sel?'var(--ac)':dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)'}}>{d.getDate()}</div>
                  <div style={{fontSize:7,fontWeight:900,color:sel?'var(--ac)':dw===0||hw?'var(--red)':dw===6?'var(--blue)':'var(--tx3)',opacity:.7}}>{WEEKDAYS[dw]}</div>
                </th>
              )})}
            </tr>
          </thead>
          <tbody>
            {staff.map((s,idx)=>(
              <tr key={s.id}
                draggable
                onDragStart={()=>handleDragStart(idx)}
                onDragOver={e=>handleDragOver(e,idx)}
                onDrop={()=>handleDrop(idx)}
                onDragEnd={()=>{setDragIdx(null);setDragOver(null)}}
                style={{opacity:dragIdx===idx?0.5:1}}>
                <td style={{position:'sticky',left:0,zIndex:5,background:dragOver===idx?'rgba(240,192,64,0.08)':'var(--bg)',padding:'6px 10px',borderBottom:'1px solid var(--bd)',borderRight:'1px solid var(--bd)',cursor:'grab'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <GripVertical size={10} color="var(--tx3)" style={{flexShrink:0}}/>
                    <div style={{width:18,height:18,background:nameColor(s.name),borderRadius:'2px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',fontWeight:900,flexShrink:0}}>{s.name[0]}</div>
                    <span style={{fontSize:9,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:54}}>{s.name}</span>
                  </div>
                </td>
                {days.map(d=>{const k=dateDk(d),sh=gs(s.id,k),w=gw(s.id,k),it=k===today,sel=k===selDay;return(
                  <td key={k} style={{padding:3,borderBottom:'1px solid var(--bd)',borderRight:'1px solid var(--bd)',textAlign:'center',background:sel?'rgba(240,192,64,0.04)':it?'rgba(255,255,255,0.02)':'transparent',position:'relative'}}>
                    {sh&&sh.type!=='off'?<div style={{fontSize:7,fontFamily:'var(--mono)',fontWeight:700,padding:'2px',background:sh.type==='eve'?'rgba(176,140,255,0.15)':'rgba(0,232,122,0.12)',color:sh.type==='eve'?'var(--purple)':'var(--green)',borderRadius:'2px',lineHeight:1.4}}>{sh.start}<br/>{sh.end}</div>:<span style={{fontSize:7,color:'var(--tx3)',fontWeight:700}}>—</span>}
                    {w?.status==='ok'&&(!sh||sh.type==='off')&&<div style={{position:'absolute',top:2,right:2,width:4,height:4,background:'var(--ac)',borderRadius:'50%'}}/>}
                  </td>
                )})}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 選択日編集 */}
      {selDay&&(
        <div className="card fu">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'baseline',gap:10}}>
              <h3 style={{fontSize:11,fontWeight:900,textTransform:'uppercase',fontFamily:'var(--mono)'}}>{selDay.split('-').slice(1).join('/')}</h3>
              <span style={{fontSize:10,fontWeight:700,color:'var(--tx3)'}}>概算人件費 <span style={{color:'var(--ac)',fontFamily:'var(--mono)'}}>{yen(dailyCost(selDay))}</span></span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>reflect(selDay)} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',background:'rgba(240,192,64,0.1)',border:'1px solid rgba(240,192,64,0.3)',color:'var(--ac)',borderRadius:'var(--r)',fontSize:9,fontWeight:900,textTransform:'uppercase'}}><CheckCircle2 size={11}/>希望を反映</button>
              <button onClick={()=>setSelDay(null)} style={{color:'var(--tx3)',fontSize:9,fontWeight:700,background:'none',border:'none'}}>閉じる</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {staff.map(s=>{const sh=gs(s.id,selDay)||{type:'off',start:'18:00',end:'24:00'},w=gw(s.id,selDay);return(
              <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:'var(--r)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:26,height:26,background:nameColor(s.name),borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:900}}>{s.name[0]}</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700}}>{s.name}</div>
                    {w&&<div style={{fontSize:8,fontWeight:700,color:w.status==='ok'?'var(--green)':'var(--red)'}}>希望: {w.status==='ok'?`${w.start}—${w.end}`:'NG'}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <select value={sh.type} onChange={e=>{const t=e.target.value;upd(s.id,selDay,t,t==='off'?'':'18:00',t==='off'?'':'24:00')}} style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'4px 6px',fontSize:9,color:'var(--tx)',fontWeight:700,outline:'none',borderRadius:'var(--r)'}}>
                    <option value="off">OFF</option><option value="day">日勤</option><option value="eve">夜勤</option>
                  </select>
                  {sh.type!=='off'&&<>
                    <select value={sh.start} onChange={e=>upd(s.id,selDay,sh.type,e.target.value,sh.end)} style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'3px 5px',fontSize:9,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none',borderRadius:'var(--r)'}}>
                      {TIME_OPTS.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <span style={{color:'var(--tx3)',fontSize:10}}>—</span>
                    <select value={sh.end} onChange={e=>upd(s.id,selDay,sh.type,sh.start,e.target.value)} style={{background:'var(--bg2)',border:'1px solid var(--bd2)',padding:'3px 5px',fontSize:9,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none',borderRadius:'var(--r)'}}>
                      {TIME_OPTS.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </>}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* 月次人件費サマリー */}
      <div className="card" style={{padding:'14px'}}>
        <p className="lbl" style={{color:'var(--ac)',marginBottom:12}}>{y}年{m+1}月 個人別概算人件費</p>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {staff.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:'var(--r)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:16,height:16,background:nameColor(s.name),borderRadius:'2px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#fff',fontWeight:900,flexShrink:0}}>{s.name[0]}</div>
                <span style={{fontSize:10,fontWeight:700}}>{s.name}</span>
              </div>
              <span style={{fontSize:11,fontWeight:900,fontFamily:'var(--mono)',color:'var(--tx)'}}>{yen(monthlyCost(s.id))}</span>
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',marginTop:4,borderTop:'1px solid var(--bd)'}}>
            <span style={{fontSize:10,fontWeight:900,color:'var(--tx3)',textTransform:'uppercase'}}>合計</span>
            <span style={{fontSize:12,fontWeight:900,fontFamily:'var(--mono)',color:'var(--ac)'}}>{yen(staff.reduce((sum,s)=>sum+monthlyCost(s.id),0))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
