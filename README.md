# Engineering Dashboard Generator

A Node.js application that generates interactive engineering health dashboards and detailed reports from Shortcut CSV exports.

## Features

✨ **Interactive Dashboard**
- Real-time metrics (total tickets, completion rate, cycle time, bug closure)
- Multiple chart types: doughnut, pie, scatter plots, bar charts, line charts
- Scatter plot showing cycle time trends by team member with quartile analysis
- Epic completion pie chart with percentages
- Sprint velocity tracking
- Responsive, modern UI built with Chart.js

📊 **Comprehensive Reports**
- **Analysis Report** (Markdown) - Executive summary, trends, recommendations
- **Sprint Velocity CSV** - Created, completed, completion rate by sprint
- **Epic Velocity CSV** - Breakdown of work by epic
- **Owner Performance CSV** - Team member stats (cycle time, tickets, completion)
- **Ticket Type Analysis CSV** - Distribution of features, bugs, chores

🚀 **Easy to Use**
- Simple drag-and-drop CSV upload interface
- Support for multiple CSV files in one upload
- Instant report generation
- Download reports with one click

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 14 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version` and `npm --version`

- **Shortcut CSV Exports**
  - Export your sprint iterations from Shortcut as CSV files
  - Each file should contain columns like: `name`, `type`, `epic`, `owners`, `started_at`, `completed_at`, `is_completed`

## Installation

### 1. Clone or Download the App

```bash
git clone <repository-url>
cd engineering-dashboard-app
```

Or if you have the files locally, navigate to the `engineering-dashboard-app` directory.

### 2. Install Dependencies

```bash
npm install
```

This will install:
- **express** - Web server framework
- **multer** - File upload handling
- **csv-parse** - CSV parsing library

## Running the App Locally

### Start the Development Server

```bash
npm start
```

You should see:
```
🚀 Engineering Dashboard App running at http://localhost:3000
📊 Visit the app and upload CSV files to generate your dashboard
```

### Access the App

Open your browser and go to:
```
http://localhost:3000
```

## Usage

### 1. Prepare Your CSV Files

Export your Shortcut sprint iterations as CSV files:
- **From Shortcut:** Stories > Iterations > Select iteration > Export as CSV
- Recommended: Export multiple iterations to get comprehensive analytics
- Ensure CSV includes these columns (or similar):
  - `id`, `name`, `type`, `epic`, `owners`
  - `created_at`, `started_at`, `completed_at`
  - `is_completed`, `iteration`, `iteration_id`

### 2. Upload CSV Files

1. Go to http://localhost:3000
2. **Drag and drop** CSV files onto the upload area, or click to select files
3. Multiple files can be selected at once
4. Click "Generate Dashboard" to process

### 3. View Dashboard

The generated dashboard includes:

#### Metrics Cards
- **Total Tickets** - Overall volume
- **Completion Rate** - % of work finished
- **Avg Cycle Time** - Average days from started to completed
- **Bug Closure Rate** - % of bugs closed
- Plus additional cards for median cycle time, bugs, etc.

#### Charts

**Story Type Distribution (Doughnut)**
- Breakdown of Features, Bugs, and Chores
- Shows relative effort allocation

**Epic Completion (Pie Chart)** - NEW
- Raw count and percentage of completed tickets per epic
- Interactive tooltips show `Epic: X tickets (Y%)`

**Cycle Time Trends (Scatter Plot)** - NEW
- Each dot represents one team member's cycle time in a sprint
- Trend lines show:
  - **Mean** (solid line) - Average across all team members
  - **Median** (dashed) - Middle value
  - **Q1 & Q3** (dotted) - Lower and upper quartiles
- Useful for identifying bottlenecks and consistency

**Sprint Velocity (Bar Chart)**
- Created vs Completed tickets per sprint
- Visual comparison of planning accuracy

**Bug Trends (Line Chart)**
- Bugs created per sprint
- Monitor quality trends over time

#### Data Tables

**Velocity by Epic**
- Epic name, created, completed, completion rate
- Sort to identify struggling epics

**Velocity by Sprint**
- Sprint performance metrics
- Plan for consistent velocity

**Top Owners by Cycle Time**
- Team member names, average cycle time, ticket count
- Identify performance patterns

### 4. Download Reports

After generation, you can download:

- **📄 Analysis Report** (.md)
  - Markdown format, readable in any text editor or GitHub
  - Executive summary, metrics, insights, recommendations
  - Includes trend analysis and quality metrics

- **📈 Sprint Velocity CSV**
  - Import into Excel/Sheets for further analysis
  - Track velocity trends over time

- **🎯 Epic Velocity CSV**
  - Breakdown by epic
  - Identify which areas need attention

- **👥 Owner Performance CSV**
  - Team member metrics
  - Cycle time, tickets, completion rates

- **🏷️ Type Analysis CSV**
  - Feature/Bug/Chore split
  - Understand work distribution

## Example Workflow

```bash
# 1. Start the server
npm start

