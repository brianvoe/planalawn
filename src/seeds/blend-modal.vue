<script lang="ts">
import FitMeters from './fit-meters.vue'
import Modal from '../components/modal.vue'
import SlimSelect from 'slim-select/vue'
import {
  cultivarsForSpecies,
  indexForBlend,
  isNamedCultivar,
  loadedSpecies,
  speciesList,
} from '../data/seedDb'
import {
  factorBaselines,
  scoreBlendForLocation,
  usesRegionalQuality,
} from '../services/suitability'
import { fitTone } from './fit-ui'
import type { PropType } from 'vue'
import type { Blend, BlendComponent, BlendFit, ScoreFactor, UserLocation } from '../types'

/** Stands in for a brand on blends you entered, here and in the brand filter. */
const MY_BRAND = 'Yours'

const SPECIES_LABELS: Record<string, string> = Object.fromEntries(
  speciesList.map((s) => [s.id, s.label]),
)

interface Pick {
  id: string
  name: string
  species: string
  speciesLabel: string
}

/**
 * Every grass you can put in your own blend, grouped by species.
 *
 * Only named cultivars from trials we hold are offered: a bag entered from a
 * name we have no plots for could never be scored, and letting it be typed in
 * would promise a rating the data can't back. Keyed by species and id together
 * because the same name can appear in two trials.
 */
const PICKS: Record<string, Pick> = {}
const PICK_GROUPS = loadedSpecies.map((s) => ({
  label: s.label,
  options: cultivarsForSpecies(s.id)
    .filter(isNamedCultivar)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => {
      const key = `${s.id}:${c.id}`
      PICKS[key] = { id: c.id, name: c.name, species: s.id, speciesLabel: s.label }
      return { text: c.name, value: key }
    }),
}))

function emptyDraft() {
  return { name: '', picks: [{ key: '', percent: null as number | null }] }
}

