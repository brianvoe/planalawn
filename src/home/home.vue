<script lang="ts">
import Conditions from '../components/conditions.vue'
import LawnSize from '../components/lawn-size.vue'
import LocationActions from '../components/location-actions.vue'
import FitMeters from '../seeds/fit-meters.vue'
import { evaluateAllTasks, groupByBucket } from '../services/timing'
import { tasks } from '../data/tasks'
import { monthLabels, timingByTask } from '../data/timingRules'
import {
  cultivarCount,
  cultivarsForSpecies,
  defaultSpeciesId,
  indexForBlend,
  isNamedCultivar,
  speciesList,
} from '../data/seedDb'
import {
  coverageLabel,
  factorBaselines,
  scoreBlendForLocation,
  scoreCultivarForLocation,
  usesRegionalQuality,
} from '../services/suitability'
import { coverageTitle } from '../seeds/fit-ui'
import type { PropType } from 'vue'
import type {
  Blend,
  BlendFit,
  Conditions as Weather,
  Cultivar,
  CultivarFit,
  EvaluatedTask,
  GrassType,
  Profile,
  ScoreFactor,
} from '../types'

/** One card per place you can go, so the hero doubles as a map of the site. */
const DESTINATIONS = [
  {
    icon: ['fas', 'calendar-day'],
    title: 'Calendar',
    body: 'Every window for your climate band, month by month.',
    to: '/calendar',
  },
  {
    icon: ['fas', 'list-check'],
    title: 'Tasks',
    body: 'Playbooks with the rate for your square footage.',
    to: '/tasks',
  },
  {
    icon: ['lawn', 'seed'],
    title: 'Seeds',
    body: 'Bags, cultivars and NTEP trial charts, scored for you.',
    to: '/seeds',
  },
  {
    icon: ['fas', 'spray-can'],
    title: 'Calculate',
    body: 'Label rates into tank ounces and spreader settings.',
    to: '/calculate',
  },
  {
    icon: ['fas', 'location-dot'],
    title: 'My lawn',
    body: 'Size, grass type and location — kept in this browser.',
    to: '/settings',
  },
]

/** Sub-areas of the seeds section, named so the depth of it is obvious. */
const SEED_LINKS = [
  { label: 'Blends', to: '/seeds/blends' },
  { label: 'Cultivars', to: '/seeds/cultivars' },
  { label: 'Compare', to: '/seeds/compare' },
  { label: 'NTEP tables', to: '/seeds/ntep' },
]

const SPECIES_LABELS: Record<string, string> = Object.fromEntries(
  speciesList.map((s) => [s.id, s.label]),
)

const FEATURES = [
  {
    icon: ['fas', 'ruler'],
    title: 'Rate calculator',
    body: 'Square feet in, pounds and bags out, per product.',
    to: '/tasks',
  },
  {
    icon: ['fas', 'spray-can'],
    title: 'Real product rates',
    body: 'SpeedZone, GrubEx, Milorganite — by name, with spreader settings.',
    to: '/calculate',
  },
  {
    icon: ['lawn', 'seed-bag'],
    title: 'Add your own blend',
    body: 'Enter the cultivars on your tag and it ranks with the rest.',
    to: '/seeds/blends',
  },
  {
    icon: ['fas', 'code-compare'],
    title: 'Compare bags',
    body: 'Two or three blends side by side on the same charts.',
    to: '/seeds/compare',
  },
  {
    icon: ['fas', 'location-dot'],
    title: 'Location aware',
    body: 'Your coordinates pick the climate band and nearest trial site.',
    to: '/settings',
  },
  {
    icon: ['fas', 'floppy-disk'],
    title: 'Export and restore',
    body: 'Your profile is yours — back it up as a file any time.',
    to: '/settings',
  },
]

const TIMING_POINTS = [
  'Live 6 cm soil temperature for your exact coordinates.',
  'Each task has its own temperature gate, not one shared season.',
  'Windows shift with your climate band as the year moves.',
]

interface BlendPick {
  blend: Blend
  fit: BlendFit
  baselines: Partial<Record<ScoreFactor, number>>
}

const COUNT_UP_MS = 900

/** Cultivar chips a card shows before it collapses the rest into a count. */
const MIX_CHIPS = 3

/** Dots a month tick can hold before the strip starts to look like a bar chart. */
const MONTH_DOTS = 3

/** Do-now rows the hero panel shows before deferring to the calendar. */
const HERO_ROWS = 3

