<script lang="ts">
import LocationSelect from '../components/location-select.vue'
import SlimSelect from 'slim-select/vue'
import { zoneLine } from '../data/climate'
import { grassTypeOptions } from '../data/grass'
import { loadedSpecies, speciesList } from '../data/seedDb'
import { spreaderOptions } from '../data/spreaders'
import { requestBrowserLocation } from '../services/geolocation'
import { convertVolume, toGallons, volumeUnit } from '../services/units'
import type { SpreaderOption } from '../data/spreaders'
import type { VolumeUnit } from '../services/units'
import type { AppStore } from '../store/types'
import type {
  BackupPayload,
  GrassType,
  Profile,
  SpeciesInfo,
  SprayUnits,
  UserLocation,
} from '../types'

interface StoreThis {
  $store: AppStore
}

interface SeedSpeciesGroup {
  label: string
  options: { text: string; html: string; value: string }[]
}

function bindProfile<K extends keyof Profile>(field: K) {
  return {
    get(this: StoreThis): Profile[K] {
      return this.$store.state.profile[field]
    },
    set(this: StoreThis, v: Profile[K]) {
      this.$store.dispatch('updateProfile', { [field]: v })
    },
  }
}

export default {
  name: 'Settings',
  components: { LocationSelect, SlimSelect },
  data() {
    return {
      status: '',
      locStatus: '',
      grassTypeOptions,
      soilTypeSelectData: [
        { text: 'Unknown', value: 'none' },
        { text: 'Clay', value: 'clay' },
        { text: 'Loam', value: 'loam' },
        { text: 'Sandy', value: 'sandy' },
      ],
      sunExposureSelectData: [
        { text: 'Unknown', value: 'none' },
        { text: 'Full sun', value: 'full' },
        { text: 'Mixed', value: 'mixed' },
        { text: 'Mostly shade', value: 'shade' },
      ],
      unitChoices: [
        { text: 'fl oz / gal', value: 'us' as SprayUnits },
        { text: 'ml / L', value: 'metric' as SprayUnits },
      ],
    }
  },
  computed: {
    location(): UserLocation {
      return this.$store.state.location
    },
    zoneLabel(): string {
      return zoneLine(this.location)
    },
    lawnName: bindProfile('lawnName'),
    seedSpecies: bindProfile('seedSpecies'),
    grassType: bindProfile('grassType'),
    soilType: bindProfile('soilType'),
    sunExposure: bindProfile('sunExposure'),
    profileNotes: bindProfile('notes'),
    lawnSqFtLocal: {
      get(): number {
        return this.$store.getters.lawnSqFt
      },
      set(v: number) {
        this.$store.dispatch('updateProfile', { lawnSqFt: v })
      },
    },
    sprayUnits(): SprayUnits {
      return this.$store.getters.sprayUnits
    },
    vol(): VolumeUnit {
      return volumeUnit(this.sprayUnits)
    },
    /** The tank as it's marked on the side; gallons are what get stored. */
    tankLocal: {
      get(): number {
        return Number(convertVolume(this.$store.getters.tankGallons, this.vol).toFixed(1))
      },
      set(v: number) {
        const gal = toGallons(Number(v) || 0, this.vol)
        this.$store.dispatch('updateEquipment', { tankGallons: gal || 2 })
      },
    },
    coverageLocal: {
      get(): number {
        return this.$store.getters.sprayCoverage
      },
      set(v: number) {
        this.$store.dispatch('updateEquipment', { sprayCoverageSqFtPerTank: v })
      },
    },
    spreaderLocal: {
      get(): string {
        return this.$store.getters.spreaderId
      },
      set(v: string) {
        this.$store.dispatch('updateEquipment', { spreaderId: v })
      },
    },
    spreaderOptions(): SpreaderOption[] {
      return spreaderOptions('Not set')
    },
    /**
     * The three zones, with your climate already picked for you.
     *
     * There's no "auto" row: an unset profile still reads from the location, so
     * the select shows what the rest of the site is already using. Transition is
     * the fallback before there's a city, being the zone that has to think about
     * both cool- and warm-season grass.
     */
    grassTypeSelect: {
      get(): GrassType {
        return this.$store.getters.grassType || 'mixed'
      },
      set(v: string) {
        this.grassType = v as GrassType
      },
    },
    grassTypeSelectData(): { text: string; value: string }[] {
      return this.grassTypeOptions.map((opt) => ({ text: opt.label, value: opt.id }))
    },
    /** Where a zone you never chose came from, so it isn't a mystery. */
    grassTypeSource(): string {
      if (!this.$store.getters.grassTypeIsInferred) return ''
      return this.location.usdaZone
        ? `From USDA ${this.location.usdaZone} — change it if you know better.`
        : ''
    },
    /** The grasses you grow, which can be more than one on a real lawn. */
    seedSpeciesSelect: {
      get(): string[] {
        return this.$store.getters.seedSpecies
      },
      set(v: string[]) {
        this.seedSpecies = (Array.isArray(v) ? v : [v]).filter(Boolean)
      },
    },
    /**
     * Grouped by season, because that's the split that decides everything else.
     *
     * Species we haven't ingested trials for are still listed — people grow them
     * — but say so in the row. The marker lives in `html` only, so the chip in
     * the closed field stays just the name.
     */
    seedSpeciesSelectData(): SeedSpeciesGroup[] {
      const groups: { id: SpeciesInfo['season']; label: string }[] = [
        { id: 'cool', label: 'Cool-season' },
        { id: 'warm', label: 'Warm-season' },
      ]
      return groups
        .map((g) => ({
          label: g.label,
          options: speciesList
            .filter((s) => s.season === g.id)
            .map((s) => {
              const scored = loadedSpecies.some((l) => l.id === s.id)
              return {
                text: s.label,
                html: scored ? s.label : `${s.label} <span class="opt-note">no trial data yet</span>`,
                value: s.id,
              }
            }),
        }))
        .filter((g) => g.options.length > 0)
    },
    soilTypeSelect: {
      get(): string {
        return this.soilType || 'none'
      },
      set(v: string) {
        this.soilType = v === 'none' ? '' : v
      },
    },
    sunExposureSelect: {
      get(): string {
        return this.sunExposure || 'none'
      },
      set(v: string) {
        this.sunExposure = v === 'none' ? '' : v
      },
    },
  },
  methods: {
    setUnits(units: SprayUnits) {
      this.$store.dispatch('updateEquipment', { sprayUnits: units })
    },
    async saveGeo() {
      try {
        const loc = await requestBrowserLocation()
        await this.$store.dispatch('setLocation', loc)
        this.locStatus = `Location set to ${loc.label}`
      } catch (e) {
        this.locStatus = e instanceof Error ? e.message : 'GPS failed'
      }
    },
    exportData() {
      this.$store.dispatch('downloadBackup')
      this.status = 'Exported JSON backup.'
    },
    importData(e: Event) {
      const input = e.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const payload = JSON.parse(String(reader.result)) as BackupPayload
          this.$store.dispatch('importBackup', payload)
          this.status = 'Import complete — local data updated.'
        } catch {
          this.status = 'Import failed — file was not valid JSON.'
        }
      }
      reader.readAsText(file)
      input.value = ''
    },
    resetData() {
      if (!confirm('Clear all lawn data saved in this browser?')) return
      this.$store.dispatch('resetAll')
      this.status = 'Local data reset to defaults.'
    },
  },
}
</script>

