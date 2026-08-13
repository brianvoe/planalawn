<template>
  <div class="d3-chart">
    <div ref="chart" class="d3-chart__el" />
  </div>
</template>

<script lang="ts">
import { renderHorizontalBars, renderGroupedHorizontalBars } from '../../charts/bars'
import type { PropType } from 'vue'
import type { BarDatum, ChartOptions, GroupedBarRow } from '../../types'

export default {
  name: 'D3BarChart',
  props: {
    type: { type: String, default: 'horizontal' },
    data: { type: Array as PropType<BarDatum[] | GroupedBarRow[]>, required: true },
    options: { type: Object as PropType<ChartOptions>, default: () => ({}) },
  },
  data() {
    return {
      ro: null as ResizeObserver | null,
    }
  },
  mounted() {
    this.draw()
    this.ro = new ResizeObserver(() => this.draw())
    this.ro.observe(this.$refs.chart as Element)
  },
  updated() {
    this.draw()
  },
  beforeUnmount() {
    this.ro?.disconnect()
  },
  methods: {
    draw() {
      const el = this.$refs.chart as Element | undefined
      if (!el) return
      if (this.type === 'grouped') {
        renderGroupedHorizontalBars(el, this.data as GroupedBarRow[], this.options)
      } else {
        renderHorizontalBars(el, this.data as BarDatum[], this.options)
      }
    },
  },
}
</script>

<style lang="scss">
.d3-chart {
  .d3-chart__el {
    width: 100%;
    overflow: hidden;
  }
}
</style>
