import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Clock, Calendar, Send, User, Settings, Users, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../lib/store'
import { nameColor } from '../lib/utils'
import toast from 'react-hot-toast'

export default function Layout() {
  const { staff, logout } = useAuth()
  const nav = useNavigate()
  if (!staff) return null
  const items = [
    { to:'/', icon:Clock, label:'打刻', end:true },
    { to:'/shift', icon:Calendar, label:'シフト' },
    { to:'/wish', icon:Send, label:'希望' },
    { to:'/mypage', icon:User, label:'マイページ' },
    ...(staff.isAdmin ? [
      { to:'/admin/shift', icon:Settings, label:'シフト管理' },
      { to:'/admin/staff', icon:Users, label:'スタッフ' },
      { to:'/admin/stats', icon:BarChart3, label:'集計' },
    ] : []),
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh' }}>
      <header style={{ background:'var(--bg)', borderBottom:'1px solid var(--bd)', padding:'10px 16px', paddingTop:'max(env(safe-area-inset-top,0px),10px)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:nameColor(staff.name), borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{staff.name[0]}</div>
          <div>
            <div style={{ fontWeight:900, fontSize:14, lineHeight:1.2 }}>{staff.name}</div>
            <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>{staff.store?.name||'BarShift Pro'}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {staff.isAdmin&&<span className="tag tag-adm">Admin</span>}
          <button onClick={()=>{ logout(); nav('/login'); toast.success('ログアウトしました') }}
            style={{ width:38, height:38, background:'var(--bg3)', border:'1px solid var(--bd)', color:'var(--tx2)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r)' }}>
            <LogOut size={16}/>
          </button>
        </div>
      </header>

      <nav style={{ background:'var(--bg)', borderBottom:'1px solid var(--bd)', overflowX:'auto', position:'sticky', top:57, zIndex:90, scrollbarWidth:'none' }}>
        <div style={{ display:'flex', padding:'8px 12px', gap:4, minWidth:'max-content' }}>
          {items.map(({ to, icon:Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
              fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
              borderRadius:'var(--r)', whiteSpace:'nowrap', transition:'all 0.15s',
              background: isActive ? 'var(--tx)' : 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--tx3)',
            })}>
              <Icon size={13}/>{label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main style={{ flex:1, padding:'20px 16px', maxWidth:920, width:'100%', margin:'0 auto', paddingBottom:'max(env(safe-area-inset-bottom,0px),48px)', boxSizing:'border-box' }}>
        <Outlet/>
      </main>
    </div>
  )
}
