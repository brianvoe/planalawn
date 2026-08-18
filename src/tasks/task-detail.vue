<script lang="ts">
import BuyLinks from '../apply/buy-links.vue'
import Conditions from '../components/conditions.vue'
import RateCalculator from './rate-calculator.vue'
import MixCalculator from '../apply/mix-calculator.vue'
import { getTask } from '../data/tasks'
import { productsForTask } from '../data/products'
import { offersFor } from '../data/commerce/offers'
import { PAID_LINK_NOTE, isPaidLink } from '../services/affiliate'
import { grassNoteForTask, grassTypeLabels } from '../data/grass'
import { evaluateTask } from '../services/timing'
import { timingByTask } from '../data/timingRules'
import { sequenceFor } from '../data/sequencing'
import type { PropType } from 'vue'
import type { Conditions as Weather, EvaluatedTask, GrassType, Product, Task } from '../types'

/** A neighbouring job, with the interval the plan would leave between them. */
interface Neighbour {
  id: string
  name: string
  gap: string
}

export default {
  name: 'TaskDetail',
  components: { BuyLinks, Conditions, MixCalculator, RateCalculator },
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
    /** The named products that serve this job, if any are catalogued. */
    taskProducts(): Product[] {
      return productsForTask(this.id)
    },
    /**
     * Whether anything in this section earns, which is what the disclosure
     * hangs on. Carried here rather than on each row so the sentence appears
     * once instead of beside every product.
     */
    paidNote(): string {
      const paid = this.taskProducts.some((p) => offersFor(p.id).some(isPaidLink))
      return paid ? PAID_LINK_NOTE : ''
    },
    effort(): string {
      return sequenceFor(this.id).effort || ''
    },
    /** What has to be done, and settled, before this job is worth starting. */
    comesAfter(): Neighbour[] {
      const waits = sequenceFor(this.id).after || {}
      return (this.task?.prerequisites || []).map((pid) => ({
        id: pid,
        name: this.nameFor(pid),
        gap: this.gapLabel(waits[pid]),
      }))
    },
    /** What this one unblocks, and how long each of those has to wait on it. */
    comesBefore(): Neighbour[] {
      return (this.task?.nextTasks || []).map((nid) => ({
        id: nid,
        name: this.nameFor(nid),
        gap: this.gapLabel(sequenceFor(nid).after?.[this.id]),
      }))
    },
  },
  methods: {
    nameFor(taskId: string): string {
      return getTask(taskId)?.name || taskId
    },
    /** Zero days is not "no wait" — it means the same trip across the lawn. */
    gapLabel(days: number | undefined): string {
      if (days == null) return ''
      return days === 0 ? 'same visit' : `leave ${days} days`
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

  /*
   * The reading and the verdict it feeds sit beside the title rather than
   * above the steps: they are the answer to "can I do this today", which is
   * asked before the instructions matter. The job itself then runs full width.
   */
  .task-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 24rem);
    gap: 1.25rem 2rem;
    align-items: start;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .task-aside {
    display: grid;
    gap: 0.7rem;
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
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0;
      font-size: 1.1rem;
    }

    .chip {
      padding: 0.2rem 0.55rem;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--color-text-muted);
      background: var(--color-bg-soft);
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

  /*
   * Two columns because they answer different questions on the morning of a
   * job: what to fetch from the shed, and what to stop and buy first.
   */
  .kit__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem 1.5rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }

    h3 {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0 0 0.45rem;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    /* Scoped to the headings: the buy links nested below carry their own
       icon sizing, and a bare descendant rule would shrink it. */
    h3 svg {
      width: 0.8rem;
      height: 0.8rem;
      color: var(--color-primary-strong);
    }
  }

  .kit__products {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.9rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--color-border);
  }

  .kit__product {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.9rem;
  }

  .kit__product-name {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem;
    flex: 1 1 11rem;
    margin: 0;
    font-size: 0.9rem;

    span {
      font-size: 0.76rem;
      color: var(--color-text-muted);
    }
  }

  .kit__link {
    margin: 0.55rem 0 0;
    font-size: 0.84rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  /* Sits above the links rather than below them: a disclosure a reader meets
     after clicking has done nothing. */
  .kit__disclosure {
    margin: 0;
    font-size: 0.78rem;
  }

  .block {
    h2 {
      margin: 0 0 0.65rem;
      font-size: 1.15rem;
    }

    /* Bulleted prose lists. Nested components bring their own lists and style
       them themselves, so they are held out rather than left to fight this on
       specificity. */
    ol,
    ul:not(.buy-links__list) {
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

  .chip-row .chip {
    text-decoration: none;

    small {
      font-weight: 400;
      opacity: 0.8;
    }
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
      <div class="task-top">
        <header class="page-header">
          <span class="cat">{{ task.category }}</span>
          <h1>{{ task.name }}</h1>
          <p class="lede">{{ task.summary }}</p>
        </header>

        <aside class="task-aside">
          <Conditions
            v-if="needsSoil"
            compact
            :conditions="conditions"
            :error="weatherError"
            :loading="weatherLoading"
            @refresh="$emit('refresh-weather')"
          />
          <div class="timing-box" v-if="evaluation">
            <h2>
              Timing
              <span v-if="effort" class="chip">{{ effort }}</span>
            </h2>
            <p>{{ evaluation.reason }}</p>
            <p class="muted">{{ evaluation.rule.note }}</p>
            <p v-if="needsSoil && evaluation.soil" class="soil">
              Soil gate: <strong>{{ evaluation.soil.label }}</strong> — {{ evaluation.soil.detail }}
            </p>
            <p v-if="grassHint" class="soil">{{ grassHint }}</p>
          </div>
        </aside>
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

      <section class="block kit">
        <h2>What you need</h2>
        <div class="kit__grid">
          <div v-if="task.equipment.length">
            <h3>
              <font-awesome-icon icon="fa-solid fa-trowel" />
              Equipment
            </h3>
            <ul>
              <li v-for="m in task.equipment" :key="m">{{ m }}</li>
            </ul>
          </div>
          <div v-if="task.supplies.length">
            <h3>
              <font-awesome-icon icon="fa-solid fa-cart-shopping" />
              Buy before you start
            </h3>
            <ul>
              <li v-for="m in task.supplies" :key="m">{{ m }}</li>
            </ul>

            <div v-if="taskProducts.length" class="kit__products">
              <p v-if="paidNote" class="kit__link kit__disclosure">{{ paidNote }}</p>

              <div v-for="p in taskProducts" :key="p.id" class="kit__product">
                <p class="kit__product-name">
                  <strong>{{ p.name }}</strong>
                  <span>{{ p.brand }}</span>
                </p>
                <BuyLinks :product-id="p.id" compact />
              </div>

              <p class="kit__link">
                <router-link :to="{ name: 'calculate', query: { task: task.id } }">
                  Work out how much you need
                </router-link>
                — label rates and spreader settings for your lawn.
              </p>
            </div>
          </div>
        </div>
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
      </section>

      <section v-if="comesAfter.length || comesBefore.length" class="block links">
        <div v-if="comesAfter.length">
          <h2>Comes after</h2>
          <div class="chip-row">
            <router-link
              v-for="prev in comesAfter"
              :key="prev.id"
              class="chip chip--brand"
              :to="`/tasks/${prev.id}`"
            >
              {{ prev.name }}
              <small v-if="prev.gap">· {{ prev.gap }}</small>
            </router-link>
          </div>
        </div>
        <div v-if="comesBefore.length">
          <h2>Then</h2>
          <div class="chip-row">
            <router-link
              v-for="next in comesBefore"
              :key="next.id"
              class="chip chip--brand"
              :to="`/tasks/${next.id}`"
            >
              {{ next.name }}
              <small v-if="next.gap">· {{ next.gap }}</small>
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
