export type ProfileType = 'warga' | 'petugas'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Coordinates {
  lat: number
  lng: number
}

export interface AlertItem {
  id: string
  title: string
  severity: RiskLevel
  message: string
  category: string
  action: string
  payload: unknown
}
