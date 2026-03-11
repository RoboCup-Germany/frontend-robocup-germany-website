<script setup lang="ts">
import { computed } from 'vue';
import type { SchedulePlan } from '~/types/schedule-viewer';

interface Props {
  plan: SchedulePlan;
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
  };
}

const props = defineProps<Props>();

const slots = computed(() => (Array.isArray(props.plan.slots) ? props.plan.slots : []));
const normalizedTeamFilter = computed(() => (props.teamFilter || '').trim().toLowerCase());

const planTitle = computed(() => {
  return props.plan.title?.trim() || props.plan.slotGroupTitle?.trim() || props.plan.slot_group_title?.trim() || 'Plan';
});

const getTeamOne = (slot: NonNullable<SchedulePlan['slots']>[number]) => {
  return slot.team1?.trim() || slot.teamA?.trim() || slot.singleTeam?.trim() || slot.teamSingle?.trim() || '-';
};

const getTeamTwo = (slot: NonNullable<SchedulePlan['slots']>[number]) => {
  return slot.team2?.trim() || slot.teamB?.trim() || '-';
};

const isSingleTeamSlot = (slot: NonNullable<SchedulePlan['slots']>[number]) => {
  const hasSingleTeam = Boolean(slot.singleTeam?.trim() || slot.teamSingle?.trim());
  const hasSecondTeam = Boolean(slot.team2?.trim() || slot.teamB?.trim());
  return hasSingleTeam && !hasSecondTeam;
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

const usesSecondTeamColumn = computed(() => filteredSlots.value.some((slot) => !isSingleTeamSlot(slot)));
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/10">
    <header class="px-3 pb-3 pt-2 lg:px-4 lg:pb-4 lg:pt-2">
      <h3 class="m-0 text-base font-semibold leading-tight text-black lg:text-lg">{{ planTitle }}</h3>
    </header>

    <div v-if="slots.length > 0" class="mt-2 max-h-80 overflow-auto px-3 pb-3 lg:mt-3 lg:px-4 lg:pb-4">
      <table class="w-full min-w-[560px] text-left text-xs lg:text-sm">
        <thead class="sticky top-0 bg-white">
          <tr class="text-black/70">
            <th class="py-2 pr-3 font-semibold">{{ labels.start }}</th>
            <th class="py-2 pr-3 font-semibold">{{ usesSecondTeamColumn ? 'Team 1' : 'Team' }}</th>
            <th v-if="usesSecondTeamColumn" class="py-2 pr-1 font-semibold">Team 2</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-primary/20">
          <tr v-for="(slot, index) in filteredSlots" :key="slot.uid || slot.index || index" class="text-black/90">
            <td class="py-2 pr-3 whitespace-nowrap">{{ slot.startTime || '--:--' }} - {{ slot.endTime || '--:--' }}</td>
            <td class="py-2 pr-3">{{ getTeamOne(slot) }}</td>
            <td v-if="usesSecondTeamColumn && !isSingleTeamSlot(slot)" class="py-2 pr-1">{{ getTeamTwo(slot) }}</td>
            <td v-else-if="usesSecondTeamColumn" class="py-2 pr-1">-</td>
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
