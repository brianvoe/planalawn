<script lang="ts">
import ProductPlan from './product-plan.vue'
import MixCalculator from './mix-calculator.vue'
import { products } from '../data/products'
import { spreaderName } from '../data/spreaders'
import { tasks } from '../data/tasks'
import { evaluateAllTasks } from '../services/timing'
import { granularPlan, liquidPlan } from '../services/apply'
import { measureText, measureUnit, volumeText, volumeUnit } from '../services/units'
import type { PropType } from 'vue'
import type { VolumeUnit } from '../services/units'
import type { Bucket, Conditions as Weather, Product, SprayUnits } from '../types'

type FormFilter = 'all' | 'liquid' | 'granular'

/** Only the dose. The tank keeps whatever it is marked in, set under My lawn. */
const UNIT_CHOICES: { text: string; value: SprayUnits; title: string }[] = [
  { text: 'fl oz', value: 'us', title: 'Measure the product in fluid ounces' },
  { text: 'ml', value: 'metric', title: 'Measure the product in millilitres' },
]

interface Row {
  product: Product
  /** Task driving this product to the top, when one is due. */
  dueTask: { id: string; name: string; bucket: Bucket } | null
  headline: string
  detail: string
}

const FORM_FILTERS: { text: string; value: FormFilter }[] = [
  { text: 'Everything', value: 'all' },
  { text: 'Sprayer', value: 'liquid' },
  { text: 'Spreader', value: 'granular' },
]

const TASK_NAMES: Record<string, string> = Object.fromEntries(tasks.map((t) => [t.id, t.name]))

/** Order buckets put products in: what's due beats what's interesting. */
const BUCKET_RANK: Record<Bucket, number> = { now: 0, soon: 1, later: 2 }

export default {
  name: 'Apply',
  components: { MixCalculator, ProductPlan },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
  },
  data() {
    return {
      query: '',
      formFilter: 'all' as FormFilter,
      formFilters: FORM_FILTERS,
      unitChoices: UNIT_CHOICES,
      taskFilter: '',
      openId: '',
    }
  },
  created() {
    // Arriving from a task page means "show me what goes down for this job".
    const fromTask = this.$router.currentRoute.value.query.task
    if (typeof fromTask === 'string') this.taskFilter = fromTask
  },
  computed: {
    lawnSqFt(): number {
      return this.$store.getters.lawnSqFt
    },
    tankGallons(): number {
      return this.$store.getters.tankGallons
    },
    sprayCoverage(): number {
      return this.$store.getters.sprayCoverage
    },
    spreaderId(): string {
      return this.$store.getters.spreaderId
    },
    spreaderLabel(): string {
      return spreaderName(this.spreaderId) || 'no spreader picked'
    },
    sprayUnits(): SprayUnits {
      return this.$store.getters.sprayUnits
    },
    vol(): VolumeUnit {
      return volumeUnit(this.$store.getters.volumeUnits)
    },
    tankLabel(): string {
      return volumeText(this.tankGallons, this.vol)
    },
    /** Task timing, so the list can lead with what the season is asking for. */
    buckets(): Record<string, Bucket> {
      const out: Record<string, Bucket> = {}
      evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F }).forEach((e) => {
        out[e.task.id] = e.bucket
      })
      return out
    },
    dueNames(): string[] {
      return tasks
        .filter((t) => this.buckets[t.id] === 'now' && this.productsForTask(t.id).length)
        .map((t) => t.name)
    },
    rows(): Row[] {
      const rows = products.map((product) => ({
        product,
        dueTask: this.dueTaskFor(product),
        headline: this.headlineFor(product),
        detail: this.detailFor(product),
      }))
      rows.sort((a, b) => {
        const ar = a.dueTask ? BUCKET_RANK[a.dueTask.bucket] : 3
        const br = b.dueTask ? BUCKET_RANK[b.dueTask.bucket] : 3
        if (ar !== br) return ar - br
        return a.product.name.localeCompare(b.product.name)
      })
      return rows
    },
    filtered(): Row[] {
      const q = this.query.trim().toLowerCase()
      return this.rows.filter((row) => {
        const p = row.product
        if (this.formFilter !== 'all' && p.form !== this.formFilter) return false
        if (this.taskFilter && !p.taskIds.includes(this.taskFilter)) return false
        if (!q) return true
        return [p.name, p.brand, p.active, p.purpose].join(' ').toLowerCase().includes(q)
      })
    },
    dueRows(): Row[] {
      return this.filtered.filter((r) => r.dueTask?.bucket === 'now')
    },
    restRows(): Row[] {
      return this.filtered.filter((r) => r.dueTask?.bucket !== 'now')
    },
    taskFilterName(): string {
      return TASK_NAMES[this.taskFilter] || ''
    },
  },
  methods: {
    taskName(id: string): string {
      return TASK_NAMES[id] || id
    },
    productsForTask(taskId: string): Product[] {
      return products.filter((p) => p.taskIds.includes(taskId))
    },
    /** The soonest task this product serves, which is why it ranks where it does. */
    dueTaskFor(product: Product): Row['dueTask'] {
      const ranked = product.taskIds
        .map((id) => ({
          id,
          name: this.taskName(id),
          bucket: this.buckets[id],
        }))
        .filter((t): t is { id: string; name: string; bucket: Bucket } => Boolean(t.bucket))
        .sort((a, b) => BUCKET_RANK[a.bucket] - BUCKET_RANK[b.bucket])
      const best = ranked[0]
      return best && best.bucket !== 'later' ? best : null
    },
    headlineFor(product: Product): string {
      if (product.form === 'liquid') {
        const plan = liquidPlan({
          product,
          sqFt: this.lawnSqFt,
          tankGallons: this.tankGallons,
          coverageSqFtPerTank: this.sprayCoverage,
        })
        return `${measureText(plan.perTankProductOz, measureUnit(product, this.sprayUnits))} per tank`
      }
      const plan = granularPlan({
        product,
        sqFt: this.lawnSqFt,
        spreaderId: this.spreaderId,
      })
      return `${plan.totalLb.toFixed(1)} lb for the lawn`
    },
    detailFor(product: Product): string {
      if (product.form === 'liquid') {
        const plan = liquidPlan({
          product,
          sqFt: this.lawnSqFt,
          tankGallons: this.tankGallons,
          coverageSqFtPerTank: this.sprayCoverage,
        })
        const total = measureText(plan.totalProductOz, measureUnit(product, this.sprayUnits))
        return `${total} total · ${plan.tanks.toFixed(1)} tanks`
      }
      const plan = granularPlan({
        product,
        sqFt: this.lawnSqFt,
        spreaderId: this.spreaderId,
      })
      if (plan.setting) return `Setting ${plan.setting.setting} on your ${this.spreaderLabel}`
      if (plan.prohibited) return `Not labeled for your ${this.spreaderLabel}`
      return this.spreaderId
        ? 'No published setting — calibrate'
        : 'Pick a spreader for the setting'
    },
    /** Sprayer or spreader, as the icon that says which one. */
    formIcon(product: Product): [string, string] {
      return product.form === 'liquid' ? ['fas', 'spray-can'] : ['lawn', 'granules']
    },
    setUnits(units: SprayUnits) {
      this.$store.dispatch('updateEquipment', { sprayUnits: units })
    },
    toggle(id: string) {
      this.openId = this.openId === id ? '' : id
    },
  },
}
</script>

