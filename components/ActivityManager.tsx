
import React, { useState } from 'react';
import { Plus, Trash2, ListTodo, Info, Calculator, AlertCircle, CheckCircle2, ChevronDown, Edit2, X, Weight } from 'lucide-react';
import { Activity, Team, TeamEstimate, Allocation, ActivityStatus } from '../types';

interface ActivityManagerProps {
  activities: Activity[];
  teams: Team[];
  allocations: Allocation[];
  onAddActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateTeamStatus: (activityId: string, teamId: string, status: ActivityStatus) => void;
  onUpdateActivity: (activity: Activity) => void;
}

const ActivityManager: React.FC<ActivityManagerProps> = ({ 
  activities, 
  teams, 
  allocations, 
  onAddActivity, 
  onDeleteActivity,
  onUpdateTeamStatus,
  onUpdateActivity
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [estimates, setEstimates] = useState<Record<string, string>>({});

  // Edit State
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEstimates, setEditEstimates] = useState<Record<string, string>>({});

  const handleCreate = () => {
    if (!title.trim()) return;

    const teamEstimates: TeamEstimate[] = Object.entries(estimates)
      .filter(([_, value]) => value && !isNaN(Number(value)) && Number(value) > 0)
      .map(([teamId, value]) => ({
        teamId,
        effort: Number(value),
        status: 'To Do'
      }));

    const activity: Activity = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: desc.trim(),
      estimates: teamEstimates,
    };

    onAddActivity(activity);
    setTitle('');
    setDesc('');
    setEstimates({});
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setEditTitle(activity.title);
    setEditDesc(activity.description);
    const estMap: Record<string, string> = {};
    activity.estimates.forEach(e => {
      estMap[e.teamId] = e.effort.toString();
    });
    setEditEstimates(estMap);
  };

  const handleSaveEdit = () => {
    if (!editingActivity || !editTitle.trim()) return;

    const teamEstimates: TeamEstimate[] = Object.entries(editEstimates)
      .filter(([_, value]) => value && !isNaN(Number(value)) && Number(value) > 0)
      .map(([teamId, value]) => {
        const existing = editingActivity.estimates.find(e => e.teamId === teamId);
        return {
          teamId,
          effort: Number(value),
          status: existing ? existing.status : 'To Do'
        };
      });

    const updated: Activity = {
      ...editingActivity,
      title: editTitle.trim(),
      description: editDesc.trim(),
      estimates: teamEstimates,
    };

    onUpdateActivity(updated);
    setEditingActivity(null);
  };

  const handleEstimateChange = (teamId: string, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditEstimates(prev => ({ ...prev, [teamId]: value }));
    } else {
      setEstimates(prev => ({ ...prev, [teamId]: value }));
    }
  };

  const totalEffort: number = Object.values(estimates).reduce((sum: number, val: string) => sum + (Number(val) || 0), 0);
  const totalEditEffort: number = Object.values(editEstimates).reduce((sum: number, val: string) => sum + (Number(val) || 0), 0);

  const getActivityStats = (activity: Activity) => {
    const activityAllocations = allocations.filter(a => a.activityId === activity.id);
    const totalAllocated = activityAllocations.reduce((sum, a) => sum + a.effort, 0);
    const totalEstimated = activity.estimates.reduce((sum, e) => sum + e.effort, 0);
    
    const teamStats = activity.estimates.map(est => {
      const teamAllocated = activityAllocations
        .filter(a => a.teamId === est.teamId)
        .reduce((sum, a) => sum + a.effort, 0);
      const isOver = teamAllocated > est.effort;
      return {
        teamId: est.teamId,
        estimated: est.effort,
        allocated: teamAllocated,
        isOver,
        overdue: isOver ? teamAllocated - est.effort : 0,
        status: est.status
      };
    });

    return { totalAllocated, totalEstimated, teamStats };
  };

  const getStatusStyle = (status: ActivityStatus) => {
    switch (status) {
      case 'Done': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Creation UI */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-24">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Plus className="text-indigo-500" /> New Backlog Item
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-400 placeholder:text-slate-400"
              placeholder="E.g. Authentication Service"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Brief Description</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-bold text-slate-400 placeholder:text-slate-400"
              placeholder="Optional details..."
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
              <Calculator size={14} /> Estimates (Days)
            </label>
            {teams.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl flex items-center gap-2 font-bold">
                <Info size={14} /> Create teams first
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600 truncate">{team.name}</span>
                    <input 
                      type="number"
                      min="0"
                      value={estimates[team.id] || ''}
                      onChange={(e) => handleEstimateChange(team.id, e.target.value)}
                      className="w-20 px-3 py-2 text-right rounded-xl bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500 outline-none font-black text-slate-400 placeholder:text-slate-400"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}
            {totalEffort > 0 && (
              <div className="pt-4 flex justify-between items-center text-sm font-black text-slate-800 border-t border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 tracking-widest">Total Weight</span>
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg shadow-indigo-100">{totalEffort} Days</span>
              </div>
            )}
          </div>

          <button 
            disabled={!title.trim()}
            onClick={handleCreate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase text-xs tracking-widest"
          >
            Add to ART Backlog
          </button>
        </div>
      </div>

      {/* Backlog List */}
      <div className="md:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Program Backlog ({activities.length})</h2>
        </div>
        
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white rounded-[40px] border border-slate-200 text-slate-300 shadow-sm">
            <ListTodo size={64} className="mb-4 opacity-5" />
            <p className="font-bold text-lg text-slate-400">Backlog is currently empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activities.map(activity => {
              const { totalAllocated, totalEstimated, teamStats } = getActivityStats(activity);
              const progress = totalEstimated > 0 ? (totalAllocated / totalEstimated) * 100 : 0;
              const hasAnyOverdue = teamStats.some(t => t.isOver);

              return (
                <div key={activity.id} className={`bg-white p-6 rounded-[32px] shadow-sm border transition-all group ${hasAnyOverdue ? 'border-red-200 hover:border-red-400' : 'border-slate-200 hover:border-indigo-300'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{activity.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-indigo-200">
                            <Weight size={12} /> {totalEstimated}d Total
                          </span>
                          {hasAnyOverdue && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 animate-pulse border border-red-100">
                              <AlertCircle size={12} /> Overdue
                            </span>
                          )}
                          {progress >= 100 && !hasAnyOverdue && (
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-emerald-100">
                              <CheckCircle2 size={12} /> Allocated
                            </span>
                          )}
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{activity.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(activity)}
                        className="text-slate-300 hover:text-indigo-600 p-2 transition-colors"
                        title="Edit Activity"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteActivity(activity.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                        title="Delete Activity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Progress</span>
                      <span className={`text-xs font-black ${hasAnyOverdue ? 'text-red-600' : 'text-indigo-600'}`}>
                        {totalAllocated} / {totalEstimated} Days ({Math.round(progress)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${hasAnyOverdue ? 'bg-red-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${Math.min(100, progress)}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {teamStats.map(stat => {
                      const teamName = teams.find(t => t.id === stat.teamId)?.name || 'Unknown';
                      return (
                        <div key={stat.teamId} className={`flex flex-col border rounded-2xl overflow-hidden transition-all ${stat.isOver ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50'}`}>
                          <div className={`px-3 py-1 flex items-center justify-between gap-4 ${stat.isOver ? 'bg-red-100' : 'bg-slate-100'}`}>
                            <span className={`text-[10px] font-black uppercase ${stat.isOver ? 'text-red-700' : 'text-slate-500'}`}>{teamName}</span>
                            {stat.isOver && <span className="text-[10px] font-black text-red-600">+{stat.overdue}d Over</span>}
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between gap-4">
                             <span className={`text-sm font-black ${stat.isOver ? 'text-red-700' : 'text-slate-700'}`}>
                              {stat.allocated} <span className="text-slate-400 font-bold">/ {stat.estimated}d</span>
                             </span>
                             
                             <div className="relative inline-block text-left">
                                <select 
                                  value={stat.status}
                                  onChange={(e) => onUpdateTeamStatus(activity.id, stat.teamId, e.target.value as ActivityStatus)}
                                  className={`appearance-none text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border focus:outline-none cursor-pointer pr-6 ${getStatusStyle(stat.status)}`}
                                >
                                  <option value="To Do">To Do</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Edit2 className="text-indigo-600" size={24} /> Edit Backlog Item
              </h3>
              <button 
                onClick={() => setEditingActivity(null)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Title</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-400 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-bold text-slate-400 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                  <Calculator size={14} /> Update Team Estimations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600 truncate">{team.name}</span>
                      <input 
                        type="number"
                        min="0"
                        value={editEstimates[team.id] || ''}
                        onChange={(e) => handleEstimateChange(team.id, e.target.value, true)}
                        className="w-20 px-3 py-2 text-right rounded-xl bg-slate-800 border-none focus:ring-1 focus:ring-indigo-500 outline-none font-black text-slate-400 placeholder:text-slate-400"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest block">New Total Effort</span>
                  <span className="text-xl font-black text-indigo-600">{totalEditEffort} Days</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingActivity(null)}
                    className="px-6 py-3 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={!editTitle.trim()}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityManager;