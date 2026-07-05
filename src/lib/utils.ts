export const STORE_ID = import.meta.env.VITE_STORE_ID || 'store-demo'
export const WEEKDAYS = ['日','月','火','水','木','金','土']
export const HOLIDAYS: Record<string,string> = {
  '2026-01-01':'元日','2026-01-12':'成人の日','2026-02-11':'建国記念の日','2026-02-23':'天皇誕生日',
  '2026-03-20':'春分の日','2026-04-29':'昭和の日','2026-05-03':'憲法記念日','2026-05-04':'みどりの日',
  '2026-05-05':'こどもの日','2026-07-20':'海の日','2026-08-11':'山の日','2026-09-21':'敬老の日',
  '2026-09-23':'秋分の日','2026-10-12':'スポーツの日','2026-11-03':'文化の日','2026-11-23':'勤労感謝の日',
}
export const TIME_OPTS = Array.from({length:27},(_,i)=>{
  const t=13*60+i*30; return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`
})
export const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']
export const nameColor = (n:string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

// JST変換（タイムゾーンバグ修正済み）
export const nowJST = () => new Date(Date.now() + 9*60*60*1000)
export const todayDk = () => nowJST().toISOString().slice(0,10)
export const bizDateFrom = (jst:Date) => { const d=new Date(jst.getTime()); if(d.getUTCHours()<5) d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0,10) }
export const todayBiz = () => bizDateFrom(nowJST())
export const dateDk = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
export const dk = (y:number,m:number,d:number) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
export const yen = (n:number) => `¥${Math.round(n).toLocaleString('ja-JP')}`

export function calcPay(wage:number,type:'part-time'|'full-time',stdH:number,fixOT:number,inT:string,outT:string){
  const pt=(t:string)=>{const[h,m]=t.split(':').map(Number);return h+m/60}
  const s=pt(inT);let e=pt(outT);if(e<s)e+=24
  const total=e-s,ot=Math.max(0,total-8),ln=Math.max(0,Math.min(e,29)-Math.max(s,22))
  const bh=type==='full-time'?wage/(stdH||160):wage
  const base=type==='part-time'?(total-ot)*bh:0
  const otP=type==='part-time'?ot*bh*1.25:0
  const lnP=ln*bh*0.25
  return{total,ot,ln,base,otP,lnP,pay:base+otP+lnP,bh}
}
