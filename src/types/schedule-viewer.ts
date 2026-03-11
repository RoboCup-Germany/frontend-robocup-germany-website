export interface ScheduleEntity {
  uid?: number;
  title?: string;
}

export interface ScheduleFilters {
  categoryId?: number;
  leagueId?: number;
  fromDate?: string;
  showAllPlans?: boolean;
}

export interface ScheduleSlot {
  uid?: number;
  index?: number;
  type?: 'match' | 'break' | string;
  timeMode?: 'manual' | 'auto' | string;
  manualStartTime?: string;
  team1?: string;
  team2?: string;
  singleTeam?: string;
  teamA?: string;
  teamB?: string;
  teamSingle?: string;
  participants?: string;
  durationMinutes?: number;
  breakAfterMinutes?: number;
  notes?: string;
  startTime?: string;
  endTime?: string;
  warningCode?: string;
}

export interface SchedulePlan {
  uid?: number;
  title?: string;
  slotGroupTitle?: string;
  slot_group_title?: string;
  day?: string;
  planType?: string;
  venue?: string;
  startTime?: string;
  roundDurationMinutes?: number;
  defaultBreakMinutes?: number;
  league?: ScheduleEntity;
  category?: ScheduleEntity;
  slots?: ScheduleSlot[];
  isActive?: boolean;
}

export interface SchedulePayload {
  sourcePid?: number;
  subheader?: string;
  selectedCategory?: ScheduleEntity;
  selectedLeague?: ScheduleEntity;
  filters?: ScheduleFilters;
  generatedAt?: string;
  plans?: SchedulePlan[];
}

export interface ScheduleSummary {
  selectedPlanCount?: number;
  activePlanCount?: number;
}
