<script lang="ts">
import BlendsPanel from './blends-panel.vue'
import CultivarsPanel from './cultivars-panel.vue'
import ComparePanel from './compare-panel.vue'
import NtepPanel from './ntep-panel.vue'
import { cultivarCount, defaultSpeciesId, loadedSpecies } from '../data/seedDb'
import type { Blend, GrassType, UserLocation } from '../types'

const SECTIONS = [
  {
    id: 'blends',
    name: 'seed-blends',
    label: 'Blends',
    to: '/seeds/blends',
    icon: ['lawn', 'seed-bag'],
    blurb: 'Bags and sod you can buy, ranked for your climate.',
  },
  {
    id: 'cultivars',
    name: 'seed-cultivars',
    label: 'Cultivars',
    to: '/seeds/cultivars',
    icon: ['lawn', 'grass'],
    blurb: 'Named grasses from NTEP, scored for your area.',
  },
  {
    id: 'compare',
    name: 'seed-compare',
    label: 'Compare',
    to: '/seeds/compare',
    icon: ['fas', 'code-compare'],
    blurb: 'Put two or three blends side by side.',
  },
  {
    id: 'ntep',
    name: 'seed-ntep',
    label: 'NTEP tables',
    to: '/seeds/ntep',
    icon: ['fas', 'table'],
    blurb: 'Trial charts and sortable means, not bag copy.',
  },
] as const

export default {
  name: 'Seeds',
  components: { BlendsPanel, CultivarsPanel, ComparePanel, NtepPanel },
  props: {
    id: { type: String, default: '' },
    section: { type: String, default: '' },
  },
  data() {
    return {
      sections: SECTIONS,
      selectedCultivarId: '',
      compareIds: ['resilience-ii', 'optimum', 'kentucky-31'],
      speciesId: '',
    }
  },
  computed: {
    allBlends(): Blend[] {
      return this.$store.getters.allBlends
    },
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    grassType(): GrassType | null {
      return this.$store.getters.grassType
    },
    speciesOptions() {
      return loadedSpecies
    },
    /**
     * The species the panels are showing.
     *
     * A seed type from your profile beats the climate guess — someone with
     * bermuda in a transition zone told us so on purpose. Only species we hold
     * trial data for can lead, since the panels have nothing to draw otherwise.
     */
    activeSpecies(): string {
      if (this.speciesId) return this.speciesId
      const mine: string[] = this.$store.getters.seedSpecies
      const loaded = mine.find((id) => loadedSpecies.some((s) => s.id === id))
      return loaded || defaultSpeciesId(this.grassType)
    },
    cultivarCount(): number {
      return cultivarCount
    },
    isHub(): boolean {
      return !this.section && !this.id
    },
    isDetail(): boolean {
      return Boolean(this.id)
    },
    activeSection(): string {
      if (this.id) return 'blends'
      return this.section
    },
    showBlends(): boolean {
      return this.isHub || this.activeSection === 'blends'
    },
  },
  methods: {
    openCultivar(cultivarId: string, species?: string) {
      if (species) this.speciesId = species
      this.selectedCultivarId = cultivarId
      this.$router.push({ name: 'seed-cultivars' })
    },
  },
}
</script>

