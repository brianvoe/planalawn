<script lang="ts">
import SlimSelect from 'slim-select/vue'
import Calibrate from './calibrate.vue'
import LawnSize from '../components/lawn-size.vue'
import { spreaderOptions } from '../data/spreaders'
import { granularPlan, liquidPlan, spotMixOz } from '../services/apply'
import {
  convertVolume,
  formatVolume,
  measureAside,
  measureRange,
  measureText,
  measureUnit,
  perVolume,
  toGallons,
  volumeNoun,
  volumeText,
  volumeUnit,
} from '../services/units'
import type { PropType } from 'vue'
import type { SpreaderOption } from '../data/spreaders'
import type { GranularPlan, LiquidPlan } from '../services/apply'
import type { MeasureUnit, VolumeUnit } from '../services/units'
import type { GrassType, Product, SprayUnits } from '../types'

const TURF_NAMES: Record<GrassType, string> = {
  cool: 'cool-season',
  mixed: 'mixed cool-season',
  warm: 'warm-season',
}

/**
 * One product turned into instructions: what goes in the tank or hopper, how
 * far it goes, and what to buy.
 *
 * The label rate per 1,000 sq ft is the anchor. For a sprayer, fl oz per gallon
 * is derived from how much ground one tank covers, since that is what actually
 * decides the dose — the same tank over half the ground is double the rate.
 */
export default {
  name: 'ProductPlan',
  components: { Calibrate, LawnSize, SlimSelect },
  props: {
    product: { type: Object as PropType<Product>, required: true },
  },
  data() {
    return { showCalibrate: false }
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
    spreaderOptions(): SpreaderOption[] {
      return spreaderOptions('Pick your spreader…')
    },
    sprayUnits(): SprayUnits {
      return this.$store.getters.sprayUnits
    },
    /** The unit this product's dose is shown in — ml, g, fl oz or oz wt. */
    measure(): MeasureUnit {
      return measureUnit(this.product, this.sprayUnits)
    },
    /** Gallons or litres, for the tank and the water behind the dose. */
    vol(): VolumeUnit {
      return volumeUnit(this.sprayUnits)
    },
    volNoun(): string {
      return volumeNoun[this.vol]
    },
    /** The tank in whichever unit it's marked in; gallons stay canonical. */
    tankLocal: {
      get(): number {
        return Number(convertVolume(this.tankGallons, this.vol).toFixed(1))
      },
      set(v: number) {
        const gal = toGallons(Number(v) || 0, this.vol)
        this.$store.dispatch('updateEquipment', { tankGallons: gal || 2 })
      },
    },
    coverageLocal: {
      get(): number {
        return this.sprayCoverage
      },
      set(v: number) {
        this.$store.dispatch('updateEquipment', {
          sprayCoverageSqFtPerTank: Number(v) || 1000,
        })
      },
    },
    spreaderLocal: {
      get(): string {
        return this.spreaderId
      },
      set(v: string) {
        this.$store.dispatch('updateEquipment', { spreaderId: v })
      },
    },
    isLiquid(): boolean {
      return this.product.form === 'liquid'
    },
    liquid(): LiquidPlan {
      return liquidPlan({
        product: this.product,
        sqFt: this.lawnSqFt,
        tankGallons: this.tankGallons,
        coverageSqFtPerTank: this.sprayCoverage,
      })
    },
    granular(): GranularPlan {
      return granularPlan({
        product: this.product,
        sqFt: this.lawnSqFt,
        spreaderId: this.spreaderId,
      })
    },
    /** The tank's dose per gallon or per litre of the water it holds. */
    perTankPerVolume(): number {
      return perVolume(this.liquid.ozPerGallonInTank, this.vol)
    },
    /** The label's spot mix, as a dose per gallon or per litre of water. */
    spotMix(): string {
      const oz = spotMixOz(this.product, 1)
      if (oz == null) return ''
      return measureText(perVolume(oz, this.vol), this.measure)
    },
    /** A dry powder weighed on a scale, not poured — worth saying out loud. */
    byWeight(): boolean {
      return this.product.measure === 'oz wt'
    },
    grassType(): GrassType | '' {
      return this.$store.getters.grassType
    },
    /**
     * A warning when the label doesn't cover the grass you told us you have.
     *
     * Celsius on a fescue lawn kills the lawn, so this is the one place the page
     * should get loud rather than subtle.
     */
    turfWarning(): string {
      const turf = this.product.turf
      const mine = this.grassType
      if (!turf || !mine || turf.includes(mine)) return ''
      const labeled = turf.map((t) => TURF_NAMES[t]).join(' and ')
      return `Your lawn is set to ${TURF_NAMES[mine]}, and this label covers ${labeled} turf only.`
    },
    /** The label's own water volume, as a sentence about coverage per tank. */
    labelWaterNote(): string {
      const water = this.product.waterGalPer1000
      const range = this.liquid.labelCoverageSqFt
      if (!water || !range) return ''
      const span =
        water[0] === water[1]
          ? volumeText(water[0], this.vol)
          : `${formatVolume(convertVolume(water[0], this.vol), this.vol)}–${volumeText(water[1], this.vol)}`
      // One water volume on the label gives one coverage figure, not a range of
      // the same number twice.
      const low = Math.round(range[0])
      const high = Math.round(range[1])
      const covers =
        low === high ? low.toLocaleString() : `${low.toLocaleString()}–${high.toLocaleString()}`
      return `Label wants ${span} of water per 1,000 sq ft — that puts a ${volumeText(this.tankGallons, this.vol)} tank at ${covers} sq ft.`
    },
    rateLine(): string {
      const p = this.product
      if (this.isLiquid) {
        const range = p.ozPer1000Range
        const label = range ? ` (label range ${measureRange(range, this.measure)})` : ''
        return `${measureText(p.ozPer1000 || 0, this.measure)} per 1,000 sq ft${label}`
      }
      const range = p.lbPer1000Range
      return `${p.lbPer1000} lb per 1,000 sq ft${range ? ` (label range ${range[0]}–${range[1]})` : ''}`
    },
    waterInLine(): string {
      if (this.product.waterInNote) return this.product.waterInNote
      if (this.product.waterIn === 'yes') return 'Water in after applying.'
      if (this.product.waterIn === 'no') return 'Do not water in — leave it on the leaf.'
      if (this.product.waterIn === 'either') return 'Watering in is optional on this one.'
      return ''
    },
  },
  methods: {
    measureAside,
    measureText,
    volumeText,
    useLabelWater() {
      const range = this.liquid.labelCoverageSqFt
      if (!range) return
      // The heavier end of the label's water range: more water per 1,000 sq ft
      // is the safer place to be wrong on coverage.
      this.coverageLocal = Math.round(range[0] / 50) * 50
    },
  },
}
</script>

