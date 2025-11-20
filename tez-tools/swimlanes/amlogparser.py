#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

import argparse
import io
import re
import sys
from bz2 import BZ2File
from dataclasses import dataclass, field
from gzip import GzipFile
from itertools import groupby
from pathlib import Path
from typing import IO, Any, Dict, Iterator, List, Optional
from urllib.request import urlopen


@dataclass
class AMRawEvent:
    ts: str
    dag: str
    event: str
    args: str

    def __repr__(self) -> str:
        return f"{self.dag}->{self.event} ({self.args})"


def get_first(iterable: List[Any]) -> Any:
    """Safely returns the first element of a list or None."""
    return iterable[0] if iterable else None


def parse_key_values(args_str: str) -> Dict[str, Any]:
    """Parses comma-separated key=value pairs into a dictionary."""
    kvs: Dict[str, Any] = {}
    # Split by comma, strip whitespace
    pairs = [p.strip() for p in args_str.split(",")]

    for pair in pairs:
        if "=" not in pair:
            # Handle flags (keys without values)
            val = None
            key = pair
        else:
            # Split on the last equals sign to handle values containing equals
            last_eq_index = pair.rfind("=")
            key = pair[:last_eq_index]
            val = pair[last_eq_index + 1 :]

        if key in kvs:
            old_val = kvs[key]
            if isinstance(old_val, list):
                old_val.append(val)
            else:
                kvs[key] = [old_val, val]
        else:
            kvs[key] = val
    return kvs


@dataclass
class Container:
    raw: Optional[AMRawEvent]
    name: str
    start: int
    stop: int = -1
    status: int = 0
    node: str = ""
    kvs: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_event(cls, raw: AMRawEvent) -> "Container":
        kvs = parse_key_values(raw.args)
        return cls(
            raw=raw,
            name=kvs.get("containerId", "Unknown"),
            start=int(kvs.get("launchTime", 0)),
            kvs=kvs,
        )

    def __repr__(self) -> str:
        return f"[{self.name} start={self.start}]"


class DummyContainer(Container):
    def __init__(self, attempt: "Attempt"):
        super().__init__(
            raw=None,
            name=attempt.container,
            start=attempt.start,
            stop=-1,
            status=0,
            node="",
            kvs={},
        )


@dataclass
class Attempt:
    name: str
    task_id: str
    vertex: str
    start: int
    container: str
    node: str
    raw: Optional[AMRawEvent] = None
    finish: int = 0
    duration: int = 0
    kvs: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_events(cls, events: List[AMRawEvent]) -> "Attempt":
        start_event = next(
            (e for e in events if e.event == "TASK_ATTEMPT_STARTED"), None
        )
        finish_event = next(
            (e for e in events if e.event == "TASK_ATTEMPT_FINISHED"), None
        )

        # Use start event for base info, fall back to finish if start missing
        base_event = start_event if start_event else finish_event
        if not base_event:
            raise ValueError("Attempt has no start or finish event")

        kvs = parse_key_values(base_event.args)

        name = kvs.get("taskAttemptId", "Unknown")
        # Heuristic to extract task ID from attempt ID string
        task_id_str = name.rsplit("_", 1)[0].replace("attempt", "task")

        instance = cls(
            name=name,
            task_id=task_id_str,
            vertex=kvs.get("vertexName", ""),
            start=int(kvs.get("startTime", 0)),
            container=kvs.get("containerId", ""),
            node=kvs.get("nodeId", ""),
            raw=finish_event,
            kvs=kvs,
        )

        if finish_event:
            finish_kvs = parse_key_values(finish_event.args)
            instance.kvs.update(finish_kvs)
            instance.finish = int(finish_kvs.get("finishTime", 0))
            instance.duration = int(finish_kvs.get("timeTaken", 0))

        return instance

    def __repr__(self) -> str:
        return f"{self.name} ({self.start}+{self.duration})"


@dataclass
class Task:
    raw: AMRawEvent
    dag_id: str
    vertex: str
    name: str
    start: int
    finish: int
    duration: int
    kvs: Dict[str, Any]
    attempts: List[Attempt] = field(default_factory=list)

    @classmethod
    def from_event(cls, raw: AMRawEvent) -> "Task":
        kvs = parse_key_values(raw.args)
        return cls(
            raw=raw,
            dag_id=raw.dag,
            vertex=kvs.get("vertexName", ""),
            name=kvs.get("taskId", ""),
            start=int(kvs.get("startTime", 0)),
            finish=int(kvs.get("finishTime", 0)),
            duration=int(kvs.get("timeTaken", 0)),
            kvs=kvs,
        )

    def structure(self, all_attempts: List[Attempt]) -> None:
        self.attempts = [a for a in all_attempts if a.task_id == self.name]

    def __repr__(self) -> str:
        return f"{self.name} ({self.start}+{self.duration})"


