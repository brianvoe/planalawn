<script lang="ts">
import Conditions from '../components/conditions.vue'
import ProductCard from '../apply/product-card.vue'
import RateCalculator from './rate-calculator.vue'
import MixCalculator from '../apply/mix-calculator.vue'
import { getTask } from '../data/tasks'
import { productsForTask } from '../data/products'
import { offersFor } from '../data/commerce/offers'
import { PAID_LINK_NOTE_SHORT, isPaidLink } from '../services/affiliate'
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
  components: { Conditions, MixCalculator, ProductCard, RateCalculator },
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
     * Whether there is a second column at all.
     *
     * Mowing, watering and the bed jobs have no products and no soil gate, so
     * the rail would be an empty 21rem holding the prose to two-thirds width
     * for nothing. Those pages get the full measure instead.
     */
    hasRail(): boolean {
      return this.needsSoil || this.taskProducts.length > 0
    },
    /**
     * Whether anything in this section earns, which is what the disclosure
     * hangs on. Carried here rather than on each row so the sentence appears
     * once instead of beside every product.
     */
    paidNote(): string {
      const paid = this.taskProducts.some((p) => offersFor(p.id).some(isPaidLink))
      return paid ? PAID_LINK_NOTE_SHORT : ''
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
   * Two columns for the whole page, not just its top.
   *
   * The rail carries the two things you want before you have read anything —
   * the reading that says whether today is the day, and the products the job
   * needs — so both are on screen at once. Running it the full height is what
   * keeps that from costing anything: when the split was only over the header,
   * the rail stood taller than the title beside it and left a hole above
   * "Why". The reading column is far the longer of the two on every task, so
   * it sets the height and the rail simply follows it down.
   */
  .task-layout {
    display: grid;
    gap: 1.5rem 2rem;

    /*
     * The split is stated once, areas and placements together, and only where
     * it applies. Both ways out of it — a narrow screen, or a job with nothing
     * to put in the rail — are then just its absence, leaving one column in
     * source order, which is already the order to read in: the job, when to do
     * it, what to buy, then how. Placing the children in rules of their own
     * would leave them naming areas that no longer exist on those two paths,
     * and a grid item sent to a missing area stacks on top of its siblings.
     */
    @media (min-width: 900px) {
      &:not(.task-layout--solo) {
        grid-template-columns: minmax(0, 1fr) minmax(17rem, 21rem);
        grid-template-areas:
          'head rail'
          'timing rail'
          'main rail';

        > .page-header {
          grid-area: head;
        }

        > .timing-box {
          grid-area: timing;
        }

        > .task-rail {
          grid-area: rail;
        }

        > .task-main {
          grid-area: main;
        }
      }
    }
  }

  .task-main {
    display: grid;
    gap: 1.5rem;
    align-content: start;
  }

  /*
   * Scrolls with the page rather than following it down.
   *
   * Pinning it needs a height cap, because feeding and broadleaf weeds list
   * seven products and the rail is taller than a laptop window — and a cap
   * means a scrollbar inside a column that is only about 21rem wide, which
   * reads as a defect rather than an affordance. The products are already the
   * first thing beside the title, so pinning was buying very little.
   */
  .task-rail__inner {
    display: grid;
    gap: 0.7rem;
    align-content: start;
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

    h3 svg {
      width: 0.8rem;
      height: 0.8rem;
      color: var(--color-primary-strong);
    }
  }

  .rail-products {
    display: grid;
    gap: 0.6rem;

    h2 {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin: 0.4rem 0 0;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);

      svg {
        width: 0.8rem;
        height: 0.8rem;
        color: var(--color-primary-strong);
      }
    }
  }

  /* Above the cards rather than below them: a disclosure a reader meets after
     clicking has done nothing. */
  .rail-products__note {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .rail-products__link {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--color-text-muted);
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

      <div class="task-layout" :class="{ 'task-layout--solo': !hasRail }">
        <header class="page-header">
          <span class="cat">{{ task.category }}</span>
          <h1>{{ task.name }}</h1>
          <p class="lede">{{ task.summary }}</p>
        </header>

        <div class="timing-box" v-if="evaluation">
          <h2>
            Timing
            <span v-if="effort" class="chip">{{ effort }}</span>
          </h2>
          <p>{{ evaluation.reason }}</p>
          <p class="muted">{{ evaluation.rule.note }}</p>
          <p v-if="needsSoil && evaluation.soil" class="soil">
            Soil gate: <strong>{{ evaluation.soil.label }}</strong> —
            {{ evaluation.soil.detail }}
          </p>
          <p v-if="grassHint" class="soil">{{ grassHint }}</p>
        </div>

        <aside v-if="hasRail" class="task-rail">
          <div class="task-rail__inner">
            <Conditions
              v-if="needsSoil"
              compact
              :conditions="conditions"
              :error="weatherError"
              :loading="weatherLoading"
              @refresh="$emit('refresh-weather')"
            />

            <section v-if="taskProducts.length" class="rail-products">
              <h2>
                <font-awesome-icon icon="fa-solid fa-cart-shopping" />
                What to buy
              </h2>
              <p v-if="paidNote" class="rail-products__note">{{ paidNote }}</p>

              <ProductCard
                v-for="p in taskProducts"
                :key="p.id"
                :product="p"
                :in-task-id="task.id"
              />

              <p class="rail-products__link">
                <router-link :to="{ name: 'calculate', query: { task: task.id } }">
                  Work out how much you need
                </router-link>
                — label rates and spreader settings for your lawn.
              </p>
            </section>
          </div>
        </aside>

        <div class="task-main">
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

          <section class="block kit" v-if="task.equipment.length || task.supplies.length">
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
      </div>
    </div>
    <div v-else class="container">
      <p>Task not found. <router-link to="/tasks">Back to tasks</router-link></p>
    </div>
  </div>
</template>
