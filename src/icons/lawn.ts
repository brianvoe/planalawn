import type { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core'

/**
 * Icons Font Awesome doesn't have.
 *
 * A lawn site needs to draw grass, seed and granules, and the free set offers a
 * house-plant seedling for all three. These are drawn on Font Awesome's own
 * 512-unit grid so they inherit the same optical size, weight and colour as the
 * icons around them, and they register under a `lawn` prefix so usage stays
 * `<font-awesome-icon :icon="['lawn', 'grass']" />`.
 *
 * Drawing notes, since these are hand-built:
 *
 * - A blade is two quadratics sharing one control point: wide at the base,
 *   tapering to a point. That reads as grass at 16px, where anything with an
 *   outline turns to mush.
 * - A seed is an ellipse with a bitten-off point, built from arcs so the
 *   rotation is baked into the coordinates (a path can't carry a transform).
 * - Holes are subpaths wound the other way, which nonzero fill knocks out.
 */

/** Grass blade: base centre, half-width at the base, tip, and one control point. */
function blade(
  baseX: number,
  halfWidth: number,
  tipX: number,
  tipY: number,
  ctrlX: number,
  ctrlY: number,
  baseY = 486,
): string {
  return [
    `M${baseX - halfWidth} ${baseY}`,
    `Q${ctrlX} ${ctrlY} ${tipX} ${tipY}`,
    `Q${ctrlX} ${ctrlY} ${baseX + halfWidth} ${baseY}`,
    'Z',
  ].join('')
}

/**
 * A grass seed: round at the base, tapering to a point, tilted `deg` about
 * (cx, cy). An ellipse would do the job in one arc but reads as a bean; the
 * point is what makes it a seed. `reverse` winds it backwards to cut a hole.
 */
function grain(
  cx: number,
  cy: number,
  length: number,
  width: number,
  deg: number,
  reverse = false,
): string {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const l = length / 2
  const w = width / 2

  // Upper edge in local coordinates: round base, two cubics, point at the tip.
  type Pt = [number, number]
  const upper: Pt[] = [
    [-l, 0],
    [-l, -w * 1.05],
    [-l * 0.35, -w],
    [l * 0.3, -w * 0.72],
    [l * 0.62, -w * 0.5],
    [l * 0.9, -w * 0.2],
    [l, 0],
  ]
  // Lower edge is the same curve mirrored, walked back to where we started.
  const lower: Pt[] = [...upper]
    .reverse()
    .slice(1)
    .map(([x, y]): Pt => [x, -y])
  const points = reverse ? [...upper, ...lower].reverse() : [...upper, ...lower]

  const at = ([x, y]: Pt) => {
    const n = (v: number) => Math.round(v * 10) / 10
    return `${n(cx + x * cos - y * sin)} ${n(cy + x * sin + y * cos)}`
  }

  let d = `M${at(points[0])}`
  for (let i = 1; i + 2 < points.length; i += 3) {
    d += `C${at(points[i])} ${at(points[i + 1])} ${at(points[i + 2])}`
  }
  return `${d}Z`
}

/** A dot, for scattered granules. `sweep` 0 cuts a hole instead. */
function dot(cx: number, cy: number, r: number, sweep: 0 | 1 = 1): string {
  return `M${cx - r} ${cy}A${r} ${r} 0 0 ${sweep} ${cx + r} ${cy}A${r} ${r} 0 0 ${sweep} ${cx - r} ${cy}Z`
}

function icon(name: string, width: number, path: string): IconDefinition {
  return {
    prefix: 'lawn' as IconPrefix,
    iconName: name as IconName,
    icon: [width, 512, [], '', path],
  }
}

/**
 * Six blades rising off the bottom edge, for anything that means turf: a named
 * cultivar, a grass restriction on a label, the species of a bag.
 *
 * Three things keep this grass rather than a houseplant. The blades start along
 * a baseline instead of converging on one point, which is the difference between
 * turf and an agave. Their heights are uneven and deliberately not symmetric.
 * And each one arches, with the bulge alternating side to side — straight blades
 * of even height read as a comb.
 */
export const faGrass = icon(
  'grass',
  512,
  [
    blade(52, 36, 22, 212, 100, 386, 512),
    blade(140, 40, 184, 82, 96, 292, 512),
    blade(228, 38, 196, 138, 280, 320, 512),
    blade(310, 42, 338, 22, 262, 250, 512),
    blade(396, 38, 366, 110, 446, 300, 512),
    blade(470, 34, 498, 196, 430, 372, 512),
  ].join(''),
)

/**
 * Three grains falling in parallel, the way seed pours out of a bag.
 *
 * They have to run the same direction. Two up top and one below reads as a
 * face, and a cluster at three different angles reads as coffee beans.
 */
export const faSeed = icon(
  'seed',
  512,
  [
    grain(192, 123, 210, 112, -35),
    grain(256, 256, 210, 112, -35),
    grain(320, 389, 210, 112, -35),
  ].join(''),
)

/**
 * A sack with a grain knocked out of it — the bag on the shelf, not the plant.
 *
 * The folded, tied top is what makes a lumpy shape read as a sack rather than a
 * bucket, so it keeps its full width even though it costs a few units of height.
 */
export const faSeedBag = icon(
  'seed-bag',
  448,
  [
    // Tied top: two folds pinched into a neck.
    'M126 12C126 5 131 0 138 0h172c7 0 12 5 12 12 0 3-1 5-2 8l-34 66H162l-34-66c-1-3-2-5-2-8Z',
    // Body: shoulders out from the neck, then a wide rounded sack.
    'M154 122h140l44 38c66 56 110 138 110 226 0 70-57 126-127 126H127C57 512 0 456 0 386c0-88 44-170 110-226Z',
    // Knocked-out grain, so the sack says seed without a label.
    grain(224, 348, 210, 96, -30, true),
  ].join(''),
)

/**
 * Granules leaving a spreader: a scatter that widens as it falls.
 *
 * The granular counterpart to a spray can, replacing the seedling that used to
 * stand in for every bag of anything.
 */
export const faGranules = icon(
  'granules',
  512,
  [
    dot(256, 58, 54),
    dot(126, 220, 52),
    dot(386, 220, 52),
    dot(44, 400, 44),
    dot(256, 386, 56),
    dot(468, 400, 44),
  ].join(''),
)

export const lawnIcons = [faGrass, faSeed, faSeedBag, faGranules]
