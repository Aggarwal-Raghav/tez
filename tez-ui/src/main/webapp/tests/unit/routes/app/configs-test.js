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

moduleFor('route:app/configs', 'Unit | Route | app/configs', {
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

test('load test', function(assert) {
  let entityID = "123",
      testOptions = {},
      testData = {},
      route = this.subject({
        modelFor: function (type) {
          equal(type, "app");
          return Ember.Object.create({
            entityID: entityID
          });
        }
      });
  route.loader = {
    queryRecord: function (type, id, options) {
      equal(type, "app");
      equal(id, "tez_123");
      equal(options, testOptions);
      return Ember.RSVP.resolve(testData);
    }
  };

  route.load(null, null, testOptions).then(function (data) {
    equal(data, testData);
  });

  expect(1 + 3 + 1);
});

test('load failure test', function(assert) {
  let route = this.subject({
        modelFor: function (type) {
          equal(type, "app");
          return Ember.Object.create();
        },
      });
  route.loader = {
    queryRecord: function () {
      return Ember.RSVP.reject(new Error());
    }
  };

  route.load(null, null, {}).then(function (data) {
    ok(Array.isArray(data));
    equal(data.length, 0);
  });

  expect(1 + 2);
});
