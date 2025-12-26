
import React, { useState } from 'react';
import { Plan, PlanStatus, PIConfig } from '../types';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  Calendar,
  Layers,
  Archive as ArchiveIcon,
  LayoutDashboard,
  History,
  Hash,
  Settings2,
  X,
  Check,
  Map as MapIcon
} from 'lucide-react';

interface PlansDashboardProps {
  plans: Plan[];
  onCreatePlan: (name: string, config: { startDate: string, numberOfSprints: number }) => void;
  onDeletePlan: (id: string) => void;
  onEnterPlan: (id: string) => void;
  onUpdatePlan: (id: string, updates: Partial<Plan>) => void;
  onNavigateRoadmap: () => void;
}

const PlansDashboard: React.FC<PlansDashboardProps> = ({ 
  plans, 
  onCreatePlan, 
  onDeletePlan, 
  onEnterPlan,
  onUpdatePlan,
  onNavigateRoadmap
}) => {
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanStart, setNewPlanStart] = useState(new Date().toISOString().split('T')[0]);
  const [newPlanSprints, setNewPlanSprints] = useState(5);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<PIConfig | null>(null);

  const calculateProgress = (plan: Plan) => {
    const totalEstimate = plan.activities.reduce((sum, act) => 
      sum + act.estimates.reduce((s, est) => s + est.effort, 0), 0
    );
    const totalCompleted = plan.activities.reduce((sum, act) => 
      sum + act.estimates.reduce((s, est) => {
        if (est.status === 'Done') return s + est.effort;
        if (est.status === 'In Progress') return s + (est.effort * 0.5);
        return s;
      }, 0), 0
    );
    if (totalEstimate === 0) return 0;
    return Math.min(100, Math.round((totalCompleted / totalEstimate) * 100));
  };

  const getStatusColor = (status: PlanStatus) => {
    switch(status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-slate-200 text-slate-600 border-slate-300';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const filteredPlans = plans.filter(p => 
    activeTab === 'active' ? p.status !== 'closed' : p.status === 'closed'
  );

  const handleStartCreate = () => {
    if (!newPlanName.trim()) return;
    onCreatePlan(newPlanName, { startDate: newPlanStart, numberOfSprints: newPlanSprints });
    setNewPlanName('');
  };

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditConfig({ ...plan.config });
  };

  const saveEdit = (id: string) => {
    if (editConfig) {
      onUpdatePlan(id, { config: editConfig });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            {activeTab === 'active' ? <LayoutDashboard className="text-indigo-600" size={32} /> : <History className="text-slate-400" size={32} />}
            {activeTab === 'active' ? 'Active Plans' : 'Plan Archive'}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            {activeTab === 'active' 
              ? 'Manage ongoing Program Increments and track active progress.' 
              : 'Review completed cycles and historical performance data.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateRoadmap}
            className="px-6 py-2.5 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-sm transition-all hover:bg-indigo-100 flex items-center gap-2 border border-indigo-100"
          >
            <MapIcon size={18} /> RoadMap
          </button>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Layers size={16} /> Active
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArchiveIcon size={16} /> Archive
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'active' && (
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-6 w-full max-w-4xl">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Plan Name</label>
            <input 
              type="text" 
              placeholder="e.g. PI-2025-Q1"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="w-full bg-slate-800 px-4 py-3 rounded-2xl border-none outline-none font-bold text-slate-400 placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleStartCreate()}
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1"><Calendar size={12}/> Start Date</label>
            <input 
              type="date"
              value={newPlanStart}
              onChange={(e) => setNewPlanStart(e.target.value)}
              className="w-full bg-slate-800 px-4 py-3 rounded-2xl border-none outline-none font-bold text-slate-400 cursor-pointer"
            />
          </div>
          <div className="w-full md:w-24">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1"><Hash size={12}/> Sprints</label>
            <input 
              type="number"
              min="1"
              max="12"
              value={newPlanSprints}
              onChange={(e) => setNewPlanSprints(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-800 px-4 py-3 rounded-2xl border-none outline-none font-bold text-slate-400 text-center"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleStartCreate}
              disabled={!newPlanName.trim()}
              className="h-[52px] md:h-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
            >
              <Plus size={18} /> New Plan
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlans.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[48px] border-2 border-dashed border-slate-200">
            <div className={`p-8 rounded-full mb-6 ${activeTab === 'active' ? 'bg-indigo-50' : 'bg-slate-50'}`}>
              {activeTab === 'active' ? <Layers className="text-indigo-200 w-16 h-16" /> : <ArchiveIcon className="text-slate-200 w-16 h-16" />}
            </div>
            <p className="text-2xl font-black text-slate-400">
              {activeTab === 'active' ? 'No active plans found' : 'The archive is currently empty'}
            </p>
            <p className="text-slate-300 font-medium mt-2">
              {activeTab === 'active' ? 'Kickstart your next PI above' : 'Completed plans will appear here'}
            </p>
          </div>
        )}

        {filteredPlans.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(plan => {
          const progress = calculateProgress(plan);
          const isClosed = plan.status === 'closed';
          const isDraft = plan.status === 'draft';
          const isEditing = editingId === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`bg-white rounded-[40px] border transition-all group overflow-hidden flex flex-col ${isClosed ? 'border-slate-200 opacity-80 grayscale-[0.5]' : 'border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-300'}`}
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${getStatusColor(plan.status)}`}>
                    {isClosed ? 'Archived Record' : plan.status}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                    <Calendar size={14} />
                    {isEditing ? (
                        <input 
                          type="date"
                          value={editConfig?.startDate}
                          onChange={(e) => setEditConfig(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                          className="bg-slate-100 text-xs font-bold px-2 py-1 rounded outline-none text-slate-700"
                        />
                    ) : (
                        new Date(plan.config.startDate).toLocaleDateString()
                    )}
                  </div>
                </div>

                <h3 className={`text-2xl font-black tracking-tight mb-2 transition-colors ${isClosed ? 'text-slate-500' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                  {plan.name}
                </h3>
                
                <div className="mt-6 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Completion</span>
                    <span className={`text-sm font-black ${isClosed ? 'text-slate-500' : 'text-indigo-600'}`}>{progress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isClosed ? 'bg-slate-400' : 'bg-indigo-500'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-6 border-t border-slate-50">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Squads</p>
                    <p className={`text-lg font-black ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>{plan.teams.length}</p>
                  </div>
                  <div className="text-center border-x border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Items</p>
                    <p className={`text-lg font-black ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>{plan.activities.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cycles</p>
                    {isEditing ? (
                        <input 
                          type="number"
                          value={editConfig?.numberOfSprints}
                          onChange={(e) => setEditConfig(prev => prev ? { ...prev, numberOfSprints: parseInt(e.target.value) || 1 } : null)}
                          className="w-12 bg-slate-100 text-lg font-black px-1 py-0.5 rounded outline-none text-slate-700 text-center mx-auto block"
                        />
                    ) : (
                        <p className={`text-lg font-black ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>{plan.config.numberOfSprints}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`px-8 py-6 border-t flex items-center justify-between ${isClosed ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex gap-2">
                  {!isClosed && isDraft && (
                    <>
                      {isEditing ? (
                        <>
                          <button 
                            onClick={() => saveEdit(plan.id)}
                            className="p-3 bg-emerald-600 text-white rounded-2xl transition-all shadow-sm"
                            title="Save Configuration"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-3 bg-slate-200 text-slate-600 rounded-2xl transition-all shadow-sm"
                            title="Cancel Edit"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => onUpdatePlan(plan.id, { status: 'active' })}
                            className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded-2xl transition-all shadow-sm"
                            title="Start Execution"
                          >
                            <Play size={18} fill="currentColor" />
                          </button>
                          <button 
                            onClick={() => startEdit(plan)}
                            className="p-3 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 rounded-2xl transition-all shadow-sm"
                            title="Edit Plan Config"
                          >
                            <Settings2 size={18} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {!isClosed && !isDraft && (
                    <button 
                      onClick={() => onUpdatePlan(plan.id, { status: 'closed' })}
                      className="p-3 bg-white hover:bg-amber-50 text-amber-600 border border-slate-200 rounded-2xl transition-all shadow-sm group/close"
                      title="Archive Plan"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => onDeletePlan(plan.id)}
                    className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-500 border border-slate-200 rounded-2xl transition-all shadow-sm"
                    title="Delete Record"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <button 
                  disabled={isEditing}
                  onClick={() => onEnterPlan(plan.id)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 group/btn transition-all shadow-lg ${isClosed ? 'bg-slate-700 text-white hover:bg-slate-900 shadow-slate-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'} disabled:opacity-50`}
                >
                  {isClosed ? 'View Record' : 'Enter Planning'}
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlansDashboard;