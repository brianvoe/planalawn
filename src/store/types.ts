import type { Store } from 'vuex'
import type { Router } from 'vue-router'
import type { BackupPayload, Blend, Equipment, GrassType, Profile, RootState, UserLocation } from '../types'

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
  exportPayload: BackupPayload
}

export type AppStore = Store<RootState> & { getters: StoreGetters }

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: AppStore
    $router: Router
  }
}

export type { RootState, Profile, Equipment, Blend, UserLocation }
