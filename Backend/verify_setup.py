"""
verify_setup.py — Pre-flight check for all services.
Run: python verify_setup.py
"""
import asyncio
import sys


async def check_postgres():
    try:
        import asyncpg
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host="localhost", port=5432,
                user="postgres", password="postgres", database="codeaudit"
            ),
            timeout=5.0
        )
        await conn.execute("SELECT 1")
        await conn.close()
        return True, "Connected OK"
    except asyncio.TimeoutError:
        return False, "Connection timed out — is PostgreSQL running?"
    except Exception as exc:
        return False, str(exc)


async def check_redis():
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
        await asyncio.wait_for(r.ping(), timeout=3.0)
        await r.aclose()
        return True, "Connected OK"
    except asyncio.TimeoutError:
        return False, "Connection timed out — is Redis running?"
    except Exception as exc:
        return False, str(exc)


def check_python_tools():
    import subprocess
    tools = {
        "radon": ["radon", "--version"],
        "pylint": ["pylint", "--version"],
    }
    results = {}
    for name, cmd in tools.items():
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            results[name] = (True, r.stdout.strip().split("\n")[0] or r.stderr.strip().split("\n")[0])
        except FileNotFoundError:
            results[name] = (False, "Not found — run: pip install " + name)
        except Exception as exc:
            results[name] = (False, str(exc))
    return results


def check_node_tools():
    import subprocess
    tools = {"node": ["node", "--version"], "npx": ["npx", "--version"]}
    results = {}
    for name, cmd in tools.items():
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            ver = (r.stdout or r.stderr).strip().split("\n")[0]
            results[name] = (True, ver)
        except FileNotFoundError:
            results[name] = (False, "Not found — install Node.js 18+")
        except Exception as exc:
            results[name] = (False, str(exc))
    # Lighthouse is optional
    try:
        r = subprocess.run(["lighthouse", "--version"], capture_output=True, text=True, timeout=5)
        ver = (r.stdout or r.stderr).strip().split("\n")[0]
        results["lighthouse"] = (True, ver)
    except FileNotFoundError:
        results["lighthouse"] = (False, "Not installed (optional) — npm install -g lighthouse")
    return results


async def main():
    print("=" * 55)
    print("  Developer Career Intelligence System - Pre-flight")
    print("=" * 55)

    all_ok = True

    ok, msg = await check_postgres()
    mark = "[OK]" if ok else "[FAIL]"
    print(f"\n{mark} PostgreSQL: {msg}")
    if not ok:
        all_ok = False
        print("   -> Run: python setup_db.py")

    ok, msg = await check_redis()
    mark = "[OK]" if ok else "[FAIL]"
    print(f"{mark} Redis:      {msg}")
    if not ok:
        all_ok = False
        print("   -> Start Redis: redis-server")

    print("\nPython Analysis Tools:")
    for name, (ok, msg) in check_python_tools().items():
        mark = "[OK]" if ok else "[WARN]"
        print(f"  {mark} {name}: {msg}")

    print("\nNode.js Tools:")
    for name, (ok, msg) in check_node_tools().items():
        mark = "[OK]" if ok else "[WARN]"
        print(f"  {mark} {name}: {msg}")

    print("\n" + "=" * 55)
    if all_ok:
        print("[READY] All critical services OK.")
        print("\nStart commands:")
        print("  Terminal 1: uvicorn app.main:app --reload --port 8000")
        print("  Terminal 2: celery -A app.workers.celery_app:celery_app worker --loglevel=info --pool=solo")
        print("  Terminal 3: cd ../Frontend && npm run dev")
    else:
        print("[NOT READY] Fix the issues above, then re-run this script.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
