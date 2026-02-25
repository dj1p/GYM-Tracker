const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'workout.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Equipment definitions
  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('strength', 'cardio')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Exercise templates (what exercises exist)
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    equipment_id INTEGER NOT NULL,
    muscle_group TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  );

  -- User's saved equipment settings for each exercise
  CREATE TABLE IF NOT EXISTS equipment_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    setting_name TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    UNIQUE(exercise_id, setting_name)
  );

  -- Weekly program template (recurring schedule)
  CREATE TABLE IF NOT EXISTS program_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6),
    session_name TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK(session_type IN ('strength', 'cardio', 'mixed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Exercises in the program template
  CREATE TABLE IF NOT EXISTS program_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_template_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sets INTEGER,
    reps INTEGER,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (program_template_id) REFERENCES program_template(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  -- Actual workout sessions
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date DATE NOT NULL,
    program_template_id INTEGER,
    session_name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    total_duration_minutes INTEGER,
    estimated_calories INTEGER,
    notes TEXT,
    completed_at DATETIME,
    FOREIGN KEY (program_template_id) REFERENCES program_template(id)
  );

  -- Cardio session details
  CREATE TABLE IF NOT EXISTS cardio_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    distance_km REAL,
    duration_minutes INTEGER,
    avg_speed_kmh REAL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
  );

  -- Strength exercises performed in a session
  CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  -- Individual sets within an exercise
  CREATE TABLE IF NOT EXISTS exercise_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE
  );
`);

// Insert gym equipment
const equipmentData = [
  // Strength equipment
  ['Chest Press Machine', 'strength'],
  ['Leg Press Machine', 'strength'],
  ['Lat Pulldown', 'strength'],
  ['Leg Extension', 'strength'],
  ['Leg Curl', 'strength'],
  ['Shoulder Press Machine', 'strength'],
  ['Cable Machine', 'strength'],
  ['Smith Machine', 'strength'],
  ['Dumbbells', 'strength'],
  ['Barbell', 'strength'],
  
  // Cardio equipment
  ['Treadmill', 'cardio'],
  ['Elliptical', 'cardio'],
  ['Stationary Bike', 'cardio'],
  ['Rowing Machine', 'cardio']
];

const insertEquipment = db.prepare('INSERT OR IGNORE INTO equipment (name, type) VALUES (?, ?)');
equipmentData.forEach(([name, type]) => insertEquipment.run(name, type));

// Insert common exercises
const exercisesData = [
  // Chest
  ['Chest Press', 1, 'chest'],
  ['Incline Chest Press', 1, 'chest'],
  
  // Legs
  ['Leg Press', 2, 'legs'],
  ['Leg Extension', 4, 'legs'],
  ['Leg Curl', 5, 'legs'],
  ['Squats (Smith)', 8, 'legs'],
  
  // Back
  ['Lat Pulldown', 3, 'back'],
  ['Seated Row', 7, 'back'],
  
  // Shoulders
  ['Shoulder Press', 6, 'shoulders'],
  ['Lateral Raises', 9, 'shoulders'],
  
  // Arms
  ['Bicep Curls', 9, 'arms'],
  ['Tricep Pushdown', 7, 'arms'],
  
  // Core
  ['Cable Crunches', 7, 'core']
];

const insertExercise = db.prepare('INSERT OR IGNORE INTO exercises (name, equipment_id, muscle_group) VALUES (?, ?, ?)');
exercisesData.forEach(([name, equipId, muscle]) => insertExercise.run(name, equipId, muscle));

// Set up Tor's weekly program based on calendar
const programData = [
  // Tuesday - Full Body Strength
  {
    day: 2, // Tuesday
    name: 'Full Body Strength',
    type: 'strength',
    exercises: [
      { exercise: 'Leg Press', sets: 3, reps: 12 },
      { exercise: 'Chest Press', sets: 3, reps: 12 },
      { exercise: 'Lat Pulldown', sets: 3, reps: 12 },
      { exercise: 'Shoulder Press', sets: 3, reps: 10 },
      { exercise: 'Leg Extension', sets: 3, reps: 12 },
      { exercise: 'Bicep Curls', sets: 3, reps: 12 }
    ]
  },
  // Thursday - Upper Body Focus
  {
    day: 4, // Thursday
    name: 'Upper Body Focus',
    type: 'strength',
    exercises: [
      { exercise: 'Chest Press', sets: 4, reps: 10 },
      { exercise: 'Lat Pulldown', sets: 4, reps: 10 },
      { exercise: 'Shoulder Press', sets: 3, reps: 12 },
      { exercise: 'Seated Row', sets: 3, reps: 12 },
      { exercise: 'Lateral Raises', sets: 3, reps: 15 },
      { exercise: 'Tricep Pushdown', sets: 3, reps: 12 }
    ]
  },
  // Saturday - Legs + Core
  {
    day: 6, // Saturday
    name: 'Legs & Core',
    type: 'strength',
    exercises: [
      { exercise: 'Squats (Smith)', sets: 4, reps: 10 },
      { exercise: 'Leg Press', sets: 4, reps: 12 },
      { exercise: 'Leg Curl', sets: 3, reps: 12 },
      { exercise: 'Leg Extension', sets: 3, reps: 12 },
      { exercise: 'Cable Crunches', sets: 3, reps: 15 }
    ]
  }
];

const insertProgram = db.prepare('INSERT INTO program_template (day_of_week, session_name, session_type) VALUES (?, ?, ?)');
const insertProgramExercise = db.prepare('INSERT INTO program_exercises (program_template_id, exercise_id, sets, reps, order_index) VALUES (?, ?, ?, ?, ?)');
const getExerciseId = db.prepare('SELECT id FROM exercises WHERE name = ?');

programData.forEach(program => {
  const result = insertProgram.run(program.day, program.name, program.type);
  const programId = result.lastInsertRowid;
  
  program.exercises.forEach((ex, idx) => {
    const exercise = getExerciseId.get(ex.exercise);
    if (exercise) {
      insertProgramExercise.run(programId, exercise.id, ex.sets, ex.reps, idx);
    }
  });
});

console.log('Database initialized successfully!');
db.close();
