/* an item that contains icon, label and any input control, e.g. onyx.Checkbox, onyx.ToggleButton */
enyo.kind({
	name: "SettingsItem",
	published: {
		label: "",
		icon: "",
		value: false
	},
	events: {
		onIconTap: "",
	},
	components: [
		//{name: "first", components: [
			{name: "icon", kind: "onyx.Icon", classes: "labeled-item-icon", ontap: "iconTap"},
			{name: "label", allowHtml: true, kind: "Control"},
			//{tag: "br"},
		//]},
		//{name: "second", components: [
			{name: "input", classes: "settings-item-input", value: false},
			//{name: "label2", kind: "Control", content: "Enablde fohds hudfs"}
		//]}
	],
	defaultKind: "onyx.Checkbox",
	create: function() {
		this.inherited(arguments);
		this.labelChanged();
		this.iconChanged();
		this.$.input.value = this.value;
	},
	inputChanged: function() {
		this.$.input.value = this.value;
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
	iconTap: function() {
		this.doIconTap();
	},
});
