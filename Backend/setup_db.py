"""
setup_db.py — One-time database setup script.
Run: python setup_db.py
"""
import asyncio
import sys

async def main():
    # Step 1: Create the database if it doesn't exist
    try:
        import asyncpg
        # Connect to default 'postgres' database to create 'codeaudit'
        conn = await asyncpg.connect(
            host="localhost",
            port=5432,
            user="postgres",
            password="postgres",
            database="postgres",
        )
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'codeaudit'"
        )
        if not exists:
            await conn.execute("CREATE DATABASE codeaudit")
            print("[OK] Created database: codeaudit")
        else:
            print("[OK] Database 'codeaudit' already exists")
        await conn.close()
    except Exception as exc:
        print(f"[ERROR] Could not connect to PostgreSQL: {exc}")
        print("Make sure PostgreSQL is running on localhost:5432 with user=postgres password=postgres")
        sys.exit(1)

    # Step 2: Create all tables via SQLAlchemy
    try:
        from app.database import create_all_tables
        await create_all_tables()
        print("[OK] All database tables created successfully")
    except Exception as exc:
        print(f"[ERROR] Failed to create tables: {exc}")
        sys.exit(1)

    print("\n[DONE] Database setup complete! You can now start the API server.")
    print("   Run: uvicorn app.main:app --reload --port 8000")

if __name__ == "__main__":
    asyncio.run(main())
