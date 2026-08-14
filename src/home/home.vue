<script lang="ts">
import Conditions from '../components/conditions.vue'
import LawnSize from '../components/lawn-size.vue'
import { evaluateAllTasks, groupByBucket } from '../services/timing'
import { allCultivars } from '../data/seedDb'
import { scoreCultivarForLocation } from '../services/suitability'
import type { PropType } from 'vue'
import type { Conditions as Weather, Cultivar, CultivarFit, EvaluatedTask, Profile } from '../types'

const FEATURES = [
  {
    icon: 'fa-ruler',
    title: 'Rate calculator',
    body: 'Square feet in, pounds and bags out, per product.',
    to: '/tasks',
  },
  {
    icon: 'fa-spray-can',
    title: 'Sprayer mixes',
    body: 'Tank size and coverage into an ounces-per-tank number.',
    to: '/tools/sprayer',
  },
  {
    icon: 'fa-list-check',
    title: 'Task playbooks',
    body: 'Kill, aerate, seed, weeds, grubs, fertilize — each with its own gate.',
    to: '/tasks',
  },
  {
    icon: 'fa-chart-bar',
    title: 'Trial charts',
    body: 'Quality, drought and brown patch ratings side by side.',
    to: '/seeds',
  },
  {
    icon: 'fa-location-dot',
    title: 'Location aware',
    body: 'Your coordinates pick the climate band and nearest trial site.',
    to: '/settings',
  },
  {
    icon: 'fa-floppy-disk',
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
  name: 'Home',
  components: { Conditions, LawnSize },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return { features: FEATURES, timingPoints: TIMING_POINTS }
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
    nowItems(): EvaluatedTask[] {
      const evaluated = evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
      return groupByBucket(evaluated).now
    },
    cultivarCount(): number {
      return allCultivars.length
    },
    soilSummary(): string {
      const soil = this.conditions?.soilTemp6F
      if (soil == null) return 'Set your location to get live soil temperature.'
      return `Soil is ${Math.round(soil)}°F — check what’s coming up.`
    },
    topCultivars(): (Cultivar & { fit: CultivarFit })[] {
      return allCultivars
        .map((c) => ({ ...c, fit: scoreCultivarForLocation(c, this.userLocation) }))
        .filter((c) => c.fit.score != null && c.fit.coverage.complete)
        .sort((a, b) => (b.fit.score || 0) - (a.fit.score || 0))
        .slice(0, 3)
    },
  },
}
</script>

<style lang="scss">
.home {
  .band {
    background: var(--band-fill);
    padding-block: clamp(3.5rem, 7vw, 5.5rem);

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
      box-shadow: 0 -8px 28px rgba(16, 50, 31, 0.14), 0 12px 32px rgba(0, 0, 0, 0.18);
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

  .hero {
    padding-block: clamp(2.5rem, 6vw, 4.5rem) clamp(3rem, 6vw, 5rem);
    background: var(--color-bg);

    .hero__inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
      align-items: center;
      gap: clamp(2rem, 5vw, 3.5rem);

      @media (max-width: 1023px) {
        grid-template-columns: 1fr;
      }
    }

    h1 {
      margin: 0 0 0.9rem;
      font-family: var(--font-display);
      font-size: clamp(2.3rem, 5.8vw, 3.75rem);
      font-weight: var(--font-weight-bold);
      line-height: 1.02;
      letter-spacing: -0.04em;
      color: var(--color-text);
    }

    .hero__lede {
      max-width: 34rem;
      margin: 0;
      font-size: 1.15rem;
      line-height: 1.65;
      color: var(--lede-ink, var(--color-text-muted));
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 1.6rem;
    }

    .hero__meta {
      margin: 1rem 0 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
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
    }

    .panel__title {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
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
      text-decoration: none;
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
    }

    &:hover .row__go {
      color: var(--color-primary);
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
    .seed-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    h3 {
      margin: 0;
      font-family: var(--font-family);
      font-size: 1.05rem;
      font-weight: 700;
    }

    .seed-card__label {
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }

    .seed-card__cov {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0.35rem 0 0;
      font-size: 0.75rem;
      color: var(--color-success);
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
</style>

<template>
  <div class="home">
    <!-- HERO ---------------------------------------------------------------->
    <header class="hero">
      <div class="hero__inner container">
        <div class="hero__copy">
          <p class="eyebrow">
            <font-awesome-icon icon="fa-solid fa-temperature-half" />
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
              <font-awesome-icon icon="fa-solid fa-arrow-right" />
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
              <font-awesome-icon icon="fa-solid fa-arrow-right" class="row__go" />
            </router-link>

            <p v-if="!nowItems.length" class="row row--empty">
              <font-awesome-icon icon="fa-solid fa-clock" />
              <span class="row__text">
                <strong>Nothing due right now</strong>
                <small>{{ soilSummary }}</small>
              </span>
            </p>

            <router-link class="panel__more" to="/calendar">
              Full calendar
              <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- TIMING -------------------------------------------------------------->
    <section class="band band--tint">
      <div class="band__inner container split">
        <div>
          <p class="eyebrow">
            <font-awesome-icon icon="fa-solid fa-calendar-day" />
            Timing
          </p>
          <h2>Soil temp beats the calendar.</h2>
          <p class="lede">
            Seed goes down when the ground is ready, not when the bag says September.
          </p>
          <ul class="checklist">
            <li v-for="point in timingPoints" :key="point">
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
        <div class="band__head">
          <p class="eyebrow">
            <font-awesome-icon icon="fa-solid fa-seedling" />
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
              <font-awesome-icon icon="fa-solid fa-check" />
              All {{ c.fit.coverage.totalFactors }} factors measured
            </p>
          </router-link>
        </div>

        <router-link class="btn btn--ghost inline-cta" to="/seeds">
          Compare blends and cultivars
          <font-awesome-icon icon="fa-solid fa-arrow-right" />
        </router-link>
      </div>
    </section>

    <!-- FEATURE GRID -------------------------------------------------------->
    <section class="band band--tint-strong">
      <div class="band__inner container">
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
            <span class="feature-card__icon">
              <font-awesome-icon :icon="'fa-solid ' + f.icon" />
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
      <div class="band__inner container cta">
        <h2>Ready when you are.</h2>
        <p class="lede">
          Set your square footage and location. Everything else calculates itself.
        </p>
        <div class="cta__form">
          <LawnSize />
          <router-link class="btn btn--primary" to="/settings">
            My lawn
            <font-awesome-icon icon="fa-solid fa-arrow-right" />
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