export default {
  name: 'BlendModal',
  components: { FitMeters, Modal, SlimSelect },
  props: {
    userLocation: { type: Object as PropType<UserLocation | null>, default: null },
    /** Blends you've already saved, listed so they can be revisited or dropped. */
    myBlends: { type: Array as PropType<Blend[]>, default: () => [] },
  },
  emits: ['saved', 'deleted'],
  data() {
    return {
      pickGroups: PICK_GROUPS,
      draft: emptyDraft(),
    }
  },
  computed: {
    /** Resolved picks, deduped — the same grass twice would double its weight. */
    draftPicks(): Pick[] {
      const seen = new Set<string>()
      return this.draft.picks
        .map((p) => PICKS[p.key])
        .filter((pick): pick is Pick => {
          if (!pick || seen.has(pick.id)) return false
          seen.add(pick.id)
          return true
        })
    },
    /**
     * Which trial the blend gets scored against: the species with the most seed
     * in the bag, so a fescue mix with a little bluegrass still reads as fescue.
     */
    draftSpecies(): string {
      const weights: Record<string, number> = {}
      this.draft.picks.forEach((p) => {
        const pick = PICKS[p.key]
        if (!pick) return
        weights[pick.species] = (weights[pick.species] || 0) + (p.percent || 1)
      })
      const ranked = Object.keys(weights).sort((a, b) => weights[b] - weights[a])
      return ranked[0] || ''
    },
    draftComponents(): BlendComponent[] {
      const percents = new Map(
        this.draft.picks.map((p) => [p.key, p.percent] as [string, number | null]),
      )
      return this.draftPicks.map((pick) => ({
        name: pick.name,
        cultivarId: pick.id,
        percent: percents.get(`${pick.species}:${pick.id}`) || null,
      }))
    },
    /** A throwaway blend so the form can show the same score the card will. */
    draftBlend(): Blend | null {
      if (!this.draftPicks.length) return null
      return {
        id: 'draft',
        name: this.draft.name.trim() || 'Your blend',
        manufacturer: MY_BRAND,
        species: this.draftSpecies,
        curated: false,
        components: this.draftComponents,
      }
    },
    draftFit(): BlendFit | null {
      const blend = this.draftBlend
      if (!blend) return null
      return scoreBlendForLocation(blend, indexForBlend(blend.species), this.userLocation)
    },
    draftBaselines(): Partial<Record<ScoreFactor, number>> {
      const species = this.draftSpecies
      if (!species) return {}
      return factorBaselines(cultivarsForSpecies(species), this.userLocation)
    },
    /**
     * How the percentages will be read, said plainly.
     *
     * Weighting only uses them when every row has one, so a half-filled set
     * would quietly become an even split — worth saying before you save.
     */
    percentNote(): string {
      const picks = this.draftPicks
      if (!picks.length) return ''
      const entered = this.draftComponents.filter((c) => c.percent != null)
      if (!entered.length) return 'Percentages are optional — blank splits the bag evenly.'
      if (entered.length < picks.length) {
        return 'Fill in every percentage or none — a partial set is read as an even split.'
      }
      const total = entered.reduce((s, c) => s + (c.percent || 0), 0)
      return total === 100
        ? 'Totals 100%.'
        : `Totals ${Math.round(total)}% — tags usually add to 100.`
    },
    /** What the draft is, in the words the card will use: grass type and count. */
    draftSummary(): string {
      const picks = this.draftPicks
      if (!picks.length) return ''
      const label = SPECIES_LABELS[this.draftSpecies] || this.draftSpecies
      const mixed = new Set(picks.map((p) => p.species)).size > 1
      const noun = picks.length === 1 ? 'cultivar' : 'cultivars'
      return `${label}${mixed ? ' mix' : ''} · ${picks.length} ${noun}`
    },
    regionalQuality(): boolean {
      return usesRegionalQuality(this.userLocation?.climateBand)
    },
    canSave(): boolean {
      return Boolean(this.draft.name.trim() && this.draftPicks.length)
    },
  },
  methods: {
    fitTone,
    open() {
      ;(this.$refs.modal as InstanceType<typeof Modal> | undefined)?.open()
      // Straight into the field you have to fill, since the tag is in your hand.
      this.$nextTick(() => (this.$refs.name as HTMLInputElement | undefined)?.focus())
    },
    close() {
      ;(this.$refs.modal as InstanceType<typeof Modal> | undefined)?.close()
    },
    addPick() {
      this.draft.picks.push({ key: '', percent: null })
    },
    removePick(i: number) {
      this.draft.picks.splice(i, 1)
      if (!this.draft.picks.length) this.addPick()
    },
    /**
     * Save and get out of the way.
     *
     * Dismissing keeps the draft — a stray backdrop click shouldn't cost you a
     * tag you were halfway through typing — so the reset belongs here instead.
     */
    saveDraft() {
      if (!this.canSave) return
      const species = this.draftSpecies
      this.$store.dispatch('upsertUserBlend', {
        name: this.draft.name.trim(),
        manufacturer: MY_BRAND,
        species,
        summary: 'Your own mix, scored against the same NTEP trials as every other listing.',
        components: this.draftComponents,
      })
      this.draft = emptyDraft()
      this.$emit('saved', species)
      this.close()
    },
    forgetBlend(id: string) {
      this.$store.dispatch('deleteUserBlend', id)
      this.$emit('deleted')
    },
  },
}
</script>

<style lang="scss">
.blend-modal {
  .modal {
    max-width: 780px;
  }

  .blend-modal__body {
    display: grid;
    gap: 0.9rem;
  }

  .blend-modal__hint {
    margin: 0;
    max-width: 46rem;
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--color-text-muted);
  }

  .blend-modal__field {
    display: grid;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-muted);

    > .input {
      max-width: 24rem;
    }
  }

  /* The cultivar select takes the room; the percent stays a narrow companion. */
  .pick-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4.5rem 2.25rem;
    gap: 0.4rem;
    align-items: center;
    max-width: 30rem;
  }

  .pick-row__pct {
    text-align: right;
  }

  .pick-row__drop {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: var(--color-text-muted);
    background: none;
    border: none;
    border-radius: 999px;
    cursor: pointer;

    &:hover {
      color: var(--color-text);
      background: var(--color-surface-alt);
    }
  }

  .blend-modal__addrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.85rem;
  }

  .blend-modal__note {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }

  /* The same score and bars the card will show, before you commit to saving. */
  .blend-modal__preview {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.7rem;
    padding: 0.7rem 0.85rem;
    background: var(--color-bg-soft);
    border-radius: var(--border-radius);

    .fit-meters {
      flex: 1 1 100%;
      max-width: 30rem;
    }
  }

  .blend-modal__preview-meta {
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }

  .saved {
    display: grid;
    gap: 0.4rem;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--color-border);
  }

  .saved__label {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .saved__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .saved__item {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    padding: 0.15rem 0.25rem 0.15rem 0.6rem;
    font-size: 0.82rem;
    font-weight: 600;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .saved__drop {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.3rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    background: none;
    border: none;
    border-radius: 999px;
    cursor: pointer;

    &:hover {
      color: var(--color-danger);
    }
  }

  .blend-modal__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 0.85rem;

    /* Stacked, the button leads and the fine print sits under it. */
    @media (max-width: 559px) {
      .btn {
        order: -1;
        width: 100%;
      }
    }
  }
}
</style>

