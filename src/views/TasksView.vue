<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-header">
        <p class="eyebrow">
          <AppIcon name="tasks" />
          Task library
        </p>
        <h1>Every job, with its numbers.</h1>
        <p class="lede">
          Steps, timing, and how much to put down — worked out for your lawn size.
        </p>
      </header>

      <div class="task-grid">
        <router-link
          v-for="task in tasks"
          :key="task.id"
          class="task-card"
          :to="`/tasks/${task.id}`"
        >
          <span class="cat">{{ task.category }}</span>
          <h2>{{ task.name }}</h2>
          <p>{{ task.summary }}</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { tasks } from '../data/tasks'
import AppIcon from '../components/ui/AppIcon.vue'

export default {
  name: 'TasksView',
  components: { AppIcon },
  data() {
    return { tasks }
  },
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.page__inner {
  @include container;
  padding-block: 2rem 3.5rem;
}

.page-header {
  margin-bottom: 1.5rem;

  h1 {
    margin: 0 0 0.5rem;
  }

  .lede {
    margin: 0;
    color: $color-ink-muted;
    max-width: 36rem;
  }
}

.task-grid {
  display: grid;
  gap: 0.85rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}

.task-card {
  @include card;
  padding: 1.15rem;
  text-decoration: none;
  color: inherit;

  .cat {
    @include label-badge;
    background: $status-neutral-soft;
    color: $color-ink-muted;
    font-size: 0.68rem;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.55rem 0 0.35rem;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    color: $color-ink-muted;
    font-size: 0.9rem;
  }
}
</style>
