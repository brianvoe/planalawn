<template>
  <section v-if="show" class="loc-prompt">
    <div class="loc-prompt__inner">
      <div>
        <h2>Where’s your lawn?</h2>
        <p>
          We’ll use your location for soil temperature, timing, and NTEP suitability.
          Location stays in this browser only.
        </p>
      </div>

      <div class="loc-prompt__actions">
        <button type="button" class="btn btn--primary" :disabled="busy" @click="useGeo">
          {{ busy === 'geo' ? 'Locating…' : 'Use my location' }}
        </button>
        <span class="or">or</span>
        <form class="zip-form" @submit.prevent="useZip">
          <input v-model="zip" type="text" inputmode="numeric" maxlength="5" placeholder="ZIP code" />
          <button type="submit" class="btn" :disabled="busy">{{ busy === 'zip' ? '…' : 'Set' }}</button>
        </form>
        <button type="button" class="linkish" @click="dismiss">Not now</button>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </section>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { lookupZip, requestBrowserLocation } from '../../services/geolocation'

export default {
  name: 'LocationPrompt',
  emits: ['location-set'],
  data() {
    return { zip: '', busy: null, error: '' }
  },
  computed: {
    ...mapState(['location']),
    ...mapGetters(['hasLocation']),
    show() {
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
        this.error = e.message || 'Could not get location — try ZIP instead'
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
        this.error = e.message || 'ZIP lookup failed'
      } finally {
        this.busy = null
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.loc-prompt {
  border-bottom: 1px solid $color-border-soft;
  background: $brand-soft;

  &__inner {
    @include container;
    padding: 1rem 0;
    display: grid;
    gap: 0.85rem;

    h2 {
      margin: 0 0 0.25rem;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      color: $color-ink-muted;
      font-size: 0.92rem;
      max-width: 40rem;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem 0.75rem;
  }
}

.zip-form {
  display: inline-flex;
  gap: 0.35rem;

  input {
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;
    width: 6.5rem;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
  }
}

.or {
  color: $color-ink-muted;
  font-size: 0.8rem;
}

.linkish {
  border: none;
  background: none;
  color: $color-ink-muted;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.85rem;
}

.err {
  color: $status-hot !important;
  font-size: 0.85rem !important;
}
</style>
