<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-header">
        <p class="eyebrow">
          <AppIcon name="pin" />
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
          Used for soil temperature, timing, and NTEP suitability.
          <span v-if="location.label"> Current: <strong>{{ location.label }}</strong></span>
        </p>
        <div class="form-grid">
          <label>
            <span>ZIP code</span>
            <div class="inline">
              <input v-model="zipInput" type="text" maxlength="5" inputmode="numeric" placeholder="37201" />
              <button type="button" class="btn" @click="saveZip">Set ZIP</button>
            </div>
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
            <span>Preferred seed</span>
            <select v-model="preferredSeed">
              <option value="">Not set</option>
              <option value="calypsow">Calypsow</option>
              <option value="resilience">Resilience II</option>
            </select>
          </label>
          <label>
            <span>Soil type</span>
            <select v-model="soilType">
              <option value="">Unknown</option>
              <option value="clay">Clay</option>
              <option value="loam">Loam</option>
              <option value="sandy">Sandy</option>
            </select>
          </label>
          <label>
            <span>Sun exposure</span>
            <select v-model="sunExposure">
              <option value="">Unknown</option>
              <option value="full">Full sun</option>
              <option value="mixed">Mixed</option>
              <option value="shade">Mostly shade</option>
            </select>
          </label>
          <label class="full">
            <span>Notes</span>
            <textarea v-model="profileNotes" rows="3" placeholder="Irrigation quirks, dog spots, shade trees…" />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Sprayer defaults</h2>
        <div class="form-grid">
          <label>
            <span>Tank size (gal)</span>
            <input v-model.number="tankGallonsLocal" type="number" min="0.5" step="0.5" />
          </label>
          <label>
            <span>Coverage per tank (sq ft)</span>
            <input v-model.number="coverageLocal" type="number" min="50" step="50" />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Project timeline</h2>
        <p class="hint">Track renovation milestones so you know what already happened.</p>
        <div class="form-grid">
          <label>
            <span>Phase</span>
            <select v-model="phase">
              <option value="maintenance">Maintenance</option>
              <option value="renovation">Renovation</option>
              <option value="establishment">Establishment</option>
            </select>
          </label>
          <label>
            <span>Kill applied</span>
            <input v-model="killAppliedAt" type="date" />
          </label>
          <label>
            <span>Second kill</span>
            <input v-model="secondKillAt" type="date" />
          </label>
          <label>
            <span>Aerated</span>
            <input v-model="aeratedAt" type="date" />
          </label>
          <label>
            <span>Topsoil</span>
            <input v-model="topsoilAt" type="date" />
          </label>
          <label>
            <span>Seeded</span>
            <input v-model="seededAt" type="date" />
          </label>
          <label>
            <span>First mow</span>
            <input v-model="firstMowAt" type="date" />
          </label>
          <label class="full">
            <span>Project notes</span>
            <textarea v-model="projectNotes" rows="3" />
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
          <li>Lawn profile (size, seed choice, soil/sun, notes)</li>
          <li>Sprayer tank + coverage habits</li>
          <li>Custom rate overrides from calculators</li>
          <li>Task step checks, notes, and “done” dates</li>
          <li>Project milestone dates</li>
        </ul>
        <p>Weather cache is separate and temporary. Nothing is uploaded.</p>
      </section>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { lookupZip, requestBrowserLocation } from '../services/geolocation'
import AppIcon from '../components/ui/AppIcon.vue'

function bindProfile(field) {
  return {
    get() {
      return this.$store.state.profile[field]
    },
    set(v) {
      this.$store.dispatch('updateProfile', { [field]: v })
    },
  }
}

function bindProject(field) {
  return {
    get() {
      return this.$store.state.project[field] || ''
    },
    set(v) {
      this.$store.dispatch('updateProject', { [field]: v || null })
    },
  }
}

