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

import Ember from 'ember';

import { moduleForModel, test } from 'ember-qunit';

moduleForModel('abstract', 'Unit | Model | abstract', {
  // Specify the other units that are required for this test.
  // needs: []
});

test('Basic test for existence', function(assert) {
  let model = this.subject();

  ok(model);
  ok(model.mergedProperties);
  ok(model.refreshLoadTime);

  ok(model._notifyProperties);
  ok(model.didLoad);

  ok(model.entityID);
  ok(model.index);
  ok(model.status);
  ok(model.isComplete);
});

test('isComplete test', function(assert) {
  let model = this.subject();
  equal(model.get("isComplete"), false);

  Ember.run(function () {
    model.set("status", "SUCCEEDED");
    equal(model.get("isComplete"), true);

    model.set("status", null);
    equal(model.get("isComplete"), false);
    model.set("status", "FINISHED");
    equal(model.get("isComplete"), true);

    model.set("status", null);
    model.set("status", "FAILED");
    equal(model.get("isComplete"), true);

    model.set("status", null);
    model.set("status", "KILLED");
    equal(model.get("isComplete"), true);

    model.set("status", null);
    model.set("status", "ERROR");
    equal(model.get("isComplete"), true);
  });
});

test('_notifyProperties test - will fail if _notifyProperties implementation is changed in ember-data', function(assert) {
  let model = this.subject();

  Ember._beginPropertyChanges = Ember.beginPropertyChanges;

  expect(1 + 1);
  // refreshLoadTime will be called by us & beginPropertyChanges by ember data

  Ember.beginPropertyChanges = function () {
    ok(true);
    Ember._beginPropertyChanges();
  };
  model.refreshLoadTime = function () {
    ok(true);
  };

  model._notifyProperties([]);

  Ember.beginPropertyChanges = Ember._beginPropertyChanges;
});
