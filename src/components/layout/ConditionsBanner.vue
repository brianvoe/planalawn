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
      Set your location (ZIP or GPS) to load live soil temperature for your lawn.
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

<script>
import { mapGetters } from 'vuex'
import { soilDepthLabel } from '../../data/climate'
import { formatTemp, formatUpdated } from '../../services/weather'
import { seedingWindowStatus } from '../../services/timing'

export default {
  name: 'ConditionsBanner',
  props: {
    conditions: { type: Object, default: null },
    error: { type: String, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['refresh'],
  data() {
    return { soilDepthLabel }
  },
  computed: {
    ...mapGetters(['hasLocation', 'userLocation']),
    title() {
      return this.userLocation?.label || this.userLocation?.city || 'Local conditions'
    },
    seedStatus() {
      return seedingWindowStatus(this.conditions?.soilTemp6F)
    },
    statusClass() {
      return `tone-${this.seedStatus.tone}`
    },
  },
  methods: { formatTemp, formatUpdated },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.conditions {
  @include card;
  padding: 1.25rem 1.35rem;
  border-top: 3px solid $color-border;

  &.tone-good {
    border-top-color: $status-good;
  }

  &.tone-caution {
    border-top-color: $status-caution;
  }

  &.tone-cold {
    border-top-color: $status-cold;
  }

  &.tone-hot {
    border-top-color: $status-hot;
  }

  &__top {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  &__title {
    margin: 0;
    font-size: 1.2rem;
  }

  &__sub {
    margin: 0.25rem 0 0;
    font-size: 0.88rem;
    color: $color-ink-muted;
  }

  &__error {
    background: $status-caution-soft;
    color: $status-caution;
    padding: 0.65rem 0.8rem;
    border-radius: $radius-sm;
    font-size: 0.88rem;
    margin-bottom: 0.85rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  &__detail {
    margin: 0.85rem 0 0;
    font-size: 0.9rem;
  }

  &__updated {
    margin: 0.45rem 0 0;
    font-size: 0.78rem;
    color: $color-ink-muted;
  }
}

.stat {
  display: grid;
  gap: 0.15rem;

  span {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $color-ink-muted;
    font-weight: 600;
  }

  strong {
    font-family: $font-display;
    font-size: clamp(1rem, 2.5vw, 1.35rem);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1rem;
  }
}

@media (max-width: 560px) {
  .conditions__grid {
    grid-template-columns: 1fr;
  }
}
</style>
