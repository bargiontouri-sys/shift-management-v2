import { useState } from 'react'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/store'
import { api } from '../lib/api'

export default function MyPage() {
  const { staff } = useAuth()
  const [cur,setCur]=useState('')
  const [nxt,setNxt]=useState('')
  const [saving,setSaving]=useState(false)
  if(!staff) return null

  const changePin=async()=>{
    if(nxt.length!==4||!/^\d+$/.test(nxt)){toast.error('4桁の数字を入力してください');return}
    setSaving(true)
    try{ await api.patch('/api/auth/pin',{currentPin:cur,newPin:nxt}); toast.success('PINを変更しました'); setCur(''); setNxt('') }
    catch(e:any){ toast.error(e.response?.data?.error||'変更に失敗しました') }
    finally{ setSaving(false) }
  }

  return(
    <div className="fu" style={{display:'flex',flexDirection:'column',gap:20}}>
      <h2 style={{fontSize:14,fontWeight:900}}>マイページ</h2>
      <div className="card">
        <p className="lbl" style={{marginBottom:14}}>プロフィール</p>
        {[['名前',staff.name,'var(--tx)'],['雇用形態',staff.type==='full-time'?'正社員':'アルバイト','var(--tx)'],['役割',staff.role,'var(--tx)'],[staff.type==='full-time'?'月給':'時給',`¥${staff.wage.toLocaleString()}${staff.type==='full-time'?'':'/h'}`,'var(--ac)'],['権限',staff.isAdmin?'管理者':'スタッフ',staff.isAdmin?'var(--ac)':'var(--tx)']].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--bd)'}}>
            <span style={{fontSize:11,color:'var(--tx3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</span>
            <span style={{fontWeight:900,color:c as string,fontSize:13,fontFamily:'var(--mono)'}}>{v}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Lock size={13} color="var(--ac)"/><p className="lbl" style={{margin:0}}>PINコード変更</p></div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div><label className="lbl">現在のPIN</label><input type="password" maxLength={4} value={cur} onChange={e=>setCur(e.target.value)} placeholder="••••" className="inp" style={{fontFamily:'var(--mono)',letterSpacing:'0.3em'}}/></div>
          <div><label className="lbl">新しいPIN</label><input type="password" maxLength={4} value={nxt} onChange={e=>setNxt(e.target.value)} placeholder="••••" className="inp" style={{fontFamily:'var(--mono)',letterSpacing:'0.3em'}}/></div>
          <button className="btn btn-p" onClick={changePin} disabled={saving||cur.length!==4||nxt.length!==4} style={{width:'100%',marginTop:4}}>{saving?'変更中...':'PINを変更する'}</button>
        </div>
      </div>
    </div>
  )
}
