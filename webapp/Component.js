sap.ui.define([
	"sap/base/util/UriParameters",
	'sap/ui/core/UIComponent',
	"sap/ui/model/json/JSONModel",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"com/vistex/taskmanagement/model/models"
], function (UriParameters, UIComponent, JSONModel, library, FlexibleColumnLayoutSemanticHelper, models) {
	"use strict";

	var LayoutType = library.LayoutType;

	return UIComponent.extend("com.vistex.taskmanagement.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			//Initialize empty model for FCL
			var oModel = new JSONModel();
			this.setModel(oModel);

			//initialize router
			this.getRouter().initialize();
		},

		/**
		 * Returns an instance of the semantic helper
		 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
		 */
		getHelper: function () {
			var oFCL = this.getRootControl().byId("fcl"),
				oParams = UriParameters.fromQuery(location.search),
				oSettings = {
					defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
					mode: oParams.get("mode"),
					initialColumnsCount: oParams.get("initial"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}
	});
});