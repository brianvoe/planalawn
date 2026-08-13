<template>
  <footer class="site-footer on-dark wave-top">
    <div class="site-footer__inner container">
      <div class="site-footer__brand">
        <strong>Lawn Plan Nerd</strong>
        <p>Soil-temp-aware lawn timing, rates and seed data for the US.</p>
        <p class="site-footer__domain">lawnplannerd.com</p>
      </div>

      <nav class="site-footer__nav" aria-label="Footer">
        <router-link to="/calendar">Calendar</router-link>
        <router-link to="/tasks">Tasks</router-link>
        <router-link to="/seeds">Seeds</router-link>
        <router-link to="/tools/sprayer">Sprayer</router-link>
        <router-link to="/settings">My lawn</router-link>
      </nav>
    </div>

    <div class="site-footer__fine container">
      <p>
        Rates are starting templates — always follow the label on the product you buy.
        Soil temperature from Open-Meteo; seed scores from NTEP trial data.
      </p>
      <p>Your lawn profile stays in this browser unless you export it.</p>
    </div>
  </footer>
</template>

<script lang="ts">
export default {
  name: 'Footer',
}
</script>

<style lang="scss">
.site-footer {
  --band-fill: var(--color-dark);
  margin-top: 0;
  padding-block: clamp(2.5rem, 5vw, 3.5rem) 2rem;

  .site-footer__inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1.5rem 2.5rem;
  }

  .site-footer__brand {
    max-width: 22rem;

    strong {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.03em;
    }

    p {
      margin: 0.3rem 0 0;
      font-size: 0.9rem;
      line-height: 1.55;
    }

    .site-footer__domain {
      font-size: 0.8rem;
      letter-spacing: 0.02em;
      color: var(--color-accent);
    }
  }

  .site-footer__nav {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: 0.5rem 1.4rem;

    a {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-accent);
        text-decoration: underline;
      }
    }
  }

  .site-footer__fine {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--color-border);

    p {
      margin: 0 0 0.3rem;
      max-width: 46rem;
      font-size: 0.78rem;
      line-height: 1.55;
    }
  }
}
</style>
