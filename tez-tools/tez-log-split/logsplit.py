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
import gzip
import re
import sys
from pathlib import Path
from typing import IO, Optional, TextIO


def open_log_file(filename: Path) -> TextIO:
    """Opens a log file (text or gzip) with error replacement."""
    if filename.suffix == ".gz":
        return gzip.open(filename, mode="rt", encoding="utf-8", errors="replace")
    return open(filename, mode="rt", encoding="utf-8", errors="replace")


class AggregatedLog:
    # Regex constants
    HEADER_CONTAINER_RE = re.compile(r"Container: (container_[a-z0-9_]+) on (.*)")
    HEADER_LAST_ROW_RE = re.compile(r"^LogContents:$")
    HEADER_LOG_TYPE_RE = re.compile(r"^LogType:(.*)")
    # Matches "End of LogType:..."
    LAST_LOG_LINE_RE = re.compile(r"^End of LogType:.*")

    def __init__(self, output_base_dir: Path):
        self.output_base_dir = output_base_dir
        self.in_container = False
        self.in_logfile = False

        # State variables
        self.current_container_header: str = ""
        self.current_container_name: Optional[str] = None
        self.current_host_name: Optional[str] = None
        self.current_file_handle: Optional[IO] = None

        # Ensure output directory exists
        if not self.output_base_dir.exists():
            self.output_base_dir.mkdir(parents=True, exist_ok=True)

    def close_current_file(self) -> None:
        """Safely closes the currently open file handle."""
        if self.current_file_handle:
            self.current_file_handle.close()
            self.current_file_handle = None

    def start_container_folder(self) -> Path:
        """Creates the directory structure for the current container."""
        if not self.current_host_name or not self.current_container_name:
            raise ValueError("Missing container or host name.")

        # Structure: output/hostname/container_id
        container_dir = (
            self.output_base_dir
            / self.current_host_name
            / self.current_container_name
        )
        container_dir.mkdir(parents=True, exist_ok=True)
        return container_dir

    def create_file_in_current_container(self, file_name: str) -> None:
        """Opens a new file within the current container directory."""
        self.close_current_file()

        container_dir = self.start_container_folder()
        target_path = container_dir / file_name.strip()

        self.current_file_handle = open(target_path, "w", encoding="utf-8")

    def write_to_current_file(self, line: str) -> None:
        if self.current_file_handle:
            self.current_file_handle.write(line)

    def parse_line(self, line: str) -> None:
        if self.in_container:
            if self.in_logfile:
                # We are inside a specific log (e.g., syslog)
                if self.LAST_LOG_LINE_RE.match(line):
                    self.in_container = False
                    self.in_logfile = False
                    self.close_current_file()
                else:
                    self.write_to_current_file(line)
            else:
                # We are inside a container block, looking for a LogType header
                log_type_match = self.HEADER_LOG_TYPE_RE.match(line)

                if log_type_match:
                    file_name = log_type_match.group(1)
                    self.create_file_in_current_container(file_name)

                elif self.HEADER_LAST_ROW_RE.match(line):
                    self.in_logfile = True
                    # Write the container header into the log for reference
                    self.write_to_current_file(self.current_container_header)
        else:
            # scan for new container block
            container_match = self.HEADER_CONTAINER_RE.match(line)
            self.current_container_header = line

            if container_match:
                self.in_container = True
                self.current_container_name = container_match.group(1)
                self.current_host_name = container_match.group(2).strip()
                self.start_container_folder()

    def process(self, input_file_path: Path) -> None:
        try:
            with open_log_file(input_file_path) as f:
                for line in f:
                    self.parse_line(line)
        finally:
            # Ensure cleanup if log ends abruptly
            self.close_current_file()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split aggregated YARN logs into individual files per container."
    )
    parser.add_argument(
        "logfile", type=Path, help="Path to the aggregated log file (text or .gz)"
    )
    args = parser.parse_args()

    if not args.logfile.exists():
        print(f"Error: File '{args.logfile}' not found.", file=sys.stderr)
        sys.exit(1)

    # Define output folder name based on input filename
    output_folder = args.logfile.parent / (args.logfile.stem + "_splitlogs")

    splitter = AggregatedLog(output_folder)

    try:
        print(f"Processing {args.logfile}...")
        splitter.process(args.logfile)
        print(f"Split application logs written to: {output_folder}")
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