<style lang="scss">
.settings-page {
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
      max-width: 42rem;
      color: var(--color-text-muted);
    }
  }

  .card {
    h2 {
      margin: 0 0 0.85rem;
      font-size: 1.15rem;
    }
  }

  .hint {
    margin: -0.35rem 0 0.85rem;
    font-size: 0.88rem;
    color: var(--color-text-muted);
  }

  .units {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem 1rem;
    margin-bottom: 1rem;

    .units__label {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .units__hint {
      max-width: 30rem;
      margin: 0.2rem 0 0;
      font-size: 0.82rem;
      color: var(--color-text-muted);
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }

    label {
      display: grid;
      /* Top-aligned so a note under one field doesn't slide its neighbour down. */
      align-content: start;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);

      &.full {
        grid-column: 1 / -1;
      }
    }

    input,
    textarea {
      min-height: var(--input-height);
      padding: 0.5rem 0.65rem;
      font: inherit;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-color: var(--color-primary);
      }
    }

    textarea {
      resize: vertical;
    }

    .field-note {
      font-size: 0.78rem;
      font-weight: 400;
      line-height: 1.4;
      color: var(--color-text-muted);
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
  }

  .file-btn {
    display: inline-flex;
    align-items: center;
  }

  .status {
    margin: 0.85rem 0 0;
    font-size: 0.88rem;
    color: var(--color-success);
  }

  .muted-card {
    ul {
      display: grid;
      gap: 0.3rem;
      margin: 0 0 0.75rem;
      padding-left: 1.15rem;
      color: var(--color-text-muted);
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: var(--color-text-muted);
    }
  }
}
</style>