<style lang="scss">
.apply-page {
  padding-bottom: 3rem;

  .page-header {
    padding: 1.5rem 0 0;

    h1 {
      margin: 0 0 0.4rem;
      font-size: clamp(1.6rem, 3.6vw, 2.1rem);
      letter-spacing: -0.03em;
    }

    .lede {
      max-width: 40rem;
      margin: 0;
      font-size: 0.98rem;
    }

    .apply-meta {
      margin: 0.6rem 0 0;
      font-size: 0.82rem;
      color: var(--color-text-muted);
    }
  }

  .apply-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.7rem;
    margin: 1.5rem 0 1rem;

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input[type='search'] {
      min-width: 14rem;
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  .group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
    margin: 1.6rem 0 0.75rem;

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .group-head__why {
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  }

  .prod {
    margin-bottom: 0.6rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 1.5);
    box-shadow: var(--shadow-sm);
    overflow: hidden;

    &--open {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }
  }

  .prod__button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: 0.85rem;
    width: 100%;
    padding: 0.85rem 1rem;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;

    /* Narrow: name and chevron on one line, then the chip, then the answer —
       flex rather than grid so a missing chip doesn't leave a hole. */
    @media (max-width: 767px) {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 0.85rem;

      .prod__icon {
        order: 1;
      }

      /* The floor is what pushes the task chip down to its own line instead of
         letting it squeeze the product name into one word per row. */
      .prod__text {
        order: 2;
        flex: 1 1 0;
        min-width: 12rem;
      }

      .prod__chev {
        order: 3;
      }

      .due-chip {
        order: 4;
      }

      .prod__answer {
        order: 5;
        flex: 1 1 100%;
        text-align: left;
      }
    }
  }

  .prod__icon {
    display: grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-radius: 10px;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  .prod__text {
    min-width: 0;

    strong {
      display: block;
      font-size: 0.98rem;
      line-height: 1.25;
    }

    small {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.82rem;
      line-height: 1.4;
      color: var(--color-text-muted);
    }
  }

  .prod__answer {
    text-align: right;

    strong {
      display: block;
      font-size: 0.92rem;
      font-variant-numeric: tabular-nums;
    }

    small {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }
  }

  .prod__chev {
    width: 0.8rem;
    height: 0.8rem;
    color: var(--color-text-muted);
    transition: transform 0.2s ease;

    &--open {
      transform: rotate(180deg);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .prod__body {
    padding: 1rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .due-chip {
    align-self: center;
    white-space: nowrap;
  }

  .fallback {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);

    h2 {
      margin: 0 0 0.35rem;
      font-size: 1.1rem;
    }

    .lede {
      margin: 0 0 1rem;
      font-size: 0.92rem;
    }
  }
}
</style>

<template>
  <div class="apply-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-flask" />
          Calculate
        </p>
        <h1>How much do I put down?</h1>
        <p class="lede">
          Pick the product you actually bought and get the number for your lawn — what goes in the
          tank, pounds in the hopper, and the spreader setting where the bag publishes one.
        </p>
        <p class="apply-meta">
          {{ lawnSqFt.toLocaleString() }} sq ft · {{ tankLabel }} tank ·
          {{ sprayCoverage.toLocaleString() }} sq ft per tank ·
          {{ spreaderLabel }}
        </p>
      </header>

      <div class="apply-toolbar">
        <label>
          <span>Search</span>
          <input v-model="query" type="search" placeholder="SpeedZone, prodiamine, GrubEx…" />
        </label>
        <div class="seg" role="group" aria-label="Filter by how it goes down">
          <button
            v-for="f in formFilters"
            :key="f.value"
            type="button"
            :class="{ active: formFilter === f.value }"
            @click="formFilter = f.value"
          >
            {{ f.text }}
          </button>
        </div>
        <div class="seg" role="group" aria-label="Units for liquid amounts">
          <button
            v-for="u in unitChoices"
            :key="u.value"
            type="button"
            :title="u.title"
            :class="{ active: sprayUnits === u.value }"
            @click="setUnits(u.value)"
          >
            {{ u.text }}
          </button>
        </div>
        <p v-if="taskFilter" class="hint">
          Showing products for {{ taskFilterName }} ·
          <button type="button" class="linkish" @click="taskFilter = ''">clear</button>
        </p>
      </div>

      <template v-if="dueRows.length">
        <div class="group-head">
          <h2>For what's due now</h2>
          <span class="group-head__why">{{ dueNames.join(' · ') }}</span>
        </div>
        <div
          v-for="row in dueRows"
          :key="row.product.id"
          class="prod"
          :class="{ 'prod--open': openId === row.product.id }"
        >
          <button type="button" class="prod__button" @click="toggle(row.product.id)">
            <span class="prod__icon">
              <font-awesome-icon :icon="formIcon(row.product)" />
            </span>
            <span class="prod__text">
              <strong>{{ row.product.name }}</strong>
              <small>{{ row.product.brand }} · {{ row.product.purpose }}</small>
            </span>
            <span
              v-if="row.dueTask"
              class="chip chip--good due-chip"
              :title="`${row.dueTask.name} is in its window now`"
            >
              {{ row.dueTask.name }}
            </span>
            <span class="prod__answer">
              <strong>{{ row.headline }}</strong>
              <small>{{ row.detail }}</small>
            </span>
            <font-awesome-icon
              class="prod__chev"
              :class="{ 'prod__chev--open': openId === row.product.id }"
              icon="fa-solid fa-chevron-down"
            />
          </button>
          <div v-if="openId === row.product.id" class="prod__body">
            <ProductPlan :product="row.product" />
          </div>
        </div>
      </template>

      <div class="group-head">
        <h2 v-if="dueRows.length">Everything else</h2>
        <h2 v-else>Products</h2>
        <span class="group-head__why">
          Rates are the label's; the arithmetic for your lawn is ours.
        </span>
      </div>

      <div
        v-for="row in restRows"
        :key="row.product.id"
        class="prod"
        :class="{ 'prod--open': openId === row.product.id }"
      >
        <button type="button" class="prod__button" @click="toggle(row.product.id)">
          <span class="prod__icon">
            <font-awesome-icon :icon="formIcon(row.product)" />
          </span>
          <span class="prod__text">
            <strong>{{ row.product.name }}</strong>
            <small>{{ row.product.brand }} · {{ row.product.purpose }}</small>
          </span>
          <span
            v-if="row.dueTask"
            class="chip chip--caution due-chip"
            :title="`${row.dueTask.name} is coming up`"
          >
            {{ row.dueTask.name }} soon
          </span>
          <span class="prod__answer">
            <strong>{{ row.headline }}</strong>
            <small>{{ row.detail }}</small>
          </span>
          <font-awesome-icon
            class="prod__chev"
            :class="{ 'prod__chev--open': openId === row.product.id }"
            icon="fa-solid fa-chevron-down"
          />
        </button>
        <div v-if="openId === row.product.id" class="prod__body">
          <ProductPlan :product="row.product" />
        </div>
      </div>

      <p v-if="!filtered.length" class="empty">
        Nothing matches. Try another search, or switch between sprayer and spreader.
      </p>

      <section class="fallback">
        <h2>Something not on the list?</h2>
        <p class="lede">
          Generic templates by product class, for a bottle we don't carry. Type in the rate from
          your own label and it does the same arithmetic.
        </p>
        <MixCalculator
          rate-key="glyphosate"
          :rate-keys="['glyphosate', 'broadleaf3way', 'twentyFourD', 'quinclorac']"
        />
      </section>
    </div>
  </div>
</template>
