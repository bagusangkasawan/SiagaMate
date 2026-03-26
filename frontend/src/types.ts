export type AlertItem = {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high'
  message: string
  category: string
  action: string
}

export type RiskPrediction = {
  disasterType: string
  location: { lat: number; lng: number }
  riskLevel: 'low' | 'medium' | 'high'
  bmkgData: {
    earthquake: {
      magnitude: string
      region: string
      potential: string
      depth: string
      dateTime: string
      source: string
      coordinates: { lat: number; lng: number }
    } | null
    weatherWarning: {
      summary: string
      source: string
    } | null
    weatherForecast: {
      source: string
      location?: string
      forecast: Array<{
        localDatetime: string
        temperature: number
        weather: string
        humidity: number
        windSpeed: number
        windDirection: string
      }>
      riskLevel: 'low' | 'medium' | 'high'
      riskIndicators: string[]
      hasHeavyRain: boolean
    } | null
  }
  firstAidChecklist: string[]
  generatedAt: string
  dataSource: string
  transparency: string
}

export type SimulationResult = {
  title: string
  assumptions: string[]
  phases: string[]
  aiRecommendations: string[]
  generatedAt: string
}

export type ChatRecord = {
  id?: string
  message: string
  answer: string
  provider: string
  createdAt?: string
}

export type UserProfile = {
  name: string
  locationLabel: string
  lat: number
  lng: number
  profile: 'warga' | 'petugas'
  adminLevel4Code?: string  // BMKG weather forecast admin code (e.g., 31.71.03.1001)
}

export type BmkgEarthquake = {
  source: string
  dateTime: string
  magnitude: string
  depth: string
  region: string
  potential: string
  felt: string | null
  coordinates: { lat: number; lng: number }
}

export type AssessmentQuestion = {
  id: string
  question: string
  category: 'earthquake' | 'flood' | 'general'
  options: {
    text: string
    points: number
  }[]
}

export type AssessmentResult = {
  earthquakeReadiness: number // 0-100
  floodReadiness: number // 0-100
  overallReadiness: number // 0-100
  recommendations: string[]
  generatedAt: string
}