<template>
  <div class="settings-page">
    <div class="container">
      <header class="page-header">
        <p class="eyebrow">
          <font-awesome-icon icon="fa-solid fa-location-dot" />
          Local data
        </p>
        <h1>My lawn.</h1>
        <p class="lede">
          Saved in this browser only — no account, no server. Export a backup if you switch devices.
        </p>
      </header>

      <section class="card">
        <h2>Location</h2>
        <p class="hint">
          Snaps to the nearest big city for soil temperature, timing, and seed scores.
          <span v-if="location.label">
            Current: <strong>{{ location.label }}</strong>
            <span v-if="zoneLabel"> · {{ zoneLabel }}</span>
          </span>
        </p>
        <div class="form-grid">
          <label>
            <span>City</span>
            <LocationSelect />
          </label>
          <label>
            <span>Or use GPS</span>
            <button type="button" class="btn btn--primary" @click="saveGeo">Use my location</button>
          </label>
        </div>
        <p v-if="locStatus" class="status">{{ locStatus }}</p>
      </section>

      <section class="card">
        <h2>Lawn profile</h2>
        <div class="form-grid">
          <label>
            <span>Lawn name</span>
            <input v-model="lawnName" type="text" />
          </label>
          <label>
            <span>Area (sq ft)</span>
            <input v-model.number="lawnSqFtLocal" type="number" min="100" step="100" />
          </label>
          <label>
            <span>Grass type</span>
            <SlimSelect
              v-model="grassTypeSelect"
              :data="grassTypeSelectData"
              :settings="{ showSearch: false, allowDeselect: false }"
            />
            <small v-if="grassTypeSource" class="field-note">{{ grassTypeSource }}</small>
          </label>
          <label>
            <span>Seed type</span>
            <SlimSelect
              v-model="seedSpeciesSelect"
              :data="seedSpeciesSelectData"
              multiple
              :settings="{
                showSearch: false,
                keepOrder: true,
                placeholderText: 'Any — pick one or more',
              }"
            />
            <small class="field-note">
              Pick every grass you grow. The Seeds section opens on the first one.
            </small>
          </label>
          <label>
            <span>Soil type</span>
            <SlimSelect
              v-model="soilTypeSelect"
              :data="soilTypeSelectData"
              :settings="{ showSearch: false, allowDeselect: false }"
            />
          </label>
          <label>
            <span>Sun exposure</span>
            <SlimSelect
              v-model="sunExposureSelect"
              :data="sunExposureSelectData"
              :settings="{ showSearch: false, allowDeselect: false }"
            />
          </label>
          <label class="full">
            <span>Notes</span>
            <textarea v-model="profileNotes" rows="3" placeholder="Irrigation quirks, dog spots, shade trees…" />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Equipment</h2>
        <p class="hint">
          What the rate calculators assume you're carrying. Coverage per tank is how much ground one
          full tank actually wets at your walking pace — the
          <router-link to="/calculate">Calculate</router-link> page can help you measure it.
        </p>
        <div class="units">
          <div>
            <p class="units__label">Liquid units</p>
            <p class="units__hint">
              Labels are printed in fluid ounces; this only changes what you read. Lawn area and bag
              weights stay in square feet and pounds.
            </p>
          </div>
          <div class="seg" role="group" aria-label="Units for liquid amounts">
            <button
              v-for="u in unitChoices"
              :key="u.value"
              type="button"
              :class="{ active: sprayUnits === u.value }"
              @click="setUnits(u.value)"
            >
              {{ u.text }}
            </button>
          </div>
        </div>
        <div class="form-grid">
          <label>
            <span>Tank size ({{ vol }})</span>
            <input v-model.number="tankLocal" type="number" min="0.5" step="0.5" />
          </label>
          <label>
            <span>Coverage per tank (sq ft)</span>
            <input v-model.number="coverageLocal" type="number" min="50" step="50" />
          </label>
          <label class="full">
            <span>Spreader</span>
            <SlimSelect
              v-model="spreaderLocal"
              :data="spreaderOptions"
              :settings="{ showSearch: false, allowDeselect: false }"
            />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Backup</h2>
        <p class="hint">Download or restore your local lawn data as JSON.</p>
        <div class="actions">
          <button type="button" class="btn btn--primary" @click="exportData">Export JSON</button>
          <label class="btn file-btn">
            Import JSON
            <input type="file" accept="application/json,.json" hidden @change="importData" />
          </label>
          <button type="button" class="btn btn--danger" @click="resetData">Reset all local data</button>
        </div>
        <p v-if="status" class="status">{{ status }}</p>
      </section>

      <section class="card muted-card">
        <h2>What gets saved</h2>
        <ul>
          <li>Lawn profile (size, grass type, seed types, soil/sun, notes)</li>
          <li>Equipment (sprayer tank, coverage per tank, spreader, liquid units)</li>
          <li>Custom rate overrides from calculators</li>
          <li>Custom blends you add from a bag tag</li>
        </ul>
        <p>Weather cache is separate and temporary. Nothing is uploaded.</p>
      </section>
    </div>
  </div>
</template>