<template>
  <Teleport to="body">
    <Modal ref="modal" class="blend-modal">
      <template #header>
        <font-awesome-icon :icon="['lawn', 'seed-bag']" />
        Your blends
      </template>

      <template #body>
        <div class="blend-modal__body">
          <section v-if="myBlends.length" class="saved">
            <p class="saved__label">Saved</p>
            <ul class="saved__list">
              <li v-for="b in myBlends" :key="b.id" class="saved__item">
                <router-link :to="{ name: 'seed-blend', params: { id: b.id } }" @click="close">
                  {{ b.name }}
                </router-link>
                <button
                  type="button"
                  class="saved__drop"
                  :aria-label="'Delete ' + b.name"
                  title="Delete this blend"
                  @click="forgetBlend(b.id)"
                >
                  <font-awesome-icon icon="fa-solid fa-xmark" />
                </button>
              </li>
            </ul>
          </section>

          <p class="blend-modal__hint">
            Read the tag on your bag and pick the names printed on it. Only grasses from the NTEP
            trials we hold are listed — that’s what makes a score possible. Your blend then ranks,
            charts, and compares beside every other listing.
          </p>

          <label class="blend-modal__field">
            <span>Blend name</span>
            <input
              ref="name"
              v-model="draft.name"
              class="input"
              type="text"
              placeholder="e.g. Front lawn mix"
            />
          </label>

          <div class="blend-modal__field">
            <span>Cultivars on the tag</span>
            <div v-for="(row, i) in draft.picks" :key="i" class="pick-row">
              <SlimSelect
                v-model="row.key"
                :data="pickGroups"
                :settings="{
                  allowDeselect: false,
                  placeholderText: 'Choose a cultivar…',
                  searchPlaceholder: 'Search cultivars…',
                  contentPosition: 'fixed',
                }"
                aria-label="Cultivar"
              />
              <input
                v-model.number="row.percent"
                class="input pick-row__pct"
                type="number"
                min="0"
                max="100"
                placeholder="%"
                aria-label="Percent of the bag"
              />
              <button
                type="button"
                class="pick-row__drop"
                :aria-label="'Remove cultivar ' + (i + 1)"
                @click="removePick(i)"
              >
                <font-awesome-icon icon="fa-solid fa-xmark" />
              </button>
            </div>
            <div class="blend-modal__addrow">
              <button type="button" class="btn btn--ghost" @click="addPick">Add cultivar</button>
              <span v-if="percentNote" class="blend-modal__note">{{ percentNote }}</span>
            </div>
          </div>

          <div v-if="draftFit" class="blend-modal__preview">
            <span class="fit" :class="fitTone(draftFit.score)">
              {{ draftFit.label }}
              <em v-if="draftFit.score != null">{{ draftFit.score }}</em>
            </span>
            <span class="blend-modal__preview-meta">{{ draftSummary }}</span>
            <FitMeters
              v-if="draftFit.score != null"
              :fit="draftFit"
              :baselines="draftBaselines"
              :regional="regionalQuality"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="blend-modal__foot">
          <span class="blend-modal__note">Stays in this browser until you export it.</span>
          <button type="button" class="btn btn--primary" :disabled="!canSave" @click="saveDraft">
            Save blend
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>
</template>
