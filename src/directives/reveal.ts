import type { Directive } from 'vue'

/**
 * Fade-and-rise an element the first time it reaches the viewport.
 *
 * The binding value is a stagger step — `v-reveal="2"` waits two beats — so a
 * row of cards arrives in order instead of all at once. One observer serves the
 * whole page and drops each element once it has played, so a long page doesn't
 * keep callbacks alive for content the reader has already passed.
 *
 * Whether motion happens at all is left to CSS, which switches the animation
 * off under prefers-reduced-motion while still landing on the final state.
 */
const HIDDEN = 'reveal'
const SHOWN = 'reveal--in'

let observer: IntersectionObserver | null = null

function watcher(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add(SHOWN)
          observer?.unobserve(entry.target)
        })
      },
      // Trips a little before the element is fully on screen; anything already
      // in view at load fires on the observer's first callback.
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    )
  }
  return observer
}

export const reveal: Directive<HTMLElement, number | undefined> = {
  // Hidden in mounted rather than created: Vue writes the element's own class
  // attribute in between, which would drop a class set any earlier. Mounted
  // still runs before the browser paints, so nothing flashes into place.
  mounted(el, binding) {
    if (binding.value) el.style.setProperty('--reveal-step', String(binding.value))
    const io = watcher()
    if (!io) return
    el.classList.add(HIDDEN)
    io.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