interface MonthCell {
  month: number
  label: string
  count: number
  dots: number
  current: boolean
}

export default {
  name: 'Home',
  components: { Conditions, FitMeters, LawnSize, LocationActions },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return {
      destinations: DESTINATIONS,
      features: FEATURES,
      seedLinks: SEED_LINKS,
      timingPoints: TIMING_POINTS,
      /** Stat figures as currently drawn; they tick up to the real ones on load. */
      counted: [] as number[],
    }
  },
  mounted() {
    this.countUp()
  },
  computed: {
    profile(): Profile {
      return this.$store.state.profile
    },
    lawnSqFt(): number {
      return this.$store.getters.lawnSqFt
    },
    userLocation() {
      return this.$store.getters.userLocation
    },
    hasLocation(): boolean {
      return this.$store.getters.hasLocation
    },
    allBlends(): Blend[] {
      return this.$store.getters.allBlends
    },
    nowItems(): EvaluatedTask[] {
      const evaluated = evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
      return groupByBucket(evaluated).now
    },
    /** The rows the hero shows; the rest are a click away on the calendar. */
    heroRows(): EvaluatedTask[] {
      return this.nowItems.slice(0, HERO_ROWS)
    },
    currentMonth(): number {
      return new Date().getMonth() + 1
    },
    currentMonthName(): string {
      return new Date().toLocaleDateString(undefined, { month: 'long' })
    },
    /**
     * The year at a glance, same dots-per-job idea as the calendar page. It is
     * the hero's main claim — that this site knows the whole season, not just
     * today — so the strip is real links into each month rather than a graphic.
     */
    monthCells(): MonthCell[] {
      return monthLabels.map((label, i) => {
        const month = i + 1
        const count = tasks.filter((t) => {
          const rule = timingByTask[t.id]
          if (!rule) return false
          return rule.months.includes(month) || rule.secondaryMonths.includes(month)
        }).length
        return {
          month,
          label,
          count,
          dots: Math.min(count, MONTH_DOTS),
          current: month === this.currentMonth,
        }
      })
    },
    grassType(): GrassType | null {
      return this.$store.getters.grassType
    },
    cultivarCount(): number {
      return cultivarCount
    },
    areaLabel(): string {
      return this.userLocation?.label || this.userLocation?.city || ''
    },
    /** Drops out entirely without a location, so the sentence still reads. */
    areaSuffix(): string {
      return this.areaLabel ? ` — ${this.areaLabel}` : ''
    },
    /** What the site holds, in three numbers — the hero's proof of depth. */
    stats(): { value: number; label: string }[] {
      return [
        { value: tasks.length, label: 'task playbooks' },
        { value: this.allBlends.length, label: 'bags and sod ranked' },
        { value: cultivarCount, label: 'NTEP cultivars' },
      ]
    },
    soilSummary(): string {
      const soil = this.conditions?.soilTemp6F
      if (soil == null) return 'Set your location to get live soil temperature.'
      return `Soil is ${Math.round(soil)}°F — check what’s coming up.`
    },
    regionalQuality(): boolean {
      return usesRegionalQuality(this.userLocation?.climateBand)
    },
    /**
     * Every scoreable bag, best first — the same ranking the seeds page shows.
     *
     * Trial averages are looked up once per species rather than per bag, since
     * that pass walks the whole cultivar list for the location.
     */
    rankedBlends(): BlendPick[] {
      const loc = this.userLocation
      const baselines: Record<string, Partial<Record<ScoreFactor, number>>> = {}
      return this.allBlends
        .map((blend) => ({
          blend,
          fit: scoreBlendForLocation(blend, indexForBlend(blend.species), loc),
        }))
        .filter((row) => row.fit.score != null)
        .sort((a, b) => (b.fit.score || 0) - (a.fit.score || 0))
        .map((row) => {
          const species = row.blend.species
          if (!baselines[species]) {
            baselines[species] = factorBaselines(cultivarsForSpecies(species), loc)
          }
          return { ...row, baselines: baselines[species] }
        })
    },
    /** The hook, not a recommendation — the pick itself is a click away. */
    seedTeaser(): string {
      if (this.areaLabel) return `Scored on the NTEP plots nearest ${this.areaLabel}.`
      return 'Blends and cultivars scored on real trial data.'
    },
    topBlends(): BlendPick[] {
      return this.rankedBlends.slice(0, 3)
    },
    topCultivars(): (Cultivar & { fit: CultivarFit })[] {
      return cultivarsForSpecies(defaultSpeciesId(this.grassType))
        .filter(isNamedCultivar)
        .map((c) => ({ ...c, fit: scoreCultivarForLocation(c, this.userLocation) }))
        .filter((c) => c.fit.score != null && c.fit.coverage.complete)
        .sort((a, b) => (b.fit.score || 0) - (a.fit.score || 0))
        .slice(0, 3)
    },
  },
  methods: {
    coverageLabel,
    coverageTitle,
    speciesLabel(id: string): string {
      return SPECIES_LABELS[id] || id
    },
    monthTitle(cell: MonthCell): string {
      if (!cell.count) return `${cell.label} — nothing typically due`
      return `${cell.label} — ${cell.count} ${cell.count === 1 ? 'job' : 'jobs'}`
    },
    /** The scroll cue's other half: pressing it does what scrolling would. */
    showMore() {
      const el = this.$refs.next as HTMLElement | undefined
      if (!el) return
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    },
    /** What's in the bag, trimmed to what fits a card. */
    mixNames(blend: Blend): string[] {
      const names = blend.components.map((c) => c.name)
      // A single stand sold under its own name would just repeat the heading.
      if (names.length === 1 && names[0] === blend.name) return []
      if (names.length <= MIX_CHIPS) return names
      return [...names.slice(0, MIX_CHIPS), `+${names.length - MIX_CHIPS} more`]
    },
    statValue(i: number): number {
      const shown = this.counted[i]
      return shown == null ? this.stats[i].value : shown
    },
    /** Counts the hero stats up from zero, so the numbers announce themselves. */
    countUp() {
      const targets = this.stats.map((s) => s.value)
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        this.counted = targets
        return
      }
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_UP_MS)
        const eased = 1 - Math.pow(1 - t, 3)
        this.counted = targets.map((v) => Math.round(v * eased))
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
  },
}
</script>

<style lang="scss">
.home {
  .band {
    background: var(--band-fill);
    padding-block: clamp(3.5rem, 7vw, 5.5rem);
    /* Clears the sticky bar when the scroll cue jumps here. */
    scroll-margin-top: var(--nav-height);

    .band__inner {
      position: relative;
    }

    &--plain {
      --band-fill: var(--color-bg);
    }

    &--tint {
      --band-fill: var(--color-bg-soft);
      box-shadow: var(--shadow-section);
    }

    &--tint-strong {
      --band-fill: var(--color-primary-soft);
      box-shadow: var(--shadow-section);
    }

    &--dark {
      --band-fill: var(--color-dark);
      box-shadow:
        0 -8px 28px rgba(16, 50, 31, 0.14),
        0 12px 32px rgba(0, 0, 0, 0.18);
    }

    .band__head {
      max-width: 40rem;
      margin-bottom: 2rem;

      &--center {
        margin-inline: auto;
        text-align: center;
      }
    }

    h2 {
      margin: 0 0 0.75rem;
      font-family: var(--font-display);
      font-weight: var(--font-weight-bold);
      font-size: clamp(1.7rem, 3.4vw, 2.3rem);
      letter-spacing: -0.028em;
      line-height: 1.15;
      color: var(--heading-ink, var(--color-text));
    }
  }

  .inline-cta {
    margin-top: 1.4rem;
    padding-inline: 0;
  }

  /* The hero carries the whole product: pitch, the live calendar, seed intel
     and a row of every section. On a desktop it owns exactly one screen and
     centres in it, so what the site does is all visible before any scrolling. */
  .hero {
    position: relative;
    padding-block: clamp(1.5rem, 3.5vw, 2.75rem) clamp(1.75rem, 4vw, 3rem);
    overflow: hidden;
    background: var(--color-bg);

    @media (min-width: 1024px) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(100svh - var(--nav-height));
      /* Room under the rail for the scroll cue, which is positioned. */
      padding-bottom: 4.25rem;
    }

    /* Slow drift behind the copy, so a static page still feels awake. */
    &::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -10%;
      width: 44rem;
      height: 44rem;
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--color-primary) 13%, transparent),
        transparent 66%
      );
      animation: hero-drift 26s ease-in-out infinite alternate;
      pointer-events: none;
    }

    .hero__inner {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
      align-items: center;
      gap: clamp(1.75rem, 4vw, 3rem);

      @media (max-width: 1023px) {
        grid-template-columns: 1fr;
      }
    }

    /* The name is the headline: arriving readers should see whose site this is
       before they read a word about lawns. */
    .wordmark {
      display: flex;
      align-items: center;
      gap: clamp(0.6rem, 1.4vw, 0.9rem);
      margin: 0 0 0.6rem;
      font-family: var(--font-display);
      font-size: clamp(2.3rem, 5.6vw, 3.7rem);
      font-weight: var(--font-weight-bold);
      line-height: 1.02;
      letter-spacing: -0.045em;
    }

    .wordmark__mark {
      flex: 0 0 auto;
      width: clamp(2.1rem, 4.6vw, 3rem);
      height: auto;
      border-radius: 22%;
      animation: mark-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
    }

    /* A gradient warming from fairway green to the wheat tone in the mark. It
       runs across the three words so each one sits at its own value, which
       separates them without resorting to punctuation or line breaks.
       A light band sweeps the letters once on arrival; it starts and ends off
       the box, so the resting wordmark is the gradient alone. */
    .wordmark__text {
      background-image:
        linear-gradient(
          100deg,
          transparent,
          color-mix(in srgb, var(--color-surface) 50%, transparent) 50%,
          transparent
        ),
        linear-gradient(
          96deg,
          var(--color-dark) 0%,
          var(--color-primary-strong) 26%,
          var(--color-primary) 56%,
          color-mix(in srgb, var(--color-accent) 70%, var(--color-primary)) 100%
        );
      background-repeat: no-repeat;
      background-position:
        -80% 0,
        0 0;
      background-size:
        40% 100%,
        100% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      color: var(--color-primary-strong);
      text-wrap: balance;
      animation: wordmark-sheen 1.5s ease-out 0.45s both;
    }

    @supports (background-clip: text) or (-webkit-background-clip: text) {
      .wordmark__text {
        color: transparent;
      }
    }

    .hero__tagline {
      max-width: 34rem;
      margin: 0;
      font-size: clamp(1rem, 1.6vw, 1.15rem);
      line-height: 1.5;
      color: var(--color-text-muted);
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 1.3rem;

      /* The ask takes the column, so the button and the city list share a line. */
      .loc-actions {
        flex: 1 1 100%;
      }
    }

    .hero__panels {
      display: grid;
      gap: 0.85rem;
    }

    .hero__meta {
      margin: 0.7rem 0 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
  }

  /* Arrives a beat after the page settles, then keeps nodding. Two signals in
     one control: it says there is more, and it takes you there. */
  .hero__more {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    z-index: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    padding: 0.35rem 0.8rem;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    background: none;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    opacity: 0;
    transform: translateX(-50%);
    animation: cue-in 0.6s ease 1.1s forwards;

    @media (max-width: 1023px) {
      display: none;
    }

    svg {
      width: 0.85rem;
      height: 0.85rem;
      animation: cue-bob 2s ease-in-out infinite;
    }

    &:hover {
      color: var(--color-primary-strong);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  /* What the site holds, in three numbers that tick up on arrival. */
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.75rem;
    margin: 1.3rem 0 0;

    dt {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: var(--font-weight-bold);
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--color-primary-strong);
    }

    dd {
      margin: 0.1rem 0 0;
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }
  }

  .rail {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: clamp(1.5rem, 3.5vw, 2.5rem);

    @media (max-width: 1023px) {
      grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
    }

    /* On a phone the blurbs cost more height than they earn, so the rail
       shrinks to labelled icons and stays a short block. */
    @media (max-width: 767px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;

      .rail__card {
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 0.55rem;
        padding: 0.65rem 0.75rem;

        small {
          display: none;
        }
      }
    }

    .rail__card {
      display: grid;
      gap: 0.3rem;
      padding: 0.85rem 0.9rem;
      color: inherit;
      text-decoration: none;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: calc(var(--border-radius) * 1.5);
      box-shadow: var(--shadow-sm);
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        transform 0.15s ease;

      &:hover {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);

        .rail__icon {
          color: var(--color-surface);
          background: var(--color-primary);
        }
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      strong {
        font-size: 0.92rem;
      }

      small {
        font-size: 0.76rem;
        line-height: 1.4;
        color: var(--color-text-muted);
      }
    }

    .rail__icon {
      display: grid;
      place-items: center;
      width: 1.9rem;
      height: 1.9rem;
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      border-radius: 10px;
      transition:
        color 0.15s ease,
        background 0.15s ease;

      svg {
        width: 0.95rem;
        height: 0.95rem;
      }
    }
  }

  /* Short laptop screens: trim the air so the rail — the map of the site —
     still lands inside the first screenful. */
  @media (min-width: 1024px) and (max-height: 820px) {
    .hero {
      /* Trimmed at the top only — the bottom still owes the cue its room. */
      padding-block: 1.25rem 4rem;

      .hero__panels {
        gap: 0.6rem;
      }
    }

    .stats {
      margin-top: 1rem;
    }

    .rail {
      margin-top: 1.15rem;
    }
  }

  .panel {
    overflow: hidden;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow-md);

    .panel__bar {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.7rem 0.9rem;
      background: var(--color-surface-alt);
      border-bottom: 1px solid var(--color-border);

      /* Announces itself after the jobs below it have landed. */
      .chip {
        margin-left: auto;
        white-space: nowrap;
        animation: chip-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 1s both;

        em {
          font-style: normal;
          font-variant-numeric: tabular-nums;
        }
      }
    }

    .panel__dots {
      display: flex;
      gap: 0.3rem;

      i {
        width: 0.5rem;
        height: 0.5rem;
        background: var(--color-border);
        border-radius: 999px;
      }

      /* One live dot: the list below it is real, not a screenshot. */
      i:last-child {
        background: var(--color-success);
        animation: live-blink 2.6s ease-in-out infinite;
      }
    }

    /* The month, not a label — this panel is a calendar, so it names the date. */
    .panel__title {
      font-family: var(--font-display);
      font-size: 0.92rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-text);
    }

    .panel__body {
      padding: 0.4rem 0.9rem 0.9rem;
    }

    .panel__more {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.7rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-primary-strong);
      text-decoration: none;

      svg {
        transition: transform 0.15s ease;
      }

      &:hover svg {
        transform: translateX(3px);
      }
    }
  }

  /* The whole year in one line: a tick per month, a dot per job in it. Small
     enough to read as a calendar spine rather than a chart. */
  .months {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 0.15rem;
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid var(--color-border);
  }

  .month {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
    padding: 0.3rem 0.1rem 0.25rem;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: 7px;
    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      color: var(--color-text);
      background: var(--color-bg-soft);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }

    /* Lights up once the scan has run past it, so the eye lands on today. */
    &--current {
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      animation: tick-land 0.6s ease 1.35s both;

      .month__dots i {
        opacity: 1;
      }
    }
  }

  .month__dots {
    display: flex;
    gap: 1.5px;
    min-height: 3px;

    /* The year fills in left to right on arrival — the panel reading the
       season rather than a picture of one. */
    i {
      width: 3px;
      height: 3px;
      background: var(--color-primary);
      border-radius: 999px;
      opacity: 0.45;
      animation: dot-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-delay: calc(0.7s + 42ms * var(--m, 0));
    }
  }

  /* Seed intel as a single line under the calendar: present and clickable,
     without competing with the jobs above it. */
  .seed-strip {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.9rem;
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow-sm);
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

    .row__go {
      flex: 0 0 auto;
      margin-left: auto;
      color: var(--color-text-muted);
      transition:
        color 0.15s ease,
        transform 0.15s ease;
    }

    &:hover .row__go {
      color: var(--color-primary);
      transform: translateX(3px);
    }
  }

  .seed-strip__icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-radius: 10px;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  .seed-strip__text {
    display: grid;
    min-width: 0;
    gap: 0.1rem;

    strong {
      font-size: 0.92rem;
      line-height: 1.25;
    }

    small {
      font-size: 0.76rem;
      line-height: 1.35;
      color: var(--color-text-muted);
    }
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.8rem 0;
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid var(--color-border);

    &:last-of-type {
      border-bottom: 0;
    }

    .row__text {
      display: grid;
      min-width: 0;
      gap: 0.15rem;

      strong {
        font-size: 0.95rem;
      }

      small {
        font-size: 0.8rem;
        line-height: 1.4;
        color: var(--color-text-muted);
      }
    }

    .row__go {
      flex: 0 0 auto;
      margin-left: auto;
      color: var(--color-text-muted);
      transition:
        color 0.15s ease,
        transform 0.15s ease;
    }

    &:hover .row__go {
      color: var(--color-primary);
      transform: translateX(3px);
    }

    &--empty {
      margin: 0;
      color: var(--color-text-muted);
    }
  }

  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    align-items: center;
    gap: clamp(1.75rem, 4vw, 3rem);

    @media (max-width: 1023px) {
      grid-template-columns: 1fr;
    }
  }

  .seed-grid,
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .feature-grid {
    text-decoration: none;
  }

  .seed-card {
    display: grid;
    align-content: start;

    .seed-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
    }

    .seed-card__rank {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    h3 {
      margin: 0;
      font-family: var(--font-family);
      font-size: 1.05rem;
      font-weight: 700;
    }

    .seed-card__label {
      margin: 0.2rem 0 0.7rem;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }

    .seed-card__mix {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin: 0 0 0.9rem;
    }

    .seed-card__seed {
      padding: 0.15rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-bg-soft);
      border-radius: 999px;
    }

    .seed-card__cov {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0.75rem 0 0;
      font-size: 0.75rem;
      color: var(--color-success);
      cursor: help;
    }
  }

  .seed-note {
    max-width: 44rem;
    margin: 1.5rem 0 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  .seed-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.1rem;

    .seed-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-primary-strong);
      text-decoration: none;
      background: var(--color-primary-soft);
      border-radius: 999px;
      transition:
        background 0.15s ease,
        transform 0.15s ease;

      svg {
        width: 0.75em;
        height: 0.75em;
      }

      &:hover {
        background: color-mix(in srgb, var(--color-primary) 22%, transparent);
        transform: translateX(2px);
      }
    }
  }

  .cta {
    max-width: 34rem;
    margin-inline: auto;
    text-align: center;

    .lede {
      margin-inline: auto;
    }

    .cta__form {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: center;
      gap: 0.85rem;
      margin-top: 1.75rem;
    }

    .cta__note {
      margin: 1.1rem 0 0;
      font-size: 0.8rem;
    }
  }
}

