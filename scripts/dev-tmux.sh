#!/bin/bash
# C3PO Development Environment - tmux launcher
# Usage: ./scripts/dev-tmux.sh

set -e

SESSION="c3po"
PROJECT_DIR="$HOME/projects/c3po"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting C3PO Development Environment${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and ensure WSL2 integration is enabled.${NC}"
    exit 1
fi

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux is not installed!${NC}"
    echo -e "${YELLOW}Install it with: sudo apt install tmux${NC}"
    exit 1
fi

# Kill existing session if it exists
if tmux has-session -t $SESSION 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Existing session found. Killing it...${NC}"
    tmux kill-session -t $SESSION
fi

# Start Docker services first
echo -e "${GREEN}🐳 Starting Docker services...${NC}"
cd $PROJECT_DIR
docker-compose up -d postgres redis

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for PostgreSQL and Redis...${NC}"
sleep 3

# Check if services are running
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${RED}❌ PostgreSQL failed to start!${NC}"
    exit 1
fi

if ! docker-compose ps | grep -q "redis.*Up"; then
    echo -e "${RED}❌ Redis failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker services are ready${NC}"
echo ""

# Create tmux session
echo -e "${BLUE}📺 Creating tmux session...${NC}"

# Window 0: Docker logs
tmux new-session -d -s $SESSION -n "docker" -c $PROJECT_DIR
tmux send-keys -t $SESSION:docker "docker-compose logs -f postgres redis" C-m

# Window 1: Backend
tmux new-window -t $SESSION -n "backend" -c "$PROJECT_DIR/backend"
tmux send-keys -t $SESSION:backend "clear" C-m
tmux send-keys -t $SESSION:backend "echo -e '${GREEN}🐍 Starting Backend (FastAPI)...${NC}'" C-m
tmux send-keys -t $SESSION:backend "uv run uvicorn app.main:app --reload --host 0.0.0.0" C-m

# Window 2: Frontend
tmux new-window -t $SESSION -n "frontend" -c $PROJECT_DIR
tmux send-keys -t $SESSION:frontend "clear" C-m
tmux send-keys -t $SESSION:frontend "echo -e '${GREEN}⚡ Starting Frontend (SvelteKit)...${NC}'" C-m
tmux send-keys -t $SESSION:frontend "pnpm dev --host" C-m

# Window 3: Database migrations / Shell
tmux new-window -t $SESSION -n "shell" -c "$PROJECT_DIR/backend"
tmux send-keys -t $SESSION:shell "clear" C-m
tmux send-keys -t $SESSION:shell "echo -e '${BLUE}🛠️  Shell - Ready for commands${NC}'" C-m
tmux send-keys -t $SESSION:shell "echo ''" C-m
tmux send-keys -t $SESSION:shell "echo -e '${YELLOW}Useful commands:${NC}'" C-m
tmux send-keys -t $SESSION:shell "echo '  uv run nox -s seed              - Seed test data (users + appointments)'" C-m
tmux send-keys -t $SESSION:shell "echo '  uv run nox -s migrate           - Apply migrations'" C-m
tmux send-keys -t $SESSION:shell "echo '  uv run alembic revision -m ...  - Create migration'" C-m
tmux send-keys -t $SESSION:shell "echo '  uv run nox -s test              - Run tests'" C-m
tmux send-keys -t $SESSION:shell "echo '  docker-compose ps               - Check services'" C-m
tmux send-keys -t $SESSION:shell "echo ''" C-m
tmux send-keys -t $SESSION:shell "echo -e '${GREEN}Tip: Run seed to create test users (admin, staff, clients)${NC}'" C-m
tmux send-keys -t $SESSION:shell "echo ''" C-m

# Window 4: Git
tmux new-window -t $SESSION -n "git" -c $PROJECT_DIR
tmux send-keys -t $SESSION:git "clear" C-m
tmux send-keys -t $SESSION:git "echo -e '${BLUE}📝 Git Status${NC}'" C-m
tmux send-keys -t $SESSION:git "git status" C-m

# Select backend window by default
tmux select-window -t $SESSION:backend

# Print instructions
echo ""
echo -e "${GREEN}✅ C3PO Development Environment Started!${NC}"
echo ""
echo -e "${BLUE}Available windows:${NC}"
echo -e "  ${YELLOW}0: docker${NC}    - PostgreSQL & Redis logs"
echo -e "  ${YELLOW}1: backend${NC}   - FastAPI server (http://localhost:8000)"
echo -e "  ${YELLOW}2: frontend${NC}  - SvelteKit dev (http://localhost:5173)"
echo -e "  ${YELLOW}3: shell${NC}     - Commands & migrations"
echo -e "  ${YELLOW}4: git${NC}       - Git operations"
echo ""
echo -e "${BLUE}tmux shortcuts:${NC}"
echo -e "  ${YELLOW}Ctrl+B then number${NC}  - Switch window (0-4)"
echo -e "  ${YELLOW}Ctrl+B then d${NC}       - Detach (keeps running)"
echo -e "  ${YELLOW}Ctrl+B then [${NC}       - Scroll mode (q to exit)"
echo -e "  ${YELLOW}Ctrl+B then ,${NC}       - Rename window"
echo -e "  ${YELLOW}exit${NC}                - Exit current window"
echo ""
echo -e "${BLUE}To stop everything:${NC}"
echo -e "  ${YELLOW}./scripts/stop-dev.sh${NC}"
echo -e "  or"
echo -e "  ${YELLOW}make stop${NC}"
echo ""
echo -e "${GREEN}Attaching to session...${NC}"
echo ""

# Attach to session
tmux attach-session -t $SESSION
