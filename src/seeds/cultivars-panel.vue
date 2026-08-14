<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import { ratingColor } from '../charts/bars'
import {
  allCultivars,
  isNamedCultivar,
  NTEP_METRICS,
  searchCultivars,
  siteCodesForMetric,
  siteLabel,
} from '../data/seedDb'
import { fitRank, nearestNtepSites, scoreCultivarForLocation } from '../services/suitability'
import { coverageTitle, FACTOR_LABELS, fitTone, fmtRating } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Cultivar, CultivarFit, NearbySite, UserLocation } from '../types'

const QUALITY_SITES = siteCodesForMetric('transitionQuality')

type SortKey = 'fit' | 'name' | 'named' | (typeof NTEP_METRICS)[number]['key']

export default {
  name: 'CultivarsPanel',
  components: { BarChart },
  props: {
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    selectedId: { type: String, default: '' },
  },
  emits: ['select'],
  data() {
    return {
      query: '',
      sortKey: 'fit' as SortKey,
      sortDir: 'desc' as 'asc' | 'desc',
      namedOnly: true,
    }
  },
  computed: {
    nearestSite(): NearbySite | null {
      if (!this.userLocation) return null
      return nearestNtepSites(this.userLocation.latitude, this.userLocation.longitude, 1, QUALITY_SITES)[0] || null
    },
    nearestSiteHeader(): string {
      return this.nearestSite ? `Nearest — ${this.nearestSite.name}` : 'Knoxville, TN'
    },
    cultivarCount(): number {
      return allCultivars.length
    },
    rows(): (Cultivar & { fit: CultivarFit | null; named: boolean })[] {
      const pool = this.namedOnly ? allCultivars.filter(isNamedCultivar) : allCultivars
      const list = searchCultivars(this.query, pool)
      const withFit = list.map((c) => ({
        ...c,
        named: isNamedCultivar(c),
        fit: scoreCultivarForLocation(c, this.userLocation),
      }))
      const dir = this.sortDir === 'asc' ? 1 : -1
      withFit.sort((a, b) => {
        if (this.sortKey === 'name') return dir * a.name.localeCompare(b.name)
        if (this.sortKey === 'named') return dir * (Number(a.named) - Number(b.named))
        if (this.sortKey === 'fit') {
          return dir * (fitRank(a.fit) - fitRank(b.fit))
        }
        const key = this.sortKey
        const av = key in (a.metrics || {}) ? a.metrics?.[key]?.mean || 0 : 0
        const bv = key in (b.metrics || {}) ? b.metrics?.[key]?.mean || 0 : 0
        return dir * (bv - av)
      })
      return withFit
    },
    selected(): (Cultivar & { fit: CultivarFit | null; named: boolean }) | null {
      return this.rows.find((r) => r.id === this.selectedId) || this.rows[0] || null
    },
    factorChart(): BarDatum[] {
      const parts = this.selected?.fit?.parts || []
      return parts.map((p) => ({
        label: FACTOR_LABELS[p.key],
        value: p.value,
        color: ratingColor(p.value),
      }))
    },
    siteChart(): BarDatum[] {
      const bySite = this.selected?.metrics?.transitionQuality?.bySite || {}
      return Object.entries(bySite)
        .map(([code, value]) => ({
          label: siteLabel(code),
          value,
          color: ratingColor(value),
        }))
        .sort((a, b) => b.value - a.value)
    },
  },
  methods: {
    coverageTitle,
    fitTone,
    fmtRating,
    nearestMetric(cultivar: Cultivar): number | null | undefined {
      const near = this.nearestSite
      if (!near) return cultivar.metrics?.knoxvilleQuality?.mean
      const siteVal = cultivar.metrics?.transitionQuality?.bySite?.[near.code]
      return siteVal ?? cultivar.metrics?.knoxvilleQuality?.mean
    },
    toggleSort(key: SortKey) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc'
        return
      }
      this.sortKey = key
      this.sortDir = key === 'name' ? 'asc' : 'desc'
    },
    sortMark(key: SortKey): string {
      if (this.sortKey !== key) return ''
      return this.sortDir === 'asc' ? ' ↑' : ' ↓'
    },
  },
}
</script>

