import { tasks } from '../data/tasks'
import { timingByTask, seedingSoilBand, monthLabels } from '../data/timingRules'
import type { Bucket, EvaluatedTask, SoilGate, StatusTone, Task, TimingRule, WindowStatus } from '../types'

export function monthInList(month: number, list: number[] = []): boolean {
  return list.includes(month)
}

/**
 * `tone` names the semantic color token to render this state with, so the
 * status vocabulary lives here rather than being re-derived in each view.
 * Valid values: 'good' | 'caution' | 'cold' | 'hot' | 'neutral'.
 */
export function soilGateStatus(soilTempF: number | null | undefined, rule: TimingRule): SoilGate {
  if (typeof soilTempF !== 'number') {
    return {
      ok: null,
      tone: 'neutral',
      label: 'Soil temp unknown',
      detail: 'Using calendar windows only',
    }
  }
  if (rule.soilMinF != null && soilTempF < rule.soilMinF) {
    return {
      ok: false,
      tone: 'cold',
      label: 'Too cold',
      detail: `${Math.round(soilTempF)}°F is below ${rule.soilMinF}°F gate`,
    }
  }
  if (rule.soilMaxF != null && soilTempF > rule.soilMaxF) {
    return {
      ok: false,
      tone: 'hot',
      label: 'Too warm',
      detail: `${Math.round(soilTempF)}°F is above ${rule.soilMaxF}°F gate`,
    }
  }
  if (rule.soilMinF != null || rule.soilMaxF != null) {
    return {
      ok: true,
      tone: 'good',
      label: 'Soil in band',
      detail: `${Math.round(soilTempF)}°F within task gate`,
    }
  }
  return { ok: true, tone: 'neutral', label: 'No soil gate', detail: 'Calendar-driven task' }
}

/** Semantic color token for a planning bucket. */
export const bucketTone: Record<Bucket, StatusTone> = {
  now: 'good',
  soon: 'caution',
  later: 'neutral',
}

const emptyRule: TimingRule = {
  months: [],
  secondaryMonths: [],
  soilMinF: null,
  soilMaxF: null,
  note: '',
}

/**
 * Classify a task for "now" planning.
 * bucket: 'now' | 'soon' | 'later'
 */
export function evaluateTask(
  task: Task,
  { month = new Date().getMonth() + 1, soilTempF }: { month?: number; soilTempF?: number | null } = {},
): EvaluatedTask {
  const rule = timingByTask[task.id] || emptyRule

  const primary = monthInList(month, rule.months)
  const secondary = monthInList(month, rule.secondaryMonths)
  const inCalendar = primary || secondary
  const soil = soilGateStatus(soilTempF, rule)

  let bucket: Bucket = 'later'
  let reason = rule.note || 'Outside primary season'

  if (inCalendar && soil.ok === false) {
    bucket = 'soon'
    reason = `In season, but ${soil.detail.toLowerCase()}`
  } else if (inCalendar && (soil.ok === true || soil.ok === null)) {
    bucket = 'now'
    reason = primary
      ? `Primary window${soil.ok === true ? ' · soil OK' : ' · soil unchecked'}`
      : `Secondary window${soil.ok === true ? ' · soil OK' : ''}`
  } else if (!inCalendar) {
    const next = month === 12 ? 1 : month + 1
    if (monthInList(next, rule.months) || monthInList(next, rule.secondaryMonths)) {
      bucket = 'soon'
      reason = `Coming up in ${monthLabels[next - 1]}`
    } else {
      bucket = 'later'
      const labels = [...rule.months, ...rule.secondaryMonths].map((m) => monthLabels[m - 1])
      reason = `Typical months: ${labels.join(', ') || 'varies'}`
    }
  }

  return {
    task,
    rule,
    bucket,
    reason,
    primary,
    secondary,
    soil,
    months: rule.months,
    secondaryMonths: rule.secondaryMonths,
  }
}

export function evaluateAllTasks(
  conditions: { month?: number; soilTempF?: number | null } = {},
): EvaluatedTask[] {
  const now = new Date()
  const month = conditions.month || now.getMonth() + 1
  const soilTempF = conditions.soilTempF
  return tasks.map((task) => evaluateTask(task, { month, soilTempF }))
}

export function groupByBucket(evaluated: EvaluatedTask[]): Record<Bucket, EvaluatedTask[]> {
  const groups: Record<Bucket, EvaluatedTask[]> = { now: [], soon: [], later: [] }
  evaluated.forEach((item) => {
    groups[item.bucket].push(item)
  })
  return groups
}

export function seedingWindowStatus(soilTempF: number | null | undefined): WindowStatus {
  if (typeof soilTempF !== 'number') {
    return {
      status: 'unknown',
      tone: 'neutral',
      label: 'Seeding window unknown',
      detail: 'Soil temperature unavailable — lean on Sep–Oct calendar and measure soil if you can.',
    }
  }
  const { minF, maxF, idealMinF, idealMaxF } = seedingSoilBand
  if (soilTempF >= idealMinF && soilTempF <= idealMaxF) {
    return {
      status: 'open',
      tone: 'good',
      label: 'Seeding window open (ideal)',
      detail: `${Math.round(soilTempF)}°F soil is in the ideal ${idealMinF}–${idealMaxF}°F band.`,
    }
  }
  if (soilTempF >= minF && soilTempF <= maxF) {
    return {
      status: 'open',
      tone: 'good',
      label: 'Seeding window open',
      detail: `${Math.round(soilTempF)}°F soil is within ${minF}–${maxF}°F.`,
    }
  }
  if (soilTempF > maxF && soilTempF <= maxF + 8) {
    return {
      status: 'approaching',
      tone: 'hot',
      label: 'Seeding window approaching',
      detail: `${Math.round(soilTempF)}°F is still warm — watch for cooling into the mid‑50s to mid‑60s.`,
    }
  }
  if (soilTempF < minF && soilTempF >= minF - 8) {
    return {
      status: 'approaching',
      tone: 'cold',
      label: 'Borderline cool',
      detail: `${Math.round(soilTempF)}°F is near the low end — germination slows as soils cool further.`,
    }
  }
  return {
    status: 'closed',
    tone: soilTempF > maxF ? 'hot' : 'cold',
    label: 'Seeding window closed',
    detail: `${Math.round(soilTempF)}°F is outside the ${minF}–${maxF}°F band.`,
  }
}
