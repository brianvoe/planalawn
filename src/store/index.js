import { createStore } from 'vuex'
import { loadPersistedState, localStoragePlugin, clearPersistedState } from './persist'
import { curatedBlendList } from '../data/seedDb'

function defaultState() {
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
      // User-resolved US location (geo or ZIP/city)
      source: null,
      zip: '',
      city: '',
      state: '',
      label: '',
      latitude: null,
      longitude: null,
      climateBand: null,
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

function mergeDeep(base, partial) {
  if (!partial || typeof partial !== 'object') return base
  const out = { ...base }
  Object.keys(partial).forEach((key) => {
    const pv = partial[key]
    const bv = base[key]
    if (
      pv &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      out[key] = { ...bv, ...pv }
    } else if (pv !== undefined) {
      out[key] = pv
    }
  })
  return out
}

const persisted = loadPersistedState()
const initial = mergeDeep(defaultState(), persisted || {})

export default createStore({
  state: initial,
  plugins: [localStoragePlugin],
  getters: {
    lawnSqFt: (s) => s.profile.lawnSqFt,
    preferredSeed: (s) => s.profile.preferredSeed,
    tankGallons: (s) => s.equipment.tankGallons,
    sprayCoverage: (s) => s.equipment.sprayCoverageSqFtPerTank,
    userLocation: (s) =>
      s.location?.latitude != null && s.location?.longitude != null ? s.location : null,
    hasLocation: (s, getters) => Boolean(getters.userLocation),
    allBlends: (s) => [...curatedBlendList, ...(s.userBlends || [])],
    taskLog: (s) => (taskId) =>
      s.taskLogs[taskId] || {
        lastDoneAt: null,
        notes: '',
        stepsChecked: {},
        history: [],
      },
    projectMilestones: (s) => s.project,
    exportPayload: (s) => ({
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
    UPDATE_PROFILE(state, partial) {
      state.profile = { ...state.profile, ...partial }
      if (partial.lawnSqFt != null) {
        state.profile.lawnSqFt = Math.max(100, Number(partial.lawnSqFt) || 5000)
      }
    },
    SET_LOCATION(state, loc) {
      state.location = {
        ...state.location,
        ...loc,
        promptDismissed: true,
      }
    },
    DISMISS_LOCATION_PROMPT(state) {
      state.location = { ...state.location, promptDismissed: true }
    },
    UPDATE_EQUIPMENT(state, partial) {
      state.equipment = { ...state.equipment, ...partial }
    },
    SET_RATE_OVERRIDE(state, { rateKey, values }) {
      state.rateOverrides = {
        ...state.rateOverrides,
        [rateKey]: { ...(state.rateOverrides[rateKey] || {}), ...values },
      }
    },
    CLEAR_RATE_OVERRIDE(state, rateKey) {
      const next = { ...state.rateOverrides }
      delete next[rateKey]
      state.rateOverrides = next
    },
    TOGGLE_TASK_STEP(state, { taskId, stepIndex }) {
      const log = state.taskLogs[taskId] || {
        lastDoneAt: null,
        notes: '',
        stepsChecked: {},
        history: [],
      }
      const stepsChecked = { ...log.stepsChecked }
      if (stepsChecked[stepIndex]) delete stepsChecked[stepIndex]
      else stepsChecked[stepIndex] = true
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, stepsChecked },
      }
    },
    SET_TASK_NOTES(state, { taskId, notes }) {
      const log = state.taskLogs[taskId] || {
        lastDoneAt: null,
        notes: '',
        stepsChecked: {},
        history: [],
      }
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, notes },
      }
    },
    MARK_TASK_DONE(state, { taskId, at = null }) {
      const when = at || new Date().toISOString().slice(0, 10)
      const log = state.taskLogs[taskId] || {
        lastDoneAt: null,
        notes: '',
        stepsChecked: {},
        history: [],
      }
      const history = [...(log.history || []), when].slice(-20)
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, lastDoneAt: when, history },
      }
    },
    CLEAR_TASK_DONE(state, taskId) {
      const log = state.taskLogs[taskId]
      if (!log) return
      state.taskLogs = {
        ...state.taskLogs,
        [taskId]: { ...log, lastDoneAt: null },
      }
    },
    UPDATE_PROJECT(state, partial) {
      state.project = { ...state.project, ...partial }
    },
    UPSERT_USER_BLEND(state, blend) {
      const id = blend.id || `user-${Date.now()}`
      const next = { ...blend, id, curated: false }
      const idx = (state.userBlends || []).findIndex((b) => b.id === id)
      if (idx >= 0) {
        const list = [...state.userBlends]
        list[idx] = next
        state.userBlends = list
      } else {
        state.userBlends = [...(state.userBlends || []), next]
      }
    },
    DELETE_USER_BLEND(state, id) {
      state.userBlends = (state.userBlends || []).filter((b) => b.id !== id)
    },
    IMPORT_STATE(state, payload) {
      const fresh = defaultState()
      const merged = mergeDeep(fresh, {
        profile: payload.profile,
        location: payload.location,
        equipment: payload.equipment,
        rateOverrides: payload.rateOverrides,
        taskLogs: payload.taskLogs,
        project: payload.project,
      })
      state.profile = merged.profile
      state.location = merged.location
      state.equipment = merged.equipment
      state.rateOverrides = merged.rateOverrides || {}
      state.taskLogs = merged.taskLogs || {}
      state.project = merged.project
      state.userBlends = payload.userBlends || []
    },
    RESET_ALL(state) {
      const fresh = defaultState()
      Object.keys(fresh).forEach((k) => {
        state[k] = fresh[k]
      })
      clearPersistedState()
    },
  },
  actions: {
    updateProfile({ commit }, partial) {
      commit('UPDATE_PROFILE', partial)
    },
    setLocation({ commit }, loc) {
      commit('SET_LOCATION', loc)
    },
    dismissLocationPrompt({ commit }) {
      commit('DISMISS_LOCATION_PROMPT')
    },
    updateEquipment({ commit }, partial) {
      commit('UPDATE_EQUIPMENT', partial)
    },
    setRateOverride({ commit }, payload) {
      commit('SET_RATE_OVERRIDE', payload)
    },
    toggleTaskStep({ commit }, payload) {
      commit('TOGGLE_TASK_STEP', payload)
    },
    setTaskNotes({ commit }, payload) {
      commit('SET_TASK_NOTES', payload)
    },
    markTaskDone({ commit }, payload) {
      commit('MARK_TASK_DONE', payload)
    },
    clearTaskDone({ commit }, taskId) {
      commit('CLEAR_TASK_DONE', taskId)
    },
    updateProject({ commit }, partial) {
      commit('UPDATE_PROJECT', partial)
    },
    upsertUserBlend({ commit }, blend) {
      commit('UPSERT_USER_BLEND', blend)
    },
    deleteUserBlend({ commit }, id) {
      commit('DELETE_USER_BLEND', id)
    },
    importBackup({ commit }, payload) {
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
