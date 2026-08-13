<template>
  <div class="soil-chip" :title="title">
    <span class="soil-chip__place">{{ place }}</span>
    <span class="soil-chip__temp">{{ tempLabel }}</span>
    <span class="soil-chip__meta">soil 6 cm</span>
  </div>
</template>

<script lang="ts">
import { formatTemp, formatUpdated } from '../../services/weather'
import type { PropType } from 'vue'
import type { Conditions, UserLocation } from '../../types'

export default {
  name: 'SoilTempChip',
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
  },
  computed: {
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    place(): string {
      return this.userLocation?.city || this.userLocation?.label || 'No location'
    },
    tempLabel(): string {
      return formatTemp(this.conditions?.soilTemp6F)
    },
    title(): string {
      if (!this.conditions) return 'Set location to load soil temperature'
      return `Updated ${formatUpdated(this.conditions.fetchedAt)}`
    },
  },
}
</script>

<style lang="scss">
.soil-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: 16rem;
  margin-left: auto;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--color-primary-strong);
  background: var(--color-primary-soft);
  border-radius: 999px;

  .soil-chip__place {
    max-width: 7rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.85;
  }

  .soil-chip__temp {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .soil-chip__meta {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.75;
  }
}
</style>
