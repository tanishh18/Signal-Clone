import sys
from app.database import init_db, engine
from sqlalchemy import text

def run_init():
    print("Initializing Signal database schema...")
    init_db()
    
    # Verify tables
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = [row[0] for row in result]
        print(f"Created tables successfully: {', '.join(tables)}")

if __name__ == "__main__":
    run_init()
