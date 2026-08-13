<script lang="ts">
import Modal from './modal.vue'
import LocationSelect from './location-select.vue'
import { climateBands, zoneLine } from '../data/climate'
import { requestBrowserLocation } from '../services/geolocation'
import { formatTemp, formatUpdated } from '../services/weather'
import type { PropType } from 'vue'
import type { Conditions, UserLocation } from '../types'

export default {
  name: 'LocationModal',
  components: { Modal, LocationSelect },
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
  },
  data() {
    return { busy: false, error: '' }
  },
  computed: {
    location(): UserLocation {
      return this.$store.state.location
    },
    place(): string {
      return this.location.label || this.location.city || ''
    },
    zoneLabel(): string {
      return this.$store.getters.hasLocation ? zoneLine(this.location) : ''
    },
    climateSummary(): string {
      const id = this.location.climateBand
      return id ? climateBands[id].summary : ''
    },
    tempLabel(): string {
      return formatTemp(this.conditions?.soilTemp6F)
    },
    updated(): string {
      if (!this.conditions?.fetchedAt) return ''
      return `updated ${formatUpdated(this.conditions.fetchedAt)}`
    },
  },
  methods: {
    open() {
      this.error = ''
      ;(this.$refs.modal as InstanceType<typeof Modal> | undefined)?.open()
    },
    close() {
      ;(this.$refs.modal as InstanceType<typeof Modal> | undefined)?.close()
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
.location-modal {
  display: grid;
  gap: var(--spacing-half);

  .location-modal__current {
    margin: 0;
    font-size: 1.05rem;
  }

  .location-modal__summary,
  .location-modal__soil {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .location-modal__field {
    display: grid;
    gap: 0.35rem;
    margin-top: var(--spacing-half);

    > span {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
  }

  .location-modal__err {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-danger);
  }
}
</style>

<template>
  <Teleport to="body">
    <Modal ref="modal" class="modal--narrow">
      <template #header>Your lawn location</template>
      <template #body>
        <div class="location-modal">
          <p v-if="place" class="location-modal__current">
            <strong>{{ place }}</strong>
            <span v-if="zoneLabel"> · {{ zoneLabel }}</span>
          </p>
          <p v-if="climateSummary" class="location-modal__summary">{{ climateSummary }}</p>
          <p class="location-modal__soil">
            Soil 6 cm: <strong>{{ tempLabel }}</strong>
            <span v-if="updated"> · {{ updated }}</span>
          </p>

          <label class="location-modal__field">
            <span>City</span>
            <LocationSelect />
          </label>

          <button type="button" class="btn" :disabled="busy" @click="useGeo">
            {{ busy ? 'Locating…' : 'Use my location' }}
          </button>
          <p v-if="error" class="location-modal__err">{{ error }}</p>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn--primary" @click="close">Done</button>
      </template>
    </Modal>
  </Teleport>
</template>
