
import React, { useMemo, useState } from 'react';
import { Plan } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Layers, 
  Clock, 
  TrendingUp,
  Map as MapIcon,
  Flag
} from 'lucide-react';

interface RoadmapViewProps {
  plans: Plan[];
  onEnterPlan: (id: string) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ plans, onEnterPlan }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const planTimelineData = useMemo(() => {
    return plans.map(plan => {
      const startDate = new Date(plan.config.startDate);
      const { numberOfSprints, sprintDurationDays } = plan.config;
      const totalDays = numberOfSprints * sprintDurationDays;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + totalDays);

      return {
        ...plan,
        start: startDate,
        end: endDate,
        isCurrentYear: startDate.getFullYear() === currentYear || endDate.getFullYear() === currentYear
      };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [plans, currentYear]);

  const getPosition = (date: Date) => {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
    
    if (date < yearStart) return 0;
    if (date > yearEnd) return 100;
    
    const totalMs = yearEnd.getTime() - yearStart.getTime();
    const currentMs = date.getTime() - yearStart.getTime();
    return (currentMs / totalMs) * 100;
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'active': return 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-100';
      case 'draft': return 'bg-amber-500 border-amber-600 text-white shadow-amber-100';
      case 'closed': return 'bg-slate-400 border-slate-500 text-white shadow-slate-100';
      default: return 'bg-slate-200 border-slate-300 text-slate-600';
    }
  };

  return (
    <div className="space-y-8 py-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <MapIcon className="text-indigo-600" size={32} />
            Yearly RoadMap
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            Strategic visualization of Program Increments across the {currentYear} calendar.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setCurrentYear(prev => prev - 1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-black text-slate-800 px-4 min-w-[80px] text-center">{currentYear}</span>
          <button 
            onClick={() => setCurrentYear(prev => prev + 1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Roadmap Timeline Header */}
        <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50/50">
          {months.map(month => (
            <div key={month} className="p-4 text-center border-r border-slate-100 last:border-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{month}</span>
            </div>
          ))}
        </div>

        {/* Roadmap Body */}
        <div className="relative min-h-[500px] p-6">
          {/* Vertical Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-12 pointer-events-none px-6">
            {months.map((_, i) => (
              <div key={i} className="h-full border-r border-slate-50 last:border-0"></div>
            ))}
          </div>

          {/* Current Day Indicator */}
          {new Date().getFullYear() === currentYear && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-20 pointer-events-none"
              style={{ left: `calc(${getPosition(new Date())}% + 24px - (0.5 * ${getPosition(new Date())} / 100 * 48px))` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-indigo-500 rounded-full shadow-lg border-2 border-white"></div>
              <div className="absolute top-4 left-2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                Today
              </div>
            </div>
          )}

          <div className="space-y-6 relative z-10 pt-8 pb-12">
            {planTimelineData.filter(p => p.isCurrentYear).length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <Calendar size={64} className="text-slate-300 mb-4" />
                    <p className="text-xl font-black text-slate-400">No Program Increments planned for {currentYear}</p>
                </div>
            ) : (
                planTimelineData.filter(p => p.isCurrentYear).map(plan => {
                    const startPos = getPosition(plan.start);
                    const endPos = getPosition(plan.end);
                    const width = endPos - startPos;

                    return (
                        <div key={plan.id} className="group relative">
                            <div 
                                className={`absolute h-16 rounded-[24px] border-2 flex flex-col justify-center px-6 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl group-active:scale-95 ${getStatusStyle(plan.status)}`}
                                style={{ 
                                    left: `${startPos}%`, 
                                    width: `${Math.max(10, width)}%`,
                                    zIndex: plan.status === 'active' ? 10 : 1
                                }}
                                onClick={() => onEnterPlan(plan.id)}
                            >
                                <div className="flex items-center justify-between gap-3 overflow-hidden">
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-black truncate leading-tight">{plan.name}</span>
                                        <span className="text-[9px] opacity-80 font-bold uppercase tracking-tighter">
                                            {plan.start.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {plan.end.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                    </div>
                                    <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>
                                
                                {/* Progress mini-bar inside roadmap item */}
                                <div className="absolute bottom-3 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-white transition-all duration-1000" 
                                      style={{ width: `${plan.activities.length > 0 ? (plan.activities.filter(a => a.estimates.every(e => e.status === 'Done')).length / plan.activities.length) * 100 : 0}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            
            {/* Legend for Roadmap */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-12 border-t border-slate-50 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span>Active PI</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Planned / Draft</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span>Archived Cycle</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-5">
           <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
              <Layers size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned Cycles</p>
              <p className="text-2xl font-black text-slate-800">{plans.length} ART Cycles</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Total count of historical and active increments.</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-5">
           <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
              <Clock size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Milestone</p>
              <p className="text-2xl font-black text-slate-800">
                {planTimelineData.find(p => p.start > new Date())?.name || 'No future plans'}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">Upcoming start date for the next planning cycle.</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-start gap-5">
           <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <TrendingUp size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Velocity</p>
              <p className="text-2xl font-black text-slate-800">
                {planTimelineData.filter(p => p.status === 'closed').reduce((acc, p) => acc + p.activities.length, 0)} Items
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">Completed scope delivery across previous cycles.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapView;
