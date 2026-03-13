<script setup lang="ts">
import type { T3CeBaseProps } from '@t3headless/nuxt-typo3';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SectionHeader from '~/components/basic/SectionHeader.vue';
import type { ScheduleApiAppliedFilters, ScheduleApiEntry, ScheduleApiPayload } from '~/types/schedule-api-viewer';

defineOptions({
  inheritAttrs: false
});

interface Props extends T3CeBaseProps {
  header?: string;
  subheader?: string;
  scheduleApiData?: ScheduleApiPayload | null;
  scheduleApiJson?: ScheduleApiPayload | null;
}

interface TeamSuggestionsResponse {
  items?: string[];
}

interface ScheduleFilterResponse {
  ok?: boolean;
  error?: string;
  applied?: ScheduleApiAppliedFilters;
  count?: number;
  entries?: ScheduleApiEntry[];
  pagination?: {
    totalItems?: number;
    totalPages?: number;
    hasPrevious?: boolean;
    hasNext?: boolean;
    allowedPageSizes?: number[];
  };
  data?: {
    entries?: ScheduleApiEntry[];
    pagination?: ScheduleFilterResponse['pagination'];
    count?: number;
  };
  result?: {
    entries?: ScheduleApiEntry[];
    pagination?: ScheduleFilterResponse['pagination'];
    count?: number;
  };
}

interface FilterState {
  team: string;
  categoryUid: string;
  leagueUid: string;
  day: string;
  sort: string;
  hidePast: boolean;
}

