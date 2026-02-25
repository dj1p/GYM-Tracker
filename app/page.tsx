'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import SessionView from '@/components/SessionView';
import ProgramEditor from '@/components/ProgramEditor';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [sessions, setSessions] = useState<any[]>([]);
  const [view, setView] = useState<'calendar' | 'session' | 'program'>('calendar');
  const [programs, setPrograms] = useState<any[]>([]);
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays = days.map((_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchSessions();
    fetchPrograms();
  }, [weekStart]);

  const fetchSessions = async () => {
    const from = format(weekDays[0], 'yyyy-MM-dd');
    const to = format(weekDays[6], 'yyyy-MM-dd');
    const res = await fetch(`/api/sessions?from=${from}&to=${to}`);
    const data = await res.json();
    setSessions(data);
  };

  const fetchPrograms = async () => {
    const res = await fetch('/api/program');
    const data = await res.json();
    setPrograms(data);
  };

  const getSessionForDate = (date: Date) => {
    return sessions.find(s => isSameDay(parseISO(s.session_date), date));
  };

  const getProgramForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return programs.find(p => p.day_of_week === dayOfWeek);
  };

  const previousWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const today = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedDate(new Date());
  };

  if (view === 'session') {
    return <SessionView date={selectedDate} onBack={() => setView('calendar')} onSave={fetchSessions} />;
  }

  if (view === 'program') {
    return <ProgramEditor programs={programs} onBack={() => { setView('calendar'); fetchPrograms(); }} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Workout Tracker</h1>
            <button 
              onClick={() => setView('program')}
              className="glass-button text-sm"
            >
              Edit Program
            </button>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={previousWeek} className="glass-button">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button onClick={today} className="glass-button">
              Today
            </button>
            
            <button onClick={nextWeek} className="glass-button">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((date, idx) => {
            const session = getSessionForDate(date);
            const program = getProgramForDate(date);
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);
            
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(date);
                  setView('session');
                }}
                className={`glass-card min-h-[120px] flex flex-col transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="text-sm opacity-60 mb-2">{days[idx]}</div>
                <div className="text-2xl font-bold mb-2">{format(date, 'd')}</div>
                
                {session ? (
                  <div className="mt-auto">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      ✓ {session.session_name}
                    </div>
                    {session.estimated_calories && (
                      <div className="text-xs opacity-60 mt-1">
                        {session.estimated_calories} kcal
                      </div>
                    )}
                  </div>
                ) : program ? (
                  <div className="mt-auto">
                    <div className="text-xs opacity-60">
                      {program.session_name}
                    </div>
                    <div className="text-xs opacity-40 mt-1">
                      {program.exercises?.length || 0} exercises
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto text-xs opacity-40">Rest day</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats Overview */}
        <div className="glass-card mt-6">
          <h2 className="text-xl font-bold mb-4">This Week</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {sessions.length}
              </div>
              <div className="text-sm opacity-60">Workouts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sessions.reduce((sum, s) => sum + (s.total_duration_minutes || 0), 0)} min
              </div>
              <div className="text-sm opacity-60">Total Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {sessions.reduce((sum, s) => sum + (s.estimated_calories || 0), 0)} kcal
              </div>
              <div className="text-sm opacity-60">Calories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
