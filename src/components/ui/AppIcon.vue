<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'calendar'">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </template>
    <template v-else-if="name === 'tasks'">
      <path d="M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7.5 4.8M4 12l1.2 1.2L7.5 10.8M4 18l1.2 1.2L7.5 16.8" />
    </template>
    <template v-else-if="name === 'sprout'">
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
      <path d="M12 13c0-3.9 3.1-7 7-7 0 3.9-3.1 7-7 7Z" />
    </template>
    <template v-else-if="name === 'spray'">
      <path d="M10 9h5l2.5-3v11L15 14h-5z" />
      <path d="M10 9H7a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h3" />
      <path d="M20.5 8.5 22 7M20.5 15.5 22 17M21 12h1.5" />
    </template>
    <template v-else-if="name === 'thermometer'">
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 18.5v-2" />
    </template>
    <template v-else-if="name === 'ruler'">
      <rect x="2" y="8" width="20" height="8" rx="1.5" />
      <path d="M7 8v3M12 8v4M17 8v3" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M12 22s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="11" r="2.5" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="M4 12.5 9 17.5 20 6.5" />
    </template>
    <template v-else-if="name === 'save'">
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <path d="M12 4v10M8 10.5l4 4 4-4" />
    </template>
    <template v-else-if="name === 'offline'">
      <path d="M5 18h11a4 4 0 0 0 .6-7.95A6 6 0 0 0 5.2 11.1" />
      <path d="M2 20h20" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </template>
  </svg>
</template>

<script>
/**
 * Inline SVG icon set. Kept in-repo rather than pulled from an icon package so
 * every glyph inherits `currentColor` and the same 1.75 stroke, which is what
 * makes them look like one family.
 */
export const ICON_NAMES = [
  'calendar',
  'tasks',
  'sprout',
  'spray',
  'thermometer',
  'ruler',
  'chart',
  'pin',
  'check',
  'save',
  'offline',
  'clock',
  'arrow-right',
]

export default {
  name: 'AppIcon',
  props: {
    name: {
      type: String,
      required: true,
      validator: (v) => ICON_NAMES.includes(v),
    },
  },
}
</script>

<style lang="scss" scoped>
.icon {
  display: block;
  width: 1.25em;
  height: 1.25em;
}
</style>
