# Workout Tracker - Complete Setup Guide

## What You're Getting

A fully functional, modern workout tracking web app with:

✅ **Apple-style glassmorphism UI** - Beautiful, clean interface  
✅ **Weekly calendar view** - See your whole week at a glance  
✅ **Your pre-configured program** - Tuesday, Thursday, Saturday workouts ready to go  
✅ **Smart equipment memory** - Remembers your last weights for each exercise  
✅ **Cardio tracking** - Distance, time, speed for elliptical, treadmill, bike, rowing  
✅ **Calorie estimation** - Automatic kcal calculation  
✅ **Persistent storage** - SQLite database, your data never disappears  
✅ **PWA support** - Install on iPhone like a native app  
✅ **Self-hosted** - Complete control, runs on your Coolify instance  

## Your Pre-loaded Workouts

### Tuesday - Full Body Strength
1. Leg Press (3×12)
2. Chest Press (3×12)
3. Lat Pulldown (3×12)
4. Shoulder Press (3×10)
5. Leg Extension (3×12)
6. Bicep Curls (3×12)

### Thursday - Upper Body Focus
1. Chest Press (4×10)
2. Lat Pulldown (4×10)
3. Shoulder Press (3×12)
4. Seated Row (3×12)
5. Lateral Raises (3×15)
6. Tricep Pushdown (3×12)

### Saturday - Legs & Core
1. Squats (Smith) (4×10)
2. Leg Press (4×12)
3. Leg Curl (3×12)
4. Leg Extension (3×12)
5. Cable Crunches (3×15)

You can edit these anytime in the app!

## Deployment Steps

### 1. Upload to Git (Recommended)

```bash
# From your local machine or server
cd /path/to/workout-tracker
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### 2. Deploy on Coolify

1. **Create New Application**
   - Type: Public Repository / Private Repository
   - Git URL: Your repository URL
   - Branch: main

2. **Build Configuration**
   - Build Pack: Dockerfile
   - Dockerfile Path: `Dockerfile`
   - Build Context: `/`

3. **Port Configuration**
   - Port: 3000
   - Publicly Accessible: Yes

4. **Volume Configuration** ⚠️ CRITICAL
   ```
   Container Path: /app/data
   Host Path: /data/workout-tracker
   ```
   This ensures your workout history survives restarts!

5. **Click Deploy**

Wait 3-5 minutes for the build to complete.

### 3. Access Your App

Coolify will give you a URL like: `https://workout-tracker.your-domain.com`

## iPhone Installation

1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Workout" or whatever you like
5. Tap "Add"

Now it's on your home screen and opens like a native app (no Safari UI)!

## How to Use

### Recording a Workout

1. **Open the app** - You'll see the weekly calendar
2. **Tap on today** (or any workout day)
3. **Your exercises appear** pre-loaded from your program
4. **For each set:**
   - Enter the weight in kg
   - Enter reps completed
   - Tap the number button to mark it complete ✓
5. **Add cardio** if you did any:
   - Switch to "Cardio" tab
   - Tap "+ Add Cardio"
   - Select equipment
   - Enter distance and time (speed auto-calculates)
6. **Add notes** if you want
7. **Tap Save**

The app will:
- Remember the weights you used for next time
- Calculate estimated calories burned
- Update the calendar with a ✓

### Editing Your Program

1. **Tap "Edit Program"** in the header
2. **Select a day** (e.g., Tuesday)
3. **Add/remove exercises** using the dropdown
4. **Adjust sets and reps**
5. **Save**

Changes apply to all future sessions for that day!

### Viewing Progress

The calendar shows:
- ✓ = Completed workout (blue)
- Scheduled workout (gray)
- Estimated calories for completed sessions

Bottom stats show weekly totals.

## Data Backup

Your data is in SQLite at: `/data/workout-tracker/workout.db`

To backup:
```bash
# On your Coolify host
cp /data/workout-tracker/workout.db ~/workout-backup-$(date +%Y%m%d).db
```

Set up a cron job for automatic backups:
```bash
# Add to crontab
0 2 * * * cp /data/workout-tracker/workout.db ~/backups/workout-$(date +\%Y\%m\%d).db
```

## Customization

### Change Your Weight (for calorie calculations)

Edit `lib/calories.ts` line 35:
```typescript
weightKg: number = 85  // Change to your weight
```

Rebuild and redeploy.

### Add New Exercises

Before first deployment, edit `scripts/migrate.js`:

```javascript
// Add equipment
['Your Machine Name', 'strength'],

// Add exercise (name, equipment_id, muscle_group)
['Your Exercise', 1, 'chest'],
```

After deployment, you need to access the database directly or rebuild.

### Change Program

Just use the "Edit Program" button in the app - no code changes needed!

## Troubleshooting

### "No workout scheduled" on a program day
- Check that the day matches (JavaScript Sunday=0, Monday=1, etc.)
- Program might not have saved - re-edit and save

### Workouts disappear after restart
- Volume not mounted correctly
- Check Coolify volume configuration
- Ensure `/app/data` → `/data/workout-tracker` mapping exists

### Can't save workouts
- Check browser console (F12) for errors
- Verify volume has write permissions
- Try: `chmod 777 /data/workout-tracker` (on host)

### App looks broken on iPhone
- Use Safari, not Chrome
- Add to Home Screen for best experience
- Check if glassmorphism is supported (iOS 15+)

## Tech Details

**Stack:**
- Next.js 14 (React)
- SQLite database
- Tailwind CSS
- Docker

**Database Tables:**
- sessions (your completed workouts)
- session_exercises (exercises in each session)
- exercise_sets (individual sets with weight/reps)
- cardio_sessions (cardio activities)
- equipment_settings (remembered weights)
- program_template (your weekly schedule)

**Calorie Formula:**
```
Calories = MET × Weight(kg) × Duration(hours)
```
- Strength: ~5 MET
- Cardio: 5-10 MET depending on intensity

## Updates

To update the app:
1. Pull latest code changes
2. In Coolify, click "Redeploy"
3. Data persists automatically

## Support

Check these files:
- `README.md` - Full documentation
- `DEPLOY.md` - Deployment details
- Database: `sqlite3 /data/workout-tracker/workout.db`

## What's Next?

Consider adding:
- Progress photos (would need S3/storage)
- Body measurements tracking
- More detailed analytics/charts
- Export to CSV
- Social sharing

For now, just track your workouts and focus on progressive overload!

---

Built specifically for your Bangkok gym sessions 🏋️
