/*
 * Sharing a place: by email, by message or as text on the clipboard.
 *
 * On LuneOS the place goes to the apps that handle it: Email takes a mailto:
 * target and fills in subject and body from it, Messaging takes
 * compose.messageText. Both are started through the application manager,
 * which needs the application.launcher permission. In a browser the mailto:
 * or sms: URL is opened instead.
 */
var Share = {
	/* a link anyone can open, with a marker on the place */
	osmUrl: function (inLatLng) {
		var lat = Number(inLatLng.lat()).toFixed(6), lng = Number(inLatLng.lng()).toFixed(6);
		return "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=17/" + lat + "/" + lng;
	},

	text: function (inPlace) {
		var lines = [String(inPlace.name)];
		if (inPlace.formatted_address && inPlace.formatted_address != inPlace.name) {
			lines.push(String(inPlace.formatted_address).replace(/<br>/g, ", "));
		}
		lines.push(this.osmUrl(inPlace.geometry.location));
		return lines.join("\n");
	},

	mailto: function (inPlace) {
		return "mailto:?subject=" + encodeURIComponent(String(inPlace.name)) + "&body=" + encodeURIComponent(this.text(inPlace));
	},

	sms: function (inPlace) {
		return "sms:?body=" + encodeURIComponent(this.text(inPlace));
	},

	/* inCallback(error) */
	launch: function (inAppId, inParams, inCallback) {
		var request = new enyo.ServiceRequest({service: "luna://com.webos.service.applicationmanager/", method: "launch"});
		request.response(function () { inCallback(null); });
		request.error(function (inSender, inResponse) { inCallback((inResponse && inResponse.errorText) || "launch failed"); });
		request.go({id: inAppId, params: inParams});
	},

	byEmail: function (inPlace, inCallback) {
		if (enyo.platform.webos) {
			this.launch("com.palm.app.email", {target: this.mailto(inPlace)}, inCallback);
		} else {
			window.open(this.mailto(inPlace), "_blank");
			inCallback(null);
		}
	},

	/* only offered on webOS, where Messaging takes the text */
	byMessage: function (inPlace, inCallback) {
		if (enyo.platform.webos) {
			this.launch("org.webosports.app.messaging", {compose: {messageText: this.text(inPlace)}}, inCallback);
		} else {
			window.open(this.sms(inPlace), "_blank");
			inCallback(null);
		}
	},

	/* navigator.clipboard is refused to WebAppManager apps; a selected text area can be copied */
	copy: function (inPlace) {
		var area = document.createElement("textarea");
		area.value = this.text(inPlace);
		area.setAttribute("readonly", "");
		area.style.position = "fixed";
		area.style.opacity = "0";
		document.body.appendChild(area);
		area.select();
		var copied = false;
		try {
			copied = document.execCommand("copy");
		} catch (e) {
			copied = false;
		}
		document.body.removeChild(area);
		return copied;
	}
};
