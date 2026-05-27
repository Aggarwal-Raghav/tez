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

import SQL from '../../../utils/sql';
import ColumnDefinition from '../../../utils/column-definition';
import { module, test } from 'qunit';

module('Unit | Utility | sql');

test('Class creation test', function(assert) {
  var sql = SQL.create();

  ok(sql.constructQuery);
  ok(sql.validateClause);
  ok(sql.normaliseClause);
  ok(sql.search);
});

test('constructQuery test', function(assert) {
  var sql = SQL.create();

  equal(sql.constructQuery("x = y"), "SELECT * FROM ? WHERE x = y");
});

test('validateClause test', function(assert) {
  var sql = SQL.create();

  ok(sql.validateClause("x = y"));
  ok(sql.validateClause("x = y AND a = b"));
  ok(sql.validateClause("(x = y OR y = z) AND a = b"));
  ok(sql.validateClause("x BETWEEN 1 AND 2"));

  notOk(sql.validateClause("foo"));
  notOk(sql.validateClause("foo bar"));
  notOk(sql.validateClause("^[a-z0-9_-]{3,16}$"));
  notOk(sql.validateClause("^[a-z0-9_-]{6,18}$"));
  notOk(sql.validateClause("^[a-z0-9-]+$"));
});

test('normaliseClause test', function(assert) {
  var sql = SQL.create(),
      column = ColumnDefinition.create({
        headerTitle: "Column Header",
        id: "columnID",
        contentPath: "col"
      });

  equal(sql.normaliseClause('"Column Header" = value', [column]), "columnID = value");
  equal(sql.normaliseClause('"Another Column Header" = value', [column]), '"Another Column Header" = value');
});

test('search test', function(assert) {
  var sql = SQL.create(),
      data = [{
        colA: "x1",
        colB: "y1"
      }, {
        colA: "x2",
        colB: "y2"
      }, {
        colA: "x1",
        colB: "y3"
      }],
      columns = [ColumnDefinition.create({
        headerTitle: "Column A",
        id: "colA",
        contentPath: "colA"
      })];

  var result = sql.search('"Column A" = "x1"', data, columns);

  equal(result.length, 2);
  equal(result[0].colB, "y1");
  equal(result[1].colB, "y3");
});
