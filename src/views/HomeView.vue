<template>
  <div class="home">
    <!-- HERO ---------------------------------------------------------------->
    <header class="hero">
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="eyebrow">
            <AppIcon name="thermometer" />
            Soil-temp aware
          </p>
          <h1>Know what to do next.</h1>
          <p class="hero__lede">
            Your soil temperature decides the timing. We read it, then tell you what to
            put down and how much.
          </p>
          <div class="hero__actions">
            <router-link class="btn btn--primary" to="/calendar">
              What’s next?
              <AppIcon name="arrow-right" />
            </router-link>
            <router-link class="btn" to="/settings">Set up my lawn</router-link>
          </div>
          <p class="hero__meta">
            Free · no account · {{ cultivarCount }} NTEP cultivars
          </p>
        </div>

        <!-- Live panel, floated over the band. Doubles as the real "do now"
             list, so the hero shows the actual product rather than a mockup. -->
        <div class="panel">
          <div class="panel__bar">
            <span class="panel__dots" aria-hidden="true"><i /><i /><i /></span>
            <span class="panel__title">Do now</span>
          </div>
          <div class="panel__body">
            <router-link
              v-for="item in nowItems.slice(0, 3)"
              :key="item.task.id"
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
              <AppIcon name="arrow-right" class="row__go" />
            </router-link>

            <p v-if="!nowItems.length" class="row row--empty">
              <AppIcon name="clock" />
              <span class="row__text">
                <strong>Nothing due right now</strong>
                <small>{{ soilSummary }}</small>
              </span>
            </p>

            <router-link class="panel__more" to="/calendar">
              Full calendar
              <AppIcon name="arrow-right" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- TIMING -------------------------------------------------------------->
    <section class="band band--tint">
      <div class="band__inner split">
        <div>
          <p class="eyebrow">
            <AppIcon name="calendar" />
            Timing
          </p>
          <h2>Soil temp beats the calendar.</h2>
          <p class="lede">
            Seed goes down when the ground is ready, not when the bag says September.
          </p>
          <ul class="checklist">
            <li v-for="point in timingPoints" :key="point">
              <AppIcon name="check" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <router-link class="btn btn--ghost inline-cta" to="/calendar">
            See my windows
            <AppIcon name="arrow-right" />
          </router-link>
        </div>

        <ConditionsBanner
          :conditions="conditions"
          :error="weatherError"
          :loading="weatherLoading"
          @refresh="$emit('refresh-weather')"
        />
      </div>
    </section>

    <!-- SEEDS --------------------------------------------------------------->
    <section class="band band--plain">
      <div class="band__inner">
        <div class="band__head">
          <p class="eyebrow">
            <AppIcon name="sprout" />
            Seed intel
          </p>
          <h2>Not bag marketing. Trial data.</h2>
          <p class="lede">
            Every cultivar scored against the nearest NTEP trial site to you — with the
            depth of evidence shown, never hidden.
          </p>
        </div>

        <div class="seed-grid">
          <router-link
            v-for="c in topCultivars"
            :key="c.id"
            class="card card--link seed-card"
            to="/seeds"
          >
            <div class="seed-card__top">
              <h3>{{ c.name }}</h3>
              <span class="chip chip--good">{{ c.fit.score }}</span>
            </div>
            <p class="seed-card__label">{{ c.fit.label }}</p>
            <p class="seed-card__cov">
              <AppIcon name="check" />
              All {{ c.fit.coverage.totalFactors }} factors measured
            </p>
          </router-link>
        </div>

        <router-link class="btn btn--ghost inline-cta" to="/seeds">
          Compare blends and cultivars
          <AppIcon name="arrow-right" />
        </router-link>
      </div>
    </section>

    <!-- FEATURE GRID -------------------------------------------------------->
    <section class="band band--tint-strong">
      <div class="band__inner">
        <div class="band__head band__head--center">
          <h2>Plus everything around it</h2>
        </div>
        <div class="feature-grid">
          <router-link
            v-for="f in features"
            :key="f.title"
            class="feature-card card--link"
            :to="f.to"
          >
            <span class="feature-card__icon"><AppIcon :name="f.icon" /></span>
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
      <div class="band__inner cta">
        <h2>Ready when you are.</h2>
        <p class="lede">
          Set your square footage and location. Everything else calculates itself.
        </p>
        <div class="cta__form">
          <LawnSizeInput />
          <router-link class="btn btn--primary" to="/settings">
            My lawn
            <AppIcon name="arrow-right" />
          </router-link>
        </div>
        <p class="cta__note">
          Saved in this browser only — {{ profile.lawnName }} ·
          {{ lawnSqFt.toLocaleString() }} sq ft
        </p>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import ConditionsBanner from '../components/layout/ConditionsBanner.vue'
import LawnSizeInput from '../components/layout/LawnSizeInput.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { evaluateAllTasks, groupByBucket } from '../services/timing'
import { allCultivars } from '../data/seedDb'
import { scoreCultivarForLocation } from '../services/suitability'