# 2. Open browser to http://localhost:3000

# 3. Download 3-4 CSV files from Shortcut for recent sprints

# 4. Drag and drop them onto the page

# 5. Click "Generate Dashboard"

# 6. View the interactive dashboard

# 7. Download reports for sharing with your team
```

## CSV Format Requirements

Your CSV file should have these columns (Shortcut default export):

| Column | Example | Required |
|--------|---------|----------|
| `id` | 1234 | Yes |
| `name` | "Fix login bug" | Yes |
| `type` | feature, bug, chore | Yes |
| `epic` | "Aurora Onboarding" | No |
| `owners` | john@example.com | No |
| `started_at` | 2026-01-14 10:30 | Yes |
| `completed_at` | 2026-01-18 15:45 | Yes |
| `is_completed` | TRUE | Yes |
| `iteration` | "Sprint 1" | Helpful |
| `iteration_id` | 10414 | Helpful |

**Note:** The analyzer is flexible with column names. It will auto-detect common Shortcut export formats.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
PORT=3001 npm start
```
Then visit `http://localhost:3001`

### Files Not Uploading
- Ensure files are `.csv` format
- Check file names don't have special characters
- Clear browser cache if issues persist

### Missing Columns in CSV
The app will handle missing columns gracefully:
- Unassigned work will be grouped as "(Unassigned)"
- Sprints without iteration data will be named from filename
- Cycle time will be calculated only for tickets with both start and end dates

### Slow Processing
For large CSV files (>5000 tickets):
- Split into multiple files per sprint
- Run the upload in batches if needed

## Project Structure

```
engineering-dashboard-app/
├── src/
│   ├── server.js                 # Express server & routes
│   ├── analyzer.js               # CSV parsing & analysis
│   ├── dashboard-generator.js    # HTML dashboard creation
│   └── report-generator.js       # Report & CSV generation
├── public/
│   ├── index.html               # Upload interface
│   └── generated/               # Generated files (auto-created)
│       ├── dashboard.html       # Generated dashboard
│       └── reports/             # Generated reports
├── data/
│   └── uploads/                 # Temporary upload storage
├── package.json                  # Dependencies
└── README.md                      # This file
```

## Development

### Enable Auto-Reload (nodemon)

```bash
npm install -g nodemon
npm run dev
```

The server will auto-restart when you modify files.

### Modify Dashboard Styling

Edit the `<style>` section in `dashboard-generator.js` to customize colors, fonts, or layout.

### Add New Metrics

1. **Analyzer** (`analyzer.js`): Add calculation logic
2. **Dashboard** (`dashboard-generator.js`): Add metric card HTML
3. **Reports** (`report-generator.js`): Add to report output

## Performance Notes

- Dashboard loads in browser with Chart.js (client-side rendering)
- Max file upload: 20 CSV files at once
- Each file: recommended <10,000 rows
- Processing time: typically <2 seconds for 5-10 sprint exports

## API Endpoints

### POST `/api/upload`
Upload CSV files and generate dashboard
- **Body:** multipart/form-data with `csvFiles` array
- **Returns:** JSON with dashboard URL and report links

### GET `/api/download/:type`
Download a generated report
- **Parameters:**
  - `analysis` - Markdown analysis report
  - `sprint-velocity` - Sprint metrics CSV
  - `epic-velocity` - Epic metrics CSV
  - `owner-performance` - Team member metrics CSV
  - `type-analysis` - Ticket type breakdown CSV

### GET `/generated/*`
Access generated dashboard and reports (static files)

## Tips for Best Results

1. **Export Multiple Sprints**
   - Include at least 3-4 sprints for trend analysis
   - Minimum 1-2 sprints for baseline

2. **Keep CSV Fields Consistent**
   - Same column names and types across files
   - Use standard Shortcut export format

3. **Review Recommendations**
   - Markdown report includes actionable insights
   - Share with team and discuss trends

4. **Regular Regeneration**
   - Run dashboard weekly after sprint completion
   - Track metrics over time

## Limitations

- Works offline after app starts (files generated locally)
- Dashboard filters on client-side only (no backend filtering)
- No database persistence (recreate by re-uploading CSVs)
- All data processed in memory (fine for typical team sizes)

## Future Enhancements

Possible additions:
- Burndown charts
- Velocity forecasting
- Team member skill mapping
- Blocker analysis & categorization
- Integration with Shortcut API
- Database storage of historical data
- Email report distribution

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify CSV format matches requirements
3. Check browser console for error messages (`F12` → Console tab)
4. Try with a smaller CSV file first to isolate issues

## Credits

Built with:
- **Express.js** - Web framework
- **Chart.js** - Data visualization
- **Multer** - File upload handling
- **csv-parse** - CSV parsing

---

**Happy analyzing! 📊**
