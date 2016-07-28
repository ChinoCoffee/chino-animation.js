/**
 * geometry.js
 */


/////////////////////////////////////
//     Utilities
/////////////////////////////////////

function debugP(p) {
    return new Path.Circle({
        position: p,
        radius: 5,
        fillColor: 'red',
    });
}

// https://groups.google.com/forum/#!msg/paperjs/UD8L0MTyReQ/MMTprUh-ToAJ
function overlaps(path, other) {
    var intersections = path.getIntersections(other);
    return intersections.length !== 0;
};

function mergeOne(path, others) {
  var i, merged, other, union, _i, _len, _ref;
  for (i = _i = 0, _len = others.length; _i < _len; i = ++_i) {
    other = others[i];
    if (overlaps(path, other)) {
      union = path.unite(other);
      merged = mergeOne(union, others.slice(i + 1));
      return (_ref = others.slice(0, i)).concat.apply(_ref, merged);
    }
  }
  return others.concat(path);
};

function merge(group) {
    var paths = [];
    group.children.forEach(function(p) {
        paths.push(p);
    });
    var path, result, _i, _len;
    result = [];
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
        path = paths[_i];
        result = mergeOne(path, result);
    }
    return result[0];
};

function c(r, g, b, a) {
    a = (a !== undefined) ? a : 255;
    return new Color(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
}

function getItem(name) {
    return paper.project.getItem({"_name": name});
}


function proportion(x, y, p) {
    return (y - x) * p + x;
}

function pointProportion(p1, p2, p) {
  return new Point(
    proportion(p1.x, p2.x, p),
    proportion(p1.y, p2.y, p)
  );
}


function quantize(value, step) {
  return Math.floor(value / step) * step;
}


function segmentProportion(s1, s2, p) {
  return new Segment(
    pointProportion(s1.point,     s2.point, p),
    pointProportion(s1.handleIn,  s2.handleIn, p),
    pointProportion(s1.handleOut, s2.handleOut, p)
  );

}


function zeropad(stops, reverse) {
    var direction = (reverse) ? 1: 0;

    return stops.map(function(s) {
        var max_normal = Math.max(s[0][0], s[0][1]);
        var mi = s[0].indexOf(max_normal);
        var new_normals = (mi == direction) ? [0, s[0][1]]: [s[0][0], 0];
        return [new_normals, s[1]];
    });
}


function TwoBezierInterpolator(path1, path2) {
    this.path1 = path1.curves[0].getValues();
    this.path2 = path2.curves[0].getValues();
    path1.visible = false;
    path2.visible = false;
}
TwoBezierInterpolator.prototype.interpolate = function(t) {
    var values = [];
    for (var i = 0; i < this.path1.length; i++) {
        values.push(
            proportion(this.path1[i], this.path2[i], t)
        );
    }
    var result = new Path();
    result.moveTo([values[0], values[1]]);
    result.cubicCurveTo(
        [values[2], values[3]],
        [values[4], values[5]],
        [values[6], values[7]]
    );
    return result;
}


/////////////////////////////////////
//     GraduatedOutline
/////////////////////////////////////

function GraduatedOutline(path, numDiv) {
    this.numDiv = (numDiv !== undefined) ? numDiv: 25;
    this.path = path;
    //this.path.selected = true;   // useful for debugging
    this.stops = {};
}

GraduatedOutline.prototype.setNumDiv = function(numDiv) {
    this.numDiv = numDiv;
}

GraduatedOutline.prototype.length = function() {
    var bezier = new Bezier(this.path.curves[0].getValues());
    return bezier.length();
}

GraduatedOutline.prototype.calcOutline = function(curve, t1, t2, d1, d2, d3, d4) {
    var bezier = new Bezier(curve.getValues());
    bezier = bezier.split(t1, t2);
    return bezier.outline(d1, d2, d3, d4);
}

GraduatedOutline.prototype.getNormalSplines = function(stops) {
    var result = [];
    var spline, tvList;

    for (var i = 0; i <= 1; i++) {
        tvList = stops.map(function(s) {
            return [s[1], s[0][i]]
        });

        spline = new Spline(tvList);
        result.push(spline);
    }
    return result;
}

GraduatedOutline.prototype.getOutline = function(stops, debugDraw) {
    /*
      Structure of stops:

        stops = [
            [[normal, anti_normal], t],
            ...
        ]
    */
    debugDraw = (debugDraw !== undefined) ? debugDraw: false;

    var splines = this.getNormalSplines(stops);

    function getStops(t) {
        return [[splines[0].interpolate(t), splines[1].interpolate(t)], t];
    }

    var _curves;
    var t, stop1, stop2;

    var ls,
        le,
        fcurves = [],
        bcurves = [];
    var L;

    for (var i = 0; i < this.numDiv; i++) {

        stop1 = getStops(i / this.numDiv);
        stop2 = getStops((i + 1) / this.numDiv);

        _curves = this.getOneCurveOutline(stop1, stop2).curves;
        L = _curves.length;

        if (i == 0) {   // start
            ls = _curves[0];
        }
        if (i == this.numDiv - 1) {   // end
            le = _curves[L / 2];
        }

        fcurves = fcurves.concat(_curves.slice(1, L / 2));
        bcurves = (_curves.slice(L / 2 + 1)).concat(bcurves);

        if (debugDraw) {
            _path = this.getOneCurveOutlinePath(stop1, stop2);
            _path.set({strokeColor: 'red', strokeWidth: 1});
        }
    }

    // Concatenate all curves
    var allCurves = [ls].concat(fcurves).concat([le]).concat(bcurves);
    var result = new Path();

    result.moveTo(allCurves[0].points[0]);

    allCurves.forEach(function(curve) {
        result.cubicCurveTo(curve.points[1], curve.points[2], curve.points[3]);
    });

    result.closePath(true);
    //result.simplify();
    return result;
};

GraduatedOutline.prototype.getOneCurveOutline = function(stop1, stop2) {
    var t1 = stop1[1], t2 = stop2[1];
    var n1 = stop1[0][0], a1 = stop1[0][1],
        n2 = stop2[0][0], a2 = stop2[0][1];

    var _curve = this.path.curves[0];
    var _outline = this.calcOutline(
        _curve,
        t1, t2,
        n1, a1, n2, a2);
    return _outline;
};



GraduatedOutline.prototype.getOneCurveOutlinePath = function(stop1, stop2) {
    var result = new Path(),
        _outline = this.getOneCurveOutline(stop1, stop2);

    result.moveTo(_outline.curves[0].points[0]);

    _outline.curves.forEach(function(curve) {
        result.cubicCurveTo(curve.points[1], curve.points[2], curve.points[3]);
    });
    result.closePath(true);
    return result;
};
