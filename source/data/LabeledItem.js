/* an item that contains icon, label and any input control, e.g. onyx.Checkbox, onyx.ToggleButton */
enyo.kind({
	name: "LabeledItem",
	published: {
		label: "",
		icon: "",
		checked: false
	},
	components: [
		{name: "icon", kind: "Image", classes: "labeled-item-icon"},
		{name: "label", kind: "Control"},
		{name: "input", classes: "label-item-input", checked: false, value: false}
	],
	defaultKind: "onyx.Checkbox",
	create: function() {
		this.inherited(arguments);
		this.labelChanged();
		this.iconChanged();
		this.$.input.checked = this.checked;
	},
	inputChanged: function() {
		this.$.input.checked = this.checked;
		this.$.input.value = this.checked;
	},
	labelChanged: function() {
		this.$.label.setContent(this.label);
	},
	iconChanged: function() {
		this.$.icon.setSrc(this.icon);
	},
	getValue: function() {
		return this.$.input.getValue();
	},
	getActive: function() {
		return this.$.input.checked;
	}
});
