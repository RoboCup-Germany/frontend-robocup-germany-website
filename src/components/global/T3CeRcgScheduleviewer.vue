<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, ref } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import SchedulePlanCard from '~/components/global/scheduleviewer/SchedulePlanCard.vue';
import type { SchedulePayload } from '~/types/schedule-viewer';

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
    today: 'Heute',
    tomorrow: 'Morgen'
  };
});

const schedule = computed(() => props.scheduleData || props.scheduleJson || null);

const plans = computed(() => {
  const items = schedule.value?.plans;
  return Array.isArray(items) ? items : [];
});

const resolvedHeader = computed(() => props.header?.trim() || labels.value.title);
const resolvedSubheader = computed(() => props.subheader?.trim() || labels.value.subtitle);
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

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SchedulePlanCard
          v-for="plan in plans"
          :key="plan.uid || plan.title"
          :plan="plan"
          :locale="locale"
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
            warning: labels.warning,
            today: labels.today,
            tomorrow: labels.tomorrow
          }"
        />
        <p v-if="plans.length === 0" class="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm text-black/65">
          {{ labels.noSlots }}
        </p>
      </div>
    </UContainer>
  </section>
</template>
