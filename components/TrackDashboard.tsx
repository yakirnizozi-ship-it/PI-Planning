
import React, { useMemo } from 'react';
import { Activity, Sprint, Allocation, Team, ActivityStatus } from '../types';
import { Target, CheckCircle2, Clock, PlayCircle, Users, BarChart3, TrendingUp, TrendingDown, Info, Sparkles, Layers } from 'lucide-react';

interface TrackDashboardProps {
  activities: Activity[];
  sprints: Sprint[];
  allocations: Allocation[];
  baselineAllocations?: Allocation[];
  teams: Team[];
}

const TrackDashboard: React.FC<TrackDashboardProps> = ({ activities, sprints, allocations, baselineAllocations, teams }) => {
  const getAggregateStatus = (activity: Activity): ActivityStatus => {
    if (activity.estimates.length === 0) return 'To Do';
    const statuses = activity.estimates.map(e => e.status);
    if (statuses.every(s => s === 'Done')) return 'Done';
    if (statuses.some(s => s === 'In Progress' || s === 'Done')) return 'In Progress';
    return 'To Do';
  };

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-500';
      case 'In Progress': return 'bg-amber-400';
      default: return 'bg-slate-300';
    }
  };

  const getTeamBadgeStyle = (status: ActivityStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const activityMetrics = useMemo(() => {
    return activities.map(activity => {
      const activityAllocations = allocations.filter(a => a.activityId === activity.id);
      const activityBaseline = (baselineAllocations || []).filter(a => a.activityId === activity.id);

      // Current Execution Range
      const actualSprintIndices = activityAllocations.map(a => 
        sprints.findIndex(s => s.id === a.sprintId)
      ).filter(idx => idx !== -1);
      const actualFirstIdx = actualSprintIndices.length > 0 ? Math.min(...actualSprintIndices) : -1;
      const actualLastIdx = actualSprintIndices.length > 0 ? Math.max(...actualSprintIndices) : -1;

      // Baseline Range
      const baselineSprintIndices = activityBaseline.map(a => 
        sprints.findIndex(s => s.id === a.sprintId)
      ).filter(idx => idx !== -1);
      const baselineFirstIdx = baselineSprintIndices.length > 0 ? Math.min(...baselineSprintIndices) : -1;
      const baselineLastIdx = baselineSprintIndices.length > 0 ? Math.max(...baselineSprintIndices) : -1;

      const totalEstimated = activity.estimates.reduce((sum, e) => sum + e.effort, 0);
      const totalActual = activityAllocations.reduce((sum, a) => sum + a.effort, 0);
      const totalPlanned = activityBaseline.reduce((sum, a) => sum + a.effort, 0);
      const variance = totalActual - totalPlanned;
      
      const status = getAggregateStatus(activity);

      // Detect if activity was added after baseline (scope creep)
      const isNew = !!baselineAllocations && activityBaseline.length === 0;

      const teamStatusMap = activity.estimates.map(e => ({
        name: teams.find(t => t.id === e.teamId)?.name || 'Unknown',
        status: e.status
      }));

      return {
        id: activity.id,
        title: activity.title,
        status,
        actualFirstIdx,
        actualLastIdx,
        baselineFirstIdx,
        baselineLastIdx,
        totalEstimated,
        totalActual,
        totalPlanned,
        variance,
        isNew,
        progress: totalEstimated > 0 ? Math.min(100, Math.round((totalActual / totalEstimated) * 100)) : 0,
        teamStatuses: teamStatusMap
      };
    });
  }, [activities, sprints, allocations, baselineAllocations, teams]);

  // Overall ART Progress
  const artMetrics = useMemo(() => {
    const totalEst = activities.reduce((sum, a) => sum + a.estimates.reduce((s, e) => s + e.effort, 0), 0);
    const totalActual = allocations.reduce((sum, a) => sum + a.effort, 0);
    const totalPlanned = (baselineAllocations || []).reduce((sum, a) => sum + a.effort, 0);
    const progress = totalEst > 0 ? Math.round((totalActual / totalEst) * 100) : 0;
    const variance = totalActual - totalPlanned;
    return { progress, totalActual, totalPlanned, variance };
  }, [activities, allocations, baselineAllocations]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-indigo-900 text-white p-8 rounded-[40px] shadow-xl md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Plan vs. Actual</h2>
                <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">ART Program Variance Tracking</p>
              </div>
              {baselineAllocations && (
                <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${artMetrics.variance > 0 ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'}`}>
                  {artMetrics.variance > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Variance: {artMetrics.variance > 0 ? '+' : ''}{artMetrics.variance}d
                </div>
              )}
            </div>
          </div>
          <div className="mt-8">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <span className="text-5xl font-black">{artMetrics.progress}%</span>
                <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Total Capacity Load</span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-indigo-200">
                    <span className="flex flex-col">
                        <span className="text-[10px] text-indigo-400">Baseline Plan</span>
                        <span>{artMetrics.totalPlanned} Days</span>
                    </span>
                    <span className="w-px h-6 bg-indigo-700"></span>
                    <span className="flex flex-col">
                        <span className="text-[10px] text-indigo-400">Current Actual</span>
                        <span className="text-white">{artMetrics.totalActual} Days</span>
                    </span>
                </div>
              </div>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-indigo-400 transition-all duration-1000 shadow-[0_0_20px_rgba(129,140,248,0.5)]" style={{ width: `${artMetrics.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Items</p>
              <p className="text-2xl font-black text-slate-800">{activities.filter(a => getAggregateStatus(a) === 'Done').length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
              <PlayCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Flight</p>
              <p className="text-2xl font-black text-slate-800">{activities.filter(a => getAggregateStatus(a) === 'In Progress').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-center">
            {!baselineAllocations ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <BarChart3 className="text-slate-200 mb-2" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Baseline not captured.<br/>Start PI execution to track variance.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseline Match</p>
                        <p className="text-xl font-black text-slate-800">
                          {Math.round((artMetrics.totalPlanned / (artMetrics.totalActual || 1)) * 100)}%
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Deviation</p>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${artMetrics.variance > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(100, Math.abs(artMetrics.variance / (artMetrics.totalPlanned || 1) * 100))}%` }} 
                        />
                    </div>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Baseline Legend Info */}
      {baselineAllocations && (
        <div className="bg-indigo-50 px-6 py-4 rounded-3xl border border-indigo-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
                 <Info size={16} />
              </div>
              <p className="text-xs font-bold text-indigo-800">Tracking against baseline captured at execution start.</p>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-12 h-2 bg-slate-100 rounded-full border border-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-300 w-1/2"></div>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Plan</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-12 h-2 bg-indigo-500 rounded-full border border-indigo-600 shadow-sm"></div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Current Actual</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-12 h-2 bg-white rounded-full border-2 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]"></div>
                 <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">New Scope</span>
              </div>
           </div>
        </div>
      )}

      {/* Timeline View */}
      <div className="bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Timeline Header */}
            <div className="grid grid-cols-[350px_1fr] bg-slate-50 border-b border-slate-200">
              <div className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">
                Activity Details
              </div>
              <div className="flex">
                {sprints.map(sprint => (
                  <div key={sprint.id} className="flex-1 p-6 text-center border-r border-slate-100 last:border-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{sprint.name}</p>
                    <p className="text-[9px] font-bold text-slate-300">{sprint.startDate.split('-').slice(1).join('/')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="divide-y divide-slate-100">
              {activityMetrics.map(act => (
                <div 
                  key={act.id} 
                  className={`grid grid-cols-[350px_1fr] group transition-all duration-300 ${act.isNew ? 'bg-purple-50/10' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`p-6 border-r border-slate-200 relative ${act.isNew ? 'border-2 border-purple-500 ring-4 ring-purple-100/50 rounded-2xl my-2 mx-4 z-10 bg-white' : ''}`}>
                    {act.isNew && (
                      <div className="absolute -top-3 -right-3 bg-purple-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white z-20">
                        <Sparkles size={12} fill="currentColor" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getStatusColor(act.status)}`} />
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className={`font-black text-sm leading-tight transition-colors ${act.isNew ? 'text-purple-700' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                               {act.title}
                             </h4>
                             {act.isNew && (
                               <span className="text-[8px] font-black bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter border border-purple-200">
                                 Added Post-PI
                               </span>
                             )}
                          </div>
                          
                          {/* Standard Team Badge Display */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {act.teamStatuses.map(ts => (
                              <span 
                                key={ts.name} 
                                className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border transition-colors shadow-sm ${getTeamBadgeStyle(ts.status)}`}
                                title={`${ts.name}: ${ts.status}`}
                              >
                                  {ts.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {baselineAllocations && act.variance !== 0 && (
                        <div className={`text-[9px] font-black px-2 py-1 rounded-lg ${act.variance > 0 ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-emerald-50 text-emerald-600 shadow-sm'}`}>
                          {act.variance > 0 ? '+' : ''}{act.variance}d
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className={`flex-1 h-1 rounded-full mr-4 overflow-hidden ${act.isNew ? 'bg-purple-100' : 'bg-slate-100'}`}>
                            <div className={`h-full transition-all duration-500 ${act.isNew ? 'bg-purple-500' : 'bg-indigo-500'}`} style={{ width: `${act.progress}%` }} />
                        </div>
                        <span className={`text-[10px] font-black ${act.isNew ? 'text-purple-600' : 'text-slate-400'}`}>{act.progress}%</span>
                    </div>
                  </div>

                  <div className={`relative flex p-6 items-center ${act.isNew ? 'border-2 border-purple-500 border-l-0 rounded-r-2xl my-2 mr-4 bg-white/50' : ''}`}>
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex">
                      {sprints.map((_, idx) => (
                        <div key={idx} className="flex-1 border-r border-slate-50 last:border-0" />
                      ))}
                    </div>

                    <div className="relative w-full h-16 flex flex-col justify-center">
                      {/* 1. Baseline Shadow Bar */}
                      {baselineAllocations && act.baselineFirstIdx !== -1 && (
                        <div 
                          className="absolute h-10 rounded-2xl bg-slate-50 border border-slate-200 border-dashed opacity-40 z-0 transition-all duration-700 flex items-center justify-center px-4"
                          style={{
                            left: `${(act.baselineFirstIdx / sprints.length) * 100}%`,
                            width: `${((act.baselineLastIdx - act.baselineFirstIdx + 1) / sprints.length) * 100}%`,
                            transform: 'translateY(-12px)'
                          }}
                        >
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                            Plan: {act.totalPlanned}d
                          </span>
                        </div>
                      )}

                      {/* 2. Current Active Bar */}
                      {act.actualFirstIdx !== -1 ? (
                        <div 
                          className={`absolute h-8 rounded-xl shadow-lg transition-all duration-500 border-2 border-white flex items-center justify-center px-4 overflow-hidden z-10 ${act.isNew ? 'bg-purple-600 ring-2 ring-purple-100' : getStatusColor(act.status)}`}
                          style={{
                            left: `${(act.actualFirstIdx / sprints.length) * 100}%`,
                            width: `${((act.actualLastIdx - act.actualFirstIdx + 1) / sprints.length) * 100}%`,
                            transform: baselineAllocations && act.baselineFirstIdx !== -1 ? 'translateY(12px)' : 'none'
                          }}
                        >
                           <span className="text-[9px] font-black text-white uppercase tracking-widest truncate">
                             {act.totalActual}d {act.status}
                           </span>
                        </div>
                      ) : (
                        act.baselineFirstIdx === -1 && (
                          <div className="w-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest italic flex items-center gap-2">
                              <Clock size={12} /> Not yet scheduled
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 py-4">
        {[
          { label: 'To Do', color: 'bg-slate-300' },
          { label: 'In Progress', color: 'bg-amber-400' },
          { label: 'Done', color: 'bg-emerald-500' },
          { label: 'Scope Creep', color: 'bg-purple-600' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackDashboard;
