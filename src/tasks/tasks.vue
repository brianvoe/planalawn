<script lang="ts">
import { tasks } from '../data/tasks'
import { evaluateAllTasks } from '../services/timing'
import {
  groupFor,
  iconFor,
  searchTextFor,
  soilGateFor,
  taskGroups,
  toolFor,
  windowFor,
} from './task-ui'
import type { PropType } from 'vue'
import type { IconRef, TaskGroup, TaskTool } from './task-ui'
import type { Bucket, Conditions as Weather, StatusTone, Task } from '../types'

interface Status {
  label: string
  tone: StatusTone
}

/**
 * Only the two buckets worth interrupting for get a chip. "Later" is the
 * default state of ten of these jobs, and a row of grey "Later" badges would
 * bury the two that are actually open — the month range in the meta line
 * already says when to come back.
 */
const STATUS: Partial<Record<Bucket, Status>> = {
  now: { label: 'Do now', tone: 'good' },
  soon: { label: 'Coming up', tone: 'caution' },
}

interface Row {
  task: Task
  groupId: string
  icon: IconRef
  tool: TaskTool | null
  window: string
  soil: string
  status: Status | null
  reason: string
  text: string
}

interface Section {
  group: TaskGroup
  rows: Row[]
}

export default {
  name: 'Tasks',
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
    /** Catalog order is kept throughout: within a group it reads as a sequence. */
    rows(): Row[] {
      const timing = evaluateAllTasks({ soilTempF: this.conditions?.soilTemp6F })
      return timing.map((item) => ({
        task: item.task,
        groupId: groupFor(item.task).id,
        icon: iconFor(item.task),
        tool: toolFor(item.task),
        window: windowFor(item.task),
        soil: soilGateFor(item.task),
        status: STATUS[item.bucket] || null,
        reason: item.reason,
        text: searchTextFor(item.task),
      }))
    },
    /** Search alone, so the group counts show where the matches actually are. */
    matched(): Row[] {
      const q = this.query.trim().toLowerCase()
      if (!q) return this.rows
      const terms = q.split(/\s+/)
      return this.rows.filter((row) => terms.every((t) => row.text.includes(t)))
    },
    visible(): Row[] {
      if (this.groupId === 'all') return this.matched
      return this.matched.filter((row) => row.groupId === this.groupId)
    },
    sections(): Section[] {
      return taskGroups
        .map((group) => ({ group, rows: this.visible.filter((r) => r.groupId === group.id) }))
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
      const due = this.visible.filter((row) => row.status?.tone === 'good').length
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

  /* Grouping doubles as the filter: the headings you scan are the buttons you press. */
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

  .task-section {
    margin-bottom: 1.75rem;
  }

  /* v-if/v-else siblings collapse the whitespace the sentence needs. */
  .empty .linkish {
    margin-left: 0.35rem;
  }

  .task-section__head {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0 0 0.75rem;

    h2 {
      margin: 0;
      font-size: 1.05rem;
    }

    p {
      margin: 0;
      font-size: 0.82rem;
      color: var(--color-text-muted);
    }

    svg {
      width: 0.9rem;
      height: 0.9rem;
      color: var(--color-primary-strong);
    }
  }

  .task-section__count {
    margin-left: auto;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 0.7rem;

    @media (max-width: 559px) {
      grid-template-columns: 1fr;
    }
  }

  .task-card {
    display: flex;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 1.5);
    box-shadow: var(--shadow-sm);
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &:hover {
        transform: none;
      }
    }
  }

  .task-card__icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.2rem;
    height: 2.2rem;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-radius: 11px;

    svg {
      width: 1.05rem;
      height: 1.05rem;
    }
  }

  .task-card__body {
    min-width: 0;
  }

  .task-card__top {
    display: flex;
    align-items: start;
    gap: 0.5rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.3;
    }

    .chip {
      flex-shrink: 0;
      padding: 0.2rem 0.5rem;
      font-size: 0.68rem;
    }
  }

  .task-card__summary {
    margin: 0.3rem 0 0;
    font-size: 0.86rem;
    line-height: 1.45;
    color: var(--color-text-muted);
  }

  /* The scan line: when, with what, and what the soil has to be doing. */
  .task-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.7rem;
    margin: 0.5rem 0 0;
    font-size: 0.76rem;
    color: var(--color-text-muted);

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }

    svg {
      width: 0.72rem;
      height: 0.72rem;
      opacity: 0.75;
    }
  }

  .task-enter-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(30ms * var(--stagger, 0));

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .task-enter-from {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.985);
  }

  .task-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .task-leave-to {
    opacity: 0;
    transform: scale(0.97);
  }

  .task-move {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
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
          Grouped by the kind of work it is. Each card says when it happens, what it goes down
          with, and what the soil has to be doing.
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

      <section v-for="section in sections" :key="section.group.id" class="task-section">
        <header class="task-section__head">
          <font-awesome-icon :icon="section.group.icon" />
          <div>
            <h2>{{ section.group.label }}</h2>
            <p>{{ section.group.blurb }}</p>
          </div>
          <span class="task-section__count">
            {{ section.rows.length }} {{ section.rows.length === 1 ? 'job' : 'jobs' }}
          </span>
        </header>

        <TransitionGroup tag="div" class="task-grid" name="task" appear>
          <router-link
            v-for="(row, i) in section.rows"
            :key="row.task.id"
            class="task-card"
            :style="{ '--stagger': i }"
            :to="`/tasks/${row.task.id}`"
          >
            <span class="task-card__icon">
              <font-awesome-icon :icon="row.icon" />
            </span>
            <div class="task-card__body">
              <div class="task-card__top">
                <h3>{{ row.task.name }}</h3>
                <span
                  v-if="row.status"
                  class="chip"
                  :class="`chip--${row.status.tone}`"
                  :title="row.reason"
                >
                  {{ row.status.label }}
                </span>
              </div>
              <p class="task-card__summary">{{ row.task.summary }}</p>
              <p class="task-card__meta">
                <span :title="`Typical months: ${row.window}`">
                  <font-awesome-icon icon="fa-solid fa-calendar-day" />
                  {{ row.window }}
                </span>
                <span v-if="row.tool">
                  <font-awesome-icon :icon="row.tool.icon" />
                  {{ row.tool.label }}
                </span>
                <span v-if="row.soil">
                  <font-awesome-icon icon="fa-solid fa-temperature-half" />
                  {{ row.soil }}
                </span>
              </p>
            </div>
          </router-link>
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
