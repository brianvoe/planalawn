import type { Store } from 'vuex'
import type { BackupPayload, Blend, Equipment, GrassType, Profile, Project, RootState, TaskLog, UserLocation } from '../types'

export interface StoreGetters {
  lawnSqFt: number
  preferredSeed: string
  grassType: GrassType | null
  grassTypeIsInferred: boolean
  tankGallons: number
  sprayCoverage: number
  userLocation: UserLocation | null
  hasLocation: boolean
  allBlends: Blend[]
  taskLog: (taskId: string) => TaskLog
  projectMilestones: Project
  exportPayload: BackupPayload
}

export type AppStore = Store<RootState> & { getters: StoreGetters }

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: AppStore
  }
}

export type { RootState, Profile, Equipment, Project, TaskLog, Blend, UserLocation }
