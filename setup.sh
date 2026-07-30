#!/usr/bin/env bash
set -euo pipefail

# Renames this React Native boilerplate project ("Boilerplate") to a new app name.
# Usage: ./setup.sh MyApp

if [ $# -lt 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: ./setup.sh <NewAppName>"
  echo "Example: ./setup.sh MyApp"
  exit 1
fi

NEW_NAME="$1"
OLD_NAME="Boilerplate"
OLD_NAME_LOWER="boilerplate"

# Sanitize new name for use as an Android/iOS package identifier segment
# (lowercase, alphanumeric only).
NEW_NAME_LOWER=$(echo "$NEW_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]')

if [ -z "$NEW_NAME_LOWER" ]; then
  echo "Error: app name must contain at least one alphanumeric character."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

OLD_JAVA_PACKAGE="com.aks.${OLD_NAME_LOWER}"
NEW_JAVA_PACKAGE="com.aks.${NEW_NAME_LOWER}"
OLD_JAVA_PATH="android/app/src/main/java/com/aks/${OLD_NAME_LOWER}"
NEW_JAVA_PATH="android/app/src/main/java/com/aks/${NEW_NAME_LOWER}"

echo "Renaming project from '${OLD_NAME}' to '${NEW_NAME}'..."

# Portable in-place sed (works on both BSD/macOS and GNU sed).
sed_inplace() {
  local expr="$1"
  local file="$2"
  if sed --version >/dev/null 2>&1; then
    sed -i -e "$expr" "$file"
  else
    sed -i '' -e "$expr" "$file"
  fi
}

replace_in_file() {
  local file="$1"
  [ -f "$file" ] || return 0
  sed_inplace "s/${OLD_JAVA_PACKAGE}/${NEW_JAVA_PACKAGE}/g" "$file"
  sed_inplace "s/${OLD_NAME}/${NEW_NAME}/g" "$file"
}

# --- package.json ---
replace_in_file "package.json"

# --- app.json (name and slug) ---
replace_in_file "app.json"

# --- CI workflow references ---
if [ -d ".github/workflows" ]; then
  for f in .github/workflows/*; do
    replace_in_file "$f"
  done
fi

# --- Android ---
replace_in_file "android/settings.gradle"
replace_in_file "android/app/build.gradle"
replace_in_file "android/app/src/main/res/values/strings.xml"

if [ -d "$OLD_JAVA_PATH" ]; then
  for f in "$OLD_JAVA_PATH"/*; do
    replace_in_file "$f"
  done
  mkdir -p "$(dirname "$NEW_JAVA_PATH")"
  mv "$OLD_JAVA_PATH" "$NEW_JAVA_PATH"
fi

# --- iOS ---
replace_in_file "ios/Podfile"

if [ -d "ios/${OLD_NAME}" ]; then
  for f in "ios/${OLD_NAME}"/*; do
    replace_in_file "$f"
  done
fi

if [ -f "ios/${OLD_NAME}.xcodeproj/project.pbxproj" ]; then
  replace_in_file "ios/${OLD_NAME}.xcodeproj/project.pbxproj"
fi

if [ -f "ios/${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${OLD_NAME}.xcscheme" ]; then
  replace_in_file "ios/${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${OLD_NAME}.xcscheme"
fi

if [ -f "ios/${OLD_NAME}.xcworkspace/contents.xcworkspacedata" ]; then
  replace_in_file "ios/${OLD_NAME}.xcworkspace/contents.xcworkspacedata"
fi

# Rename iOS scheme file before its parent directory is renamed.
if [ -f "ios/${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${OLD_NAME}.xcscheme" ]; then
  mv "ios/${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${OLD_NAME}.xcscheme" \
     "ios/${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${NEW_NAME}.xcscheme"
fi

[ -d "ios/${OLD_NAME}" ] && mv "ios/${OLD_NAME}" "ios/${NEW_NAME}"
[ -d "ios/${OLD_NAME}.xcodeproj" ] && mv "ios/${OLD_NAME}.xcodeproj" "ios/${NEW_NAME}.xcodeproj"
[ -d "ios/${OLD_NAME}.xcworkspace" ] && mv "ios/${OLD_NAME}.xcworkspace" "ios/${NEW_NAME}.xcworkspace"

echo "Done. '${OLD_NAME}' has been renamed to '${NEW_NAME}' (bundle/package id: ${NEW_JAVA_PACKAGE})."
echo "Next steps: run 'npm install', then 'npm run ios' or 'npm run android'."
