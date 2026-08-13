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
          Seeding opens when your soil hits the right band — not when the month says so.
        </p>
      </header>

      <ConditionsBanner
        :conditions="conditions"
        :error="weatherError"
        :loading="weatherLoading"
        @refresh="$emit('refresh-weather')"
      />

      <section class="month-strip" aria-label="Task months">
        <div
          v-for="(label, idx) in monthLabels"
          :key="label"
          class="month-pill"
          :class="{ current: idx + 1 === currentMonth }"
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
        </div>
      </section>

      <section v-for="bucket in bucketOrder" :key="bucket.key" class="bucket">
        <h2>{{ bucket.label }}</h2>
        <div v-if="groups[bucket.key].length" class="bucket__list">
          <router-link
            v-for="item in groups[bucket.key]"
            :key="item.task.id"
            class="card card--link task-row"
            :to="`/tasks/${item.task.id}`"
          >
            <div>
              <h3>{{ item.task.name }}</h3>
              <p>{{ item.reason }}</p>
            </div>
            <span class="chip" :class="`chip--${item.soil.tone}`">{{ item.soil.label }}</span>
          </router-link>
        </div>
        <p v-else class="empty">Nothing in this bucket right now.</p>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import ConditionsBanner from '../components/layout/ConditionsBanner.vue'
import { tasks } from '../data/tasks'
import { timingByTask, monthLabels } from '../data/timingRules'
import { evaluateAllTasks, groupByBucket } from '../services/timing'
import type { PropType } from 'vue'
import type { Bucket, Conditions, EvaluatedTask, Task } from '../types'

export default {
  name: 'CalendarView',
  components: { ConditionsBanner },
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return {
      monthLabels,
      bucketOrder: [
        { key: 'now' as const, label: 'Do now' },
        { key: 'soon' as const, label: 'Coming up' },
        { key: 'later' as const, label: 'Out of season / later' },
      ],
    }
  },
  computed: {
    currentMonth(): number {
      return new Date().getMonth() + 1
    },
    evaluated(): EvaluatedTask[] {
      return evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
    },
    groups(): Record<Bucket, EvaluatedTask[]> {
      return groupByBucket(this.evaluated)
    },
  },
  methods: {
    markersForMonth(month: number): Task[] {
      return tasks.filter((t) => {
        const rule = timingByTask[t.id]
        if (!rule) return false
        return rule.months.includes(month) || rule.secondaryMonths.includes(month)
      })
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
    padding: 0.45rem 0.35rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);

    &.current {
      color: var(--color-primary-strong);
      border-color: var(--color-primary);
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

  .bucket {
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
    }

    .bucket__list {
      display: grid;
      gap: 0.65rem;
    }
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
}
</style>
