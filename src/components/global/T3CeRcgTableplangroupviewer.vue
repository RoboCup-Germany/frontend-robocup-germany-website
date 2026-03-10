<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, ref } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';

defineOptions({
  inheritAttrs: false
});

interface TablePlanGroupRow {
  tableNumber: number;
  count: string;
  team: string;
  institution: string;
}

interface TablePlanGroupData {
  header?: string;
  subheader?: string;
  rows?: TablePlanGroupRow[];
}

interface Props extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  tablePlanGroupJson?: TablePlanGroupData | TablePlanGroupRow[] | null;
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subheader: '',
  tablePlanGroupJson: null
});

const route = useRoute();
const teamFilter = ref('');
const institutionFilter = ref('');

const isEnglishPage = computed(() => route.path === '/en' || route.path.startsWith('/en/'));

const labels = computed(() => {
  if (isEnglishPage.value) {
    return {
      teamFilterLabel: 'Filter by team',
      teamFilterPlaceholder: 'Enter team name',
      institutionFilterLabel: 'Filter by institution',
      institutionFilterPlaceholder: 'Enter institution',
      tableNumber: 'Table',
      count: 'Count',
      team: 'Team',
      institution: 'Institution',
      noResults: 'No matching entries found.'
    };
  }

  return {
    teamFilterLabel: 'Nach Team filtern',
    teamFilterPlaceholder: 'Teamname eingeben',
    institutionFilterLabel: 'Nach Institution filtern',
    institutionFilterPlaceholder: 'Institution eingeben',
    tableNumber: 'Tisch',
    count: 'Anzahl',
    team: 'Team',
    institution: 'Institution',
    noResults: 'Keine passenden Einträge gefunden.'
  };
});

const normalized = (value?: string | null) => (value || '').trim().toLocaleLowerCase();

const tableData = computed<TablePlanGroupData | null>(() => {
  if (!props.tablePlanGroupJson || Array.isArray(props.tablePlanGroupJson)) {
    return null;
  }
  return props.tablePlanGroupJson;
});

const rows = computed(() => {
  if (Array.isArray(props.tablePlanGroupJson)) {
    return props.tablePlanGroupJson;
  }
  return Array.isArray(tableData.value?.rows) ? tableData.value.rows : [];
});

const filteredRows = computed(() => {
  const teamNeedle = normalized(teamFilter.value);
  const institutionNeedle = normalized(institutionFilter.value);

  return rows.value.filter((row) => {
    const teamMatch = !teamNeedle || normalized(row.team).includes(teamNeedle);
    const institutionMatch = !institutionNeedle || normalized(row.institution).includes(institutionNeedle);
    return teamMatch && institutionMatch;
  });
});

const resolvedHeader = computed(() => tableData.value?.header?.trim() || props.header?.trim() || '');
const resolvedSubheader = computed(() => tableData.value?.subheader?.trim() || props.subheader?.trim() || '');
</script>

<template>
  <section class="py-12 lg:py-20">
    <UContainer>
      <SectionHeader
        :header="resolvedHeader"
        :subheader="resolvedSubheader"
        subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"
      />

      <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
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

        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">
            {{ labels.institutionFilterLabel }}
          </label>
          <input
            v-model.trim="institutionFilter"
            type="text"
            :placeholder="labels.institutionFilterPlaceholder"
            class="w-full rounded-lg border border-primary/35 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
        </div>
      </div>

      <div class="max-h-[560px] overflow-x-auto overflow-y-auto rounded-xl border border-black/10 bg-white/90">
        <table class="min-w-full border-collapse text-sm">
          <thead class="bg-primary/10 text-left text-black">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ labels.tableNumber }}</th>
              <th class="px-4 py-3 font-semibold">{{ labels.count }}</th>
              <th class="px-4 py-3 font-semibold">{{ labels.team }}</th>
              <th class="px-4 py-3 font-semibold">{{ labels.institution }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in filteredRows"
              :key="`${row.tableNumber}-${row.team}-${row.institution}-${index}`"
              class="border-t border-black/10 align-top"
            >
              <td class="px-4 py-3">{{ row.tableNumber }}</td>
              <td class="px-4 py-3">{{ row.count }}</td>
              <td class="px-4 py-3">{{ row.team }}</td>
              <td class="px-4 py-3">{{ row.institution }}</td>
            </tr>
            <tr v-if="filteredRows.length === 0">
              <td colspan="4" class="px-4 py-6 text-center text-black/60">
                {{ labels.noResults }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UContainer>
  </section>
</template>
