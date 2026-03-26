/**
 * Firebase Cloud Messaging (FCM) integration for PWA
 * Handles push notifications and device token registration
 */

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY
const API_BASE = import.meta.env.VITE_API_BASE_URL

/**
 * Request notification permission and setup FCM
 */
export async function initializeFCM(): Promise<string | null> {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported')
      return null
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return null
    }

    // Check if push notifications are supported
    if (!('PushManager' in window)) {
      console.log('Push notifications not supported')
      return null
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return null
      }
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission is not granted')
      return null
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
    })

    const token = JSON.stringify(subscription)
    console.log('FCM subscription successful')

    // Send token to backend
    await registerDeviceToken(token)

    return token
  } catch (error) {
    console.error('FCM initialization failed:', error)
    return null
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as BufferSource
}

/**
 * Register device token with backend
 */
export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        platform: 'web',
        userAgent: navigator.userAgent
      })
    })
  } catch (error) {
    console.error('Failed to register device token:', error)
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  )
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if ('Notification' in window) {
    return Notification.permission
  }
  return 'denied'
}

/**
 * Check if user has granted notification permission
 */
export function hasNotificationPermission(): boolean {
  return getNotificationPermission() === 'granted'
}

/**
 * Request notification permission explicitly
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted')
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied. Please enable in browser settings.')
    return false
  }

  // Ensure service worker is ready before requesting permission
  try {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready
      console.log('Service Worker is ready')
    }
  } catch (error) {
    console.warn('Service Worker not available:', error)
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission()
    console.log('Notification permission result:', permission)
    
    if (permission === 'granted') {
      // Attempt to subscribe to push notifications
      try {
        const registration = await navigator.serviceWorker.ready
        if (VAPID_KEY && !registration.pushManager) {
          console.warn('Push Manager not available')
        } else if (VAPID_KEY) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
          })
          const token = JSON.stringify(subscription)
          await registerDeviceToken(token)
          console.log('Successfully subscribed to push notifications')
        }
      } catch (pushError) {
        console.warn('Failed to subscribe to push notifications:', pushError)
        // Still return true because notification permission was granted
      }
    }
    
    return permission === 'granted'
  } catch (error) {
    console.error('Failed to request notification permission:', error)
    return false
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    return false
  }
}

/**
 * Get current push notification subscription
 */
export async function getPushNotificationSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error('Failed to get push notification subscription:', error)
    return null
  }
}
