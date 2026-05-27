/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.junit;

import org.junit.jupiter.api.Assertions;

/**
 * A JUnit 4 polyfill for Hadoop test utilities (e.g. MiniYARNCluster)
 * that are hardcoded to invoke org.junit.Assert.
 * This class simply delegates the legacy calls to JUnit 5 (Jupiter).
 */
public class Assert {

    public static void assertTrue(String message, boolean condition) {
        Assertions.assertTrue(condition, message);
    }

    public static void assertTrue(boolean condition) {
        Assertions.assertTrue(condition);
    }

    public static void assertFalse(String message, boolean condition) {
        Assertions.assertFalse(condition, message);
    }

    public static void assertFalse(boolean condition) {
        Assertions.assertFalse(condition);
    }

    public static void fail(String message) {
        Assertions.fail(message);
    }

    public static void assertEquals(Object expected, Object actual) {
        Assertions.assertEquals(expected, actual);
    }

    public static void assertEquals(String message, Object expected, Object actual) {
        Assertions.assertEquals(expected, actual, message);
    }

    public static void assertNull(Object object) {
        Assertions.assertNull(object);
    }

    public static void assertNull(String message, Object object) {
        Assertions.assertNull(object, message);
    }

    public static void assertNotNull(Object object) {
        Assertions.assertNotNull(object);
    }

    public static void assertNotNull(String message, Object object) {
        Assertions.assertNotNull(object, message);
    }
}
