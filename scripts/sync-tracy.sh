#!/usr/bin/env bash
# sync-tracy.sh
# Tự động đồng bộ branch `tracy` với remote `origin` trên GitHub
# (pein1625/media-forge).
#
# Quy trình:
#   1. Kiểm tra đang ở đúng branch `tracy` (hoặc worktree của nó).
#   2. Fetch + rebase pull từ origin/tracy để có code mới nhất.
#   3. Nếu có file thay đổi, stage & commit với message bạn truyền vào
#      (hoặc message mặc định nếu không truyền).
#   4. Push branch `tracy` lên origin.
#
# Cách dùng:
#   ./scripts/sync-tracy.sh                       # dùng commit message mặc định
#   ./scripts/sync-tracy.sh "feat: thêm X, Y"     # dùng message bạn cung cấp
#
# Ghi chú: script sẽ DỪNG (exit non-zero) nếu gặp conflict khi rebase
# hoặc push bị từ chối — bạn cần xử lý thủ công rồi chạy lại.

set -euo pipefail

BRANCH="tracy"
REMOTE="origin"
DEFAULT_MSG="chore(tracy): sync work-in-progress $(date +'%Y-%m-%d %H:%M:%S')"
COMMIT_MSG="${1:-$DEFAULT_MSG}"

# Đi vào thư mục chứa script (gốc repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "✗ Bạn đang ở branch '$CURRENT_BRANCH', script này cần branch '$BRANCH'."
  echo "  → Chạy: git switch $BRANCH   (hoặc vào worktree chứa branch tracy)"
  exit 1
fi

echo "▸ Đang trên branch: $CURRENT_BRANCH"
echo "▸ Fetch từ $REMOTE..."
git fetch "$REMOTE" "$BRANCH"

echo "▸ Pull (rebase) origin/$BRANCH..."
# --autostash: tự stash thay đổi chưa commit trước khi rebase, rồi pop lại
git pull --rebase --autostash "$REMOTE" "$BRANCH"

# Có gì mới để commit không?
if [[ -n "$(git status --porcelain)" ]]; then
  echo "▸ Có thay đổi — staging & commit..."
  git add -A
  git commit -m "$COMMIT_MSG"
else
  echo "▸ Không có thay đổi mới để commit."
fi

echo "▸ Push lên $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH"

echo "✓ Đồng bộ xong branch '$BRANCH'."
