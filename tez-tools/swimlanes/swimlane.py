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
import sys
from typing import Any, Dict, Generator, Optional, Tuple

# Assumes amlogparser.py is in the same directory
try:
    from amlogparser import AMLog
except ImportError:
    print("Error: amlogparser module not found. Please ensure amlogparser.py is present.", file=sys.stderr)
    sys.exit(1)


class ColorManager:
    """Manages a cycle of pastel colors for SVG elements."""

    def __init__(self) -> None:
        self.colors = [
            "#E4F5FC", "#62C2A2", "#E2F2D8", "#A9DDB4", "#E2F6E1", "#D8DAD7",
            "#BBBDBA", "#FEE6CE", "#FFCF9F", "#FDAE69", "#FDE4DD", "#EDE6F2",
            "#A5BDDB", "#FDE1EE", "#D8B9D8", "#D7DCEC", "#BABDDA", "#FDC5BF",
            "#FC9FB3", "#FDE1D2", "#FBBB9E", "#DBEF9F", "#AADD8E", "#81CDBB",
            "#C7EDE8", "#96D9C8", "#E3EBF4", "#BAD3E5", "#9DBDD9", "#8996C8",
            "#CEEAC6", "#76CCC6", "#C7E9BE", "#9ED99C", "#71C572", "#EFF1EE",
            "#949693", "#FD8D3D", "#FFF7ED", "#FED3AE", "#FEBB8F", "#FCE9CA",
            "#FED49B", "#FBBC85", "#FB8E58", "#FFEEE8", "#D0D0E8", "#76A9CE",
            "#FDFFFC", "#E9E2EE", "#64A8D2", "#FAF7FC", "#F6ECF2", "#F8E7F0",
            "#C994C6", "#E063B1", "#ECEDF7", "#DDD9EB", "#9B9BCA", "#FEDFDE",
            "#F8689F", "#FC9273", "#FC6948", "#F6FDB6", "#78C67B", "#EBF9B0",
            "#C5E9B0", "#40B7C7", "#FDF7BA", "#FFE392", "#FFC34C", "#FF982A",
        ]
        self.index = 0

    def next(self) -> str:
        """Returns the next color in the cycle."""
        color = self.colors[self.index % len(self.colors)]
        self.index += 1
        return color


class SVGGenerator:
    """Helper class to generate SVG XML content."""

    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height
        self.buffer = io.StringIO()

        # XML Header
        self.buffer.write('<?xml version="1.0" standalone="no"?>\n')
        self.buffer.write('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ')
        self.buffer.write('"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n')

        # SVG Open Tag
        self.buffer.write(
            f'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" '
            f'xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'height="{height}" width="{width}">\n'
        )
        # Script injection (Legacy support from original script)
        self.buffer.write(
            '<script type="text/ecmascript" '
            'xlink:href="http://code.jquery.com/jquery-2.1.1.min.js" />\n'
        )

    def _format_attrs(self, kwargs: Dict[str, Any]) -> str:
        """Formats dictionary args into XML attributes (replacing _ with -)."""
        return " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in kwargs.items())

    def line(
        self, x1: int, y1: int, x2: int, y2: int, style: str = "stroke: #000", **kwargs: Any
    ) -> None:
        attrs = self._format_attrs(kwargs)
        self.buffer.write(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" style="{style}" {attrs} />\n'
        )

    def rect(
        self,
        left: int,
        top: int,
        right: int,
        bottom: int,
        style: str = "",
        title: str = "",
        link: Optional[str] = None,
    ) -> None:
        width = right - left
        height = bottom - top

        if link:
            self.buffer.write(f"<a xlink:href='{link}'>")

        self.buffer.write(
            f'<rect x="{left}" y="{top}" width="{width}" height="{height}" '
            f'style="{style}"><title>{title}</title></rect>\n'
        )

        if link:
            self.buffer.write("</a>\n")

    def text(
        self, x: int, y: int, text: str, style: str = "", transform: str = ""
    ) -> None:
        self.buffer.write(
            f'<text x="{x}" y="{y}" style="{style}" transform="{transform}">{text}</text>\n'
        )

    def get_content(self) -> str:
        """Closes the SVG tag and returns the full string."""
        self.buffer.write("</svg>")
        return self.buffer.getvalue()


def get_attempts_generator(tree: Any) -> Generator[Tuple[str, str, str, int, int], None, None]:
    """Yields attempt data (vertex, name, container, start, finish)."""
    for d in tree.dags:
        for a in d.attempts():
            yield (a.vertex, a.name, a.container, a.start, a.finish)


