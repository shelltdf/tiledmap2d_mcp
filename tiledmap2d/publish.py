#!/usr/bin/env python3
"""发布：执行 build，可分发产物位于 dist/"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    code = subprocess.call(
        ["npm", "run", "build"],
        cwd=ROOT,
        shell=(sys.platform == "win32"),
    )
    if code != 0:
        return code
    dist = ROOT / "dist"
    print(f"OK: static output -> {dist}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
