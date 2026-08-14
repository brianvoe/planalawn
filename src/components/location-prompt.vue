<script lang="ts">
import LocationSelect from './location-select.vue'
import { requestBrowserLocation } from '../services/geolocation'
import type { UserLocation } from '../types'

export default {
  name: 'LocationPrompt',
  components: { LocationSelect },
  data() {
    return { busy: false, error: '' }
  },
  computed: {
    location(): UserLocation {
      return this.$store.state.location
    },
    hasLocation(): boolean {
      return this.$store.getters.hasLocation
    },
    show(): boolean {
      return !this.hasLocation && !this.location.promptDismissed
    },
  },
  methods: {
    dismiss() {
      this.$store.dispatch('dismissLocationPrompt')
    },
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
.loc-prompt {
  background: var(--color-primary-soft);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);

  .loc-prompt__inner {
    display: grid;
    gap: 0.85rem;
    padding: 1rem 0;

    h2 {
      margin: 0 0 0.25rem;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      max-width: 40rem;
      font-size: 0.92rem;
      color: var(--color-text-muted);
    }
  }

  .loc-prompt__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem 0.75rem;

    .location-select {
      min-width: 16rem;
    }
  }

  .or {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .linkish {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
  }

  .err {
    font-size: 0.85rem !important;
    color: var(--color-danger) !important;
  }
}
</style>

<template>
  <section v-if="show" class="loc-prompt">
    <div class="loc-prompt__inner container">
      <div>
        <h2>Where’s your lawn?</h2>
        <p>
          We’ll snap you to the nearest big city for soil temperature, timing, and seed scores.
          Location stays in this browser only.
        </p>
      </div>

      <div class="loc-prompt__actions">
        <button type="button" class="btn btn--primary" :disabled="busy" @click="useGeo">
          {{ busy ? 'Locating…' : 'Use my location' }}
        </button>
        <span class="or">or pick a city</span>
        <LocationSelect />
        <button type="button" class="linkish" @click="dismiss">Not now</button>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </section>
</template>
