function getAppInfo() {
    var req = new XMLHttpRequest();
    req.open('GET', '../appinfo.json', false);
    req.send(null);
    if(req.status == 0)
        return JSON.parse(req.responseText);
}

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
}

function getDistanceInCorrectUnits (distance) {
	
	switch (Prefs.lengthUnits) {
        case "metric":
            return (distance/1000).toFixed(2) + " km ";
            break;
        case "imperial":
			return (distance*0.000621371192).toFixed(2) + " " + $L("miles") + " ";
			break;
	};
	
}

var Localized = new ilib.ResBundle({locale: Prefs.lang})

function $L(string) {
   return Localized.getString(string);
}


var atanh = function(x) {
                return 0.5*Math.log((1+x)/(1-x));
        };

        var MERCATOR_RANGE = 256;

        var degreesToRadians = function (deg) {
                return deg * (Math.PI / 180);
        };

        var radiansToDegrees = function(rad) {
                return rad / (Math.PI / 180);
        };

        var bound = function(value, opt_min, opt_max) {
                if (opt_min != null) value = Math.max(value, opt_min);
                if (opt_max != null) value = Math.min(value, opt_max);
                return value;
        };

var YandexProjection = function () {
                this.pixelOrigin_ = new google.maps.Point(128,128);
                this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
                this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
        };

        YandexProjection.prototype.fromLatLngToPoint = function(latLng) {
                var me = this;
                var point = new google.maps.Point(0, 0);
                var origin = me.pixelOrigin_;
                var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999, 0.9999);
                point.x = origin.x + latLng.lng() *me.pixelsPerLonDegree_;
                var exct = 0.0818197;
                var z = Math.sin(latLng.lat()/180*Math.PI);
                point.y = Math.abs(origin.y - me.pixelsPerLonRadian_*(atanh(z)-exct*atanh(exct*z))); 
                return point;
        };

        YandexProjection.prototype.fromPointToLatLng = function(point) {
                var me = this;
                var origin = me.pixelOrigin_;
                var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
                var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
                var lat = Math.abs((2*Math.atan(Math.exp(latRadians))-Math.PI/2)*180/Math.PI);
                var Zu = lat/(180/Math.PI);
                var Zum1 = Zu+1;
                var exct = 0.0818197;
                var yy = -Math.abs(((point.y)-128));
                while (Math.abs(Zum1-Zu)>0.0000001){
                        Zum1 = Zu;
                        Zu = Math.asin(1-((1+Math.sin(Zum1))*Math.pow(1-exct*Math.sin(Zum1),exct))
                                /(Math.exp((2*yy)/-(256/(2*Math.PI)))*Math.pow(1+exct*Math.sin(Zum1),exct)));
                }
                if (point.y>256/2) {lat=-Zu*180/Math.PI}
                else {lat=Zu*180/Math.PI}
                return new google.maps.LatLng(lat, lng);
        };
        
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
