/*
 * How the offline areas are drawn: protomaps-leaflet paint and label rules
 * for the OpenMapTiles layers of the OpenFreeMap tiles, in colours close to
 * the standard OpenStreetMap map so a fallback tile does not stand out.
 * Only called once lib/protomaps-leaflet is loaded.
 */
var OfflineStyle = {
	background: "#f2efe9",
	colors: {
		water: "#aad3df",
		wood: "#add19e",
		grass: "#cdebb0",
		farmland: "#eef0d5",
		sand: "#f5e9c6",
		ice: "#ddecec",
		wetland: "#d6e8d5",
		rock: "#e4e0dc",
		residential: "#e0dfdf",
		commercial: "#f2dad9",
		industrial: "#ebdbe8",
		cemetery: "#aacbaf",
		school: "#ffffe5",
		hospital: "#ffffe5",
		park: "#c8facc",
		building: "#d9d0c9",
		buildingLine: "#c4b6ab",
		casing: "#bbbbbb",
		motorway: "#e892a2",
		trunk: "#f9b29c",
		primary: "#fcd6a4",
		secondary: "#f7fabf",
		minor: "#ffffff",
		path: "#fa8072",
		rail: "#999999",
		boundary: "#9e9cab",
		runway: "#bbbbcc",
		label: "#333333",
		halo: "#ffffff",
		waterLabel: "#4d80b3",
		poiLabel: "#6b5b4b"
	},

	classOf: function (inFeature) {
		return inFeature ? String(inFeature.props["class"] || "") : "";
	},
	/* the name in the language of the app, as the tiles have it */
	labelProps: function () {
		var lang = String(Prefs.lang || "").split("-")[0];
		return lang ? ["name:" + lang, "name:latin", "name"] : ["name:latin", "name"];
	},
	roadColor: function (inClass) {
		var c = this.colors;
		switch (inClass) {
			case "motorway": return c.motorway;
			case "trunk": return c.trunk;
			case "primary": return c.primary;
			case "secondary": return c.secondary;
			default: return c.minor;
		}
	},
	/* road width in pixels at zoom inZ */
	roadWidth: function (inClass, inZ) {
		var base = {motorway: 3, trunk: 2.6, primary: 2.4, secondary: 2, tertiary: 1.8, minor: 1.2, service: 0.8, track: 0.8};
		var w = base[inClass] || 1;
		/* doubles every zoom level from 12 on, up to the street level */
		return w * Math.pow(2, Math.max(-2, Math.min(4, inZ - 13)) / 1.5);
	},
	isRoad: function (inClass) {
		return ["motorway", "trunk", "primary", "secondary", "tertiary", "minor", "service", "track", "raceway", "busway"].indexOf(inClass) >= 0;
	},

	paintRules: function () {
		var P = protomapsL;
		var c = this.colors;
		var self = this;
		var landcover = {wood: c.wood, forest: c.wood, grass: c.grass, farmland: c.farmland, sand: c.sand, ice: c.ice, wetland: c.wetland, rock: c.rock};
		var landuse = {residential: c.residential, suburb: c.residential, neighbourhood: c.residential, commercial: c.commercial, retail: c.commercial,
			industrial: c.industrial, railway: c.industrial, cemetery: c.cemetery, school: c.school, university: c.school, college: c.school,
			kindergarten: c.school, hospital: c.hospital, stadium: c.grass, pitch: c.grass, playground: c.grass};
		var lookup = function (inTable) {
			return function (z, f) { return inTable[self.classOf(f)] || ""; };
		};
		var has = function (inTable) {
			return function (z, f) { return !!inTable[self.classOf(f)]; };
		};
		var roadRule = function (inCasing) {
			return {
				dataLayer: "transportation",
				filter: function (z, f) {
					var cls = self.classOf(f);
					if (!self.isRoad(cls)) return false;
					if (inCasing && z < 13 && cls != "motorway" && cls != "trunk") return false;
					return f.props.brunnel != "tunnel" || z >= 15;
				},
				symbolizer: new P.LineSymbolizer({
					color: inCasing ? c.casing : function (z, f) { return self.roadColor(self.classOf(f)); },
					width: function (z, f) { return self.roadWidth(self.classOf(f), z) + (inCasing ? 1.5 : 0); },
					lineCap: "round",
					lineJoin: "round"
				})
			};
		};
		return [
			{dataLayer: "background", symbolizer: new P.PolygonSymbolizer({fill: this.background})},
			{dataLayer: "landcover", filter: has(landcover), symbolizer: new P.PolygonSymbolizer({fill: lookup(landcover), opacity: 0.8})},
			{dataLayer: "landuse", filter: has(landuse), symbolizer: new P.PolygonSymbolizer({fill: lookup(landuse)})},
			{dataLayer: "park", symbolizer: new P.PolygonSymbolizer({fill: c.park, opacity: 0.7})},
			{dataLayer: "water", symbolizer: new P.PolygonSymbolizer({fill: c.water})},
			{dataLayer: "waterway", minzoom: 9, symbolizer: new P.LineSymbolizer({
				color: c.water,
				width: function (z, f) { return (self.classOf(f) == "river" || self.classOf(f) == "canal") ? Math.max(1, z - 10) : Math.max(0.5, (z - 12) / 2); }
			})},
			{dataLayer: "aeroway", minzoom: 11, filter: function (z, f) { return f.geomType == 2; }, symbolizer: new P.LineSymbolizer({color: c.runway, width: function (z) { return Math.max(1, (z - 10) * 1.5); }})},
			{dataLayer: "building", minzoom: 14, symbolizer: new P.PolygonSymbolizer({fill: c.building, stroke: c.buildingLine, width: 0.5})},
			{dataLayer: "boundary", filter: function (z, f) { return f.props.maritime != 1 && Number(f.props.admin_level) <= 4; },
				symbolizer: new P.LineSymbolizer({color: c.boundary, width: function (z, f) { return Number(f.props.admin_level) <= 2 ? 1.5 : 1; }, dash: [4, 3]})},
			{dataLayer: "transportation", minzoom: 13, filter: function (z, f) { return self.classOf(f) == "path"; },
				symbolizer: new P.LineSymbolizer({color: c.path, width: 1, dash: [2, 2]})},
			{dataLayer: "transportation", filter: function (z, f) { return self.classOf(f) == "rail" || self.classOf(f) == "transit"; },
				symbolizer: new P.LineSymbolizer({color: c.rail, width: function (z) { return z < 13 ? 1 : 2; }, dash: [3, 3]})},
			roadRule(true),
			roadRule(false)
		];
	},

	labelRules: function () {
		var P = protomapsL;
		var c = this.colors;
		var self = this;
		var labelProps = this.labelProps();
		var placeSize = {country: 14, state: 13, city: 16, town: 14, village: 12, suburb: 12, quarter: 11, neighbourhood: 11, hamlet: 11, island: 12};
		return [
			{dataLayer: "place",
				filter: function (z, f) {
					var cls = self.classOf(f);
					if (cls == "continent") return false;
					if (cls == "suburb" || cls == "quarter") return z >= 12;
					if (cls == "neighbourhood" || cls == "hamlet" || cls == "isolated_dwelling") return z >= 14;
					if (cls == "village") return z >= 11;
					return true;
				},
				sort: function (a, b) { return Number(a.rank || 99) - Number(b.rank || 99); },
				symbolizer: new P.CenteredTextSymbolizer({
					labelProps: labelProps,
					fill: c.label,
					stroke: c.halo,
					width: 2,
					fontFamily: "sans-serif",
					fontWeight: function (z, f) { return (self.classOf(f) == "city" || self.classOf(f) == "country") ? 600 : 400; },
					fontSize: function (z, f) { return placeSize[self.classOf(f)] || 11; }
				})
			},
			{dataLayer: "water_name", minzoom: 10, symbolizer: new P.CenteredTextSymbolizer({
				labelProps: labelProps, fill: c.waterLabel, stroke: c.halo, width: 1.5, fontFamily: "sans-serif", fontStyle: "italic", fontSize: 12
			})},
			{dataLayer: "transportation_name", minzoom: 13, symbolizer: new P.LineLabelSymbolizer({
				labelProps: labelProps, fill: c.label, stroke: c.halo, width: 2, fontFamily: "sans-serif", fontSize: 11
			})},
			{dataLayer: "poi", minzoom: 16,
				filter: function (z, f) { return Number(f.props.rank || 99) <= (z >= 17 ? 60 : 20); },
				sort: function (a, b) { return Number(a.rank || 99) - Number(b.rank || 99); },
				symbolizer: new P.CenteredTextSymbolizer({
					labelProps: labelProps, fill: c.poiLabel, stroke: c.halo, width: 2, fontFamily: "sans-serif", fontSize: 10
				})
			}
		];
	}
};
