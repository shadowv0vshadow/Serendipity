import sqlite3
import os

def test_connection():
    db_path = 'rym.db'
    print(f"CWD: {os.getcwd()}")
    print(f"DB Path: {os.path.abspath(db_path)}")
    print(f"File exists: {os.path.exists(db_path)}")
    
    try:
        # Test Read-Only Connection (as used in get_db_connection)
        print("\nTesting Read-Only Connection...")
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT count(*) FROM users")
        print(f"Users count: {c.fetchone()[0]}")
        conn.close()
        print("Read-Only Connection: SUCCESS")
    except Exception as e:
        print(f"Read-Only Connection: FAILED - {e}")

    try:
        # Test Write Connection (as used in get_write_db_connection)
        print("\nTesting Write Connection...")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT count(*) FROM users")
        print(f"Users count: {c.fetchone()[0]}")
        conn.close()
        print("Write Connection: SUCCESS")
    except Exception as e:
        print(f"Write Connection: FAILED - {e}")

if __name__ == "__main__":
    test_connection()
