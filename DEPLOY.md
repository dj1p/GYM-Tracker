# Coolify Deployment Guide - Workout Tracker

## Quick Start

1. **Prepare the code**: Push the entire `/home/claude/workout-tracker` directory to a Git repository (GitHub, GitLab, etc.)

2. **In Coolify**:
   - Create a new "Application"
   - Choose "Public Repository" or connect your Git
   - Enter repository URL
   - Select Dockerfile build method

3. **Configuration**:
   ```
   Build Pack: Dockerfile
   Dockerfile Location: Dockerfile
   Port: 3000
   ```

4. **Volume** (IMPORTANT - for data persistence):
   ```
   Source (container): /app/data
   Destination (host): /your/path/workout-tracker-data
   ```

5. Click "Deploy"

## Alternative: Deploy from Local Directory

If you don't want to use Git:

1. ZIP the workout-tracker directory
2. In Coolify, create a new application
3. Choose "Upload Archive"
4. Upload the ZIP
5. Configure as above

## Post-Deployment

### Access the App
- Your app will be available at the domain Coolify assigns
- Or configure a custom domain in Coolify settings

### Add to iPhone Home Screen
1. Open the app URL in Safari
2. Tap Share button
3. "Add to Home Screen"
4. App now acts like a native app

### Backup Your Data
Your workout data is stored in SQLite at the volume path you specified:
```bash
# Backup command
cp /your/path/workout-tracker-data/workout.db ~/backup-$(date +%Y%m%d).db
```

### View Database (Optional)
```bash
# SSH into Coolify host
cd /your/path/workout-tracker-data
sqlite3 workout.db

# Some useful queries:
.tables
SELECT * FROM sessions ORDER BY session_date DESC LIMIT 10;
SELECT * FROM program_template;
```

## Troubleshooting

### App won't start
- Check Coolify logs for build errors
- Ensure volume is properly mounted
- Verify port 3000 is exposed

### Database empty after restart
- Volume not properly configured
- Check `/app/data` is mapped to host path
- Re-run migration if needed (run `npm run migrate` in container)

### Can't save workouts
- Check browser console for errors
- Verify database file has write permissions
- Ensure volume mount is read-write (not read-only)

## Environment Variables (Optional)

None required by default, but you can add:

```env
NODE_ENV=production
PORT=3000
```

## Updating the App

1. Pull latest code
2. In Coolify, click "Redeploy"
3. Data in volume persists automatically

## Advanced: Custom Equipment

To add equipment before deployment, edit `scripts/migrate.js`:

```javascript
// Add to equipmentData array:
['Your Custom Machine', 'strength'],

// Add to exercisesData array:
['Your Custom Exercise', EQUIPMENT_ID, 'muscle_group'],
```

Then deploy fresh or delete database and restart.

---

Questions? Check Coolify docs or the README.md