@dataclass
class Vertex:
    raw: AMRawEvent
    dag_id: str
    name: str
    init_zero: int
    init: int
    start_zero: int
    start: int
    finish: int
    duration: int
    kvs: Dict[str, Any]
    tasks: List[Task] = field(default_factory=list)

    @classmethod
    def from_event(cls, raw: AMRawEvent) -> "Vertex":
        kvs = parse_key_values(raw.args)
        return cls(
            raw=raw,
            dag_id=raw.dag,
            name=kvs.get("vertexName", ""),
            init_zero=int(kvs.get("initRequestedTime", 0)),
            init=int(kvs.get("initedTime", 0)),
            start_zero=int(kvs.get("startRequestedTime", 0)),
            start=int(kvs.get("startedTime", 0)),
            finish=int(kvs.get("finishTime", 0)),
            duration=int(kvs.get("timeTaken", 0)),
            kvs=kvs,
        )

    def structure(self, all_tasks: List[Task]) -> None:
        self.tasks = [t for t in all_tasks if t.vertex == self.name]

    def __repr__(self) -> str:
        return f"{self.name} ({self.start}+{self.duration})"


@dataclass
class DAG:
    raw: AMRawEvent
    name: str
    start: int
    finish: int
    duration: int
    kvs: Dict[str, Any]
    vertexes: List[Vertex] = field(default_factory=list)

    @classmethod
    def from_event(cls, raw: AMRawEvent) -> "DAG":
        kvs = parse_key_values(raw.args)
        return cls(
            raw=raw,
            name=raw.dag,
            start=int(kvs.get("startTime", 0)),
            finish=int(kvs.get("finishTime", 0)),
            duration=int(kvs.get("timeTaken", 0)),
            kvs=kvs,
        )

    def structure(self, all_vertexes: List[Vertex]) -> None:
        self.vertexes = [v for v in all_vertexes if v.dag_id == self.name]

    def attempts(self) -> Iterator[Attempt]:
        for v in self.vertexes:
            for t in v.tasks:
                for a in t.attempts:
                    yield a

    def __repr__(self) -> str:
        return f"{self.name} ({self.start}+{self.duration})"


@dataclass
class AppMaster:
    raw: Optional[AMRawEvent]
    name: str
    zero: int
    kvs: Dict[str, Any]
    containers: Dict[str, Container] = field(default_factory=dict)
    dags: List[DAG] = field(default_factory=list)

    @classmethod
    def from_event(cls, raw: AMRawEvent) -> "AppMaster":
        kvs = parse_key_values(raw.args)
        return cls(
            raw=raw,
            name=kvs.get("appAttemptId", "Unknown"),
            zero=int(kvs.get("startTime", 0)),
            kvs=kvs,
        )

    def __repr__(self) -> str:
        return f"[{self.name} started at {self.zero}]"


class DummyAppMaster(AppMaster):
    def __init__(self, dag: DAG):
        super().__init__(
            raw=None,
            name=f"Appmaster for {dag.name}",
            zero=dag.start,
            kvs={},
            containers={},
            dags=[],
        )


def open_log_stream(filename: str) -> IO[str]:
    """Opens a log file, handling GZ, BZ2, and HTTP sources."""
    if filename.startswith("http://") or filename.startswith("https://"):
        return io.TextIOWrapper(urlopen(filename), encoding="utf-8", errors="replace")

    path = Path(filename)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filename}")

    if filename.endswith(".gz"):
        return GzipFile(filename, mode="rt", encoding="utf-8", errors="replace")
    elif filename.endswith(".bz2"):
        return BZ2File(filename, mode="rt", encoding="utf-8", errors="replace")
    else:
        return open(filename, mode="rt", encoding="utf-8", errors="replace")


