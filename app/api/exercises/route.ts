import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const exerciseId = searchParams.get('exerciseId');
  
  try {
    if (exerciseId) {
      // Get saved settings for an exercise
      const settings = db.prepare(`
        SELECT * FROM equipment_settings 
        WHERE exercise_id = ?
        ORDER BY last_used DESC
      `).all(exerciseId);
      
      return NextResponse.json(settings);
    }
    
    if (type === 'cardio') {
      const equipment = db.prepare(`
        SELECT * FROM equipment WHERE type = 'cardio'
      `).all();
      return NextResponse.json(equipment);
    }
    
    // Get all exercises with equipment
    const exercises = db.prepare(`
      SELECT e.*, eq.name as equipment_name, eq.type as equipment_type
      FROM exercises e
      JOIN equipment eq ON e.equipment_id = eq.id
      ORDER BY e.muscle_group, e.name
    `).all();
    
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}
