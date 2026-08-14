<script lang="ts">
import BarChart from '../components/bar-chart.vue'
import { ratingColor } from '../charts/bars'
import { coverageLabel, scoreBlendForLocation } from '../services/suitability'
import { CHANNEL_LABELS, coverageTitle, fitTone } from './fit-ui'
import type { PropType } from 'vue'
import type { BarDatum, Blend, BlendComponentFit, BlendFit, Cultivar, UserLocation } from '../types'

export default {
  name: 'BlendsPanel',
  components: { BarChart },
  props: {
    blends: { type: Array as PropType<Blend[]>, required: true },
    cultivarIndex: { type: Object as PropType<Record<string, Cultivar>>, required: true },
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    selectedId: { type: String, default: '' },
  },
  emits: ['select', 'open-cultivar'],
  data() {
    return {
      query: '',
      showForm: false,
      fitCache: {} as Record<string, BlendFit>,
      draft: {
        name: '',
        manufacturer: '',
        components: [
          { name: '', percent: null as number | null },
          { name: '', percent: null as number | null },
        ],
      },
    }
  },
  computed: {
    ranked(): { blend: Blend; fit: BlendFit | null; rank: number }[] {
      const q = this.query.trim().toLowerCase()
      const rows = this.blends
        .filter((b) => !q || `${b.name} ${b.manufacturer}`.toLowerCase().includes(q))
        .map((blend) => ({ blend, fit: this.fitFor(blend) }))
      rows.sort((a, b) => {
        const as = a.fit?.score
        const bs = b.fit?.score
        if (as == null && bs == null) return a.blend.name.localeCompare(b.blend.name)
        if (as == null) return 1
        if (bs == null) return -1
        return bs - as
      })
      return rows.map((row, i) => ({ ...row, rank: i + 1 }))
    },
    selectedBlend(): Blend | null {
      return this.blends.find((b) => b.id === this.selectedId) || this.ranked[0]?.blend || null
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
    traitChart(): BarDatum[] {
      const avg = this.selectedFit?.averages
      if (!avg) return []
      return [
        { label: 'Drought', value: avg.drought ?? 0, color: ratingColor(avg.drought) },
        { label: 'Brown patch', value: avg.brownPatch ?? 0, color: ratingColor(avg.brownPatch) },
        { label: 'Color', value: avg.color ?? 0, color: ratingColor(avg.color) },
      ].filter((d) => d.value > 0)
    },
    channelLabel(): string {
      const ch = this.selectedBlend?.channel
      return ch ? CHANNEL_LABELS[ch] : ''
    },
  },
  methods: {
    coverageLabel,
    coverageTitle,
    fitTone,
    channelFor(blend: Blend): string {
      return blend.channel ? CHANNEL_LABELS[blend.channel] : blend.curated ? 'Curated' : 'Yours'
    },
    fitFor(blend: Blend | null): BlendFit | null {
      if (!blend) return null
      const key = `${blend.id}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.fitCache[key]) {
        this.fitCache[key] = scoreBlendForLocation(blend, this.cultivarIndex, this.userLocation)
      }
      return this.fitCache[key]
    },
    saveDraft() {
      const components = this.draft.components
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          cultivarId: c.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          percent: c.percent || null,
        }))
      if (!this.draft.name || !components.length) return
      this.$store.dispatch('upsertUserBlend', {
        name: this.draft.name,
        manufacturer: this.draft.manufacturer || 'Custom',
        species: 'tall_fescue',
        summary: 'User-entered blend',
        components,
      })
      this.showForm = false
      this.draft = {
        name: '',
        manufacturer: '',
        components: [
          { name: '', percent: null },
          { name: '', percent: null },
        ],
      }
      this.fitCache = {}
    },
    removeBlend(id: string) {
      this.$store.dispatch('deleteUserBlend', id)
      this.fitCache = {}
    },
  },
}
</script>

<style lang="scss">
.blends-panel {
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .rank {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 1.25rem;

    @media (max-width: 1023px) {
      grid-template-columns: 1fr;
    }
  }

  .buy-hint {
    margin: 0.35rem 0 0;
    font-size: 0.9rem;
  }

  .chart-panel--stack {
    margin-top: 1rem;
  }
}
</style>

<template>
  <section class="blends-panel">
    <div class="toolbar">
      <input v-model="query" class="input" type="search" placeholder="Search blends…" />
      <button type="button" class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Close' : 'Add my bag' }}
      </button>
    </div>

    <p class="hint">
      Ranked for
      {{ userLocation?.label || userLocation?.city || 'national NTEP means (set a location for local fit)' }}.
      Bag formulas change — these are published labels we can map to the 2018–2023 tall fescue trial.
    </p>

    <div v-if="showForm" class="blend-form card">
      <h3>Add a blend from your bag label</h3>
      <div class="form-grid">
        <label>
          <span>Name</span>
          <input v-model="draft.name" class="input" type="text" />
        </label>
        <label>
          <span>Manufacturer</span>
          <input v-model="draft.manufacturer" class="input" type="text" />
        </label>
        <label class="full">
          <span>Components (name, optional %)</span>
          <div v-for="(row, i) in draft.components" :key="i" class="comp-row">
            <input v-model="row.name" class="input" type="text" placeholder="Cultivar name" />
            <input v-model.number="row.percent" class="input" type="number" min="0" max="100" placeholder="%" />
            <button type="button" class="linkish" @click="draft.components.splice(i, 1)">Remove</button>
          </div>
          <button type="button" class="btn btn--ghost" @click="draft.components.push({ name: '', percent: null })">
            + Cultivar
          </button>
        </label>
      </div>
      <button type="button" class="btn btn--primary" @click="saveDraft">Save to this browser</button>
    </div>

    <div class="card-grid">
      <article
        v-for="row in ranked"
        :key="row.blend.id"
        class="blend-card"
        :class="{ selected: selectedBlend?.id === row.blend.id }"
        @click="$emit('select', row.blend.id)"
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
        <p class="mfr">{{ row.blend.manufacturer }}</p>
        <p>{{ row.blend.summary || row.blend.profile }}</p>
        <p class="comps">
          {{ (row.blend.components || []).map((c) => c.name).join(' · ') }}
        </p>
      </article>
    </div>

    <div v-if="selectedBlend" class="detail card">
      <h2>{{ selectedBlend.name }}</h2>
      <p class="muted">
        {{ channelLabel }}
        <span v-if="selectedBlend.profile"> · {{ selectedBlend.profile }}</span>
      </p>
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
        <ul v-if="selectedFit.strengths?.length">
          <li v-for="s in selectedFit.strengths" :key="s">{{ s }}</li>
        </ul>
        <ul v-if="selectedFit.watchouts?.length" class="warn">
          <li v-for="w in selectedFit.watchouts" :key="w">{{ w }}</li>
        </ul>
      </div>

      <div class="detail-grid">
        <div>
          <h3>Cultivars in this blend</h3>
          <div class="comp-table">
            <div v-for="c in selectedComponents" :key="c.name" class="comp-line">
              <div>
                <button
                  v-if="c.cultivar"
                  type="button"
                  class="linkish"
                  @click="$emit('open-cultivar', c.cultivar.id)"
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
          <div v-if="traitChart.length" class="chart-panel chart-panel--stack">
            <h3 class="chart-panel__title">Blend trait averages</h3>
            <p class="chart-panel__meta">NTEP means across cultivars that have data.</p>
            <BarChart :data="traitChart" :options="{ leftMargin: 110, rowHeight: 36 }" />
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
