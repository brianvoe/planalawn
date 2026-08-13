<template>
  <div class="soil-chip" :title="title">
    <span class="soil-chip__place">{{ place }}</span>
    <span class="soil-chip__temp">{{ tempLabel }}</span>
    <span class="soil-chip__meta">soil 6 cm</span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatTemp, formatUpdated } from '../../services/weather'

export default {
  name: 'SoilTempChip',
  props: {
    conditions: { type: Object, default: null },
  },
  computed: {
    ...mapGetters(['userLocation']),
    place() {
      return this.userLocation?.city || this.userLocation?.label || 'No location'
    },
    tempLabel() {
      return formatTemp(this.conditions?.soilTemp6F)
    },
    title() {
      if (!this.conditions) return 'Set location to load soil temperature'
      return `Updated ${formatUpdated(this.conditions.fetchedAt)}`
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.soil-chip {
  @include label-badge;
  background: $brand-soft;
  color: $brand-strong;
  gap: 0.45rem;
  margin-left: auto;
  max-width: 16rem;

  &__place {
    opacity: 0.85;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 7rem;
  }

  &__temp {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  &__meta {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.75;
  }
}
</style>
