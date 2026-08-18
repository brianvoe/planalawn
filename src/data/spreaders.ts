import type { Spreader } from '../types'

/**
 * The spreader columns product labels actually print.
 *
 * Scotts groups most of its rotary line into one "Broadcast/Rotary" column on
 * the label — EdgeGuard DLX and Mini share a number — and prints Elite, the
 * drop spreaders and the hand-helds separately. These entries mirror those
 * columns, because anything finer would be invented.
 *
 * Swath is a rough starting figure for a calibration strip, not a spec: throw
 * width changes with the granule, the setting and how fast you walk.
 */
export const spreaders: Spreader[] = [
  {
    id: 'scotts-rotary',
    name: 'Scotts broadcast / rotary',
    brand: 'Scotts',
    type: 'rotary',
    models: 'EdgeGuard DLX & Mini, most push models',
    swathFt: 5,
  },
  {
    id: 'scotts-elite',
    name: 'Scotts Elite',
    brand: 'Scotts',
    type: 'rotary',
    models: 'The wide-deck, two-wheel-drive one',
    swathFt: 6,
  },
  {
    id: 'scotts-drop',
    name: 'Scotts drop',
    brand: 'Scotts',
    type: 'drop',
    models: 'Turf Builder Classic, AccuGreen',
    swathFt: 1.75,
  },
  {
    id: 'scotts-wizz',
    name: 'Scotts Wizz',
    brand: 'Scotts',
    type: 'handheld',
    models: 'Battery hand-held',
    swathFt: 4,
  },
  {
    id: 'scotts-whirl',
    name: 'Scotts Whirl',
    brand: 'Scotts',
    type: 'handheld',
    models: 'Hand-crank hand-held',
    swathFt: 4,
  },
  {
    id: 'lesco-rotary',
    name: 'Lesco rotary',
    brand: 'Lesco / SiteOne',
    type: 'rotary',
    models: 'Green 80 lb walk-behind',
    swathFt: 8,
  },
  {
    id: 'earthway',
    name: 'Earthway EV-N-Spred',
    brand: 'Earthway',
    type: 'rotary',
    models: '2050P, 2150, most EV-N-Spred',
    swathFt: 8,
  },
  {
    id: 'republic-ez',
    name: 'Republic EZ',
    brand: 'Republic',
    type: 'rotary',
    models: 'EZ, EZ Grow',
    swathFt: 8,
  },
  {
    id: 'agri-fab',
    name: 'Agri-Fab tow-behind',
    brand: 'Agri-Fab',
    type: 'rotary',
    models: '45-0288, 45-0463 and similar',
    swathFt: 10,
  },
]

export const spreaderById: Record<string, Spreader> = Object.fromEntries(
  spreaders.map((s) => [s.id, s]),
)

export function spreaderName(id: string): string {
  return spreaderById[id]?.name || ''
}

export interface SpreaderOption {
  text: string
  html: string
  value: string
}

/**
 * Rows for a spreader `<SlimSelect>`.
 *
 * The name carries the row and the models sit under it in small type, so the
 * closed control reads "Scotts broadcast / rotary" instead of trailing a list of
 * seven model names it has no room for. SlimSelect reuses an option's markup for
 * the closed box, so the sub-line is hidden there by `.ss-single` styling in
 * `slimselect.scss` rather than by building two variants here.
 */
export function spreaderOptions(placeholder: string): SpreaderOption[] {
  return [
    { text: placeholder, html: '', value: '' },
    ...spreaders.map((s) => ({
      text: s.name,
      html: [
        '<span class="spreader-opt">',
        `<span class="spreader-opt__name">${s.name}</span>`,
        `<span class="spreader-opt__models">${s.models}</span>`,
        '</span>',
      ].join(''),
      value: s.id,
    })),
  ]
}
