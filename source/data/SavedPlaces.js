/*
 * Saved places ("favorites"), kept in localStorage like the preferences.
 * Only plain data is stored, so saved places work with every map engine.
 */
var SavedPlaces = {
	key: "mapsAppSavedPlaces",
	places: null,

	load: function () {
		if (this.places) return this.places;
		this.places = [];
		try {
			var stored = window.localStorage.getItem(this.key);
			if (stored) this.places = enyo.json.parse(stored) || [];
		} catch (e) {
			enyo.log("Cannot read saved places, starting empty: ", e);
		}
		return this.places;
	},
	persist: function () {
		try {
			window.localStorage.setItem(this.key, enyo.json.stringify(this.places));
		} catch (e) {
			enyo.log("Cannot store saved places: ", e);
		}
	},
	/* same spot, 6 decimals is about 0.1 m */
	keyOf: function (inLat, inLng) {
		return Number(inLat).toFixed(6) + "," + Number(inLng).toFixed(6);
	},
	indexOf: function (inPlace) {
		var location = inPlace.geometry.location;
		var key = this.keyOf(location.lat(), location.lng());
		var places = this.load();
		for (var i = 0; i < places.length; i++) {
			if (this.keyOf(places[i].lat, places[i].lng) == key) return i;
		}
		return -1;
	},
	contains: function (inPlace) {
		return this.indexOf(inPlace) >= 0;
	},
	add: function (inPlace) {
		if (this.contains(inPlace)) return;
		var location = inPlace.geometry.location;
		this.load().unshift({
			name: String(inPlace.name),
			formatted_address: String(inPlace.formatted_address || ""),
			lat: location.lat(),
			lng: location.lng(),
			phone: inPlace.formatted_phone_number || "",
			website: inPlace.website || "",
			opening_hours_text: inPlace.opening_hours_text || "",
			saved: Date.now()
		});
		this.persist();
	},
	remove: function (inPlace) {
		var i = this.indexOf(inPlace);
		if (i < 0) return;
		this.load().splice(i, 1);
		this.persist();
	},
	/* a stored entry as a place object the views understand */
	toPlace: function (inSaved) {
		var place = {
			id: "saved-" + this.keyOf(inSaved.lat, inSaved.lng),
			name: inSaved.name,
			formatted_address: inSaved.formatted_address,
			icon: "assets/star-orange.png",
			lunetype: "saved",
			geometry: {location: mapEngine.latLng(inSaved.lat, inSaved.lng)}
		};
		if (inSaved.phone) place.formatted_phone_number = inSaved.phone;
		if (inSaved.website) place.website = inSaved.website;
		if (inSaved.opening_hours_text) place.opening_hours_text = inSaved.opening_hours_text;
		return place;
	}
};
