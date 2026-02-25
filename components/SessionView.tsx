'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface SessionViewProps {
  date: Date;
  onBack: () => void;
  onSave: () => void;
}

export default function SessionView({ date, onBack, onSave }: SessionViewProps) {
  const [sessionData, setSessionData] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [cardio, setCardio] = useState<any[]>([]);
  const [cardioEquipment, setCardioEquipment] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'strength' | 'cardio'>('strength');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
    fetchCardioEquipment();
  }, [date]);

  const fetchSession = async () => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const res = await fetch(`/api/sessions?date=${dateStr}`);
    const data = await res.json();
    
    if (data && data.id) {
      // Existing session
      setSessionData(data);
      setExercises(data.exercises || []);
      setCardio(data.cardio || []);
      setNotes(data.notes || '');
    } else if (data && data.template) {
      // Template exists, create new session from template
      setSessionData(data.template);
      setExercises(data.exercises || []);
    }
    setLoading(false);
  };

  const fetchCardioEquipment = async () => {
    const res = await fetch('/api/exercises?type=cardio');
    const data = await res.json();
    setCardioEquipment(data);
  };

  const updateSet = (exerciseIdx: number, setIdx: number, field: string, value: any) => {
    const newExercises = [...exercises];
    newExercises[exerciseIdx].sets[setIdx][field] = value;
    setExercises(newExercises);
  };

  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIdx].sets[setIdx].completed = !newExercises[exerciseIdx].sets[setIdx].completed;
    setExercises(newExercises);
  };

  const addCardio = () => {
    setCardio([...cardio, {
      equipment_id: cardioEquipment[0]?.id || 1,
      distance_km: 0,
      duration_minutes: 0,
      avg_speed_kmh: 0
    }]);
  };

  const updateCardio = (idx: number, field: string, value: any) => {
    const newCardio = [...cardio];
    newCardio[idx][field] = value;
    
    // Auto-calculate speed if distance and duration are set
    if (field === 'distance_km' || field === 'duration_minutes') {
      const distance = field === 'distance_km' ? value : newCardio[idx].distance_km;
      const duration = field === 'duration_minutes' ? value : newCardio[idx].duration_minutes;
      if (distance && duration) {
        newCardio[idx].avg_speed_kmh = (distance / (duration / 60)).toFixed(1);
      }
    }
    
    setCardio(newCardio);
  };

  const removeCardio = (idx: number) => {
    setCardio(cardio.filter((_, i) => i !== idx));
  };

  const saveSession = async () => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const payload = {
      session_date: dateStr,
      program_template_id: sessionData?.id || null,
      session_name: sessionData?.session_name || 'Workout',
      session_type: sessionData?.session_type || (cardio.length > 0 ? 'mixed' : 'strength'),
      exercises: exercises.map(ex => ({
        exercise_id: ex.exercise_id || ex.id,
        sets: ex.sets,
        notes: ex.notes
      })),
      cardio: cardio,
      notes: notes
    };

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      onSave();
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">Loading...</div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="glass-button mb-6">
            ← Back
          </button>
          <div className="glass-card text-center py-12">
            <h2 className="text-xl mb-4">No workout scheduled</h2>
            <p className="opacity-60 mb-6">This is a rest day</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="glass-button">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{format(date, 'EEEE, MMM d')}</h1>
          <button onClick={saveSession} className="glass-button bg-blue-500/20 text-blue-600 dark:text-blue-400">
            Save
          </button>
        </div>

        {/* Session Info */}
        <div className="glass-card mb-6">
          <h2 className="text-2xl font-bold mb-2">{sessionData.session_name}</h2>
          <div className="text-sm opacity-60">{sessionData.session_type}</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('strength')}
            className={`glass-button flex-1 ${activeTab === 'strength' ? 'bg-blue-500/20' : ''}`}
          >
            Strength ({exercises.length})
          </button>
          <button
            onClick={() => setActiveTab('cardio')}
            className={`glass-button flex-1 ${activeTab === 'cardio' ? 'bg-blue-500/20' : ''}`}
          >
            Cardio ({cardio.length})
          </button>
        </div>

        {/* Strength Exercises */}
        {activeTab === 'strength' && (
          <div className="space-y-4">
            {exercises.map((exercise, exIdx) => (
              <div key={exIdx} className="glass-card">
                <div className="font-bold text-lg mb-1">{exercise.name}</div>
                <div className="text-sm opacity-60 mb-4">{exercise.muscle_group} • {exercise.equipment_name}</div>
                
                <div className="space-y-2">
                  {exercise.sets?.map((set: any, setIdx: number) => (
                    <div key={setIdx} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-8 h-8 rounded-full glass-button flex items-center justify-center ${
                          set.completed ? 'bg-green-500/20 text-green-600' : ''
                        }`}
                      >
                        {set.completed ? '✓' : setIdx + 1}
                      </button>
                      
                      <input
                        type="number"
                        placeholder="kg"
                        value={set.weight_kg || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight_kg', parseFloat(e.target.value) || 0)}
                        className="glass-input flex-1"
                      />
                      
                      <span className="opacity-40">×</span>
                      
                      <input
                        type="number"
                        placeholder="reps"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                        className="glass-input flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cardio */}
        {activeTab === 'cardio' && (
          <div className="space-y-4">
            {cardio.map((c, idx) => (
              <div key={idx} className="glass-card">
                <div className="flex items-center justify-between mb-4">
                  <select
                    value={c.equipment_id}
                    onChange={(e) => updateCardio(idx, 'equipment_id', parseInt(e.target.value))}
                    className="glass-input flex-1 mr-2"
                  >
                    {cardioEquipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removeCardio(idx)} className="glass-button text-red-500">
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs opacity-60 block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={c.distance_km || ''}
                      onChange={(e) => updateCardio(idx, 'distance_km', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs opacity-60 block mb-1">Time (min)</label>
                    <input
                      type="number"
                      value={c.duration_minutes || ''}
                      onChange={(e) => updateCardio(idx, 'duration_minutes', parseInt(e.target.value) || 0)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs opacity-60 block mb-1">Avg Speed (km/h)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={c.avg_speed_kmh || ''}
                      readOnly
                      className="glass-input opacity-60"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button onClick={addCardio} className="glass-button w-full">
              + Add Cardio
            </button>
          </div>
        )}

        {/* Notes */}
        <div className="glass-card mt-6">
          <label className="block text-sm opacity-60 mb-2">Session Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did you feel? Any observations?"
            className="glass-input min-h-[100px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
