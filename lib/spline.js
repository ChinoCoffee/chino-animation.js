/*
 * spline.js
 *
 * See
 *   http://hooktail.org/computer/index.php?Ruby%BC%C2%CD%D1%CE%E3%20%A1%C1%A5%B9%A5%D7%A5%E9%A5%A4%A5%F3%CA%E4%B4%D6%A1%C1
 */

function Spline(points) {
    this.initialize(points);
}
Spline.prototype = {
    addCenterPoints: function(plist) {
        var result = [plist[0]];
        var center = [
            (plist[0][0] + plist[1][0]) / 2.0,
            (plist[0][1] + plist[1][1]) / 2.0,
        ];
        result.push(center);
        result.push(plist[1]);
        return result;
    },
    initialize: function(points) {
        if (points.length == 2) {
            points = this.addCenterPoints(points);
        }
        var x = points.map(function(p) { return p[0]; });
        var y = points.map(function(p) { return p[1]; });
        var z = [];

        var n = points.length;
        var h = [];
        var d = [];
        z[0] = 0;
        z[n-1] = 0;

        var i, t;

        for (i = 0; i < n-1; i++) {
            h[i]   =  x[i+1] - x[i];
            d[i+1] = (y[i+1] - y[i]) / h[i];
        }

        z[1] = d[2] - d[1] - h[0] * z[0];
        d[1] = 2 * (x[2] - x[0]);

        for (i = 1; i < n-2; i++) {
            t = h[i] / d[i];
            z[i+1] = d[i+2] - d[i+1] - z[i] * t;
            d[i+1] = 2 * (x[i+2] - x[i]) - h[i] * t;
        }

        z[n-2] -= h[n-2] * z[n-1];

        for (i = n-2; i > 0; i--) {
            z[i] = (z[i] - h[i] * z[i+1]) / d[i]
        }

        this.x = x;
        this.y = y;
        this.z = z;
    },
    getXIndex: function(t) {
        var i = 0;
        var j = this.x.length - 1;
        var k;
        while (i < j) {
            k = Math.floor((i + j) / 2);
            if (this.x[k] < t) {
                i = k + 1;
            } else {
                j = k;
            }
        }
        if (i > 0) i--;
        return i;
    },
    interpolate: function(t) {
        var i = this.getXIndex(t);
        var h = this.x[i+1] - this.x[i];
        var d = t - this.x[i];
        return (((this.z[i+1] - this.z[i]) * d / h + this.z[i] * 3) * d + ((this.y[i+1] - this.y[i]) / h - (this.z[i] * 2 + this.z[i+1]) * h)) * d + this.y[i];
    },
}