export default {
  name: 'SettingsView',
  components: { AppIcon },
  data() {
    return { status: '', locStatus: '', zipInput: '' }
  },
  computed: {
    ...mapState(['profile', 'equipment', 'project', 'location']),
    ...mapGetters(['lawnSqFt', 'tankGallons', 'sprayCoverage']),
    lawnName: bindProfile('lawnName'),
    preferredSeed: bindProfile('preferredSeed'),
    soilType: bindProfile('soilType'),
    sunExposure: bindProfile('sunExposure'),
    profileNotes: bindProfile('notes'),
    lawnSqFtLocal: {
      get() {
        return this.lawnSqFt
      },
      set(v) {
        this.$store.dispatch('updateProfile', { lawnSqFt: v })
      },
    },
    tankGallonsLocal: {
      get() {
        return this.tankGallons
      },
      set(v) {
        this.$store.dispatch('updateEquipment', { tankGallons: v })
      },
    },
    coverageLocal: {
      get() {
        return this.sprayCoverage
      },
      set(v) {
        this.$store.dispatch('updateEquipment', { sprayCoverageSqFtPerTank: v })
      },
    },
    phase: bindProject('phase'),
    killAppliedAt: bindProject('killAppliedAt'),
    secondKillAt: bindProject('secondKillAt'),
    aeratedAt: bindProject('aeratedAt'),
    topsoilAt: bindProject('topsoilAt'),
    seededAt: bindProject('seededAt'),
    firstMowAt: bindProject('firstMowAt'),
    projectNotes: {
      get() {
        return this.$store.state.project.notes || ''
      },
      set(v) {
        this.$store.dispatch('updateProject', { notes: v })
      },
    },
  },
  created() {
    this.zipInput = this.location.zip || ''
  },
  methods: {
    async saveZip() {
      try {
        const loc = await lookupZip(this.zipInput)
        await this.$store.dispatch('setLocation', loc)
        this.locStatus = `Location set to ${loc.label}`
      } catch (e) {
        this.locStatus = e.message || 'ZIP failed'
      }
    },
    async saveGeo() {
      try {
        const loc = await requestBrowserLocation()
        await this.$store.dispatch('setLocation', loc)
        this.locStatus = 'Location set from GPS'
      } catch (e) {
        this.locStatus = e.message || 'GPS failed'
      }
    },
    exportData() {
      this.$store.dispatch('downloadBackup')
      this.status = 'Exported JSON backup.'
    },
    importData(e) {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result)
          this.$store.dispatch('importBackup', payload)
          this.status = 'Import complete — local data updated.'
        } catch {
          this.status = 'Import failed — file was not valid JSON.'
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    resetData() {
      if (!confirm('Clear all lawn data saved in this browser?')) return
      this.$store.dispatch('resetAll')
      this.status = 'Local data reset to defaults.'
    },
  },
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
    max-width: 42rem;
  }
}

.card {
  @include card;
  padding: 1.25rem;

  h2 {
    margin: 0 0 0.85rem;
    font-size: 1.15rem;
  }
}

.hint {
  margin: -0.35rem 0 0.85rem;
  font-size: 0.88rem;
  color: $color-ink-muted;
}

.form-grid {
  display: grid;
  gap: 0.85rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }

  label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: $color-ink-muted;

    &.full {
      @media (min-width: $bp-md) {
        grid-column: 1 / -1;
      }
    }
  }

  input,
  select,
  textarea {
    @include tap-target;
    border: 1px solid $color-border-strong;
    border-radius: $radius-sm;
    padding: 0.5rem 0.65rem;
    font: inherit;
    color: $color-ink;
    background: $color-surface;

    &:focus-visible {
      @include focus-ring;
      border-color: $brand;
    }
  }

  textarea {
    resize: vertical;
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
  gap: 0.45rem;
  align-items: center;
}

.file-btn {
  display: inline-flex;
  align-items: center;
}

.status {
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  color: $status-good;
}

.muted-card {
  ul {
    margin: 0 0 0.75rem;
    padding-left: 1.15rem;
    color: $color-ink-muted;
    display: grid;
    gap: 0.3rem;
  }

  p {
    margin: 0;
    font-size: 0.88rem;
    color: $color-ink-muted;
  }
}
</style>
