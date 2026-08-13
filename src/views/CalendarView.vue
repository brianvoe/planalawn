<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-header">
        <p class="eyebrow">
          <AppIcon name="calendar" />
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

<script>
import ConditionsBanner from '../components/layout/ConditionsBanner.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import { tasks } from '../data/tasks'
import { timingByTask, monthLabels } from '../data/timingRules'
import { evaluateAllTasks, groupByBucket } from '../services/timing'

export default {
  name: 'CalendarView',
  components: { ConditionsBanner, AppIcon },
  props: {
    conditions: { type: Object, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  data() {
    return {
      monthLabels,
      bucketOrder: [
        { key: 'now', label: 'Do now' },
        { key: 'soon', label: 'Coming up' },
        { key: 'later', label: 'Out of season / later' },
      ],
    }
  },
  computed: {
    currentMonth() {
      return new Date().getMonth() + 1
    },
    evaluated() {
      return evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
    },
    groups() {
      return groupByBucket(this.evaluated)
    },
  },
  methods: {
    markersForMonth(month) {
      return tasks.filter((t) => {
        const rule = timingByTask[t.id]
        if (!rule) return false
        return rule.months.includes(month) || rule.secondaryMonths.includes(month)
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.page__inner {
  @include container;
  padding-block: 2rem 3.5rem;
  display: grid;
  gap: 1.75rem;
}

.page-header {
  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.75rem, 3.5vw, 2.35rem);
  }

  .lede {
    margin: 0;
    color: $color-ink-muted;
    max-width: 40rem;
  }
}

.month-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.45rem;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(12, 1fr);
  }
}

.month-pill {
  @include card;
  padding: 0.45rem 0.35rem;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: $color-ink-muted;

  &.current {
    border-color: $brand;
    color: $brand-strong;
  }

  &__dots {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
    margin-top: 0.25rem;
    min-height: 0.45rem;
  }
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $brand-mid;
}

.bucket {
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
  }

  &__list {
    display: grid;
    gap: 0.65rem;
  }
}

.task-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  align-items: flex-start;

  // Stack the label under the task on narrow screens rather than squeezing
  // the reason text into a sliver.
  flex-direction: column;

  @media (min-width: $bp-sm) {
    flex-direction: row;
    align-items: center;
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1.05rem;
  }

  p {
    margin: 0;
    font-size: 0.88rem;
    color: $color-ink-muted;
  }

  .chip {
    flex-shrink: 0;
  }
}
</style>
