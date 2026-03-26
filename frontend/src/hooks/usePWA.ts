import { useEffect } from 'react'
import { initializeFCM, hasNotificationPermission } from '../lib/fcm'

/**
 * Hook to initialize PWA and FCM
 */
export function usePWA() {
  useEffect(() => {
    initializePWA()
  }, [])
}

/**
 * Initialize PWA and setup FCM
 */
async function initializePWA() {
  try {
    // Initialize FCM if permission already granted
    if (hasNotificationPermission()) {
      const token = await initializeFCM()
      if (token) {
        console.log('FCM initialized with token')
      }
    }
  } catch (error) {
    console.error('PWA initialization error:', error)
  }
}
