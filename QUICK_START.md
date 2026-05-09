# Quick Start Guide

Get your engineering dashboard running in 5 minutes!

## Prerequisites

✅ **Node.js 14+** installed
- Check: `node --version`
- Download: https://nodejs.org/

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd engineering-dashboard-app
npm install
```

### Step 2: Start Server (1 min)

```bash
npm start
```

You should see:
```
🚀 Engineering Dashboard App running at http://localhost:3000
📊 Visit the app and upload CSV files to generate your dashboard
```

### Step 3: Open Browser (instantly)

```
http://localhost:3000
```

### Step 4: Upload CSV Files (1-2 min)

1. **Get CSV files from Shortcut:**
   - In Shortcut, go to Stories > Iterations
   - Select an iteration and click Export as CSV
   - Do this for 2-3 recent sprints

2. **Upload to Dashboard:**
   - Drag and drop the CSV files onto the page
   - Or click to select files manually
   - Click "Generate Dashboard"

### Step 5: View Results (instantly)

Your dashboard will generate with:
- ✅ Interactive charts (doughnut, pie, scatter, bar, line)
- ✅ Team metrics and analytics
- ✅ Epic and sprint breakdown
- ✅ Owner performance analysis

## Download Reports

After generation, download:
- 📊 Interactive HTML Dashboard
- 📄 Markdown Analysis Report
- 📈 Sprint Velocity CSV
- 🎯 Epic Velocity CSV
- 👥 Owner Performance CSV

## Next Steps

- **Share dashboard** with your team
- **Download reports** for further analysis
- **Upload new CSVs** to regenerate with fresh data
- **Review recommendations** in the markdown report

## Troubleshooting

### Port 3000 already in use?
```bash
PORT=3001 npm start
```

### npm not found?
Reinstall Node.js from https://nodejs.org/

### CSV file won't upload?
- Ensure it's a `.csv` file
- Try a smaller file first
- Check browser console for errors

## Common CSV Column Names

The app auto-detects:
- `name` / `story_name` / `title`
- `type` / `story_type`
- `epic` / `epic_name` / `epic_label`
- `owners` / `owner` / `assignee`
- `started_at` / `start_date`
- `completed_at` / `completion_date` / `end_date`
- `is_completed` / `completed` / `status`

If your CSV has different names, it will still work—just make sure the required columns are present.

## Tips

1. **Best results:** Export 4-8 sprints for trend analysis
2. **Check format:** Download a test CSV first to see the structure
3. **Team sharing:** You can run this app and share the URL with your team
4. **Data privacy:** All processing happens locally, nothing sent to external services

## Need Help?

1. Check the full **README.md** for detailed docs
2. Review **CSV Format Requirements** section
3. Try with a single small CSV file first

---

You're all set! 🚀

For detailed documentation, see [README.md](./README.md)
