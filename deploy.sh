#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — run from your LOCAL machine to deploy to nicmah.com
#
# First-time setup on server:
#   ssh -i $SSH_KEY $SERVER
#   git clone <your-github-repo-url> $REPO_DIR
#   cp $REPO_DIR/backend/.env.example $REPO_DIR/backend/.env
#   nano $REPO_DIR/backend/.env   ← fill in production values
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ── CONFIGURE THESE ──────────────────────────────────────────────────────────
SERVER="nicmahco@nicmah.com"
SSH_KEY="$HOME/.ssh/nicmah_deploy"
REPO_DIR="/home3/nicmahco/api.nicmah.com"
# Path cPanel prints when you click "Enter to virtual environment" in Python App:
VENV_ACTIVATE="/home3/nicmahco/virtualenv/api.nicmah.com/3.11/bin/activate"
FRONTEND_DEST="/home3/nicmahco/public_html"
# ─────────────────────────────────────────────────────────────────────────────

echo "──────────────────────────────────────"
echo " Deploying backend → api.nicmah.com"
echo "──────────────────────────────────────"

ssh -i "$SSH_KEY" "$SERVER" bash << ENDSSH
  set -e
  cd "$REPO_DIR"

  echo "[1/5] Pulling latest code..."
  git pull origin main

  echo "[2/5] Installing Python dependencies..."
  source "$VENV_ACTIVATE"
  pip install -r backend/requirements.txt --quiet

  echo "[3/5] Running migrations..."
  cd backend
  python manage.py migrate --settings=agrovet.settings.production

  echo "[4/5] Collecting static files..."
  python manage.py collectstatic --noinput --settings=agrovet.settings.production

  echo "[5/5] Restarting Passenger..."
  mkdir -p "$REPO_DIR/tmp"
  touch "$REPO_DIR/tmp/restart.txt"

  echo "Backend done!"
ENDSSH

echo ""
echo "──────────────────────────────────────"
echo " Building frontend"
echo "──────────────────────────────────────"

(cd app && npm run build)

echo ""
echo "──────────────────────────────────────"
echo " Uploading frontend → nicmah.com"
echo "──────────────────────────────────────"

scp -i "$SSH_KEY" -r app/dist/* "$SERVER:$FRONTEND_DEST/"

echo ""
echo "✓ Deploy complete!"
echo "  Backend:  https://api.nicmah.com"
echo "  Frontend: https://nicmah.com"
