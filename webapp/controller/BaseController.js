sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent"
], function(Controller, History, UIComponent) {
	"use strict";

	return Controller.extend("com.vistex.taskmanagement.controller.BaseController", {

		getRouter : function () {
//			return this.getOwnerComponent().getRouter();
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		
		/**
		 * Genric nav back method to handle back button
		 * @public
		 * return void
		 */
		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("detail", {}, true /*no history*/);
			}
		}

	});

});