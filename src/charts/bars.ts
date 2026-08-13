import * as d3 from 'd3'
import { cssVar } from '../assets/css-var'
import type { BarDatum, ChartOptions, GroupedBarRow } from '../types'

function token(name: `--${string}`, fallback: string): string {
  return cssVar(name, fallback)
}

function palette() {
  return {
    ink: token('--color-text', '#16241c'),
    muted: token('--color-text-muted', '#5c6b62'),
    grid: token('--color-border', '#dce3dc'),
    series: [
      token('--color-primary', '#1a7a43'),
      token('--color-info', '#265f89'),
      token('--color-accent', '#a55e17'),
      '#6b4c9a',
      token('--color-danger', '#9e3229'),
    ],
    ramp: ['#eef4ef', '#dceae0', '#c3dccb', '#a3cbb0', '#7eb794', '#5aa179', '#3c8b60', '#26744b', '#14663a'],
  }
}

export const NTEP = { min: 1, max: 9 }

/**
 * Color for an NTEP rating on the 1-9 scale.
 * Returns a neutral gray for missing data so an absent trial value never
 * renders as a poor rating (README design principle 4).
 */
export function ratingColor(value: number | null | undefined): string {
  const { muted, ramp } = palette()
  if (typeof value !== 'number' || Number.isNaN(value)) return muted
  const clamped = Math.min(NTEP.max, Math.max(NTEP.min, value))
  const index = Math.round(clamped) - NTEP.min
  return ramp[index]
}

/** Series color by index, cycling if there are more series than colors. */
export function seriesColor(index: number): string {
  const { series } = palette()
  return series[index % series.length]
}

export function clearChart(el: Element | null | undefined): void {
  if (el) d3.select(el).selectAll('*').remove()
}

function band(scale: d3.ScaleBand<string>, key: string): number {
  return scale(key) ?? 0
}

/**
 * Horizontal bar chart — single series, optional per-bar colors.
 */
export function renderHorizontalBars(
  el: Element,
  data: BarDatum[],
  options: ChartOptions = {},
): void {
  clearChart(el)
  const { ink, muted, grid, series } = palette()
  const width = (el as HTMLElement).clientWidth || 640
  const rowH = options.rowHeight || 36
  const margin = { top: 8, right: 48, bottom: 28, left: options.leftMargin || 130 }
  const height = margin.top + margin.bottom + data.length * rowH

  const svg = d3
    .select(el)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')

  const x = d3
    .scaleLinear()
    .domain([options.min ?? NTEP.min, options.max ?? NTEP.max])
    .range([margin.left, width - margin.right])

  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.25)

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
    .call((g) => g.selectAll('text').attr('fill', muted).attr('font-size', 11))
    .call((g) => g.selectAll('line,path').attr('stroke', grid))

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g.selectAll('text').attr('fill', ink).attr('font-size', 12).attr('font-weight', 500),
    )

  svg
    .append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(() => ''),
    )
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', grid))

  svg
    .selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', x(options.min ?? NTEP.min))
    .attr('y', (d) => band(y, d.label))
    .attr('height', y.bandwidth())
    .attr('width', (d) => Math.max(0, x(d.value) - x(options.min ?? NTEP.min)))
    .attr('fill', (d) => d.color || series[0])
    .attr('rx', 4)

  svg
    .selectAll('.val')
    .data(data)
    .join('text')
    .attr('class', 'val')
    .attr('x', (d) => x(d.value) + 6)
    .attr('y', (d) => band(y, d.label) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', ink)
    .attr('font-size', 11)
    .attr('font-weight', 600)
    .text((d) => Number(d.value).toFixed(options.digits ?? 1))
}

/**
 * Grouped horizontal bars comparing two named series.
 */
export function renderGroupedHorizontalBars(
  el: Element,
  rows: GroupedBarRow[],
  options: ChartOptions = {},
): void {
  clearChart(el)
  const { ink, muted, grid, series: seriesColors } = palette()
  const width = (el as HTMLElement).clientWidth || 640
  const rowH = options.rowHeight || 48
  const margin = { top: 8, right: 48, bottom: 28, left: options.leftMargin || 160 }
  const height = margin.top + margin.bottom + rows.length * rowH
  const aName = options.aName || 'Series A'
  const bName = options.bName || 'Series B'
  const aColor = options.aColor || seriesColors[0]
  const bColor = options.bColor || seriesColors[1]

  const svg = d3
    .select(el)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const x = d3
    .scaleLinear()
    .domain([options.min ?? NTEP.min, options.max ?? NTEP.max])
    .range([margin.left, width - margin.right])

  const y = d3
    .scaleBand()
    .domain(rows.map((d) => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.2)

  const ySub = d3.scaleBand().domain([aName, bName]).range([0, y.bandwidth()]).padding(0.15)

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
    .call((g) => g.selectAll('text').attr('fill', muted).attr('font-size', 11))
    .call((g) => g.selectAll('line,path').attr('stroke', grid))

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g.selectAll('text').attr('fill', ink).attr('font-size', 12).attr('font-weight', 500),
    )

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(() => ''),
    )
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', grid))

  const groups = svg
    .selectAll('.row')
    .data(rows)
    .join('g')
    .attr('class', 'row')
    .attr('transform', (d) => `translate(0,${band(y, d.label)})`)

  const series = [
    { key: 'a' as const, name: aName, color: aColor },
    { key: 'b' as const, name: bName, color: bColor },
  ]

  series.forEach((s) => {
    groups
      .append('rect')
      .attr('x', x(options.min ?? NTEP.min))
      .attr('y', band(ySub, s.name))
      .attr('height', ySub.bandwidth())
      .attr('width', (d) => Math.max(0, x(d[s.key]) - x(options.min ?? NTEP.min)))
      .attr('fill', s.color)
      .attr('rx', 3)

    groups
      .append('text')
      .attr('x', (d) => x(d[s.key]) + 6)
      .attr('y', band(ySub, s.name) + ySub.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', ink)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .text((d) => Number(d[s.key]).toFixed(2))
  })
}
