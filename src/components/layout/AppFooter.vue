<template>
  <footer class="site-footer on-dark">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <strong>Lawn Plan Nerd</strong>
        <p>Soil-temp-aware lawn timing, rates and seed data for the US.</p>
        <p class="site-footer__domain">lawnplannerd.com</p>
      </div>

      <nav class="site-footer__nav" aria-label="Footer">
        <router-link to="/calendar">Calendar</router-link>
        <router-link to="/tasks">Tasks</router-link>
        <router-link to="/seeds">Seeds</router-link>
        <router-link to="/sprayer">Sprayer</router-link>
        <router-link to="/settings">My lawn</router-link>
      </nav>
    </div>

    <div class="site-footer__fine">
      <p>
        Rates are starting templates — always follow the label on the product you buy.
        Soil temperature from Open-Meteo; seed scores from NTEP trial data.
      </p>
      <p>Your lawn profile stays in this browser unless you export it.</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
}
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

// Dark on every route, so the home page's closing call to action flows
// straight into it without a seam.
.site-footer {
  @include wave-top($layer-dark);
  padding-block: clamp(2.5rem, 5vw, 3.5rem) 2rem;
  margin-top: 0;

  &__inner {
    @include container;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem 2.5rem;
  }

  &__brand {
    max-width: 22rem;

    strong {
      font-family: $font-display;
      font-size: 1.15rem;
      font-weight: $font-weight-display;
      letter-spacing: -0.03em;
    }

    p {
      margin: 0.3rem 0 0;
      font-size: 0.9rem;
      line-height: 1.55;
    }

    // Nested so it outranks the sibling `p` rule above without !important.
    .site-footer__domain {
      font-size: 0.8rem;
      letter-spacing: 0.02em;
      color: $accent-on-dark;
    }
  }

  &__nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.4rem;
    align-content: start;

    a {
      font-size: 0.9rem;
      font-weight: 600;
      color: $ink-on-dark;
      text-decoration: none;

      &:hover {
        color: $accent-on-dark;
        text-decoration: underline;
      }
    }
  }

  &__fine {
    @include container;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid $border-on-dark;

    p {
      margin: 0 0 0.3rem;
      max-width: 46rem;
      font-size: 0.78rem;
      line-height: 1.55;
    }
  }
}
</style>
