<script lang="ts">
import Nav from './components/nav.vue'
import Footer from './components/footer.vue'
import LocationPrompt from './components/location-prompt.vue'
import { snapToMetro } from './services/geolocation'
import { fetchConditions } from './services/weather'
import type { Conditions, UserLocation } from './types'

export default {
  name: 'App',
  components: { Nav, Footer, LocationPrompt },
  data() {
    return {
      conditions: null as Conditions | null,
      weatherError: null as string | null,
      weatherLoading: false,
    }
  },
  created() {
    const snapped = snapToMetro(this.$store.state.location)
    if (snapped && snapped.metroId !== this.$store.state.location.metroId) {
      this.$store.dispatch('setLocation', snapped)
      return
    }
    if (this.hasLocation) this.loadWeather(false)
  },
  watch: {
    userLocation: {
      deep: true,
      handler() {
        this.loadWeather(true)
      },
    },
  },
  computed: {
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    hasLocation(): boolean {
      return this.$store.getters.hasLocation
    },
    /**
     * Everywhere but home. The home hero is sized to one screen and asks for a
     * location itself, so a banner above it would only push the page off-screen.
     */
    showLocationPrompt(): boolean {
      return this.$router.currentRoute.value.name !== 'home'
    },
  },
  methods: {
    async loadWeather(force: boolean) {
      if (!this.hasLocation) {
        this.conditions = null
        this.weatherError = 'Set your location to load local soil temperature'
        return
      }
      this.weatherLoading = true
      this.weatherError = null
      try {
        this.conditions = await fetchConditions(this.userLocation, { force })
      } catch (err) {
        this.weatherError = err instanceof Error ? err.message : 'Could not load weather'
      } finally {
        this.weatherLoading = false
      }
    },
  },
}
</script>

<style lang="scss">
.app-shell {
  .app-shell__main {
    min-height: 60vh;
  }
}
</style>

<template>
  <div class="app-shell">
    <Nav :conditions="conditions" />
    <main class="app-shell__main">
      <LocationPrompt v-if="showLocationPrompt" />
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          :conditions="conditions"
          :weather-error="weatherError"
          :weather-loading="weatherLoading"
          @refresh-weather="loadWeather(true)"
        />
      </router-view>
    </main>
    <Footer />
  </div>
</template>
