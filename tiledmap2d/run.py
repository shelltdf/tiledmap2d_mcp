#!/usr/bin/env python3
"""预览生产构建：若尚无 dist/ 则先执行 npm run build。"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def main() -> int:
    if not DIST.is_dir():
        print("dist/ 不存在，正在执行 npm run build …", file=sys.stderr)
        rc = subprocess.call(
            ["npm", "run", "build"],
            cwd=ROOT,
            shell=(sys.platform == "win32"),
        )
        if rc != 0:
            return rc
    return subprocess.call(
        ["npm", "run", "preview", "--", "--host", "127.0.0.1"],
        cwd=ROOT,
        shell=(sys.platform == "win32"),
    )


if __name__ == "__main__":
    raise SystemExit(main())