@keyframes hero-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    transform: translate3d(-4%, 4%, 0) scale(1.09);
  }
}

@keyframes live-blink {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}

@keyframes mark-pop {
  from {
    opacity: 0;
    transform: scale(0.55) rotate(-10deg);
  }

  to {
    transform: none;
  }
}

/* Only the sheen layer moves; the gradient underneath holds its position. */
@keyframes wordmark-sheen {
  from {
    background-position:
      -80% 0,
      0 0;
  }

  to {
    background-position:
      180% 0,
      0 0;
  }
}

@keyframes dot-in {
  from {
    opacity: 0;
    transform: scale(0.3);
  }

  to {
    transform: none;
  }
}

@keyframes tick-land {
  from {
    background-color: transparent;
    box-shadow: 0 0 0 0 transparent;
  }

  55% {
    box-shadow: 0 0 0 0.28rem color-mix(in srgb, var(--color-primary) 16%, transparent);
  }

  to {
    box-shadow: 0 0 0 0 transparent;
  }
}

@keyframes chip-pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }

  to {
    transform: none;
  }
}

@keyframes cue-in {
  to {
    opacity: 1;
  }
}

@keyframes cue-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(0.28rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home {
    .hero::before,
    .panel__dots i:last-child,
    .hero__more svg,
    .wordmark__mark,
    .wordmark__text,
    .month--current,
    .month__dots i,
    .panel__bar .chip {
      animation: none;
    }

    /* Still visible, just not announced. */
    .hero__more {
      opacity: 1;
      animation: none;
    }
  }
}
</style>

