<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import type { SchedulePayload, SchedulePlan, ScheduleSlot } from '~/types/schedule-viewer';

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
const isEnglishPage = computed(() => route.path === '/en' || route.path.startsWith('/en/'));
const locale = computed(() => (isEnglishPage.value ? 'en-GB' : 'de-DE'));

const labels = computed(() => {
  if (isEnglishPage.value) {
    return {
      title: 'Results',
      subtitle: 'Compact match overview',
      noVenue: 'Unknown field',
      noDate: 'No date',
      venue: 'Field',
      start: 'Time',
      team: 'Team / Match',
      result: 'Result',
      noSlots: 'No slots available.',
      noPlans: 'No result plans available yet.',
      pending: 'Open',
      today: 'Today',
      tomorrow: 'Tomorrow'
    };
  }

  return {
    title: 'Ergebnisse',
    subtitle: 'Kompakte Match-Übersicht',
    noVenue: 'Unbekanntes Spielfeld',
    noDate: 'Ohne Datum',
    venue: 'Spielfeld',
    start: 'Zeit',
    team: 'Team / Match',
    result: 'Ergebnis',
    noSlots: 'Keine Slots vorhanden.',
    noPlans: 'Noch keine Ergebnispläne vorhanden.',
    pending: 'Offen',
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

  const weekday = new Intl.DateTimeFormat(locale.value, { weekday: 'long' }).format(date);
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

const planTitle = (plan: SchedulePlan) => {
  return plan.title?.trim() || plan.slotGroupTitle?.trim() || plan.slot_group_title?.trim() || 'Plan';
};

const getTeamOne = (slot: ScheduleSlot) => {
  return slot.team1?.trim() || slot.teamA?.trim() || slot.singleTeam?.trim() || slot.teamSingle?.trim() || '-';
};

const getTeamTwo = (slot: ScheduleSlot) => {
  return slot.team2?.trim() || slot.teamB?.trim() || '-';
};

const isSingleTeamSlot = (slot: ScheduleSlot) => {
  const hasSingleTeam = Boolean(slot.singleTeam?.trim() || slot.teamSingle?.trim());
  const hasSecondTeam = Boolean(slot.team2?.trim() || slot.teamB?.trim());
  return hasSingleTeam && !hasSecondTeam;
};

const matchLabel = (slot: ScheduleSlot) => {
  if (isSingleTeamSlot(slot)) {
    return getTeamOne(slot);
  }

  return `${getTeamOne(slot)} vs ${getTeamTwo(slot)}`;
};

const resultLabel = (slot: ScheduleSlot) => {
  const resultText = slot.result?.trim();
  if (resultText) {
    return resultText;
  }

  const resultA = slot.resultTeamA?.trim();
  const resultB = slot.resultTeamB?.trim();
  if (resultA && resultB) {
    return `${resultA} : ${resultB}`;
  }

  if (resultA || resultB) {
    return resultA || resultB || '';
  }

  return '';
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

      <p v-if="plans.length === 0" class="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm text-black/65">
        {{ labels.noPlans }}
      </p>

      <div v-else class="space-y-5 lg:space-y-7">
        <section v-for="group in groupedPlans" :key="group.key">
          <h3 class="mb-3 text-base font-semibold leading-tight text-black lg:mb-4 lg:text-lg">
            <span v-if="group.date">{{ group.prefix }}</span>
            <span v-if="group.date" class="text-primary"> {{ group.date }}</span>
            <span v-else>{{ labels.noDate }}</span>
          </h3>

          <section v-for="venueGroup in group.venues" :key="venueGroup.key" class="mb-4 last:mb-0 lg:mb-5">
            <h4 class="mb-2 text-sm font-semibold text-black/85 lg:text-base">{{ labels.venue }}: {{ venueGroup.venue }}</h4>

            <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <article
                v-for="(plan, planIndex) in venueGroup.plans"
                :key="plan.uid || `${venueGroup.key}-${plan.title || 'plan'}-${planIndex}`"
                class="overflow-hidden rounded-2xl border border-primary/20 bg-white"
              >
                <header class="border-b border-primary/15 px-3 py-2.5 lg:px-4">
                  <h5 class="m-0 text-sm font-semibold leading-tight text-black lg:text-base">{{ planTitle(plan) }}</h5>
                </header>

                <div v-if="(plan.slots || []).length > 0" class="px-3 py-2 lg:px-4">
                  <div class="result-grid-header grid min-w-[480px] grid-cols-[150px_1fr_130px] gap-x-3 border-b border-primary/20 py-2 text-xs text-black/70 lg:text-sm">
                    <div class="font-semibold">{{ labels.start }}</div>
                    <div class="font-semibold">{{ labels.team }}</div>
                    <div class="font-semibold">{{ labels.result }}</div>
                  </div>

                  <div class="max-h-72 overflow-auto">
                    <div
                      v-for="(slot, slotIndex) in (plan.slots || [])"
                      :key="slot.uid || slot.index || slotIndex"
                      class="result-grid-row grid min-w-[480px] grid-cols-[150px_1fr_130px] gap-x-3 border-b border-primary/15 py-2 text-xs text-black/90 last:border-b-0 lg:text-sm"
                    >
                      <div class="whitespace-nowrap">{{ slot.startTime || '--:--' }} - {{ slot.endTime || '--:--' }}</div>
                      <div>{{ matchLabel(slot) }}</div>
                      <div>
                        <span v-if="resultLabel(slot)">{{ resultLabel(slot) }}</span>
                        <span v-else class="text-black/45">{{ labels.pending }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p v-else class="px-3 py-3 text-xs text-black/65 lg:px-4">{{ labels.noSlots }}</p>
              </article>
            </div>
          </section>
        </section>
      </div>
    </UContainer>
  </section>
</template>
