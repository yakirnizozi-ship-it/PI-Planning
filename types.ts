export interface Holiday {
  id: string;
  startDate: string; // ISO format
  endDate: string;   // ISO format
  name: string;
}

export interface VacationRange {
  id: string;
  startDate: string;
  endDate: string;
}

export interface TeamMember {
  id: string;
  name: string;
  holidays: VacationRange[]; 
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export type ActivityStatus = 'To Do' | 'In Progress' | 'Done';

export interface TeamEstimate {
  teamId: string;
  effort: number; // Total days
  status: ActivityStatus;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  strategicEstimate: number; // Strategic effort in days
  startDate?: string; // Scheduled date on roadmap
  durationWeeks: number; // Visual duration on roadmap
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  estimates: TeamEstimate[];
  isIncluded?: boolean;
  roadmapItemId?: string; // Link to strategic roadmap item
}

export interface Allocation {
  id: string;
  activityId: string;
  teamId: string;
  sprintId: string;
  effort: number;
}

export interface PIConfig {
  startDate: string;
  numberOfSprints: number;
  sprintDurationDays: number;
}

export type PlanStatus = 'draft' | 'active' | 'closed';

export interface Plan {
  id: string;
  name: string;
  status: PlanStatus;
  createdAt: string;
  teams: Team[];
  activities: Activity[];
  allocations: Allocation[];
  baselineAllocations?: Allocation[];
  config: PIConfig;
  holidays: Holiday[];
}

export type ViewType = 'dashboard' | 'teams' | 'activities' | 'priority' | 'board' | 'calendar' | 'track' | 'settings' | 'roadmap';