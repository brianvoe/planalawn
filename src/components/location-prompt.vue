<script lang="ts">
import LocationActions from './location-actions.vue'
import type { UserLocation } from '../types'

export default {
  name: 'LocationPrompt',
  components: { LocationActions },
  computed: {
    location(): UserLocation {
      return this.$store.state.location
    },
    hasLocation(): boolean {
      return this.$store.getters.hasLocation
    },
    show(): boolean {
      return !this.hasLocation && !this.location.promptDismissed
    },
  },
  methods: {
    dismiss() {
      this.$store.dispatch('dismissLocationPrompt')
    },
  },
}
</script>

<style lang="scss">
.loc-prompt {
  background: var(--color-primary-soft);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);

  .loc-prompt__inner {
    display: grid;
    gap: 0.9rem;
    padding: 1rem 0;
  }

  .loc-prompt__head {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .loc-prompt__icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-primary-strong);
    background: var(--color-surface);
    border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
    border-radius: 13px;

    svg {
      width: 1.15rem;
      height: 1.15rem;
    }
  }

  .loc-prompt__copy {
    min-width: 0;

    h2 {
      margin: 0 0 0.2rem;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.4;
      color: var(--color-text-muted);
    }
  }

  .loc-prompt__uses {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.55rem;

    .chip {
      color: var(--color-primary-strong);
      background: var(--color-surface);
    }
  }

  .loc-actions .btn--ghost {
    margin-left: auto;

    @media (max-width: 559px) {
      margin-left: 0;
    }
  }
}
</style>

<template>
  <section v-if="show" class="loc-prompt">
    <div class="loc-prompt__inner container">
      <div class="loc-prompt__head">
        <span class="loc-prompt__icon" aria-hidden="true">
          <font-awesome-icon icon="fa-solid fa-location-dot" />
        </span>
        <div class="loc-prompt__copy">
          <h2>Where’s your lawn?</h2>
          <p>A nearby city is all we need as a climate reference — nothing is uploaded.</p>
          <div class="loc-prompt__uses">
            <span class="chip">
              <font-awesome-icon icon="fa-solid fa-temperature-half" />
              Soil temp
            </span>
            <span class="chip">
              <font-awesome-icon icon="fa-solid fa-calendar-day" />
              Timing
            </span>
            <span class="chip">
              <font-awesome-icon :icon="['lawn', 'seed']" />
              Seed scores
            </span>
          </div>
        </div>
      </div>

      <LocationActions>
        <button type="button" class="btn btn--ghost" @click="dismiss">Not now</button>
      </LocationActions>
    </div>
  </section>
</template>
