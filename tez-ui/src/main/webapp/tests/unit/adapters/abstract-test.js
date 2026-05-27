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

moduleFor('adapter:abstract', 'Unit | Adapter | abstract', {
  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']
});

test('Basic creation test', function(assert) {
  let adapter = this.subject();

  ok(adapter);
  equal(adapter.serverName, null);

  ok(adapter.host);
  ok(adapter.namespace);
  ok(adapter.pathTypeHash);

  ok(adapter.ajaxOptions);
  ok(adapter.pathForType);

  ok(adapter.normalizeErrorResponse);
  ok(adapter._loaderAjax);
});

test('host, namespace & pathTypeHash test', function(assert) {
  let adapter = this.subject(),
      testServerName = "sn",
      testHosts = {
        sn: "foo.bar",
      },
      testENV = {
        app: {
          namespaces: {
            webService: {
              sn: "ws"
            }
          },
          paths: {
            sn: "path"
          }
        }
      };

  adapter.hosts = testHosts;
  adapter.env = testENV;
  adapter.set("serverName", testServerName);

  equal(adapter.get("host"), testHosts.sn);
  equal(adapter.get("namespace"), testENV.app.namespaces.webService.sn);
  equal(adapter.get("pathTypeHash"), testENV.app.paths.sn);
});

test('ajaxOptions test', function(assert) {
  let adapter = this.subject(),
      testUrl = "foo.bar",
      testMethod = "tm",
      testOptions = {
        a: 1
      },
      testServer = "ts",

      result;

  // Without options
  adapter.serverName = testServer;
  result = adapter.ajaxOptions(testUrl, testMethod);
  ok(result);
  ok(result.crossDomain);
  ok(result.xhrFields.withCredentials);
  equal(result.targetServer, testServer);

  // Without options
  adapter.serverName = testServer;
  result = adapter.ajaxOptions(testUrl, testMethod, testOptions);
  ok(result);
  ok(result.crossDomain);
  ok(result.xhrFields.withCredentials);
  equal(result.targetServer, testServer);
  equal(result.a, testOptions.a);
});

test('pathForType test', function(assert) {
  let adapter = this.subject(),
      testHash = {
        typ: "type"
      };

  expect(2);

  adapter.pathTypeHash = testHash;
  equal(adapter.pathForType("typ"), testHash.typ);
  throws(function () {
    adapter.pathForType("noType");
  });
});

test('normalizeErrorResponse test', function(assert) {
  let adapter = this.subject(),
      status = "200",
      testTitle = "title",
      strPayload = "StringPayload",
      objPayload = {x: 1, message: testTitle},
      testHeaders = {},
      response;

  response = adapter.normalizeErrorResponse(status, testHeaders, strPayload);
  equal(response[0].title, undefined);
  equal(response[0].status, status);
  equal(response[0].detail, strPayload);
  equal(response[0].headers, testHeaders);

  response = adapter.normalizeErrorResponse(status, testHeaders, objPayload);
  equal(response[0].title, testTitle);
  equal(response[0].status, status);
  deepEqual(response[0].detail, objPayload);
  equal(response[0].headers, testHeaders);
});

test('normalizeErrorResponse html payload test', function(assert) {
  let adapter = this.subject(),
      status = "200",
      htmlPayload = "StringPayload <b>boldText</b> <script>scriptText</script> <style>styleText</style>",
      testHeaders = {},
      response;

  response = adapter.normalizeErrorResponse(status, testHeaders, htmlPayload);
  equal(response[0].detail, "StringPayload boldText");
});

test('_loaderAjax resolve test', function(assert) {
  let result = {},
      adapter = this.subject({
        ajax: function () {
          ok(1);
          return Ember.RSVP.resolve(result);
        }
      });

  expect(1 + 1);

  adapter._loaderAjax().then(function (val) {
    equal(val.data, result);
  });
});

test('_loaderAjax reject, without title test', function(assert) {
  let errorInfo = {
        status: "500",
        detail: "testDetails"
      },
      msg = "Msg",
      testUrl = "http://foo.bar",
      testQuery = {},
      testNS = "namespace",
      adapter = this.subject({
        outOfReachMessage: "OutOfReach",
        ajax: function () {
          ok(1);
          return Ember.RSVP.reject({
            message: msg,
            errors:[errorInfo]
          });
        }
      });

  expect(1 + 7);

  adapter._loaderAjax(testUrl, testQuery, testNS).catch(function (val) {
    equal(val.message, `${msg} » ${errorInfo.status}: Error accessing ${testUrl}`);
    equal(val.details, errorInfo.detail);
    equal(val.requestInfo.adapterName, "abstract");
    equal(val.requestInfo.url, testUrl);

    equal(val.requestInfo.queryParams, testQuery);
    equal(val.requestInfo.namespace, testNS);

    ok(val.requestInfo.hasOwnProperty("responseHeaders"));
  });
});

test('_loaderAjax reject, with title test', function(assert) {
  let errorInfo = {
        status: "500",
        title: "Server Error",
        detail: "testDetails"
      },
      msg = "Msg",
      testUrl = "url",
      adapter = this.subject({
        outOfReachMessage: "OutOfReach",
        ajax: function () {
          ok(1);
          return Ember.RSVP.reject({
            message: msg,
            errors:[errorInfo]
          });
        }
      });

  expect(1 + 5);

  adapter._loaderAjax(testUrl).catch(function (val) {
    equal(val.message, `${msg} » ${errorInfo.status}: ${errorInfo.title}`);
    equal(val.details, errorInfo.detail);
    equal(val.requestInfo.adapterName, "abstract");
    equal(val.requestInfo.url, testUrl);

    ok(val.requestInfo.hasOwnProperty("responseHeaders"));
  });
});

test('_loaderAjax reject, status 0 test', function(assert) {
  let errorInfo = {
        status: 0,
        title: "Server Error",
        detail: "testDetails"
      },
      msg = "Msg",
      testUrl = "url",
      adapter = this.subject({
        outOfReachMessage: "OutOfReach",
        ajax: function () {
          ok(1);
          return Ember.RSVP.reject({
            message: msg,
            errors:[errorInfo]
          });
        }
      });

  expect(1 + 5);

  adapter._loaderAjax(testUrl).catch(function (val) {
    equal(val.message, `${msg} » ${adapter.outOfReachMessage}`);
    equal(val.details, errorInfo.detail);
    equal(val.requestInfo.adapterName, "abstract");
    equal(val.requestInfo.url, testUrl);

    ok(val.requestInfo.hasOwnProperty("responseHeaders"));
  });
});
