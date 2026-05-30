import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET || 'barshift-dev-secret'
export const signToken = p => jwt.sign(p, SECRET, { expiresIn: '7d' })
export const verifyToken = t => jwt.verify(t, SECRET)
export function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  try { req.staff = verifyToken(token); next() }
  catch { res.status(403).json({ error: 'Invalid token' }) }
}
export function admin(req, res, next) {
  if (!req.staff?.isAdmin) return res.status(403).json({ error: 'Admin only' })
  next()
}
