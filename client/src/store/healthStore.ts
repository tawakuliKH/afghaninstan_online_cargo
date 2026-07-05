import { create } from 'zustand'

interface HealthState {
  isHealthy: boolean | null
  setHealthy: (healthy: boolean) => void
}

export const useHealthStore = create<HealthState>((set) => ({
  isHealthy: null,
  setHealthy: (healthy) => set({ isHealthy: healthy }),
}))
