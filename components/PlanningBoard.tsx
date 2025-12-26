
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Trash2,
  ListTodo,
  CalendarDays,
  Briefcase,
  AlertCircle,
  Weight,
  Edit2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Team, Sprint, Activity, Allocation, Holiday, ActivityStatus, VacationRange } from '../types';

interface PlanningBoardProps {
  teams: Team[];
  sprints: Sprint[];
  activities: Activity[];
  allocations: Allocation[];
  globalHolidays: Holiday[];
  onAllocate: (allocation: Allocation) => void;
  onUpdateAllocation: (allocation: Allocation) => void;
  onRemoveAllocation: (id: string) => void;
}

const PlanningBoard: React.FC<PlanningBoardProps> = ({ 
  teams, 
  sprints, 
  activities, 
  allocations, 
  globalHolidays,
  onAllocate,
  onUpdateAllocation,
  onRemoveAllocation
}) => {
  const [showAllocationModal, setShowAllocationModal] = useState<{ activityId: string, teamId: string, sprintId: string, allocationId?: string } | null>(null);
  const [allocationEffort, setAllocationEffort] = useState<string>('0');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  // Filter activities to only show those included for this PI planning session
  const includedActivities = useMemo(() => activities.filter(a => a.isIncluded), [activities]);

  const toggleActivityExpand = (id: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [id]: !(prev[id] ?? true) // Default to true if not set, then toggle
    }));
  };

  // Helper: check if a specific date falls within any defined ranges using string comparison
  const isDateInRanges = (isoDate: string, ranges: {startDate: string, endDate: string}[]) => {
    return ranges.some(range => isoDate >= range.startDate && isoDate <= range.endDate);
  };

  // Helper: Count working days in range considering holiday ranges
  const getWorkingDaysInRange = (start: string, end: string, personalHolidays: VacationRange[], globalHolidays: Holiday[]) => {
    let count = 0;
    const cur = new Date(start);
    const stop = new Date(end);
    
    // Normalize global holidays for simpler checking
    const gRanges = globalHolidays.map(h => ({ startDate: h.startDate, endDate: h.endDate }));
    const pHolidays = personalHolidays.map(h => ({ startDate: h.startDate, endDate: h.endDate }));

    while (cur <= stop) {
      const day = cur.getDay(); // 0=Sun, 6=Sat
      const iso = cur.toISOString().split('T')[0];
      const isWeekend = day === 6 || day === 0;
      
      const isGlobalHoliday = isDateInRanges(iso, gRanges);
      const isPersonalHoliday = isDateInRanges(iso, pHolidays);

      if (!isWeekend && !isGlobalHoliday && !isPersonalHoliday) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Advanced Capacity Calculation
  const capacities = useMemo(() => {
    const results: Record<string, number> = {}; // key: "teamId-sprintId"

    teams.forEach(team => {
      sprints.forEach(sprint => {
        let teamTotalWorkingDays = 0;
        team.members.forEach(member => {
          const memberDays = getWorkingDaysInRange(
            sprint.startDate, 
            sprint.endDate, 
            member.holidays, 
            globalHolidays
          );
          teamTotalWorkingDays += memberDays;
        });
        results[`${team.id}-${sprint.id}`] = teamTotalWorkingDays;
      });
    });
    return results;
  }, [teams, sprints, globalHolidays]);

  const getTeamSprintUsedEffort = (teamId: string, sprintId: string) => {
    return allocations
      .filter(a => a.teamId === teamId && a.sprintId === sprintId)
      .reduce((sum, a) => sum + a.effort, 0);
  };

  const getActivityTeamStats = (activityId: string, teamId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return { estimated: 0, allocated: 0, remaining: 0, isOver: false, isUnder: false, overdue: 0, status: 'To Do' as ActivityStatus };
    
    const estimateObj = activity.estimates.find(e => e.teamId === teamId);
    const estimate = estimateObj?.effort || 0;
    const status = estimateObj?.status || 'To Do';
    const allocated = allocations
      .filter(a => a.activityId === activityId && a.teamId === teamId)
      .reduce((sum, a) => sum + a.effort, 0);
    
    const isOver = allocated > estimate;
    const isUnder = allocated < estimate;
    return {
      estimated: estimate,
      allocated,
      remaining: Math.max(0, estimate - allocated),
      isOver,
      isUnder,
      overdue: isOver ? allocated - estimate : 0,
      status
    };
  };

  const handleDrop = (e: React.DragEvent, teamId: string, sprintId: string) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData('activityId');
    const stats = getActivityTeamStats(activityId, teamId);
    setAllocationEffort(stats.remaining > 0 ? stats.remaining.toString() : '1');
    setShowAllocationModal({ activityId, teamId, sprintId });
  };

  const handleEditAllocation = (allocation: Allocation) => {
    setAllocationEffort(allocation.effort.toString());
    setShowAllocationModal({ 
      activityId: allocation.activityId, 
      teamId: allocation.teamId, 
      sprintId: allocation.sprintId, 
      allocationId: allocation.id 
    });
  };

  const confirmAllocation = () => {
    if (!showAllocationModal) return;
    const effortNum = Number(allocationEffort);
    if (isNaN(effortNum) || effortNum <= 0) return;

    if (showAllocationModal.allocationId) {
      // Update existing
      onUpdateAllocation({
        id: showAllocationModal.allocationId,
        activityId: showAllocationModal.activityId,
        teamId: showAllocationModal.teamId,
        sprintId: showAllocationModal.sprintId,
        effort: effortNum
      });
    } else {
      // Create new
      onAllocate({
        id: crypto.randomUUID(),
        activityId: showAllocationModal.activityId,
        teamId: showAllocationModal.teamId,
        sprintId: showAllocationModal.sprintId,
        effort: effortNum
      });
    }
    setShowAllocationModal(null);
  };

  const getStatusIndicator = (status: ActivityStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-500';
      case 'In Progress': return 'bg-amber-400';
      default: return 'bg-slate-300';
    }
  };

  const getCardStyle = (status: ActivityStatus, isOver: boolean) => {
    let base = 'bg-white border-slate-100';
    if (status === 'Done') base = 'bg-emerald-50 border-emerald-200';
    else if (status === 'In Progress') base = 'bg-amber-50 border-amber-200';

    if (isOver) {
      return `${base} border-red-500 ring-2 ring-red-100`;
    }
    return base;
  };

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-slate-400">
        <Users size={64} className="mb-4 opacity-10" />
        <h2 className="text-xl font-bold">No Teams Defined</h2>
        <p className="text-sm">Set up your Squads in the Teams tab first.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ART Configuration</span>
            <span className="text-lg font-black text-indigo-600">{sprints.length} Total Sprints</span>
          </div>
          <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs font-bold text-slate-500">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-bold text-slate-500">Over Limit</span>
          </div>
        </div>
        <p className="text-xs text-indigo-500 font-bold bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-2">
          <Briefcase size={14} /> Plan is monitored for over-allocation alerts.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-[600px]">
        {/* The Board */}
        <div className="flex-1 overflow-auto bg-white rounded-[40px] border border-slate-200 shadow-xl custom-scrollbar relative">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="w-64 p-6 text-left font-black text-slate-400 uppercase text-[10px] border-r border-slate-200 tracking-widest bg-slate-50">
                  Sprint Schedule
                </th>
                {sprints.map(sprint => (
                  <th key={sprint.id} className="min-w-[240px] p-6 text-center border-r border-slate-100 last:border-0">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-800">{sprint.name}</span>
                      <span className="text-[10px] text-indigo-500 font-bold tracking-tight">
                        {sprint.startDate} to {sprint.endDate}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 group">
                  <td className="p-6 border-r border-slate-200 bg-white sticky left-0 z-30 group-hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-lg tracking-tight">{team.name}</span>
                      <span className="text-[10px] text-indigo-600 font-black uppercase flex items-center gap-1 mt-1">
                        <Users size={12} /> {team.members.length} Members
                      </span>
                    </div>
                  </td>
                  {sprints.map(sprint => {
                    const capacity = capacities[`${team.id}-${sprint.id}`] || 0;
                    const used = getTeamSprintUsedEffort(team.id, sprint.id);
                    const percent = capacity > 0 ? (used / capacity) * 100 : 0;
                    const isOver = percent > 100;
                    const statusColor = isOver ? 'bg-red-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = isOver ? 'text-red-700' : percent > 85 ? 'text-amber-700' : 'text-emerald-700';

                    return (
                      <td 
                        key={sprint.id}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
                        onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); handleDrop(e, team.id, sprint.id); }}
                        className={`p-4 min-h-[160px] align-top transition-colors border-r border-slate-100 last:border-r-0 ${isOver ? 'bg-red-50/40' : ''}`}
                      >
                        {/* Capacity Bar */}
                        <div className={`mb-3 p-1.5 px-2.5 rounded-xl flex items-center justify-between border transition-all shadow-sm ${isOver ? 'bg-white border-red-500' : 'bg-white border-slate-100'}`}>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-tight ${textColor}`}>
                                    {used}D / {capacity}D
                                </span>
                                {isOver && <span className="text-[8px] font-black text-red-600 uppercase">Warning</span>}
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${statusColor} transition-all duration-500 ${isOver ? 'animate-pulse' : ''}`} 
                                style={{ width: `${Math.min(100, percent)}%` }} 
                              />
                            </div>
                          </div>
                          {isOver && <AlertTriangle size={14} className="text-red-500 ml-2 animate-bounce" />}
                        </div>

                        <div className="space-y-3">
                          {allocations.filter(a => a.teamId === team.id && a.sprintId === sprint.id).map(alloc => {
                            const act = activities.find(a => a.id === alloc.activityId);
                            const stats = getActivityTeamStats(alloc.activityId, team.id);
                            
                            return (
                              <div key={alloc.id} className={`p-3 rounded-2xl shadow-sm border group/item relative hover:shadow-md transition-all ${getCardStyle(stats.status, stats.isOver)}`}>
                                <div className="flex items-start gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${getStatusIndicator(stats.status)}`} title={`Status: ${stats.status}`} />
                                    <h5 className="text-xs font-bold text-slate-700 leading-snug flex-1">{act?.title}</h5>
                                    {stats.isOver && <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />}
                                </div>
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleEditAllocation(alloc)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Edit Actual Effort"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => onRemoveAllocation(alloc.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove Task"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${stats.isOver ? 'bg-red-500 text-white' : 'bg-white/50 text-slate-500 border border-slate-100'}`}>
                                    {alloc.effort} Days
                                  </span>
                                  {stats.isOver && (
                                    <span className="text-[9px] font-black text-red-600 uppercase">Overdue</span>
                                  )}
                                  {!stats.isOver && stats.status === 'Done' && (
                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Complete</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Backlog Section */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-indigo-900 text-white p-5 rounded-[32px] shadow-xl flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 tracking-tight"><ListTodo size={18} /> Plan Backlog</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">{includedActivities.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {includedActivities.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-slate-400 font-bold text-xs uppercase italic tracking-widest mb-4">Plan Backlog is Empty</p>
                <p className="text-[10px] text-slate-400 font-medium">Use the <span className="text-indigo-500 font-black">Priority</span> tab to include items from the Program Backlog.</p>
              </div>
            )}
            {includedActivities.map(activity => {
              const totalEst = activity.estimates.reduce((sum, e) => sum + e.effort, 0);
              
              const teamStatuses = activity.estimates.map(e => getActivityTeamStats(activity.id, e.teamId));
              const isBalanced = teamStatuses.every(s => !s.isOver && !s.isUnder);
              const hasOver = teamStatuses.some(s => s.isOver);
              const hasUnder = teamStatuses.some(s => s.isUnder);

              // The activity is expanded if either it's not balanced OR the user has manually toggled it to expand
              const isExpanded = expandedActivities[activity.id] ?? !isBalanced;

              return (
                <div 
                  key={activity.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('activityId', activity.id); }}
                  className={`bg-white rounded-[28px] border shadow-sm transition-all duration-300 group ${isExpanded ? 'p-5 border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-lg' : 'p-4 border-slate-100 bg-slate-50/30'}`}
                >
                  <div className={`flex justify-between items-start ${isExpanded ? 'mb-3' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                       <button 
                         onClick={() => toggleActivityExpand(activity.id)}
                         className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors shrink-0"
                       >
                         {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                       </button>
                       <h4 
                         onClick={() => toggleActivityExpand(activity.id)}
                         className={`font-bold text-slate-800 text-sm leading-tight cursor-pointer truncate ${isExpanded ? 'group-hover:text-indigo-600 transition-colors' : 'text-slate-600'}`}
                        >
                          {activity.title}
                        </h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isBalanced && <CheckCircle2 size={12} className="text-emerald-500" />}
                      {hasOver && <Clock size={12} className="text-red-500" title="Over-allocated" />}
                      {hasUnder && <Clock size={12} className="text-amber-500" title="Under-allocated" />}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${isExpanded ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                        <Weight size={10} /> {totalEst}d
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      {activity.estimates.map(est => {
                        const team = teams.find(t => t.id === est.teamId);
                        const stats = getActivityTeamStats(activity.id, est.teamId);
                        
                        const labelColor = stats.isOver ? 'text-red-600' : stats.isUnder ? 'text-amber-600' : 'text-slate-400';
                        const valueColor = stats.isOver ? 'text-red-600' : stats.isUnder ? 'text-amber-600' : 'text-indigo-600';

                        return (
                          <div key={est.teamId} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusIndicator(stats.status)}`} />
                                <span className={`font-bold uppercase truncate ${labelColor}`}>
                                  {team?.name}
                                </span>
                              </div>
                              <span className={`font-black shrink-0 ml-1 ${valueColor}`}>
                                {stats.isOver ? `Over: +${stats.overdue}d` : stats.isUnder ? `${stats.remaining}d rem.` : 'Balanced'}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${stats.isOver ? 'bg-red-500' : stats.isUnder ? 'bg-amber-400' : 'bg-indigo-200'}`} 
                                style={{ width: `${Math.min(100, (stats.allocated / stats.estimated) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                      {isBalanced && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase py-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Balanced
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAllocationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl p-12 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-100 rounded-[24px] flex items-center justify-center mb-6 mx-auto">
              <CalendarDays className="text-indigo-600 w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter text-center">
              {showAllocationModal.allocationId ? 'Edit Allocation' : 'Schedule Task'}
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed text-center">
              {showAllocationModal.allocationId 
                ? 'Update actual effort spent during this weekly sync.' 
                : 'Assign capacity for this ART increment.'}
            </p>
            
            <div className="mb-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Effort (Days)</label>
              <div className="flex items-center gap-4">
                <input 
                  autoFocus
                  type="number" 
                  min="0.5"
                  step="0.5"
                  value={allocationEffort}
                  onChange={(e) => setAllocationEffort(e.target.value)}
                  className="flex-1 text-5xl font-black px-6 py-8 rounded-[32px] border-4 border-slate-50 focus:border-indigo-500 outline-none text-center text-indigo-600"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowAllocationModal(null)}
                className="flex-1 px-8 py-5 rounded-[24px] font-black text-slate-400 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAllocation}
                className="flex-1 px-8 py-5 rounded-[24px] font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
              >
                {showAllocationModal.allocationId ? 'Update' : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningBoard;