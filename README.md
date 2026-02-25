# Workout Tracker

A modern, Apple-style workout tracking application with persistent storage, designed for self-hosting on Coolify.

## Features

- 📅 **Weekly Calendar View** - Visual overview of your workout schedule
- 💪 **Strength Training** - Track exercises, sets, reps, and weights
- 🏃 **Cardio Tracking** - Log distance, time, and speed for cardio sessions
- 🔄 **Program Templates** - Set up recurring weekly workout schedules
- 💾 **Equipment Settings Memory** - Remembers your last used weights for each exercise
- 📊 **Calorie Estimation** - Automatic kcal calculation based on MET values
- 🎨 **Apple Glassmorphism UI** - Beautiful, modern interface
- 📱 **PWA Support** - Install as an app on iOS/Android
- 💿 **Persistent Storage** - SQLite database with Docker volume support

## Equipment Included

**Strength:**
- Chest Press Machine
- Leg Press Machine
- Lat Pulldown
- Leg Extension/Curl
- Shoulder Press Machine
- Cable Machine
- Smith Machine
- Dumbbells
- Barbell

**Cardio:**
- Treadmill
- Elliptical
- Stationary Bike
- Rowing Machine

## Pre-configured Program

The app comes with a sample weekly program:

- **Tuesday**: Full Body Strength (6 exercises)
- **Thursday**: Upper Body Focus (6 exercises)  
- **Saturday**: Legs & Core (5 exercises)

You can edit these templates and apply changes to all future sessions.

## Deployment on Coolify

### 1. Create a New Service

In Coolify, create a new service and select "Docker Image"

### 2. Build Configuration

- **Build Method**: Dockerfile
- **Dockerfile Location**: `Dockerfile`
- **Build Context**: `/`

### 3. Volume Configuration

Add a volume to persist your workout data:

```
/app/data → Your host path (e.g., /data/workout-tracker)
```

This ensures your workout history survives container restarts.

### 4. Port Configuration

- **Internal Port**: 3000
- **External Port**: Your choice (or let Coolify auto-assign)

### 5. Environment Variables

No environment variables required! The app works out of the box.

### 6. Deploy

Click "Deploy" and wait for the build to complete.

## Local Development

```bash
# Install dependencies
npm install

# Initialize database
npm run migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses SQLite with the following main tables:

- `equipment` - Gym equipment definitions
- `exercises` - Exercise library with muscle groups
- `equipment_settings` - User's saved settings per exercise
- `program_template` - Weekly recurring program
- `program_exercises` - Exercises in templates
- `sessions` - Completed workout sessions
- `session_exercises` - Exercises in sessions
- `exercise_sets` - Individual sets with weight/reps
- `cardio_sessions` - Cardio activity data

## Usage

### Adding a Workout

1. Click on any day in the calendar
2. If it's a program day, your exercises will be pre-loaded
3. Fill in weights and reps for each set
4. Check off completed sets
5. Add cardio if needed
6. Add notes about how you felt
7. Save the session

### Editing Your Program

1. Click "Edit Program" in the header
2. Select a day of the week
3. Add/remove exercises
4. Adjust sets and reps
5. Save to apply to all future occurrences

### Equipment Settings

The app automatically remembers your last used weight for each exercise and will suggest it next time.

## iOS Installation

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will now behave like a native iOS app

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS with custom glassmorphism
- **Deployment**: Docker + Coolify
- **PWA**: Installable on iOS/Android

## Calorie Calculation

Calories are estimated using MET (Metabolic Equivalent of Task) values:

- Strength training: ~5 MET (moderate intensity)
- Cardio: 5-10 MET depending on equipment and speed
- Formula: `MET × weight_kg × duration_hours`

Estimates assume 85kg body weight (configurable in `lib/calories.ts`).

## Customization

### Change User Weight

Edit `/lib/calories.ts` and update the default `weightKg` parameter to match your body weight.

### Add More Exercises

1. SSH into your Coolify instance
2. Access the database: `sqlite3 /path/to/data/workout.db`
3. Add equipment: `INSERT INTO equipment (name, type) VALUES ('New Machine', 'strength');`
4. Add exercise: `INSERT INTO exercises (name, equipment_id, muscle_group) VALUES ('New Exercise', 1, 'chest');`

Or modify `scripts/migrate.js` before first deployment.

## Support

For issues or feature requests, check the database directly or rebuild with updated migration script.

---

Built for tracking real gains 💪
