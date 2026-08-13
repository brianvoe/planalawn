<template>
  <div class="page">
    <div class="page__inner" v-if="task">
      <p class="back"><router-link to="/tasks">← All tasks</router-link></p>
      <header class="page-header">
        <span class="cat">{{ task.category }}</span>
        <h1>{{ task.name }}</h1>
        <p class="lede">{{ task.summary }}</p>
      </header>

      <div class="timing-box">
        <h2>Timing</h2>
        <p>{{ evaluation.reason }}</p>
        <p class="muted">{{ evaluation.rule.note }}</p>
        <p v-if="evaluation.soil" class="soil">
          Soil gate: <strong>{{ evaluation.soil.label }}</strong> — {{ evaluation.soil.detail }}
        </p>
        <ConditionsBanner
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
    <div v-else class="page__inner">
      <p>Task not found. <router-link to="/tasks">Back to tasks</router-link></p>
    </div>
  </div>
</template>

<script>
import ConditionsBanner from '../components/layout/ConditionsBanner.vue'
import RateCalculator from '../components/rates/RateCalculator.vue'
import SprayerCalculator from '../components/rates/SprayerCalculator.vue'
import { getTask } from '../data/tasks'
import { evaluateTask } from '../services/timing'
import { timingByTask } from '../data/timingRules'

export default {
  name: 'TaskDetailView',
  components: { ConditionsBanner, RateCalculator, SprayerCalculator },
  props: {
    id: { type: String, required: true },
    conditions: { type: Object, default: null },
    weatherError: { type: String, default: null },
    weatherLoading: { type: Boolean, default: false },
  },
  emits: ['refresh-weather'],
  computed: {
    task() {
      return getTask(this.id)
    },
    log() {
      return this.$store.getters.taskLog(this.id)
    },
    evaluation() {
      if (!this.task) return null
      return evaluateTask(this.task, {
        month: new Date().getMonth() + 1,
        soilTempF: this.conditions?.soilTemp6F,
      })
    },
    needsSoil() {
      const rule = timingByTask[this.id]
      return rule && (rule.soilMinF != null || rule.soilMaxF != null)
    },
  },
  methods: {
    nameFor(taskId) {
      return getTask(taskId)?.name || taskId
    },
    toggleStep(stepIndex) {
      this.$store.dispatch('toggleTaskStep', { taskId: this.id, stepIndex })
    },
    onNotes(e) {
      this.$store.dispatch('setTaskNotes', { taskId: this.id, notes: e.target.value })
    },
    markDone() {
      this.$store.dispatch('markTaskDone', { taskId: this.id })
      // Mirror key milestones into project timeline when relevant
      const map = {
        'lawn-kill': 'killAppliedAt',
        aeration: 'aeratedAt',
        topsoil: 'topsoilAt',
        seeding: 'seededAt',
        overseeding: 'seededAt',
      }
      const field = map[this.id]
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

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.page__inner {
  @include container;
  padding-block: 1.5rem 3.5rem;
  display: grid;
  gap: 1.5rem;
}

.back a {
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.page-header {
  .cat {
    @include label-badge;
    background: $status-neutral-soft;
    color: $color-ink-muted;
    text-transform: uppercase;
    font-size: 0.68rem;
  }

  h1 {
    margin: 0.5rem 0;
  }

  .lede {
    margin: 0;
    color: $color-ink-muted;
    max-width: 40rem;
  }
}

.timing-box {
  @include card;
  padding: 1.2rem;
  display: grid;
  gap: 0.75rem;

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
    color: $color-ink-muted;
  }
}

.block {
  h2 {
    margin: 0 0 0.65rem;
    font-size: 1.15rem;
  }

  ol,
  ul {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.4rem;
  }
}

.checklist {
  list-style: none;
  padding-left: 0 !important;

  label {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    cursor: pointer;
  }

  input {
    margin-top: 0.25rem;
  }
}

.log-box {
  @include card;
  padding: 1.15rem;

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
    color: $status-good;
  }

  .notes-label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: $color-ink-muted;
  }

  textarea {
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.55rem 0.65rem;
    font: inherit;
    color: $color-ink;
    resize: vertical;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
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
  color: $color-ink-muted;
}

.links {
  display: grid;
  gap: 1rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
