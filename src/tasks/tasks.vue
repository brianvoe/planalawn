<script lang="ts">
import { tasks } from '../data/tasks'
import { evaluateAllTasks } from '../services/timing'
import TaskCard from './task-card.vue'
import { groupFor, searchTextFor, statusFor, taskGroups, urgencyBands } from './task-ui'
import type { PropType } from 'vue'
import type { TaskGroup, TaskStatus, UrgencyBand } from './task-ui'
import type { Conditions as Weather, EvaluatedTask } from '../types'

interface Row {
  item: EvaluatedTask
  groupId: string
  status: TaskStatus | null
  text: string
}

interface Section {
  band: UrgencyBand
  rows: Row[]
}

export default {
  name: 'Tasks',
  components: { TaskCard },
  props: {
    conditions: { type: Object as PropType<Weather | null>, default: null },
  },
  data() {
    return {
      query: '',
      groupId: 'all',
    }
  },
  computed: {
    /** Catalog order is kept throughout: within a band it reads as a sequence. */
    rows(): Row[] {
      const timing = evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
      return timing.map((item) => ({
        item,
        groupId: groupFor(item.task).id,
        status: statusFor(item),
        text: searchTextFor(item.task),
      }))
    },
    /** Search alone, so the group counts show where the matches actually are. */
    matched(): Row[] {
      const q = this.query.trim().toLowerCase()
      if (!q) return this.rows
      const terms = q.split(/\s+/)
      return this.matchTerms(terms)
    },
    visible(): Row[] {
      if (this.groupId === 'all') return this.matched
      return this.matched.filter((row) => row.groupId === this.groupId)
    },
    /**
     * Urgency drives the running order rather than the kind of work: the page
     * opens on what today allows, and the type tabs above stay available for
     * when you came looking for a specific job instead.
     */
    sections(): Section[] {
      return urgencyBands
        .map((band) => ({ band, rows: this.visible.filter((r) => r.item.bucket === band.id) }))
        .filter((section) => section.rows.length > 0)
    },
    tabs(): { group: TaskGroup; count: number }[] {
      return taskGroups.map((group) => ({
        group,
        count: this.matched.filter((row) => row.groupId === group.id).length,
      }))
    },
    /** Counts what is on screen, so the line still adds up once a filter is on. */
    metaLabel(): string {
      const total = tasks.length
      const shown = this.visible.length
      const parts = [shown === total ? `${total} jobs` : `${shown} of ${total} jobs`]
      const due = this.visible.filter((row) => row.item.bucket === 'now').length
      if (due) {
        parts.push(`${due} in season now${this.conditions ? '' : ' by the calendar'}`)
      }
      return parts.join(' · ')
    },
    isFiltered(): boolean {
      return Boolean(this.query.trim()) || this.groupId !== 'all'
    },
  },
  methods: {
    matchTerms(terms: string[]): Row[] {
      return this.rows.filter((row) => terms.every((t) => row.text.includes(t)))
    },
    selectGroup(id: string) {
      // Clicking the group you are already in is the way back out of it.
      this.groupId = this.groupId === id ? 'all' : id
    },
    clearFilters() {
      this.query = ''
      this.groupId = 'all'
    },
  },
}
</script>

<style lang="scss">
.tasks-page {
  .container {
    padding-block: 2rem 3.5rem;
  }

  .page-header {
    h1 {
      margin: 0 0 0.5rem;
    }

    .lede {
      margin: 0;
      max-width: 40rem;
      color: var(--color-text-muted);
    }
  }

  .task-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.7rem 1rem;
    margin: 1.5rem 0 0.75rem;

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    input[type='search'] {
      min-width: 15rem;
      min-height: var(--input-height);
      padding: 0.45rem 0.65rem;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  /* The type tabs are the filter; the headings below are the urgency. */
  .group-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .group-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: var(--input-height);
    padding: 0.4rem 0.8rem;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    cursor: pointer;
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background-color 0.15s ease;

    svg {
      width: 0.85rem;
      height: 0.85rem;
    }

    em {
      font-size: 0.75rem;
      font-style: normal;
      font-variant-numeric: tabular-nums;
      opacity: 0.65;
    }

    &:hover:not(:disabled) {
      color: var(--color-text);
      border-color: var(--color-primary);
    }

    &.active {
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      border-color: var(--color-primary);
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  .list-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.75rem;
    margin: 0 0 1.25rem;
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }

  /* v-if/v-else siblings collapse the whitespace the sentence needs. */
  .empty .linkish {
    margin-left: 0.35rem;
  }
}
</style>

<template>
  <div class="tasks-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-list-check" />
          Task library
        </p>
        <h1>Every job, with its numbers.</h1>
        <p class="lede">
          Ordered by what today allows, so the open work reads first. Each card says when it
          happens, what it goes down with, and what the soil has to be doing.
        </p>
      </header>

      <div class="task-toolbar">
        <label>
          <span>Search</span>
          <input
            v-model="query"
            type="search"
            placeholder="crabgrass, peat, quinclorac…"
          />
        </label>
        <div class="group-tabs" role="group" aria-label="Filter by type of work">
          <button
            type="button"
            class="group-tab"
            :class="{ active: groupId === 'all' }"
            :aria-pressed="groupId === 'all'"
            @click="groupId = 'all'"
          >
            Everything
            <em>{{ matched.length }}</em>
          </button>
          <button
            v-for="tab in tabs"
            :key="tab.group.id"
            type="button"
            class="group-tab"
            :class="{ active: groupId === tab.group.id }"
            :aria-pressed="groupId === tab.group.id"
            :disabled="!tab.count && groupId !== tab.group.id"
            :title="tab.group.blurb"
            @click="selectGroup(tab.group.id)"
          >
            <font-awesome-icon :icon="tab.group.icon" />
            {{ tab.group.label }}
            <em>{{ tab.count }}</em>
          </button>
        </div>
      </div>

      <p class="list-meta">
        <span>{{ metaLabel }}</span>
        <button v-if="isFiltered" type="button" class="linkish" @click="clearFilters">
          Clear filters
        </button>
      </p>

      <section
        v-for="section in sections"
        :key="section.band.id"
        class="task-section"
        :class="`task-section--${section.band.id}`"
      >
        <header class="task-section__head">
          <font-awesome-icon :icon="section.band.icon" />
          <div>
            <h2>{{ section.band.label }}</h2>
            <p>{{ section.band.blurb }}</p>
          </div>
          <span class="task-section__count">
            {{ section.rows.length }} {{ section.rows.length === 1 ? 'job' : 'jobs' }}
          </span>
        </header>

        <TransitionGroup tag="div" class="task-grid" name="task" appear>
          <TaskCard
            v-for="(row, i) in section.rows"
            :key="row.item.task.id"
            :item="row.item"
            :status="row.status"
            :style="{ '--stagger': i }"
          />
        </TransitionGroup>
      </section>

      <p v-if="!visible.length" class="empty">
        <template v-if="query.trim()">Nothing matches “{{ query }}”.</template>
        <template v-else>Nothing in this group.</template>
        <button type="button" class="linkish" @click="clearFilters">Show every job</button>
      </p>
    </div>
  </div>
</template>
