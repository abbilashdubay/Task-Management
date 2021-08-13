sap.ui.define([], function () {
	"use strict";

	return {
		//formatter function begin
		// called from view/fragments for value formatting during runtime
		formatTaskState: function (sState) {
			if (sState === "New") {
				return "Indication01";
			} else if (sState === "In Progress") {
				return "Indication03";
			} else {
				return "Indication04";
			}
		},

		getPriorityIcon: function (sVal) {
			if (sVal === "0") {
				return "sap-icon://arrow-bottom";
			} else if (sVal === "1") {
				return "sap-icon://circle-task-2";
			} else {
				return "sap-icon://arrow-top";
			}
		},

		isCommentsVisible: function (sName) {
			return (sName === "") ? false : true;
		},

		setTaskButtonVisibility: function (val) {
			if (val !== undefined || val !== null) {
				return true;
			} else {
				return false;
			}
		}
	};
});