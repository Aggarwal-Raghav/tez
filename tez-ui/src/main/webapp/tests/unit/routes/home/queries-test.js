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
import { moduleFor, test } from 'ember-qunit';

moduleFor('route:home/queries', 'Unit | Route | home/queries', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function(assert) {
  let route = this.subject();

  ok(route);
  ok(route.title);

  ok(route.queryParams);
  ok(route.loaderQueryParams);
  ok(route.setupController);

  equal(route.entityType, "hive-query");
  equal(route.loaderNamespace, "queries");

  ok(route.actions.willTransition);
});

test('refresh test', function(assert) {
  let route = this.subject();

  equal(route.get("queryParams.queryID.refreshModel"), true);
  equal(route.get("queryParams.dagID.refreshModel"), true);
  equal(route.get("queryParams.appID.refreshModel"), true);
  equal(route.get("queryParams.executionMode.refreshModel"), true);
  equal(route.get("queryParams.user.refreshModel"), true);
  equal(route.get("queryParams.requestUser.refreshModel"), true);
  equal(route.get("queryParams.tablesRead.refreshModel"), true);
  equal(route.get("queryParams.tablesWritten.refreshModel"), true);
  equal(route.get("queryParams.operationID.refreshModel"), true);
  equal(route.get("queryParams.queue.refreshModel"), true);

  equal(route.get("queryParams.rowCount.refreshModel"), true);
});

test('loaderQueryParams test', function(assert) {
  let route = this.subject();
  equal(Object.keys(route.get("loaderQueryParams")).length, 10 + 1);
});

test('load - query test', function(assert) {
  let route = this.subject({
        controller: Ember.Object.create()
      }),
      testEntityID1 = "entity_1",
      testSubmitter = "sub",
      query = {
        limit: 5,
        submitter: testSubmitter
      },
      resultRecords = Ember.A([
        Ember.Object.create({
          submitter: testSubmitter,
          entityID: testEntityID1
        })
      ]);

  route.loader = Ember.Object.create({
    query: function (type, query, options) {
      equal(type, "hive-query");
      equal(query.limit, 6);
      equal(options.reload, true);
      return Ember.RSVP.resolve(resultRecords);
    },
  });

  expect(3 + 1 + 2);

  return route.load(null, query).then(function (records) {
    ok(Array.isArray(records));

    equal(records.get("length"), 1);
    equal(records.get("0.entityID"), testEntityID1);
  });

});

test('actions.willTransition test', function(assert) {
  let route = this.subject({
    controller: Ember.Object.create()
  });

  route.set("loader", {
    unloadAll: function (type) {
      if(type === "hive-query") {
        ok(true);
      }
      else {
        throw(new Error("Invalid type!"));
      }
    }
  });

  expect(1);
  route.send("willTransition");
});
