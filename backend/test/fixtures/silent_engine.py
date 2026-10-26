"""Test fixture: an engine that reads requests but never answers."""

import sys

for _line in sys.stdin:
    pass
