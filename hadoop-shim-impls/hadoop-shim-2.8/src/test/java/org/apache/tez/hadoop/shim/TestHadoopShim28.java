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
package org.apache.tez.hadoop.shim;

import static org.junit.jupiter.api.Assertions.*;

import org.apache.hadoop.yarn.api.records.FinalApplicationStatus;

import org.junit.jupiter.api.*;


public class TestHadoopShim28 {

  @Test
  public void testApplyFinalApplicationStatusCorrection() {
    HadoopShim shim = new HadoopShim28();
    // Session mode success/failure, change to ended
    assertEquals(FinalApplicationStatus.ENDED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.SUCCEEDED, true, false));
    assertEquals(FinalApplicationStatus.ENDED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.FAILED, true, false));

    // Non-session mode success/failure, retain success/failure
    assertEquals(FinalApplicationStatus.SUCCEEDED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.SUCCEEDED, false, false));
    assertEquals(FinalApplicationStatus.FAILED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.FAILED, false, false));

    // Session and non-session mode error, retain failed.
    assertEquals(FinalApplicationStatus.FAILED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.FAILED, true, true));
    assertEquals(FinalApplicationStatus.FAILED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.FAILED, false, true));

    // Session and non-session mode killed is killed.
    assertEquals(FinalApplicationStatus.KILLED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.KILLED, true, false));
    assertEquals(FinalApplicationStatus.KILLED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.KILLED, false, false));

    // Session and non-session mode undefined is undefined.
    assertEquals(FinalApplicationStatus.UNDEFINED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.UNDEFINED, true, false));
    assertEquals(FinalApplicationStatus.UNDEFINED,
        shim.applyFinalApplicationStatusCorrection(FinalApplicationStatus.UNDEFINED, false, false));
  }
}
