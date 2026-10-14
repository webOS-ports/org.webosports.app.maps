/* The engine chosen in the preferences, used by all views */
var mapEngine = MapEngines.create(Prefs.engine);

/* Map types are engine specific, fall back to the engine default when switching engines */
if (!mapEngine.isMapType(Prefs.mapType)) {
	Prefs.mapType = mapEngine.defaultMapType;
}
