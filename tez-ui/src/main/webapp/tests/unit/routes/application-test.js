/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let route = this.subject();

  ok(route);
  ok(route.pageReset);
  ok(route.actions.didTransition);
  ok(route.actions.bubbleBreadcrumbs);

  ok(route.actions.error);

  ok(route.actions.openModal);
  ok(route.actions.closeModal);
  ok(route.actions.destroyModal);

  ok(route.actions.resetTooltip);
});

test('Test didTransition action', function(assert) {
  let route = this.subject();

  expect(1);

  route.pageReset = function () {
    ok(true);
  };

  route.send("didTransition");
});

test('Test bubbleBreadcrumbs action', function(assert) {
  let route = this.subject(),
      testController = {
        breadcrumbs: null
      },
      testBreadcrumbs = [{}];

  route.controller = testController;

  notOk(route.get("controller.breadcrumbs"));
  route.send("bubbleBreadcrumbs", testBreadcrumbs);
  equal(route.get("controller.breadcrumbs"), testBreadcrumbs);
});
