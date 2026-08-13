<template>
  <div class="task-detail-page">
    <div class="container" v-if="task">
      <p class="back"><router-link to="/tasks">← All tasks</router-link></p>
      <header class="page-header">
        <span class="cat">{{ task.category }}</span>
        <h1>{{ task.name }}</h1>
        <p class="lede">{{ task.summary }}</p>
      </header>

      <div class="timing-box" v-if="evaluation">
        <h2>Timing</h2>
        <p>{{ evaluation.reason }}</p>
        <p class="muted">{{ evaluation.rule.note }}</p>
        <p v-if="evaluation.soil" class="soil">
          Soil gate: <strong>{{ evaluation.soil.label }}</strong> — {{ evaluation.soil.detail }}
        </p>
        <Conditions
          v-if="needsSoil"
          :conditions="conditions"
          :error="weatherError"
          :loading="weatherLoading"
          @refresh="$emit('refresh-weather')"
        />
      </div>

      <section class="block">
        <h2>Why</h2>
        <p>{{ task.why }}</p>
      </section>

      <section class="block">
        <h2>Steps</h2>
        <ul class="checklist">
          <li v-for="(step, i) in task.steps" :key="i">
            <label>
              <input
                type="checkbox"
                :checked="!!log.stepsChecked[i]"
                @change="toggleStep(i)"
              />
              <span>{{ step }}</span>
            </label>
          </li>
        </ul>
      </section>

      <section class="block log-box">
        <h2>Your log (saved locally)</h2>
        <div class="log-actions">
          <button
            v-if="!log.lastDoneAt"
            type="button"
            class="btn btn--primary"
            @click="markDone"
          >
            Mark done today
          </button>
          <template v-else>
            <p class="done-line">Last done {{ log.lastDoneAt }}</p>
            <button type="button" class="btn btn--ghost" @click="clearDone">Clear done</button>
          </template>
        </div>
        <label class="notes-label">
          <span>Notes for this task</span>
          <textarea
            :value="log.notes"
            rows="3"
            placeholder="What you used, weather, results…"
            @input="onNotes"
          />
        </label>
      </section>

      <section class="block">
        <h2>Materials</h2>
        <ul>
          <li v-for="m in task.materials" :key="m">{{ m }}</li>
        </ul>
      </section>

      <section v-if="task.calculator" class="block">
        <h2>How much</h2>
        <SprayerCalculator
          v-if="task.calculator.type === 'sprayer'"
          :rate-key="task.calculator.rateKey"
        />
        <RateCalculator
          v-else
          :mode="task.calculator.type"
          :rate-key="task.calculator.rateKey"
          :alt-rate-key="task.calculator.altRateKey"
        />
      </section>

      <section v-if="task.prerequisites.length || task.nextTasks.length" class="block links">
        <div v-if="task.prerequisites.length">
          <h2>Often after</h2>
          <div class="chip-row">
            <router-link
              v-for="pid in task.prerequisites"
              :key="pid"
              class="chip chip--brand"
              :to="`/tasks/${pid}`"
            >
              {{ nameFor(pid) }}
            </router-link>
          </div>
        </div>
        <div v-if="task.nextTasks.length">
          <h2>Often next</h2>
          <div class="chip-row">
            <router-link
              v-for="nid in task.nextTasks"
              :key="nid"
              class="chip chip--brand"
              :to="`/tasks/${nid}`"
            >
              {{ nameFor(nid) }}
            </router-link>
          </div>
        </div>
      </section>

      <section class="block caveats">
        <h2>Caveats</h2>
        <ul>
          <li v-for="c in task.caveats" :key="c">{{ c }}</li>
        </ul>
      </section>
    </div>
    <div v-else class="container">
      <p>Task not found. <router-link to="/tasks">Back to tasks</router-link></p>
    </div>
  </div>
</template>

