<script lang="ts">
import LocationModal from './location-modal.vue'
import SoilTemp from './soil-temp.vue'
import type { PropType } from 'vue'
import type { Conditions } from '../types'

export default {
  name: 'Nav',
  components: { LocationModal, SoilTemp },
  props: {
    conditions: { type: Object as PropType<Conditions | null>, default: null },
  },
  data() {
    return { menuOpen: false }
  },
  methods: {
    openLocation() {
      ;(this.$refs.locationModal as InstanceType<typeof LocationModal> | undefined)?.open()
    },
  },
}
</script>

<style lang="scss">
.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);

  .site-nav__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem 1rem;
    padding-block: 0.7rem;
  }

  .site-nav__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-right: auto;
    font-family: var(--font-display);
    font-size: 1.02rem;
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.03em;
    color: var(--color-text);
    text-decoration: none;
  }

  .site-nav__mark {
    display: block;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 6px;
  }

  .site-nav__toggle {
    display: none;

    @media (max-width: 1023px) {
      display: inline-flex;
    }
  }

  .site-nav__links {
    display: flex;
    gap: 0.85rem;
    width: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    order: 0;

    @media (max-width: 1023px) {
      display: none;
      width: 100%;
      order: 3;

      &.open {
        display: grid;
        gap: 0.35rem;
        padding-bottom: 0.35rem;
      }
    }

    a {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-text-muted);
      text-decoration: none;

      &.router-link-active {
        color: var(--color-text);
      }

      &:hover {
        color: var(--color-text);
      }
    }
  }
}
</style>

<template>
  <nav class="site-nav" aria-label="Primary">
    <div class="site-nav__inner container">
      <router-link class="site-nav__brand" to="/">
        <img class="site-nav__mark" src="/favicon.svg" alt="" width="28" height="28" />
        Lawn Plan Nerd
      </router-link>

      <button
        type="button"
        class="btn btn--sm site-nav__toggle"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-controls="primary-menu"
        @click="menuOpen = !menuOpen"
      >
        <font-awesome-icon :icon="menuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" />
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>

      <ul id="primary-menu" class="site-nav__links" :class="{ open: menuOpen }">
        <li><router-link to="/calendar" @click="menuOpen = false">Calendar</router-link></li>
        <li><router-link to="/tasks" @click="menuOpen = false">Tasks</router-link></li>
        <li><router-link to="/seeds" @click="menuOpen = false">Seeds</router-link></li>
        <li><router-link to="/tools/sprayer" @click="menuOpen = false">Sprayer</router-link></li>
        <li><router-link to="/settings" @click="menuOpen = false">My lawn</router-link></li>
      </ul>

      <SoilTemp :conditions="conditions" @click="openLocation" />
    </div>
    <LocationModal ref="locationModal" :conditions="conditions" />
  </nav>
</template>
