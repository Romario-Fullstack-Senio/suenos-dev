#!/bin/bash
# ============================================================
# Server Setup Script — suenos-dev
# Run this ONCE on your VPS to set up the deployment
# Usage: ssh user@server 'bash -s' < setup-server.sh
# ============================================================
set -e

DEPLOY_DIR=~/deploy/suenos-dev

echo "=== Setting up suenos-dev deployment ==="

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker installed. You may need to log out and back in."
fi

# 2. Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
  echo "Installing Docker Compose plugin..."
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# 3. Create deploy directory
echo "Creating deploy directory..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# 4. Copy docker-compose.prod.yml
echo "Copying docker-compose.prod.yml..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/infra/docker-compose.prod.yml" ]; then
  cp "$SCRIPT_DIR/infra/docker-compose.prod.yml" "$DEPLOY_DIR/docker-compose.yml"
else
  echo "ERROR: docker-compose.prod.yml not found at $SCRIPT_DIR/infra/"
  echo "Make sure you're running this from the repo root or copy the file manually."
  exit 1
fi

# 5. Copy Caddyfile
if [ -f "$SCRIPT_DIR/infra/Caddyfile" ]; then
  cp "$SCRIPT_DIR/infra/Caddyfile" "$DEPLOY_DIR/Caddyfile"
fi

# 6. Create .env from template
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "Creating .env from template..."
  cp "$SCRIPT_DIR/infra/.env.example" "$DEPLOY_DIR/.env"
  echo ""
  echo "================================================"
  echo "IMPORTANT: Edit $DEPLOY_DIR/.env with real values!"
  echo "================================================"
  echo ""
  echo "Required secrets:"
  echo "  - POSTGRES_PASSWORD"
  echo "  - REDIS_PASSWORD"
  echo "  - JWT_SECRET (run: openssl rand -hex 32)"
  echo "  - STRIPE_SECRET_KEY"
  echo "  - STRIPE_WEBHOOK_SECRET"
  echo "  - STRIPE_PUBLISHABLE_KEY"
  echo ""
fi

# 7. Log in to GHCR
echo "Logging in to GitHub Container Registry..."
echo "You need a Personal Access Token (PAT) with read:packages scope."
read -p "Enter your GitHub username: " GITHUB_USER
read -s -p "Enter your GitHub PAT: " GITHUB_TOKEN
echo ""
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

# 8. Start infrastructure
echo "Starting infrastructure services..."
docker compose up -d postgres redis minio

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "1. Edit $DEPLOY_DIR/.env with real values"
echo "2. Set up GitHub Secrets for the Actions workflow:"
echo "   - SERVER_HOST: your server IP/domain"
echo "   - SERVER_USER: your SSH username"
echo "   - SERVER_SSH_KEY: your SSH private key"
echo "   - SERVER_PORT: 22 (default)"
echo "3. Set up DNS records:"
echo "   - suenos-dev.dev → your server IP"
echo "   - api.suenos-dev.dev → your server IP"
echo "4. Install Caddy for SSL:"
echo "   sudo apt install caddy"
echo "   sudo cp $DEPLOY_DIR/Caddyfile /etc/caddy/Caddyfile"
echo "   sudo systemctl restart caddy"
echo "5. Push to main branch to trigger first deployment"
echo ""
