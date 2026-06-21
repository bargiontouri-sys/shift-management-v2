import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Users, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { yen } from '../lib/utils'
import { useAuth } from '../lib/store'
import { api } from '../lib/api'

export function AdminStaff() {
  const { staff:me } = useAuth()
  const [list, setList] = useState<any[]>([])
  const [editId, setEditId] = useState<string|null>(null)
  const [buf, setBuf] = useState<any>({})
  const [form, setForm] = useState({ name:'', role:'スタッフ', type:'part-time', wage:1100, pin:'', isAdmin:false })
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number|null>(null)
  const [dragOver, setDragOver] = useState<number|null>(null)
  const s: React.CSSProperties = { width:'100%', background:'var(--bg3)', border:'1px solid var(--bd2)', padding:'8px 10px', fontSize:12, color:'var(--tx)', outline:'none', borderRadius:'var(--r)', boxSizing:'border-box' as any }

  const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#3b82f6','#06b6d4','#84cc16','#f97316','#e11d48','#7c3aed','#0891b2','#059669','#d97706']
  const nc = (staff: any) => staff.iconColor || COLORS[list.findIndex(s=>s.id===staff.id) % COLORS.length] || '#6366f1'

  useEffect(() => { api.get('/api/staff').then(r => setList(r.data)).catch(() => {}) }, [])

  const save = async () => {
    setSaving(true)
    try {
      const p: any = { name:buf.name, role:buf.role, type:buf.type, wage:parseInt(buf.wage), isAdmin:buf.isAdmin }
      if (buf.pin) p.pin = buf.pin
      await api.patch(`/api/staff/${editId}`, p)
      toast.success('更新しました'); setEditId(null)
      api.get('/api/staff').then(r => setList(r.data))
    } catch(e:any) { toast.error(e.response?.data?.error||'更新に失敗しました') }
    finally { setSaving(false) }
  }

  const del = async (id: string, n: string) => {
    if (!confirm(`${n}さんを削除しますか？`)) return
    try {
      await api.delete(`/api/staff/${id}`)
      toast.success('削除しました'); setList(p => p.filter(s => s.id!==id))
    } catch(e:any) { toast.error(e.response?.data?.error||'削除に失敗しました') }
  }

  const add = async () => {
    if (!form.name||!form.pin||form.pin.length!==4) { toast.error('名前と4桁PINを入力してください'); return }
    setSaving(true)
    try {
      await api.post('/api/staff', { ...form, wage:parseInt(form.wage as any) })
      toast.success('追加しました')
      setForm({ name:'', role:'スタッフ', type:'part-time', wage:1100, pin:'', isAdmin:false })
      api.get('/api/staff').then(r => setList(r.data))
    } catch(e:any) { toast.error(e.response?.data?.error||'追加に失敗しました') }
    finally { setSaving(false) }
  }

  // ドラッグ&ドロップ
  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOver(idx) }
  const handleDrop = async (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOver(null); return }
    const newList = [...list]
    const [moved] = newList.splice(dragIdx, 1)
    newList.splice(idx, 0, moved)
    setList(newList)
    setDragIdx(null); setDragOver(null)
    try {
      await api.patch('/api/staff/sort', { order: newList.map(s => s.id) })
      toast.success('並び順を保存しました')
    } catch { toast.error('並び順の保存に失敗しました') }
  }

  return (
    <div className="fu" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <Users size={13} color="var(--tx2)"/>
          <h3 style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>スタッフ一覧 ({list.length})</h3>
        </div>
        <p style={{ fontSize:10, color:'var(--tx3)', marginBottom:14 }}>
          <GripVertical size={11} style={{ verticalAlign:'middle' }}/> をドラッグして並び替えできます
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {list.map((s, idx) => (
            <div key={s.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOver(null) }}
              style={{ background:'var(--bg3)', border:`1px solid ${dragOver===idx?'var(--ac)':'var(--bd)'}`, borderRadius:'var(--r)', overflow:'hidden', opacity: dragIdx===idx ? 0.5 : 1, transition:'border-color 0.1s' }}>
              {editId===s.id ? (
                <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label className="lbl">名前</label><input value={buf.name} onChange={e=>setBuf((p:any)=>({...p,name:e.target.value}))} style={s}/></div>
                    <div><label className="lbl">役割</label><input value={buf.role} onChange={e=>setBuf((p:any)=>({...p,role:e.target.value}))} style={s}/></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label className="lbl">雇用形態</label><select value={buf.type} onChange={e=>setBuf((p:any)=>({...p,type:e.target.value}))} style={{...s}}><option value="part-time">アルバイト</option><option value="full-time">正社員</option></select></div>
                    <div><label className="lbl">{buf.type==='full-time'?'月給':'時給'}</label><input type="number" value={buf.wage} onChange={e=>setBuf((p:any)=>({...p,wage:e.target.value}))} style={{...s,fontFamily:'var(--mono)'}}/></div>
                  </div>
                  <div><label className="lbl">新しいPIN（変更する場合）</label><input type="password" maxLength={4} value={buf.pin} onChange={e=>setBuf((p:any)=>({...p,pin:e.target.value}))} placeholder="変更しない場合は空欄" style={{...s,fontFamily:'var(--mono)',letterSpacing:'0.3em'}}/></div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" id={`a-${s.id}`} checked={buf.isAdmin} onChange={e=>setBuf((p:any)=>({...p,isAdmin:e.target.checked}))}/><label htmlFor={`a-${s.id}`} className="lbl" style={{ margin:0, cursor:'pointer' }}>管理者権限</label></div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-p" onClick={save} disabled={saving} style={{ flex:1 }}>{saving?'保存中...':'保存する'}</button>
                    <button className="btn btn-g" onClick={()=>setEditId(null)}>キャンセル</button>
                    {s.id!==me?.id&&<button className="btn btn-d" onClick={()=>del(s.id,s.name)}><Trash2 size={14}/></button>}
                  </div>
                </div>
              ) : (
                <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ cursor:'grab', color:'var(--tx3)', padding:'0 4px' }}><GripVertical size={16}/></div>
                    <div style={{ width:34, height:34, background:nc(s), borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:13, flexShrink:0 }}>{s.name[0]}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:900, fontSize:13 }}>{s.name}</span>
                        <span className={`tag ${s.type==='full-time'?'tag-full':'tag-part'}`}>{s.type==='full-time'?'正社員':'A/P'}</span>
                        {s.isAdmin&&<span className="tag tag-adm">管理者</span>}
                      </div>
                      <div style={{ fontSize:10, color:'var(--tx3)', fontFamily:'var(--mono)', marginTop:2 }}>¥{s.wage.toLocaleString()}{s.type==='full-time'?'/月':'/h'} · {s.role}</div>
                    </div>
                  </div>
                  <button className="btn btn-g" onClick={()=>{ setEditId(s.id); setBuf({...s,pin:''}) }} style={{ padding:'5px 12px', fontSize:9 }}>編集</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}><Plus size={13} color="var(--ac)"/><h3 style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>スタッフを追加</h3></div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label className="lbl">名前</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="田中 太郎" style={s}/></div>
            <div><label className="lbl">役割</label><input value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} placeholder="ホール" style={s}/></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label className="lbl">雇用形態</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{...s}}><option value="part-time">アルバイト</option><option value="full-time">正社員</option></select></div>
            <div><label className="lbl">{form.type==='full-time'?'月給':'時給'}</label><input type="number" value={form.wage} onChange={e=>setForm(p=>({...p,wage:parseInt(e.target.value)||0}))} style={{...s,fontFamily:'var(--mono)'}}/></div>
          </div>
          <div><label className="lbl">PIN (4桁)</label><input type="password" maxLength={4} value={form.pin} onChange={e=>setForm(p=>({...p,pin:e.target.value}))} placeholder="0000" style={{...s,fontFamily:'var(--mono)',letterSpacing:'0.3em'}}/></div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" id="new-adm" checked={form.isAdmin} onChange={e=>setForm(p=>({...p,isAdmin:e.target.checked}))}/><label htmlFor="new-adm" className="lbl" style={{ margin:0, cursor:'pointer' }}>管理者権限を付与</label></div>
          <button className="btn btn-p" onClick={add} disabled={saving} style={{ width:'100%', padding:12 }}>{saving?'追加中...':'スタッフを追加する'}</button>
        </div>
      </div>
    </div>
  )
}

export default AdminStaff
