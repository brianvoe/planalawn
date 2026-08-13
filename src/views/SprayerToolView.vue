<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-header">
        <p class="eyebrow">
          <AppIcon name="spray" />
          Tools
        </p>
        <h1>Label rate to tank mix.</h1>
        <p class="lede">
          Ounces per tank for your lawn size. Always check it against the bottle you bought.
        </p>
      </header>
      <SprayerCalculator rate-key="glyphosate" />
      <p class="hint">
        Also available inside the
        <router-link to="/tasks/lawn-kill">lawn kill task</router-link>.
      </p>
    </div>
  </div>
</template>

<script>
import SprayerCalculator from '../components/rates/SprayerCalculator.vue'
import AppIcon from '../components/ui/AppIcon.vue'

export default {
  name: 'SprayerToolView',
  components: { SprayerCalculator, AppIcon },
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.page__inner {
  @include container;
  padding-block: 2rem 3.5rem;
  display: grid;
  gap: 1.25rem;
}

.page-header {
  h1 {
    margin: 0 0 0.5rem;
  }

  .lede {
    margin: 0;
    color: $color-ink-muted;
    max-width: 40rem;
  }
}

.hint {
  margin: 0;
  font-size: 0.9rem;
  color: $color-ink-muted;
}
</style>
