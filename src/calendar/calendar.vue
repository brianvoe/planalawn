<script lang="ts">
import Conditions from '../components/conditions.vue'
import TaskCard from '../tasks/task-card.vue'
import { monthLabels, monthNames, timingByTask } from '../data/timingRules'
import { defaultPathId, getPath, seasonPaths, taskIdsForPath } from '../data/seasonPaths'
import { sequenceFor } from '../data/sequencing'
import { buildMonthPlan } from '../services/plan'
import { statusFor, windowStatusFor } from '../tasks/task-ui'
import type { PropType } from 'vue'
import type { MonthPlan, PlanWeek } from '../services/plan'
import type { SeasonPath } from '../data/seasonPaths'
import type { TaskStatus } from '../tasks/task-ui'
import type { Conditions as Weather, EvaluatedTask } from '../types'

/** At most five dots per pill — past that it is texture, not a count. */
const MONTH_DOTS = 5

interface OngoingRow {
  item: EvaluatedTask
  effort: string
}

/**
 * The month as a running order rather than a pile.
 *
 * A list of everything September permits is not a plan: it puts killing the
 * lawn and seeding it under one heading without mentioning that doing them nine
 * days apart wastes the seed. This page picks a path, spreads that path's work
 * across real weeks, and says out loud why each job sits where it does.
 */
export default {
  name: 'Calendar',
  components: { Conditions, TaskCard },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return {
      monthLabels,
      seasonPaths,
      selectedMonth: new Date().getMonth() + 1,
      pathId: defaultPathId as string,
    }
  },
  created() {
    // `?month=9` lets other pages link straight to a month — the home strip does.
    const query = this.$router.currentRoute.value.query
    const asked = Number(query.month)
    if (Number.isInteger(asked) && asked >= 1 && asked <= 12) this.selectedMonth = asked
    // The path rides in the URL rather than the saved profile: it is a question
    // about this season, and it should survive a reload or a shared link.
    const path = String(query.path || '')
    if (seasonPaths.some((p) => p.id === path)) this.pathId = path
  },
  computed: {
    currentMonth(): number {
      return new Date().getMonth() + 1
    },
    isBrowsing(): boolean {
      return this.selectedMonth !== this.currentMonth
    },
    monthName(): string {
      return monthNames[this.selectedMonth - 1]
    },
    currentMonthName(): string {
      return monthNames[this.currentMonth - 1]
    },
    activePath(): SeasonPath {
      return getPath(this.pathId)
    },
    /**
     * Soil temperature is only true of today, so browsing another month drops it
     * and falls back to the calendar windows alone.
     */
    plan(): MonthPlan {
      return buildMonthPlan({
        year: new Date().getFullYear(),
        month: this.selectedMonth,
        pathId: this.pathId,
        soilTempF: this.isBrowsing ? null : this.conditions?.soilTemp6F,
      })
    },
    scheduledCount(): number {
      return this.plan.weeks.reduce((sum, week) => sum + week.items.length, 0)
    },
    busyWeeks(): PlanWeek[] {
      return this.plan.weeks.filter((week) => week.items.length > 0)
    },
    ongoingRows(): OngoingRow[] {
      return this.plan.ongoing.map((item) => ({
        item,
        effort: sequenceFor(item.task.id).effort || '',
      }))
    },
    /**
     * The month in one sentence, because how much work it holds and how many
     * trips it takes is the thing a visitor came to find out.
     */
    summary(): string {
      if (!this.scheduledCount) {
        return `No one-off jobs land in ${this.monthName} on this plan.`
      }
      const jobs = `${this.scheduledCount} ${this.scheduledCount === 1 ? 'job' : 'jobs'}`
      const weeks = this.busyWeeks.length
      const spread = weeks === 1 ? 'in a single week' : `across ${weeks} weeks`
      const tail = this.isBrowsing
        ? `Soil temperature is only checked for ${this.currentMonthName}.`
        : ''
      return `${jobs} ${spread}. ${tail}`.trim()
    },
    /** One dot per job, so the year reads as a workload before it is clicked. */
    monthDots(): { month: number; label: string; dots: number; count: number }[] {
      const ids = taskIdsForPath(this.pathId)
      return monthLabels.map((label, i) => {
        const month = i + 1
        const count = ids.filter((id) => {
          const rule = timingByTask[id]
          return Boolean(rule) && (rule.months.includes(month) || rule.secondaryMonths.includes(month))
        }).length
        return { month, label, count, dots: Math.min(count, MONTH_DOTS) }
      })
    },
  },
  methods: {
    /**
     * A badge is a claim about today, which a browsed month cannot make. It has
     * only one thing left worth saying — that a job is here on its second-choice
     * window — and saying "primary window" on every other card would drown it.
     */
    statusOf(item: EvaluatedTask): TaskStatus | null {
      if (!this.isBrowsing) return statusFor(item)
      return item.primary ? null : windowStatusFor(item)
    },
    selectMonth(month: number) {
      this.selectedMonth = month
      this.syncQuery()
    },
    selectPath(id: string) {
      this.pathId = id
      this.syncQuery()
    },
    showThisMonth() {
      this.selectMonth(this.currentMonth)
    },
    /** Replace rather than push: switching paths is not a navigation step. */
    syncQuery() {
      this.$router.replace({
        query: { month: String(this.selectedMonth), path: this.pathId },
      })
    },
  },
}
</script>

