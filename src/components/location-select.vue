<script lang="ts">
import SlimSelect from 'slim-select/vue'
import { locationFromMetro, metroById, slimSelectData } from '../data/metros'

export default {
  name: 'LocationSelect',
  components: { SlimSelect },
  computed: {
    options() {
      return slimSelectData()
    },
    metroId: {
      get(): string {
        return this.$store.state.location.metroId || ''
      },
      set(id: string) {
        const metro = metroById(id)
        if (!metro) return
        this.$store.dispatch('setLocation', locationFromMetro(metro, 'metro'))
      },
    },
  },
}
</script>

<style lang="scss">
.location-select {
  width: 100%;
}
</style>

<template>
  <div class="location-select">
    <SlimSelect
      v-model="metroId"
      :data="options"
      :settings="{
        showSearch: true,
        searchPlaceholder: 'Search cities…',
        placeholderText: 'Choose a city',
        allowDeselect: false,
      }"
      aria-label="City"
    />
  </div>
</template>
