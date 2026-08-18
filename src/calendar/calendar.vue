<script lang="ts">
import Conditions from '../components/conditions.vue'
import { tasks } from '../data/tasks'
import { timingByTask, monthLabels } from '../data/timingRules'
import { evaluateAllTasks } from '../services/timing'
import type { PropType } from 'vue'
import type { Conditions as Weather, EvaluatedTask, Task } from '../types'

export default {
  name: 'Calendar',
  components: { Conditions },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return {
      monthLabels,
      selectedMonth: new Date().getMonth() + 1,
    }
  },
  created() {
    // `?month=9` lets other pages link straight to a month — the home strip does.
    const asked = Number(this.$router.currentRoute.value.query.month)
    if (Number.isInteger(asked) && asked >= 1 && asked <= 12) this.selectedMonth = asked
  },
  computed: {
    currentMonth(): number {
      return new Date().getMonth() + 1
    },
    isBrowsing(): boolean {
      return this.selectedMonth !== this.currentMonth
    },
    selectedMonthLabel(): string {
      return monthLabels[this.selectedMonth - 1]
    },
    monthTasks(): EvaluatedTask[] {
      return evaluateAllTasks({
        month: this.selectedMonth,
        soilTempF: this.isBrowsing ? null : this.conditions?.soilTemp6F,
      })
        .filter((item) => item.primary || item.secondary)
        .sort((a, b) => Number(b.primary) - Number(a.primary))
    },
  },
  methods: {
    selectMonth(month: number) {
      this.selectedMonth = month
    },
    showThisMonth() {
      this.selectedMonth = this.currentMonth
    },
    markersForMonth(month: number): Task[] {
      return tasks.filter((t) => {
        const rule = timingByTask[t.id]
        if (!rule) return false
        return rule.months.includes(month) || rule.secondaryMonths.includes(month)
      })
    },
    itemReason(item: EvaluatedTask): string {
      if (this.isBrowsing) return item.rule.note
      return item.reason
    },
    chipClass(item: EvaluatedTask): string {
      if (this.isBrowsing) return item.primary ? 'chip--brand' : 'chip--accent'
      return `chip--${item.soil.tone}`
    },
    chipLabel(item: EvaluatedTask): string {
      if (this.isBrowsing) return item.primary ? 'Primary' : 'Also typical'
      return item.soil.label
    },
  },
}
</script>

<style lang="scss">
.calendar-page {
  .container {
    display: grid;
    gap: 1.75rem;
    padding-block: 2rem 3.5rem;
  }

  .page-header {
    h1 {
      margin: 0 0 0.5rem;
      font-size: clamp(1.75rem, 3.5vw, 2.35rem);
    }

    .lede {
      margin: 0;
      max-width: 40rem;
      color: var(--color-text-muted);
    }
  }

  .month-strip {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.45rem;

    @media (max-width: 767px) {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .month-pill {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.45rem 0.35rem;
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
      min-height: 0.45rem;
      margin-top: 0.25rem;
    }
  }

  .dot {
    width: 5px;
    height: 5px;
    background: var(--color-primary);
    border-radius: 50%;
  }

  .job-list {
    display: grid;
    gap: 0.65rem;
  }

  .task-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1rem;

    @media (max-width: 559px) {
      flex-direction: column;
      align-items: flex-start;
    }

    h3 {
      margin: 0 0 0.25rem;
      font-size: 1.05rem;
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--color-text-muted);
    }

    .chip {
      flex-shrink: 0;
    }
  }

  .month-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.85rem;
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);

    strong {
      color: var(--color-text);
    }
  }
}
</style>

<template>
  <div class="calendar-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-calendar-day" />
          Calendar
        </p>
        <h1>What to work on next.</h1>
        <p class="lede">
          Jobs for the month you pick. This month also checks live soil temperature.
        </p>
      </header>

      <Conditions
        :conditions="conditions"
        :error="weatherError"
        :loading="weatherLoading"
        @refresh="$emit('refresh-weather')"
      />

      <section class="month-strip" aria-label="Task months">
        <button
          v-for="(label, idx) in monthLabels"
          :key="label"
          type="button"
          class="month-pill"
          :class="{
            current: idx + 1 === currentMonth,
            selected: idx + 1 === selectedMonth,
          }"
          :aria-pressed="idx + 1 === selectedMonth"
          :aria-current="idx + 1 === currentMonth ? 'date' : undefined"
          @click="selectMonth(idx + 1)"
        >
          <span>{{ label }}</span>
          <div class="month-pill__dots">
            <span
              v-for="t in markersForMonth(idx + 1)"
              :key="t.id"
              class="dot"
              :title="t.name"
            />
          </div>
        </button>
      </section>

      <p class="month-status">
        <template v-if="isBrowsing">
          <span><strong>{{ selectedMonthLabel }}</strong> — typical windows, not today’s soil.</span>
          <button type="button" class="btn btn--ghost btn--sm" @click="showThisMonth">
            Back to this month
          </button>
        </template>
        <template v-else>
          <span><strong>{{ selectedMonthLabel }}</strong> · live soil temperature</span>
        </template>
      </p>

      <section class="month-jobs" :aria-label="`Jobs in ${selectedMonthLabel}`">
        <div v-if="monthTasks.length" class="job-list">
          <router-link
            v-for="item in monthTasks"
            :key="item.task.id"
            class="card card--link task-row"
            :to="`/tasks/${item.task.id}`"
          >
            <div>
              <h3>{{ item.task.name }}</h3>
              <p>{{ itemReason(item) }}</p>
            </div>
            <span class="chip" :class="chipClass(item)">{{ chipLabel(item) }}</span>
          </router-link>
        </div>
        <p v-else class="empty">Nothing typically due in {{ selectedMonthLabel }}.</p>
      </section>
    </div>
  </div>
</template>
