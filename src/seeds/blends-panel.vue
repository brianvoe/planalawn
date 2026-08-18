<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import BlendModal from './blend-modal.vue'
import FitMeters from './fit-meters.vue'
import SlimSelect from 'slim-select/vue'
import { ratingColor } from '../charts/bars'
import { climateBands } from '../data/climate'
import { cultivarsForSpecies, indexForBlend, speciesLabel, speciesRank } from '../data/seedDb'
import {
  coverageLabel,
  factorBaselines,
  scoreBlendForLocation,
} from '../services/suitability'
import { coverageTitle, fitTone, formOrChannelLabel } from './fit-ui'
import type { PropType } from 'vue'
import type {
  BarDatum,
  BaselineKey,
  Blend,
  BlendComponentFit,
  BlendFit,
  ClimateBandId,
  UserLocation,
} from '../types'

const ZONE_FILTERS: { id: 'all' | ClimateBandId; label: string }[] = [
  { id: 'all', label: 'All climate bands' },
  { id: 'cool', label: climateBands.cool.label },
  { id: 'transition', label: climateBands.transition.label },
  { id: 'warm', label: climateBands.warm.label },
]

/** How long the entry stagger keeps growing before every later card shares a delay. */
const STAGGER_CAP = 8

/** North to south, so two bags that share a band read the same way. */
const BAND_ORDER: ClimateBandId[] = ['cool', 'transition', 'warm']

const BAND_ICONS: Record<ClimateBandId, string> = {
  cool: 'fa-solid fa-snowflake',
  transition: 'fa-solid fa-cloud-sun',
  warm: 'fa-solid fa-sun',
}

interface SeedChip {
  name: string
  percent: number | null
  matched: boolean
}

interface BandDot {
  id: ClimateBandId
  icon: string
  served: boolean
  mine: boolean
}

interface ZoneNote {
  hint: string
  bands: BandDot[]
}

interface BlendRow {
  blend: Blend
  fit: BlendFit | null
  baselines: Partial<Record<BaselineKey, number>>
  rank: number
  stagger: number
  zone: ZoneNote | null
  chips: SeedChip[]
  seedLabel: string
}

/**
 * What's in the bag, and whether we hold a trial for each name.
 *
 * The unmatched ones still show: the label printed them, and hiding them would
 * make a five-way blend look like a three-way one.
 */
function seedChips(blend: Blend, fit: BlendFit | null): SeedChip[] {
  const scored = fit?.components || []
  const components = blend.components || []
  return components.map((c) => ({
    name: c.name,
    // Rounded for the glance, and only when there's a split worth showing: a
    // lone 100% repeats what "straight variety" already said. Tags that print
    // 24.89% keep their exact figure on the detail page.
    percent: components.length > 1 && c.percent != null ? Math.round(c.percent) : null,
    matched: Boolean(scored.find((s) => s.name === c.name)?.cultivar),
  }))
}

function seedLabel(blend: Blend): string {
  const count = (blend.components || []).length
  if (!count) return 'Cultivars not on the tag'
  if (blend.form === 'sod') return 'Vegetative variety'
  return count === 1 ? '1 cultivar' : `${count} cultivars`
}

/**
 * The climate bands a bag is sold for, as snowflake / mixed / sun.
 *
 * All three always render — the dim ones say as much as the lit ones, and a
 * fixed north-to-south row lets you compare two bags without reading. Yours
 * picks up the brand color when the bag covers it.
 */
function zoneNote(blend: Blend, band: ClimateBandId | null | undefined): ZoneNote | null {
  const zones = blend.zones || []
  if (!zones.length) return null
  const served = BAND_ORDER.filter((z) => zones.includes(z))
  const mine = Boolean(band && zones.includes(band))
  const names = served.map((z) => climateBands[z].shortLabel.toLowerCase())
  return {
    hint: `Sold for ${names.join(' and ')} zones${mine ? ' — including yours' : ''}.`,
    bands: BAND_ORDER.map((id) => ({
      id,
      icon: BAND_ICONS[id],
      served: zones.includes(id),
      mine: id === band && zones.includes(id),
    })),
  }
}

