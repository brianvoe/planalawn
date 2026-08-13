<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Modal',
  inheritAttrs: false,
  props: {
    dismissOnBackground: {
      type: Boolean,
      default: true,
    },
    showClose: {
      type: Boolean,
      default: true,
    },
    maxWidth: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  data() {
    return {
      showModal: false,
    }
  },
  computed: {
    modalStyle(): Record<string, string> {
      if (!this.maxWidth) {
        return {}
      }
      return {
        maxWidth: this.maxWidth,
        width: 'auto',
        minWidth: '0',
      }
    },
  },
  methods: {
    open(): void {
      this.showModal = true
    },
    close(): void {
      this.showModal = false
      this.$emit('close')
    },
    state(): boolean {
      return this.showModal
    },
    clickBackground(event: MouseEvent): void {
      if (!this.dismissOnBackground) {
        return
      }
      if (event.target === event.currentTarget) {
        this.close()
      }
    },
  },
})
</script>

<style lang="scss">
.modal-background {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: var(--spacing);
  background: var(--modal-overlay-bg);
  backdrop-filter: blur(var(--modal-overlay-blur));
  -webkit-backdrop-filter: blur(var(--modal-overlay-blur));

  @media (max-width: 559px) {
    padding: 0 var(--spacing-quarter);
  }

  &.modal--narrow .modal {
    max-width: 500px;
  }

  &.modal--medium .modal {
    max-width: 800px;
  }

  &.image {
    .modal {
      width: auto;
      max-width: 95vw;
      max-height: 95vh;
      min-width: auto;
      background: transparent;
      box-shadow: none;

      .body {
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          max-width: 95vw;
          max-height: 95vh;
          width: auto;
          height: auto;
          display: block;
        }
      }
    }
  }

  .modal {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 300px;
    max-width: 1000px;
    max-height: 100%;
    margin: 0 auto;
    background-color: var(--color-surface);
    border-radius: var(--modal-panel-radius);
    border: 1px solid var(--color-border);
    box-shadow: var(--modal-panel-shadow);
    transition: max-width var(--speed) ease;

    .header {
      flex: 0 1 auto;
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      font-size: 1.35rem;
      font-weight: 700;
      padding: var(--spacing);
      border-bottom: solid 1px var(--color-border);

      h3 {
        flex: 1 1 auto;
        min-width: 0;
        margin: 0;
        padding: 0;
        font-size: inherit;
        font-weight: inherit;
      }

      .close {
        flex: none;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 24px;
        line-height: 1;
        cursor: pointer;

        &:hover {
          color: var(--color-text);
        }
      }
    }

    .body {
      flex: 1 1 auto;
      min-height: 0;
      padding: var(--spacing);
      overflow: auto;
    }

    .footer {
      flex: 0 1 auto;
      display: flex;
      flex-direction: row;
      padding: var(--spacing);
      border-top: solid 1px var(--color-border);
      gap: var(--spacing-half);

      > * {
        flex: 1 1 0;
        min-width: 0;
      }
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;

  .modal {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
}
</style>

<template>
  <transition name="modal">
    <div v-if="showModal" :class="['modal-background', $attrs.class]" @click="clickBackground">
      <div class="modal" :style="modalStyle">
        <div v-if="$slots.header || showClose" class="header">
          <h3 v-if="$slots.header"><slot name="header" /></h3>
          <button v-if="showClose" type="button" class="close" aria-label="Close" @click="close()">
            ×
          </button>
        </div>
        <div class="body">
          <slot name="body" />
        </div>
        <div v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>
