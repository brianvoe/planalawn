<script lang="ts">
import LocationSelect from './location-select.vue'
import { requestBrowserLocation } from '../services/geolocation'

/**
 * The two ways to answer "where is your lawn?" — the browser, or a city list —
 * in one row. Shared so the banner on inner pages and the home hero ask the
 * question identically, and a geolocation refusal is handled in one place.
 */
export default {
  name: 'LocationActions',
  components: { LocationSelect },
  data() {
    return { busy: false, error: '' }
  },
  methods: {
    async useGeo() {
      this.busy = true
      this.error = ''
      try {
        const loc = await requestBrowserLocation()
        await this.$store.dispatch('setLocation', loc)
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Could not get location — pick a city instead'
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style lang="scss">
.loc-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.75rem;

  .location-select {
    flex: 1 1 14rem;
    min-width: 13rem;
    max-width: 22rem;
  }

  @media (max-width: 559px) {
    .location-select {
      flex: 1 1 100%;
      min-width: 0;
      max-width: none;
    }
  }

  .loc-actions__err {
    flex: 1 1 100%;
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-danger);
  }
}
</style>

<template>
  <div class="loc-actions">
    <button type="button" class="btn btn--primary" :disabled="busy" @click="useGeo">
      <font-awesome-icon icon="fa-solid fa-location-crosshairs" />
      {{ busy ? 'Locating…' : 'Use my location' }}
    </button>
    <LocationSelect />
    <slot />
    <p v-if="error" class="loc-actions__err">{{ error }}</p>
  </div>
</template>
