import type { Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'

export interface AuthRequest extends Request {
  uid?: string
  email?: string
}

/**
 * Middleware: verifies Firebase ID token from Authorization header.
 * Sets req.uid and req.email on success.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token autentikasi diperlukan' })
  }

  const idToken = header.slice(7)

  if (admin.apps.length === 0) {
    return res.status(503).json({ error: 'Firebase belum diinisialisasi' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    req.uid = decoded.uid
    req.email = decoded.email
    next()
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' })
  }
}

/**
 * Optional auth: extracts uid if token present, but doesn't block.
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ') || admin.apps.length === 0) {
    return next()
  }

  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7))
    req.uid = decoded.uid
    req.email = decoded.email
  } catch {
    // silently continue without auth
  }
  next()
}
