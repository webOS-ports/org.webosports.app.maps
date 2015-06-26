enyo.kind({
	name: "SearchListItem",
	classes: "item enyo-border-box",
	style: "padding: 10px;",
	published: {
    	itemId: "",
    	itemName: "",
    	itemAddress: "",
    	itemDistance: "",
    	itemRating: "",
    	itemIcon: ""
  	},
	components: [
		{name: "itemIcon", kind: "Image", classes: "item-icon", src: ""},
		{name: "itemName", content: "", classes: "item-name truncating-text"},
		{name: "itemRating", content: "", classes: "item-rating", showing: false},
		{name: "itemRatingStar", content: "", allowHtml: true, classes: "rating-container", showing: false},
		{name: "itemDistance", content: "", classes: "item-distance"},
	 	{name: "itemAddress", content: "", classes: "item-address"} 	
	],
	create: function() {
    	this.inherited(arguments);
    	this.nameChanged();
	},
	setSelected: function(inSelected) {
		this.addRemoveClass("item-selected", inSelected);
		//this.addRemoveClass("onyx-tooltip onyx-blue", inSelected);
	},
	setItemName:function(data){
		this.itemName = data;
		this.nameChanged();
	},
	setItemAddress:function(data){
		this.itemAddress = data;
		this.addressChanged();
	},
	setItemDistance:function(data){
		if (!data.contains("NaN") || !(this.$.itemIcon.src.contains("blue_dot"))) this.$.itemDistance.setContent(data);
	},
	setItemRating:function(data){
		this.itemRating = data;
		this.ratingChanged();
	},
	setItemIcon:function(data){
		this.itemIcon = data;
		this.iconChanged();
	},
	nameChanged: function() {
		this.$.itemName.setContent(this.itemName);
	},
	addressChanged: function() {
		this.$.itemAddress.setContent(this.itemAddress);
	},
	ratingChanged: function() {
		if (this.itemRating) {
			this.$.itemRating.show();
			this.$.itemRatingStar.show();
		} else {
			this.$.itemRating.hide();
			this.$.itemRatingStar.hide();
		};
		this.$.itemRating.setContent(this.itemRating);
		var ratingElement = '<div class="rating_bar"><div id="ratingstar" style="width: ' + this.itemRating*20 + '%;"></div></div>';
		this.$.itemRatingStar.setContent(ratingElement);
	},
	iconChanged: function() {
		this.$.itemIcon.setSrc(this.itemIcon);
	}
});
