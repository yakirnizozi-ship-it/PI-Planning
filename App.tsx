
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ListTodo, 
  LayoutDashboard, 
  Settings,
  CalendarDays,
  ChevronLeft,
  Briefcase,
  Calendar as CalendarIcon,
  // Changed TrackIcon to Activity as ActivityIcon to avoid name collision with Activity type
  Activity as ActivityIcon,
  Star
} from 'lucide-react';
import { Plan, ViewType, Team, Activity, Allocation, Holiday, PIConfig, ActivityStatus } from './types';
import TeamManager from './components/TeamManager';
import ActivityManager from './components/ActivityManager';
import PlanningBoard from './components/PlanningBoard';
import SettingsPanel from './components/SettingsPanel';
import PlansDashboard from './components/PlansDashboard';
import TeamCalendar from './components/TeamCalendar';
import TrackDashboard from './components/TrackDashboard';
import PriorityView from './components/PriorityView';

const App: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('dashboard');

  // Persistence
  useEffect(() => {
    const savedPlans = localStorage.getItem('pi-plans-v2');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pi-plans-v2', JSON.stringify(plans));
  }, [plans]);

  const activePlan = useMemo(() => 
    plans.find(p => p.id === activePlanId) || null
  , [plans, activePlanId]);

  // Sprint calculation moved inside App for use across components
  const activeSprints = useMemo(() => {
    if (!activePlan) return [];
    const generated = [];
    const { startDate, numberOfSprints, sprintDurationDays } = activePlan.config;
    const start = new Date(startDate);
    
    for (let i = 0; i < numberOfSprints; i++) {
      const sStart = new Date(start);
      sStart.setDate(start.getDate() + (i * sprintDurationDays));
      const sEnd = new Date(sStart);
      sEnd.setDate(sStart.getDate() + sprintDurationDays - 1);
      
      generated.push({
        id: `sprint-${i + 1}`,
        name: `Sprint ${i + 1}${i === numberOfSprints - 1 ? ' (IP)' : ''}`,
        startDate: sStart.toISOString().split('T')[0],
        endDate: sEnd.toISOString().split('T')[0]
      });
    }
    return generated;
  }, [activePlan]);

  const updateActivePlan = (updates: Partial<Plan>) => {
    if (!activePlanId) return;
    setPlans(prev => prev.map(p => p.id === activePlanId ? { ...p, ...updates } : p));
  };

  const handleUpdatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p;
      
      const newPlan = { ...p, ...updates };
      
      // Handle Baseline Capture logic
      if (p.status === 'draft' && updates.status === 'active') {
        newPlan.baselineAllocations = JSON.parse(JSON.stringify(p.allocations));
      }
      
      return newPlan;
    }));
  };

  const handleCreatePlan = (name: string, config?: { startDate: string, numberOfSprints: number }) => {
    const newPlan: Plan = {
      id: crypto.randomUUID(),
      name,
      status: 'draft',
      createdAt: new Date().toISOString(),
      teams: [],
      activities: [],
      allocations: [],
      holidays: [],
      config: {
        startDate: config?.startDate || new Date().toISOString().split('T')[0],
        numberOfSprints: config?.numberOfSprints || 5,
        sprintDurationDays: 14
      }
    };
    setPlans(prev => [...prev, newPlan]);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    if (activePlanId === id) {
      setActivePlanId(null);
      setView('dashboard');
    }
  };

  const enterPlan = (id: string) => {
    setActivePlanId(id);
    setView('board');
  };

  const updateActivityTeamStatus = (activityId: string, teamId: string, status: ActivityStatus) => {
    if (!activePlan) return;
    const updatedActivities = activePlan.activities.map(act => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        estimates: act.estimates.map(est => 
          est.teamId === teamId ? { ...est, status } : est
        )
      };
    });
    updateActivePlan({ activities: updatedActivities });
  };

  const handleUpdateActivity = (updated: Activity) => {
    if (!activePlan) return;
    updateActivePlan({
      activities: activePlan.activities.map(a => a.id === updated.id ? updated : a)
    });
  };

  const handleUpdateAllocation = (updated: Allocation) => {
    if (!activePlan) return;
    updateActivePlan({
      allocations: activePlan.allocations.map(a => a.id === updated.id ? updated : a)
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">AgileNexus <span className="text-indigo-600">ART</span></h1>
          </div>
          
          {activePlan && (
            <div className="flex items-center gap-3 ml-4 border-l border-slate-200 pl-6">
              <button 
                onClick={() => { setView('dashboard'); setActivePlanId(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                title="Back to Dashboard"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400">Current Plan</p>
                <h2 className="text-sm font-black text-slate-800">{activePlan.name}</h2>
              </div>
            </div>
          )}
        </div>
        
        {activePlan ? (
          <nav className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            {[
              { id: 'teams', icon: Users, label: 'Teams' },
              { id: 'activities', icon: ListTodo, label: 'Backlog' },
              { id: 'priority', icon: Star, label: 'Priority' },
              { id: 'board', icon: LayoutDashboard, label: 'Board' },
              // Using aliased ActivityIcon instead of non-existent TrackIcon
              { id: 'track', icon: ActivityIcon, label: 'Track' },
              { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
              { id: 'settings', icon: Settings, label: 'Config' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => setView(btn.id as ViewType)}
                title={btn.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === btn.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <btn.icon size={18} />
                <span className="text-sm font-semibold hidden lg:inline">{btn.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-xs font-bold text-indigo-700">Multi-Plan Dashboard</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-white font-black text-xs">SA</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto h-full">
          {view === 'dashboard' && (
            <PlansDashboard 
              plans={plans} 
              onCreatePlan={handleCreatePlan} 
              onDeletePlan={handleDeletePlan} 
              onEnterPlan={enterPlan}
              onUpdatePlan={handleUpdatePlan}
            />
          )}
          {activePlan && (
            <>
              {view === 'teams' && (
                <TeamManager 
                  teams={activePlan.teams} 
                  onAddTeam={(t) => updateActivePlan({ teams: [...activePlan.teams, t] })} 
                  onDeleteTeam={(id) => updateActivePlan({ teams: activePlan.teams.filter(t => t.id !== id) })} 
                  onUpdateTeam={(updated) => updateActivePlan({ teams: activePlan.teams.map(t => t.id === updated.id ? updated : t) })}
                />
              )}
              {view === 'activities' && (
                <ActivityManager 
                  activities={activePlan.activities} 
                  teams={activePlan.teams}
                  allocations={activePlan.allocations}
                  onAddActivity={(a) => updateActivePlan({ activities: [...activePlan.activities, a] })}
                  onDeleteActivity={(id) => updateActivePlan({ activities: activePlan.activities.filter(a => a.id !== id) })}
                  onUpdateTeamStatus={updateActivityTeamStatus}
                  onUpdateActivity={handleUpdateActivity}
                />
              )}
              {view === 'priority' && (
                <PriorityView 
                  activities={activePlan.activities}
                  teams={activePlan.teams}
                  sprints={activeSprints}
                  globalHolidays={activePlan.holidays}
                  onUpdateActivities={(acts) => updateActivePlan({ activities: acts })}
                />
              )}
              {view === 'board' && (
                <PlanningBoard 
                  teams={activePlan.teams}
                  sprints={activeSprints}
                  activities={activePlan.activities}
                  allocations={activePlan.allocations}
                  globalHolidays={activePlan.holidays}
                  onAllocate={(a) => updateActivePlan({ allocations: [...activePlan.allocations, a] })}
                  onUpdateAllocation={handleUpdateAllocation}
                  onRemoveAllocation={(id) => updateActivePlan({ allocations: activePlan.allocations.filter(a => a.id !== id) })}
                />
              )}
              {view === 'track' && (
                <TrackDashboard 
                  activities={activePlan.activities}
                  sprints={activeSprints}
                  allocations={activePlan.allocations}
                  baselineAllocations={activePlan.baselineAllocations}
                  teams={activePlan.teams}
                />
              )}
              {view === 'calendar' && (
                <TeamCalendar 
                  teams={activePlan.teams}
                  globalHolidays={activePlan.holidays}
                />
              )}
              {view === 'settings' && (
                <SettingsPanel 
                  config={activePlan.config} 
                  onUpdateConfig={(c) => updateActivePlan({ config: c })}
                  holidays={activePlan.holidays}
                  onUpdateHolidays={(h) => updateActivePlan({ holidays: h })}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        AgileNexus ART Control Systems &bull; Program Increment Orchestration
      </footer>
    </div>
  );
};

export default App;
