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
import json
import sys
import zipfile
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Dict, Optional

# Check for texttable dependency
try:
    from texttable import Texttable
except ImportError:
    print(
        "Could not import Texttable. Please run: pip install texttable", file=sys.stderr
    )
    sys.exit(1)


def extract_zip(filename: Path, target_dir: Path) -> Path:
    """Extracts a zip file to a specific directory."""
    file_stem = filename.stem
    extract_path = target_dir / file_stem

    if not extract_path.exists():
        extract_path.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(filename, "r") as zip_ref:
        zip_ref.extractall(extract_path)

    return extract_path


def load_dag_json(extracted_dir: Path) -> Dict[str, Any]:
    """
    Locates and loads the DAG JSON data from an extracted directory.
    Handles differences between Tez UI (dag.json) and DebugTool (TEZ_DAG).
    """
    dag_json_path = extracted_dir / "dag.json"
    tez_dag_path = extracted_dir / "TEZ_DAG"

    target_file: Optional[Path] = None
    is_ui_format = True

    if dag_json_path.is_file():
        target_file = dag_json_path
    elif tez_dag_path.is_file():
        target_file = tez_dag_path
        is_ui_format = False

    if not target_file:
        raise FileNotFoundError(
            f"Unable to find dag.json or TEZ_DAG inside {extracted_dir}"
        )

    with target_file.open("r", encoding="utf-8") as f:
        data = json.load(f)
        # Tez UI wraps content in a "dag" root node; DebugTool might not
        return data.get("dag", data) if is_ui_format else data


def calculate_diff(file1: Path, file2: Path, temp_dir: Path) -> Dict[str, Any]:
    """Calculates the difference between counters in two ZIP files."""

    # Extract and Load
    dir1 = extract_zip(file1, temp_dir)
    dir2 = extract_zip(file2, temp_dir)

    data1 = load_dag_json(dir1)
    data2 = load_dag_json(dir2)

    diff_table: Dict[str, Any] = {}

    # Process File 1
    counters1 = data1.get("otherinfo", {}).get("counters", {})
    for group in counters1.get("counterGroups", []):
        group_name = group["counterGroupName"]
        counter_map = {}
        for counter in group["counters"]:
            counter_name = counter["counterName"]
            # Store as list for mutability: [val1]
            counter_map[counter_name] = [counter["counterValue"]]
        diff_table[group_name] = counter_map

    # Add 'otherinfo' metrics for File 1
    other_info1 = data1.get("otherinfo", {})
    other_metrics = [
        ("TIME_TAKEN", "timeTaken"),
        ("COMPLETED_TASKS", "numCompletedTasks"),
        ("SUCCEEDED_TASKS", "numSucceededTasks"),
        ("FAILED_TASKS", "numFailedTasks"),
        ("KILLED_TASKS", "numKilledTasks"),
        ("FAILED_TASK_ATTEMPTS", "numFailedTaskAttempts"),
        ("KILLED_TASK_ATTEMPTS", "numKilledTaskAttempts"),
    ]

    diff_table["otherinfo"] = {}
    for metric_key, json_key in other_metrics:
        val = other_info1.get(json_key, 0)
        diff_table["otherinfo"][metric_key] = [val]

    # Process File 2 and Compare
    counters2 = data2.get("otherinfo", {}).get("counters", {})
    for group in counters2.get("counterGroups", []):
        group_name = group["counterGroupName"]
        if group_name not in diff_table:
            diff_table[group_name] = {}

        current_group = diff_table[group_name]

        for counter in group["counters"]:
            counter_name = counter["counterName"]
            val2 = counter["counterValue"]

            # If counter missing in file1, init with 0
            if counter_name not in current_group:
                current_group[counter_name] = [0]

            current_group[counter_name].append(val2)

    # Append 'otherinfo' metrics for File 2
    other_info2 = data2.get("otherinfo", {})
    for metric_key, json_key in other_metrics:
        val = other_info2.get(json_key, 0)
        # Ensure list exists (in case file 1 was empty/broken, though unlikely)
        if metric_key not in diff_table["otherinfo"]:
             diff_table["otherinfo"][metric_key] = [0]
        diff_table["otherinfo"][metric_key].append(val)

    # Compute Deltas
    for _, group_data in diff_table.items():
        for _, values in group_data.items():
            # If value does not exist in file2, add 0
            if len(values) == 1:
                values.append(0)

            val1 = values[0]
            val2 = values[1]
            delta = val2 - val1

            # Format delta string (e.g., "+100" or "-50")
            delta_str = ("+" if delta > 0 else "") + str(delta)
            values.append(delta_str)

    return diff_table


def print_table(
    diff_table: Dict[str, Any], name1: str, name2: str, detailed: bool = False
) -> None:
    """Formats and prints the difference table."""
    table = Texttable(max_width=0)
    table.set_cols_align(["l", "l", "l", "l", "l"])
    table.set_cols_valign(["m", "m", "m", "m", "m"])

    # Header
    table.add_row(["Counter Group", "Counter Name", name1, name2, "Delta"])

    for group_name in sorted(diff_table.keys()):
        # Filter internal task counters unless detailed view is requested
        if not detailed and ("_INPUT_" in group_name or "_OUTPUT_" in group_name):
            continue

        group_data = diff_table[group_name]

        # Prepare columns
        c_names = []
        c_val1 = []
        c_val2 = []
        c_delta = []

        for key, values in group_data.items():
            c_names.append(key)
            c_val1.append(str(values[0]))
            c_val2.append(str(values[1]))
            c_delta.append(str(values[2]))

        # Format Group Name (Shorten unless detailed)
        display_group_name = (
            group_name if detailed else group_name.split(".")[-1]
        )

        row = [
            display_group_name,
            "\n".join(c_names),
            "\n".join(c_val1),
            "\n".join(c_val2),
            "\n".join(c_delta),
        ]
        table.add_row(row)

    print(table.draw() + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare TeZ counters between two DAG zip files."
    )
    parser.add_argument("file1", type=Path, help="Path to the first DAG zip file")
    parser.add_argument("file2", type=Path, help="Path to the second DAG zip file")
    parser.add_argument(
        "--detail", action="store_true", help="Show detailed task-specific counters"
    )

    args = parser.parse_args()

    if not args.file1.exists():
        print(f"Error: File '{args.file1}' does not exist.", file=sys.stderr)
        sys.exit(1)
    if not args.file2.exists():
        print(f"Error: File '{args.file2}' does not exist.", file=sys.stderr)
        sys.exit(1)

    # Use a temporary directory context manager for automatic cleanup
    with TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        try:
            diff_data = calculate_diff(args.file1, args.file2, temp_dir)
            print_table(
                diff_data, args.file1.stem, args.file2.stem, detailed=args.detail
            )
        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
