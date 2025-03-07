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

package org.apache.tez.tools.javadoc.model;

public class ConfigProperty {

  private String propertyName;
  private String defaultValue;
  private String description;
  private String type = "string";
  private boolean isPrivate = false;
  private boolean isUnstable = false;
  private boolean isEvolving = false;
  private boolean isValidConfigProp = false;
  private String inferredType;

  public String getPropertyName() {
    return propertyName;
  }

  public void setPropertyName(String propertyName) {
    this.propertyName = propertyName;
  }

  public String getDefaultValue() {
    return defaultValue;
  }

  public void setDefaultValue(String defaultValue) {
    this.defaultValue = defaultValue;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public boolean isPrivate() {
    return isPrivate;
  }

  public void setPrivate(boolean aPrivate) {
    isPrivate = aPrivate;
  }

  public boolean isUnstable() {
    return isUnstable;
  }

  public void setUnstable(boolean unstable) {
    isUnstable = unstable;
  }

  public boolean isEvolving() {
    return isEvolving;
  }

  public void setEvolving(boolean evolving) {
    isEvolving = evolving;
  }

  public boolean isValidConfigProp() {
    return isValidConfigProp;
  }

  public void setValidConfigProp(boolean validConfigProp) {
    isValidConfigProp = validConfigProp;
  }

  public String getInferredType() {
    return inferredType;
  }

  public void setInferredType(String inferredType) {
    this.inferredType = inferredType;
  }

  @Override
  public String toString() {
    return "name=" + getPropertyName()
        + ", defaultValue=" + getDefaultValue()
        + ", description=" + getDescription()
        + ", type=" + getType()
        + ", inferredType=" + getInferredType()
        + ", private=" + isPrivate()
        + ", isConfigProp=" + isValidConfigProp();
  }
}
