const STORAGE_KEY = 'grass.store.v1'
const LEGACY_PREFS_KEY = 'grass.prefs.v1'

export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }

  // One-time migrate from earlier prefs helper
  try {
    const legacy = localStorage.getItem(LEGACY_PREFS_KEY)
    if (!legacy) return null
    const prefs = JSON.parse(legacy)
    return {
      profile: {
        lawnSqFt: prefs.lawnSqFt,
      },
      equipment: {
        tankGallons: prefs.tankGallons,
        sprayCoverageSqFtPerTank: prefs.sprayCoverageSqFtPerTank,
      },
    }
  } catch {
    return null
  }
}

export function persistState(state) {
  const snapshot = {
    profile: state.profile,
    location: state.location,
    equipment: state.equipment,
    rateOverrides: state.rateOverrides,
    taskLogs: state.taskLogs,
    project: state.project,
    userBlends: state.userBlends,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

/** Vuex plugin — write selected slices after every mutation */
export function localStoragePlugin(store) {
  store.subscribe((_mutation, state) => {
    try {
      persistState(state)
    } catch {
      /* quota / private mode */
    }
  })
}

export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY)
}
