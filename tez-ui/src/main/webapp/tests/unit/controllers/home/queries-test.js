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

moduleFor('controller:home/queries', 'Unit | Controller | home/queries', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let controller = this.subject({
    send: Ember.K,
    initVisibleColumns: Ember.K
  });

  ok(controller);

  ok(controller.queryParams);
  equal(controller.queryParams.length, 9 + 5);

  ok(controller.breadcrumbs);
  ok(controller.headerComponentNames);
  equal(controller.headerComponentNames.length, 3);
  equal(controller.footerComponentNames.length, 1);

  ok(controller.definition);
  ok(controller.columns);
  equal(controller.columns.length, 17);

  ok(controller.getCounterColumns);

  ok(controller.actions.search);
  ok(controller.actions.pageChanged);

  equal(controller.get("pageNum"), 1);
});

test('definition test', function(assert) {
  let controller = this.subject({
        initVisibleColumns: Ember.K,
        beforeSort: {bind: Ember.K},
        send: Ember.K
      }),
      definition = controller.get("definition"),

      testQueryID = "QueryID",
      testDagID = "DagID",
      testAppID = "AppID",
      testExecutionMode = "ExecutionMode",
      testUser = "User",
      testRequestUser = "RequestUser",
      testTablesRead = "TablesRead",
      testTablesWritten = "TablesWritten",
      testQueue = "queue",

      testPageNum = 10,
      testMoreAvailable = true,
      testLoadingMore = true;

  equal(definition.get("queryID"), "");
  equal(definition.get("dagID"), "");
  equal(definition.get("appID"), "");
  equal(definition.get("executionMode"), "");
  equal(definition.get("user"), "");
  equal(definition.get("requestUser"), "");
  equal(definition.get("tablesRead"), "");
  equal(definition.get("tablesWritten"), "");
  equal(definition.get("queue"), "");

  equal(definition.get("pageNum"), 1);

  equal(definition.get("moreAvailable"), false);
  equal(definition.get("loadingMore"), false);

  Ember.run(function () {
    controller.set("queryID", testQueryID);
    equal(controller.get("definition.queryID"), testQueryID);

    controller.set("dagID", testDagID);
    equal(controller.get("definition.dagID"), testDagID);

    controller.set("appID", testAppID);
    equal(controller.get("definition.appID"), testAppID);

    controller.set("executionMode", testExecutionMode);
    equal(controller.get("definition.executionMode"), testExecutionMode);

    controller.set("user", testUser);
    equal(controller.get("definition.user"), testUser);

    controller.set("requestUser", testRequestUser);
    equal(controller.get("definition.requestUser"), testRequestUser);

    controller.set("tablesRead", testTablesRead);
    equal(controller.get("definition.tablesRead"), testTablesRead);

    controller.set("tablesWritten", testTablesWritten);
    equal(controller.get("definition.tablesWritten"), testTablesWritten);

    controller.set("queue", testQueue);
    equal(controller.get("definition.queue"), testQueue);

    controller.set("pageNum", testPageNum);
    equal(controller.get("definition.pageNum"), testPageNum);

    controller.set("moreAvailable", testMoreAvailable);
    equal(controller.get("definition.moreAvailable"), testMoreAvailable);

    controller.set("loadingMore", testLoadingMore);
    equal(controller.get("definition.loadingMore"), testLoadingMore);
  });
});

test('breadcrumbs test', function(assert) {
  let breadcrumbs = this.subject({
    send: Ember.K,
    initVisibleColumns: Ember.K
  }).get("breadcrumbs");

  equal(breadcrumbs.length, 1);
  equal(breadcrumbs[0].text, "All Queries");
});

test('getCounterColumns test', function(assert) {
  let getCounterColumns = this.subject({
    send: Ember.K,
    initVisibleColumns: Ember.K
  }).get("getCounterColumns");

  equal(getCounterColumns().length, 0);
});
