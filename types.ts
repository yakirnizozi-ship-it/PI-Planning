
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
  holidays: VacationRange[]; // Array of vacation ranges
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

export interface Activity {
  id: string;
  title: string;
  description: string;
  estimates: TeamEstimate[];
  isIncluded?: boolean; // Flag to determine if it goes to the planning board
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
  baselineAllocations?: Allocation[]; // Captured when transitioning from draft to active
  config: PIConfig;
  holidays: Holiday[];
}

export type ViewType = 'dashboard' | 'teams' | 'activities' | 'priority' | 'board' | 'calendar' | 'track' | 'settings' | 'roadmap';