export default {
  name: 'BlendsPanel',
  components: { BarChart, BlendModal, FitMeters, SlimSelect },
  props: {
    blends: { type: Array as PropType<Blend[]>, required: true },
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    blendId: { type: String, default: '' },
  },
  emits: ['open-cultivar'],
  data() {
    return {
      query: '',
      zoneFilter: null as 'all' | ClimateBandId | null,
      zoneFilters: ZONE_FILTERS,
      speciesFilter: 'all',
      brandFilter: 'all',
      fitCache: {} as Record<string, BlendFit>,
      baselineCache: {} as Record<string, Partial<Record<BaselineKey, number>>>,
    }
  },
  watch: {
    userLocation: {
      immediate: true,
      handler(loc: UserLocation | null) {
        if (this.zoneFilter == null) {
          this.zoneFilter = loc?.climateBand || 'all'
        }
      },
    },
    /** A brand held from a previous grass type would filter down to nothing. */
    speciesFilter() {
      const brand = this.brandFilter
      if (brand !== 'all' && !this.speciesScoped.some((b) => b.manufacturer === brand)) {
        this.brandFilter = 'all'
      }
    },
  },
  computed: {
    ranked(): BlendRow[] {
      const q = this.query.trim().toLowerCase()
      const zone = this.zoneFilter
      const species = this.speciesFilter
      const brand = this.brandFilter
      const band = this.userLocation?.climateBand
      const rows = this.blends
        .filter((b) => !q || `${b.name} ${b.manufacturer}`.toLowerCase().includes(q))
        .filter((b) => species === 'all' || b.species === species)
        .filter((b) => brand === 'all' || b.manufacturer === brand)
        .filter((b) => {
          if (!zone || zone === 'all') return true
          if (!b.zones?.length) return !b.curated
          return b.zones.includes(zone)
        })
        .map((blend) => ({ blend, fit: this.fitFor(blend) }))
      rows.sort((a, b) => {
        const as = a.fit?.score
        const bs = b.fit?.score
        if (as == null && bs == null) return a.blend.name.localeCompare(b.blend.name)
        if (as == null) return 1
        if (bs == null) return -1
        return bs - as
      })
      return rows.map((row, i) => ({
        ...row,
        baselines: this.baselinesFor(row.blend),
        rank: i + 1,
        stagger: Math.min(i, STAGGER_CAP),
        zone: zoneNote(row.blend, band),
        chips: seedChips(row.blend, row.fit),
        seedLabel: seedLabel(row.blend),
      }))
    },
    countLabel(): string {
      const shown = this.ranked.length
      const total = this.blends.length
      const noun = shown === 1 ? 'listing' : 'listings'
      if (shown === total) return `${total} ${noun}`
      return `${shown} of ${total} ${noun}`
    },
    selectedBlend(): Blend | null {
      if (!this.blendId) return null
      return this.blends.find((b) => b.id === this.blendId) || null
    },
    selectedFit(): BlendFit | null {
      return this.selectedBlend ? this.fitFor(this.selectedBlend) : null
    },
    selectedComponents(): BlendComponentFit[] {
      if (this.selectedFit) return this.selectedFit.components
      return (this.selectedBlend?.components || []).map((c) => ({
        ...c,
        cultivar: null,
        fit: null,
      }))
    },
    componentChart(): BarDatum[] {
      return this.selectedComponents
        .map((c) => ({
          label: c.name,
          value: c.fit?.score ?? 0,
          color: ratingColor(c.fit?.score),
        }))
        .filter((d) => d.value > 0)
    },
    channelLabel(): string {
      return this.selectedBlend ? formOrChannelLabel(this.selectedBlend) : ''
    },
    isSod(): boolean {
      return this.selectedBlend?.form === 'sod'
    },
    zoneOptions(): { text: string; value: string }[] {
      return this.zoneFilters.map((z) => ({ text: z.label, value: z.id }))
    },
    /** Only grasses we actually stock bags for, so no option leads to an empty list. */
    speciesOptions(): { text: string; value: string }[] {
      const ids = [...new Set(this.blends.map((b) => b.species))].sort(
        (a, b) => speciesRank(a) - speciesRank(b),
      )
      return [
        { text: `All grass types (${ids.length})`, value: 'all' },
        ...ids.map((id) => ({ text: speciesLabel(id), value: id })),
      ]
    },
    /** Bags left once the grass type is applied — what the brand list is drawn from. */
    speciesScoped(): Blend[] {
      if (this.speciesFilter === 'all') return this.blends
      return this.blends.filter((b) => b.species === this.speciesFilter)
    },
    brandOptions(): { text: string; value: string }[] {
      const brands = [...new Set(this.speciesScoped.map((b) => b.manufacturer))].sort((a, b) =>
        a.localeCompare(b),
      )
      return [
        { text: `All brands (${brands.length})`, value: 'all' },
        ...brands.map((b) => ({ text: b, value: b })),
      ]
    },
    zoneChoice: {
      get(): string {
        return this.zoneFilter || 'all'
      },
      set(value: string) {
        this.zoneFilter = (value as 'all' | ClimateBandId) || 'all'
      },
    },
    areaLabel(): string {
      return this.userLocation?.label || this.userLocation?.city || ''
    },
    /** Blends you entered yourself, newest last, listed inside the blend modal. */
    myBlends(): Blend[] {
      return this.blends.filter((b) => !b.curated)
    },
  },
  methods: {
    coverageLabel,
    coverageTitle,
    fitTone,
    channelFor: formOrChannelLabel,
    fitFor(blend: Blend | null): BlendFit | null {
      if (!blend) return null
      const key = `${blend.id}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.fitCache[key]) {
        this.fitCache[key] = scoreBlendForLocation(
          blend,
          indexForBlend(blend.species),
          this.userLocation,
        )
      }
      return this.fitCache[key]
    },
    /** Trial averages for the bar marks — one pass per species and location. */
    baselinesFor(blend: Blend): Partial<Record<BaselineKey, number>> {
      const key = `${blend.species}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.baselineCache[key]) {
        this.baselineCache[key] = factorBaselines(
          cultivarsForSpecies(blend.species),
          this.userLocation,
        )
      }
      return this.baselineCache[key]
    },
    openForm() {
      ;(this.$refs.blendModal as InstanceType<typeof BlendModal> | undefined)?.open()
    },
    speciesLabel,
    /** Clear whatever was narrowing the list, or the new blend lands out of sight. */
    onBlendSaved(species: string) {
      if (this.speciesFilter !== 'all' && this.speciesFilter !== species) {
        this.speciesFilter = 'all'
      }
      this.brandFilter = 'all'
      this.query = ''
      this.fitCache = {}
    },
    removeBlend(id: string) {
      this.$store.dispatch('deleteUserBlend', id)
      this.fitCache = {}
      this.$router.push({ name: 'seeds' })
    },
  },
}
</script>

