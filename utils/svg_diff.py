#!/usr/bin/env python3

"""
A simple path diff tool for svg files.

$ pip install beautifulsoup4
"""

import json
import sys
import re

from bs4 import BeautifulSoup


BS_PARSER = 'lxml'
BS_ELEMENTS = ['path', 'ellipse']
BS_COLLECT_ATTRS = {
    'path': ('d', ),
    'ellipse': ('cx', 'cy', 'rx', 'ry')
}


def collect_attrs(elem):
    result = {attr: elem.attrs[attr] for attr in BS_COLLECT_ATTRS[elem.name]}
    result['name'] = elem.name
    return result


def diff_elements(dict1, dict2):
    appear = {}
    disappear = {}
    change = {}

    for elem_id in (set(dict1.keys()) | set(dict2.keys())):   # union
        if elem_id in dict1 and elem_id not in dict2:
            disappear[elem_id] = dict1[elem_id]

        elif elem_id not in dict1 and elem_id in dict2:
            appear[elem_id] = dict2[elem_id]

        elif elem_id in dict1 and elem_id in dict2:
            elem1 = dict1[elem_id]
            elem2 = dict2[elem_id]

            changed = False
            for attr in BS_COLLECT_ATTRS[elem1['name']]:
                if elem1[attr] != elem2[attr]:
                    changed = True
            if not changed:
                continue

            change[elem_id] = {
                'before': dict1[elem_id],
                'after': dict2[elem_id]
            }

    return {
        'appear': appear,
        'disappear': disappear,
        'change': change
    }


def collect_elements(soup):
    result = {}
    for elem in soup.find_all(BS_ELEMENTS):
        if not elem.has_attr('id'):
            continue
        result[elem.attrs['id']] = collect_attrs(elem)

    return result


def prepare_viewbox_formatter(soup):
    width = int(re.match('\d+', soup.find('svg').attrs['width']).group())
    height = int(re.match('\d+', soup.find('svg').attrs['height']).group())
    x1, y1, x2, y2  = list(map(float, soup.find('svg').attrs['viewbox'].split()))

    def formatter(x, y):
        # [FIXME] don't ignore x1, y1
        return [x / x2 * width, y / y2 * height]
    return formatter


def apply_formatter(formatter, data):
    result = {}
    for k, v in data.items():
        if isinstance(v, dict):
            result[k] = apply_formatter(formatter, v)
        elif isinstance(v, str) and len(v.split()) > 1:
            parts = []
            for fragment in v.split():
                values = fragment.split(',')
                if len(values) == 2:
                    x, y = map(float, values)
                    newFragment = ','.join(map(lambda f: "{:.7f}".format(f), formatter(x, y)))
                else:
                    newFragment = fragment
                parts.append(newFragment)
            result[k] = ' '.join(parts)
        else:
            result[k] = v
    return result


def calculate_diff(base_soup, target_soup):
    base_paths = collect_elements(base_soup)
    target_paths = collect_elements(target_soup)

    return diff_elements(base_paths, target_paths)


def main(base_svg_path, target_svg_paths):
    # open svg files
    base_svg = BeautifulSoup(open(base_svg_path), BS_PARSER)
    target_svgs = []

    for target_svg_path in target_svg_paths:
        soup = BeautifulSoup(open(target_svg_path), BS_PARSER)
        target_svgs.append(soup)

    # calculate diffs
    result = {}
    for target_svg in target_svgs:
        svg_name = target_svg.svg['sodipodi:docname']
        result[svg_name] = calculate_diff(base_svg, target_svg)

    formatter = prepare_viewbox_formatter(base_svg)
    result = apply_formatter(formatter, result)

    return result


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python svg_diff.py [baseSVG] [targetSVG1]..")

    else:
        base_svg_path = sys.argv[1]
        target_svg_paths = sys.argv[2:]

        result = main(base_svg_path, target_svg_paths)

        dumps = json.dumps(
            result,
            indent=4,
            separators=(',', ': ')
        )
        print(dumps)
