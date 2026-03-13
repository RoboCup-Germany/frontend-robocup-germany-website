export interface ScheduleApiEntity {
  uid?: number;
  title?: string;
}

export interface ScheduleApiAppliedFilters {
  team?: string | null;
  startTime?: string | null;
  day?: string | null;
  sort?: string | null;
  categoryUid?: number | null;
  leagueUid?: number | null;
  showAllPlans?: boolean | null;
}

export interface ScheduleApiAvailableFilters {
  teams?: string[];
  startTimes?: string[];
  categories?: ScheduleApiEntity[];
  leagues?: ScheduleApiEntity[];
}

export interface ScheduleApiFilters {
  columns?: string[];
  applied?: ScheduleApiAppliedFilters;
  request?: ScheduleApiAppliedFilters;
  available?: ScheduleApiAvailableFilters;
}

export interface ScheduleApiEntry {
  entryId?: string;
  planUid?: number;
  planTitle?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  teamName?: string;
  teamNames?: string[];
  task?: string;
  category?: ScheduleApiEntity;
  league?: ScheduleApiEntity;
}

export interface ScheduleApiQueryParameter {
  name?: string;
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
}

export interface ScheduleApiSchemaField {
  name?: string;
  type?: string;
  format?: string;
}

export interface ScheduleApiSchema {
  queryParameters?: ScheduleApiQueryParameter[];
  response?: {
    fields?: ScheduleApiSchemaField[];
  };
}

export interface ScheduleApiPayload {
  sourcePid?: number | string;
  header?: string;
  subheader?: string;
  apiVersion?: string;
  generatedAt?: string;
  filters?: ScheduleApiFilters;
  entries?: ScheduleApiEntry[];
  apiSchema?: ScheduleApiSchema;
}

export interface ScheduleApiSummary {
  selectedPlanCount?: number;
  entryCount?: number;
}
