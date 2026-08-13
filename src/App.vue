<template>
  <div class="app-shell">
    <AppNav :conditions="conditions" />
    <main class="app-shell__main">
      <LocationPrompt @location-set="onLocationSet" />
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
    <AppFooter />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppNav from './components/layout/AppNav.vue'
import AppFooter from './components/layout/AppFooter.vue'
import LocationPrompt from './components/layout/LocationPrompt.vue'
import { fetchConditions } from './services/weather'

export default {
  name: 'App',
  components: { AppNav, AppFooter, LocationPrompt },
  data() {
    return {
      conditions: null,
      weatherError: null,
      weatherLoading: false,
    }
  },
  computed: {
    ...mapGetters(['userLocation', 'hasLocation']),
  },
  watch: {
    userLocation: {
      deep: true,
      handler() {
        this.loadWeather(true)
      },
    },
  },
  created() {
    if (this.hasLocation) this.loadWeather(false)
  },
  methods: {
    onLocationSet() {
      this.loadWeather(true)
    },
    async loadWeather(force) {
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
        this.weatherError = err?.message || 'Could not load weather'
      } finally {
        this.weatherLoading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.app-shell__main {
  min-height: 60vh;
}
</style>
