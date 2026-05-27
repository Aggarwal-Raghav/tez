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

import Ember from 'ember';

moduleFor('route:app/dags', 'Unit | Route | app/dags', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let route = this.subject();

  ok(route);
  ok(route.title);
  ok(route.loaderNamespace);
  ok(route.setupController);
  ok(route.load);
});

test('setupController test', function(assert) {
  expect(2);

  let route = this.subject({
    modelFor: function (type) {
      equal(type, 'app');
      return Ember.Object.create({
        entityID: 'app_123'
      });
    },
    startCrumbBubble: function () {
      ok(true);
    }
  });

  route.setupController({}, {});
});

test('Test load', function(assert) {
  let testID = "123",
      testOptions = {},
      testData = {},
      route = this.subject({
        modelFor: function (type) {
          equal(type, "app");
          return Ember.Object.create({
            entityID: testID
          });
        },
        get: function () {
          return {
            query: function (type, query, options) {
              equal(type, "dag");
              equal(query.appID, testID);
              equal(options, testOptions);
              return testData;
            }
          };
        }
      }),
      data;

  expect(1 + 3 + 1);

  data = route.load(null, null, testOptions);
  equal(data, testData);
});
