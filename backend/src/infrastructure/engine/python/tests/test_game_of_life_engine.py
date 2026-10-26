"""Unit tests for the NumPy Game of Life engine and its JSON line protocol."""

from __future__ import annotations

import io
import json
import subprocess
import sys
from pathlib import Path

import pytest

ENGINE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ENGINE_DIR))

from game_of_life_engine import handle_request, main, next_generation


def empty(rows: int, cols: int) -> list[list[int]]:
    return [[0] * cols for _ in range(rows)]


def with_cells(rows: int, cols: int, cells: list[tuple[int, int]]) -> list[list[int]]:
    grid = empty(rows, cols)
    for r, c in cells:
        grid[r][c] = 1
    return grid


def test_empty_board_stays_empty() -> None:
    assert next_generation(empty(5, 5)) == empty(5, 5)


def test_block_is_still_life() -> None:
    block = with_cells(4, 4, [(1, 1), (1, 2), (2, 1), (2, 2)])
    assert next_generation(block) == block


def test_blinker_oscillates_with_period_two() -> None:
    horizontal = with_cells(5, 5, [(2, 1), (2, 2), (2, 3)])
    vertical = with_cells(5, 5, [(1, 2), (2, 2), (3, 2)])
    assert next_generation(horizontal) == vertical
    assert next_generation(vertical) == horizontal


def test_lonely_cell_dies() -> None:
    assert next_generation(with_cells(3, 3, [(1, 1)])) == empty(3, 3)


def test_overcrowded_cell_dies() -> None:
    # Centre has 4 neighbours -> dies; corners/edges follow B3/S23.
    grid = with_cells(5, 5, [(2, 2), (1, 2), (3, 2), (2, 1), (2, 3)])
    assert next_generation(grid)[2][2] == 0


def test_edges_wrap_around() -> None:
    # A vertical blinker split across the top/bottom edge of a 5x5 torus.
    grid = with_cells(5, 5, [(4, 2), (0, 2), (1, 2)])
    assert next_generation(grid) == with_cells(5, 5, [(0, 1), (0, 2), (0, 3)])


def test_glider_returns_shifted_after_four_generations() -> None:
    glider = with_cells(8, 8, [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)])
    grid = glider
    for _ in range(4):
        grid = next_generation(grid)
    assert grid == with_cells(
        8, 8, [(r + 1, c + 1) for r, c in [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)]]
    )


def test_non_square_board_keeps_shape() -> None:
    result = next_generation(empty(3, 7))
    assert len(result) == 3
    assert all(len(row) == 7 for row in result)


def test_input_is_not_mutated() -> None:
    grid = with_cells(5, 5, [(2, 1), (2, 2), (2, 3)])
    snapshot = [row[:] for row in grid]
    next_generation(grid)
    assert grid == snapshot


@pytest.mark.parametrize(
    "bad",
    [None, [], [[]], [[0, 1], [0]], [[0, 2]], "abc", [[0, "x"]]],
)
def test_invalid_grids_raise_value_error(bad: object) -> None:
    with pytest.raises(ValueError):
        next_generation(bad)  # type: ignore[arg-type]


def test_handle_request_success() -> None:
    response = handle_request(json.dumps({"command": "next", "grid": empty(3, 3)}))
    assert response == {"grid": empty(3, 3)}


@pytest.mark.parametrize(
    ("line", "fragment"),
    [
        ("not json", "invalid JSON"),
        ("[1, 2]", "JSON object"),
        (json.dumps({"command": "jump"}), "unknown command"),
        (json.dumps({"command": "next", "grid": [[0, 5]]}), "0 or 1"),
    ],
)
def test_handle_request_errors(line: str, fragment: str) -> None:
    response = handle_request(line)
    assert set(response) == {"error"}
    assert fragment in response["error"]


def test_main_answers_one_line_per_request_and_skips_blank_lines() -> None:
    requests = "\n".join(
        [
            json.dumps({"command": "next", "grid": empty(2, 2)}),
            "",
            "garbage",
            json.dumps({"command": "next", "grid": empty(2, 2)}),
        ]
    )
    out = io.StringIO()
    main(io.StringIO(requests + "\n"), out)
    lines = out.getvalue().splitlines()
    assert len(lines) == 3
    assert "grid" in json.loads(lines[0])
    assert "error" in json.loads(lines[1])
    assert "grid" in json.loads(lines[2])


def test_script_runs_as_subprocess() -> None:
    request = json.dumps(
        {"command": "next", "grid": with_cells(5, 5, [(2, 1), (2, 2), (2, 3)])}
    )
    proc = subprocess.run(
        [sys.executable, str(ENGINE_DIR / "game_of_life_engine.py")],
        input=request + "\n",
        capture_output=True,
        text=True,
        timeout=30,
        check=True,
    )
    assert json.loads(proc.stdout) == {
        "grid": with_cells(5, 5, [(1, 2), (2, 2), (3, 2)])
    }
