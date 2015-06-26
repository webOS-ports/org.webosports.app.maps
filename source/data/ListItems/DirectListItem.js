enyo.kind({
	name: "DirectListItem",
	classes: "direct-item onyx-toolbar-inline enyo-border-box",
	style: "padding: 10px;",
	published: {
    	itemStep: "",
    	itemInstructions: "",
    	itemDistance: "",
    	itemIcon: ""
  	},
	components: [	
		{name: "itemStep", showing: false, content: "", classes: "direct-item-step"},
		{name: "itemIcon", style: "zoom: 0.5; width: 64px; height: 64px;"},
		{name: "centered", components: [
			{name: "itemInstructions", content: "", allowHtml: true, classes: "direct-item-instructions"},
			{name: "itemDistance", content: "", classes: "direct-item-distance"}
		]}
	],
	create: function() {
    	this.inherited(arguments);
    	//this.StepChanged();
	},
	setSelected: function(inSelected) {
		this.addRemoveClass("item-selected", inSelected);
	},
	setItemStep:function(data){
		this.itemStep = data;
		this.stepChanged();
	},
	setItemInstructions:function(data){
		this.itemInstructions = data;
		this.instructionsChanged();
	},
	setItemDistance:function(data){
		this.itemDistance = data;
		this.distanceChanged();
	},
	setItemIcon:function(data){
		this.itemIcon = data;
		this.iconChanged();
	},
	stepChanged: function() {
		this.$.itemStep.setContent(this.itemStep);
	},
	instructionsChanged: function() {
		this.$.itemInstructions.setContent(this.itemInstructions);
	},
	distanceChanged: function() {
		this.$.itemDistance.setContent(this.itemDistance);
	},
	iconChanged: function() {
		this.$.itemIcon.setClasses(this.itemIcon);
	}
});
