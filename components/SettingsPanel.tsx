
import React, { useState } from 'react';
import { PIConfig, Holiday } from '../types';
import { Calendar, Hash, Plus, Trash2, Flag, ArrowRight } from 'lucide-react';

interface SettingsPanelProps {
  config: PIConfig;
  onUpdateConfig: (config: PIConfig) => void;
  holidays: Holiday[];
  onUpdateHolidays: (holidays: Holiday[]) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdateConfig, holidays, onUpdateHolidays }) => {
  const [hName, setHName] = useState('');
  const [hStart, setHStart] = useState('');
  const [hEnd, setHEnd] = useState('');

  const addHoliday = () => {
    if (!hName || !hStart || !hEnd) return;
    onUpdateHolidays([...holidays, { id: crypto.randomUUID(), name: hName, startDate: hStart, endDate: hEnd }]);
    setHName('');
    setHStart('');
    setHEnd('');
  };

  const removeHoliday = (id: string) => {
    onUpdateHolidays(holidays.filter(h => h.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <Flag size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Regional Holiday Calendar</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Global settings affecting all squads</p>
            </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Register New Holiday Period</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <input 
                      type="text"
                      placeholder="Holiday Name (e.g. Passover)"
                      value={hName}
                      onChange={(e) => setHName(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                </div>
                <div className="md:col-span-2 flex gap-4 items-center">
                    <input 
                      type="date"
                      value={hStart}
                      onChange={(e) => setHStart(e.target.value)}
                      className="flex-1 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                    <ArrowRight size={18} className="text-slate-300" />
                    <input 
                      type="date"
                      value={hEnd}
                      onChange={(e) => setHEnd(e.target.value)}
                      className="flex-1 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                </div>
            </div>
            <button 
              onClick={addHoliday}
              disabled={!hName || !hStart || !hEnd}
              className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 font-black transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
            >
              <Plus size={20} /> Add Holiday To Program
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={14} /> Active Program Holidays
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {holidays.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-300 italic flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-[32px]">
                        <p className="text-sm font-bold">No program-wide holidays configured</p>
                    </div>
                )}
                {holidays.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(h => (
                <div key={h.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all hover:shadow-md">
                    <div>
                    <p className="font-black text-slate-800 text-sm">{h.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">
                            {h.startDate}
                        </span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">
                            {h.endDate}
                        </span>
                    </div>
                    </div>
                    <button onClick={() => removeHoliday(h.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 size={20} />
                    </button>
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-indigo-900 text-white p-8 rounded-[40px] shadow-xl flex items-start gap-6">
          <div className="bg-white/10 p-4 rounded-[24px]">
              <Calendar className="text-indigo-200" size={24} />
          </div>
          <div>
              <h4 className="text-lg font-black tracking-tight">Scheduling Logic</h4>
              <p className="text-indigo-200/70 text-sm font-medium leading-relaxed mt-2">
                Holiday periods defined here are automatically excluded from the capacity calculations of all teams. 
                Individual squad members can further refine their specific availability in the <span className="text-white font-black">Teams</span> tab.
              </p>
          </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
