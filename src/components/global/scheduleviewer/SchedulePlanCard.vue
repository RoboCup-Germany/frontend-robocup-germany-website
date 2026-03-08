<script setup lang="ts">
import { computed } from 'vue';
import type { SchedulePlan } from '~/types/schedule-viewer';

interface Props {
  plan: SchedulePlan;
  locale: string;
  teamFilter?: string;
  labels: {
    type: string;
    venue: string;
    start: string;
    noSlots: string;
    participants: string;
    duration: string;
    notes: string;
    match: string;
    breakLabel: string;
    noParticipants: string;
    noFilterResults: string;
    noNotes: string;
    manual: string;
    auto: string;
    warning: string;
    today: string;
    tomorrow: string;
  };
}

const props = defineProps<Props>();

const slots = computed(() => (Array.isArray(props.plan.slots) ? props.plan.slots : []));
const normalizedTeamFilter = computed(() => (props.teamFilter || '').trim().toLowerCase());

const dayLabel = computed(() => {
  const raw = props.plan.day;
  if (!raw) {
    return '';
  }

  const epochSeconds = Number(raw);
  if (!Number.isFinite(epochSeconds)) {
    return '';
  }

  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(props.locale, {
    weekday: 'long'
  }).format(date);
});

const dateLabel = computed(() => {
  const raw = props.plan.day;
  if (!raw) {
    return '';
  }

  const epochSeconds = Number(raw);
  if (!Number.isFinite(epochSeconds)) {
    return '';
  }

  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(props.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
});

const titleLabel = computed(() => {
  const raw = props.plan.day;
  if (!raw) {
    return props.plan.title || 'Plan';
  }

  const epochSeconds = Number(raw);
  if (!Number.isFinite(epochSeconds)) {
    return props.plan.title || 'Plan';
  }

  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return props.plan.title || 'Plan';
  }

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const weekdayAndDate = `${dayLabel.value} - ${dateLabel.value}`;

  if (target.getTime() === today.getTime()) {
    return `${props.labels.today} ${weekdayAndDate}`;
  }

  if (target.getTime() === tomorrow.getTime()) {
    return `${props.labels.tomorrow} ${weekdayAndDate}`;
  }

  return weekdayAndDate;
});

const getTeamOne = (slot: NonNullable<SchedulePlan['slots']>[number]) => {
  return slot.team1?.trim() || slot.teamA?.trim() || slot.singleTeam?.trim() || slot.teamSingle?.trim() || '-';
};

const getTeamTwo = (slot: NonNullable<SchedulePlan['slots']>[number]) => {
  return slot.team2?.trim() || slot.teamB?.trim() || '-';
};

const filteredSlots = computed(() => {
  if (!normalizedTeamFilter.value) {
    return slots.value;
  }

  return slots.value.filter((slot) => {
    const searchable = [
      slot.team1,
      slot.team2,
      slot.singleTeam,
      slot.teamA,
      slot.teamB,
      slot.teamSingle
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalizedTeamFilter.value);
  });
});
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/10">
    <header class="px-3 pb-3 pt-2 lg:px-4 lg:pb-4 lg:pt-2">
      <div class="flex items-start justify-between gap-3">
        <h3 class="m-0 text-base font-semibold leading-tight text-black lg:text-lg">{{ titleLabel }}</h3>
        <p class="m-0 text-right text-sm font-semibold leading-tight text-primary lg:text-base">{{ labels.venue }}: {{ plan.venue || '-' }}</p>
      </div>
    </header>

    <div v-if="slots.length > 0" class="mt-2 max-h-80 overflow-auto px-3 pb-3 lg:mt-3 lg:px-4 lg:pb-4">
      <table class="w-full min-w-[560px] text-left text-xs lg:text-sm">
        <thead class="sticky top-0 bg-white">
          <tr class="text-black/70">
            <th class="py-2 pr-3 font-semibold">{{ labels.start }}</th>
            <th class="py-2 pr-3 font-semibold">Team 1</th>
            <th class="py-2 pr-1 font-semibold">Team 2</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-primary/20">
          <tr v-for="(slot, index) in filteredSlots" :key="slot.uid || slot.index || index" class="text-black/90">
            <td class="py-2 pr-3 whitespace-nowrap">{{ slot.startTime || '--:--' }} - {{ slot.endTime || '--:--' }}</td>
            <td class="py-2 pr-3">{{ getTeamOne(slot) }}</td>
            <td class="py-2 pr-1">{{ getTeamTwo(slot) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="slots.length > 0 && filteredSlots.length === 0" class="px-3 pb-3 text-xs text-black/55 lg:px-4 lg:pb-4">
      {{ labels.noFilterResults }}
    </p>
    <p v-else-if="slots.length === 0" class="p-3 text-xs text-black/65 lg:p-4">{{ labels.noSlots }}</p>
  </article>
</template>
