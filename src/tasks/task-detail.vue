<script lang="ts">
import Conditions from '../components/conditions.vue'
import RateCalculator from './rate-calculator.vue'
import MixCalculator from '../apply/mix-calculator.vue'
import { getTask } from '../data/tasks'
import { products } from '../data/products'
import { grassNoteForTask, grassTypeLabels } from '../data/grass'
import { evaluateTask } from '../services/timing'
import { timingByTask } from '../data/timingRules'
import type { PropType } from 'vue'
import type { Conditions as Weather, EvaluatedTask, GrassType, Task } from '../types'

export default {
  name: 'TaskDetail',
  components: { Conditions, MixCalculator, RateCalculator },
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
    grassType(): GrassType | null {
      return this.$store.getters.grassType
    },
    grassHint(): string {
      const note = grassNoteForTask(this.id, this.grassType)
      if (!note) return ''
      const label = this.grassType ? grassTypeLabels[this.grassType] : 'your lawn'
      const inferred = this.$store.getters.grassTypeIsInferred ? ' (inferred from USDA zone)' : ''
      return `${label}${inferred}: ${note}`
    },
    hasProducts(): boolean {
      return products.some((p) => p.taskIds.includes(this.id))
    },
  },
  methods: {
    nameFor(taskId: string): string {
      return getTask(taskId)?.name || taskId
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
    box-shadow: var(--shadow-md);

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
        <p v-if="grassHint" class="soil">{{ grassHint }}</p>
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
        <ul>
          <li v-for="(step, i) in task.steps" :key="i">{{ step }}</li>
        </ul>
      </section>

      <section class="block">
        <h2>Materials</h2>
        <ul>
          <li v-for="m in task.materials" :key="m">{{ m }}</li>
        </ul>
      </section>

      <section v-if="task.calculator" class="block">
        <h2>How much</h2>
        <MixCalculator
          v-if="task.calculator.type === 'sprayer'"
          :rate-key="task.calculator.rateKey"
          :rate-keys="task.calculator.rateKeys"
        />
        <RateCalculator
          v-else
          :mode="task.calculator.type"
          :rate-key="task.calculator.rateKey"
          :alt-rate-key="task.calculator.altRateKey"
          :rate-keys="task.calculator.rateKeys"
        />
        <p v-if="hasProducts" class="hint">
          Bought something specific?
          <router-link :to="{ name: 'calculate', query: { task: task.id } }">
            Named products for this task
          </router-link>
          carry their own label rates and spreader settings.
        </p>
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
