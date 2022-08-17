#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/common/util.sh

echo "--- Cloning kibana-load-testing repo and preparing workspace"

cd ..
mkdir -p kibana-load-testing && cd kibana-load-testing

if [[ ! -d .git ]]; then
  git init
  git remote add origin https://github.com/elastic/kibana-load-testing.git
fi
git fetch origin --depth 1 "main"
git reset --hard FETCH_HEAD

KIBANA_LOAD_TESTING_GIT_COMMIT="$(git rev-parse HEAD)"
export KIBANA_LOAD_TESTING_GIT_COMMIT

