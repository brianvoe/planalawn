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

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'LawnSizeInput',
  emits: ['updated'],
  computed: {
    ...mapGetters(['lawnSqFt']),
  },
  methods: {
    onChange(e) {
      const lawnSqFt = Math.max(100, Number(e.target.value) || 5000)
      this.$store.dispatch('updateProfile', { lawnSqFt })
      this.$emit('updated', { lawnSqFt })
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.lawn-size {
  display: inline-flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  // Custom property rather than a fixed color so an inverted band can retint
  // the label without having to out-specify this scoped rule.
  color: var(--label-ink, #{$color-ink-muted});

  input {
    @include tap-target;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;
    min-width: 8rem;
    font-variant-numeric: tabular-nums;
    color: $color-ink;
    background: $color-surface;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
  }
}
</style>
