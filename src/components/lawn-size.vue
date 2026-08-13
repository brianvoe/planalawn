<template>
  <label class="lawn-size">
    <span>Lawn area (sq ft)</span>
    <input
      type="number"
      min="100"
      step="100"
      :value="lawnSqFt"
      @change="onChange"
    />
  </label>
</template>

<script lang="ts">
export default {
  name: 'LawnSize',
  emits: ['updated'],
  computed: {
    lawnSqFt(): number {
      return this.$store.getters.lawnSqFt
    },
  },
  methods: {
    onChange(e: Event) {
      const value = Number((e.target as HTMLInputElement).value)
      const lawnSqFt = Math.max(100, value || 5000)
      this.$store.dispatch('updateProfile', { lawnSqFt })
      this.$emit('updated', { lawnSqFt })
    },
  },
}
</script>

<style lang="scss">
.lawn-size {
  display: inline-flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--label-ink, var(--color-text-muted));

  input {
    min-width: 8rem;
    min-height: var(--input-height);
    padding: 0.45rem 0.65rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-color: var(--color-primary);
    }
  }
}
</style>
