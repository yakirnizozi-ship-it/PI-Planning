
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, Flag, Info } from 'lucide-react';
import { Team, Holiday } from '../types';

interface TeamCalendarProps {
  teams: Team[];
  globalHolidays: Holiday[];
}

const TeamCalendar: React.FC<TeamCalendarProps> = ({ teams, globalHolidays }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper: check if a specific date falls within any defined ranges
  const getOverlappingRanges = (date: string, ranges: {startDate: string, endDate: string, metadata: any}[]) => {
    return ranges.filter(range => {
      const d = new Date(date);
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      return d >= start && d <= end;
    });
  };

  const vacationData = useMemo(() => {
    const list: {startDate: string, endDate: string, metadata: {memberName: string, teamName: string}}[] = [];
    teams.forEach(team => {
      team.members.forEach(member => {
        member.holidays.forEach(range => {
          list.push({
            startDate: range.startDate,
            endDate: range.endDate,
            metadata: { memberName: member.name, teamName: team.name }
          });
        });
      });
    });
    return list;
  }, [teams]);

  const holidayData = useMemo(() => {
    return globalHolidays.map(h => ({
      startDate: h.startDate,
      endDate: h.endDate,
      metadata: { name: h.name }
    }));
  }, [globalHolidays]);

  const days = useMemo(() => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const result = [];

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      result.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const overlappingVacations = getOverlappingRanges(dateStr, vacationData);
      const overlappingHolidays = getOverlappingRanges(dateStr, holidayData);

      result.push({
        day: d,
        dateStr,
        vacations: overlappingVacations.map(v => v.metadata),
        holidayName: overlappingHolidays.length > 0 ? overlappingHolidays[0].metadata.name : null
      });
    }

    return result;
  }, [year, month, vacationData, holidayData]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{monthName} {year}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ART Availability Calendar</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Today
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-xl transition-all text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[140px]">
          {days.map((dayData, idx) => {
            if (!dayData) return <div key={`empty-${idx}`} className="bg-slate-50/30 border-r border-b border-slate-100 last:border-r-0" />;
            
            const isToday = new Date().toISOString().split('T')[0] === dayData.dateStr;
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div 
                key={dayData.dateStr} 
                className={`p-3 border-r border-b border-slate-100 last:border-r-0 transition-colors flex flex-col group ${isWeekend ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {dayData.day}
                  </span>
                  {dayData.holidayName && (
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase max-w-[80px] truncate" title={dayData.holidayName}>
                      <Flag size={10} /> {dayData.holidayName}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar-thin">
                  {dayData.vacations.map((v, vIdx) => (
                    <div 
                      key={`${dayData.dateStr}-v-${vIdx}`}
                      className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[9px] font-bold border border-indigo-100/50 flex flex-col shadow-sm"
                    >
                      <span className="truncate">{v.memberName}</span>
                      <span className="text-[8px] opacity-60 uppercase tracking-tighter truncate">{v.teamName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Teams</p>
            <p className="text-xl font-black text-slate-800">{teams.length} Squads</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
            <Info size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ART PTO Overlaps</p>
            <p className="text-xl font-black text-slate-800">
              {days.reduce((acc, d) => acc + (d?.vacations.length || 0), 0)} Instances
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
            <Flag size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configured Holidays</p>
            <p className="text-xl font-black text-slate-800">{globalHolidays.length} Periods</p>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default TeamCalendar;
