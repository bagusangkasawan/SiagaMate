import admin from 'firebase-admin'
import { env } from '../config/env.js'

function getFirebaseCredential() {
  if (env.firebaseServiceAccountJson) {
    const parsed = JSON.parse(env.firebaseServiceAccountJson) as admin.ServiceAccount
    return admin.credential.cert(parsed)
  }

  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n')
    })
  }

  return null
}

export function initFirebase() {
  if (admin.apps.length > 0) return

  const credential = getFirebaseCredential()
  if (!credential) {
    console.warn('FCM belum aktif: firebase credentials tidak ditemukan di .env')
    return
  }

  admin.initializeApp({ credential })
  console.log('Firebase Admin initialized')
}

export async function sendPushNotification({
  token,
  title,
  body,
  data
}: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  if (admin.apps.length === 0) {
    return { success: false, reason: 'firebase-not-initialized' }
  }

  await admin.messaging().send({
    token,
    notification: { title, body },
    data
  })

  return { success: true }
}
