import './types'
import { createStore } from 'vuex'
import { loadPersistedState, localStoragePlugin, clearPersistedState } from './persist'
import { curatedBlendList } from '../data/seedDb'
import { resolvedGrassType } from '../data/grass'
import type {
  BackupPayload,
  Blend,
  Equipment,
  GrassType,
  Profile,
  RateOverride,
  ResolvedLocation,
  RootState,
  SprayUnits,
  UserLocation,
} from '../types'

function defaultState(): RootState {
  return {
    profile: {
      lawnName: 'My lawn',
      lawnSqFt: 5000,
      grassType: '',
      seedSpecies: [],
      soilType: '',
      sunExposure: '',
      notes: '',
    },
    location: {
      source: null,
      zip: '',
      city: '',
      state: '',
      label: '',
      latitude: null,
      longitude: null,
      climateBand: null,
      metroId: null,
      usdaZone: null,
      promptDismissed: false,
    },
    equipment: {
      tankGallons: 2,
      sprayCoverageSqFtPerTank: 1000,
      spreaderId: '',
      sprayUnits: 'us',
    },
    rateOverrides: {},
    userBlends: [],
  }
}

function mergeDeep<T extends Record<string, unknown>>(base: T, partial: unknown): T {
  if (!partial || typeof partial !== 'object') return base
  const out = { ...base } as T
  Object.keys(partial as Record<string, unknown>).forEach((key) => {
    const pv = (partial as Record<string, unknown>)[key]
    const bv = (base as Record<string, unknown>)[key]
    if (
      pv &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      ;(out as Record<string, unknown>)[key] = { ...(bv as object), ...(pv as object) }
    } else if (pv !== undefined) {
      ;(out as Record<string, unknown>)[key] = pv
    }
  })
  return out
}

const persisted = loadPersistedState()
const initial = mergeDeep(defaultState() as unknown as Record<string, unknown>, persisted || {}) as unknown as RootState

export default createStore<RootState>({
  state: initial,
  plugins: [localStoragePlugin],
  getters: {
    lawnSqFt: (s) => s.profile.lawnSqFt,
    // A profile saved before this setting existed has no array at all.
    seedSpecies: (s): string[] => s.profile.seedSpecies || [],
    grassType: (s): GrassType | null => resolvedGrassType(s.profile.grassType, s.location),
    grassTypeIsInferred: (s) => !s.profile.grassType && Boolean(resolvedGrassType('', s.location)),
    tankGallons: (s) => s.equipment.tankGallons,
    sprayCoverage: (s) => s.equipment.sprayCoverageSqFtPerTank,
    spreaderId: (s) => s.equipment.spreaderId || '',
    // An imported or older backup can arrive without this, so US is the fallback
    // rather than whatever string happens to be in storage.
    sprayUnits: (s): SprayUnits => (s.equipment.sprayUnits === 'metric' ? 'metric' : 'us'),
    userLocation: (s): UserLocation | null =>
      s.location?.latitude != null && s.location?.longitude != null ? s.location : null,
    hasLocation: (_s, getters) => Boolean(getters.userLocation),
    allBlends: (s) => [...curatedBlendList, ...(s.userBlends || [])],
    exportPayload: (s): BackupPayload => ({
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: s.profile,
      location: s.location,
      equipment: s.equipment,
      rateOverrides: s.rateOverrides,
      userBlends: s.userBlends,
    }),
  },
  mutations: {
    UPDATE_PROFILE(state, partial: Partial<Profile>) {
      state.profile = { ...state.profile, ...partial }
      if (partial.lawnSqFt != null) {
        state.profile.lawnSqFt = Math.max(100, Number(partial.lawnSqFt) || 5000)
      }
    },
    SET_LOCATION(state, loc: Partial<UserLocation> | ResolvedLocation) {
      state.location = {
        ...state.location,
        ...loc,
        promptDismissed: true,
      }
    },
    DISMISS_LOCATION_PROMPT(state) {
      state.location = { ...state.location, promptDismissed: true }
    },
    UPDATE_EQUIPMENT(state, partial: Partial<Equipment>) {
      state.equipment = { ...state.equipment, ...partial }
    },
    SET_RATE_OVERRIDE(state, { rateKey, values }: { rateKey: string; values: RateOverride }) {
      state.rateOverrides = {
        ...state.rateOverrides,
        [rateKey]: { ...(state.rateOverrides[rateKey] || {}), ...values },
      }
    },
    CLEAR_RATE_OVERRIDE(state, rateKey: string) {
      const next = { ...state.rateOverrides }
      delete next[rateKey]
      state.rateOverrides = next
    },
    UPSERT_USER_BLEND(state, blend: Partial<Blend> & Pick<Blend, 'name' | 'components'>) {
      const id = blend.id || `user-${Date.now()}`
      const next: Blend = {
        manufacturer: 'Custom',
        species: 'tall_fescue',
        summary: '',
        ...blend,
        id,
        curated: false,
      }
      const idx = (state.userBlends || []).findIndex((b) => b.id === id)
      if (idx >= 0) {
        const list = [...state.userBlends]
        list[idx] = next
        state.userBlends = list
      } else {
        state.userBlends = [...(state.userBlends || []), next]
      }
    },
    DELETE_USER_BLEND(state, id: string) {
      state.userBlends = (state.userBlends || []).filter((b) => b.id !== id)
    },
    IMPORT_STATE(state, payload: Partial<BackupPayload>) {
      const fresh = defaultState()
      const merged = mergeDeep(fresh as unknown as Record<string, unknown>, {
        profile: payload.profile,
        location: payload.location,
        equipment: payload.equipment,
        rateOverrides: payload.rateOverrides,
      }) as unknown as RootState
      state.profile = merged.profile
      state.location = merged.location
      state.equipment = merged.equipment
      state.rateOverrides = merged.rateOverrides || {}
      state.userBlends = payload.userBlends || []
    },
    RESET_ALL(state) {
      Object.assign(state, defaultState())
      clearPersistedState()
    },
  },
  actions: {
    updateProfile({ commit }, partial: Partial<Profile>) {
      commit('UPDATE_PROFILE', partial)
    },
    setLocation({ commit }, loc: Partial<UserLocation> | ResolvedLocation) {
      commit('SET_LOCATION', loc)
    },
    dismissLocationPrompt({ commit }) {
      commit('DISMISS_LOCATION_PROMPT')
    },
    updateEquipment({ commit }, partial: Partial<Equipment>) {
      commit('UPDATE_EQUIPMENT', partial)
    },
    setRateOverride({ commit }, payload: { rateKey: string; values: RateOverride }) {
      commit('SET_RATE_OVERRIDE', payload)
    },
    upsertUserBlend({ commit }, blend: Partial<Blend> & Pick<Blend, 'name' | 'components'>) {
      commit('UPSERT_USER_BLEND', blend)
    },
    deleteUserBlend({ commit }, id: string) {
      commit('DELETE_USER_BLEND', id)
    },
    importBackup({ commit }, payload: Partial<BackupPayload>) {
      commit('IMPORT_STATE', payload)
    },
    resetAll({ commit }) {
      commit('RESET_ALL')
    },
    downloadBackup({ getters }) {
      const blob = new Blob([JSON.stringify(getters.exportPayload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lawn-plan-nerd-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
  },
})
