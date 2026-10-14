/*
 * Voice guidance along a route: follows the position and says what comes
 * next, "In 300 meters, turn left onto Damrak", then "Now, turn left onto
 * Damrak" just before the turn. Leaving the route asks for a new one.
 *
 * The decisions are made in update(), which takes a position and returns
 * what to say; speaking goes through speechSynthesis (on LuneOS backed by
 * speech-dispatcher). The route is the shape both engines give:
 * routes[i].legs[].steps[] with start_location and instructions.
 */
var Guidance = {
	/* meters: announce the next maneuver, say "now", and count as arrived at a step */
	thresholds: {
		DRIVING: {early: 500, now: 80, reached: 30, offRoute: 60},
		BICYCLING: {early: 200, now: 40, reached: 20, offRoute: 40},
		WALKING: {early: 100, now: 25, reached: 15, offRoute: 40}
	},
	/* consecutive fixes off the route before a new route is asked for */
	offRouteFixes: 3,

	active: false,

	/* inSteps: the route's steps, each with leg (its leg, 0 for the first) - see Guidance.stepsOf();
	   inPath: [[lat, lng], ...] of the route */
	start: function (inSteps, inPath, inTravelMode, inOptions) {
		this.steps = inSteps;
		this.path = inPath || [];
		this.limits = this.thresholds[inTravelMode] || this.thresholds.DRIVING;
		this.next = 1;            /* the step whose maneuver comes next */
		this.announced = {};      /* step index -> "early" / "now" */
		this.closest = Infinity;  /* closest we came to the next maneuver */
		this.offCount = 0;
		this.onReroute = (inOptions && inOptions.onReroute) || null;
		this.active = true;
		this.arrived = false;
		return [this.plain(this.steps[0].instructions)];
	},

	stop: function () {
		this.active = false;
		this.steps = null;
		this.path = null;
		if (this.speechAvailable()) {
			window.speechSynthesis.cancel();
		}
	},

	/* stops already passed: the leg the next maneuver is on */
	stopsPassed: function () {
		if (!this.steps || !this.steps.length) return 0;
		return this.steps[Math.min(this.next, this.steps.length - 1)].leg || 0;
	},

	/* the steps of a route, each marked with its leg */
	stepsOf: function (inRoute) {
		var steps = [];
		for (var l = 0; l < inRoute.legs.length; l++) {
			inRoute.legs[l].steps.forEach(function (inStep) {
				if (inStep.leg === undefined) inStep.leg = l;
				steps.push(inStep);
			});
		}
		return steps;
	},

	/* inPosition: {lat(), lng()}; returns the sentences to say for this fix */
	update: function (inPosition) {
		if (!this.active || this.arrived) return [];
		var say = [];

		/* off the route for a while: ask for a new one */
		if (this.path.length > 1 && this.distanceToPath(inPosition) > this.limits.offRoute) {
			this.offCount++;
			if (this.offCount >= this.offRouteFixes) {
				this.offCount = 0;
				if (this.onReroute) this.onReroute();
				return [$L("Recalculating")];
			}
		} else {
			this.offCount = 0;
		}

		/* passed the next maneuver - right at it, or moving away again after "now" - the one after it is next */
		while (this.next < this.steps.length && this.announced[this.next] == "now") {
			var away = MapEngines.distance(inPosition, this.steps[this.next].start_location);
			this.closest = Math.min(this.closest, away);
			if (away >= this.limits.reached && away <= this.closest + this.limits.reached) break;
			this.next++;
			this.closest = Infinity;
		}
		if (this.next >= this.steps.length) {
			this.arrived = true;
			return [$L("You have arrived")];
		}

		var step = this.steps[this.next];
		var distance = MapEngines.distance(inPosition, step.start_location);
		var text = this.plain(step.instructions);
		var arrival = /^Arrive/.test(text);
		if (distance <= this.limits.now && this.announced[this.next] != "now") {
			this.announced[this.next] = "now";
			say.push(arrival ? text : $L("Now") + ", " + this.lowerFirst(text));
			if (this.next == this.steps.length - 1) {
				this.arrived = true;
			}
		} else if (distance <= this.limits.early && distance > this.limits.now && !this.announced[this.next]) {
			this.announced[this.next] = "early";
			say.push($L("In") + " " + this.spokenDistance(distance) + ", " + this.lowerFirst(text));
		}
		return say;
	},

	/* distance to the next maneuver, for the display */
	distanceToNext: function (inPosition) {
		if (!this.active || !this.steps || this.next >= this.steps.length) return 0;
		return MapEngines.distance(inPosition, this.steps[this.next].start_location);
	},

	nextStep: function () {
		return (this.active && this.steps) ? this.steps[Math.min(this.next, this.steps.length - 1)] : null;
	},

	/* meters to the nearest point of the route (equirectangular, fine at this scale) */
	distanceToPath: function (inPosition) {
		var lat0 = inPosition.lat() * Math.PI / 180;
		var mPerDegLat = 111320, mPerDegLng = 111320 * Math.cos(lat0);
		var px = inPosition.lng() * mPerDegLng, py = inPosition.lat() * mPerDegLat;
		var best = Infinity;
		for (var i = 1; i < this.path.length; i++) {
			var ax = this.path[i - 1][1] * mPerDegLng, ay = this.path[i - 1][0] * mPerDegLat;
			var bx = this.path[i][1] * mPerDegLng, by = this.path[i][0] * mPerDegLat;
			var dx = bx - ax, dy = by - ay;
			var len = dx * dx + dy * dy;
			var t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
			var cx = ax + t * dx - px, cy = ay + t * dy - py;
			best = Math.min(best, Math.sqrt(cx * cx + cy * cy));
		}
		return best;
	},

	/* "300 meters", "1.5 kilometers", "0.5 miles", "400 feet" - rounded the way people say them */
	spokenDistance: function (inMeters) {
		if (Prefs.lengthUnits == "imperial") {
			var feet = inMeters * 3.2808399;
			if (feet < 1000) return (Math.round(feet / 100) * 100 || 50) + " " + $L("feet");
			var miles = Math.round(inMeters * 0.000621371192 * 10) / 10;
			return miles + " " + (miles == 1 ? $L("mile") : $L("miles"));
		}
		if (inMeters < 1000) {
			return (inMeters < 100 ? Math.round(inMeters / 10) * 10 : Math.round(inMeters / 50) * 50) + " " + $L("meters");
		}
		return (Math.round(inMeters / 100) / 10) + " " + $L("kilometers");
	},

	/* instructions carry <b> around street names */
	plain: function (inHtml) {
		return String(inHtml || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
	},

	lowerFirst: function (inText) {
		return inText.charAt(0).toLowerCase() + inText.slice(1);
	},

	speechAvailable: function () {
		return typeof window != "undefined" && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance == "function";
	},

	speak: function (inSentences) {
		if (!this.speechAvailable()) return;
		var lang = Prefs.lang || navigator.language || "en-US";
		var voices = window.speechSynthesis.getVoices();
		var voice = null;
		for (var i = 0; i < voices.length && !voice; i++) {
			if (voices[i].lang && voices[i].lang.toLowerCase() == lang.toLowerCase()) voice = voices[i];
		}
		for (var j = 0; j < voices.length && !voice; j++) {
			if (voices[j].lang && voices[j].lang.split("-")[0] == lang.split("-")[0]) voice = voices[j];
		}
		inSentences.forEach(function (inText) {
			var utterance = new window.SpeechSynthesisUtterance(inText);
			utterance.lang = lang;
			if (voice) utterance.voice = voice;
			window.speechSynthesis.speak(utterance);
		});
	}
};
