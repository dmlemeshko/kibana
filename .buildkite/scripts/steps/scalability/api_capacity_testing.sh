#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/common/util.sh

#.buildkite/scripts/bootstrap.sh
echo "--- yarn kbn reset && yarn kbn bootstrap"
yarn kbn reset && yarn kbn bootstrap

GCS_BUCKET="gs://kibana-performance/scalability-tests"
GCS_ARTIFACTS_REL="gcs_artifacts"
GCS_ARTIFACTS_DIR="${WORKSPACE}/${GCS_ARTIFACTS_REL}"
KIBANA_LOAD_TESTING_DIR="${KIBANA_DIR}/kibana-load-testing"

# These tests are running on static workers so we must delete previous build, load runner and scalability artifacts
rm -rf "${KIBANA_BUILD_LOCATION}"
rm -rf "${KIBANA_LOAD_TESTING_DIR}"
rm -rf "${GCS_ARTIFACTS_DIR}"

checkout_and_compile_load_runner() {
  mkdir -p "${KIBANA_LOAD_TESTING_DIR}" && cd "${KIBANA_LOAD_TESTING_DIR}"

  if [[ ! -d .git ]]; then
    git init
    git remote add origin https://github.com/elastic/kibana-load-testing.git
  fi
  git fetch origin --depth 1 "main"
  git reset --hard FETCH_HEAD

  KIBANA_LOAD_TESTING_GIT_COMMIT="$(git rev-parse HEAD)"
  export KIBANA_LOAD_TESTING_GIT_COMMIT

  mvn -q test-compile
  echo "Set 'GATLING_PROJECT_PATH' env var for ScalabilityTestRunner"
  export GATLING_PROJECT_PATH="$(pwd)"
}

upload_test_results() {
  cd "${KIBANA_DIR}"
  echo "Upload server logs as build artifacts"
  tar -czf server-logs.tar.gz data/ftr_servers_logs/**/*
  buildkite-agent artifact upload server-logs.tar.gz
  echo "--- Upload Gatling reports as build artifacts"
  tar -czf "scalability_test_report.tar.gz" --exclude=simulation.log -C kibana-load-testing/target gatling
  buildkite-agent artifact upload "scalability_test_report.tar.gz"
  cd "${LATEST_RUN_ARTIFACTS_DIR}"
  echo "Upload scalability traces as build artifacts"
  buildkite-agent artifact upload "scalability_traces.tar.gz"
}

echo "--- Clone kibana-load-testing repo and compile project"
checkout_and_compile_load_runner

echo "--- Download the latest artifacts from single user performance pipeline"
.buildkite/scripts/download_build_artifacts.sh

echo "--- Run single apis capacity tests"
node scripts/run_scalability --kibana-install-dir "$KIBANA_BUILD_LOCATION" --journey-path "x-pack/test/scalability/apis"

echo "--- Upload test results"
upload_test_results
