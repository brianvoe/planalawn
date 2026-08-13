import './types'
import { createStore } from 'vuex'
import { loadPersistedState, localStoragePlugin, clearPersistedState } from './persist'
import { curatedBlendList } from '../data/seedDb'
import type {
  BackupPayload,
  Blend,
  Equipment,
  Profile,
  Project,
  RateOverride,
  ResolvedLocation,
  RootState,
  TaskLog,
  UserLocation,
} from '../types'

function emptyTaskLog(): TaskLog {
  return {
    lastDoneAt: null,
    notes: '',
    stepsChecked: {},
    history: [],
  }
}

function defaultState(): RootState {
  return {
    profile: {
      lawnName: 'My lawn',
      lawnSqFt: 5000,
      preferredSeed: '',
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
    },
    rateOverrides: {},
    taskLogs: {},
    project: {
      phase: 'maintenance',
      killAppliedAt: null,
      secondKillAt: null,
      aeratedAt: null,
      topsoilAt: null,
      seededAt: null,
      firstMowAt: null,
      notes: '',
    },
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
    preferredSeed: (s) => s.profile.preferredSeed,
    tankGallons: (s) => s.equipment.tankGallons,
    sprayCoverage: (s) => s.equipment.sprayCoverageSqFtPerTank,
    userLocation: (s): UserLocation | null =>
      s.location?.latitude != null && s.location?.longitude != null ? s.location : null,
    hasLocation: (_s, getters) => Boolean(getters.userLocation),
    allBlends: (s) => [...curatedBlendList, ...(s.userBlends || [])],
    taskLog: (s) => (taskId: string) => s.taskLogs[taskId] || emptyTaskLog(),
    projectMilestones: (s) => s.project,
    exportPayload: (s): BackupPayload => ({
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: s.profile,
      location: s.location,
      equipment: s.equipment,
      rateOverrides: s.rateOverrides,
      taskLogs: s.taskLogs,
      project: s.project,
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
    TOGGLE_TASK_STEP(state, { taskId, stepIndex }: { taskId: string; stepIndex: number }) {
      const log = state.taskLogs[taskId] || emptyTaskLog()
      const stepsChecked = { ...log.stepsChecked }
      if (stepsChecked[stepIndex]) delete stepsChecked[stepIndex]
      else stepsChecked[stepIndex] = true
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, stepsChecked },
      }
    },
    SET_TASK_NOTES(state, { taskId, notes }: { taskId: string; notes: string }) {
      const log = state.taskLogs[taskId] || emptyTaskLog()
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, notes },
      }
    },
    MARK_TASK_DONE(state, { taskId, at = null }: { taskId: string; at?: string | null }) {
      const when = at || new Date().toISOString().slice(0, 10)
      const log = state.taskLogs[taskId] || emptyTaskLog()
      const history = [...(log.history || []), when].slice(-20)
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, lastDoneAt: when, history },
      }
    },
    CLEAR_TASK_DONE(state, taskId: string) {
      const log = state.taskLogs[taskId]
      if (!log) return
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, lastDoneAt: null },
      }
    },
    UPDATE_PROJECT(state, partial: Partial<Project>) {
      state.project = { ...state.project, ...partial }
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
        taskLogs: payload.taskLogs,
        project: payload.project,
      }) as unknown as RootState
      state.profile = merged.profile
      state.location = merged.location
      state.equipment = merged.equipment
      state.rateOverrides = merged.rateOverrides || {}
      state.taskLogs = merged.taskLogs || {}
      state.project = merged.project
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
    toggleTaskStep({ commit }, payload: { taskId: string; stepIndex: number }) {
      commit('TOGGLE_TASK_STEP', payload)
    },
    setTaskNotes({ commit }, payload: { taskId: string; notes: string }) {
      commit('SET_TASK_NOTES', payload)
    },
    markTaskDone({ commit }, payload: { taskId: string; at?: string | null }) {
      commit('MARK_TASK_DONE', payload)
    },
    clearTaskDone({ commit }, taskId: string) {
      commit('CLEAR_TASK_DONE', taskId)
    },
    updateProject({ commit }, partial: Partial<Project>) {
      commit('UPDATE_PROJECT', partial)
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
