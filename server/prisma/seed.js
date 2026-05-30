import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')
  const store = await db.store.upsert({
    where: { id: 'store-demo' }, update: {},
    create: { id: 'store-demo', name: 'Bar Shift Demo' },
  })
  const list = [
    { id:'staff-1111', name:'田中 花子', role:'マネージャー', type:'full-time',  wage:300000, pin:'1111', isAdmin:true  },
    { id:'staff-2222', name:'鈴木 健太', role:'ホール',       type:'part-time', wage:1050,   pin:'2222', isAdmin:false },
    { id:'staff-3333', name:'佐藤 めぐみ',role:'バーテンダー',type:'part-time', wage:1150,   pin:'3333', isAdmin:false },
    { id:'staff-4444', name:'山田 大輝', role:'キッチン',     type:'part-time', wage:1000,   pin:'4444', isAdmin:false },
    { id:'staff-5555', name:'伊藤 結衣', role:'ホール',       type:'part-time', wage:1050,   pin:'5555', isAdmin:false },
    { id:'staff-6666', name:'渡辺 翔',   role:'キッチン',     type:'part-time', wage:1100,   pin:'6666', isAdmin:false },
  ]
  for (const s of list) {
    await db.staff.upsert({
      where: { id: s.id }, update: {},
      create: { id:s.id, storeId:store.id, name:s.name, role:s.role, type:s.type, wage:s.wage, pin: await bcrypt.hash(s.pin, 10), isAdmin:s.isAdmin },
    })
  }
  console.log('✅ Done!')
  list.forEach(s => console.log(`  ${s.name.padEnd(12)} → PIN: ${s.pin}${s.isAdmin?' (admin)':''}`))
}

main().catch(console.error).finally(() => db.$disconnect())