<style lang="scss">
.blends-panel {
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .hint {
    margin-bottom: 1rem;
    max-width: 46rem;
  }

  .list-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin: 0 0 0.6rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .list-meta__count {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.6rem;
  }

  .list-meta__scale {
    font-weight: 500;
  }

  /* Quiet on purpose: adding a bag is a side errand next to reading the list,
     and the results shouldn't be pushed down for a button nobody needs yet. */
  .add-blend {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.1rem 0.55rem;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: none;
    border: 1px dashed var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    transition:
      color 0.15s ease,
      border-color 0.15s ease;

    svg {
      font-size: 0.8em;
    }

    em {
      font-style: normal;
      font-variant-numeric: tabular-nums;
      opacity: 0.7;
    }

    &:hover {
      color: var(--color-primary-strong);
      border-color: var(--color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  .empty {
    margin: 0 0 1.25rem;
    color: var(--color-text-muted);
  }

  .rank {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .blend-card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1rem 1.1rem;
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    h3 {
      margin: 0;
      font-size: 1.15rem;
    }

    /* Meters and the seed row sit on the bottom edge so a row of cards lines up
       whether the summary runs one line or two. */
    .fit-meters,
    .blend-card__unscored {
      margin-top: auto;
      padding-top: 0.2rem;
    }
  }

  .blend-card__top {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .blend-card__mfr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.88rem;
    color: var(--color-text-muted);
  }

  .blend-card__brand {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .band-dots {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    cursor: help;
  }

  .band-dots__icon {
    opacity: 0.2;

    &--on {
      opacity: 0.75;
    }

    &--mine {
      color: var(--color-primary);
      opacity: 1;
    }
  }

  .blend-card__summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    margin: 0;
    overflow: hidden;
    font-size: 0.88rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .blend-card__unscored {
    margin: 0;
    font-size: 0.8rem;
    font-style: italic;
    color: var(--color-text-muted);
  }

  .blend-card__seed {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.6rem;
    margin-top: 0.15rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--color-border);
  }

  .blend-card__seed-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .seed-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .seed-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-radius: 999px;
    cursor: help;

    em {
      font-style: normal;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
      opacity: 0.75;
    }

    /* Printed on the label but absent from our trials: shown, not scored. */
    &--off {
      color: var(--color-text-muted);
      background: none;
      border: 1px dashed var(--color-border);
    }
  }

  .blend-enter-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(30ms * var(--stagger, 0));

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .blend-enter-from {
    opacity: 0;
    transform: translateY(0.6rem) scale(0.985);
  }

  .blend-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .blend-leave-to {
    opacity: 0;
    transform: scale(0.97);
  }

  .blend-move {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 1.25rem;

    @media (max-width: 1023px) {
      grid-template-columns: 1fr;
    }
  }

  .detail h1 {
    margin: 0 0 0.35rem;
    font-size: clamp(1.6rem, 3.2vw, 2.1rem);
  }

  .detail-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.85rem 1.25rem;
    margin-bottom: 0.5rem;
  }

  .detail-head__copy {
    min-width: 0;
    flex: 1 1 14rem;
  }

  .buy-hint {
    margin: 0.35rem 0 0;
    font-size: 0.9rem;
  }

  .buy-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    margin: 0;
    flex: 0 0 auto;
  }

  .fit-box .fit-meters {
    max-width: 32rem;
    margin: 0.35rem 0 0.25rem;
  }

  .why-missing {
    margin: 0 0 0.5rem;
    font-size: 0.82rem;
    color: var(--color-text-muted);

    summary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      list-style: none;
      cursor: pointer;

      &::-webkit-details-marker {
        display: none;
      }

      &::after {
        content: '';
        width: 0.35rem;
        height: 0.35rem;
        border-right: 1.5px solid currentColor;
        border-bottom: 1.5px solid currentColor;
        transform: translateY(-0.1em) rotate(45deg);
      }

      &:hover {
        color: var(--color-text);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 3px;
      }
    }

    &[open] summary::after {
      transform: translateY(0.1em) rotate(225deg);
    }

    p {
      margin: 0.45rem 0 0;
      max-width: 46rem;
      line-height: 1.55;
    }
  }
}
</style>