<style lang="scss">
.cultivars-panel {
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .named-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .cultivar-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 1.25rem;
    align-items: start;

    @media (max-width: 1023px) {
      grid-template-columns: 1fr;
    }
  }

  .data-table-wrap {
    max-height: 38rem;
    overflow: auto;
  }

  .data-table tbody tr {
    cursor: pointer;

    &.selected {
      background: var(--color-primary-soft);
    }
  }

  .cultivar-detail {
    position: sticky;
    top: 5.5rem;
    display: grid;
    gap: 1rem;
  }
}
</style>

<template>
  <section class="cultivars-panel">
    <div class="toolbar">
      <input v-model="query" class="input" type="search" placeholder="Search cultivars…" />
      <label class="named-toggle">
        <input v-model="namedOnly" type="checkbox" />
        Named grasses only
      </label>
    </div>
    <p class="hint">
      Click a header to sort. Click a row for charts. Named grasses are ones you can usually ask a dealer for;
      experimental NTEP codes stay hidden unless you uncheck that filter.
    </p>

    <div class="cultivar-layout">
      <div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" @click="toggleSort('name')">Cultivar{{ sortMark('name') }}</th>
                <th class="sortable" @click="toggleSort('fit')">Area fit{{ sortMark('fit') }}</th>
                <th class="sortable" @click="toggleSort('transitionQuality')">
                  Transition{{ sortMark('transitionQuality') }}
                </th>
                <th>{{ nearestSiteHeader }}</th>
                <th class="sortable" @click="toggleSort('droughtQuality')">Drought{{ sortMark('droughtQuality') }}</th>
                <th class="sortable" @click="toggleSort('brownPatch')">Brown patch{{ sortMark('brownPatch') }}</th>
                <th class="sortable" @click="toggleSort('geneticColor')">Color{{ sortMark('geneticColor') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.id"
                :class="{ selected: selected?.id === row.id }"
                @click="$emit('select', row.id)"
              >
                <td>
                  <strong>{{ row.name }}</strong>
                </td>
                <td>
                  <span class="fit-cell">
                    <span class="fit-pill" :class="fitTone(row.fit?.score)">
                      {{ row.fit?.score ?? '—' }}
                    </span>
                    <span
                      v-if="row.fit?.coverage?.factors"
                      class="coverage"
                      :class="{ 'coverage--partial': !row.fit.coverage.complete }"
                      :title="coverageTitle(row.fit.coverage)"
                    >
                      {{ row.fit.coverage.factors }}/{{ row.fit.coverage.totalFactors }}
                    </span>
                  </span>
                </td>
                <td class="num">{{ fmtRating(row.metrics?.transitionQuality?.mean) }}</td>
                <td class="num">{{ fmtRating(nearestMetric(row)) }}</td>
                <td class="num">{{ fmtRating(row.metrics?.droughtQuality?.mean) }}</td>
                <td class="num">{{ fmtRating(row.metrics?.brownPatch?.mean) }}</td>
                <td class="num">{{ fmtRating(row.metrics?.geneticColor?.mean) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="hint">
          Showing {{ rows.length }} of {{ cultivarCount }} cultivars.
          The fraction under fit is how many of five rating factors had trial data.
        </p>
      </div>

      <aside v-if="selected" class="cultivar-detail">
        <div class="card">
          <p class="eyebrow">{{ selected.named ? 'Named cultivar' : 'Trial entry' }}</p>
          <h2>{{ selected.name }}</h2>
          <p v-if="selected.fit" class="fit" :class="fitTone(selected.fit.score)">
            {{ selected.fit.label }}
            <em v-if="selected.fit.score != null">{{ selected.fit.score }}</em>
          </p>
          <p class="hint">
            Ask a seed dealer for this name, or look for it on a bag tag. Experimental codes rarely show up in stores.
          </p>
        </div>
        <div v-if="factorChart.length" class="chart-panel">
          <h3 class="chart-panel__title">Why this fit score</h3>
          <p class="chart-panel__meta">The five factors, each on the NTEP 1–9 scale.</p>
          <BarChart :data="factorChart" :options="{ leftMargin: 150, rowHeight: 34 }" />
        </div>
        <div v-if="siteChart.length" class="chart-panel">
          <h3 class="chart-panel__title">Transition quality by site</h3>
          <p class="chart-panel__meta">2018–2023 NTEP regional turf quality.</p>
          <BarChart :data="siteChart" :options="{ leftMargin: 130, rowHeight: 30 }" />
        </div>
      </aside>
    </div>
  </section>
</template>
