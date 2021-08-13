jQuery.sap.require("sap/ui/thirdparty/d3");
jQuery.sap.declare("com.vistex.taskmanagement.BurndownChart");

//for template i.e. aggregation
sap.ui.core.Element.extend("com.vistex.taskmanagement.BurndownChartItem", {
	metadata: {
		properties: {
			"username": {
				type: "string",
				group: "Misc",
				defaultValue: null
			},
			"tasks": {
				type: "object",
				group: "Misc",
				defaultValue: null
			}
		}
	}
});

//for parent control i.e creating the burndown report
sap.ui.core.Control.extend("com.vistex.taskmanagement.BurndownChart", {
	metadata: {
		properties: {
			"title": {
				type: "string",
				group: "Misc",
				defaultValue: "BurndownChart Title"
			}
		},
		aggregations: {
			"items": {
				type: "com.vistex.taskmanagement.BurndownChartItem",
				multiple: true,
				singularName: "item"
			}
		},
		defaultAggregation: "items",
		events: {
			"onPress": {},
			"onChange": {}
		}
	},

	init: function () {

		this.sParentId = "";
	},

	createBurndownChart: function () {
		/*
		 * Called from renderer
		 */
		var oBurndownChartLayout = new sap.m.VBox({
			alignItems: sap.m.FlexAlignItems.Center,
			justifyContent: sap.m.FlexJustifyContent.Center
		});
		var oBurndownChartFlexBox = new sap.m.FlexBox({
			height: "auto",
			alignItems: sap.m.FlexAlignItems.Center
		});
		/*
		 * By creating the layout and the Flexbox, we create elements specific for this control
		 *  With this ID, we can append an SVG tag inside the FlexBox
		 */
		this.sParentId = oBurndownChartFlexBox.getIdForLabel();
		oBurndownChartLayout.addItem(oBurndownChartFlexBox);

		return oBurndownChartLayout;

	},

	/**
	 * main function to render the control
	 * The renderer render calls all the functions which are necessary to create the control,
	 * then it call the renderer of the vertical layout 
	 * @param oRm {RenderManager}
	 * @param oControl {Control}
	 */
	renderer: function (oRm, oControl) {
		var layout = oControl.createBurndownChart();

		oRm.write("<div");
		oRm.writeControlData(layout); // writes the Control ID and enables event handling - important!
		oRm.writeClasses(); // there is no class to write, but this enables 
		// support for ColorBoxContainer.addStyleClass(...)

		oRm.write(">");
		oRm.renderControl(layout);
		oRm.addClass('verticalAlignment');

		oRm.write("</div>");

	},

	onAfterRendering: function () {
		var cItems = this.getItems();
		var data = [];
		for (var i = 0; i < cItems.length; i++) {
			var oEntry = {};
			for (var j in cItems[i].mProperties) {
				oEntry[j] = cItems[i].mProperties[j];
			}
			data.push(oEntry);
		}
		//console.log(data);

		/*
		 * Picking up a handle to the "parent" FlexBox with the ID we got in .createBurndownChart()
		 * Now simply .append SVG elements as desired
		 * D3.js code for burndown rendering
		 */

		var margin = {
				top: 15,
				right: 15,
				bottom: 30,
				left: 40
			},
			width = 600 - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom;

		// Our X scale
		var x = d3.scale.ordinal()
			.rangeRoundBands([0, width - 50], .25);

		// Our Y scale
		var y = d3.scale.linear()
			.rangeRound([height, 0]);

		// Our color bands
		var color = d3.scale.ordinal()
			.range(["#004460", "#0070A0", "#008BC6", "#009DE0", "#45B5E5", "8CCDE9", "#DAEBF2"]); //"#00A6ED",   

		// Use our X scale to set a bottom axis
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		// Smae for our left axis
		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.tickFormat(d3.format(".2s"));

		var vis = d3.select("#" + this.sParentId);

		var tip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("position", "absolute")
			.style("text-align", "center")
			.style("width", "80px")
			.style("height", "28px")
			.style("padding", "2px")
			.style("font", "11px sans-serif")
			.style("background", "#F0F0FF")
			.style("border", "0px")
			.style("border-radius", "8px")
			.style("pointer-events", "none")
			.style("opacity", 0);

		var svg = vis.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.style("background-color", "white")
			.style("font", "12px sans-serif")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		data.forEach(function (d) {
			var y0 = 0;
			d.tasks.forEach(function (dd) {
				dd.y0 = y0;
				dd.y1 = y0 += +dd.assignedno;

			});

			d.total = d.tasks[d.tasks.length - 1].y1;
		});

		//console.log(data);

		// Sort by username
		data.sort(function (a, b) {
			return a.username - b.username;
		});

		// Our X domain is our set of years
		x.domain(data.map(function (d) {
			return d.username;
		}));

		// Our Y domain is from zero to our highest total
		y.domain([0, d3.max(data, function (d) {
			return d.total;
		}) * 1.05]);

		svg.append("g")
			//.attr("class", "x axis")
			.style("fill", "none")
			.style("stroke", "grey")
			.style("shape-rendering", "crispEdges")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		svg.append("g")
			//.attr("class", "y axis")
			.style("fill", "none")
			.style("stroke", "grey")
			.style("shape-rendering", "crispEdges")
			.call(yAxis);
		/*
		    .append("text")
		    .attr("transform", "rotate(-90)")
		    .attr("y", 6)
		    .attr("dy", ".71em")
		    .style("text-anchor", "end")
		    .text("XXXXX");
		*/

		var username = svg.selectAll(".username")
			.data(data)
			.enter().append("g")
			.attr("class", "g")
			.attr("transform", function (d) {
				return "translate(" + x(d.username) + ",0)";
			});

		username.selectAll("rect")
			.data(function (d) {
				return d.tasks;
			})
			.enter().append("rect")
			.attr("width", x.rangeBand())
			.attr("y", function (d) {
				return y(d.y1);
			})
			.attr("height", function (d) {
				return y(d.y0) - y(d.y1);
			})
			.style("fill", function (d) {
				return color(d.tasktype);
			})
			.on("mouseover", function (d) {
				tip.transition()
					.duration(200)
					.style("opacity", .8);
				tip.html(d.tasktype + "<br/>" + d.assignedno)
					.style("left", (d3.event.pageX - 40) + "px")
					.style("top", (d3.event.pageY - 35) + "px");

			})
			.on("mouseout", function (d) {
				tip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		var legend = svg.selectAll(".legend")
			.data(color.domain())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function (d, i) {
				return "translate(0," + i * 16 + ")";
			});

		legend.append("rect")
			.attr("x", width - 12)
			.attr("width", 12)
			.attr("height", 12)
			.style("fill", color);

		legend.append("text")
			.attr("x", width - 24)
			.attr("y", 6)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
			.style("font", "11px sans-serif")
			.text(function (d) {
				return d;
			});

	}

});