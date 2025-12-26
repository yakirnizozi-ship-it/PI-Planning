
import React, { useMemo } from 'react';
import { Team, Activity, Sprint, Holiday, VacationRange } from '../types';
import { Star, TrendingUp, AlertTriangle, CheckCircle2, Weight, Info, ArrowUpRight } from 'lucide-react';

interface PriorityViewProps {
  activities: Activity[];
  teams: Team[];
  sprints: Sprint[];
  globalHolidays: Holiday[];
  onUpdateActivities: (activities: Activity[]) => void;
}

const PriorityView: React.FC<PriorityViewProps> = ({ 
  activities, 
  teams, 
  sprints, 
  globalHolidays,
  onUpdateActivities 
}) => {

  // Capacity Helper (replicated from PlanningBoard for isolation)
  const isDateInRanges = (isoDate: string, ranges: {startDate: string, endDate: string}[]) => {
    return ranges.some(range => isoDate >= range.startDate && isoDate <= range.endDate);
  };

  const getWorkingDaysInRange = (start: string, end: string, personalHolidays: VacationRange[], globalHolidays: Holiday[]) => {
    let count = 0;
    const cur = new Date(start);
    const stop = new Date(end);
    const gRanges = globalHolidays.map(h => ({ startDate: h.startDate, endDate: h.endDate }));
    const pHolidays = personalHolidays.map(h => ({ startDate: h.startDate, endDate: h.endDate }));

    while (cur <= stop) {
      const day = cur.getDay(); 
      const iso = cur.toISOString().split('T')[0];
      const isWeekend = day === 6 || day === 0;
      if (!isWeekend && !isDateInRanges(iso, gRanges) && !isDateInRanges(iso, pHolidays)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // 1. Calculate Total PI Capacity for each team
  const teamPIStats = useMemo(() => {
    return teams.map(team => {
      const totalPICapacity = sprints.reduce((sum, sprint) => {
        const teamSprintCapacity = team.members.reduce((mSum, member) => {
          return mSum + getWorkingDaysInRange(sprint.startDate, sprint.endDate, member.holidays, globalHolidays);
        }, 0);
        return sum + teamSprintCapacity;
      }, 0);

      const totalCommittedEffort = activities
        .filter(a => a.isIncluded)
        .reduce((sum, a) => {
          const est = a.estimates.find(e => e.teamId === team.id)?.effort || 0;
          return sum + est;
        }, 0);

      const utilization = totalPICapacity > 0 ? (totalCommittedEffort / totalPICapacity) * 100 : 0;

      return {
        id: team.id,
        name: team.name,
        capacity: totalPICapacity,
        committed: totalCommittedEffort,
        utilization,
        isOver: utilization > 100
      };
    });
  }, [teams, sprints, globalHolidays, activities]);

  const toggleInclude = (id: string) => {
    onUpdateActivities(activities.map(a => 
      a.id === id ? { ...a, isIncluded: !a.isIncluded } : a
    ));
  };

  const stats = {
    totalIncluded: activities.filter(a => a.isIncluded).length,
    totalRemaining: activities.filter(a => !a.isIncluded).length,
    totalEffortIncluded: activities
      .filter(a => a.isIncluded)
      .reduce((sum, a) => sum + a.estimates.reduce((s, e) => s + e.effort, 0), 0)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Global Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <Star className="text-amber-500 fill-amber-500" size={32} />
            Prioritization & Sizing
          </h2>
          <p className="text-slate-500 mt-1 font-medium max-w-2xl">
            Evaluate team capacity vs. required effort. Select high-priority items from the Program Backlog to include in the current PI Planning Board.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Items</p>
              <p className="text-xl font-black text-slate-800">{stats.totalIncluded}</p>
            </div>
          </div>
          <div className="bg-indigo-900 text-white p-5 rounded-[28px] shadow-xl flex items-center gap-4">
            <div className="bg-white/10 text-white p-3 rounded-2xl">
              <Weight size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Weight</p>
              <p className="text-xl font-black">{stats.totalEffortIncluded} Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamPIStats.map(team => (
          <div key={team.id} className={`bg-white p-6 rounded-[32px] border transition-all ${team.isOver ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-black text-slate-800 tracking-tight">{team.name}</h4>
              {team.isOver ? (
                <AlertTriangle className="text-red-500" size={18} />
              ) : (
                <CheckCircle2 className="text-emerald-500" size={18} />
              )}
            </div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PI Load</span>
              <span className={`text-sm font-black ${team.isOver ? 'text-red-600' : 'text-indigo-600'}`}>
                {team.committed} / {team.capacity} Days
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${team.isOver ? 'bg-red-500' : 'bg-indigo-500'}`} 
                style={{ width: `${Math.min(100, team.utilization)}%` }} 
              />
            </div>
            <p className={`text-[10px] font-bold mt-3 uppercase tracking-wider ${team.isOver ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
              {team.isOver ? 'Over Capacity Alert' : `${Math.round(team.utilization)}% Utilized`}
            </p>
          </div>
        ))}
      </div>

      {/* Prioritization Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Program Backlog Refinement</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Rank and commit activities to the plan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legend:</span>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] font-bold text-slate-500">Planned</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <span className="text-[10px] font-bold text-slate-500">Deferred</span>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">
              <th className="p-6 pl-10 w-20">Plan</th>
              <th className="p-6">Activity Details</th>
              <th className="p-6 text-center">Total Weight</th>
              {teams.map(t => (
                <th key={t.id} className="p-6 text-center border-l border-slate-50">{t.name} (d)</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activities.length === 0 ? (
                <tr>
                    <td colSpan={3 + teams.length} className="p-20 text-center">
                        <Info className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-bold">No backlog items available for prioritization.</p>
                    </td>
                </tr>
            ) : (
                activities.map(activity => (
                <tr key={activity.id} className={`group transition-colors ${activity.isIncluded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="p-6 pl-10">
                    <button 
                        onClick={() => toggleInclude(activity.id)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 flex items-center ${activity.isIncluded ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${activity.isIncluded ? 'left-7' : 'left-1'}`}></div>
                    </button>
                    </td>
                    <td className="p-6">
                    <div className="flex flex-col">
                        <span className={`font-black tracking-tight text-lg ${activity.isIncluded ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {activity.title}
                        </span>
                        <span className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{activity.description || 'No description provided'}</span>
                    </div>
                    </td>
                    <td className="p-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-black text-xs ${activity.isIncluded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                        <Weight size={14} /> {activity.estimates.reduce((s, e) => s + e.effort, 0)}
                    </span>
                    </td>
                    {teams.map(team => {
                    const est = activity.estimates.find(e => e.teamId === team.id)?.effort || 0;
                    return (
                        <td key={team.id} className={`p-6 text-center border-l border-slate-50/50 font-black text-sm ${est > 0 ? (activity.isIncluded ? 'text-indigo-700' : 'text-slate-700') : 'text-slate-200'}`}>
                        {est > 0 ? est : '-'}
                        </td>
                    );
                    })}
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Capacity Guard Info */}
      <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 flex items-start gap-6">
          <div className="bg-white p-4 rounded-[24px] shadow-sm text-indigo-600">
              <ArrowUpRight size={24} />
          </div>
          <div>
              <h4 className="text-lg font-black text-indigo-900 tracking-tight">Capacity Guardrail</h4>
              <p className="text-indigo-700/70 text-sm font-medium leading-relaxed max-w-3xl mt-2">
                This view aggregates individual sprint capacities into a total PI availability. 
                Before committing activities to the board, ensure that your committed estimates do not exceed the PI capacity for any single squad. 
                Activities included here will automatically appear in the <span className="font-black">Plan Backlog</span> on the main board.
              </p>
          </div>
      </div>
    </div>
  );
};

export default PriorityView;