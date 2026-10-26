"""NumPy engine for Conway's 2D Game of Life, driven over stdin/stdout.

The Node backend (``game-of-life-bridge.ts``) starts this script once and keeps
it alive. Protocol: newline-delimited JSON.

Request (one line on stdin)::

    {"command": "next", "grid": [[0, 1, ...], ...]}

Response (one line on stdout), exactly one per request line, in order::

    {"grid": [[...], ...]}      on success
    {"error": "<message>"}       on any invalid request

Answering every line (including invalid ones) keeps the bridge's FIFO of pending
requests aligned with the responses.
"""

from __future__ import annotations

import json
import sys
from typing import Any, TextIO

import numpy as np

Grid = list[list[int]]


def next_generation(grid: Grid) -> Grid:
    """Compute the next generation on a toroidal (wrap-around) board.

    Uses B3/S23 rules. Neighbour counts are computed by summing the eight
    shifted copies of the board with ``np.roll``, which gives the wrap-around
    behaviour for free and avoids Python-level loops.

    Args:
        grid: Rectangular 2D list of 0/1 cells.

    Returns:
        The next generation as a new 2D list of ints, same shape as ``grid``.

    Raises:
        ValueError: If ``grid`` is not a non-empty rectangular 2D grid of 0/1.
    """
    board = _to_board(grid)
    neighbors = sum(
        np.roll(np.roll(board, dy, axis=0), dx, axis=1)
        for dy in (-1, 0, 1)
        for dx in (-1, 0, 1)
        if (dy, dx) != (0, 0)
    )
    birth = (board == 0) & (neighbors == 3)
    survive = (board == 1) & ((neighbors == 2) | (neighbors == 3))
    return (birth | survive).astype(int).tolist()


def _to_board(grid: Any) -> np.ndarray:
    """Validate ``grid`` and convert it to a 2D int NumPy array."""
    if not isinstance(grid, list) or not grid:
        raise ValueError("grid must be a non-empty list of rows")
    try:
        board = np.array(grid, dtype=int)
    except (TypeError, ValueError) as exc:
        raise ValueError("grid must be a rectangular list of integer rows") from exc
    if board.ndim != 2 or board.shape[1] == 0:
        raise ValueError("grid must be a non-empty rectangular 2D list")
    if not np.isin(board, (0, 1)).all():
        raise ValueError("grid cells must be 0 or 1")
    return board


def handle_request(line: str) -> dict[str, Any]:
    """Process one protocol line and build the response object.

    Args:
        line: One JSON request line read from stdin.

    Returns:
        ``{"grid": ...}`` on success or ``{"error": ...}`` on failure. Never raises
        for bad input, so the engine keeps running.
    """
    try:
        data = json.loads(line)
    except json.JSONDecodeError as exc:
        return {"error": f"invalid JSON: {exc.msg}"}
    if not isinstance(data, dict):
        return {"error": "request must be a JSON object"}
    command = data.get("command")
    if command != "next":
        return {"error": f"unknown command: {command!r}"}
    try:
        return {"grid": next_generation(data.get("grid"))}
    except ValueError as exc:
        return {"error": str(exc)}


def main(stdin: TextIO = sys.stdin, stdout: TextIO = sys.stdout) -> None:
    """Serve requests until stdin is closed. Blank lines are ignored."""
    for line in stdin:
        if not line.strip():
            continue
        stdout.write(json.dumps(handle_request(line)) + "\n")
        stdout.flush()


if __name__ == "__main__":
    main()