class AMLog:
    # Compiled regex for performance and readability
    LOG_PATTERN = re.compile(
        r"""
        ^
        (?P<ts>[0-9:\-, ]*)             # Timestamp
        \s+
        [^|]* # Log Level / Thread info (skipped)
        \|?                             # Optional Separator
        (?:                             # Java Class definitions
          HistoryEventHandler\.criticalEvents|
          (?:org\.apache\.tez\.dag\.)?history\.HistoryEventHandler
        )
        \|?:                            # Separator
        \s+
        \[HISTORY\]
        \[DAG:(?P<dag>[^\]]*)\]         # DAG ID
        \[Event:(?P<event>[^\]]*)\]     # Event Type
        :\s+
        (?P<args>.*)                    # Arguments
        """,
        re.VERBOSE,
    )

    def __init__(self, filename: str):
        self.events: List[AMRawEvent] = []
        with open_log_stream(filename) as f:
            self.events = [
                parsed
                for line in f
                if (parsed := self.parse_line(line.strip())) is not None
            ]

    def parse_line(self, line: str) -> Optional[AMRawEvent]:
        if "[HISTORY]" not in line:
            return None

        match = self.LOG_PATTERN.search(line)
        if match:
            return AMRawEvent(
                ts=match.group("ts"),
                dag=match.group("dag"),
                event=match.group("event"),
                args=match.group("args"),
            )
        return None

    def structure(self) -> AppMaster:
        # 1. Extract Basic Entities (Using Dictionaries to Dedup)
        am_list = [
            AppMaster.from_event(e) for e in self.events if e.event == "AM_STARTED"
        ]
        am = get_first(am_list)

        # Dedup DAGs, Vertices, and Tasks by ID using Dict comprehensions
        # This prevents duplicate entries if log lines are repeated
        dags_map = {
            e.dag: DAG.from_event(e)
            for e in self.events
            if e.event == "DAG_FINISHED"
        }
        dags = list(dags_map.values())

        vertex_map = {
            parse_key_values(e.args).get("vertexName"): Vertex.from_event(e)
            for e in self.events
            if e.event == "VERTEX_FINISHED"
        }
        # Filter out None keys if parsing failed for some reason
        vertexes = [v for k, v in vertex_map.items() if k]

        task_map = {
            parse_key_values(e.args).get("taskId"): Task.from_event(e)
            for e in self.events
            if e.event == "TASK_FINISHED"
        }
        tasks = [t for k, t in task_map.items() if k]

        # 2. Process Containers
        containers_list = [
            Container.from_event(e)
            for e in self.events
            if e.event == "CONTAINER_LAUNCHED"
        ]
        # Map handles dedup for containers implicitly by ID
        container_map = {c.name: c for c in containers_list}

        for ev in self.events:
            if ev.event == "CONTAINER_STOPPED":
                kvs = parse_key_values(ev.args)
                c_id = kvs.get("containerId")
                if c_id in container_map:
                    container_map[c_id].stop = int(kvs.get("stoppedTime", -1))
                    container_map[c_id].status = int(kvs.get("exitStatus", 0))

        # 3. Process Attempts
        attempt_events = [
            e
            for e in self.events
            if e.event in ("TASK_ATTEMPT_STARTED", "TASK_ATTEMPT_FINISHED")
        ]

        def get_attempt_id(ev: AMRawEvent) -> str:
            start = ev.args.find("taskAttemptId=") + 14
            end = ev.args.find(",", start)
            if end == -1:
                return ev.args[start:]
            return ev.args[start:end]

        attempt_events.sort(key=get_attempt_id)

        attempts: List[Attempt] = []
        for _, group in groupby(attempt_events, key=get_attempt_id):
            group_list = list(group)
            try:
                attempts.append(Attempt.from_events(group_list))
            except ValueError:
                continue

        # 4. Link Structures
        for t in tasks:
            t.structure(attempts)

        for v in vertexes:
            v.structure(tasks)

        for d in dags:
            d.structure(vertexes)

        # Link Attempts to Nodes via Containers
        for a in attempts:
            if a.container in container_map:
                c = container_map[a.container]
                c.node = a.node
            else:
                c = DummyContainer(a)
                container_map[a.container] = c

        # 5. Final Assembly
        if not am:
            if dags:
                am = DummyAppMaster(dags[0])
            else:
                am = AppMaster(None, "Unknown", 0, {})

        am.containers = container_map
        am.dags = dags
        return am


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse Tez AM Logs.")
    parser.add_argument(
        "logfile", help="Path to the AM log file (text, .gz, .bz2, or URL)"
    )
    args = parser.parse_args()

    try:
        log_parser = AMLog(args.logfile)
        am_structure = log_parser.structure()

        for d in am_structure.dags:
            for a in d.attempts():
                print([a.vertex, a.name, a.container, a.start, a.finish])

    except Exception as e:
        print(f"Error parsing log: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