<style lang="scss">
.plan {
  .plan__inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.15rem;
    padding-bottom: 1.1rem;
    margin-bottom: 1.1rem;
    border-bottom: 1px solid var(--color-border);

    label {
      display: grid;
      gap: 0.3rem;
      min-width: 8.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input {
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

    .plan__spreader {
      min-width: 15rem;
    }
  }

  .plan__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .plan__stat {
    padding: 0.85rem 0.95rem;
    background: var(--color-surface-alt);
    border-radius: calc(var(--border-radius) * 1.5);

    span {
      display: block;
      margin-bottom: 0.3rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    strong {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-variant-numeric: tabular-nums;
      line-height: 1.15;
    }

    em {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.82rem;
      font-style: normal;
      line-height: 1.45;
      color: var(--color-text-muted);
    }

    &--headline {
      background: var(--color-primary-soft);

      strong {
        color: var(--color-primary-strong);
      }
    }

    &--unknown strong {
      font-size: 1rem;
      color: var(--color-text-muted);
    }
  }

  .plan__note {
    margin: 0.9rem 0 0;
    font-size: 0.84rem;
    line-height: 1.55;
    color: var(--color-text-muted);
  }

  .plan__warn {
    display: flex;
    gap: 0.55rem;
    margin: 1rem 0 0;
    padding: 0.7rem 0.85rem;
    font-size: 0.86rem;
    line-height: 1.5;
    background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
    border-left: 3px solid var(--color-danger);
    border-radius: var(--border-radius);

    svg {
      flex: 0 0 auto;
      width: 1em;
      height: 1em;
      margin-top: 0.2rem;
      color: var(--color-danger);
    }
  }

  .plan__facts {
    display: grid;
    gap: 0.3rem;
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
    color: var(--color-text-muted);

    li {
      display: flex;
      gap: 0.45rem;
    }

    svg {
      flex: 0 0 auto;
      width: 0.95em;
      height: 0.95em;
      margin-top: 0.25rem;
      color: var(--color-primary);
    }
  }

  .plan__calibrate {
    margin-top: 1rem;
  }
}
</style>

<template>
  <div class="plan">
    <div class="plan__inputs">
      <LawnSize />
      <template v-if="isLiquid">
        <label>
          <span>Tank size ({{ vol }})</span>
          <input v-model.number="tankLocal" type="number" min="0.5" step="0.5" />
        </label>
        <label>
          <span>Sq ft per tank</span>
          <input v-model.number="coverageLocal" type="number" min="50" step="50" />
        </label>
      </template>
      <label v-else class="plan__spreader">
        <span>Spreader</span>
        <SlimSelect
          v-model="spreaderLocal"
          :data="spreaderOptions"
          :settings="{ showSearch: false, allowDeselect: false }"
        />
      </label>
    </div>

    <!-- LIQUID ------------------------------------------------------------->
    <div v-if="isLiquid" class="plan__stats">
      <div class="plan__stat plan__stat--headline">
        <span>In your {{ volumeText(tankGallons, vol) }} tank</span>
        <strong>{{ measureText(liquid.perTankProductOz, measure) }}</strong>
        <em>
          {{ measureText(perTankPerVolume, measure) }} per {{ volNoun }} · covers
          {{ liquid.perTankCoverageSqFt.toLocaleString() }} sq ft
        </em>
      </div>
      <div class="plan__stat">
        <span>Whole lawn</span>
        <strong>{{ measureText(liquid.totalProductOz, measure) }}</strong>
        <em>
          <template v-if="measureAside(liquid.totalProductOz, measure)">
            {{ measureAside(liquid.totalProductOz, measure) }} ·
          </template>
          over {{ lawnSqFt.toLocaleString() }} sq ft
        </em>
      </div>
      <div class="plan__stat">
        <span>Tanks to mix</span>
        <strong>{{ liquid.tanks.toFixed(1) }}</strong>
        <em>{{ volumeText(liquid.totalWaterGal, vol) }} of water in total</em>
      </div>
    </div>

    <!-- GRANULAR ----------------------------------------------------------->
    <div v-else class="plan__stats">
      <div
        class="plan__stat plan__stat--headline"
        :class="{ 'plan__stat--unknown': !granular.setting }"
      >
        <span>Spreader setting</span>
        <template v-if="granular.setting">
          <strong>{{ granular.setting.setting }}</strong>
          <em>{{ granular.setting.note || 'As printed on the bag for this spreader.' }}</em>
        </template>
        <template v-else-if="granular.prohibited">
          <strong>Not this spreader</strong>
          <em>The label rules this spreader out for this product — use another one.</em>
        </template>
        <template v-else-if="spreaderId">
          <strong>Not published</strong>
          <em>No setting for this spreader on the bag — calibrate below instead of guessing.</em>
        </template>
        <template v-else>
          <strong>Pick your spreader</strong>
          <em>Settings are per model; there's no honest way to convert between dials.</em>
        </template>
      </div>
      <div class="plan__stat">
        <span>Whole lawn</span>
        <strong>{{ granular.totalLb.toFixed(1) }} lb</strong>
        <em>over {{ lawnSqFt.toLocaleString() }} sq ft</em>
      </div>
      <div class="plan__stat">
        <span>To buy</span>
        <template v-if="granular.bag">
          <strong>{{ granular.bag.count }} × {{ granular.bag.lb }} lb</strong>
          <em>each bag covers {{ granular.bag.coverageSqFt.toLocaleString() }} sq ft</em>
        </template>
        <template v-else>
          <strong>{{ granular.totalLb.toFixed(1) }} lb</strong>
          <em>Bag sizes vary — buy by weight.</em>
        </template>
      </div>
    </div>

    <p class="plan__note">{{ rateLine }}. {{ product.notes }}</p>
    <p v-if="labelWaterNote" class="plan__note">
      {{ labelWaterNote }}
      <button type="button" class="linkish" @click="useLabelWater">Use that</button>
    </p>

    <p v-if="turfWarning" class="plan__warn">
      <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
      <span>{{ turfWarning }} {{ product.grassNote }}</span>
    </p>

    <ul class="plan__facts">
      <li v-if="byWeight">
        <font-awesome-icon icon="fa-solid fa-scale-balanced" />
        <span>
          Measured by weight, not volume — this is a dry powder, so it wants a gram scale rather
          than a measuring cup.
        </span>
      </li>
      <li v-if="product.adjuvant">
        <font-awesome-icon icon="fa-solid fa-flask" />
        <span>{{ product.adjuvant }}</span>
      </li>
      <li v-if="spotMix">
        <font-awesome-icon icon="fa-solid fa-droplet" />
        <span>
          Spot spraying: {{ spotMix }} per {{ volNoun }} on the label — for touch-ups, not for
          covering the lawn.
        </span>
      </li>
      <li v-if="waterInLine">
        <font-awesome-icon icon="fa-solid fa-shower" />
        <span>{{ waterInLine }}</span>
      </li>
      <li v-if="product.reentry">
        <font-awesome-icon icon="fa-solid fa-clock" />
        <span>{{ product.reentry }}</span>
      </li>
      <li v-if="product.maxPerYear">
        <font-awesome-icon icon="fa-solid fa-calendar-day" />
        <span>{{ product.maxPerYear }}</span>
      </li>
      <li v-if="product.grassNote && !turfWarning">
        <font-awesome-icon :icon="['lawn', 'grass']" />
        <span>{{ product.grassNote }}</span>
      </li>
      <li v-if="product.labelUrl">
        <font-awesome-icon icon="fa-solid fa-file-lines" />
        <span>
          <a :href="product.labelUrl" target="_blank" rel="noopener">
            Read the label
            <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
          </a>
          — it governs, not this page.
        </span>
      </li>
    </ul>

    <div v-if="!isLiquid" class="plan__calibrate">
      <Calibrate
        v-if="!granular.setting && spreaderId && !granular.prohibited"
        :spreader-id="spreaderId"
        :target-per1000="product.lbPer1000 || 0"
      />
      <p v-else-if="granular.setting" class="plan__note">
        <button type="button" class="linkish" @click="showCalibrate = !showCalibrate">
          {{ showCalibrate ? 'Hide' : 'Check' }} the setting against a test strip
        </button>
      </p>
      <Calibrate
        v-if="granular.setting && showCalibrate"
        :spreader-id="spreaderId"
        :target-per1000="product.lbPer1000 || 0"
      />
    </div>
  </div>
</template>
