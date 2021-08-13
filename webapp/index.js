sap.ui.define([
    "sap/m/App",
	"sap/ui/core/ComponentContainer"
], function (App, ComponentContainer) {
	"use strict";
    new App({
        pages: [
            new ComponentContainer({
                name: "com.vistex.taskmanagement",
                settings : {
                    id : "com.vistex.taskmanagement"
                },
                height: "100%",
                width: "100%",
                async: true
            })
        ]
    }).placeAt("content");
});