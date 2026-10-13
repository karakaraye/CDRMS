# CDRMS — CGPA & Degree Result Management System

A simple desktop app (Tkinter + SQLite) for managing students, courses
and results, and computing CGPA.

## Files

- `main.py` — entry point, run this to launch the app
- `app.py` — main window (`CdrmsApp`): student list, details, results, CGPA
- `dialogs.py` — pop-up forms: `StudentDialog`, `CourseManagerDialog`, `ResultDialog`
- `database.py` — SQLite schema + all data access / CGPA logic
- `cdrms.db` — created automatically on first run (not included)

## Requirements

Python 3.9+ with the standard library only (`tkinter`, `sqlite3`) —
no `pip install` needed.

## Run it

```
python main.py
```

## Grading scale (edit in `database.py` if your department uses a different one)

| Score  | Grade | Point |
|--------|-------|-------|
| 70–100 | A     | 5.0   |
| 60–69  | B     | 4.0   |
| 50–59  | C     | 3.0   |
| 45–49  | D     | 2.0   |
| 40–44  | E     | 1.0   |
| 0–39   | F     | 0.0   |

## Notes

This codebase was reconstructed to match the structure and field
names found in a previously compiled `Cdrms.exe` build (Tkinter GUI,
SQLite DB with `students` / `courses` / `results` tables). It's a
clean re-implementation, not an exact byte-for-byte recovery of the
original source — check the logic against your original requirements
before relying on it for real records.

## Packaging as a Windows .exe again

```
pip install pyinstaller
pyinstaller --onefile --windowed --name Cdrms main.py
```