def generate_swimlane(
    log_file: str, output_file: Optional[str], ticks_arg: int, fraction: float
) -> None:
    """Main logic to parse logs and generate the SVG swimlane."""

    # Parse the log
    try:
        log = AMLog(log_file).structure()
    except Exception as e:
        print(f"Failed to parse log file: {e}", file=sys.stderr)
        sys.exit(1)

    # Sort containers by start time
    sorted_containers = sorted(log.containers.values(), key=lambda a: a.start)
    lanes = [c.name for c in sorted_containers]

    # Layout Configuration
    margin_top = 128
    margin_right = 100
    lane_size = 24

    # Determine Grid Dimensions
    items = list(get_attempts_generator(log))
    if not items:
        print("No attempts found in the log.", file=sys.stderr)
        sys.exit(0)

    max_x_timestamp = max([a[4] for a in items]) # a[4] is finish time

    # Calculate ticks (ms per pixel)
    ticks = ticks_arg
    if ticks == -1:
        # Heuristic: fit roughly 2000px width
        time_span = max_x_timestamp - log.zero
        ticks = int(min(1000, time_span // 2048))
        if ticks == 0:
            ticks = 1

    def x_domain(t: int) -> int:
        """Maps a timestamp to an X coordinate."""
        return int((t - log.zero) // ticks)

    max_x_coord = x_domain(max_x_timestamp)
    total_height = len(lanes) * lane_size

    # Initialize SVG
    svg_width = max_x_coord + 2 * margin_right + 256
    svg_height = total_height + 2 * margin_top
    svg = SVGGenerator(svg_width, svg_height)

    # --- Draw Header & Grid ---
    current_y = margin_top

    # Title
    svg.text(max_x_coord // 2, 32, log.name, style="font-size: 32px; text-anchor: middle")

    # Y-Axis Header
    svg.text(
        margin_right - 16,
        margin_top - 32,
        "Container ID",
        style="text-anchor:end; font-size: 16px;",
    )

    container_map = {name: idx for idx, name in enumerate(lanes)}

    # Draw Rows (Lanes)
    for lane_name in lanes:
        current_y += lane_size
        svg.text(
            margin_right - 4, current_y, lane_name, style="text-anchor:end; font-size: 16px;"
        )
        svg.line(
            margin_right, current_y, margin_right + max_x_coord, current_y, style="stroke: #ccc"
        )

    # Draw Time Axis (Vertical Grid Lines)
    step = 10 * ticks
    # Ensure step is positive to avoid infinite loop in range
    if step <= 0:
        step = 10

    time_markers = set(range(0, max_x_coord, step)) | {max_x_coord}
    for x_pos in time_markers:
        time_sec = (x_pos * ticks) / 1000
        svg.text(
            margin_right + x_pos,
            margin_top - (lane_size // 2),
            f"{time_sec:.2f} s",
            style="text-anchor: middle; font-size: 12px",
        )
        svg.line(
            margin_right + x_pos,
            margin_top - (lane_size // 2),
            margin_right + x_pos,
            margin_top + total_height,
            style="stroke: #ddd",
        )

    # Draw Bounding Box
    svg.line(margin_right, margin_top, margin_right + max_x_coord, margin_top)
    svg.line(margin_right, total_height + margin_top, margin_right + max_x_coord, total_height + margin_top)
    svg.line(margin_right, margin_top, margin_right, total_height + margin_top)
    svg.line(
        margin_right + max_x_coord,
        margin_top,
        margin_right + max_x_coord,
        total_height + margin_top,
    )

    # --- Draw Containers (Life-cycles) ---
    for c in log.containers.values():
        y1 = margin_top + (container_map[c.name] * lane_size)
        x1 = margin_right + x_domain(c.start)

        # Start marker
        svg.line(x1, y1, x1, y1 + lane_size, style="stroke: green")

        if c.stop > c.start:
            x2 = margin_right + x_domain(c.stop)
            if c.status == 0:
                svg.line(x2, y1, x2, y1 + lane_size, style="stroke: green")
            else:
                # Error/Failure marker
                svg.line(x2, y1, x2, y1 + lane_size, style="stroke: red")
                svg.text(
                    x2,
                    y1,
                    str(c.status),
                    style="text-anchor: right; font-size: 12px; stroke: red",
                    transform=f"rotate(90, {x2}, {y1})",
                )
            # Container active background
            svg.rect(x1, y1, x2, y1 + lane_size, style="fill: #ccc; opacity: 0.3")
        elif c.stop == -1:
            # Running until end
            x2 = margin_right + max_x_coord
            svg.rect(x1, y1, x2, y1 + lane_size, style="fill: #ccc; opacity: 0.3")

    # --- Draw DAGs and Tasks ---
    color_manager = ColorManager()

    for dag in log.dags:
        dag_x1 = margin_right + x_domain(dag.start)
        dag_x2 = margin_right + x_domain(dag.finish)

        # DAG Start/Finish Lines
        svg.line(
            dag_x1,
            margin_top - 24,
            dag_x1,
            margin_top + total_height,
            style="stroke: black;",
            stroke_dasharray="8,4",
        )
        svg.line(
            dag_x2,
            margin_top - 24,
            dag_x2,
            margin_top + total_height,
            style="stroke: black;",
            stroke_dasharray="8,4",
        )

        # DAG Label line
        svg.line(dag_x1, margin_top - 24, dag_x2, margin_top - 24, style="stroke: black")
        duration_sec = (dag.finish - dag.start) / 1000.0
        svg.text(
            (dag_x1 + dag_x2) // 2,
            margin_top - 32,
            f"{dag.name} ({duration_sec:.1f} s)",
            style="text-anchor: middle; font-size: 12px;",
        )

        # Assign colors to Vertices
        vertex_names = sorted({v.name for v in dag.vertexes})
        color_map = {v_name: color_manager.next() for v_name in vertex_names}

        # Draw Task Attempts
        for attempt in dag.attempts():
            color = color_map.get(attempt.vertex, "#ffffff")

            # Ensure container exists in map (might be missing if log is partial)
            if attempt.container not in container_map:
                continue

            y1 = margin_top + (container_map[attempt.container] * lane_size) + 1
            x1 = margin_right + x_domain(attempt.start)
            x2 = margin_right + x_domain(attempt.finish)
            y2 = y1 + lane_size - 2

            # Data Locality Logic
            # 0 = No locality, 1 = Data Local, 2 = Rack Local (approximate)
            is_data_local = 1 if "DATA_LOCAL_TASKS" in attempt.kvs else 0
            is_rack_local = 2 if "RACK_LOCAL_TASKS" in attempt.kvs else 0
            locality = is_data_local + is_rack_local

            link = attempt.kvs.get("completedLogs", "")

            # Draw Task Box
            svg.rect(
                x1,
                y1,
                x2,
                y2,
                title=attempt.name,
                style=f"fill: {color}; stroke: #ccc;",
                link=link,
            )

            # Draw Locality Indicator (Red strip at bottom)
            if locality > 1:
                svg.rect(
                    x1,
                    y2 - 4,
                    x2,
                    y2,
                    style="fill: #f00; fill-opacity: 0.5;",
                    link=link,
                )

            # Draw Label (if wide enough)
            label_x = (x1 + x2) // 2
            label_y = y2 - 12

            if x2 - x1 > 64:
                label_text = f"{attempt.vertex} ({attempt.tasknum:05d}_{attempt.attemptnum})"
            else:
                label_text = f"{attempt.vertex}"

            svg.text(
                label_x,
                label_y,
                label_text,
                style="text-anchor: middle; font-size: 9px;",
            )

        # Draw "Fraction" line (e.g., 90% completion mark)
        finishes = sorted([c.finish for c in dag.attempts()])
        if len(finishes) > 10 and fraction > 0:
            idx = int(len(finishes) * fraction)
            # Clamp index
            idx = min(idx, len(finishes) - 1)

            percent_x_ts = finishes[idx]
            px_x_coord = margin_right + x_domain(percent_x_ts)

            svg.line(
                px_x_coord,
                margin_top,
                px_x_coord,
                total_height + margin_top,
                style="stroke: red",
            )

            percent_duration = (percent_x_ts - dag.start) / 1000.0
            svg.text(
                px_x_coord,
                total_height + margin_top + 12,
                f"{int(fraction * 100)}% ({percent_duration:.1f}s)",
                style="font-size:12px; text-anchor: middle",
            )

    # Output
    content = svg.get_content()

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Output svg written to: {output_file}")
    else:
        sys.stdout.write(content)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a swimlane SVG from Tez/YARN logs."
    )
    parser.add_argument("logfile", help="Path to the log file (grep HISTORY output)")
    parser.add_argument(
        "-t",
        "--ticks",
        type=int,
        default=-1,
        help="Milliseconds per pixel (default: auto-calculated)",
    )
    parser.add_argument(
        "-o", "--output", help="Output SVG file path (default: stdout)"
    )
    parser.add_argument(
        "-f",
        "--fraction",
        type=int,
        default=-1,
        help="Redline fraction percentage (0-100), draws a line at X% task completion",
    )

    args = parser.parse_args()

    # Normalize fraction
    fraction_val = -1.0
    if args.fraction >= 0:
        fraction_val = args.fraction / 100.0

    generate_swimlane(args.logfile, args.output, args.ticks, fraction_val)


if __name__ == "__main__":
    main()
