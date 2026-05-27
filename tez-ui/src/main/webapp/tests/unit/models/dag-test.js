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

moduleForModel('dag', 'Unit | Model | dag', {
  // Specify the other units that are required for this test.
  needs: []
});

test('Basic creation test', function(assert) {
  let model = this.subject(),
      testQueue = "TQ";

  Ember.run(function () {
    model.set("app", {
      queue: testQueue
    });

    ok(!!model);
    ok(!!model.needs.am);
    ok(!!model.needs.info);
    equal(model.get("queue"), testQueue);
  });

  ok(model.name);
  ok(model.submitter);

  ok(model.vertices);
  ok(model.edges);
  ok(model.vertexGroups);

  ok(model.domain);
  ok(model.containerLogs);

  ok(model.vertexIdNameMap);
  ok(model.vertexNameIdMap);

  ok(model.callerID);
  ok(model.callerContext);
  ok(model.callerDescription);
  ok(model.callerType);

  ok(model.dagPlan);
  ok(model.callerData);
  ok(model.info);

  ok(model.amWsVersion);
  ok(model.failedTaskAttempts);
  ok(model.finalStatus);
});

test('app loadType test', function(assert) {
  let loadType = this.subject().get("needs.app.loadType"),
      record = Ember.Object.create();

  equal(loadType(record), undefined);

  record.set("queueName", "Q");
  equal(loadType(record), "demand");

  record.set("atsStatus", "RUNNING");
  equal(loadType(record), undefined);

  record.set("atsStatus", "SUCCEEDED");
  equal(loadType(record), "demand");

  record.set("queueName", undefined);
  equal(loadType(record), undefined);
});

test('status test', function(assert) {
  let model = this.subject();

  Ember.run(function () {
    model.set("status", "SUCCEEDED");
    equal(model.get("status"), "SUCCEEDED");
    equal(model.get("finalStatus"), "SUCCEEDED");

    model.set("failedTaskAttempts", 1);
    equal(model.get("status"), "SUCCEEDED");
    equal(model.get("finalStatus"), "SUCCEEDED_WITH_FAILURES");
  });
});

test('queue test', function(assert) {
  let model = this.subject(),
      queueName = "queueName",
      appQueueName = "AppQueueName";

  equal(model.get("queue"), undefined);

  Ember.run(function () {
    model.set("app", {
      queue: appQueueName
    });
    equal(model.get("queue"), appQueueName);

    model.set("queueName", queueName);
    equal(model.get("queue"), queueName);
  });
});

test('vertices, edges & vertexGroups test', function(assert) {
  let testVertices = {},
      testEdges = {},
      testVertexGroups = {},
      model = this.subject({
        dagPlan: {
          vertices: testVertices,
          edges: testEdges,
          vertexGroups: testVertexGroups
        }
      });

  equal(model.get("vertices"), testVertices);
  equal(model.get("edges"), testEdges);
  equal(model.get("vertexGroups"), testVertexGroups);

  Ember.run(function () {
    testVertices = {};
    testEdges = {};
    testVertexGroups = {};

    model.set("info", {
      dagPlan: {
        vertices: testVertices,
        edges: testEdges,
        vertexGroups: testVertexGroups
      }
    });
    notEqual(model.get("vertices"), testVertices);
    notEqual(model.get("edges"), testEdges);
    notEqual(model.get("vertexGroups"), testVertexGroups);

    model.set("dagPlan", null);
    equal(model.get("vertices"), testVertices);
    equal(model.get("edges"), testEdges);
    equal(model.get("vertexGroups"), testVertexGroups);
  });
});
