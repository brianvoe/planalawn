<script lang="ts">
import { tasks } from '../data/tasks'

export default {
  name: 'Tasks',
  data() {
    return { tasks }
  },
}
</script>

<style lang="scss">
.tasks-page {
  .container {
    padding-block: 2rem 3.5rem;
  }

  .page-header {
    margin-bottom: 1.5rem;

    h1 {
      margin: 0 0 0.5rem;
    }

    .lede {
      margin: 0;
      max-width: 36rem;
      color: var(--color-text-muted);
    }
  }

  .task-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .task-card {
    padding: 1.15rem;
    color: inherit;
    text-decoration: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: calc(var(--border-radius) * 2);
    box-shadow: var(--shadow);

    .cat {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1.2;
      text-transform: uppercase;
      color: var(--color-text-muted);
      background: var(--color-bg-soft);
      border-radius: 999px;
    }

    h2 {
      margin: 0.55rem 0 0.35rem;
      font-size: 1.2rem;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
  }
}
</style>

<template>
  <div class="tasks-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-list-check" />
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
