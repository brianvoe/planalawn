/**
 * Prints the blade outlines for the mark in public/favicon.svg.
 *
 * The paths there are polygons of thirty-odd points, which is not something
 * anyone can edit by hand. This is where they come from: tweak a blade below,
 * run `npm run favicon:blades`, and paste the output over the <path> elements
 * inside the blade <g>. Nothing reads this at build time — the SVG is the
 * committed artefact, and this only exists so the artefact stays changeable.
 *
 * Each blade is a quadratic centreline offset either side by a width profile.
 * The profile holds most of the width up the shaft and closes only near the
 * tip. That matters more the thinner the blades get: a plain taper from base
 * to point spends all its width at the bottom, where the soil covers it, and
 * leaves a hairline everywhere you actually look.
 */

/** Where the blades stand. Below the ground line, which is painted over them. */
const BASE_Y = 58

/** Points sampled along each edge. Enough to look smooth at the sizes we use. */
const STEPS = 11

/**
 * A dozen thin blades rather than a few fat ones: a lawn looks thick because
 * it is dense, so thickening the individual blades gets you a yucca instead.
 *
 * Uneven heights with the tallest off centre, and the bend alternating side to
 * side — even heights read as a comb, and a symmetric fan reads as an agave.
 * The spacing is a little irregular on purpose too.
 */
const BLADES = [
  // The row that makes the skyline.
  { bx: 5, tip: [3, 29], ctrl: [9, 45], hw: 1.7 },
  { bx: 10, tip: [14, 21], ctrl: [7, 41], hw: 1.9 },
  { bx: 15, tip: [11, 14], ctrl: [19, 37], hw: 1.8 },
  { bx: 19, tip: [22, 25], ctrl: [16, 43], hw: 1.7 },
  { bx: 24, tip: [21, 8], ctrl: [28, 34], hw: 2.0 },
  { bx: 29, tip: [33, 18], ctrl: [25, 39], hw: 1.9 },
  { bx: 34, tip: [32, 12], ctrl: [38, 35], hw: 1.9 },
  { bx: 39, tip: [43, 22], ctrl: [35, 41], hw: 1.8 },
  { bx: 43, tip: [40, 13], ctrl: [47, 36], hw: 1.9 },
  { bx: 48, tip: [51, 26], ctrl: [45, 43], hw: 1.7 },
  { bx: 53, tip: [50, 16], ctrl: [57, 38], hw: 1.8 },
  { bx: 58, tip: [60, 27], ctrl: [55, 44], hw: 1.7 },

  // A shorter row in the gaps. Same colour, so low down they close into one
  // mass the way a stand of turf does, while the skyline above stays open.
  { bx: 7.5, tip: [5.5, 33], ctrl: [10, 47], hw: 1.6 },
  { bx: 17, tip: [19, 29], ctrl: [14.5, 44], hw: 1.6 },
  { bx: 26.5, tip: [29, 27], ctrl: [24, 43], hw: 1.6 },
  { bx: 31.5, tip: [29.5, 32], ctrl: [34, 46], hw: 1.5 },
  { bx: 41, tip: [39, 30], ctrl: [43.5, 45], hw: 1.6 },
  { bx: 50.5, tip: [53, 28], ctrl: [48, 44], hw: 1.6 },
  { bx: 55.5, tip: [54, 33], ctrl: [58, 47], hw: 1.5 },
]

function pointAt(p0, p1, p2, t) {
  const u = 1 - t
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ]
}

function tangentAt(p0, p1, p2, t) {
  const x = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const y = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  const length = Math.hypot(x, y) || 1
  return [x / length, y / length]
}

/** Full at the ground, still about 70% at mid height, nothing at the tip. */
function widthAt(hw, t) {
  return hw * Math.pow(1 - t, 0.55)
}

function outline({ bx, tip, ctrl, hw }) {
  const base = [bx, BASE_Y]
  const left = []
  const right = []

  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    const [x, y] = pointAt(base, ctrl, tip, t)
    const [tx, ty] = tangentAt(base, ctrl, tip, t)
    const w = widthAt(hw, t)
    left.push([x + ty * w, y - tx * w])
    right.push([x - ty * w, y + tx * w])
  }

  // Up one edge and back down the other. The tips coincide, so one is dropped.
  return [...left, ...right.reverse().slice(1)]
    .map(([x, y]) => `${Number(x.toFixed(1))} ${Number(y.toFixed(1))}`)
    .join('L')
}

for (const blade of BLADES) {
  console.log(`<path d="M${outline(blade)}Z" />`)
}
