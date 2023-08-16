/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * FTR config should have at list 1 test suite, otherwise the run will failure on CI
 */
export default function () {
  describe('Security Feature flag demo suite', function () {
    it('should be removed soon', () => {});
  });
}
