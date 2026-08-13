<template>
  <section v-if="show" class="loc-prompt">
    <div class="loc-prompt__inner container">
      <div>
        <h2>Where’s your lawn?</h2>
        <p>
          We’ll use your location for soil temperature, timing, and NTEP suitability.
          Location stays in this browser only.
        </p>
      </div>

      <div class="loc-prompt__actions">
        <button type="button" class="btn btn--primary" :disabled="Boolean(busy)" @click="useGeo">
          {{ busy === 'geo' ? 'Locating…' : 'Use my location' }}
        </button>
        <span class="or">or</span>
        <form class="zip-form" @submit.prevent="useZip">
          <input v-model="zip" type="text" inputmode="numeric" maxlength="5" placeholder="ZIP code" />
          <button type="submit" class="btn" :disabled="Boolean(busy)">{{ busy === 'zip' ? '…' : 'Set' }}</button>
        </form>
        <button type="button" class="linkish" @click="dismiss">Not now</button>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </section>
</template>

<script lang="ts">
import { lookupZip, requestBrowserLocation } from '../services/geolocation'
import type { UserLocation } from '../types'

export default {
  name: 'LocationPrompt',
  emits: ['location-set'],
  data() {
    return { zip: '', busy: null as null | 'geo' | 'zip', error: '' }
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
      this.busy = 'geo'
      this.error = ''
      try {
        const loc = await requestBrowserLocation()
        await this.$store.dispatch('setLocation', loc)
        this.$emit('location-set')
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Could not get location — try ZIP instead'
      } finally {
        this.busy = null
      }
    },
    async useZip() {
      this.busy = 'zip'
      this.error = ''
      try {
        const loc = await lookupZip(this.zip)
        await this.$store.dispatch('setLocation', loc)
        this.$emit('location-set')
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'ZIP lookup failed'
      } finally {
        this.busy = null
      }
    },
  },
}
</script>

<style lang="scss">
.loc-prompt {
  background: var(--color-primary-soft);
  border-bottom: 1px solid var(--color-border);

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
  }

  .zip-form {
    display: inline-flex;
    gap: 0.35rem;

    input {
      width: 6.5rem;
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
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