<style lang="scss">
.seeds {
  .seeds-hero {
    padding: 1.25rem 0 0;

    h1 {
      margin: 0 0 0.35rem;
      max-width: none;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .lede {
      margin: 0;
      max-width: 36rem;
      font-size: 0.92rem;
      color: var(--color-text-muted);
    }

    .meta {
      margin: 0.35rem 0 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
  }

  .dest-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
    margin-bottom: 1.75rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .dest-card {
    color: inherit;
    text-decoration: none;
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
  }

  .seeds-list-head {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
  }

  .seeds__inner {
    padding-block: 1.25rem 3.5rem;
  }

  .back {
    margin: 0 0 1rem;

    a {
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
    }
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    min-height: var(--input-height);
    padding: 0.4rem 0.95rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &.active {
      color: var(--color-white);
      background: var(--color-primary);
      border-color: var(--color-primary);
    }
  }

  .toolbar .input,
  .toolbar-control,
  .compare-picks .field {
    flex: 1 1 12rem;
    min-width: 12rem;
  }

  /* A toolbar dropdown that carries its own caption, so a row of selects does
     not leave the reader guessing what each one filters. */
  .toolbar-field {
    display: grid;
    flex: 1 1 10rem;
    gap: 0.3rem;
    min-width: 9.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .card {
    margin-bottom: 1rem;
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
    margin-bottom: 1.25rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;
  }

  .fit {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;

    em {
      font-style: normal;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }
  }

  .fit-box {
    display: grid;
    gap: 0.35rem;
    margin: 0.85rem 0 1rem;
    padding: 0.85rem 1rem;
    background: var(--color-surface-alt);
    border-radius: calc(var(--border-radius) * 1.5);

    ul {
      margin: 0.25rem 0 0;
      padding-left: 1.1rem;
    }

    .warn {
      color: var(--color-warning);
    }
  }

  .comp-line {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--color-border);

    .missing {
      font-style: italic;
      color: var(--color-text-muted);
    }
  }

  .fit-mini {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .fit-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .fit-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    background: var(--color-bg-soft);
    border-radius: 999px;
  }

  /* One ranked scale behind every score badge on these pages.
     Four steps that differ in fill as well as hue, so the ranking survives for
     anyone who reads green and amber the same way: only the top step is
     filled, and each softer step carries a matching hairline. An unscored bag
     is neutral and dashed on purpose — a missing trial must never read as a
     bad rating, which is what the old shared gray did. */
  .fit,
  .fit-pill {
    border: 1px solid transparent;

    &.great {
      color: var(--color-white);
      background: var(--color-success);
    }

    &.good {
      color: var(--color-success);
      background: var(--color-success-bg);
      border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
    }

    &.ok {
      color: var(--color-warning);
      background: var(--color-warning-bg);
      border-color: color-mix(in srgb, var(--color-warning) 30%, transparent);
    }

    &.low {
      color: var(--color-danger);
      background: var(--color-danger-bg);
      border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
    }

    &.unk {
      color: var(--color-text-muted);
      background: transparent;
      border-style: dashed;
      border-color: var(--color-border);
    }
  }

  .coverage {
    font-size: 0.7rem;
    font-style: normal;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    white-space: nowrap;
    cursor: help;

    &--partial {
      font-weight: 600;
      color: var(--color-warning);
    }
  }

  .muted {
    color: var(--color-text-muted);
  }

  .mfr {
    margin: 0 0 0.35rem;
    font-size: 0.88rem;
    color: var(--color-text-muted);
  }
}
</style>

<template>
  <div class="seeds">
    <header v-if="isHub" class="seeds-hero">
      <div class="seeds-hero__inner container">
        <p class="eyebrow">
          <font-awesome-icon :icon="['lawn', 'seed']" />
          Seed intel
        </p>
        <h1>Seeds</h1>
        <p class="lede">
          Match a bag or cultivar to your climate with NTEP trial scores — not bag marketing.
        </p>
        <p class="meta">
          {{ cultivarCount }} NTEP cultivars · {{ allBlends.length }} blends
          <span v-if="userLocation"> · {{ userLocation.label || userLocation.city }}</span>
        </p>
      </div>
    </header>

    <div class="seeds__inner container">
      <p v-if="isDetail" class="back">
        <router-link :to="{ name: 'seed-blends' }">← All blends</router-link>
      </p>
      <p v-else-if="!isHub" class="back">
        <router-link :to="{ name: 'seeds' }">← Seeds</router-link>
      </p>

      <div v-if="isHub" class="dest-grid">
        <router-link v-for="s in sections" :key="s.id" class="feature-card dest-card" :to="s.to">
          <span class="feature-card__icon">
            <font-awesome-icon :icon="s.icon" />
          </span>
          <span>
            <h3>{{ s.label }}</h3>
            <p>{{ s.blurb }}</p>
          </span>
        </router-link>
      </div>

      <div v-else-if="!isDetail" class="tabs" role="tablist">
        <router-link
          v-for="s in sections"
          :key="s.id"
          class="tab"
          :class="{ active: activeSection === s.id }"
          :to="s.to"
        >
          {{ s.label }}
        </router-link>
      </div>

      <h2 v-if="isHub" class="seeds-list-head">Best for your area</h2>

      <BlendsPanel
        v-if="showBlends"
        :blends="allBlends"
        :user-location="userLocation"
        :blend-id="id"
        @open-cultivar="openCultivar"
      />
      <CultivarsPanel
        v-else-if="activeSection === 'cultivars'"
        :species-id="activeSpecies"
        :species-options="speciesOptions"
        :user-location="userLocation"
        :selected-id="selectedCultivarId"
        @select="selectedCultivarId = $event"
        @update:species-id="speciesId = $event"
      />
      <ComparePanel
        v-else-if="activeSection === 'compare'"
        :blends="allBlends"
        :user-location="userLocation"
        :ids="compareIds"
        @update:ids="compareIds = $event"
      />
      <NtepPanel
        v-else-if="activeSection === 'ntep'"
        :species-id="activeSpecies"
        :species-options="speciesOptions"
        :user-location="userLocation"
        @update:species-id="speciesId = $event"
      />
    </div>
  </div>
</template>
