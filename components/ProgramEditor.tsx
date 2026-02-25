'use client';

import { useState, useEffect } from 'react';

interface ProgramEditorProps {
  programs: any[];
  onBack: () => void;
}

export default function ProgramEditor({ programs, onBack }: ProgramEditorProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [editingProgram, setEditingProgram] = useState<any>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const res = await fetch('/api/exercises');
    const data = await res.json();
    setAllExercises(data);
  };

  const getProgramForDay = (dayIdx: number) => {
    return programs.find(p => p.day_of_week === dayIdx);
  };

  const startEditingDay = (dayIdx: number) => {
    const existing = getProgramForDay(dayIdx);
    if (existing) {
      setEditingProgram({ ...existing });
    } else {
      setEditingProgram({
        day_of_week: dayIdx,
        session_name: `${days[dayIdx]} Workout`,
        session_type: 'strength',
        exercises: []
      });
    }
    setSelectedDay(dayIdx);
  };

  const addExercise = (exerciseId: number) => {
    const exercise = allExercises.find(e => e.id === exerciseId);
    if (exercise && editingProgram) {
      setEditingProgram({
        ...editingProgram,
        exercises: [...editingProgram.exercises, {
          exercise_id: exerciseId,
          name: exercise.name,
          equipment_name: exercise.equipment_name,
          muscle_group: exercise.muscle_group,
          sets: 3,
          reps: 12
        }]
      });
    }
  };

  const removeExercise = (idx: number) => {
    const newExercises = editingProgram.exercises.filter((_: any, i: number) => i !== idx);
    setEditingProgram({ ...editingProgram, exercises: newExercises });
  };

  const updateExercise = (idx: number, field: string, value: any) => {
    const newExercises = [...editingProgram.exercises];
    newExercises[idx][field] = value;
    setEditingProgram({ ...editingProgram, exercises: newExercises });
  };

  const saveProgram = async () => {
    const method = editingProgram.id ? 'PUT' : 'POST';
    const res = await fetch('/api/program', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProgram)
    });

    if (res.ok) {
      setSelectedDay(null);
      setEditingProgram(null);
      onBack();
    }
  };

  if (selectedDay !== null && editingProgram) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setSelectedDay(null)} className="glass-button">
              ← Back
            </button>
            <h1 className="text-2xl font-bold">{days[selectedDay]}</h1>
            <button onClick={saveProgram} className="glass-button bg-blue-500/20 text-blue-600">
              Save
            </button>
          </div>

          {/* Session Name */}
          <div className="glass-card mb-6">
            <label className="block text-sm opacity-60 mb-2">Session Name</label>
            <input
              type="text"
              value={editingProgram.session_name}
              onChange={(e) => setEditingProgram({ ...editingProgram, session_name: e.target.value })}
              className="glass-input"
            />
          </div>

          {/* Exercises */}
          <div className="space-y-4 mb-6">
            {editingProgram.exercises.map((ex: any, idx: number) => (
              <div key={idx} className="glass-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold">{ex.name}</div>
                    <div className="text-sm opacity-60">{ex.muscle_group} • {ex.equipment_name}</div>
                  </div>
                  <button onClick={() => removeExercise(idx)} className="glass-button text-red-500">
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs opacity-60 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value))}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs opacity-60 block mb-1">Reps</label>
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExercise(idx, 'reps', parseInt(e.target.value))}
                      className="glass-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise */}
          <div className="glass-card">
            <label className="block text-sm opacity-60 mb-2">Add Exercise</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addExercise(parseInt(e.target.value));
                  e.target.value = '';
                }
              }}
              className="glass-input"
            >
              <option value="">Select an exercise...</option>
              {allExercises
                .filter(ex => !editingProgram.exercises.find((e: any) => e.exercise_id === ex.id))
                .map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.muscle_group})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="glass-button">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Weekly Program</h1>
          <div className="w-20"></div>
        </div>

        <div className="space-y-3">
          {days.map((day, idx) => {
            const program = getProgramForDay(idx);
            return (
              <button
                key={idx}
                onClick={() => startEditingDay(idx)}
                className="glass-card w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{day}</div>
                    {program ? (
                      <div className="text-sm opacity-60 mt-1">
                        {program.session_name} • {program.exercises?.length || 0} exercises
                      </div>
                    ) : (
                      <div className="text-sm opacity-40 mt-1">Rest day</div>
                    )}
                  </div>
                  <svg className="w-6 h-6 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