const ALLOWED_PAGE_SIZES = [15, 30, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 15;

const props = withDefaults(defineProps<Props>(), {
  header: '',
  subheader: '',
  scheduleApiData: null,
  scheduleApiJson: null
});

const runtimeConfig = useRuntimeConfig();
const route = useRoute();

const isEnglishPage = computed(() => route.path === '/en' || route.path.startsWith('/en/'));
const locale = computed(() => (isEnglishPage.value ? 'en-GB' : 'de-DE'));

const labels = computed(() => {
  if (isEnglishPage.value) {
    return {
      title: 'Schedule API',
      subtitle: 'Filterable schedule list',
      team: 'Team',
      teamPlaceholder: 'Enter team name',
      category: 'Category',
      league: 'League',
      day: 'Date',
      sort: 'Sort by',
      all: 'All',
      filter: 'Filter',
      reset: 'Reset filters',
      pendingFilter: 'Not applied',
      pendingFilterHint: 'You changed filters. Click "Filter" to apply.',
      noEntries: 'No matching entries.',
      time: 'Time',
      plan: 'Plan',
      showing: 'Showing',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      pageSize: 'Page size',
      hidePast: 'Hide past slots',
      showPast: 'Show past slots',
      teamColumn: 'Team / Match',
      suggestionLoading: 'Loading suggestions...',
      suggestionEmpty: 'No teams found.',
      loading: 'Loading filtered schedule...',
      loadError: 'Filtered data could not be loaded.',
      wrongEndpoint: 'Invalid response shape. Expected /api/typo3/?type=8900 endpoint.',
      missingCeUid: 'Missing ceUid for schedule filter endpoint.',
      sortStartTime: 'Start time',
      sortTeamName: 'Team name',
      sortCategory: 'Category',
      sortLeague: 'League'
    };
  }

  return {
    title: 'Spielplan API',
    subtitle: 'Filterbare Spielplan-Liste',
    team: 'Team',
    teamPlaceholder: 'Teamname eingeben',
    category: 'Kategorie',
    league: 'Liga',
    day: 'Datum',
    sort: 'Sortierung',
    all: 'Alle',
    filter: 'Filtern',
    reset: 'Filter zuruecksetzen',
    pendingFilter: 'Nicht aktiv',
    pendingFilterHint: 'Filter geaendert. Bitte auf „Filtern“ klicken.',
    noEntries: 'Keine passenden Eintraege.',
    time: 'Zeit',
    plan: 'Zeitplan',
    showing: 'Zeige',
    of: 'von',
    previous: 'Zurueck',
    next: 'Weiter',
    pageSize: 'Seitengroesse',
    hidePast: 'Vergangene Zeiten ausblenden',
    showPast: 'Vergangene Zeiten anzeigen',
    teamColumn: 'Team / Match',
    suggestionLoading: 'Vorschlaege werden geladen...',
    suggestionEmpty: 'Keine Teams gefunden.',
    loading: 'Gefilterter Spielplan wird geladen...',
    loadError: 'Gefilterte Daten konnten nicht geladen werden.',
    wrongEndpoint: 'Ungueltige Response-Struktur. Erwartet wird /api/typo3/?type=8900.',
    missingCeUid: 'Fehlende ceUid fuer den Spielplan-Filter-Endpoint.',
    sortStartTime: 'Startzeit',
    sortTeamName: 'Teamname',
    sortCategory: 'Kategorie',
    sortLeague: 'Liga'
  };
});

const initialPayload = computed(() => props.scheduleApiData || props.scheduleApiJson || null);
const renderedPayload = ref<ScheduleApiPayload | null>(initialPayload.value);

const selectedTeam = ref('');
const selectedCategoryUid = ref('');
const selectedLeagueUid = ref('');
const selectedDay = ref('');
const selectedSort = ref('');
const hidePast = ref(true);
const lastAppliedFilterState = ref<FilterState | null>(null);

const normalizedTeamInput = computed(() => selectedTeam.value.trim());
const ceUidValue = computed(() => {
  const uid = Number(props.uid);
  return Number.isFinite(uid) && uid > 0 ? String(uid) : '';
});

const isLoading = ref(false);
const fetchError = ref('');
let requestCounter = 0;
const currentPage = ref(1);
const selectedPageSize = ref(DEFAULT_PAGE_SIZE);
const pageEntryCount = ref(0);
const paginationMeta = ref<Required<NonNullable<ScheduleFilterResponse['pagination']>>>({
  totalItems: 0,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
  allowedPageSizes: [...ALLOWED_PAGE_SIZES]
});

const teamSuggestions = ref<string[]>([]);
const showTeamSuggestions = ref(false);
const isSuggestionsLoading = ref(false);
let suggestionRequestCounter = 0;
let suggestionDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let suppressTeamSuggestionFetch = false;

const normalizeDay = (raw?: string) => {
  if (!raw) {
    return '';
  }

  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    const epochSeconds = Number(trimmed);
    if (Number.isFinite(epochSeconds)) {
      const date = new Date(epochSeconds * 1000);
      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  return '';
};

const formatDay = (dayValue: string) => {
  if (!dayValue) {
    return '';
  }

  const date = new Date(`${dayValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dayValue;
  }

  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getFilterStateFromPayload = (payload: ScheduleApiPayload | null): FilterState => {
  const requestFilters = payload?.filters?.request;
  const appliedFilters = payload?.filters?.applied;
  const hidePastValue = requestFilters?.hidePast ?? appliedFilters?.hidePast;

  return {
    team: String(requestFilters?.team ?? appliedFilters?.team ?? '').trim(),
    categoryUid: requestFilters?.categoryUid != null
      ? String(requestFilters.categoryUid)
      : (appliedFilters?.categoryUid != null ? String(appliedFilters.categoryUid) : ''),
    leagueUid: requestFilters?.leagueUid != null
      ? String(requestFilters.leagueUid)
      : (appliedFilters?.leagueUid != null ? String(appliedFilters.leagueUid) : ''),
    day: String(requestFilters?.day ?? appliedFilters?.day ?? '').trim(),
    sort: String(requestFilters?.sort ?? appliedFilters?.sort ?? '').trim(),
    hidePast: hidePastValue === null || hidePastValue === undefined ? true : Boolean(hidePastValue)
  };
};

const applyFilterState = (state: FilterState) => {
  suppressTeamSuggestionFetch = true;
  selectedTeam.value = state.team;
  selectedCategoryUid.value = state.categoryUid;
  selectedLeagueUid.value = state.leagueUid;
  selectedDay.value = state.day;
  selectedSort.value = state.sort;
  hidePast.value = state.hidePast;
};
const getCurrentFilterState = (): FilterState => ({
  team: normalizedTeamInput.value,
  categoryUid: selectedCategoryUid.value,
  leagueUid: selectedLeagueUid.value,
  day: selectedDay.value,
  sort: selectedSort.value,
  hidePast: hidePast.value
});
const isSameFilterState = (a: FilterState | null, b: FilterState | null) => {
  if (!a || !b) {
    return false;
  }

  return a.team === b.team
    && a.categoryUid === b.categoryUid
    && a.leagueUid === b.leagueUid
    && a.day === b.day
    && a.sort === b.sort
    && a.hidePast === b.hidePast;
};
const hasPendingFilterChanges = computed(() => !isSameFilterState(lastAppliedFilterState.value, getCurrentFilterState()));

watch(
  initialPayload,
  (value) => {
    renderedPayload.value = value;
    const nextState = getFilterStateFromPayload(value);
    applyFilterState(nextState);
    lastAppliedFilterState.value = nextState;
  },
  { immediate: true }
);

const entries = computed(() => {
  const items = renderedPayload.value?.entries;
  return Array.isArray(items) ? items : [];
});

const dayOptions = computed(() => {
  const unique = new Set<string>();

  for (const entry of entries.value) {
    const day = normalizeDay(entry.day);
    if (day) {
      unique.add(day);
    }
  }

  return Array.from(unique)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatDay(value) }));
});

const displayedEntries = computed(() => {
  return [...entries.value].sort((a, b) => {
    const dayA = normalizeDay(a.day);
    const dayB = normalizeDay(b.day);
    if (dayA !== dayB) {
      return dayB.localeCompare(dayA);
    }

    const startA = String(a.startTime || '');
    const startB = String(b.startTime || '');
    return startA.localeCompare(startB);
  });
});

const categoryOptions = computed(() => {
  const items = renderedPayload.value?.filters?.available?.categories;
  return Array.isArray(items)
    ? items.filter((item): item is NonNullable<typeof items[number]> => Boolean(item))
    : [];
});

const leagueOptions = computed(() => {
  const items = renderedPayload.value?.filters?.available?.leagues;
  return Array.isArray(items)
    ? items.filter((item): item is NonNullable<typeof items[number]> => Boolean(item))
    : [];
});

const sortOptions = computed(() => [
  { value: '', label: labels.value.all },
  { value: 'startTime', label: labels.value.sortStartTime },
  { value: 'teamName', label: labels.value.sortTeamName },
  { value: 'category.title', label: labels.value.sortCategory },
  { value: 'league.title', label: labels.value.sortLeague }
]);
const sortLabelMap = computed(() => new Map(sortOptions.value.map((option) => [option.value, option.label])));
const categoryLabelMap = computed(() => new Map(categoryOptions.value.map((category) => [String(category.uid ?? ''), category.title || ''])));
const leagueLabelMap = computed(() => new Map(leagueOptions.value.map((league) => [String(league.uid ?? ''), league.title || ''])));

const activeFilterPills = computed(() => {
  const pills: string[] = [];

  if (normalizedTeamInput.value) {
    pills.push(`${labels.value.team}: ${normalizedTeamInput.value}`);
  }

  if (selectedCategoryUid.value) {
    const categoryLabel = categoryLabelMap.value.get(selectedCategoryUid.value) || selectedCategoryUid.value;
    pills.push(`${labels.value.category}: ${categoryLabel}`);
  }

  if (selectedLeagueUid.value) {
    const leagueLabel = leagueLabelMap.value.get(selectedLeagueUid.value) || selectedLeagueUid.value;
    pills.push(`${labels.value.league}: ${leagueLabel}`);
  }

  if (selectedDay.value) {
    pills.push(`${labels.value.day}: ${formatDay(selectedDay.value) || selectedDay.value}`);
  }

  if (selectedSort.value) {
    const sortLabel = sortLabelMap.value.get(selectedSort.value) || selectedSort.value;
    pills.push(`${labels.value.sort}: ${sortLabel}`);
  }

  pills.push(hidePast.value ? labels.value.hidePast : labels.value.showPast);

  return pills;
});

const pageSizeOptions = computed(() => {
  const values = Array.isArray(paginationMeta.value.allowedPageSizes) && paginationMeta.value.allowedPageSizes.length > 0
    ? paginationMeta.value.allowedPageSizes
    : [...ALLOWED_PAGE_SIZES];

  return values.filter((value) => ALLOWED_PAGE_SIZES.includes(value as (typeof ALLOWED_PAGE_SIZES)[number]));
});

const hasPreviousPage = computed(() => Boolean(paginationMeta.value.hasPrevious) && !isLoading.value);
const hasNextPage = computed(() => Boolean(paginationMeta.value.hasNext) && !isLoading.value);
const paginationPages = computed(() => {
  const total = Math.max(1, Number(paginationMeta.value.totalPages || 1));
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const current = Math.min(total, Math.max(1, currentPage.value));
  const pages = new Set<number>([1, total]);

  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  else if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  else {
    pages.add(current - 1);
    pages.add(current);
    pages.add(current + 1);
  }

  return Array.from(pages).sort((a, b) => a - b).slice(0, 5);
});

const paginationItems = computed(() => {
  const items: Array<number | string> = [];
  let previous: number | null = null;

  for (const page of paginationPages.value) {
    if (previous !== null && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }
    items.push(page);
    previous = page;
  }

  return items;
});

const apiBasePath = computed(() => {
  const configuredBase = String(runtimeConfig.public?.typo3?.api?.baseUrl ?? '').trim();
  if (!configuredBase) {
    return '/api/typo3';
  }

  return configuredBase.endsWith('/') ? configuredBase.slice(0, -1) : configuredBase;
});

const globalApiEndpoint = computed(() => `${apiBasePath.value}/`);

const buildQueryParams = ({
  type,
  includeSort,
  includeTeam,
  includeShowAllPlans,
  includePagination
}: {
  type?: '8899' | '8900';
  includeSort: boolean;
  includeTeam: boolean;
  includeShowAllPlans: boolean;
  includePagination: boolean;
}) => {
  const query: Record<string, string> = { no_cache: '1' };

  if (type) {
    query.type = type;
  }

  if (ceUidValue.value) {
    query.ceUid = ceUidValue.value;
  }

  if (type === '8899') {
    const sourcePid = String(renderedPayload.value?.sourcePid ?? '').trim();
    if (sourcePid) {
      query.sourcePid = sourcePid;
    }
  }

  if (includeTeam && normalizedTeamInput.value) {
    query.q = normalizedTeamInput.value;
    query.team = normalizedTeamInput.value;
  }

  if (selectedCategoryUid.value) {
    query.categoryUid = selectedCategoryUid.value;
  }

  if (selectedLeagueUid.value) {
    query.leagueUid = selectedLeagueUid.value;
  }

  if (selectedDay.value) {
    query.day = selectedDay.value;
  }

  if (includeSort && selectedSort.value) {
    query.sort = selectedSort.value;
  }

  if (type === '8900') {
    query.hidePast = hidePast.value ? '1' : '0';
  }

  const showAllPlans = initialPayload.value?.filters?.applied?.showAllPlans
    ?? renderedPayload.value?.filters?.applied?.showAllPlans;
  if (includeShowAllPlans && showAllPlans) {
    query.showAllPlans = '1';
  }

  if (includePagination) {
    query.page = String(Math.max(1, currentPage.value));
    query.pageSize = String(selectedPageSize.value);
  }

  return query;
};

const clearSuggestions = () => {
  teamSuggestions.value = [];
  showTeamSuggestions.value = false;
  isSuggestionsLoading.value = false;
};

const getTeamSuggestionQueryParams = () => {
  return {
    q: normalizedTeamInput.value,
    limit: '10',
    ...buildQueryParams({
      type: '8899',
      includeSort: false,
      includeTeam: false,
      includeShowAllPlans: true,
      includePagination: false
    })
  };
};

const loadTeamSuggestions = async () => {
  if (normalizedTeamInput.value.length < 2) {
    clearSuggestions();
    return;
  }

  const requestId = ++suggestionRequestCounter;
  isSuggestionsLoading.value = true;

  try {
    const response = await $fetch<TeamSuggestionsResponse>(globalApiEndpoint.value, {
      query: getTeamSuggestionQueryParams()
    });

    if (requestId !== suggestionRequestCounter) {
      return;
    }

    const items = Array.isArray(response?.items)
      ? response.items.filter((item): item is string => Boolean(item && item.trim()))
      : [];

    teamSuggestions.value = items;
    showTeamSuggestions.value = normalizedTeamInput.value.length >= 2;
  }
  catch {
    if (requestId === suggestionRequestCounter) {
      teamSuggestions.value = [];
      showTeamSuggestions.value = false;
    }
  }
  finally {
    if (requestId === suggestionRequestCounter) {
      isSuggestionsLoading.value = false;
    }
  }
};

const scheduleTeamSuggestionFetch = () => {
  if (suggestionDebounceTimer) {
    clearTimeout(suggestionDebounceTimer);
  }

  if (normalizedTeamInput.value.length < 2) {
    clearSuggestions();
    return;
  }

  suggestionDebounceTimer = setTimeout(() => {
    void loadTeamSuggestions();
  }, 250);
};

watch(selectedTeam, () => {
  if (suppressTeamSuggestionFetch) {
    suppressTeamSuggestionFetch = false;
    return;
  }

  scheduleTeamSuggestionFetch();
});

watch([selectedCategoryUid, selectedLeagueUid, selectedDay], () => {
  if (normalizedTeamInput.value.length >= 2) {
    scheduleTeamSuggestionFetch();
  }
});

watch([selectedTeam, selectedCategoryUid, selectedLeagueUid, selectedDay, selectedSort, hidePast], () => {
  currentPage.value = 1;
});

const onTeamInputFocus = () => {
  if (normalizedTeamInput.value.length < 2) {
    return;
  }

  showTeamSuggestions.value = true;
  if (teamSuggestions.value.length === 0 && !isSuggestionsLoading.value) {
    scheduleTeamSuggestionFetch();
  }
};

const onTeamInputBlur = () => {
  setTimeout(() => {
    showTeamSuggestions.value = false;
  }, 140);
};

const teamLabel = (entry: ScheduleApiEntry) => {
  const teamNames = Array.isArray(entry.teamNames) ? entry.teamNames.filter(Boolean) : [];
  if (teamNames.length > 0) {
    return teamNames.join(' vs ');
  }

  return entry.teamName?.trim() || '-';
};

const extractEntriesFromResponse = (response: ScheduleFilterResponse | null | undefined) => {
  if (Array.isArray(response?.entries)) {
    return response.entries;
  }

  if (Array.isArray(response?.data?.entries)) {
    return response.data.entries;
  }

  if (Array.isArray(response?.result?.entries)) {
    return response.result.entries;
  }

  return null;
};

const extractPaginationFromResponse = (response: ScheduleFilterResponse | null | undefined) => {
  return response?.pagination ?? response?.data?.pagination ?? response?.result?.pagination;
};

const extractCountFromResponse = (response: ScheduleFilterResponse | null | undefined, fallback: number) => {
  const value = response?.count ?? response?.data?.count ?? response?.result?.count;
  return Number(value ?? fallback);
};

const loadFilteredData = async () => {
  if (!ceUidValue.value) {
    fetchError.value = labels.value.missingCeUid;
    isLoading.value = false;
    return;
  }

  const requestId = ++requestCounter;
  const requestedFilterState = getCurrentFilterState();
  fetchError.value = '';
  isLoading.value = true;

  try {
    const response = await $fetch<ScheduleFilterResponse>(globalApiEndpoint.value, {
      query: buildQueryParams({
        type: '8900',
        includeSort: true,
        includeTeam: true,
        includeShowAllPlans: true,
        includePagination: true
      })
    });

    if (requestId !== requestCounter) {
      return;
    }

    if (response?.ok === false) {
      fetchError.value = response.error || labels.value.loadError;
      return;
    }

    if (
      response
      && typeof response === 'object'
      && ('content' in response || 'slug' in response || 'id' in response)
    ) {
      fetchError.value = labels.value.wrongEndpoint;
      return;
    }

    const nextEntries = extractEntriesFromResponse(response);
    if (!nextEntries) {
      fetchError.value = labels.value.loadError;
      return;
    }

    const previous = renderedPayload.value;
    pageEntryCount.value = extractCountFromResponse(response, nextEntries.length);

    const responsePagination = extractPaginationFromResponse(response);
    paginationMeta.value = {
      totalItems: Number(responsePagination?.totalItems ?? nextEntries.length),
      totalPages: Number(responsePagination?.totalPages ?? 1),
      hasPrevious: Boolean(responsePagination?.hasPrevious),
      hasNext: Boolean(responsePagination?.hasNext),
      allowedPageSizes: Array.isArray(responsePagination?.allowedPageSizes) && responsePagination.allowedPageSizes.length > 0
        ? responsePagination.allowedPageSizes
        : [...ALLOWED_PAGE_SIZES]
    };

    renderedPayload.value = {
      ...(previous ?? {}),
      entries: nextEntries,
      filters: {
        ...(previous?.filters ?? {}),
        applied: response?.applied ?? previous?.filters?.applied
      }
    };
    lastAppliedFilterState.value = requestedFilterState;
  }
  catch (error: unknown) {
    if (requestId === requestCounter) {
      const maybeError = error as {
        data?: { error?: string; message?: string };
        status?: number;
        statusMessage?: string;
      };

      fetchError.value = maybeError?.data?.error
        || maybeError?.data?.message
        || maybeError?.statusMessage
        || (maybeError?.status ? `${labels.value.loadError} (${maybeError.status})` : labels.value.loadError);
    }
  }
  finally {
    if (requestId === requestCounter) {
      isLoading.value = false;
    }
  }
};

const applyFilters = async () => {
  currentPage.value = 1;
  clearSuggestions();
  await loadFilteredData();
};

const selectTeamSuggestion = async (team: string) => {
  suppressTeamSuggestionFetch = true;
  selectedTeam.value = team;
  clearSuggestions();
  await applyFilters();
};

const resetFilters = async () => {
  applyFilterState(getFilterStateFromPayload(initialPayload.value ?? renderedPayload.value));
  currentPage.value = 1;
  clearSuggestions();
  await loadFilteredData();
};

const changePageSize = async (event: Event) => {
  const target = event.target as HTMLSelectElement | null;
  const nextSize = Number(target?.value || selectedPageSize.value);
  if (!ALLOWED_PAGE_SIZES.includes(nextSize as (typeof ALLOWED_PAGE_SIZES)[number])) {
    return;
  }

  selectedPageSize.value = nextSize;
  currentPage.value = 1;
  await loadFilteredData();
};

const goToPreviousPage = async () => {
  if (!hasPreviousPage.value) {
    return;
  }

  currentPage.value = Math.max(1, currentPage.value - 1);
  await loadFilteredData();
};

const goToNextPage = async () => {
  if (!hasNextPage.value) {
    return;
  }

  currentPage.value += 1;
  await loadFilteredData();
};

const goToPage = async (page: number) => {
  if (isLoading.value || page === currentPage.value) {
    return;
  }

  if (page < 1 || page > Math.max(1, paginationMeta.value.totalPages)) {
    return;
  }

  currentPage.value = page;
  await loadFilteredData();
};

const resolvedHeader = computed(() => props.header?.trim() || renderedPayload.value?.header?.trim() || labels.value.title);
const resolvedSubheader = computed(() => props.subheader?.trim() || renderedPayload.value?.subheader?.trim() || labels.value.subtitle);

onMounted(async () => {
  await loadFilteredData();
});

onBeforeUnmount(() => {
  if (suggestionDebounceTimer) {
    clearTimeout(suggestionDebounceTimer);
  }
});
</script>

<template>
  <section class="schedule-api-viewer py-12 lg:py-20">
    <UContainer>
      <SectionHeader
        :header="resolvedHeader"
        :subheader="resolvedSubheader"
        subheader-class="mb-4 text-base italic uppercase tracking-wide text-black font-semibold"
      />

      <div class="mb-4">
        <div class="flex flex-wrap gap-3 rounded-2xl border border-primary/20 bg-white p-3 lg:gap-4 lg:p-4">
          <div class="relative w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.team }}</label>
            <input
              v-model.trim="selectedTeam"
              type="text"
              :placeholder="labels.teamPlaceholder"
              :disabled="isLoading"
              class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70"
              @focus="onTeamInputFocus"
              @blur="onTeamInputBlur"
              @keydown.enter.prevent="applyFilters"
            >
            <div
              v-if="showTeamSuggestions && normalizedTeamInput.length >= 2"
              class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-primary/20 bg-white shadow-md"
            >
              <div v-if="isSuggestionsLoading" class="px-3 py-2 text-xs text-black/65">{{ labels.suggestionLoading }}</div>
              <div v-else-if="teamSuggestions.length === 0" class="px-3 py-2 text-xs text-black/65">{{ labels.suggestionEmpty }}</div>
              <ul v-else class="max-h-56 overflow-auto py-1">
                <li v-for="team in teamSuggestions" :key="team">
                  <button
                    type="button"
                    class="block w-full px-3 py-2 text-left text-sm text-black transition hover:bg-primary/10"
                    @mousedown.prevent="selectTeamSuggestion(team)"
                  >
                    {{ team }}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.category }}</label>
            <select v-model="selectedCategoryUid" :disabled="isLoading" class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70">
              <option value="">{{ labels.all }}</option>
              <option v-for="category in categoryOptions" :key="`${category.uid ?? 'none'}-${category.title ?? 'untitled'}`" :value="String(category.uid)">
                {{ category.title }}
              </option>
            </select>
          </div>

          <div class="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.league }}</label>
            <select v-model="selectedLeagueUid" :disabled="isLoading" class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70">
              <option value="">{{ labels.all }}</option>
              <option v-for="league in leagueOptions" :key="`${league.uid ?? 'none'}-${league.title ?? 'untitled'}`" :value="String(league.uid)">
                {{ league.title }}
              </option>
            </select>
          </div>

          <div class="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.day }}</label>
            <select v-model="selectedDay" :disabled="isLoading" class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70">
              <option value="">{{ labels.all }}</option>
              <option v-for="day in dayOptions" :key="day.value" :value="day.value">{{ day.label }}</option>
            </select>
          </div>

          <div class="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.sort }}</label>
            <select v-model="selectedSort" :disabled="isLoading" class="w-full rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70">
              <option v-for="sortOption in sortOptions" :key="sortOption.value" :value="sortOption.value">{{ sortOption.label }}</option>
            </select>
          </div>

          <div class="w-full md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.75rem)]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/70">{{ labels.hidePast }}</label>
            <label class="flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm text-black">
              <input
                v-model="hidePast"
                type="checkbox"
                :disabled="isLoading"
                class="h-4 w-4 accent-primary disabled:cursor-wait"
              >
              <span>{{ labels.hidePast }}</span>
            </label>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            :disabled="isLoading"
            @click="applyFilters"
          >
            {{ labels.filter }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"
            :disabled="isLoading"
            @click="resetFilters"
          >
            {{ labels.reset }}
          </button>
          <span
            v-if="hasPendingFilterChanges"
            class="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
            :title="labels.pendingFilterHint"
          >
            {{ labels.pendingFilter }}
          </span>

          <div v-if="activeFilterPills.length > 0" class="flex flex-wrap items-center gap-2">
            <span
              v-for="pill in activeFilterPills"
              :key="pill"
              class="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {{ pill }}
            </span>
          </div>
        </div>
      </div>

      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black/70">
        <div class="flex items-center gap-2">
          <span>{{ labels.pageSize }}:</span>
          <select
            :value="String(selectedPageSize)"
            :disabled="isLoading"
            class="rounded-md border border-primary/30 bg-white px-2 py-1 text-xs text-black outline-none focus:border-primary disabled:cursor-wait disabled:opacity-70"
            @change="changePageSize"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="String(size)">{{ size }}</option>
          </select>
          <p class="m-0 text-xs text-black/65">{{ labels.showing }} {{ pageEntryCount }} {{ labels.of }} {{ paginationMeta.totalItems }}</p>
        </div>
        <div class="flex items-center gap-2">
          <nav
            v-if="paginationPages.length > 1"
            aria-label="Pagination"
            class="flex flex-wrap items-center gap-2"
          >
            <button
              v-if="hasPreviousPage"
              type="button"
              class="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/5"
              @click="goToPreviousPage"
            >
              {{ labels.previous }}
            </button>

            <template v-for="item in paginationItems" :key="`schedule-page-${item}`">
              <span
                v-if="typeof item === 'string'"
                class="px-2 py-2 text-sm font-semibold text-black/50"
                aria-hidden="true"
              >
                ...
              </span>
              <button
                v-else
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-semibold"
                :class="item === currentPage ? 'border-primary bg-primary text-white' : 'border-black/20 hover:bg-black/5'"
                :aria-current="item === currentPage ? 'page' : undefined"
                @click="goToPage(item)"
              >
                {{ item }}
              </button>
            </template>

            <button
              v-if="hasNextPage"
              type="button"
              class="rounded-full border border-black/20 px-4 py-2 text-sm font-semibold hover:bg-black/5"
              @click="goToNextPage"
            >
              {{ labels.next }}
            </button>
          </nav>
        </div>
      </div>

      <p v-if="isLoading && entries.length > 0" class="mb-3 text-xs text-black/60">{{ labels.loading }}</p>
      <p v-if="fetchError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ fetchError }}</p>

      <div class="relative">
        <div v-if="entries.length > 0" class="overflow-hidden rounded-2xl border border-primary/20 bg-white">
          <div class="overflow-auto">
            <table class="w-full min-w-[900px] text-left text-xs lg:text-sm">
              <thead class="bg-primary/5 text-black/75">
                <tr>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.day }}</th>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.time }}</th>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.teamColumn }}</th>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.category }}</th>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.league }}</th>
                  <th class="px-3 py-2 font-semibold lg:px-4">{{ labels.plan }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-primary/15">
                <tr v-for="entry in displayedEntries" :key="entry.entryId" class="text-black/90">
                  <td class="px-3 py-2 whitespace-nowrap lg:px-4">{{ formatDay(normalizeDay(entry.day)) || '-' }}</td>
                  <td class="px-3 py-2 whitespace-nowrap lg:px-4">{{ entry.startTime || '--:--' }} - {{ entry.endTime || '--:--' }}</td>
                  <td class="px-3 py-2 lg:px-4">{{ teamLabel(entry) }}</td>
                  <td class="px-3 py-2 lg:px-4">{{ entry.category?.title || '-' }}</td>
                  <td class="px-3 py-2 lg:px-4">{{ entry.league?.title || '-' }}</td>
                  <td class="px-3 py-2 lg:px-4">{{ entry.planTitle || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p v-else class="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm text-black/65">{{ labels.noEntries }}</p>

        <div v-if="isLoading && entries.length === 0" class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[1px]">
          <div class="flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-black/80 shadow-sm">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span>{{ labels.loading }}</span>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
