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

moduleFor('controller:home/index', 'Unit | Controller | home/index', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  expect(2 + 4 + 1 + 4 + 2 + 2);

  let controller = this.subject({
    initVisibleColumns: Ember.K,
    beforeSort: {bind: Ember.K},
    send: function (name, query) {
      equal(name, "setBreadcrumbs");
      ok(query);
    }
  });

  ok(controller);
  ok(controller.columns);
  ok(controller.columns.length, 13);
  ok(controller.getCounterColumns);

  ok(controller.pageNum);

  ok(controller.queryParams);
  ok(controller.headerComponentNames);
  equal(controller.headerComponentNames.length, 3);
  equal(controller.footerComponentNames.length, 2);

  ok(controller._definition);
  ok(controller.definition);

  ok(controller.actions.search);
  ok(controller.actions.pageChanged);
});

test('queryParams test', function(assert) {
  let controller = this.subject({
        initVisibleColumns: Ember.K,
        beforeSort: {bind: Ember.K},
        send: Ember.K
      });

  // 11 New, 5 Inherited & 4 for backward compatibility
  equal(controller.get("queryParams.length"), 7 + 5 + 4);
});

test('definition test', function(assert) {
  let controller = this.subject({
        initVisibleColumns: Ember.K,
        beforeSort: {bind: Ember.K},
        send: Ember.K
      }),
      definition = controller.get("definition"),
      testDAGName = "DAGName",
      testDAGID = "DAGID",
      testSubmitter = "Submitter",
      testStatus = "Status",
      testAppID = "AppID",
      testCallerID = "CallerID",
      testQueue = "Queue",
      testPageNum = 10,
      testMoreAvailable = true,
      testLoadingMore = true;

  equal(definition.get("dagName"), "");
  equal(definition.get("dagID"), "");
  equal(definition.get("submitter"), "");
  equal(definition.get("status"), "");
  equal(definition.get("appID"), "");
  equal(definition.get("callerID"), "");
  equal(definition.get("queue"), "");

  equal(definition.get("pageNum"), 1);

  equal(definition.get("moreAvailable"), false);
  equal(definition.get("loadingMore"), false);

  Ember.run(function () {
    controller.set("dagName", testDAGName);
    equal(controller.get("definition.dagName"), testDAGName);

    controller.set("dagID", testDAGID);
    equal(controller.get("definition.dagID"), testDAGID);

    controller.set("submitter", testSubmitter);
    equal(controller.get("definition.submitter"), testSubmitter);

    controller.set("status", testStatus);
    equal(controller.get("definition.status"), testStatus);

    controller.set("appID", testAppID);
    equal(controller.get("definition.appID"), testAppID);

    controller.set("callerID", testCallerID);
    equal(controller.get("definition.callerID"), testCallerID);

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
    initVisibleColumns: Ember.K,
    beforeSort: {bind: Ember.K},
    send: Ember.K
  }).get("breadcrumbs");

  equal(breadcrumbs.length, 1);
  equal(breadcrumbs[0].text, "All DAGs");
});
