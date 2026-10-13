"""
main.py
-------
Entry point for CDRMS. Run this file to launch the app:

    python main.py

Requires only the Python standard library (tkinter + sqlite3), so no
pip install is needed. A "cdrms.db" SQLite file is created automatically
in this folder on first run.
"""

from app import CdrmsApp

if __name__ == "__main__":
    app = CdrmsApp()
    app.mainloop()
