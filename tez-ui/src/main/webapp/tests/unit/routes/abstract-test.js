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

moduleFor('route:abstract', 'Unit | Route | abstract', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('Basic creation test', function(assert) {
  let route = this.subject();

  ok(route);

  ok(route.loaderQueryParams);
  ok(route.model);
  ok(route.queryFromParams);

  ok(route.setDocTitle);
  ok(route.setupController);

  ok(route.checkAndCall);

  ok(route.setLoading);
  ok(route.loadData);
  ok(route.beforeLoad);
  ok(route.load);
  ok(route.afterLoad);
  ok(route.setValue);

  ok(route.getLoadTime);
  ok(route._setControllerModel);
  ok(route.setLoader);

  ok(route.actions.setBreadcrumbs);
  ok(route.actions.bubbleBreadcrumbs);
});

test('queryFromParams test', function(assert) {
  let route = this.subject({
    loaderQueryParams: {
      id: "a_id",
      b: "b"
    }
  }),
  testParam = {
    a: 1,
    a_id: 2,
    b: 3,
    b_id: 4
  };

  deepEqual(route.queryFromParams(testParam), {
    id: 2,
    b: 3
  });
});

test('checkAndCall test', function(assert) {
  let route = this.subject(),
      testValue = {},
      testQuery = {},
      testOptions = {};

  expect(3 + 1);

  route.testFunction = function (value, query, options) {
    equal(value, testValue, "Value check for id 1");
    equal(query, testQuery, "Query check for id 1");
    equal(options, testOptions, "Options check for id 1");
  };
  route.currentPromiseId = 1;

  route.checkAndCall(1, "testFunction", testQuery, testOptions, testValue);
  throws(function () {
    route.checkAndCall(2, "testFunction", testQuery, testOptions, testValue);
  });
});

test('loadData test - Hook sequence check', function(assert) {
  let route = this.subject();

  // Bind poilyfill
  Function.prototype.bind = function (context, val1, val2, val3, val4) {
    var that = this;
    return function (val) {
      return that.call(context, val1, val2, val3, val4, val);
    };
  };

  expect(4 + 1);

  route.setLoading = function () {
    return 1;
  };
  route.beforeLoad = function (value) {
    equal(value, 1, "beforeLoad");
    return ++value;
  };
  route.load = function (value) {
    equal(value, 2, "load");
    return ++value;
  };
  route.afterLoad = function (value) {
    equal(value, 3, "afterLoad");
    return ++value;
  };
  route.setValue = function (value) {
    equal(value, 4, "setValue");
    return ++value;
  };

  route.loadData().then(function (value) {
    equal(value, 5, "Value returned by loadData");
  });

});

test('loadData test - ID change check with exception throw', function(assert) {
  let route = this.subject();

  // Bind poilyfill
  Function.prototype.bind = function (context, val1, val2, val3, val4) {
    var that = this;
    return function (val) {
      return that.call(context, val1, val2, val3, val4, val);
    };
  };

  expect(2 + 1);

  route.setLoading = function () {
    return 1;
  };
  route.beforeLoad = function (value) {
    equal(value, 1, "beforeLoad");
    return ++value;
  };
  route.load = function (value) {
    equal(value, 2, "load");

    route.currentPromiseId = 0;

    return ++value;
  };
  route.afterLoad = function (value) {
    equal(value, 3, "afterLoad");
    return ++value;
  };
  route.setValue = function (value) {
    equal(value, 4, "setValue");
    return ++value;
  };

  route.loadData().then(function () {
    notOk("Shouldn't be called");
  }).catch(function () {
    ok(true, "Exception thrown");
  });
});

test('setLoading test', function(assert) {
  let route = this.subject();

  route.controller = Ember.Object.create();

  equal(route.get("isLoading"), false);
  route.setLoading();
  equal(route.get("isLoading"), true);
});

test('beforeLoad load afterLoad test', function(assert) {
  let route = this.subject(),
      testVal = {};

  equal(route.beforeLoad(testVal), testVal);
  equal(route.load(testVal), testVal);
  equal(route.afterLoad(testVal), testVal);
});

test('setValue test', function(assert) {
  let route = this.subject(),
      testVal = {};

  route.controller = Ember.Object.create();

  route.setLoading();
  equal(route.get("loadedValue"), null);
  equal(route.get("isLoading"), true);
  equal(route.setValue(testVal), testVal);
  equal(route.get("loadedValue"), testVal);
  equal(route.get("isLoading"), false);
});

test('getLoadTime test', function(assert) {
  let route = this.subject(),
      testTime = Date.now(),
      testRecord = {
        loadTime: testTime
      };

  equal(route.getLoadTime(testRecord), testTime);
  equal(route.getLoadTime([testRecord]), testTime);
});

test('_setControllerModel test', function(assert) {
  let route = this.subject(),
      testValue = {},
      testController = Ember.Object.create();

  route.set("loadedValue", testValue);
  route.set("controller", testController);

  notOk(testController.model);
  route._setControllerModel();
  equal(testController.model, testValue, "With controller");
});

test('setLoader test', function(assert) {
  let route = this.subject(),
      testNamespace = "tn",
      oldLoader = route.get("loader");

  route.setLoader(testNamespace);

  notEqual(route.get("loader"), oldLoader);
  equal(route.get("loader.nameSpace"), testNamespace);
  equal(route.get("loader.store"), route.get("store"));
  equal(route.get("loader.container"), route.get("container"));
});

test('actions.setBreadcrumbs test', function(assert) {
  let testName = "ts",
      route = this.subject({
        name: testName
      }),
      testCrumbs = {};

  // Because all controllers are pointing to the leaf rout
  testCrumbs[testName] = testCrumbs;

  route.send("setBreadcrumbs", testCrumbs);
  equal(route.get("breadcrumbs"), testCrumbs);

  route.send("setBreadcrumbs", {});
  equal(route.get("breadcrumbs"), testCrumbs);

  route.send("setBreadcrumbs", null);
  equal(route.get("breadcrumbs"), testCrumbs);
});

test('actions.bubbleBreadcrumbs test', function(assert) {
  let testName = "ts",
      route = this.subject({
        name: testName
      }),
      existingCrumbs = [1, 2],
      testCrumbs = [1, 2];

  route.set("breadcrumbs", existingCrumbs);

  route.send("bubbleBreadcrumbs", testCrumbs);
  equal(testCrumbs.length, 2 + 2);
});