<style lang="scss">
.calendar-page {
  .container {
    display: grid;
    gap: 1.1rem;
    padding-block: 1.5rem 3rem;
  }

  /* Title, verdict and the reading behind it, on one line where there is room. */
  .month-head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 0.85rem 1.5rem;

    .eyebrow {
      margin-bottom: 0.35rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.6rem, 3.2vw, 2.1rem);
      line-height: 1.1;
    }
  }

  .month-head__summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.7rem;
    margin: 0.35rem 0 0;
    color: var(--color-text-muted);
  }

  .month-head__aside {
    flex: 1 1 20rem;
    max-width: 30rem;
  }

  /*
   * The plan cannot start until it knows which season you are having. Killing
   * the lawn and overseeding it are alternatives, not steps, so this is the
   * first question rather than a filter applied afterwards.
   */
  .path-switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .path-switch__label {
    margin: 0 0.35rem 0 0;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .path-switch__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.4rem 0.75rem;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    appearance: none;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      color 0.15s ease;

    svg {
      width: 0.85rem;
      height: 0.85rem;
    }

    &:hover {
      color: var(--color-text);
      border-color: var(--color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &.active {
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
    }
  }

  .path-switch__blurb {
    flex-basis: 100%;
    margin: 0.1rem 0 0;
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }

  .month-strip {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.4rem;

    @media (max-width: 767px) {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .month-pill {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.3rem;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    appearance: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      background-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      color: var(--color-text);
      border-color: var(--color-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    &.current:not(.selected) {
      color: var(--color-primary-strong);
      border-color: var(--color-primary);
    }

    &.selected {
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
      box-shadow: var(--shadow);
    }

    .month-pill__dots {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2px;
      min-height: 0.4rem;
      margin-top: 0.2rem;
    }
  }

  .dot {
    width: 4px;
    height: 4px;
    background: var(--color-primary);
    border-radius: 50%;
    opacity: 0.55;
  }

  .month-pill.selected .dot,
  .month-pill.current .dot {
    opacity: 1;
  }

  /* Work with no start date, so it sits above the weeks rather than inside one. */
  .plan-ongoing {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
    padding: 0.6rem 0.9rem;
    background: var(--color-bg-soft);
    border: 1px dashed var(--color-border);
    border-radius: calc(var(--border-radius) * 1.5);
  }

  .plan-ongoing__label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);

    svg {
      width: 0.8rem;
      height: 0.8rem;
      color: var(--color-primary-strong);
    }
  }

  .plan-ongoing__job {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 0.86rem;
    font-weight: 600;
    color: inherit;
    text-decoration: none;

    small {
      font-weight: 400;
      color: var(--color-text-muted);
    }

    &:hover {
      color: var(--color-primary-strong);
    }
  }

  /* A timeline: the date rail on the left, that week's work to the right. */
  .plan-weeks {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .plan-week {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 0.9rem;
    align-items: start;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }

    &.plan-week--empty {
      opacity: 0.6;
    }
  }

  .plan-week__rail {
    position: sticky;
    top: 4.5rem;
    padding-top: 0.15rem;
    border-left: 2px solid var(--color-border);
    padding-left: 0.7rem;

    @media (max-width: 767px) {
      position: static;
      border-left: 0;
      padding-left: 0;
    }

    strong {
      display: block;
      font-size: 0.9rem;
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
    }

    small {
      font-size: 0.74rem;
      color: var(--color-text-muted);
    }
  }

  .plan-week--now .plan-week__rail {
    border-left-color: var(--color-primary);

    strong {
      color: var(--color-primary-strong);
    }
  }

  .plan-week__free {
    margin: 0;
    padding-top: 0.2rem;
    font-size: 0.84rem;
    color: var(--color-text-muted);
  }

  /*
   * Why the plan is shaped the way it is. It sits above the weeks because a
   * reader needs it before the gap it explains, not after — otherwise the
   * spacing reads as an arbitrary layout choice rather than the point.
   */
  .plan-notes {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      gap: 0.5rem;
      font-size: 0.82rem;
      line-height: 1.45;
      color: var(--color-text-muted);
    }

    svg {
      flex-shrink: 0;
      width: 0.8rem;
      height: 0.8rem;
      margin-top: 0.25rem;
      color: var(--color-warning);
    }
  }

  .plan-spill {
    h2 {
      margin: 0 0 0.15rem;
      font-size: 1.05rem;
    }

    p {
      margin: 0 0 0.6rem;
      font-size: 0.84rem;
      color: var(--color-text-muted);
    }
  }
}
</style>

<template>
  <div class="calendar-page">
    <div class="container">
      <header class="month-head">
        <div>
          <p class="eyebrow">
            <font-awesome-icon icon="fa-solid fa-calendar-day" />
            {{ isBrowsing ? 'Month plan' : 'This month' }}
          </p>
          <h1>{{ monthName }}</h1>
          <p class="month-head__summary">
            <span>{{ summary }}</span>
            <button
              v-if="isBrowsing"
              type="button"
              class="btn btn--ghost btn--sm"
              @click="showThisMonth"
            >
              Back to {{ currentMonthName }}
            </button>
          </p>
        </div>

        <Conditions
          v-if="!isBrowsing"
          class="month-head__aside"
          compact
          :conditions="conditions"
          :error="weatherError"
          :loading="weatherLoading"
          @refresh="$emit('refresh-weather')"
        />
      </header>

      <section class="path-switch" aria-label="What you are doing this season">
        <p class="path-switch__label">This season</p>
        <button
          v-for="path in seasonPaths"
          :key="path.id"
          type="button"
          class="path-switch__btn"
          :class="{ active: path.id === pathId }"
          :aria-pressed="path.id === pathId"
          @click="selectPath(path.id)"
        >
          <font-awesome-icon :icon="path.icon" />
          {{ path.label }}
        </button>
        <p class="path-switch__blurb">{{ activePath.blurb }}</p>
      </section>

      <section class="month-strip" aria-label="Task months">
        <button
          v-for="cell in monthDots"
          :key="cell.label"
          type="button"
          class="month-pill"
          :class="{
            current: cell.month === currentMonth,
            selected: cell.month === selectedMonth,
          }"
          :aria-pressed="cell.month === selectedMonth"
          :aria-current="cell.month === currentMonth ? 'date' : undefined"
          :title="`${cell.count} ${cell.count === 1 ? 'job' : 'jobs'} in ${cell.label}`"
          @click="selectMonth(cell.month)"
        >
          <span>{{ cell.label }}</span>
          <div class="month-pill__dots">
            <span v-for="n in cell.dots" :key="n" class="dot" />
          </div>
        </button>
      </section>

      <section v-if="ongoingRows.length" class="plan-ongoing" aria-label="Ongoing all month">
        <span class="plan-ongoing__label">
          <font-awesome-icon icon="fa-solid fa-rotate" />
          All month
        </span>
        <router-link
          v-for="row in ongoingRows"
          :key="row.item.task.id"
          class="plan-ongoing__job"
          :to="`/tasks/${row.item.task.id}`"
        >
          {{ row.item.task.name }}
          <small v-if="row.effort">{{ row.effort }}</small>
        </router-link>
      </section>

      <ul v-if="plan.separated.length" class="plan-notes">
        <li v-for="note in plan.separated" :key="note">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          <span>{{ note }}</span>
        </li>
      </ul>

      <ul v-if="plan.weeks.length" class="plan-weeks">
        <li
          v-for="(week, i) in plan.weeks"
          :key="week.label"
          class="plan-week"
          :class="{
            'plan-week--empty': !week.items.length,
            'plan-week--now': i === 0 && !isBrowsing,
          }"
        >
          <div class="plan-week__rail">
            <strong>{{ week.label }}</strong>
            <small>{{ i === 0 && !isBrowsing ? 'This week' : `Week ${i + 1}` }}</small>
          </div>

          <TransitionGroup v-if="week.items.length" tag="div" class="task-grid" name="task" appear>
            <TaskCard
              v-for="(row, n) in week.items"
              :key="row.item.task.id"
              :item="row.item"
              :status="statusOf(row.item)"
              :wait-note="row.waitNote"
              :same-visit-as="row.sameVisitAs"
              :style="{ '--stagger': n }"
            />
          </TransitionGroup>
          <p v-else class="plan-week__free">Nothing scheduled — a good week to catch up.</p>
        </li>
      </ul>

      <section v-if="plan.spillover.length" class="plan-spill">
        <h2>Will not fit in {{ monthName }}</h2>
        <p>In season, but the intervals push {{ plan.spillover.length === 1 ? 'it' : 'them' }} past the end of the month.</p>
        <div class="task-grid">
          <TaskCard
            v-for="row in plan.spillover"
            :key="row.item.task.id"
            :item="row.item"
            :status="null"
            :wait-note="row.waitNote"
          />
        </div>
      </section>

      <p v-if="!scheduledCount && !ongoingRows.length" class="empty">
        Nothing typically due in {{ monthName }} on this plan.
      </p>
    </div>
  </div>
</template>
