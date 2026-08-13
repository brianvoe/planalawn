import * as d3 from 'd3'

// Kept in sync with src/styles/_variables.scss. SCSS cannot be imported into
// D3 render code, so these are the one intentional duplication of the palette;
// change both together.
export const chartColors = {
  ink: '#16241C',
  muted: '#5C6B62',
  grid: '#E5EAE5',
}

/** Categorical series for comparing named blends/cultivars. */
export const seriesColors = ['#1A7A43', '#265F89', '#A55E17', '#6B4C9A', '#9E3229']

/** Sequential 1-9 ramp for NTEP ratings, light to dark. */
export const ratingRamp = [
  '#EEF4EF',
  '#DCEAE0',
  '#C3DCCB',
  '#A3CBB0',
  '#7EB794',
  '#5AA179',
  '#3C8B60',
  '#26744B',
  '#14663A',
]

export const NTEP = { min: 1, max: 9 }

/**
 * Color for an NTEP rating on the 1-9 scale.
 * Returns a neutral gray for missing data so an absent trial value never
 * renders as a poor rating (README design principle 4).
 */
export function ratingColor(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return chartColors.muted
  const clamped = Math.min(NTEP.max, Math.max(NTEP.min, value))
  const index = Math.round(clamped) - NTEP.min
  return ratingRamp[index]
}

/** Series color by index, cycling if there are more series than colors. */
export function seriesColor(index) {
  return seriesColors[index % seriesColors.length]
}

export function clearChart(el) {
  if (el) d3.select(el).selectAll('*').remove()
}

/**
 * Horizontal bar chart — single series, optional per-bar colors.
 * data: [{ label, value, color? }]
 */
export function renderHorizontalBars(el, data, options = {}) {
  clearChart(el)
  const width = el.clientWidth || 640
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
    .call((g) => g.selectAll('text').attr('fill', chartColors.muted).attr('font-size', 11))
    .call((g) => g.selectAll('line,path').attr('stroke', chartColors.grid))

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('text')
        .attr('fill', chartColors.ink)
        .attr('font-size', 12)
        .attr('font-weight', 500),
    )

  // gridlines
  svg
    .append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(''),
    )
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', chartColors.grid))

  svg
    .selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', x(options.min ?? NTEP.min))
    .attr('y', (d) => y(d.label))
    .attr('height', y.bandwidth())
    .attr('width', (d) => Math.max(0, x(d.value) - x(options.min ?? NTEP.min)))
    .attr('fill', (d) => d.color || seriesColors[0])
    .attr('rx', 4)

  svg
    .selectAll('.val')
    .data(data)
    .join('text')
    .attr('class', 'val')
    .attr('x', (d) => x(d.value) + 6)
    .attr('y', (d) => y(d.label) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', chartColors.ink)
    .attr('font-size', 11)
    .attr('font-weight', 600)
    .text((d) => Number(d.value).toFixed(options.digits ?? 1))
}

/**
 * Grouped horizontal bars comparing two named series.
 * rows: [{ label, a, b }]
 */
export function renderGroupedHorizontalBars(el, rows, options = {}) {
  clearChart(el)
  const width = el.clientWidth || 640
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

  const ySub = d3
    .scaleBand()
    .domain([aName, bName])
    .range([0, y.bandwidth()])
    .padding(0.15)

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
    .call((g) => g.selectAll('text').attr('fill', chartColors.muted).attr('font-size', 11))
    .call((g) => g.selectAll('line,path').attr('stroke', chartColors.grid))

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g.selectAll('text').attr('fill', chartColors.ink).attr('font-size', 12).attr('font-weight', 500),
    )

  svg
    .append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(8)
        .tickSize(-(height - margin.top - margin.bottom))
        .tickFormat(''),
    )
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', chartColors.grid))

  const groups = svg
    .selectAll('.row')
    .data(rows)
    .join('g')
    .attr('class', 'row')
    .attr('transform', (d) => `translate(0,${y(d.label)})`)

  const series = [
    { key: 'a', name: aName, color: aColor },
    { key: 'b', name: bName, color: bColor },
  ]

  series.forEach((s) => {
    groups
      .append('rect')
      .attr('x', x(options.min ?? NTEP.min))
      .attr('y', ySub(s.name))
      .attr('height', ySub.bandwidth())
      .attr('width', (d) => Math.max(0, x(d[s.key]) - x(options.min ?? NTEP.min)))
      .attr('fill', s.color)
      .attr('rx', 3)

    groups
      .append('text')
      .attr('x', (d) => x(d[s.key]) + 6)
      .attr('y', ySub(s.name) + ySub.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', chartColors.ink)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .text((d) => Number(d[s.key]).toFixed(2))
  })
}