<template>
  <section class="blends-panel">
    <template v-if="!blendId">
      <div class="toolbar">
        <input v-model="query" class="input" type="search" placeholder="Search blends…" />
        <label class="toolbar-field">
          <span>Grass type</span>
          <SlimSelect
            v-model="speciesFilter"
            :data="speciesOptions"
            :settings="{ showSearch: false, allowDeselect: false }"
            aria-label="Grass type"
          />
        </label>
        <label class="toolbar-field">
          <span>Climate band</span>
          <SlimSelect
            v-model="zoneChoice"
            :data="zoneOptions"
            :settings="{
              showSearch: false,
              allowDeselect: false,
            }"
            aria-label="Climate band"
          />
        </label>
        <label class="toolbar-field">
          <span>Brand</span>
          <SlimSelect
            v-model="brandFilter"
            :data="brandOptions"
            :settings="{ allowDeselect: false, searchPlaceholder: 'Search brands…' }"
            aria-label="Brand"
          />
        </label>
      </div>

      <p class="hint">
        <template v-if="areaLabel">Based on {{ areaLabel }}, these rank best.</template>
        <template v-else>Set a location on My lawn — then these sort for your climate.</template>
        Every listing here names what’s inside, so each one scores against real NTEP trial data.
      </p>

      <p class="list-meta">
        <span class="list-meta__count">
          <span>{{ countLabel }}</span>
          <button type="button" class="add-blend" @click="openForm">
            <font-awesome-icon icon="fa-solid fa-plus" />
            {{ myBlends.length ? 'My blends' : 'Add your blend' }}
            <em v-if="myBlends.length">{{ myBlends.length }}</em>
          </button>
        </span>
        <span class="list-meta__scale">
          Bars are NTEP ratings on the 1–9 scale; the tick is the trial average
        </span>
      </p>

      <TransitionGroup tag="div" class="card-grid" name="blend" appear>
        <router-link
          v-for="row in ranked"
          :key="row.blend.id"
          class="blend-card"
          :style="{ '--stagger': row.stagger }"
          :to="{ name: 'seed-blend', params: { id: row.blend.id } }"
        >
          <div class="blend-card__top">
            <span class="tag">
              <span class="rank">#{{ row.rank }}</span>
              {{ channelFor(row.blend) }}
            </span>
            <span v-if="row.fit" class="fit" :class="fitTone(row.fit.score)">
              {{ row.fit.label }}
              <em v-if="row.fit.score != null">{{ row.fit.score }}</em>
            </span>
          </div>

          <h3>{{ row.blend.name }}</h3>
          <p class="blend-card__mfr">
            <span class="blend-card__brand">
              {{ row.blend.curated ? row.blend.manufacturer : speciesLabel(row.blend.species) }}
            </span>
            <span
              v-if="row.zone"
              class="band-dots"
              :title="row.zone.hint"
              :aria-label="row.zone.hint"
            >
              <font-awesome-icon
                v-for="b in row.zone.bands"
                :key="b.id"
                class="band-dots__icon"
                :class="{ 'band-dots__icon--on': b.served, 'band-dots__icon--mine': b.mine }"
                :icon="b.icon"
              />
            </span>
          </p>
          <p class="blend-card__summary">{{ row.blend.summary || row.blend.profile }}</p>

          <FitMeters
            v-if="row.fit && row.fit.score != null"
            :fit="row.fit"
            :baselines="row.baselines"
          />
          <p v-else class="blend-card__unscored">
            No trial overlap yet — nothing here is scored against NTEP.
          </p>

          <div class="blend-card__seed">
            <span class="blend-card__seed-label">{{ row.seedLabel }}</span>
            <span v-if="row.chips.length" class="seed-chips">
              <span
                v-for="c in row.chips"
                :key="c.name"
                class="seed-chip"
                :class="{ 'seed-chip--off': !c.matched }"
                :title="
                  c.matched
                    ? 'Scored from NTEP trial data.'
                    : 'Not in the trials we hold — it doesn’t count against the score.'
                "
              >
                {{ c.name }}<em v-if="c.percent">{{ c.percent }}%</em>
              </span>
            </span>
          </div>
        </router-link>
      </TransitionGroup>

      <p v-if="!ranked.length" class="empty">
        Nothing matches those filters. Try another grass type or brand, or widen the climate band.
      </p>

      <details class="why-missing">
        <summary>Don’t see your bag?</summary>
        <p>
          A missing bag isn’t a bad bag. This list only holds blends whose cultivars are printed on
          the tag and show up in a trial we have — that’s what makes a score possible.
          <button type="button" class="linkish" @click="openForm">Add your blend</button> from the
          tag and it ranks here with the rest.
        </p>
      </details>

      <BlendModal
        ref="blendModal"
        :user-location="userLocation"
        :my-blends="myBlends"
        @saved="onBlendSaved"
        @deleted="fitCache = {}"
      />
    </template>

    <p v-else-if="!selectedBlend">
      Blend not found. <router-link to="/seeds">Back to blends</router-link>
    </p>

    <div v-else class="detail card">
      <div class="detail-head">
        <div class="detail-head__copy">
          <h1>{{ selectedBlend.name }}</h1>
          <p class="muted">
            {{ channelLabel }}
            <span v-if="selectedBlend.profile"> · {{ selectedBlend.profile }}</span>
          </p>
        </div>
        <div v-if="selectedBlend.url || selectedBlend.companyUrl" class="buy-links">
          <a
            v-if="selectedBlend.url"
            class="btn btn--primary"
            :href="selectedBlend.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            Product page
            <font-awesome-icon icon="fa-solid fa-arrow-right" />
          </a>
          <a
            v-if="selectedBlend.companyUrl"
            class="btn"
            :href="selectedBlend.companyUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
        </div>
      </div>
      <p v-if="selectedBlend.buyHint" class="buy-hint">{{ selectedBlend.buyHint }}</p>
      <p class="muted">{{ selectedBlend.notes }}</p>

      <div v-if="selectedFit" class="fit-box">
        <strong>{{ selectedFit.label }}</strong>
        <span v-if="selectedFit.score != null">
          Score {{ selectedFit.score }} / 9
          <em
            v-if="selectedFit.coverage"
            class="coverage"
            :class="{ 'coverage--partial': !selectedFit.coverage.complete }"
            :title="coverageTitle(selectedFit.coverage)"
          >
            · based on {{ coverageLabel(selectedFit.coverage) }}
          </em>
        </span>
        <FitMeters
          v-if="selectedFit.score != null"
          :fit="selectedFit"
          :baselines="baselinesFor(selectedBlend)"
        />
        <ul v-if="selectedFit.strengths?.length">
          <li v-for="s in selectedFit.strengths" :key="s">{{ s }}</li>
        </ul>
        <ul v-if="selectedFit.watchouts?.length" class="warn">
          <li v-for="w in selectedFit.watchouts" :key="w">{{ w }}</li>
        </ul>
      </div>

      <div class="detail-grid">
        <div>
          <h3>{{ isSod ? 'Variety in this sod' : 'Cultivars in this blend' }}</h3>
          <div class="comp-table">
            <div v-for="c in selectedComponents" :key="c.name" class="comp-line">
              <div>
                <button
                  v-if="c.cultivar"
                  type="button"
                  class="linkish"
                  @click="
                    $emit(
                      'open-cultivar',
                      c.cultivar.id,
                      c.cultivar.species || selectedBlend.species,
                    )
                  "
                >
                  <strong>{{ c.name }}</strong>
                </button>
                <strong v-else>{{ c.name }}</strong>
                <span v-if="c.percent"> · {{ c.percent }}%</span>
                <span v-if="!c.cultivar && !c.fit" class="missing"> · not in NTEP extract</span>
              </div>
              <div v-if="c.fit?.score != null" class="fit-mini">
                {{ c.fit.label }} · {{ c.fit.score }}
                <span
                  class="coverage"
                  :class="{ 'coverage--partial': !c.fit.coverage.complete }"
                  :title="coverageTitle(c.fit.coverage)"
                >
                  {{ c.fit.coverage.factors }}/{{ c.fit.coverage.totalFactors }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="componentChart.length">
          <div class="chart-panel">
            <h3 class="chart-panel__title">Component fit</h3>
            <p class="chart-panel__meta">Each cultivar’s area score (1–9).</p>
            <BarChart :data="componentChart" :options="{ leftMargin: 120, rowHeight: 32 }" />
          </div>
        </div>
      </div>

      <button
        v-if="!selectedBlend.curated"
        type="button"
        class="btn btn--ghost"
        @click="removeBlend(selectedBlend.id)"
      >
        Delete my blend
      </button>
    </div>
  </section>
</template>
