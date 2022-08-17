#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/common/util.sh

.buildkite/scripts/bootstrap.sh

# These tests are running on static workers so we have to make sure we delete previous build of Kibana
rm -rf "$KIBANA_BUILD_LOCATION"

echo "--- downloading latest hash"

GCS_BUCKET="gs://kibana-performance/scalability-tests"
# mkdir gcs_artefacts
gsutil cp "$GCS_BUCKET/LATEST" .
HASH=`cat LATEST`

echo "--- downloading latest artefacts from single user performance run"
gsutil cp -r "$GCS_BUCKET/$HASH" .

ls -la

echo "--- creating $KIBANA_BUILD_LOCATION"

mkdir -p "$KIBANA_BUILD_LOCATION"

echo "--- unzip kibana build"

tar -xzf kibana-default.tar.gz -C "$KIBANA_BUILD_LOCATION" --strip=1

cd "$KIBANA_DIR"

tar -xzf ../kibana-default-plugins.tar.gz

# unset env vars defined in other parts of CI for automatic APM collection of
# Kibana. We manage APM config in our FTR config and performance service, and
# APM treats config in the ENV with a very high precedence.
unset ELASTIC_APM_ENVIRONMENT
unset ELASTIC_APM_TRANSACTION_SAMPLE_RATE
unset ELASTIC_APM_SERVER_URL
unset ELASTIC_APM_SECRET_TOKEN
unset ELASTIC_APM_ACTIVE
unset ELASTIC_APM_CONTEXT_PROPAGATION_ONLY
unset ELASTIC_APM_ACTIVE
unset ELASTIC_APM_SERVER_URL
unset ELASTIC_APM_SECRET_TOKEN
unset ELASTIC_APM_GLOBAL_LABELS

echo "--- Cloning kibana-load-testing repo and preparing workspace"

# cd ..
# mkdir -p kibana-load-testing && cd kibana-load-testing

# if [[ ! -d .git ]]; then
#   git init
#   git remote add origin https://github.com/elastic/kibana-load-testing.git
# fi
# git fetch origin --depth 1 "main"
# git reset --hard FETCH_HEAD

# KIBANA_LOAD_TESTING_GIT_COMMIT="$(git rev-parse HEAD)"
# export KIBANA_LOAD_TESTING_GIT_COMMIT

#export SCALABILITY_JOURNEYS_ROOT_PATH=/Users/dmle/github/kibana-load-testing

tar -xzf ../scalability_traces.tar.gz

# node scripts/functional_tests \
#   --config x-pack/test/performance/scalability/config.ts \
#   --kibana-install-dir "$KIBANA_BUILD_LOCATION" \
#   --debug \
#   --bail

