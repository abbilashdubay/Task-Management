sap.ui.define([
	"sap/ui/test/Opa5",
	"com/vistex/taskmanagement/test/integration/arrangements/Startup"
], function (Opa5, Startup) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "com.vistex.taskmanagement.view",
		autoWait: true
	});
});