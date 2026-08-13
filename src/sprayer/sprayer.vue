<template>
  <div class="sprayer-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-spray-can" />
          Tools
        </p>
        <h1>Label rate to tank mix.</h1>
        <p class="lede">
          Ounces per tank for your lawn size. Always check it against the bottle you bought.
        </p>
      </header>
      <Calculator rate-key="glyphosate" />
      <p class="hint">
        Also available inside the
        <router-link to="/tasks/lawn-kill">lawn kill task</router-link>.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Calculator from './calculator.vue'

export default {
  name: 'Sprayer',
  components: { Calculator },
}
</script>

<style lang="scss">
.sprayer-page {
  .container {
    display: grid;
    gap: 1.25rem;
    padding-block: 2rem 3.5rem;
  }

  .page-header {
    h1 {
      margin: 0 0 0.5rem;
    }

    .lede {
      margin: 0;
      max-width: 40rem;
      color: var(--color-text-muted);
    }
  }

  .hint {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }
}
</style>
