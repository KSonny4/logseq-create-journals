#!/bin/bash
# ============================================
# Logseq Journal Creator - Deploy to n8n
# ============================================
# This script deploys the workflow to n8n on Raspberry Pi
# Usage: ./deploy.sh
#
# Required environment variable:
#   RPI_PASS - Password for the Raspberry Pi SSH connection
#
# You can set it in a .env file or export it before running:
#   export RPI_PASS="your_password"
#   ./deploy.sh

set -e

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
RPI_HOST="pi@192.168.0.136"
RPI_PASS="${RPI_PASS:-}"
WORKFLOW_FILE="n8n-workflow.json"
CONTAINER_NAME="n8n"
WORKFLOW_NAME="Logseq Journal Creator"

echo "========================================"
echo "Logseq Journal Creator - Deploy to n8n"
echo "========================================"
echo ""

# Check if password is set
if [ -z "$RPI_PASS" ]; then
    echo "Error: RPI_PASS environment variable is not set."
    echo "Set it with: export RPI_PASS='your_password'"
    echo "Or create a .env file with: RPI_PASS=your_password"
    exit 1
fi

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "Error: sshpass is not installed."
    echo "Install with: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "Error: Workflow file not found: $WORKFLOW_FILE"
    exit 1
fi

echo "1. Removing existing workflow (if any)..."
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "docker exec n8n-postgres psql -U n8n_user -d n8n -c \"DELETE FROM workflow_entity WHERE name = '$WORKFLOW_NAME';\" 2>&1 | grep -q 'DELETE' && echo '   ✓ Existing workflow(s) removed' || echo '   ✓ No existing workflow found'"

echo ""
echo "2. Copying workflow file to Raspberry Pi..."
cat "$WORKFLOW_FILE" | sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "cat > /tmp/logseq-journal-creator-workflow.json"
echo "   ✓ Workflow file copied"

echo ""
echo "3. Copying workflow into n8n container..."
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "docker cp /tmp/logseq-journal-creator-workflow.json $CONTAINER_NAME:/tmp/workflow.json"
echo "   ✓ Workflow file copied to container"

echo ""
echo "4. Importing workflow into n8n..."
IMPORT_RESULT=$(sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "docker exec $CONTAINER_NAME n8n import:workflow --input=/tmp/workflow.json 2>&1")
echo "   $IMPORT_RESULT"
echo "   ✓ Workflow imported"

echo ""
echo "5. Activating workflow..."
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "docker exec n8n-postgres psql -U n8n_user -d n8n -c \"UPDATE workflow_entity SET active = true WHERE name = '$WORKFLOW_NAME';\" 2>&1 | grep -q 'UPDATE' && echo '   ✓ Workflow activated' || echo '   ! Could not activate workflow'"

echo ""
echo "6. Cleaning up temporary files..."
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "rm -f /tmp/logseq-journal-creator-workflow.json"
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "docker exec $CONTAINER_NAME rm -f /tmp/workflow.json"
echo "   ✓ Cleanup complete"

echo ""
echo "7. Restarting n8n to apply changes..."
sshpass -p "$RPI_PASS" ssh "$RPI_HOST" "cd /home/pi/n8n && docker compose restart n8n"
echo "   ✓ n8n restarted"

echo ""
echo "========================================"
echo "✓ Deployment complete!"
echo "========================================"
echo ""
echo "The workflow is now active and will run monthly on the 1st at midnight"
echo "Access n8n at: http://192.168.0.136:5678"
echo ""

