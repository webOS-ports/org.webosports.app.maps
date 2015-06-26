/**
	Define and instantiate your enyo.Application kind in this file.  Note,
	application rendering should be deferred until DOM is ready by wrapping
	it in a call to enyo.ready().
*/

enyo.kind({
	name: "Maps.Application",
	kind: "enyo.Application",
	view: "Maps.MainView"
});

enyo.ready(function () {
	enyo.log("****** APPLICATION LAUNCHED on " + enyo.platform.platformName + " PLATFORM ******* ");
	new Maps.Application();
});
