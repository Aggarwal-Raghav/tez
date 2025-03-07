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

import java.util.Map;
import java.util.TreeMap;

public class Config {

  private final String templateName;
  private final String configName;
  private Map<String, ConfigProperty> configProperties;

  public Config(String configName, String templateName) {
    this.configName = configName;
    this.templateName = templateName;
    this.setConfigProperties(new TreeMap<String, ConfigProperty>());
  }

  public String getTemplateName() {
    return templateName;
  }

  public String getConfigName() {
    return configName;
  }

  public Map<String, ConfigProperty> getConfigProperties() {
    return configProperties;
  }

  public void setConfigProperties(Map<String, ConfigProperty> configProperties) {
    this.configProperties = configProperties;
  }
}