<template>
  <div class="home">
    <!-- HERO ---------------------------------------------------------------->
    <header class="hero">
      <div class="hero__inner container">
        <div class="hero__copy">
          <h1 v-reveal class="wordmark">
            <img class="wordmark__mark" src="/favicon.svg" alt="" width="64" height="64" />
            <span class="wordmark__text">Lawn Plan Nerd</span>
          </h1>
          <p v-reveal="1" class="hero__tagline">
            Lawn timing, product rates and seed picks — from the soil temperature at your address.
          </p>
          <!-- Until there's a location, the first action is giving us one — in
               the same slot, so nothing above or below it moves. -->
          <div v-reveal="2" class="hero__actions">
            <template v-if="hasLocation">
              <router-link class="btn btn--primary" to="/calendar">
                What’s next?
                <font-awesome-icon icon="fa-solid fa-arrow-right" />
              </router-link>
              <router-link class="btn" to="/settings">Set up my lawn</router-link>
            </template>
            <LocationActions v-else />
          </div>
          <dl v-reveal="3" class="stats">
            <div v-for="(s, i) in stats" :key="s.label" class="stats__item">
              <dt>{{ statValue(i).toLocaleString() }}</dt>
              <dd>{{ s.label }}</dd>
            </div>
          </dl>
          <p v-reveal="4" class="hero__meta">
            <template v-if="hasLocation">
              Free · no account · nothing leaves this browser
            </template>
            <template v-else>
              A nearby city is enough · free · nothing leaves this browser
            </template>
          </p>
        </div>

        <!-- A live calendar rather than a mockup: the real year, the real jobs
             open today. Seed intel rides underneath as the second headline. -->
        <div class="hero__panels">
          <div v-reveal="2" class="panel panel--cal">
            <div class="panel__bar">
              <span class="panel__dots" aria-hidden="true"><i /><i /><i /></span>
              <span class="panel__title">{{ currentMonthName }}</span>
              <span class="chip" :class="nowItems.length ? 'chip--good' : ''">
                <template v-if="nowItems.length">
                  <em>{{ nowItems.length }}</em> open now
                </template>
                <template v-else>Nothing due</template>
              </span>
            </div>

            <nav class="months" aria-label="Jobs by month">
              <router-link
                v-for="cell in monthCells"
                :key="cell.month"
                class="month"
                :class="{ 'month--current': cell.current }"
                :style="{ '--m': cell.month }"
                :to="`/calendar?month=${cell.month}`"
                :title="monthTitle(cell)"
              >
                <span>{{ cell.label }}</span>
                <span class="month__dots" aria-hidden="true">
                  <i v-for="n in cell.dots" :key="n" />
                </span>
              </router-link>
            </nav>

            <div class="panel__body">
              <!-- Each job lands on its own beat, so the panel reads as filling
                   with live work rather than appearing as a block. -->
              <router-link
                v-for="(item, i) in heroRows"
                :key="item.task.id"
                v-reveal="i + 3"
                class="row"
                :to="`/tasks/${item.task.id}`"
              >
                <span
                  class="status-dot"
                  :class="`status-dot--${item.soil.tone}`"
                  aria-hidden="true"
                />
                <span class="row__text">
                  <strong>{{ item.task.name }}</strong>
                  <small>{{ item.reason }}</small>
                </span>
                <font-awesome-icon icon="fa-solid fa-arrow-right" class="row__go" />
              </router-link>

              <p v-if="!nowItems.length" v-reveal="3" class="row row--empty">
                <font-awesome-icon icon="fa-solid fa-clock" />
                <span class="row__text">
                  <strong>Nothing due right now</strong>
                  <small>{{ soilSummary }}</small>
                </span>
              </p>

              <router-link v-reveal="6" class="panel__more" to="/calendar">
                Full calendar
                <font-awesome-icon icon="fa-solid fa-arrow-right" />
              </router-link>
            </div>
          </div>

          <router-link v-reveal="4" class="seed-strip" to="/seeds">
            <span class="seed-strip__icon">
              <font-awesome-icon :icon="['lawn', 'seed-bag']" />
            </span>
            <span class="seed-strip__text">
              <strong>Which bag is actually worth buying?</strong>
              <small>{{ seedTeaser }}</small>
            </span>
            <font-awesome-icon icon="fa-solid fa-arrow-right" class="row__go" />
          </router-link>
        </div>
      </div>

      <!-- Every section of the site, in one row you can read without scrolling. -->
      <nav class="rail container" aria-label="What’s inside">
        <router-link
          v-for="(d, i) in destinations"
          :key="d.title"
          v-reveal="i + 5"
          class="rail__card"
          :to="d.to"
        >
          <span class="rail__icon">
            <font-awesome-icon :icon="d.icon" />
          </span>
          <strong>{{ d.title }}</strong>
          <small>{{ d.body }}</small>
        </router-link>
      </nav>

      <!-- The hero fills the screen, so it has to say that it isn't the end. -->
      <button type="button" class="hero__more" @click="showMore">
        View more
        <font-awesome-icon icon="fa-solid fa-chevron-down" />
      </button>
    </header>

    <!-- TIMING -------------------------------------------------------------->
    <section ref="next" class="band band--tint">
      <div class="band__inner container split">
        <div v-reveal>
          <p class="eyebrow">
            <font-awesome-icon icon="fa-solid fa-calendar-day" />
            Timing
          </p>
          <h2>Soil temp beats the calendar.</h2>
          <p class="lede">
            Seed goes down when the ground is ready, not when the bag says September.
          </p>
          <ul class="checklist">
            <li v-for="(point, i) in timingPoints" :key="point" v-reveal="i + 1">
              <font-awesome-icon icon="fa-solid fa-check" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <router-link class="btn btn--ghost inline-cta" to="/calendar">
            See my windows
            <font-awesome-icon icon="fa-solid fa-arrow-right" />
          </router-link>
        </div>

        <Conditions
          v-reveal="2"
          :conditions="conditions"
          :error="weatherError"
          :loading="weatherLoading"
          @refresh="$emit('refresh-weather')"
        />
      </div>
    </section>

    <!-- SEEDS --------------------------------------------------------------->
    <section class="band band--plain">
      <div class="band__inner container">
        <div v-reveal class="band__head">
          <p class="eyebrow">
            <font-awesome-icon :icon="['lawn', 'seed']" />
            Seed intel
          </p>
          <h2>Not bag marketing. Trial data.</h2>
          <p class="lede">
            Bags name the cultivars inside them. We score those names against the NTEP trial plots
            nearest you{{ areaSuffix }}, and show how deep the evidence goes instead of hiding it.
          </p>
        </div>

        <div class="seed-grid">
          <router-link
            v-for="(row, i) in topBlends"
            :key="row.blend.id"
            v-reveal="i"
            class="card card--link seed-card"
            :to="{ name: 'seed-blend', params: { id: row.blend.id } }"
          >
            <div class="seed-card__top">
              <span class="seed-card__rank">#{{ i + 1 }} for your area</span>
              <span class="chip chip--good">{{ row.fit.score }}</span>
            </div>
            <h3>{{ row.blend.name }}</h3>
            <p class="seed-card__label">
              {{ row.blend.manufacturer }} · {{ speciesLabel(row.blend.species) }}
            </p>
            <p class="seed-card__mix">
              <span v-for="name in mixNames(row.blend)" :key="name" class="seed-card__seed">
                {{ name }}
              </span>
            </p>
            <FitMeters :fit="row.fit" :baselines="row.baselines" :regional="regionalQuality" />
            <p class="seed-card__cov" :title="coverageTitle(row.fit.coverage)">
              <font-awesome-icon icon="fa-solid fa-check" />
              Scored on {{ coverageLabel(row.fit.coverage) }}
            </p>
          </router-link>
        </div>

        <p v-if="topCultivars.length" v-reveal="3" class="seed-note">
          Buying by cultivar instead? {{ cultivarCount.toLocaleString() }} named grasses are scored
          the same way — strongest near you right now are
          {{ topCultivars.map((c) => c.name).join(', ') }}.
        </p>

        <nav v-reveal="4" class="seed-links" aria-label="Seed sections">
          <router-link v-for="s in seedLinks" :key="s.label" class="seed-link" :to="s.to">
            {{ s.label }}
            <font-awesome-icon icon="fa-solid fa-arrow-right" />
          </router-link>
        </nav>
      </div>
    </section>

    <!-- FEATURE GRID -------------------------------------------------------->
    <section class="band band--tint-strong">
      <div class="band__inner container">
        <div v-reveal class="band__head band__head--center">
          <h2>Plus everything around it</h2>
        </div>
        <div class="feature-grid">
          <router-link
            v-for="(f, i) in features"
            :key="f.title"
            v-reveal="i"
            class="feature-card card--link"
            :to="f.to"
          >
            <span class="feature-card__icon">
              <font-awesome-icon :icon="f.icon" />
            </span>
            <span>
              <h3>{{ f.title }}</h3>
              <p>{{ f.body }}</p>
            </span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- CLOSING CTA --------------------------------------------------------->
    <section class="band band--dark on-dark">
      <div v-reveal class="band__inner container cta">
        <h2>Ready when you are.</h2>
        <p class="lede">Set your square footage and location. Everything else calculates itself.</p>
        <div class="cta__form">
          <LawnSize />
          <router-link class="btn btn--primary" to="/settings">
            My lawn
            <font-awesome-icon icon="fa-solid fa-arrow-right" />
          </router-link>
        </div>
        <p class="cta__note">
          Saved in this browser only — {{ profile.lawnName }} · {{ lawnSqFt.toLocaleString() }} sq
          ft
        </p>
      </div>
    </section>
  </div>
</template>
