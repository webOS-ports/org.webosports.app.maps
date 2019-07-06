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
			
		{kind: "FittableRows", name: "layout", classes: "zoom-pre3", components: [
			{name: "mainPane", kind: "onyx.Toolbar", layoutKind: 'FittableColumnsLayout', components: [
				{name: "back", kind: "onyx.IconButton", style: "width: 32px; height: 32px", src: "assets/menu-icon-back.png", ontap: "goBack"},
				{name: "titleOnPane", kind: "enyo.Control", content: "Place Deatils", classes: "truncating-text", ontap: ""}
			]},
			{fit: true, name: "details-panel", components: [
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
	
		var imageUrl = this.getImageForPlace(place);
	
		//if (place.photos) {
			this.$.PlaceDetailsImage.applyStyle("background-image", "url(" + imageUrl + ")");
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
		
		var url = "icon-256x256.png";
		
		if (place.photos) {
			url = place.photos[0].getUrl({'maxWidth': window.innerWidth, 'maxHeight': Math.round(window.innerHeight/3)});
		} else {
			
			// Check for a street view at the position
		this.streetViewCheck = new google.maps.StreetViewService();  
		this.streetViewCheck.getPanoramaByLocation(place.geometry.location, 50, function(result, status) {
			if (status == "OK") {
				
				/* Get an StreetView image */
				url = "https://maps.googleapis.com/maps/api/streetview?key=AIzaSyBSTvlMEfLkRzgdZbqhv7PsA2MulWjgYNs&size=" + window.innerWidth + "x" + Math.round(window.innerHeight/3) + "&location=" + place.geometry.location.lat() + "," +  place.geometry.location.lng() + "&heading=235";
				this.$.PlaceDetailsImage.applyStyle("background-image", "url(" + url + ")");
			
				
				}else{
				
				/* do nothing */
				//url = "https://maps.googleapis.com/maps/api/staticmap?size=" + window.innerWidth + "x150&location=" + place.geometry.location.lat() + "," +  place.geometry.location.lng() + "&zoom=11";
				url = "https://maps.googleapis.com/maps/api/staticmap?key=AIzaSyBSTvlMEfLkRzgdZbqhv7PsA2MulWjgYNs&center=" + place.geometry.location.lat() + "," +  place.geometry.location.lng() + "&zoom=19&size=" + window.innerWidth + "x" + Math.round(window.innerHeight/3) + "&maptype=satellite";
				this.$.PlaceDetailsImage.applyStyle("background-image", "url(" + url + ")");
		  
				}
			}.bind(this));
			
			
			};
		
		return url;		
	},
	
	getElevations: function (locations) {
		
	  var positionalRequest = {
		'locations': locations
	  }

	  var resp = elevator.getElevationForLocations(positionalRequest, function(results, status) {
		if (status == google.maps.ElevationStatus.OK) {

		  if (results[0]) {
			this.setElevationResults(results);
		  } else {
			enyo.log("No results found");
		  }
		} else {
		  enyo.log("Elevation service failed due to: " + status);
		}
	  }.bind(this));
	  
	},

	setElevationResults: function (results) {	

		this.$.PlaceDetailsElevation.setContent("Elevation: <br>" + Math.round(results[0].elevation) + "m");
		this.$.PlaceDetailsElevation.show();
		
	},
	
	openingHoursDetails: function() {
		this.$.openingHoursPopup.show();
	}

});

