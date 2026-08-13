<template>
  <div class="seeds">
    <header class="seeds-hero">
      <div class="seeds-hero__inner">
        <p class="eyebrow">
          <AppIcon name="sprout" />
          Seed intel
        </p>
        <h1>Pick seed on evidence.</h1>
        <p class="lede">
          Blends and cultivars scored against the NTEP trial sites nearest you.
        </p>
        <p class="meta">
          {{ cultivarCount }} tall fescue cultivars · {{ blends.length }} blends
          <span v-if="userLocation"> · scoring for {{ userLocation.label || userLocation.city }}</span>
        </p>
      </div>
    </header>

    <div class="seeds__inner">
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

      <!-- BLENDS -->
      <section v-if="tab === 'blends'" class="panel">
        <div class="toolbar">
          <input v-model="blendQuery" type="search" placeholder="Search blends…" />
          <button type="button" class="btn" @click="showBlendForm = !showBlendForm">
            {{ showBlendForm ? 'Close' : 'Add my blend' }}
          </button>
        </div>

        <div v-if="showBlendForm" class="blend-form card">
          <h3>Add a blend from your bag label</h3>
          <div class="form-grid">
            <label>
              <span>Name</span>
              <input v-model="draft.name" type="text" />
            </label>
            <label>
              <span>Manufacturer</span>
              <input v-model="draft.manufacturer" type="text" />
            </label>
            <label class="full">
              <span>Components (name, optional %)</span>
              <div v-for="(row, i) in draft.components" :key="i" class="comp-row">
                <input v-model="row.name" type="text" placeholder="Cultivar name" />
                <input v-model.number="row.percent" type="number" min="0" max="100" placeholder="%" />
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
            v-for="b in filteredBlends"
            :key="b.id"
            class="blend-card"
            :class="{ selected: selectedBlendId === b.id }"
            @click="selectBlend(b.id)"
          >
            <div class="blend-card__top">
              <span class="tag">{{ b.curated ? 'Curated' : 'Yours' }}</span>
              <span v-if="fitFor(b)" class="fit" :class="fitClass(fitFor(b).score)">
                {{ fitFor(b).label }}
                <em v-if="fitFor(b).score != null">{{ fitFor(b).score }}</em>
              </span>
            </div>
            <h3>{{ b.name }}</h3>
            <p class="mfr">{{ b.manufacturer }}</p>
            <p>{{ b.summary || b.profile }}</p>
            <p class="comps">
              {{ (b.components || []).map((c) => c.name).join(' · ') }}
            </p>
          </article>
        </div>

        <div v-if="selectedBlend" class="detail card">
          <h2>{{ selectedBlend.name }}</h2>
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

          <h3>Cultivars in this blend</h3>
          <div class="comp-table">
            <div v-for="c in selectedFit?.components || selectedBlend.components" :key="c.name" class="comp-line">
              <div>
                <strong>{{ c.name }}</strong>
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

      <!-- CULTIVARS -->
      <section v-if="tab === 'cultivars'" class="panel">
        <div class="toolbar">
          <input v-model="cultQuery" type="search" placeholder="Search cultivars…" />
          <select v-model="sortKey">
            <option value="fit">Best for my area</option>
            <option value="name">Name</option>
            <option value="transition">Transition quality</option>
            <option value="drought">Drought</option>
            <option value="brownPatch">Brown patch</option>
          </select>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cultivar</th>
                <th>Area fit</th>
                <th>Transition</th>
                <th>{{ nearestSiteHeader }}</th>
                <th>Drought</th>
                <th>Brown patch</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in cultivarRows" :key="row.id">
                <td><strong>{{ row.name }}</strong></td>
                <td>
                  <span class="fit-cell">
                    <span class="fit-pill" :class="fitClass(row.fit?.score)">
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
                <td class="num">{{ fmt(row.metrics?.transitionQuality?.mean) }}</td>
                <td class="num">{{ fmt(nearestMetric(row)) }}</td>
                <td class="num">{{ fmt(row.metrics?.droughtQuality?.mean) }}</td>
                <td class="num">{{ fmt(row.metrics?.brownPatch?.mean) }}</td>
                <td class="num">{{ fmt(row.metrics?.geneticColor?.mean) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="hint">
          Showing {{ cultivarRows.length }} of {{ cultivarCount }} (search to narrow).
          The fraction under each fit score is how many of the five rating factors had
          trial data — <strong>4/5</strong> means the score rests on less evidence than
          <strong>5/5</strong>, not that the grass is worse.
        </p>
      </section>

      <!-- COMPARE -->
      <section v-if="tab === 'compare'" class="panel">
        <p class="hint">Pick up to 3 blends to compare for your location.</p>
        <div class="compare-picks">
          <label v-for="slot in 3" :key="slot">
            <span>Blend {{ slot }}</span>
            <select v-model="compareIds[slot - 1]">
              <option value="">—</option>
              <option v-for="b in blends" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </label>
        </div>
        <div class="compare-grid">
          <div v-for="b in compareBlends" :key="b.id" class="card">
            <h3>{{ b.name }}</h3>
            <p class="fit" :class="fitClass(fitFor(b)?.score)">
              {{ fitFor(b)?.label }}
              <strong v-if="fitFor(b)?.score">{{ fitFor(b).score }}</strong>
            </p>
            <ul>
              <li v-for="s in fitFor(b)?.strengths || []" :key="s">{{ s }}</li>
            </ul>
            <ul class="warn">
              <li v-for="w in fitFor(b)?.watchouts || []" :key="w">{{ w }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- DATA -->
      <section v-if="tab === 'data'" class="panel card">
        <h2>NTEP data coverage</h2>
        <p>
          Source: {{ ntepMeta.sourcePdf }} ({{ ntepMeta.trial }}, {{ ntepMeta.year }}).
          Parsed high-value tables only — regional turf quality, genetic color, brown patch, drought.
        </p>
        <h3>Species roadmap</h3>
        <ul>
          <li v-for="s in speciesList" :key="s.id">
            <strong>{{ s.label }}</strong>
            — {{ s.ntepTrials?.length ? `loaded (${s.ntepTrials.join(', ')})` : s.status || 'pending ingest' }}
          </li>
        </ul>
        <p class="hint">
          Re-run ingest:
          <code>.venv/bin/python scripts/ntep/ingest_pdf.py --pdf path/to/report.pdf</code>
        </p>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppIcon from '../components/ui/AppIcon.vue'
import {
  allCultivars,
  buildCultivarIndex,
  ntepMeta,
  searchCultivars,
  siteCodesForMetric,
  speciesList,
} from '../data/seedDb'
import {
  scoreBlendForLocation,
  scoreCultivarForLocation,
  nearestNtepSites,
  coverageLabel,
  fitRank,
} from '../services/suitability'

// The quality column reports a single trial site's rating, so the site it names
// must be one that measured turf quality — not merely the closest trial site.
const QUALITY_SITES = siteCodesForMetric('transitionQuality')

const FACTOR_LABELS = {
  nearest: 'nearest trial site',
  region: 'regional quality',
  summerStress: 'drought / brown patch',
  color: 'genetic color',
  national: 'national mean',
}

export default {
  name: 'SeedsView',
  components: { AppIcon },
  data() {
    return {
      tab: 'blends',
      tabs: [
        { id: 'blends', label: 'Blends' },
        { id: 'cultivars', label: 'Cultivars' },
        { id: 'compare', label: 'Compare' },
        { id: 'data', label: 'NTEP data' },
      ],
      blendQuery: '',
      cultQuery: '',
      sortKey: 'fit',
      selectedBlendId: 'calypsow',
      showBlendForm: false,
      compareIds: ['calypsow', 'resilience-ii', ''],
      draft: {
        name: '',
        manufacturer: '',
        components: [
          { name: '', percent: null },
          { name: '', percent: null },
        ],
      },
      cultivarIndex: buildCultivarIndex(),
      ntepMeta,
      speciesList,
      fitCache: {},
    }
  },
  computed: {
    ...mapGetters(['allBlends', 'userLocation']),
    blends() {
      return this.allBlends
    },
    cultivarCount() {
      return allCultivars.length
    },
    /**
     * Closest trial site with quality ratings, or null when no location is set.
     */
    nearestSite() {
      if (!this.userLocation) return null
      return (
        nearestNtepSites(
          this.userLocation.latitude,
          this.userLocation.longitude,
          1,
          QUALITY_SITES,
        )[0] || null
      )
    },
    /**
     * Names the site the column's numbers actually come from. Without a
     * location we fall back to the Knoxville trial, so say so rather than
     * implying the figure is local to the reader.
     */
    nearestSiteHeader() {
      return this.nearestSite ? `Nearest — ${this.nearestSite.name}` : 'Knoxville, TN (default)'
    },
    filteredBlends() {
      const q = this.blendQuery.trim().toLowerCase()
      if (!q) return this.blends
      return this.blends.filter((b) =>
        `${b.name} ${b.manufacturer}`.toLowerCase().includes(q),
      )
    },
    selectedBlend() {
      return this.blends.find((b) => b.id === this.selectedBlendId) || null
    },
    selectedFit() {
      return this.selectedBlend ? this.fitFor(this.selectedBlend) : null
    },
    cultivarRows() {
      let list = searchCultivars(this.cultQuery, allCultivars)
      const withFit = list.map((c) => ({
        ...c,
        fit: this.userLocation ? scoreCultivarForLocation(c, this.userLocation) : null,
      }))
      withFit.sort((a, b) => {
        if (this.sortKey === 'name') return a.name.localeCompare(b.name)
        if (this.sortKey === 'fit') {
          const diff = fitRank(b.fit) - fitRank(a.fit)
          // Fall back to the raw score so ordering stays stable within a tie.
          return diff !== 0 ? diff : (b.fit?.score || 0) - (a.fit?.score || 0)
        }
        if (this.sortKey === 'transition') {
          return (b.metrics?.transitionQuality?.mean || 0) - (a.metrics?.transitionQuality?.mean || 0)
        }
        if (this.sortKey === 'drought') {
          return (b.metrics?.droughtQuality?.mean || 0) - (a.metrics?.droughtQuality?.mean || 0)
        }
        if (this.sortKey === 'brownPatch') {
          return (b.metrics?.brownPatch?.mean || 0) - (a.metrics?.brownPatch?.mean || 0)
        }
        return 0
      })
      return withFit.slice(0, 80)
    },
    compareBlends() {
      return this.compareIds.map((id) => this.blends.find((b) => b.id === id)).filter(Boolean)
    },
  },
  methods: {
    fitFor(blend) {
      if (!blend) return null
      const key = `${blend.id}:${this.userLocation?.latitude}:${this.userLocation?.longitude}`
      if (!this.fitCache[key]) {
        this.fitCache[key] = scoreBlendForLocation(
          blend,
          this.cultivarIndex,
          this.userLocation,
        )
      }
      return this.fitCache[key]
    },
    fitClass(score) {
      if (score == null) return 'unk'
      if (score >= 6.6) return 'great'
      if (score >= 6.2) return 'good'
      if (score >= 5.8) return 'ok'
      return 'low'
    },
    coverageLabel,
    coverageTitle(coverage) {
      if (!coverage) return ''
      if (coverage.complete) return 'Scored on all five factors.'
      const missing = coverage.missing.map((k) => FACTOR_LABELS[k] || k).join(', ')
      return `Scored on ${coverageLabel(coverage)}. No trial data for: ${missing}.`
    },
    selectBlend(id) {
      this.selectedBlendId = id
    },
    fmt(v) {
      return typeof v === 'number' ? v.toFixed(1) : '—'
    },
    nearestMetric(cultivar) {
      const near = this.nearestSite
      if (!near) return cultivar.metrics?.knoxvilleQuality?.mean
      const siteVal = cultivar.metrics?.transitionQuality?.bySite?.[near.code]
      return siteVal ?? cultivar.metrics?.knoxvilleQuality?.mean
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
      this.showBlendForm = false
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
    removeBlend(id) {
      this.$store.dispatch('deleteUserBlend', id)
      if (this.selectedBlendId === id) this.selectedBlendId = 'calypsow'
      this.fitCache = {}
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.seeds-hero {
  padding: clamp(2rem, 5vw, 3rem) 0 0.5rem;

  &__inner {
    @include container;
  }

  h1 {
    margin: 0 0 0.65rem;
    font-size: clamp(1.7rem, 3.8vw, 2.5rem);
    max-width: 18ch;
  }

  .lede {
    margin: 0 0 0.65rem;
    color: $color-ink-muted;
    max-width: 44rem;
  }

  .meta {
    margin: 0;
    font-size: 0.85rem;
    color: $color-ink-muted;
  }
}

.seeds__inner {
  @include container;
  padding-block: 1.25rem 3.5rem;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.tab {
  @include tap-target;
  border: 1px solid $color-border-strong;
  background: $color-surface;
  border-radius: $radius-pill;
  padding: 0.4rem 0.95rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  color: $color-ink-muted;

  &:focus-visible {
    @include focus-ring;
  }

  &.active {
    background: $brand;
    border-color: $brand;
    color: #fff;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1rem;

  input,
  select {
    @include tap-target;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;
    min-width: 12rem;
    flex: 1 1 12rem;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
  }
}

.card {
  margin-bottom: 1rem;
}

.card-grid {
  display: grid;
  gap: 0.85rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}

.blend-card {
  @include card;
  padding: 1rem 1.1rem;
  cursor: pointer;

  &.selected {
    border-color: $brand;
    box-shadow: inset 0 0 0 1px $brand;
  }

  &:focus-visible {
    @include focus-ring;
  }

  &__top {
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
    color: $color-ink-muted;
    font-size: 0.88rem;
  }

  .comps {
    font-size: 0.8rem !important;
  }
}

.tag {
  @include label-badge;
  background: $status-neutral-soft;
  color: $status-neutral;
  font-size: 0.68rem;
}

// Suitability badge. `unk` and `low` stay neutral rather than red on purpose:
// absent trial data is not evidence of a bad cultivar (README principle 4).
.fit {
  @include label-badge;
  font-size: 0.72rem;
  gap: 0.35rem;
  background: $status-neutral-soft;
  color: $status-neutral;

  em {
    font-style: normal;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  &.great,
  &.good {
    background: $status-good-soft;
    color: $status-good;
  }

  &.ok {
    background: $status-caution-soft;
    color: $status-caution;
  }
}

.fit-box {
  background: $color-surface-sunken;
  border-radius: $radius-md;
  padding: 0.85rem 1rem;
  margin: 0.85rem 0 1rem;
  display: grid;
  gap: 0.35rem;

  ul {
    margin: 0.25rem 0 0;
    padding-left: 1.1rem;
  }

  .warn {
    color: $status-caution;
  }
}

.comp-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid $color-border-soft;
  font-size: 0.9rem;

  .missing {
    color: $status-neutral;
    font-style: italic;
  }
}

.fit-mini {
  font-size: 0.8rem;
  color: $color-ink-muted;
  white-space: nowrap;
}

.fit-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.fit-pill {
  @include label-badge;
  font-variant-numeric: tabular-nums;
  background: $status-neutral-soft;
  color: $status-neutral;

  &.great,
  &.good {
    background: $status-good-soft;
    color: $status-good;
  }
}

// Coverage is always present so a score is never read without knowing how much
// evidence sits behind it. Quiet by default; amber only when evidence is
// actually missing, so full coverage does not read as a warning.
.coverage {
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 500;
  color: $status-neutral;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: help;

  &--partial {
    color: $status-caution;
    font-weight: 600;
  }
}

.muted {
  color: $color-ink-muted;
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
    color: $color-ink-muted;
  }

  input {
    @include tap-target;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
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
  border: none;
  background: none;
  text-decoration: underline;
  cursor: pointer;
  color: $color-ink-muted;
}

.compare-picks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;

  label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: $color-ink-muted;
  }

  select {
    @include tap-target;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;
    min-width: 12rem;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
  }
}

.compare-grid {
  display: grid;
  gap: 0.85rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }

  ul {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
    font-size: 0.88rem;
  }

  .warn {
    color: $status-caution;
  }
}

code {
  font-size: 0.8rem;
}
</style>
