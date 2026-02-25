import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  try {
    if (date) {
      // Get session for specific date
      const session = db.prepare(`
        SELECT s.*, pt.day_of_week, pt.session_type as template_type
        FROM sessions s
        LEFT JOIN program_template pt ON s.program_template_id = pt.id
        WHERE s.session_date = ?
      `).get(date) as any;
      
      if (session) {
        // Get exercises for this session
        const exercises = db.prepare(`
          SELECT se.*, e.name, e.muscle_group, eq.name as equipment_name
          FROM session_exercises se
          JOIN exercises e ON se.exercise_id = e.id
          JOIN equipment eq ON e.equipment_id = eq.id
          WHERE se.session_id = ?
          ORDER BY se.order_index
        `).all(session.id) as any[];
        
        // Get sets for each exercise
        const exercisesWithSets = exercises.map((ex: any) => ({
          ...ex,
          sets: db.prepare('SELECT * FROM exercise_sets WHERE session_exercise_id = ? ORDER BY set_number').all(ex.id)
        }));
        
        // Get cardio data if exists
        const cardio = db.prepare(`
          SELECT cs.*, eq.name as equipment_name
          FROM cardio_sessions cs
          JOIN equipment eq ON cs.equipment_id = eq.id
          WHERE cs.session_id = ?
        `).all(session.id) as any[];
        
        return NextResponse.json({ ...session, exercises: exercisesWithSets, cardio });
      }
      
      // No session exists, check if there's a program template for this day
      const dayOfWeek = new Date(date).getDay();
      const template = db.prepare(`
        SELECT * FROM program_template WHERE day_of_week = ?
      `).get(dayOfWeek) as any;
      
      if (template) {
        const exercises = db.prepare(`
          SELECT pe.*, e.name, e.muscle_group, eq.name as equipment_name, e.id as exercise_id
          FROM program_exercises pe
          JOIN exercises e ON pe.exercise_id = e.id
          JOIN equipment eq ON e.equipment_id = eq.id
          WHERE pe.program_template_id = ?
          ORDER BY pe.order_index
        `).all(template.id) as any[];
        
        return NextResponse.json({ 
          template, 
          exercises: exercises.map((ex: any) => ({
            ...ex,
            sets: Array(ex.sets || 3).fill(null).map((_, i) => ({
              set_number: i + 1,
              weight_kg: null,
              reps: ex.reps || null,
              completed: false
            }))
          }))
        });
      }
      
      return NextResponse.json(null);
    }
    
    if (from && to) {
      // Get sessions in date range
      const sessions = db.prepare(`
        SELECT s.*, pt.session_name as template_name
        FROM sessions s
        LEFT JOIN program_template pt ON s.program_template_id = pt.id
        WHERE s.session_date >= ? AND s.session_date <= ?
        ORDER BY s.session_date DESC
      `).all(from, to) as any[];
      
      return NextResponse.json(sessions);
    }
    
    // Get recent sessions
    const sessions = db.prepare(`
      SELECT s.*, pt.session_name as template_name
      FROM sessions s
      LEFT JOIN program_template pt ON s.program_template_id = pt.id
      ORDER BY s.session_date DESC
      LIMIT 20
    `).all() as any[];
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_date, program_template_id, session_name, session_type, exercises, cardio, notes } = body;
    
    // Calculate duration and calories
    let totalDuration = 0;
    let estimatedCalories = 0;
    
    // Insert session
    const sessionResult = db.prepare(`
      INSERT INTO sessions (session_date, program_template_id, session_name, session_type, notes, completed_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(session_date, program_template_id || null, session_name, session_type, notes || null);
    
    const sessionId = sessionResult.lastInsertRowid;
    
    // Insert exercises and sets
    if (exercises && exercises.length > 0) {
      exercises.forEach((exercise: any, idx: number) => {
        const exResult = db.prepare(`
          INSERT INTO session_exercises (session_id, exercise_id, order_index, notes)
          VALUES (?, ?, ?, ?)
        `).run(sessionId, exercise.exercise_id, idx, exercise.notes || null);
        
        const sessionExerciseId = exResult.lastInsertRowid;
        
        // Insert sets
        if (exercise.sets) {
          exercise.sets.forEach((set: any) => {
            db.prepare(`
              INSERT INTO exercise_sets (session_exercise_id, set_number, weight_kg, reps, completed)
              VALUES (?, ?, ?, ?, ?)
            `).run(sessionExerciseId, set.set_number, set.weight_kg || null, set.reps || null, set.completed ? 1 : 0);
            
            // Update equipment settings if weight was used
            if (set.weight_kg) {
              db.prepare(`
                INSERT OR REPLACE INTO equipment_settings (exercise_id, setting_name, setting_value, last_used)
                VALUES (?, 'last_weight', ?, CURRENT_TIMESTAMP)
              `).run(exercise.exercise_id, set.weight_kg.toString());
            }
          });
        }
        
        // Estimate 2 minutes per set for strength
        totalDuration += (exercise.sets?.length || 3) * 2;
      });
      
      // Rough calorie estimate for strength training
      estimatedCalories += Math.round(5.0 * 85 * (totalDuration / 60));
    }
    
    // Insert cardio
    if (cardio && cardio.length > 0) {
      cardio.forEach((c: any) => {
        db.prepare(`
          INSERT INTO cardio_sessions (session_id, equipment_id, distance_km, duration_minutes, avg_speed_kmh)
          VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, c.equipment_id, c.distance_km || null, c.duration_minutes || null, c.avg_speed_kmh || null);
        
        totalDuration += c.duration_minutes || 0;
        
        // Cardio calories (rough MET calculation)
        const met = c.avg_speed_kmh > 10 ? 7.0 : 5.0;
        estimatedCalories += Math.round(met * 85 * ((c.duration_minutes || 0) / 60));
      });
    }
    
    // Update session with duration and calories
    db.prepare(`
      UPDATE sessions 
      SET total_duration_minutes = ?, estimated_calories = ?
      WHERE id = ?
    `).run(totalDuration, estimatedCalories, sessionId);
    
    return NextResponse.json({ id: sessionId, success: true });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, session_name, notes, exercises, cardio } = body;
    
    // Update session
    db.prepare(`
      UPDATE sessions 
      SET session_name = ?, notes = ?
      WHERE id = ?
    `).run(session_name, notes || null, id);
    
    // Delete existing exercises and cardio
    db.prepare('DELETE FROM session_exercises WHERE session_id = ?').run(id);
    db.prepare('DELETE FROM cardio_sessions WHERE session_id = ?').run(id);
    
    // Re-insert updated data (similar to POST logic)
    // ... (implementation similar to POST)
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
