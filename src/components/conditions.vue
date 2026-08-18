<script lang="ts">
import { soilDepthLabel } from '../data/climate'
import { formatTemp, formatUpdated } from '../services/weather'
import type { PropType } from 'vue'
import type { Conditions, UserLocation } from '../types'

/**
 * The live reading, and only the reading.
 *
 * It deliberately renders no verdict. What a temperature permits is a per-task
 * judgement — the seeding band means nothing to a mulch job — so the calls live
 * on the task cards and task pages that own them, and this stays the input they
 * are all reading from.
 */
export default {
  name: 'Conditions',
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
    error: { type: String, default: null },
    loading: { type: Boolean, default: false },
    /**
     * A single line instead of a panel, for pages where the reading is an input
     * to what is on screen rather than the subject of it.
     */
    compact: { type: Boolean, default: false },
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
    /** Freshness matters but does not earn a line of its own in the strip. */
    compactTitle(): string {
      if (!this.conditions?.fetchedAt) return `Soil measured at ${soilDepthLabel}.`
      const cached = this.conditions.fromCache ? ' (cached)' : ''
      return `Updated ${formatUpdated(this.conditions.fetchedAt)}${cached}.`
    },
    problem(): string {
      if (!this.hasLocation) return 'Set your city for live soil temperature'
      if (this.error && !this.conditions) return this.error
      return ''
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
  border-radius: calc(var(--border-radius) * 2);
  box-shadow: var(--shadow-md);

  &.conditions--compact {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.8rem;
    box-shadow: var(--shadow-sm);

    .btn {
      flex-shrink: 0;
      margin-left: auto;
    }
  }

  /*
   * What marks the box as the live reading. A rounded shape sits better inside
   * a rounded card than an accent border does, which only ever meets the
   * corner radius at an awkward angle.
   */
  .conditions__badge {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 1.6rem;
    height: 1.6rem;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-radius: 50%;

    svg {
      width: 0.85rem;
      height: 0.85rem;
    }
  }

  .conditions__reading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.1rem 0.7rem;
    min-width: 0;
    margin: 0;
    font-size: 0.82rem;
    color: var(--color-text-muted);

    strong {
      font-size: 0.9rem;
      color: var(--color-text);
    }

    b {
      font-variant-numeric: tabular-nums;
      color: var(--color-text);
    }
  }

  .conditions__problem {
    color: var(--color-warning);
  }

  .conditions__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .conditions__title {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin: 0;
    font-size: 1.2rem;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;

    @media (max-width: 559px) {
      grid-template-columns: 1fr;
    }
  }

  .conditions__updated {
    margin: 0.7rem 0 0;
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
  }
}
</style>

<template>
  <section v-if="compact" class="conditions conditions--compact" :title="compactTitle">
    <span class="conditions__badge">
      <font-awesome-icon icon="fa-solid fa-temperature-half" />
    </span>
    <p class="conditions__reading">
      <strong>{{ title }}</strong>
      <span v-if="problem" class="conditions__problem">{{ problem }}</span>
      <template v-else>
        <span>Soil <b>{{ formatTemp(conditions?.soilTemp6F) }}</b></span>
        <span>Air <b>{{ formatTemp(conditions?.airTempF) }}</b></span>
      </template>
    </p>
    <button
      type="button"
      class="btn btn--sm"
      :disabled="loading || !hasLocation"
      @click="$emit('refresh')"
    >
      {{ loading ? 'Updating…' : 'Refresh' }}
    </button>
  </section>

  <section v-else class="conditions">
    <div class="conditions__top">
      <h2 class="conditions__title">
        <span class="conditions__badge">
          <font-awesome-icon icon="fa-solid fa-temperature-half" />
        </span>
        {{ title }}
      </h2>
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
        <span>Soil {{ soilDepthLabel }}</span>
        <strong>{{ formatTemp(conditions?.soilTemp6F) }}</strong>
      </div>
      <div class="stat">
        <span>Air</span>
        <strong>{{ formatTemp(conditions?.airTempF) }}</strong>
      </div>
    </div>
    <p v-if="conditions?.fetchedAt" class="conditions__updated">
      Updated {{ formatUpdated(conditions.fetchedAt) }}
      <span v-if="conditions.fromCache"> · cached</span>
    </p>
  </section>
</template>
