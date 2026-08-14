<script lang="ts">
import BlendsPanel from './blends-panel.vue'
import CultivarsPanel from './cultivars-panel.vue'
import ComparePanel from './compare-panel.vue'
import NtepPanel from './ntep-panel.vue'
import { allCultivars, buildCultivarIndex } from '../data/seedDb'
import type { Blend, UserLocation } from '../types'

export default {
  name: 'Seeds',
  components: { BlendsPanel, CultivarsPanel, ComparePanel, NtepPanel },
  data() {
    return {
      tab: 'blends',
      tabs: [
        { id: 'blends', label: 'Blends to buy' },
        { id: 'cultivars', label: 'Cultivars' },
        { id: 'compare', label: 'Compare' },
        { id: 'data', label: 'NTEP tables' },
      ],
      selectedBlendId: 'resilience-ii',
      selectedCultivarId: '',
      compareIds: ['resilience-ii', 'optimum', 'kentucky-31'],
      cultivarIndex: buildCultivarIndex(),
    }
  },
  computed: {
    allBlends(): Blend[] {
      return this.$store.getters.allBlends
    },
    userLocation(): UserLocation | null {
      return this.$store.getters.userLocation
    },
    cultivarCount(): number {
      return allCultivars.length
    },
  },
  methods: {
    openCultivar(id: string) {
      this.selectedCultivarId = id
      this.tab = 'cultivars'
    },
  },
}
</script>

<style lang="scss">
.seeds {
  .seeds-hero {
    padding: clamp(2rem, 5vw, 3rem) 0 0.5rem;

    h1 {
      margin: 0 0 0.65rem;
      max-width: 20ch;
      font-size: clamp(1.7rem, 3.8vw, 2.5rem);
    }

    .lede {
      margin: 0 0 0.65rem;
      max-width: 44rem;
      color: var(--color-text-muted);
    }

    .meta {
      margin: 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  }

  .seeds__inner {
    padding-block: 1.25rem 3.5rem;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .tab {
    min-height: var(--input-height);
    padding: 0.4rem 0.95rem;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-text-muted);
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

  .toolbar input,
  .toolbar select,
  .compare-picks select {
    flex: 1 1 12rem;
    min-width: 12rem;
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

  .blend-card {
    padding: 1rem 1.1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);
    cursor: pointer;

    &.selected {
      border-color: var(--color-primary);
      box-shadow: var(--shadow), inset 0 0 0 1px var(--color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .blend-card__top {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    h3 {
      margin: 0 0 0.2rem;
      font-size: 1.15rem;
    }

    .mfr,
    p {
      margin: 0 0 0.35rem;
      font-size: 0.88rem;
      color: var(--color-text-muted);
    }

    .comps {
      font-size: 0.8rem !important;
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

    &.great,
    &.good {
      color: var(--color-success);
      background: var(--color-success-bg);
    }

    &.ok {
      color: var(--color-warning);
      background: var(--color-warning-bg);
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

    &.great,
    &.good {
      color: var(--color-success);
      background: var(--color-success-bg);
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

  .form-grid {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 0.85rem;

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .full {
      grid-column: 1 / -1;
    }
  }

  .comp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  .linkish {
    color: var(--color-primary-strong);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
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
    <header class="seeds-hero">
      <div class="seeds-hero__inner container">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-seedling" />
          Seed intel
        </p>
        <h1>What you can buy, scored for where you live.</h1>
        <p class="lede">
          Commercial blends ranked for your climate, plus the NTEP trial table behind every cultivar
          — charts, sortable stats, and the nearest site to you.
        </p>
        <p class="meta">
          {{ cultivarCount }} tall fescue cultivars · {{ allBlends.length }} blends
          <span v-if="userLocation"> · scoring for {{ userLocation.label || userLocation.city }}</span>
          <span v-else> · set a location on My lawn for local fit</span>
        </p>
      </div>
    </header>

    <div class="seeds__inner container">
      <div class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <BlendsPanel
        v-if="tab === 'blends'"
        :blends="allBlends"
        :cultivar-index="cultivarIndex"
        :user-location="userLocation"
        :selected-id="selectedBlendId"
        @select="selectedBlendId = $event"
        @open-cultivar="openCultivar"
      />
      <CultivarsPanel
        v-else-if="tab === 'cultivars'"
        :user-location="userLocation"
        :selected-id="selectedCultivarId"
        @select="selectedCultivarId = $event"
      />
      <ComparePanel
        v-else-if="tab === 'compare'"
        :blends="allBlends"
        :cultivar-index="cultivarIndex"
        :user-location="userLocation"
        :ids="compareIds"
        @update:ids="compareIds = $event"
      />
      <NtepPanel v-else :user-location="userLocation" />
    </div>
  </div>
</template>
