import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './lib/store'
import Layout from './pages/Layout'
import Login from './pages/Login'
import Clock from './pages/Clock'
import Shift from './pages/Shift'
import Wish from './pages/Wish'
import MyPage from './pages/MyPage'
import AdminShift from './pages/AdminShift'
import AdminStaff from './pages/AdminStaff'
import AdminStats from './pages/AdminStats'

function Guard({ children, admin=false }:{ children:React.ReactNode; admin?:boolean }) {
  const { token, staff } = useAuth()
  if (!token||!staff) return <Navigate to="/login" replace />
  if (admin&&!staff.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { token, staff } = useAuth()
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style:{ background:'#1e2130', color:'#e8eaf2', border:'1px solid #2a2f45', borderRadius:'4px', fontSize:'12px', fontWeight:'700' },
        success:{ iconTheme:{ primary:'#00e87a', secondary:'#0a0a0f' } },
        error:{ iconTheme:{ primary:'#ff3d5a', secondary:'#0a0a0f' } },
      }}/>
      <Routes>
        <Route path="/login" element={token&&staff ? <Navigate to="/" replace/> : <Login/>}/>
        <Route path="/" element={<Guard><Layout/></Guard>}>
          <Route index element={<Clock/>}/>
          <Route path="shift" element={<Shift/>}/>
          <Route path="wish" element={<Wish/>}/>
          <Route path="mypage" element={<MyPage/>}/>
          <Route path="admin/shift" element={<Guard admin><AdminShift/></Guard>}/>
          <Route path="admin/staff" element={<Guard admin><AdminStaff/></Guard>}/>
          <Route path="admin/stats" element={<Guard admin><AdminStats/></Guard>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
