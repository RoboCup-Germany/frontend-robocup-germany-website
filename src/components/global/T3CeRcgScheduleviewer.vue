<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, ref } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import SchedulePlanCard from '~/components/global/scheduleviewer/SchedulePlanCard.vue';
import type { SchedulePayload, SchedulePlan } from '~/types/schedule-viewer';

defineOptions({
  inheritAttrs: false
});

interface Props extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  scheduleData?: SchedulePayload | null;
  scheduleJson?: SchedulePayload | null;
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subheader: '',
  scheduleData: null,
  scheduleJson: null
});

const route = useRoute();
const teamFilter = ref('');

const isEnglishPage = computed(() => route.path === '/en' || route.path.startsWith('/en/'));
const locale = computed(() => (isEnglishPage.value ? 'en-GB' : 'de-DE'));

const labels = computed(() => {
  if (isEnglishPage.value) {
    return {
      title: 'Schedule',
      subtitle: 'Match overview',
      category: 'Category',
      league: 'League',
      generatedAt: 'Generated',
      teamFilterLabel: 'Filter by team',
      teamFilterPlaceholder: 'Enter team name',
      noFilterResults: 'No matching teams found.',
      type: 'Type',
      venue: 'Field',
      noVenue: 'Unknown field',
      start: 'Start',
      participants: 'Participants',
      duration: 'Duration',
      notes: 'Notes',
      noSlots: 'No slots available for this plan yet.',
      match: 'Match',
      breakLabel: 'Break',
      noParticipants: 'No participants',
      noNotes: 'No notes',
      manual: 'Manual',
      auto: 'Auto',
      warning: 'Warning',
      noDate: 'No date',
      today: 'Today',
      tomorrow: 'Tomorrow'
    };
  }

  return {
    title: 'Spielplan',
    subtitle: 'Übersicht aller Begegnungen',
    category: 'Kategorie',
    league: 'Liga',
    generatedAt: 'Generiert',
    teamFilterLabel: 'Nach Team filtern',
    teamFilterPlaceholder: 'Teamname eingeben',
    noFilterResults: 'Keine passenden Teams gefunden.',
    type: 'Typ',
    venue: 'Spielfeld',
    noVenue: 'Unbekanntes Spielfeld',
    start: 'Start',
    participants: 'Teilnehmer',
    duration: 'Dauer',
    notes: 'Notizen',
    noSlots: 'Für diesen Plan sind noch keine Slots vorhanden.',
    match: 'Match',
    breakLabel: 'Pause',
    noParticipants: 'Keine Teilnehmer',
    noNotes: 'Keine Notiz',
    manual: 'Manuell',
    auto: 'Automatisch',
    warning: 'Hinweis',
    noDate: 'Ohne Datum',
    today: 'Heute',
    tomorrow: 'Morgen'
  };
});

const schedule = computed(() => props.scheduleData || props.scheduleJson || null);

const plans = computed(() => {
  const items = schedule.value?.plans;
  return Array.isArray(items) ? items : [];
});

const getPlanDate = (plan: SchedulePlan) => {
  const epochSeconds = Number(plan.day);
  if (!Number.isFinite(epochSeconds)) {
    return null;
  }

  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const toDayKey = (date: Date | null) => {
  if (!date) {
    return 'no-date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayPrefix = (date: Date | null) => {
  if (!date) {
    return '';
  }

  const weekday = new Intl.DateTimeFormat(locale.value, {
    weekday: 'long'
  }).format(date);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.getTime() === today.getTime()) {
    return `${labels.value.today} ${weekday} -`;
  }

  if (target.getTime() === tomorrow.getTime()) {
    return `${labels.value.tomorrow} ${weekday} -`;
  }

  return `${weekday} -`;
};

const formatDate = (date: Date | null) => {
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const groupedPlans = computed(() => {
  const groups = new Map<string, {
    key: string;
    prefix: string;
    date: string;
    venues: Map<string, { key: string; venue: string; plans: SchedulePlan[] }>;
  }>();

  for (const plan of plans.value) {
    const planDate = getPlanDate(plan);
    const dayKey = toDayKey(planDate);
    const venue = plan.venue?.trim() || labels.value.noVenue;
    const venueKey = venue.toLowerCase();

    if (!groups.has(dayKey)) {
      groups.set(dayKey, {
        key: dayKey,
        prefix: formatDayPrefix(planDate),
        date: formatDate(planDate),
        venues: new Map()
      });
    }

    const dayGroup = groups.get(dayKey);
    if (!dayGroup) {
      continue;
    }

    if (!dayGroup.venues.has(venueKey)) {
      dayGroup.venues.set(venueKey, {
        key: `${dayKey}-${venueKey}`,
        venue,
        plans: []
      });
    }

    dayGroup.venues.get(venueKey)?.plans.push(plan);
  }

  return Array.from(groups.values()).map((group) => ({
    key: group.key,
    prefix: group.prefix,
    date: group.date,
    venues: Array.from(group.venues.values())
  }));
});

const resolvedHeader = computed(() => props.header?.trim() || labels.value.title);
const resolvedSubheader = computed(() => {
  return props.subheader?.trim() || schedule.value?.subheader?.trim() || labels.value.subtitle;
});
</script>

<template>
  <section class="py-12 lg:py-20">
    <UContainer>
      <SectionHeader
        :header="resolvedHeader"
        :subheader="resolvedSubheader"
        subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"
      />

      <div class="mb-4 lg:mb-5">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">
          {{ labels.teamFilterLabel }}
        </label>
        <input
          v-model.trim="teamFilter"
          type="text"
          :placeholder="labels.teamFilterPlaceholder"
          class="w-full rounded-lg border border-primary/35 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
      </div>

      <p v-if="plans.length === 0" class="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm text-black/65">
        {{ labels.noSlots }}
      </p>

      <div v-else class="space-y-6 lg:space-y-8">
        <section v-for="group in groupedPlans" :key="group.key">
          <h3 class="mb-3 text-base font-semibold leading-tight text-black lg:mb-4 lg:text-lg">
            <span v-if="group.date">{{ group.prefix }}</span>
            <span v-if="group.date" class="text-primary"> {{ group.date }}</span>
            <span v-else>{{ labels.noDate }}</span>
          </h3>

          <section v-for="venueGroup in group.venues" :key="venueGroup.key" class="mb-5 last:mb-0 lg:mb-6">
            <h4 class="mb-2 text-sm font-semibold leading-tight text-black/85 lg:mb-3 lg:text-base">{{ labels.venue }}: {{ venueGroup.venue }}</h4>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SchedulePlanCard
                v-for="(plan, index) in venueGroup.plans"
                :key="plan.uid || `${venueGroup.key}-${plan.title || 'plan'}-${index}`"
                :plan="plan"
                :team-filter="teamFilter"
                :labels="{
                  type: labels.type,
                  venue: labels.venue,
                  start: labels.start,
                  noSlots: labels.noSlots,
                  participants: labels.participants,
                  duration: labels.duration,
                  notes: labels.notes,
                  match: labels.match,
                  breakLabel: labels.breakLabel,
                  noParticipants: labels.noParticipants,
                  noFilterResults: labels.noFilterResults,
                  noNotes: labels.noNotes,
                  manual: labels.manual,
                  auto: labels.auto,
                  warning: labels.warning
                }"
              />
            </div>
          </section>
        </section>
      </div>
    </UContainer>
  </section>
</template>
