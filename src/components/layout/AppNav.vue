<template>
  <nav class="site-nav" aria-label="Primary">
    <div class="site-nav__inner">
      <router-link class="site-nav__brand" to="/">Lawn Plan Nerd</router-link>

      <button
        type="button"
        class="btn btn--sm site-nav__toggle"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-controls="primary-menu"
        @click="menuOpen = !menuOpen"
      >
        Menu
      </button>

      <ul id="primary-menu" class="site-nav__links" :class="{ open: menuOpen }">
        <li><router-link to="/calendar" @click="menuOpen = false">Calendar</router-link></li>
        <li><router-link to="/tasks" @click="menuOpen = false">Tasks</router-link></li>
        <li><router-link to="/seeds" @click="menuOpen = false">Seeds</router-link></li>
        <li><router-link to="/tools/sprayer" @click="menuOpen = false">Sprayer</router-link></li>
        <li><router-link to="/settings" @click="menuOpen = false">My lawn</router-link></li>
      </ul>

      <SoilTempChip :conditions="conditions" />
    </div>
  </nav>
</template>

<script>
import SoilTempChip from './SoilTempChip.vue'

export default {
  name: 'AppNav',
  components: { SoilTempChip },
  props: {
    conditions: { type: Object, default: null },
  },
  data() {
    return { menuOpen: false }
  },
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.site-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  background: rgba($color-bg, 0.92);
  border-bottom: 1px solid $color-border;

  &__inner {
    @include container;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem 1rem;
    padding-block: 0.7rem;
  }

  &__brand {
    font-family: $font-display;
    font-size: 1.02rem;
    font-weight: $font-weight-display;
    letter-spacing: -0.03em;
    color: $color-ink;
    text-decoration: none;
    margin-right: auto;
  }

  &__toggle {
    @media (min-width: $bp-lg) {
      display: none;
    }
  }

  &__links {
    display: none;
    gap: 0.85rem;
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    order: 3;

    &.open {
      display: grid;
      gap: 0.35rem;
      padding-bottom: 0.35rem;
    }

    @media (min-width: $bp-lg) {
      display: flex;
      width: auto;
      order: 0;
    }

    a {
      text-decoration: none;
      color: $color-ink-muted;
      font-size: 0.85rem;
      font-weight: 500;

      &.router-link-active {
        color: $color-ink;
      }

      &:hover {
        color: $color-ink;
      }
    }
  }
}
</style>
