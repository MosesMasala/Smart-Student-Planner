# Smart Student Study Planner — Setup & Usage Guide

A full-stack academic task manager built with:
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL

---

## STEP 1 — Install Node.js

Download and install Node.js (LTS version) from https://nodejs.org

After installing, open your terminal and confirm it worked:
```
node -v
npm -v
```
Both commands should print a version number (e.g. v20.x.x).

---

## STEP 2 — Install PostgreSQL

Download from https://www.postgresql.org/download/ and run the installer.

**During installation:**
- When it asks for a password, choose something simple like `postgres`
- Write this password down — you will need it in Step 4
- Leave the port as 5432 (the default)

After installing, open **pgAdmin** or **SQL Shell (psql)** from your Start menu to confirm PostgreSQL is running.

---

## STEP 3 — Create the database

Open **SQL Shell (psql)** (search for it in your Start menu).

When it prompts you, press Enter to accept all defaults, then type your password.

Then run this command:
```sql
CREATE DATABASE student_planner;
```

Type `\q` and press Enter to exit.

> The app will automatically create all the tables inside this database when you start it for the first time.

---

## STEP 4 — Configure the environment file

Open the file `backend/.env` in VS Code or any text editor.

Find this line:
```
DB_PASSWORD=YOUR_PASSWORD_HERE
```
Replace `YOUR_PASSWORD_HERE` with the PostgreSQL password you set in Step 2.

Example:
```
DB_PASSWORD=postgres
```

Save the file.

---

## STEP 5 — Install backend dependencies

Open a terminal and navigate into the `backend` folder:

```bash
cd smart-student-planner/backend
npm install
```

This downloads all required libraries. It may take 1–2 minutes the first time.

---

## STEP 6 — Start the application

Still inside the `backend` folder, run:

```bash
npm start
```

You should see:
```
[DB] Tables ready.
[Server] Running at http://localhost:5000
```

> If you see a database connection error, double-check your password in the .env file.

---

## STEP 7 — Open the app in your browser

Go to: **http://localhost:5000**

You will be taken to the login page automatically.

---

## HOW TO USE THE APP

### Creating your account
1. Click **"Create one"** on the login page
2. Enter your full name, email, and a password (minimum 6 characters)
3. Click **Create Account** — you will be taken straight to your dashboard

### Dashboard
The dashboard is your home base. It shows:
- **Stats row** — total courses, pending assignments, upcoming sessions, and unread reminders at a glance
- **Due Soon** — any assignments due within the next 3 days, highlighted with urgency colour coding
- **Upcoming Sessions** — study sessions scheduled for the next 3 days
- **Reminders** — automatic notifications generated from your due-soon assignments and sessions. Reminders refresh every time you open the dashboard. Click **"Mark read"** to dismiss individual ones, or **"Mark all read"** to clear them all.

### Courses (📖)
1. Click **"+ Add Course"** to open the form
2. Enter the course name (required) and an optional description
3. Click **Save Course**
4. To edit a course, click the ✏️ pencil icon on its card
5. To delete, click the 🗑️ bin icon — a confirmation dialog appears before anything is deleted

### Assignments (📝)
1. Click **"+ Add Assignment"** to open the form
2. Fill in: title (required), course, priority (High / Medium / Low), due date, status, and optional description
3. **Urgency ribbons** on the left edge of each row tell you at a glance how urgent an assignment is:
   - 🔴 Red border = due today or overdue
   - 🟡 Amber border = due tomorrow
   - 🔵 Blue border = due this week
4. **Filter your list** using the status pills (All / Pending / In Progress / Completed) and the course and priority dropdowns
5. **Change status quickly** using the action button on each row — one click cycles Pending → In Progress → Completed → Pending
6. To edit all details, click ✏️. To delete, click 🗑️.

### Study Sessions (🕐)
1. Click **"+ Schedule Session"** to open the form
2. Enter: title (required), date (required), optional start/end times, course, and notes
3. Sessions are **grouped by date** — today and tomorrow are labelled specially
4. Click **"✓ Done"** when you complete a session — it moves to the Completed filter
5. Click **"Reopen"** to move a session back to upcoming if needed
6. Use the filter pills (Upcoming / Completed / All) and course dropdown to find sessions

### Logging out
Click the **⬡ icon** at the bottom of the sidebar next to your name.

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| `npm install` fails | Make sure Node.js is installed: run `node -v` |
| Database connection error | Check DB_PASSWORD in backend/.env matches your PostgreSQL password |
| "Port already in use" error | Another app is using port 5000. Change `PORT=5001` in .env and go to http://localhost:5001 |
| Page shows blank / errors in console | Make sure the server is running (`npm start`) before opening the browser |
| Tables not created | Delete the database and recreate it: `DROP DATABASE student_planner; CREATE DATABASE student_planner;` then restart |

---

## PROJECT STRUCTURE

```
smart-student-planner/
│
├── backend/                  ← Node.js + Express API
│   ├── config/db.js          ← PostgreSQL connection + table setup
│   ├── middleware/
│   │   ├── auth.js           ← JWT token verification
│   │   └── errorHandler.js   ← Central error handling
│   ├── models/               ← Database query functions
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── StudySession.js
│   │   └── Notification.js
│   ├── routes/               ← API endpoints
│   │   ├── auth.js           ← POST /api/auth/register, /login
│   │   ├── courses.js        ← GET/POST/PUT/DELETE /api/courses
│   │   ├── assignments.js    ← GET/POST/PUT/DELETE /api/assignments
│   │   ├── studySessions.js  ← GET/POST/PUT/DELETE /api/study-sessions
│   │   ├── notifications.js  ← GET/POST/PATCH /api/notifications
│   │   └── dashboard.js      ← GET /api/dashboard/summary
│   ├── utils/validate.js     ← Input validation helpers
│   ├── server.js             ← Entry point
│   ├── .env                  ← Your configuration (edit this)
│   └── package.json
│
└── frontend/                 ← HTML, CSS, JavaScript
    ├── index.html            ← Redirects to login or dashboard
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── courses.html
    ├── assignments.html
    ├── sessions.html
    ├── css/style.css         ← All styles
    └── js/
        ├── api.js            ← Shared: fetch helper, toasts, sidebar setup
        ├── auth.js           ← Login and register form logic
        ├── dashboard.js
        ├── courses.js
        ├── assignments.js
        └── sessions.js
```
