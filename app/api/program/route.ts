import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const programs = db.prepare(`
      SELECT * FROM program_template ORDER BY day_of_week
    `).all();
    
    const programsWithExercises = programs.map(program => ({
      ...program,
      exercises: db.prepare(`
        SELECT pe.*, e.name, e.muscle_group, eq.name as equipment_name
        FROM program_exercises pe
        JOIN exercises e ON pe.exercise_id = e.id
        JOIN equipment eq ON e.equipment_id = eq.id
        WHERE pe.program_template_id = ?
        ORDER BY pe.order_index
      `).all(program.id)
    }));
    
    return NextResponse.json(programsWithExercises);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { day_of_week, session_name, session_type, exercises } = body;
    
    const result = db.prepare(`
      INSERT INTO program_template (day_of_week, session_name, session_type)
      VALUES (?, ?, ?)
    `).run(day_of_week, session_name, session_type);
    
    const programId = result.lastInsertRowid;
    
    if (exercises && exercises.length > 0) {
      exercises.forEach((ex: any, idx: number) => {
        db.prepare(`
          INSERT INTO program_exercises (program_template_id, exercise_id, sets, reps, order_index)
          VALUES (?, ?, ?, ?, ?)
        `).run(programId, ex.exercise_id, ex.sets || 3, ex.reps || 10, idx);
      });
    }
    
    return NextResponse.json({ id: programId, success: true });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, session_name, session_type, exercises, apply_to_future } = body;
    
    // Update template
    db.prepare(`
      UPDATE program_template 
      SET session_name = ?, session_type = ?
      WHERE id = ?
    `).run(session_name, session_type, id);
    
    // Delete and re-insert exercises
    db.prepare('DELETE FROM program_exercises WHERE program_template_id = ?').run(id);
    
    if (exercises && exercises.length > 0) {
      exercises.forEach((ex: any, idx: number) => {
        db.prepare(`
          INSERT INTO program_exercises (program_template_id, exercise_id, sets, reps, order_index)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, ex.exercise_id, ex.sets || 3, ex.reps || 10, idx);
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}
