<script lang="ts">
import { formatTemp, formatUpdated } from '../services/weather'
import type { PropType } from 'vue'
import type { Conditions, UserLocation } from '../types'

export default {
  name: 'SoilTemp',
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
  },
  emits: ['click'],
  computed: {
    location(): UserLocation {
      return this.$store.state.location
    },
    place(): string {
      if (!this.$store.getters.hasLocation) return 'Set location'
      return this.location.city || this.location.label || 'Set location'
    },
    hasTemp(): boolean {
      return typeof this.conditions?.soilTemp6F === 'number'
    },
    tempLabel(): string {
      return formatTemp(this.conditions?.soilTemp6F)
    },
    title(): string {
      if (!this.conditions) return 'Set or change location'
      return `Updated ${formatUpdated(this.conditions.fetchedAt)} — click to change location`
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
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--color-primary-strong);
  background: var(--color-primary-soft);
  border: none;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--color-primary-soft) 70%, var(--color-primary) 12%);
  }

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

<template>
  <button type="button" class="soil-chip" :title="title" @click="$emit('click')">
    <span class="soil-chip__place">{{ place }}</span>
    <template v-if="hasTemp">
      <span class="soil-chip__temp">{{ tempLabel }}</span>
      <span class="soil-chip__meta">soil</span>
    </template>
  </button>
</template>
