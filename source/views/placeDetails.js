enyo.kind({
	name: "placeDetails",
	published: {
		place: "",	
	},
	events: {
		onGoBack: ""
    },
	components: [
		{kind: "Signals", onload: "load", onunload: "cleanup"},
		{name: "detailspanel", classes: "details zoom-pre3", components: [
			
		{kind: "FittableRows", name: "layout", components: [
			{name: "mainPane", kind: "onyx.Toolbar", layoutKind: 'FittableColumnsLayout', components: [
				{name: "back", kind: "onyx.IconButton", style: "width: 32px; height: 32px", src: "assets/menu-icon-back.png", ontap: "goBack"},
				{name: "titleOnPane", kind: "enyo.Control", content: "Place Deatils", classes: "truncating-text", ontap: ""}
			]},
			{fit: true, name: "details-panel", classes: "details-body", components: [
				{name: "PlaceDetailsImageContainer", components: [
						{name: "PlaceDetailsImage", classes: "details-image"}
					]},
				{classes: "onyx-sample-divider", content: "Summary:"},
				{name: "PlaceDetailsName", allowHtml: true, classes: "item-name", ontap: "test"},
				{name: "PlaceDetailsRating", content: "", classes: "item-rating", showing: false},
				{name: "PlaceDetailsRatingStar", content: "", allowHtml: true, classes: "rating-container", showing: false},
				{tag: "br"},
				{name: "PlaceDetailsAddress", allowHtml: true, classes: "item-address", content: ""},
				{tag: "br"},
				{name: "PlaceDetailsLocation", allowHtml: true, classes: "item-address", content: ""},
				{tag: "br"},
				{name: "PlaceDetailsElevation", allowHtml: true, content: "", classes: "item-address", showing: false},
				{tag: "br"},
				{name: "PlaceDetailsOpening", showing: false, components: [
					{classes: "onyx-sample-divider", content: "Opening hours:"},
					{name: "PlaceDetailsOpeningText", classes: "item-address"},
					{tag: "br"}
				]},
				{name: "PlaceDetailsPhone", kind: "onyx.Button", classes: "onyx-affirmative", style: "margin: 4px;", showing: false, ontap: "openPhone"},
				{name: "PlaceDetailsWebsite", kind: "onyx.Button", classes: "onyx-blue", style: "margin: 4px; max-width: 90%; overflow: hidden; text-overflow: ellipsis;", showing: false, ontap: "openWebsite"}
			]},
		]},
			
			
			
			
			
			{showing: false, components: [
				{classes: "onyx-sample-divider", content: "Opening hours:"},
				{name: "PlaceDetailsHours", kind: "enyo.Control", classes: "", content: "", allowHtml: true, ontap: "openingHoursDetails"},
				{name: "openingHoursPopup", classes: "zoom-pre3", kind: "onyx.Popup", allowHtml: true, content: ""}
			]},
		]}
	],
create: function(){
	
	this.inherited(arguments);
	this.resize();

},
load: function() {

},
cleanup: function () {
	enyo.log("*** EXIT DETAILS ***");
},

goBack: function () {
	this.doGoBack();
},

setPlaceDetails: function(place) {
	
		/* no picture area unless the engine has one (Google photo, street view, aerial) */
		this.$.PlaceDetailsImageContainer.hide();
		this.getImageForPlace(place);
	
		//if (place.photos) {
			//this.$.PlaceDetailsImage.applyStyle("background", "url(" + place.photos[0].getUrl({'maxWidth': window.innerWidth, 'maxHeight': 150}) + ") center center no-repeat");
			this.$.PlaceDetailsImage.applyStyle("width", window.innerWidth + "px");
			this.$.PlaceDetailsImage.applyStyle("height", window.innerHeight/3 + "px");
			this.$.PlaceDetailsImage.applyStyle("background-size", "cover");
		//};
		this.$.titleOnPane.setContent(place.name);
	    this.$.PlaceDetailsName.setContent(place.name);
	    this.$.PlaceDetailsAddress.setContent("Address" + ":<br>" + place.formatted_address);
	    this.$.PlaceDetailsLocation.setContent("Loc" + ":<br>" + place.geometry.location.toUrlValue(8));
	    //this.place.geometry.location.toUrlValue(8);
	    
	    this.$.PlaceDetailsElevation.hide();
	    this.getElevations([place.geometry.location]);
	    
	    /** Contact details (OSM tags or Google place details) **/
	    this.place = place;
	    this.$.PlaceDetailsPhone.setContent($L("Call") + " " + (place.formatted_phone_number || ""));
	    this.$.PlaceDetailsPhone.setShowing(!!place.formatted_phone_number);
	    this.$.PlaceDetailsWebsite.setContent(place.website || "");
	    this.$.PlaceDetailsWebsite.setShowing(!!place.website);
	    /* OSM opening_hours syntax, e.g. "Mo-Fr 09:00-18:00; Sa 10:00-14:00" */
	    this.$.PlaceDetailsOpeningText.setContent(String(place.opening_hours_text || "").replace(/;\s*/g, "\n"));
	    this.$.PlaceDetailsOpeningText.applyStyle("white-space", "pre-line");
	    this.$.PlaceDetailsOpening.setShowing(!!place.opening_hours_text && !place.opening_hours);
	    
	    
	    /** Manage RATING **/
	    if (place.rating) {
			this.$.PlaceDetailsRating.show();
			this.$.PlaceDetailsRatingStar.show();
		} else {
			this.$.PlaceDetailsRating.hide();
			this.$.PlaceDetailsRatingStar.hide();
		};

		this.$.PlaceDetailsRating.setContent(place.rating);
		var ratingElement = '<div class="rating_bar"><div id="ratingstar" style="width: ' + place.rating*20 + '%;"></div></div>';
		this.$.PlaceDetailsRatingStar.setContent(ratingElement);
	    
	    /** Manage OPENING HOURS **/
	    if (place.opening_hours) {
					
			
			var d = new Date();
			var n = d.getDay()-1;
			var todayText;
			var opennow;
			//enyo.log("PLACE DETAILS", place.opening_hours);
				
			
			if (place.opening_hours.periods) {

			todayText = place.opening_hours.weekday_text[n];
			this.$.PlaceDetailsHours.setContent(todayText);
			this.$.PlaceDetailsHours.parent.show();
			var popUpText = "";
			
			/* Fills the open hours week schedule */ 
			for (day = 0; day < 7; day++) {			
					if (day == n) {
						  opennow = (place.opening_hours.open_now ? 'color="green"' : 'color="red"');
					} else {
						  opennow = "";
					};					
					var todaybold = ((n==day) ? ' weight: bold ' : ' weight: normal ');	  
						  popUpText = popUpText + "<font " + opennow + todaybold + ">" + place.opening_hours.weekday_text[day] + "</font>" + "<br>";			  
			};
			
			this.$.openingHoursPopup.setContent(popUpText);
			} else {
				
				todayText = place.opening_hours.open_now ? "closed" : "open";
				this.$.PlaceDetailsHours.setContent("<img src='assets/hours_" + todayText + ".png'>");
				this.$.PlaceDetailsHours.parent.show();
			};
		} else {
			this.$.PlaceDetailsHours.parent.hide();
		};
	},
	
	getImageForPlace: function (place) {
		
		/* the engine calls back only when it has a picture (photo, street view, aerial) */
		mapEngine.placeImage(place, window.innerWidth, Math.round(window.innerHeight/3), function (inUrl) {
			this.$.PlaceDetailsImage.applyStyle("background-image", "url(" + inUrl + ")");
			this.$.PlaceDetailsImageContainer.show();
		}.bind(this));
	},
	
	getElevations: function (locations) {
		
	  mapEngine.elevation(locations[0], function(status, meters) {
		if (!status) {
		  this.setElevationResults([{elevation: meters}]);
		} else {
		  enyo.log("Elevation service failed due to: " + status);
		}
	  }.bind(this));
	  
	},

	setElevationResults: function (results) {	

		this.$.PlaceDetailsElevation.setContent("Elevation: <br>" + Math.round(results[0].elevation) + "m");
		this.$.PlaceDetailsElevation.show();
		
	},
	
	openPhone: function() {
		this.openTarget("tel:" + String(this.place.formatted_phone_number).replace(/[^+\d]/g, ""));
	},
	openWebsite: function() {
		var url = String(this.place.website);
		if (!/^https?:\/\//i.test(url)) url = "http://" + url;
		this.openTarget(url, "org.webosports.app.atlas");
	},
	/* hand the target to the system, never navigate the app window itself */
	openTarget: function(inTarget, inAppId) {
		enyo.log("Opening ", inTarget);
		if (enyo.platform.webos) {
			var params = inAppId ? {id: inAppId, params: {target: inTarget}} : {target: inTarget};
			new enyo.ServiceRequest({service: "palm://com.palm.applicationManager/", method: "open"}).go(params);
		} else {
			window.open(inTarget, "_blank");
		}
	},

	openingHoursDetails: function() {
		this.$.openingHoursPopup.show();
	}

});

