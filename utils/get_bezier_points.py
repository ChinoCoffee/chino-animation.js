#!/usr/bin/env python3

"""
A simple inspector for svg path data.

$ pip install svg.path
"""

from svg.path import parse_path
from svg.path.path import CubicBezier, Line


def get_floored_complex(c):
    return int(c.real) + int(c.imag) * 1j
gfc = get_floored_complex


def simplify_points(path_d):
    path = parse_path(path_d)

    for bezier in path:

        if isinstance(bezier, CubicBezier):
            for attr in ('start', 'control1', 'control2', 'end'):
                setattr(bezier, attr, gfc(getattr(bezier, attr)))

        elif isinstance(bezier, Line):
            for attr in ('start', 'end'):
                setattr(bezier, attr, gfc(getattr(bezier, attr)))

    return path


def print_as_curveTo(path):
    # We ignore Line objects

    path = [b for b in path if isinstance(b, CubicBezier)]
    path = list(path)

    yield("moveTo(%4d,%4d)" % (path[0].start.real, path[0].start.imag))

    for b in path:
        yield("curveTo(%4d,%4d,  %4d,%4d,  %4d,%4d)" % (
            b.control1.real, b.control1.imag,
            b.control2.real, b.control2.imag,
            b.end.real,      b.end.imag
        ))


def print_as_str(path):
    for b in path:
        yield(str(b))


if __name__ == "__main__":
    func = print_as_curveTo

    while True:
        path_d = ""
        command = input("> ")

        print("")   # new line

        if command == "curveTo":
            func = print_as_curveTo
        elif command == "str":
            func = print_as_str
        else:
            path_d = command

        if path_d:
            try:
                for s in func(simplify_points(path_d)):
                    print(s)
            except (IndexError, ValueError) as e:
                print(e.__class__.__name__, ":", e)

        print("")   # new line
