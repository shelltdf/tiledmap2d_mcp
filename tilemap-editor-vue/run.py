#!/usr/bin/env python3
"""预览生产构建（需先 build 生成 dist/）"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> int:
    return subprocess.call(
        ["npm", "run", "preview", "--", "--host", "127.0.0.1"],
        cwd=ROOT,
        shell=(sys.platform == "win32"),
    )


if __name__ == "__main__":
    raise SystemExit(main())
