
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserPlus, X, Calendar, ArrowRight, AlertCircle, Edit2, Check } from 'lucide-react';
import { Team, TeamMember, VacationRange } from '../types';

interface TeamManagerProps {
  teams: Team[];
  onAddTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
  onUpdateTeam: (team: Team) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ teams, onAddTeam, onDeleteTeam, onUpdateTeam }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [tempMembers, setTempMembers] = useState<TeamMember[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  
  // PTO Modal State
  const [ptoModal, setPtoModal] = useState<{teamId: string, memberId: string} | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const addTempMember = () => {
    if (!memberInput.trim()) return;
    setTempMembers(prev => [...prev, { id: crypto.randomUUID(), name: memberInput.trim(), holidays: [] }]);
    setMemberInput('');
  };

  const handleCreateOrUpdateTeam = () => {
    if (!newTeamName.trim() || tempMembers.length === 0) return;

    if (editingTeamId) {
      const existingTeam = teams.find(t => t.id === editingTeamId);
      if (existingTeam) {
        onUpdateTeam({
          ...existingTeam,
          name: newTeamName.trim(),
          members: tempMembers
        });
      }
      setEditingTeamId(null);
    } else {
      onAddTeam({ 
        id: crypto.randomUUID(), 
        name: newTeamName.trim(), 
        members: tempMembers 
      });
    }
    
    setNewTeamName('');
    setTempMembers([]);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setNewTeamName(team.name);
    setTempMembers([...team.members]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setNewTeamName('');
    setTempMembers([]);
  };

  const activeTeam = teams.find(t => t.id === ptoModal?.teamId);
  const activeMember = activeTeam?.members.find(m => m.id === ptoModal?.memberId);

  const addHolidayRange = () => {
    if (!ptoModal || !startDate || !endDate || !activeTeam) return;
    
    const updatedTeam = {
      ...activeTeam,
      members: activeTeam.members.map(m => {
        if (m.id !== ptoModal.memberId) return m;
        return {
          ...m,
          holidays: [...m.holidays, { id: crypto.randomUUID(), startDate, endDate }]
        };
      })
    };
    onUpdateTeam(updatedTeam);
    setStartDate('');
    setEndDate('');
  };

  const removeHolidayRange = (rangeId: string) => {
    if (!ptoModal || !activeTeam) return;
    const updatedTeam = {
      ...activeTeam,
      members: activeTeam.members.map(m => {
        if (m.id !== ptoModal.memberId) return m;
        return {
          ...m,
          holidays: m.holidays.filter(h => h.id !== rangeId)
        };
      })
    };
    onUpdateTeam(updatedTeam);
  };

  const handleOpenPtoModal = (teamId: string, memberId: string) => {
    setPtoModal({ teamId, memberId });
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* New/Edit Team Form */}
      <div className={`bg-white p-8 rounded-3xl shadow-sm border h-fit sticky top-24 transition-all duration-300 ${editingTeamId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            {editingTeamId ? <Edit2 className="text-indigo-500" size={20} /> : <Plus className="text-indigo-500" />} 
            {editingTeamId ? 'Edit Team' : 'New Team'}
          </span>
          {editingTeamId && (
            <button onClick={cancelEdit} className="text-[10px] text-slate-400 uppercase font-black hover:text-slate-600">Cancel</button>
          )}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Team Name</label>
            <input 
              type="text" 
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-400 placeholder:text-slate-400"
              placeholder="e.g. Apollo, Core, Infra..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Team Roster</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTempMember()}
                className="flex-1 px-4 py-4 rounded-2xl bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-400 placeholder:text-slate-400"
                placeholder="Member Name"
              />
              <button onClick={addTempMember} className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl hover:bg-indigo-100 transition-colors">
                <UserPlus size={20} />
              </button>
            </div>
          </div>
          <div className="min-h-[100px] border-2 border-dashed border-slate-100 rounded-2xl p-4 flex flex-wrap gap-2">
            {tempMembers.length === 0 && (
              <p className="text-slate-400 text-sm italic w-full text-center py-4">Add members above</p>
            )}
            {tempMembers.map(m => (
              <span key={m.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                {m.name}
                <button onClick={() => setTempMembers(p => p.filter(x => x.id !== m.id))} className="hover:text-red-500"><X size={14} /></button>
              </span>
            ))}
          </div>
          <button 
            disabled={!newTeamName.trim() || tempMembers.length === 0}
            onClick={handleCreateOrUpdateTeam}
            className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-4 uppercase text-xs tracking-widest flex items-center justify-center gap-2 ${editingTeamId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} disabled:opacity-50`}
          >
            {editingTeamId ? <><Check size={18} /> Update Team</> : 'Deploy Team'}
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="md:col-span-2 space-y-6">
        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 text-slate-400">
            <Users size={60} className="mb-4 opacity-10" />
            <p className="font-bold text-lg">No teams active</p>
          </div>
        )}
        {teams.map(team => (
          <div key={team.id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all group ${editingTeamId === team.id ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{team.name}</h3>
                <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mt-1">
                  Availability Management
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditTeam(team)}
                  className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                  title="Edit Team Roster"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDeleteTeam(team.id)} 
                  className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                  title="Delete Team"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team.members.map(member => (
                <div key={member.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/member">
                  <span className="font-bold text-slate-700">{member.name}</span>
                  <button 
                    onClick={() => handleOpenPtoModal(team.id, member.id)}
                    className="flex flex-col items-end gap-1 group/pto"
                  >
                    <div className="flex items-center gap-1.5 text-indigo-500 group-hover/pto:text-indigo-700 transition-colors">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Manage PTO</span>
                    </div>
                    {member.holidays.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                        {member.holidays.length} Range{member.holidays.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PTO Management Global Modal */}
      {ptoModal && activeMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeMember.name}'s Schedule</h3>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{activeTeam?.name} Team Member</p>
              </div>
              <button 
                onClick={() => setPtoModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <label className="block text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest text-center">New Vacation Range</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1 w-full">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-sm p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    />
                  </div>
                  <ArrowRight size={20} className="text-indigo-200 rotate-90 sm:rotate-0" />
                  <div className="flex-1 w-full">
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-sm p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    />
                  </div>
                </div>
                <button 
                  onClick={addHolidayRange}
                  disabled={!startDate || !endDate}
                  className="w-full mt-4 bg-indigo-600 text-white font-black py-3 rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                >
                  Confirm PTO Period
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Calendar size={12} /> Current Active Ranges
                </h4>
                {activeMember.holidays.length === 0 ? (
                  <div className="text-center py-8 text-slate-300 flex flex-col items-center gap-2 border-2 border-dashed border-slate-100 rounded-3xl">
                    <AlertCircle size={24} />
                    <p className="text-xs font-bold">No vacations scheduled</p>
                  </div>
                ) : (
                  activeMember.holidays.map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-center">
                          <span className="block text-[8px] font-black text-slate-400 uppercase leading-none mb-1">From</span>
                          <span className="text-xs font-black text-slate-700">{h.startDate}</span>
                        </div>
                        <ArrowRight size={14} className="text-slate-300" />
                        <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-center">
                          <span className="block text-[8px] font-black text-slate-400 uppercase leading-none mb-1">To</span>
                          <span className="text-xs font-black text-slate-700">{h.endDate}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeHolidayRange(h.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="Delete Range"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 mt-6">
              <button 
                onClick={() => setPtoModal(null)}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-colors"
              >
                Close & Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;