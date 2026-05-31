import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../lib/store'
import { nameColor, STORE_ID } from '../lib/utils'
import { api } from '../lib/api'

export default function Login() {
  const [selId, setSelId] = useState<string|null>(null)
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth, setStoreStaff, storeStaff } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    api.get(`/api/auth/store-staff/${STORE_ID}`).then(r => setStoreStaff(r.data)).catch(() => {})
  }, [])

  const press = (k: string|number) => {
    if (k === 'C') { setPin(''); setError(''); return }
    if (k === 'OK') { login(); return }
    if (pin.length < 4) setPin(p => p + k)
  }

  const login = async () => {
    if (!selId) { setError('スタッフを選択してください'); return }
    if (pin.length !== 4) { setError('4桁のPINを入力してください'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/api/auth/login', { staffId: selId, pin })
      setAuth(data.token, data.staff)
      toast.success(`おかえりなさい、${data.staff.name}さん`)
      nav('/')
    } catch (e: any) { setError(e.response?.data?.error || 'ログインに失敗しました'); setPin('') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)', backgroundSize:'40px 40px', opacity:0.3, pointerEvents:'none' }}/>
      <div style={{ width:'100%', maxWidth:380, position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:38, fontWeight:700, letterSpacing:'-2px', lineHeight:1 }}>
            <span style={{ color:'var(--ac)' }}>BAR</span><span style={{ color:'var(--tx)' }}>SHIFT</span>
          </div>
          <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4em', marginTop:6 }}>シフト管理システム</div>
        </div>
        <div className="card" style={{ padding:24 }}>
          <p style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', textAlign:'center', marginBottom:14 }}>スタッフ選択</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:22, maxHeight:170, overflowY:'auto' }}>
            {storeStaff.length===0
              ? <div style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--tx3)', fontSize:11, padding:'20px 0' }}>読み込み中...</div>
              : storeStaff.map(s => {
                const sel=selId===s.id
                return (
                  <button key={s.id} onClick={()=>{ setSelId(s.id); setPin(''); setError('') }}
                    style={{ padding:'10px', border:`2px solid ${sel?'var(--tx)':'var(--bd)'}`, background:sel?'var(--tx)':'var(--bg3)', color:sel?'var(--bg)':'var(--tx2)', borderRadius:'var(--r)', display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:700, textAlign:'left', transition:'all 0.12s' }}>
                    <div style={{ width:26, height:26, background:nameColor(s.name), borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:900, flexShrink:0 }}>{s.name[0]}</div>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                  </button>
                )
              })}
          </div>

          {selId && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minHeight:40 }}>
                {showPin
                  ? <div style={{ fontFamily:'var(--mono)', fontSize:32, fontWeight:700, color:'var(--tx)', letterSpacing:'0.5em', textAlign:'center' }}>
                      {pin.padEnd(4, '·')}
                    </div>
                  : <div style={{ display:'flex', gap:14 }}>
                      {[0,1,2,3].map(i=>(
                        <div key={i} style={{ width:12, height:12, background:pin.length>i?'var(--tx)':'transparent', border:`1.5px solid ${pin.length>i?'var(--tx)':'var(--bd2)'}`, borderRadius:'50%', transition:'all 0.1s' }}/>
                      ))}
                    </div>
                }
                <button onClick={()=>setShowPin(v=>!v)}
                  style={{ position:'absolute', right:0, background:'none', border:'none', color:'var(--tx3)', cursor:'pointer', padding:6 }}>
                  {showPin ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, maxWidth:240, margin:'0 auto', width:'100%' }}>
                {[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(k=>(
                  <button key={k} onClick={()=>press(k)} disabled={loading}
                    style={{ aspectRatio:'1', background:k==='OK'?'var(--tx)':k==='C'?'rgba(255,61,90,0.1)':'var(--bg3)', color:k==='OK'?'var(--bg)':k==='C'?'var(--red)':'var(--tx)', border:`1px solid ${k==='OK'?'var(--tx)':k==='C'?'rgba(255,61,90,0.3)':'var(--bd)'}`, borderRadius:'var(--r)', fontSize:k==='OK'?11:20, fontWeight:900, fontFamily:'var(--mono)', minHeight:56, transition:'opacity 0.1s' }}>
                    {k}
                  </button>
                ))}
              </div>

              {error && (
                <p style={{ color:'var(--red)', fontSize:11, fontWeight:700, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <AlertCircle size={13}/>{error}
                </p>
              )}
            </div>
          )}
        </div>
        <p style={{ textAlign:'center', fontSize:8, color:'var(--tx3)', marginTop:20, fontWeight:700, letterSpacing:'0.15em' }}>BARSHIFT PRO © 2026</p>
      </div>
    </div>
  )
}
