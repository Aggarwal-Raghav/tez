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

moduleFor('controller:dag/vertices', 'Unit | Controller | dag/vertices', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let controller = this.subject({
    send: Ember.K,
    beforeSort: {bind: Ember.K},
    initVisibleColumns: Ember.K,
    getCounterColumns: function () {
      return [];
    }
  });

  ok(controller);
  ok(controller.breadcrumbs);
  ok(controller.columns);
  ok(controller.beforeSort);
});

test('beforeSort test', function(assert) {
  let controller = this.subject({
    initVisibleColumns: Ember.K,
    getCounterColumns: function () {
      return [];
    },
    polling: {
      isReady: true
    },
    send: function (actionName) {
      if(actionName === "openModal") {
        ok(true);
      }
    }
  });

  // Bind poilyfill
  Function.prototype.bind = function (context) {
    var that = this;
    return function (val) {
      return that.call(context, val);
    };
  };

  expect(1 + 3 + 3);

  ok(controller.beforeSort(Ember.Object.create({
    contentPath: "NonDisabledColumn"
  })), "NonDisabledColumn");

  notOk(controller.beforeSort(Ember.Object.create({
    contentPath: "succeededTasks"
  })), "succeededTasks");
  notOk(controller.beforeSort(Ember.Object.create({
    contentPath: "runningTasks"
  })), "runningTasks");
  notOk(controller.beforeSort(Ember.Object.create({
    contentPath: "pendingTasks"
  })), "pendingTasks");

});
