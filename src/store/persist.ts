import type { Plugin } from 'vuex'
import type { RootState } from '../types'

const STORAGE_KEY = 'grass.store.v1'
const LEGACY_PREFS_KEY = 'grass.prefs.v1'

export function loadPersistedState(): Partial<RootState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RootState> & { taskLogs?: unknown }
      delete parsed.taskLogs
      return parsed
    }
  } catch {
    /* ignore */
  }

  try {
    const legacy = localStorage.getItem(LEGACY_PREFS_KEY)
    if (!legacy) return null
    const prefs = JSON.parse(legacy) as {
      lawnSqFt?: number
      tankGallons?: number
      sprayCoverageSqFtPerTank?: number
    }
    return {
      profile: {
        lawnSqFt: prefs.lawnSqFt,
      } as RootState['profile'],
      equipment: {
        tankGallons: prefs.tankGallons,
        sprayCoverageSqFtPerTank: prefs.sprayCoverageSqFtPerTank,
      } as RootState['equipment'],
    }
  } catch {
    return null
  }
}

export function persistState(state: RootState): void {
  const snapshot = {
    profile: state.profile,
    location: state.location,
    equipment: state.equipment,
    rateOverrides: state.rateOverrides,
    project: state.project,
    userBlends: state.userBlends,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

/** Vuex plugin — write selected slices after every mutation */
export const localStoragePlugin: Plugin<RootState> = (store) => {
  store.subscribe((_mutation, state) => {
    try {
      persistState(state)
    } catch {
      /* quota / private mode */
    }
  })
}

export function clearPersistedState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
