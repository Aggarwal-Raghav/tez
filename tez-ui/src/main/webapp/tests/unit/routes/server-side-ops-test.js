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

moduleFor('route:server-side-ops', 'Unit | Route | server side ops', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let route = this.subject();

  ok(route);
  ok(route.load);
  ok(route.loadNewPage);

  ok(route.actions.loadPage);
  ok(route.actions.reload);

  ok(route.actions.willTransition);
});

test('load - query/filter test', function(assert) {
  let testEntityType = "EntityType",
      testEntityID1 = "entity_1",
      testEntityID2 = "entity_2",
      testFromID = "entity_6",

      query = {
        limit: 5
      },
      resultRecords = Ember.A([
        Ember.Object.create({
          entityID: testEntityID1
        }),
        {}, {}, {}, {},
        Ember.Object.create({
          entityID: testFromID
        })
      ]),

      route = this.subject({
        entityType: testEntityType,
        controller: Ember.Object.create(),
        loader: {
          query: function (type, query, options) {
            equal(type, testEntityType);
            equal(query.limit, 6);
            equal(options.reload, true);
            return Ember.RSVP.resolve(resultRecords);
          }
        }
      });

  expect(3 * 2 + 2 + 3 + 3);

  notOk(route.get("controller.moreAvailable"));
  equal(route.get("fromId"), null);

  return route.load(null, query).then(function (records) {
    equal(records.get("0.entityID"), testEntityID1);

    equal(route.get("controller.moreAvailable"), true, "moreAvailable was not set");
    equal(route.get("fromId"), testFromID);
  }).then(function () {
    resultRecords = Ember.A([
      Ember.Object.create({
        entityID: testEntityID2
      })
    ]);
    return route.load(null, query);
  }).then(function (records) {
    equal(records.get("0.entityID"), testEntityID2);

    equal(route.get("controller.moreAvailable"), false);
    equal(route.get("fromId"), null);
  });
});

test('load - id fetch test', function(assert) {
  let testEntityType = "EntityType",
      testRecord = Ember.Object.create(),
      route = this.subject({
        entityType: testEntityType,
        controller: Ember.Object.create(),
        loader: {
          queryRecord: function (type, id, options) {
            equal(type, testEntityType);
            equal(options.reload, true);
            if (id === querySuccess.id) {
              return Ember.RSVP.resolve(testRecord);
            } else {
              return Ember.RSVP.reject(new Error("Failed in Reject"));
            }
          }
        }
      }),
      querySuccess = {
        id :'entity_123'
      },
      queryFailure = {
        id :'entity_456'
      };

  expect(2 * 2 + 3 + 1);

  route.load(null, querySuccess).then(function (records) {
    ok(Array.isArray(records));
    equal(records.length, 1);
    equal(records[0], testRecord);
  });
  route.load(null, queryFailure).then(function (data) {
    equal(data.length,0);
  });
});

test('loadNewPage test', function(assert) {
  let currentQuery = {
        val: {}
      },
      data = {content: []},
      fromId = "id1",
      route = this.subject({
        controller: Ember.Object.create(),
        currentQuery: currentQuery,
        fromId: fromId,
        loadedValue: {
          pushObjects: function (objs) {
            equal(data.content, objs);
          }
        },
        load: function (value, query) {
          equal(query.val, currentQuery.val);
          equal(query.fromId, fromId);
          return Ember.RSVP.resolve(data);
        }
      });

  expect(1 + 2);

  route.loadNewPage();
});

test('actions.willTransition test', function(assert) {
  let testPageNum = 5,
      controller = Ember.Object.create({
        pageNum: testPageNum
      }),
      route = this.subject({
        controller: controller,
      });

  expect(1 + 1);

  equal(controller.get("pageNum"), testPageNum);
  route.send("willTransition");
  equal(controller.get("pageNum"), 1); // PageNum must be reset
});
