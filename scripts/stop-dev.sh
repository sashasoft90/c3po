#!/bin/bash
# Stop C3PO Development Environment
# Usage: ./scripts/stop-dev.sh

set -e

SESSION="c3po"
PROJECT_DIR="$HOME/projects/c3po"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping C3PO Development Environment${NC}"
echo ""

# Kill tmux session
if tmux has-session -t $SESSION 2>/dev/null; then
    echo -e "${YELLOW}Killing tmux session...${NC}"
    tmux kill-session -t $SESSION
    echo -e "${GREEN}✅ tmux session stopped${NC}"
else
    echo -e "${YELLOW}⚠️  No tmux session found${NC}"
fi

# Stop Docker services
echo -e "${YELLOW}Stopping Docker services...${NC}"
cd $PROJECT_DIR
docker-compose down

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
