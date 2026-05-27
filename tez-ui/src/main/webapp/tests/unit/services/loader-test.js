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

moduleFor('service:loader', 'Unit | Service | loader', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('Basic creation test', function(assert) {
  let service = this.subject();

  ok(service.cache);
  ok(service.store);
  ok(service._setOptions);

  ok(service.checkRequisite);

  ok(service.lookup);
  ok(service.entityFor);

  ok(service.getCacheKey);

  ok(service.queryRecord);
  ok(service.query);

  ok(service.unloadAll);
});

test('_setOptions test', function(assert) {
  let service = this.subject();

  equal(service.get("nameSpace"), '');

  service._setOptions({
    nameSpace: "ns"
  });

  equal(service.get("nameSpace"), 'ns');
});

test('checkRequisite test', function(assert) {
  let service = this.subject(),
      testType = "type";

  expect(3 + 3 + 2);

  // Not found
  service.store = {
    adapterFor: function (type) {
      equal(type, testType);
    },
    serializerFor: function (type) {
      equal(type, testType);
    }
  };
  throws(function () {
    service.checkRequisite(testType);
  });

  // Not loader found
  service.store = {
    adapterFor: function (type) {
      equal(type, testType);
      return {};
    },
    serializerFor: function (type) {
      equal(type, testType);
      return {};
    }
  };
  throws(function () {
    service.checkRequisite(testType);
  });

  service.store = {
    adapterFor: function (type) {
      equal(type, testType);
      return { _isLoader: true };
    },
    serializerFor: function (type) {
      equal(type, testType);
      return { _isLoader: true };
    }
  };

  service.checkRequisite(testType);
});

test('lookup test', function(assert) {
  let service = this.subject();

  expect(1);

  service.container.lookup = function (fullName) {
    equal(fullName, "typ:na-me");
  };

  service.lookup("typ", "NaMe");
});

test('entityFor test', function(assert) {
  let service = this.subject(),
      testName = "abc",
      entity;

  expect(3 + 4 + 3);

  // All lookups fail
  service.lookup = function (type, name) {
    if(name === testName) {
      equal(type, "entitie");
    }
    if(name === "entity") {
      equal(type, "entitie");
    }
  };
  throws(function () {
    service.entityFor(testName);
  }, "All lookups fail");

  // Default lookups succeeded
  service.lookup = function (type, name) {
    if(name === testName) {
      equal(type, "entitie");
    }
    if(name === "entity") {
      equal(type, "entitie");
      return Ember.Object.create({
        actualName: "entity",
        name: name
      });
    }
  };
  entity = service.entityFor(testName);
  equal(entity.actualName, "entity", "Default lookups succeeded");
  equal(entity.get("name"), testName, "Default lookups succeeded");

  // Primary lookups succeeded
  service.lookup = function (type, name) {
    if(name === testName) {
      equal(type, "entitie");
      return Ember.Object.create({
        actualName: name,
        name: name
      });
    }
    if(name === "entity") {
      equal(type, "entitie"); // Shouldn't be called
    }
  };
  entity = service.entityFor(testName);
  equal(entity.get("name"), testName, "Default lookups succeeded");
  equal(entity.get("name"), testName, "Default lookups succeeded");
});

test('getCacheKey test', function(assert) {
  let service = this.subject();

  equal(service.getCacheKey("type"), "type");
  equal(service.getCacheKey("type", {a:1}), 'type:{"a":1}');
  equal(service.getCacheKey("type", null, 1), "type:1");
  equal(service.getCacheKey("type", {a:1}, 1), 'type:1:{"a":1}');
});

test('queryRecord test', function(assert) {
  let service = this.subject(),
      testNameSpace = "ns",
      testOptions = {opt: 1},
      testQueryParams = {},
      testUrlParams = {},
      testType = "type",
      testRecord = {},
      testID = 1,
      cacheKey = service.getCacheKey(testType, testQueryParams, testID);

  expect(1 + 5 + 3);

  service.nameSpace = testNameSpace;
  service.checkRequisite = Ember.K;
  service.entityFor = function (type) {
    equal(type, testType);

    return {
      queryRecord: function (loader, id, options, query, urlParams) {
        equal(loader, service, "Loader");
        equal(id, testID, "id");
        equal(options.opt, testOptions.opt, "options");
        equal(query, testQueryParams, "query");
        equal(urlParams, testUrlParams, "urlParams");

        return Ember.RSVP.resolve(testRecord);
      }
    };
  };

  service.cache = Ember.Object.create();
  notOk(service.get("cache").get(cacheKey));
  service.queryRecord(testType, testID, testOptions, testQueryParams, testUrlParams).then(function (record) {
    equal(record, testRecord);
  });
  ok(service.get("cache").get(cacheKey));
});

test('query test', function(assert) {
  let service = this.subject(),
      testNameSpace = "ns",
      testOptions = {opt: 1},
      testQueryParams = {},
      testUrlParams = {},
      testType = "type",
      testRecord = {},
      testRecords = [testRecord, testRecord],
      cacheKey = service.getCacheKey(testType, testQueryParams);

  expect(1 + 4 + 3);

  service.nameSpace = testNameSpace;
  service.checkRequisite = Ember.K;
  service.entityFor = function (type) {
    equal(type, testType);

    return {
      query: function (loader, query, options, urlParams) {
        equal(loader, service, "Loader");
        equal(options.opt, testOptions.opt, "options");
        equal(query, testQueryParams, "query");
        equal(urlParams, testUrlParams, "urlParams");

        return Ember.RSVP.resolve(testRecords);
      }
    };
  };

  service.cache = Ember.Object.create();
  notOk(service.get("cache").get(cacheKey));
  service.query(testType, testQueryParams, testOptions, testUrlParams).then(function (records) {
    equal(records, testRecords);
  });
  ok(service.get("cache").get(cacheKey));
});

test('unloadAll test', function(assert) {
  let testType1 = "a",
      service = this.subject({
        nameSpace: "ns",
        store: {
          peekAll: function (type) {
            equal(type, testType1);
            return [Ember.Object.create({
              id: "ns:id1",
              entityID: "id1"
            }), Ember.Object.create({
              id: "nsX:id1",
              entityID: "id1"
            })];
          },
          unloadRecord: function (record) {
            equal(record.get("entityID"), "id1");
          }
        }
      });

  expect(1 + 1);

  service.unloadAll(testType1, "id2");
});

test('unloadAll skipID test', function(assert) {
  let testType1 = "q",
      service = this.subject({
        nameSpace: "ns",
        store: {
          peekAll: function (type) {
            equal(type, testType1);
            return [Ember.Object.create({
              id: "ns:id1",
              entityID: "id1"
            }), Ember.Object.create({
              id: "ns:id2",
              entityID: "id2"
            })];
          },
          unloadRecord: function (record) {
            equal(record.get("entityID"), "id2");
          }
        }
      });

  expect(1 + 1);

  service.unloadAll(testType1, "id1");
});
