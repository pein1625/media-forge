#!/usr/bin/env bash
# predeploy.sh
# Chạy TRƯỚC khi triển khai để đảm bảo code local khớp với origin/tracy.
#
# Quy trình:
#   1. Bắt buộc đang ở branch `tracy`.
#   2. Từ chối chạy nếu working tree còn thay đổi chưa commit
#      (để tránh deploy code nửa vời). Dùng sync-tracy.sh để commit trước.
#   3. Fetch origin.
#   4. Fast-forward pull origin/tracy — fail nếu phải merge/rebase
#      (nghĩa là local đã phân nhánh với remote → cần xử lý tay).
#   5. In SHA commit cuối cùng để bạn đối chiếu với môi trường deploy.
#
# Cách dùng:
#   ./scripts/predeploy.sh

set -euo pipefail

BRANCH="tracy"
REMOTE="origin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "✗ Cần ở branch '$BRANCH' trước khi deploy (đang ở '$CURRENT_BRANCH')."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ Working tree còn thay đổi chưa commit. Chạy scripts/sync-tracy.sh trước."
  git status --short
  exit 1
fi

echo "▸ Fetch $REMOTE..."
git fetch "$REMOTE" "$BRANCH"

echo "▸ Fast-forward pull origin/$BRANCH..."
# --ff-only: chỉ fast-forward; nếu local đã có commit khác với remote
# và không fast-forward được thì dừng lại để tránh merge ngoài ý muốn.
git pull --ff-only "$REMOTE" "$BRANCH"

SHA="$(git rev-parse --short HEAD)"
echo "✓ Local đã sync với $REMOTE/$BRANCH — HEAD=$SHA"
echo "  Sẵn sàng triển khai."
