sap.ui.define([
	"jquery.sap.global",
	"sap/base/util/deepExtend",
	"sap/ui/core/syncStyleClass",
	"sap/ui/model/json/JSONModel",
	"com/vistex/taskmanagement/controller/BaseController",
	'sap/ui/core/Fragment',
	'com/vistex/taskmanagement/model/formatter',
	'sap/m/MessageBox',
	"sap/ui/core/format/DateFormat",
	"sap/m/ObjectMarker",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"sap/m/library",
	"sap/ui/core/format/FileSizeFormat",
	"sap/ui/Device",
], function (jQuery, deepExtend, syncStyleClass, JSONModel, BaseController, Fragment, formatter, MessageBox, DateFormat, ObjectMarker,
	MessageToast, UploadCollectionParameter, MobileLibrary, FileSizeFormat, Device) {
	"use strict";

	var ListMode = MobileLibrary.ListMode,
		ListSeparators = MobileLibrary.ListSeparators;

	return BaseController.extend("com.vistex.taskmanagement.controller.DetailDetail", {
		formatter: formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * 
		 */
		onInit: function () {

			this._fileUploadInitialization(); //file upload init

			//detaildetail page header buttons
			var oExitButton = this.getView().byId("exitFullScreenBtn"),
				oEnterButton = this.getView().byId("enterFullScreenBtn");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onTaskMatched, this);

			//set focus, add event delegate
			[oExitButton, oEnterButton].forEach(function (oButton) {
				oButton.addEventDelegate({
					onAfterRendering: function () {
						if (this.bFocusFullScreenButton) {
							this.bFocusFullScreenButton = false;
							oButton.focus();
						}
					}.bind(this)
				});
			}, this);

			//initial form fragments
			this._formFragments = {};
		},

		/**
		 * Method to initialize file upload collection
		 * @public
		 */
		_fileUploadInitialization: function () {
			this.getView().setModel(new JSONModel(Device), "device");

			this.getView().setModel(new JSONModel({
				"maximumFilenameLength": 55,
				"maximumFileSize": 1000,
				"mode": ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": true,
				"enableDelete": true,
				"visibleEdit": true,
				"visibleDelete": true,
				"listSeparatorItems": [
					ListSeparators.All,
					ListSeparators.None
				],
				"showSeparators": ListSeparators.All,
				"listModeItems": [{
					"key": ListMode.SingleSelectMaster,
					"text": "Single"
				}, {
					"key": ListMode.MultiSelect,
					"text": "Multi"
				}]
			}), "settings");

			//set file types
			this.getView().setModel(new JSONModel({
				"items": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "doc", "xls", "pdf", "png"]
			}), "fileTypes");
		},

		/**
		 * Factory function called for amrkers
		 * @param {sId} - ID of the control
		 * @param {oContext} - context of markers
		 * @public
		 */
		createObjectMarker: function (sId, oContext) {
			var mSettings = null;

			if (oContext.getProperty("type")) {
				mSettings = {
					type: "{type}",
					press: this.onMarkerPress
				};
			}
			return new ObjectMarker(sId, mSettings);
		},

		/**
		 * formatter function to format file size
		 * @param {sValue}
		 * @public
		 * @return {String}
		 */
		formatAttribute: function (sValue) {
			if (jQuery.isNumeric(sValue)) {
				return FileSizeFormat.getInstance({
					binaryFilesize: false,
					maxFractionDigits: 1,
					maxIntegerDigits: 3
				}).format(sValue);
			} else {
				return sValue;
			}
		},

		/**
		 * Method called on change event of file upload
		 * oEvent {oEvent} - Event data
		 * @public
		 */
		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		},

		/**
		 * Method called on file delete in upload collection
		 * @oEvent {oEvent} - Event data
		 * @public
		 */
		onFileDeleted: function (oEvent) {
			this._deleteItemById(oEvent.getParameter("documentId"));
			MessageToast.show("FileDeleted event triggered.");
		},

		/**
		 * Method called to delete the
		 * @param {sItemToDeleteId} - documentId
		 * @private
		 */
		_deleteItemById: function (sItemToDeleteId) {
			var oData = this.getView().byId("UploadCollection").getModel("masterTaskManagementModel").getData();
			var oTasks = this.getView().getModel("masterTaskManagementModel").getProperty("/")
			var oCurrentTask = oData[this._task];
			var aItems = oCurrentTask.tasks.taskAttachments.items;
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			this.getView().getModel("masterTaskManagementModel").setProperty("/" + this._task + "/tasks/taskAttachments/items", aItems);
			this.getView().getModel("masterTaskManagementModel").refresh();
			this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		deleteMultipleItems: function (aItemsToDelete) {
			var oData = this.getView().byId("UploadCollection").getModel().getData();
			var nItemsToDelete = aItemsToDelete.length;
			var aItems = deepExtend({}, oData).items;
			var i = 0;
			jQuery.each(aItems, function (index) {
				if (aItems[index]) {
					for (i = 0; i < nItemsToDelete; i++) {
						if (aItems[index].documentId === aItemsToDelete[i].getDocumentId()) {
							aItems.splice(index, 1);
						}
					}
				}
			});
			this.getView().byId("UploadCollection").getModel().setData({
				"items": aItems
			});
			this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},

		/**
		 * Method called to check if file name length exceeded
		 * @private
		 */
		onFilenameLengthExceed: function () {
			MessageToast.show("FilenameLengthExceed event triggered.");
		},
		/**
		 * Method called to check if file size length exceeded
		 * @private
		 */
		onFileSizeExceed: function () {
			MessageToast.show("FileSizeExceed event triggered.");
		},

		/**
		 * Method called on file type missmatch
		 * @private
		 */
		onTypeMissmatch: function () {
			MessageToast.show("TypeMissmatch event triggered.");
		},

		/**
		 * Method called on upload complete
		 * @param {oEvent} - Event data
		 * @private
		 */
		onUploadComplete: function (oEvent) {
			var oUploadCollection = this.getView().byId("UploadCollection");
			var oModel = this.getView().getModel("masterTaskManagementModel");
			var oTasks = this.getView().getModel("masterTaskManagementModel").getProperty("/");
			var oData = oModel.getProperty("/" + this._task);
			var aEntries = oData.tasks.taskAttachments.items;
			var sFileName = oEvent.getParameter("files")[0].fileName;
			var sUrl = "file:///Users/i341283/Desktop" + sFileName;

			//add the recent uploaded file details into the model
			aEntries.unshift({ //unshift to add model data into the first array index
				"documentId": Date.now().toString(), // generate Id,
				"fileName": oEvent.getParameter("files")[0].fileName,
				"mimeType": "",
				"thumbnailUrl": "",
				"url": sUrl,
				"attributes": [{
					"title": "Uploaded By",
					"text": oData.tasks.taskAssigneeName,
					"active": false
				}, {
					"title": "Uploaded On",
					"text": new Date().toLocaleDateString(),
					"active": false
				}, {
					"title": "File Size",
					"text": "505000",
					"active": false
				}],
				"statuses": [{
					"title": "",
					"text": "",
					"state": "None"
				}],
				"markers": [{}],
				"selected": false
			});
			oModel.setProperty("/", oTasks); //update the model
			oModel.refresh();

			// Sets the text to the label
			this.getView().byId("attachmentTitle").setText(this.getAttachmentTitleText());

			// delay the success message for to notice onChange message
			setTimeout(function () {
				MessageToast.show("UploadComplete event triggered.");
			}, 4000);
		},

		/**
		 * Method called on upload complete
		 * @param {oEvent} - Event data
		 * @public
		 */
		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			MessageToast.show("BeforeUploadStarts event triggered.");
		},

		/**
		 * Method called on file type change
		 * @param {oEvent} - Event data
		 * @public
		 */
		onFileTypeChange: function (oEvent) {
			this.getView().byId("UploadCollection").setFileType(oEvent.getSource().getSelectedKeys());
		},

		/**
		 * Method called getting the attachment text
		 * @param {oEvent} - Event data
		 * @public
		 */
		getAttachmentTitleText: function () {
			var aItems = this.getView().byId("UploadCollection").getItems();
			return "Uploaded (" + aItems.length + ")";
		},

		/**
		 * Method called to delete selected items from upload collection list
		 * @public
		 */
		onDeleteSelectedItems: function () {
			var aSelectedItems = this.getView().byId("UploadCollection").getSelectedItems();
			this.deleteMultipleItems(aSelectedItems);
			if (this.getView().byId("UploadCollection").getSelectedItems().length < 1) {
				this.getView().byId("selectAllButton").setPressed(false);
				this.getView().byId("selectAllButton").setText("Select all");
			}
			MessageToast.show("Delete selected items button press.");
		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). 
		 * Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 */
		onAfterRendering: function () {

			//hide footer
			this.getView().byId("otbFooter").setVisible(false); //hide the footer initially
		},

		/**
		 * Method called on edit button press in object page
		 * @public
		 */
		handleEditPress: function () {

			//Clone the data
			//	this._otask = Object.assign({}, this.getView().getModel("masterTaskManagementModel").getData()[Number(this._task)]);//shallow copy
			this._otask = $.extend(true, {}, this.getView().getModel("masterTaskManagementModel").getData()[Number(this._task)]); //deep copy object if in case canceled the task in between

			this._toggleButtonsAndView(true); //utility function for toggling between fragments

		},

		/**
		 * Method called on delete button press in object page
		 * @public
		 */
		handleDeletePress: function () {
			//	this._otask = Object.assign({}, this.getView().getModel("masterTaskManagementModel").getData()[Number(this._task)]);
			var oModel = this.getView().getModel("masterTaskManagementModel");
			var oData = oModel.getData();
			//warning message
			//note: move the texts to i18n resourcebundle
			MessageBox.warning(
				"You are about to delete this task, Are you sure?", {
					title: "Warning",
					actions: [
						"Delete",
						sap.m.MessageBox.Action.CANCEL
					],
					emphasizedAction: "Delete",
					onClose: (oEvent) => { //ES6 arrow operator to avoid this binding
						if (oEvent === "Delete") {
							var sSelectedTaskPath = this._task;
							//Get the OData 
							var oTasks = oModel.getProperty("/");
							// Delete the record from the oEmployees Object
							oTasks.splice(sSelectedTaskPath, 1);
							// Update the Model
							oModel.setProperty("/", oTasks);
							//	delete oData[this._task];
							this.getView().getModel("masterTaskManagementModel").refresh();
							var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
							this.navigateToView(sNextLayout, "detail");
						}
					}
				}
			);

		},

		/**
		 * Utitlity method to toggle the buttons during edit and display mode
		 * @param{Boolean} bEdit - edit true or false
		 * @public
		 */
		_toggleButtonsAndView: function (bEdit) {
			var oView = this.getView();

			// Show the appropriate action buttons
			oView.byId("otbFooter").setVisible(bEdit);
			oView.byId("editBtn").setVisible(!bEdit);
			oView.byId("deleteBtn").setVisible(!bEdit);
			oView.byId("closeButton").setVisible(!bEdit);
			// Set the right form type

			this.getView().getModel("masterTaskManagementModel").refresh();
			this._showFormFragment(bEdit ? "ChangeTaskDetail" : "DisplayTaskDetail");
		},

		/**
		 * Method called on click of cancel button in the footer
		 * @public
		 */
		handleCancelPress: function () {

			//Restore the data
			var oModel = this.getView().getModel("masterTaskManagementModel");
			var oData = oModel.getData();
			MessageBox.warning(
				"Your entries will be lost when you leave this page", {
					title: "Warning",
					actions: [
						"Leave Page",
						sap.m.MessageBox.Action.CANCEL
					],
					emphasizedAction: "Leave Page",
					onClose: (oEvent) => {
						if (oEvent === "Leave Page") {
							oData[this._task] = this._otask; //set the deep copied object here

							oModel.setData(oData);
							this._toggleButtonsAndView(false);
							this.getView().getModel("masterTaskManagementModel").refresh(); //refresh model
						}
					}
				}
			);

			//	this.handleFullScreen();

		},

		/**
		 * Method called to save the edit page details into the model
		 * @public
		 */
		handleSavePress: function () {

			let oView = this.getView();
			let oMasterTaskManagementModel = this.getView().getModel("masterTaskManagementModel");
			oMasterTaskManagementModel.setProperty("/" + this._task + "/projectCode", oView.byId("edit-project").getSelectedItem().getText());
			oMasterTaskManagementModel.setProperty("/" + this._task + "/projectName", oView.byId("edit-project").getSelectedItem().getText());
			oMasterTaskManagementModel.setProperty("/" + this._task + "/tasks/taskTypeName", oView.byId("edit-taskType").getSelectedItem().getText());
			oMasterTaskManagementModel.setProperty("/" + this._task + "/tasks/taskAssigneeName", oView.byId("edit-assignee").getSelectedItem().getText());
			oMasterTaskManagementModel.setProperty("/" + this._task + "/tasks/taskPriorityName", oView.byId("edit-priority").getSelectedItem().getText());
			oMasterTaskManagementModel.setProperty("/" + this._task + "/tasks/taskStatus", oView.byId("edit-taskStatus").getSelectedItem().getText());
			this.getView().getModel("masterTaskManagementModel").refresh();
			this._toggleButtonsAndView(false); // toggle button after save
			//	this.handleFullScreen();

		},

		/**
		 * Method called on click of send button in feed input list
		 * @public
		 */
		onPost: function (oEvent) {
			let oMasterTaskManagementModel = this.getView().getModel("masterTaskManagementModel");
			var oFormat = DateFormat.getDateTimeInstance({
				style: "medium"
			});
			var sProcessor = oMasterTaskManagementModel.getProperty("/" + this._task + "/tasks/taskAssigneeName")
			var oDate = new Date();
			var sDate = oFormat.format(oDate);
			// create new entry
			var sValue = oEvent.getParameter("value");
			var oEntry = {
				Author: sProcessor,
				AuthorPicUrl: "",
				Type: "Reply",
				Date: "" + sDate,
				Text: sValue
			};

			// update model
			var oModel = this.getView().getModel("masterTaskManagementModel");
			var oTasks = this.getView().getModel("masterTaskManagementModel").getProperty("/");
			var oData = oModel.getProperty("/" + this._task);
			var aEntries = oData.tasks.taskComments;
			aEntries.unshift(oEntry); //add the comment to first index of array
			oModel.setProperty("/", oTasks);
			oModel.refresh();
		},

		/**
		 * Method to handle full screen button on object page for fcl
		 * @public
		 */
		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.navigateToView(sNextLayout, "detailDetail");
		},

		/**
		 * Method to handle exit screen button on object page for fcl
		 * @public
		 */
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.navigateToView(sNextLayout, "detailDetail");
		},

		/**
		 * Method to handle close button on object page for fcl
		 * @public
		 */
		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.navigateToView(sNextLayout, "detail");
		},

		/**
		 * Method called  from fcl related function and on object delete
		 * @public
		 */
		navigateToView: function (sNextLayout, sNextView) {
			this.oRouter.navTo(sNextView, {
				layout: sNextLayout,
				userName: this._userName, //url param
				task: this._task //url param
			});
		},

		/**
		 * Route function called everytime when detaildetail page is opened
		 * @public
		 */
		_onTaskMatched: function (oEvent) {
			this._task = oEvent.getParameter("arguments").task || "0";
			this._userName = oEvent.getParameter("arguments").userName;

			//bind the context via element binding to the entire view
			this.getView().bindElement({
				path: "/" + this._task,
				model: "masterTaskManagementModel"
			});

			// Set the initial form to be the display one
			this._showFormFragment("DisplayTaskDetail");

		},

		/**
		 * Method to load the fragment based on mode
		 * @param {sFragmentName} - Name of the fragment. Ex: display or change
		 * @public
		 */
		_getFormFragment: function (sFragmentName) {
			var pFormFragment = this._formFragments[sFragmentName],
				oView = this.getView();

			if (!pFormFragment) {
				pFormFragment = Fragment.load({
					id: oView.getId(),
					name: "com.vistex.taskmanagement.fragments." + sFragmentName,
					controller: this
				});
				this._formFragments[sFragmentName] = pFormFragment;
			}

			return pFormFragment;
		},

		/**
		 * Method to show/add the fragment onto the object page basic information section based on mode
		 * @param {sFragmentName} - Name of the fragment. Ex: display or change
		 * @public
		 */
		_showFormFragment: function (sFragmentName) {
			var oPage = this.getView().byId("GeneralInfo");
			var that = this;
			oPage.removeAllBlocks();
			this._getFormFragment(sFragmentName).then(function (oVBox) {
				oPage.addBlock(oVBox);
				if (sFragmentName !== "DisplayTaskDetail") {
					//	Sets the text to the label
					that.byId("UploadCollection").addEventDelegate({
						onBeforeRendering: function () {
							that.byId("attachmentTitle").setText(that.getAttachmentTitleText());
						}.bind(that)
					});
				}
			});
		}
	});
});