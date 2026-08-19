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
  /* Shared, because the collapsing menu has to pay one of these back. */
  --nav-row-gap: 0.65rem;
  --nav-pad-y: 0.7rem;

  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);

  .site-nav__inner {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--nav-row-gap) 1rem;
    padding-block: var(--nav-pad-y);

    /* Held to the token the home hero measures itself against. */
    @media (min-width: 1024px) {
      min-height: var(--nav-height);
      padding-block: 0;
    }

    @media (max-width: 1023px) {
      display: flex;
      flex-wrap: wrap;

      /*
       * A shut menu is still a flex line, and a flex line is still charged the
       * bar's row gap even at zero height — a negative margin on it won't help,
       * because the line clamps to nothing and the gap is levied either way.
       * So the bar pays for it out of its own bottom padding while shut, and
       * puts it back as the menu opens. The space below the last thing on
       * screen is the same either way; only the row it belongs to changes.
       */
      padding-bottom: calc(var(--nav-pad-y) - var(--nav-row-gap));
      transition: padding-bottom 0.24s ease;

      &--open {
        padding-bottom: var(--nav-pad-y);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .site-nav__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    justify-self: start;
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
      margin-left: auto;
    }
  }

  /*
   * A wrapper that exists only so the menu can open on narrow screens.
   *
   * Sliding to a height nobody has measured needs a parent track to run from
   * 0fr to 1fr — the display: none it replaces cannot be transitioned at all,
   * and a max-height guess either clips a longer menu or coasts through empty
   * space on a short one. On desktop it steps out of the layout entirely, so
   * the list stays a direct grid item of the bar and keeps its centre column.
   */
  .site-nav__panel {
    display: contents;

    @media (max-width: 1023px) {
      display: grid;
      grid-template-rows: 0fr;
      width: 100%;
      order: 3;
      transition: grid-template-rows 0.24s ease;

      &.open {
        grid-template-rows: 1fr;
      }

      /* Written from the panel rather than as a parent selector on the list:
         nesting it there would compile the bar's own class into the middle of
         the chain, giving a selector nothing can match. */
      &.open .site-nav__links {
        opacity: 1;
        visibility: visible;
        transition:
          opacity 0.24s ease,
          visibility 0s;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .site-nav__links {
    display: flex;
    gap: 0;
    width: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    justify-self: center;

    /* Hairlines between sections, faint enough to read as rhythm rather than
       as chrome — they exist to keep the pill from floating in open space.
       A gradient rather than a border so the ends dissolve instead of stopping
       against the bar's edges, which is what makes them read as a suggestion. */
    li {
      position: relative;
    }

    li + li::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent,
        color-mix(in srgb, var(--color-border) 85%, transparent) 30%,
        color-mix(in srgb, var(--color-border) 85%, transparent) 70%,
        transparent
      );
    }

    @media (max-width: 1023px) {
      display: grid;
      width: 100%;
      min-height: 0;
      /* What the collapsing row actually crops. */
      overflow: hidden;
      opacity: 0;
      /* Held back until the slide finishes, so a closed menu cannot be tabbed
         into — the row has no height but its links are still in the document. */
      visibility: hidden;
      transition:
        opacity 0.18s ease,
        visibility 0s linear 0.24s;

      /* Centred, and each row is its own line, so the pill on the page you're
         on hugs its label the way it does in the desktop bar. */
      li {
        display: flex;
        justify-content: center;
      }

      /* Breathing room before the bar's edge, carried by the last row rather
         than as padding on the list: padding sits outside the box the row
         collapses, so it would leave a sliver of the menu behind when shut. */
      li:last-child {
        padding-bottom: 0.35rem;
      }

      /* Stacked menu: the same fade, turned to match the flow. */
      li + li::before {
        top: 0;
        bottom: auto;
        left: 0;
        width: 100%;
        height: 1px;
        background: linear-gradient(
          to right,
          transparent,
          color-mix(in srgb, var(--color-border) 85%, transparent) 15%,
          color-mix(in srgb, var(--color-border) 85%, transparent) 85%,
          transparent
        );
      }
    }

    a {
      display: inline-block;
      margin: 0 0.25rem;
      padding: 0.32rem 0.7rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-text-muted);
      text-decoration: none;
      border-radius: 999px;
      transition:
        color 0.15s ease,
        background 0.15s ease;

      /* Wider than the desktop pill to keep the tap target honest now that it
         hugs the label instead of spanning the row. */
      @media (max-width: 1023px) {
        margin: 0.2rem 0;
        padding: 0.5rem 1.3rem;
      }

      &:hover {
        color: var(--color-text);
        background: var(--color-bg-soft);
      }

      /* The page you're on: filled, darker and heavier, so a glance at the bar
         answers "where am I" without reading every label. */
      &.router-link-active {
        font-weight: 600;
        color: var(--color-primary-strong);
        background: var(--color-primary-soft);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      a {
        transition: none;
      }
    }
  }

  .site-nav__meta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    justify-self: end;

    @media (max-width: 1023px) {
      margin-left: 0;
    }
  }

  .site-nav__lawn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.32rem 0.7rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: 999px;
    transition:
      color 0.15s ease,
      background 0.15s ease;

    &:hover {
      color: var(--color-text);
      background: var(--color-bg-soft);
    }

    &.router-link-active {
      font-weight: 600;
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }

    .site-nav__lawn-icon {
      display: none;
    }

    /* Narrow: an icon button rather than a label, so the padding that shapes
       the desktop pill has to come back off. */
    @media (max-width: 1023px) {
      width: 2.15rem;
      height: 2.15rem;
      padding: 0;
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
      border-radius: 999px;

      .site-nav__lawn-icon {
        display: block;
        width: 0.9rem;
        height: 0.9rem;
      }

      .site-nav__lawn-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      &:hover,
      &.router-link-active {
        color: var(--color-primary-strong);
        background: color-mix(in srgb, var(--color-primary-soft) 70%, var(--color-primary) 12%);
      }
    }
  }
}
</style>

<template>
  <nav class="site-nav" aria-label="Primary">
    <div class="site-nav__inner container" :class="{ 'site-nav__inner--open': menuOpen }">
      <router-link class="site-nav__brand" to="/">
        <img class="site-nav__mark" src="/favicon.svg" alt="" width="28" height="28" />
        Plan a Lawn
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

      <div class="site-nav__panel" :class="{ open: menuOpen }">
        <ul id="primary-menu" class="site-nav__links">
          <li>
            <router-link to="/calendar" @click="menuOpen = false">Calendar</router-link>
          </li>
          <li>
            <router-link to="/tasks" @click="menuOpen = false">Tasks</router-link>
          </li>
          <li>
            <router-link to="/seeds" @click="menuOpen = false">Seeds</router-link>
          </li>
          <li>
            <router-link to="/calculate" @click="menuOpen = false">Calculate</router-link>
          </li>
        </ul>
      </div>

      <div class="site-nav__meta">
        <router-link to="/settings" class="site-nav__lawn" aria-label="My lawn">
          <font-awesome-icon
            class="site-nav__lawn-icon"
            icon="fa-solid fa-pen-to-square"
            aria-hidden="true"
          />
          <span class="site-nav__lawn-label">My lawn</span>
        </router-link>
        <SoilTemp :conditions="conditions" @click="openLocation" />
      </div>
    </div>
    <LocationModal ref="locationModal" :conditions="conditions" />
  </nav>
</template>
