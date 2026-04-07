#!/usr/bin/env bash
set -euo pipefail

# applybase build script
#
# Usage:
#   ./build.sh              # build every .tex file in this directory
#   ./build.sh backend      # build a single file (omit the .tex extension)
#   ./build.sh --clean      # remove LaTeX build artifacts and exit
#
# Every .tex file is expected to compile to a single-page PDF. The build
# fails if any file produces more than one page — that's the whole point
# of the category pattern. If you need a multi-page version, keep it as
# a private master doc and don't run it through this script.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

ARTIFACTS=(aux log out fls fdb_latexmk synctex.gz)

clean() {
    for ext in "${ARTIFACTS[@]}"; do
        rm -f ./*."$ext" 2>/dev/null || true
    done
    rm -f texput.log 2>/dev/null || true
    echo -e "${GREEN}Cleaned build artifacts.${NC}"
}

build_one() {
    local base="$1"
    local tex="${base}.tex"

    if [[ ! -f "$tex" ]]; then
        echo -e "${RED}FAIL${NC} $tex not found"
        return 1
    fi

    # Compile twice so hyperref cross-references resolve
    pdflatex -interaction=nonstopmode "$tex" > /dev/null 2>&1 || true
    pdflatex -interaction=nonstopmode "$tex" > /dev/null 2>&1 || true

    local pdf="${base}.pdf"
    if [[ ! -f "$pdf" ]]; then
        echo -e "${RED}FAIL${NC} $tex --- no PDF produced. Run pdflatex $tex directly to see errors."
        return 1
    fi

    if command -v pdfinfo >/dev/null 2>&1; then
        local pages
        pages=$(pdfinfo "$pdf" | awk '/^Pages:/ {print $2}')
        if [[ "$pages" -ne 1 ]]; then
            echo -e "${RED}FAIL${NC} $pdf --- $pages pages (expected 1). Tighten content or use \\documentclass[tightlayout]{resume}."
            return 1
        fi
        echo -e "${GREEN}  OK${NC} $pdf (1 page)"
    else
        echo -e "${GREEN}  OK${NC} $pdf  ${RED}(install poppler-utils to enable page-count validation)${NC}"
    fi
}

if [[ "${1:-}" == "--clean" ]]; then
    clean
    exit 0
fi

failures=0

if [[ $# -gt 0 ]]; then
    for name in "$@"; do
        build_one "${name%.tex}" || failures=$((failures + 1))
    done
else
    shopt -s nullglob
    for f in *.tex; do
        build_one "${f%.tex}" || failures=$((failures + 1))
    done
    shopt -u nullglob
fi

clean >/dev/null

if [[ $failures -gt 0 ]]; then
    echo -e "${RED}$failures build(s) failed.${NC}"
    exit 1
fi
