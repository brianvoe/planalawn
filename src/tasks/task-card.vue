<script lang="ts">
import { iconFor, soilGateFor, toolFor, windowFor } from './task-ui'
import { sequenceFor } from '../data/sequencing'
import type { PropType } from 'vue'
import type { IconRef, TaskStatus, TaskTool } from './task-ui'
import type { EvaluatedTask } from '../types'

/**
 * One job as a tile: what it is, whether it is open, and the two or three facts
 * that decide it — when, with what, and what the soil has to be doing.
 *
 * The task library and the calendar are both lists of jobs, so they share this
 * rather than describing a task twice in two accents. Callers own the badge,
 * because "Do now" is a claim about today that a browsed month cannot make.
 */
export default {
  name: 'TaskCard',
  props: {
    item: { type: Object as PropType<EvaluatedTask>, required: true },
    /** Null renders no badge, which is how the quiet out-of-season jobs read. */
    status: { type: Object as PropType<TaskStatus | null>, default: null },
    /** Replaces the task summary — the calendar shows why this month, instead. */
    note: { type: String, default: '' },
    /** From the month plan: the interval that decided which week this landed in. */
    waitNote: { type: String, default: '' },
    /** From the month plan: the job this one shares a trip across the lawn with. */
    sameVisitAs: { type: String, default: '' },
  },
  computed: {
    icon(): IconRef {
      return iconFor(this.item.task)
    },
    tool(): TaskTool | null {
      return toolFor(this.item.task)
    },
    /** What one pass costs, so a week reads as a workload and not just a list. */
    effort(): string {
      return sequenceFor(this.item.task.id).effort || ''
    },
    window(): string {
      return windowFor(this.item.task)
    },
    soil(): string {
      return soilGateFor(this.item.task)
    },
    body(): string {
      return this.note || this.item.task.summary
    },
    /**
     * Why this one is waiting, and only where that is the question. A job that
     * is open does not need its gate quoted back, and an out-of-season job is
     * held by the calendar rather than by the reading.
     */
    blocked(): string {
      if (this.item.bucket !== 'soon' || this.item.soil.ok !== false) return ''
      return this.item.soil.detail
    },
  },
}
</script>

<style lang="scss">
/*
 * The card and the furniture a page of them needs. Both the task library and
 * the calendar render this same list, so the section heads, the grid and the
 * entrance animation live here with the tile rather than once per page.
 */
.task-section {
  margin-bottom: 1.75rem;
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

/* Urgency reads before the words do: open work is green, waiting work amber. */
.task-section--now .task-section__head svg {
  color: var(--color-success);
}

.task-section--soon .task-section__head svg {
  color: var(--color-warning);
}

.task-section--later .task-section__head svg {
  color: var(--color-text-muted);
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

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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

/* A column so the meta line can sit on the floor of a stretched grid cell. */
.task-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
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
    margin-left: auto;
    padding: 0.2rem 0.5rem;
    font-size: 0.68rem;
  }
}

/* Two lines keeps a grid of these even; the detail page carries the full text. */
.task-card__summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin: 0.3rem 0 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

/*
 * Where a job sits in the running order, which only a planned month can say.
 * It sits above the meta line because it is the reason this card is in this
 * week rather than a standing fact about the job.
 */
.task-card__timing {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.6rem;
  margin: 0.4rem 0 0;
  font-size: 0.76rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  svg {
    flex-shrink: 0;
    width: 0.72rem;
    height: 0.72rem;
  }
}

.task-card__together {
  color: var(--color-primary-strong);
}

.task-card__wait {
  color: var(--color-text-muted);
}

/*
 * The scan line: when, with what, and what the soil has to be doing. It holds
 * the bottom edge so the facts line up across a row of cards whose summaries
 * ran to different lengths.
 */
.task-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.7rem;
  margin: auto 0 0;
  padding-top: 0.55rem;
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

.task-card__blocked {
  color: var(--color-warning);
  white-space: normal !important;

  svg {
    opacity: 1;
  }
}
</style>

<template>
  <router-link class="task-card" :to="`/tasks/${item.task.id}`">
    <span class="task-card__icon">
      <font-awesome-icon :icon="icon" />
    </span>
    <div class="task-card__body">
      <div class="task-card__top">
        <h3>{{ item.task.name }}</h3>
        <span
          v-if="status"
          class="chip"
          :class="`chip--${status.tone}`"
          :title="item.reason"
        >
          {{ status.label }}
        </span>
      </div>
      <p class="task-card__summary">{{ body }}</p>
      <p v-if="sameVisitAs || waitNote" class="task-card__timing">
        <span v-if="sameVisitAs" class="task-card__together">
          <font-awesome-icon icon="fa-solid fa-rotate" />
          Same visit as {{ sameVisitAs }}
        </span>
        <span v-if="waitNote" class="task-card__wait">
          <font-awesome-icon icon="fa-solid fa-hourglass-half" />
          {{ waitNote }}
        </span>
      </p>
      <p class="task-card__meta">
        <span :title="`Typical months: ${window}`">
          <font-awesome-icon icon="fa-solid fa-calendar-day" />
          {{ window }}
        </span>
        <span v-if="effort">
          <font-awesome-icon icon="fa-solid fa-clock" />
          {{ effort }}
        </span>
        <span v-if="tool">
          <font-awesome-icon :icon="tool.icon" />
          {{ tool.label }}
        </span>
        <span v-if="soil">
          <font-awesome-icon icon="fa-solid fa-temperature-half" />
          {{ soil }}
        </span>
        <span v-if="blocked" class="task-card__blocked">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          {{ blocked }}
        </span>
      </p>
    </div>
  </router-link>
</template>
