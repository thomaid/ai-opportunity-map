#!/bin/bash
# push_large_files.sh
# Pushes large source files to GitHub using the API.
# Run from the directory containing the project output files.
# Requires: curl, GITHUB_TOKEN environment variable
#
# Usage:
#   export GITHUB_TOKEN=your_token_here
#   bash push_large_files.sh /path/to/output/files
#

OWNER="thomaid"
REPO="ai-opportunity-map"
BRANCH="main"
FILES_DIR="${1:-.}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set"
  exit 1
fi

push_file() {
  local local_path="$1"
  local remote_path="$2"
  local message="$3"
  
  echo "Pushing $remote_path..."
  
  # Get current SHA if file exists (needed for updates)
  SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/contents/$remote_path?ref=$BRANCH" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null)
  
  CONTENT=$(base64 -w 0 "$local_path")
  
  if [ -n "$SHA" ]; then
    BODY="{\"message\":\"$message\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"$BRANCH\"}"
  else
    BODY="{\"message\":\"$message\",\"content\":\"$CONTENT\",\"branch\":\"$BRANCH\"}"
  fi
  
  RESULT=$(curl -s -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" \
    "https://api.github.com/repos/$OWNER/$REPO/contents/$remote_path")
  
  echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  OK:', d.get('content',{}).get('path','error'))" 2>/dev/null || echo "  Result: $RESULT"
}

# Push each file
push_file "$FILES_DIR/ai_opportunity_map.jsx"           "visualisation/ai_opportunity_map.jsx"           "Add current visualisation (React artifact)"
push_file "$FILES_DIR/ai_opportunity_map.html"          "visualisation/ai_opportunity_map.html"          "Add current standalone HTML"
push_file "$FILES_DIR/ai_opportunity_map_v3_checkpoint.jsx"  "visualisation/checkpoints/v3_checkpoint.jsx"   "Add v3 checkpoint"
push_file "$FILES_DIR/ai_opportunity_map_v4_checkpoint.jsx"  "visualisation/checkpoints/v4_checkpoint.jsx"   "Add v4 checkpoint"
push_file "$FILES_DIR/ai_opportunity_map_v5_checkpoint.jsx"  "visualisation/checkpoints/v5_checkpoint.jsx"   "Add v5 checkpoint"
push_file "$FILES_DIR/ai_opportunity_map_v5_checkpoint.html" "visualisation/checkpoints/v5_checkpoint.html"  "Add v5 checkpoint HTML"
push_file "$FILES_DIR/sample_data_retail_insurance.json"     "data/sample_data_retail_insurance.json"        "Add sample retail insurance dataset"
push_file "$FILES_DIR/ai_opportunity_map_data_v2.xlsx"       "data/ai_opportunity_map_data_v2.xlsx"          "Add Excel workbook template"
push_file "$FILES_DIR/ai_opportunity_map_data_model_v0.2.docx" "docs/ai_opportunity_map_data_model_v0.2.docx" "Add data model specification"
push_file "$FILES_DIR/ai_opportunity_map_guide.docx"         "docs/ai_opportunity_map_guide.docx"            "Add user guide"

echo "Done."
