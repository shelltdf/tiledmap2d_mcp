#!/usr/bin/env python3
"""预览生产构建：若尚无 dist/ 则先执行 npm run build。"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
NODE_MODULES = ROOT / "node_modules"
SHELL_WIN = sys.platform == "win32"


def _vite_installed() -> bool:
    """本地 devDependencies 中的 vite 是否已安装到 node_modules。"""
    if not NODE_MODULES.is_dir():
        return False
    if (NODE_MODULES / "vite" / "package.json").is_file():
        return True
    if SHELL_WIN and (NODE_MODULES / ".bin" / "vite.cmd").is_file():
        return True
    if (NODE_MODULES / ".bin" / "vite").is_file():
        return True
    return False


def ensure_npm_deps() -> int:
    """若未安装依赖则先 npm install，避免 npm run build 找不到 vite。"""
    if _vite_installed():
        return 0
    print("node_modules 中未找到 vite，正在执行 npm install …", file=sys.stderr)
    return subprocess.call(
        ["npm", "install"],
        cwd=ROOT,
        shell=SHELL_WIN,
    )


def main() -> int:
    rc = ensure_npm_deps()
    if rc != 0:
        return rc
    if not DIST.is_dir():
        print("dist/ 不存在，正在执行 npm run build …", file=sys.stderr)
        rc = subprocess.call(
            ["npm", "run", "build"],
            cwd=ROOT,
            shell=SHELL_WIN,
        )
        if rc != 0:
            return rc
    return subprocess.call(
        ["npm", "run", "preview", "--", "--host", "127.0.0.1"],
        cwd=ROOT,
        shell=SHELL_WIN,
    )


if __name__ == "__main__":
    raise SystemExit(main())