const FEATURES = [
  {
    icon: 'ruler',
    title: 'Rate calculator',
    body: 'Square feet in, pounds and bags out, per product.',
    to: '/tasks',
  },
  {
    icon: 'spray',
    title: 'Sprayer mixes',
    body: 'Tank size and coverage into an ounces-per-tank number.',
    to: '/sprayer',
  },
  {
    icon: 'tasks',
    title: 'Task playbooks',
    body: 'Kill, aerate, seed, topdress, fertilize, water — each with its own gate.',
    to: '/tasks',
  },
  {
    icon: 'chart',
    title: 'Trial charts',
    body: 'Quality, drought and brown patch ratings side by side.',
    to: '/seeds',
  },
  {
    icon: 'pin',
    title: 'Location aware',
    body: 'Your coordinates pick the climate band and nearest trial site.',
    to: '/settings',
  },
  {
    icon: 'save',
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

export default {
  name: 'HomeView',
  components: { ConditionsBanner, LawnSizeInput, AppIcon },
  props: {
    conditions: { type: Object, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return { features: FEATURES, timingPoints: TIMING_POINTS }
  },
  computed: {
    ...mapState(['profile']),
    ...mapGetters(['lawnSqFt']),
    nowItems() {
      const evaluated = evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
      return groupByBucket(evaluated).now
    },
    cultivarCount() {
      return allCultivars.length
    },
    soilSummary() {
      const soil = this.conditions?.soilTemp6F
      if (soil == null) return 'Set your location to get live soil temperature.'
      return `Soil is ${Math.round(soil)}°F — check what’s coming up.`
    },
    /**
     * Best-evidenced cultivars for this user, used as a concrete teaser.
     * Restricted to complete coverage so the home page never leads with a
     * score propped up by two data points.
     */
    topCultivars() {
      return allCultivars
        .map((c) => ({ ...c, fit: scoreCultivarForLocation(c, this.profile.location) }))
        .filter((c) => c.fit.score != null && c.fit.coverage.complete)
        .sort((a, b) => b.fit.score - a.fit.score)
        .slice(0, 3)
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

// --- Bands -----------------------------------------------------------------
.band {
  @include section;

  &__inner {
    @include container;
    position: relative;
  }

  &--plain {
    @include wave-top($layer-plain);
  }

  &--tint {
    @include wave-top($layer-tint);
  }

  &--tint-strong {
    @include wave-top($layer-tint-strong);
  }

  &--dark {
    @include wave-top($layer-dark);
    // The footer is the same fill and supplies its own top padding, so the
    // two would otherwise stack into a large dead gap.
    padding-block-end: clamp(1.25rem, 2.5vw, 2rem);
  }

  &__head {
    max-width: 40rem;
    margin-bottom: 2rem;

    &--center {
      margin-inline: auto;
      text-align: center;
    }
  }

  h2 {
    @include section-heading;
  }
}

.lede {
  @include section-lede;
}

.inline-cta {
  margin-top: 1.4rem;
  padding-inline: 0;
}

// --- Hero ------------------------------------------------------------------
.hero {
  background: $layer-plain;
  padding-block: clamp(2.5rem, 6vw, 4.5rem) clamp(3rem, 6vw, 5rem);

  &__inner {
    @include container;
    display: grid;
    gap: clamp(2rem, 5vw, 3.5rem);
    align-items: center;

    @media (min-width: $bp-lg) {
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
    }
  }

  h1 {
    margin: 0 0 0.9rem;
    font-family: $font-display;
    font-size: clamp(2.3rem, 5.8vw, 3.75rem);
    font-weight: $font-weight-display;
    line-height: 1.02;
    letter-spacing: -0.04em;
    color: $color-ink;
  }

  &__lede {
    @include section-lede;
    font-size: 1.15rem;
    max-width: 34rem;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.6rem;
  }

  &__meta {
    margin: 1rem 0 0;
    font-size: 0.85rem;
    color: $color-ink-muted;
  }
}

// --- Hero panel ------------------------------------------------------------
// The one element allowed to float above the page.
.panel {
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  background: $color-surface;
  box-shadow: $shadow-panel;
  overflow: hidden;

  &__bar {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.9rem;
    background: $color-surface-sunken;
    border-bottom: 1px solid $color-border;
  }

  &__dots {
    display: flex;
    gap: 0.3rem;

    i {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: $radius-pill;
      background: $color-border;
    }
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $color-ink-muted;
  }

  &__body {
    padding: 0.4rem 0.9rem 0.9rem;
  }

  &__more {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.7rem;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid $color-border-soft;
  color: inherit;
  text-decoration: none;

  &:last-of-type {
    border-bottom: 0;
  }

  &__text {
    display: grid;
    gap: 0.15rem;
    min-width: 0;

    strong {
      font-size: 0.95rem;
    }

    small {
      font-size: 0.8rem;
      line-height: 1.4;
      color: $color-ink-muted;
    }
  }

  &__go {
    margin-left: auto;
    flex: 0 0 auto;
    color: $color-ink-muted;
  }

  &:hover &__go {
    color: $brand;
  }

  &--empty {
    margin: 0;
    color: $color-ink-muted;
  }
}

// --- Section layouts -------------------------------------------------------
.split {
  display: grid;
  gap: clamp(1.75rem, 4vw, 3rem);
  align-items: center;

  @media (min-width: $bp-lg) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  }
}

.seed-grid {
  @include responsive-columns(3, $bp-md, 1rem);
}

.seed-card {
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  h3 {
    margin: 0;
    font-family: $font-body;
    font-size: 1.05rem;
    font-weight: 700;
  }

  &__label {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: $color-ink-muted;
  }

  &__cov {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin: 0.35rem 0 0;
    font-size: 0.75rem;
    color: $status-good;
  }
}

.feature-grid {
  @include responsive-columns(3, $bp-md, 1rem);
  text-decoration: none;
}

// --- Closing CTA -----------------------------------------------------------
.cta {
  max-width: 34rem;
  text-align: center;
  margin-inline: auto;

  .lede {
    margin-inline: auto;
  }

  &__form {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: center;
    gap: 0.85rem;
    margin-top: 1.75rem;
  }

  &__note {
    margin: 1.1rem 0 0;
    font-size: 0.8rem;
  }
}
</style>
