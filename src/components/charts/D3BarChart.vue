<template>
  <div class="d3-chart">
    <div ref="chart" class="d3-chart__el" />
  </div>
</template>

<script>
import { renderHorizontalBars, renderGroupedHorizontalBars } from '../../charts/bars'

export default {
  name: 'D3BarChart',
  props: {
    type: { type: String, default: 'horizontal' }, // horizontal | grouped
    data: { type: Array, required: true },
    options: { type: Object, default: () => ({}) },
  },
  mounted() {
    this.draw()
    this._ro = new ResizeObserver(() => this.draw())
    this._ro.observe(this.$refs.chart)
  },
  updated() {
    this.draw()
  },
  beforeUnmount() {
    this._ro?.disconnect()
  },
  methods: {
    draw() {
      const el = this.$refs.chart
      if (!el) return
      if (this.type === 'grouped') {
        renderGroupedHorizontalBars(el, this.data, this.options)
      } else {
        renderHorizontalBars(el, this.data, this.options)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.d3-chart__el {
  width: 100%;
  overflow: hidden;
}
</style>
