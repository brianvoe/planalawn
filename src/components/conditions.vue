<script lang="ts">
import { soilDepthLabel } from '../data/climate'
import { formatTemp, formatUpdated } from '../services/weather'
import { seedingWindowStatus } from '../services/timing'
import type { PropType } from 'vue'
import type { Conditions, UserLocation, WindowStatus } from '../types'

export default {
  name: 'Conditions',
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
    error: { type: String, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['refresh'],
  data() {
    return { soilDepthLabel }
  },
  computed: {
    hasLocation(): boolean {
      return this.$store.getters.hasLocation
    },
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    title(): string {
      return this.userLocation?.label || this.userLocation?.city || 'Local conditions'
    },
    seedStatus(): WindowStatus {
      return seedingWindowStatus(this.conditions?.soilTemp6F)
    },
    statusClass(): string {
      return `tone-${this.seedStatus.tone}`
    },
  },
  methods: { formatTemp, formatUpdated },
}
</script>

<style lang="scss">
.conditions {
  padding: 1.25rem 1.35rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-border);
  border-radius: calc(var(--border-radius) * 2);
  box-shadow: var(--shadow);

  &.tone-good {
    border-top-color: var(--color-success);
  }

  &.tone-caution {
    border-top-color: var(--color-warning);
  }

  &.tone-cold {
    border-top-color: var(--color-info);
  }

  &.tone-hot {
    border-top-color: var(--color-danger);
  }

  .conditions__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .conditions__title {
    margin: 0;
    font-size: 1.2rem;
  }

  .conditions__sub {
    margin: 0.25rem 0 0;
    font-size: 0.88rem;
    color: var(--color-text-muted);
  }

  .conditions__error {
    margin-bottom: 0.85rem;
    padding: 0.65rem 0.8rem;
    font-size: 0.88rem;
    color: var(--color-warning);
    background: var(--color-warning-bg);
    border-radius: var(--border-radius);
  }

  .conditions__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;

    @media (max-width: 559px) {
      grid-template-columns: 1fr;
    }
  }

  .conditions__detail {
    margin: 0.85rem 0 0;
    font-size: 0.9rem;
  }

  .conditions__updated {
    margin: 0.45rem 0 0;
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  .stat {
    display: grid;
    gap: 0.15rem;

    span {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    strong {
      font-family: var(--font-display);
      font-size: clamp(1rem, 2.5vw, 1.35rem);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }

    .stat__status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1rem;
    }
  }
}
</style>

<template>
  <section class="conditions" :class="statusClass">
    <div class="conditions__top">
      <div>
        <h2 class="conditions__title">{{ title }}</h2>
        <p class="conditions__sub">
          Soil at {{ soilDepthLabel }} drives seeding more than the calendar date.
        </p>
      </div>
      <button
        type="button"
        class="btn btn--sm"
        :disabled="loading || !hasLocation"
        @click="$emit('refresh')"
      >
        {{ loading ? 'Updating…' : 'Refresh' }}
      </button>
    </div>

    <div v-if="!hasLocation" class="conditions__error">
      Set your city to load live soil temperature for your lawn.
    </div>
    <div v-else-if="error && !conditions" class="conditions__error">
      {{ error }} — calendar windows still work without live soil temp.
    </div>

    <div class="conditions__grid">
      <div class="stat">
        <span>Soil 6 cm</span>
        <strong>{{ formatTemp(conditions?.soilTemp6F) }}</strong>
      </div>
      <div class="stat">
        <span>Air</span>
        <strong>{{ formatTemp(conditions?.airTempF) }}</strong>
      </div>
      <div class="stat">
        <span>Seeding window</span>
        <strong class="stat__status">
          <span class="status-dot" :class="`status-dot--${seedStatus.tone}`" aria-hidden="true" />
          {{ seedStatus.label }}
        </strong>
      </div>
    </div>
    <p class="conditions__detail">{{ seedStatus.detail }}</p>
    <p v-if="conditions?.fetchedAt" class="conditions__updated">
      Updated {{ formatUpdated(conditions.fetchedAt) }}
      <span v-if="conditions.fromCache"> · cached</span>
    </p>
  </section>
</template>