<script lang="ts">
import Conditions from '../components/conditions.vue'
import RateCalculator from './rate-calculator.vue'
import SprayerCalculator from '../sprayer/calculator.vue'
import { getTask } from '../data/tasks'
import { evaluateTask } from '../services/timing'
import { timingByTask } from '../data/timingRules'
import type { PropType } from 'vue'
import type { Conditions as Weather, EvaluatedTask, Project, Task, TaskLog } from '../types'

const milestoneMap: Record<string, keyof Project> = {
  'lawn-kill': 'killAppliedAt',
  aeration: 'aeratedAt',
  topsoil: 'topsoilAt',
  seeding: 'seededAt',
  overseeding: 'seededAt',
}

export default {
  name: 'TaskDetail',
  components: { Conditions, RateCalculator, SprayerCalculator },
  props: {
    id: { type: String, required: true },
    conditions: { type: Object as PropType<Weather | null>, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  computed: {
    task(): Task | null {
      return getTask(this.id)
    },
    log(): TaskLog {
      return this.$store.getters.taskLog(this.id)
    },
    evaluation(): EvaluatedTask | null {
      if (!this.task) return null
      return evaluateTask(this.task, {
        month: new Date().getMonth() + 1,
        soilTempF: this.conditions?.soilTemp6F,
      })
    },
    needsSoil(): boolean {
      const rule = timingByTask[this.id]
      return Boolean(rule && (rule.soilMinF != null || rule.soilMaxF != null))
    },
  },
  methods: {
    nameFor(taskId: string): string {
      return getTask(taskId)?.name || taskId
    },
    toggleStep(stepIndex: number) {
      this.$store.dispatch('toggleTaskStep', { taskId: this.id, stepIndex })
    },
    onNotes(e: Event) {
      this.$store.dispatch('setTaskNotes', {
        taskId: this.id,
        notes: (e.target as HTMLTextAreaElement).value,
      })
    },
    markDone() {
      this.$store.dispatch('markTaskDone', { taskId: this.id })
      const field = milestoneMap[this.id]
      if (field && !this.$store.state.project[field]) {
        this.$store.dispatch('updateProject', {
          [field]: new Date().toISOString().slice(0, 10),
        })
      }
    },
    clearDone() {
      this.$store.dispatch('clearTaskDone', this.id)
    },
  },
}
</script>

<style lang="scss">
.task-detail-page {
  .container {
    display: grid;
    gap: 1.5rem;
    padding-block: 1.5rem 3.5rem;
  }

  .back a {
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
  }

  .page-header {
    .cat {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1.2;
      text-transform: uppercase;
      color: var(--color-text-muted);
      background: var(--color-bg-soft);
      border-radius: 999px;
    }

    h1 {
      margin: 0.5rem 0;
    }

    .lede {
      margin: 0;
      max-width: 40rem;
      color: var(--color-text-muted);
    }
  }

  .timing-box {
    display: grid;
    gap: 0.75rem;
    padding: 1.2rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);

    h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
    }

    .muted,
    .soil {
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
  }

  .block {
    h2 {
      margin: 0 0 0.65rem;
      font-size: 1.15rem;
    }

    ol,
    ul {
      display: grid;
      gap: 0.4rem;
      margin: 0;
      padding-left: 1.2rem;
    }
  }

  .checklist {
    padding-left: 0 !important;
    list-style: none;

    label {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      cursor: pointer;
    }

    input {
      margin-top: 0.25rem;
    }
  }

  .log-box {
    padding: 1.15rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);

    .log-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.85rem;
    }

    .done-line {
      margin: 0;
      font-weight: 600;
      color: var(--color-success);
    }

    .notes-label {
      display: grid;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    textarea {
      padding: 0.55rem 0.65rem;
      font: inherit;
      color: var(--color-text);
      resize: vertical;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .chip {
    text-decoration: none;
  }

  .caveats li {
    color: var(--color-text-muted);
  }

  .links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
