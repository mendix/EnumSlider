define([
	"dojo/_base/declare",
	"mxui/widget/_WidgetBase",
	"mxui/dom",
	"dojo/dom",
	"dojo/dom-prop",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/text",
	"dojo/html",
	"dojo/_base/event",
	"dijit/form/VerticalRule",
	"dijit/form/VerticalRuleLabels",
	"dijit/form/VerticalSlider",
	"dijit/form/HorizontalRule",
	"dijit/form/HorizontalRuleLabels",
	"dijit/form/HorizontalSlider"
], function (declare, _WidgetBase, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, verticalRule, verticalLabels, verticalSlider, horizontalRule, horizontalLabels, horizontalSlider) {
	"use strict";

	return declare("EnumSlider.widget.EnumSlider", [_WidgetBase], {

		// Inpurt arguments
		name: '',
		sliderWidth: 300,
		sliderHeight: 50,
		direction: 'horizontal',
		onchangemf: '',
		includeEmpty: false,
		emptyCaption: '',
		enumExceptions: '',

		//IMPLEMENTATION
		isInactive: false,
		hasChanged: false,
		contextObj: null,
		slideEnum: null,
		currentNr: 0,
		slider: null,
		exceptions: null,

		getSlideEnum: function (obj) {
			this.slideEnum = [];
			if (this.enumExceptions != '')
				this.exceptions = this.enumExceptions.split(",");

			if (obj.getAttributeType(this.name) == 'Enum') {
				this.slideEnum = obj.getEnumMap(this.name);
				var spliceList = [];
				if (this.exceptions) {
					for (var j = 0; j < this.exceptions.length; j++) {
						var exception = this.exceptions[j].replace(/^ /gi, '');
						for (var i = 0; i < this.slideEnum.length; i++) {
							if (this.slideEnum[i].key == exception)
								spliceList.push(i);
						}
					}
					// Sort slideEnum in order of slideEnum indexes
					spliceList.sort(function (a, b) { return a - b });
				}
				for (var i = 0; i < spliceList.length; i++) {
					this.slideEnum.splice(spliceList[i] - i, 1);
				}

				if (this.includeEmpty == true) {
					var emptyValue = {
						'key': '',
						'caption': this.emptyCaption
					}
					this.slideEnum.unshift(emptyValue);
				}
			}
		},

		renderSlide: function (mxobject) {
			var enumArray = [];
			var longestStr = '';
			if (this.slideEnum && this.slideEnum.length > 0) {
				dojo.empty(this.domNode);
				var currentValue = mxobject.get(this.name);
				for (var i = 0; i < this.slideEnum.length; i++) {
					var strSize = this.slideEnum[i].caption.length;
					if (this.slideEnum[i].key == currentValue)
						this.currentNr = i;

					if (strSize > longestStr)
						longestStr = strSize;
					enumArray.push(this.slideEnum[i].caption);
				}
				var enumcount = this.slideEnum.length;
				if (this.direction == "horizontal") {
					var sliderRuleLabels = new horizontalLabels({
						container: 'bottomDecoration',
						labels: enumArray,
						style: 'cursor: pointer',
						onMouseUp: dojo.hitch(this, function (e) {
							var value = e.target.innerHTML;
							if (value.indexOf("<") > -1)
								value = dojo.trim(value.substring(0, value.indexOf("<") || value.length));

							if (value != "") {
								for (var i = 0; i < this.slideEnum.length; i++) {
									if (this.slideEnum[i].caption == value) {
										this.currentNr = i;
										this.slider.attr("value", i);
										return;
									}
								}
							}
						})

					}, dom.create('div'));

					var sliderRule = new horizontalRule({
						count: enumcount,
						container: 'bottomDecoration',
						style: 'width: 100%; height: 5px;'
					}, dom.create('div'));

					this.slider = new horizontalSlider({
						name: "slider_widget",
						value: this.currentNr,
						minimum: 0,
						maximum: enumcount - 1,
						intermediateChanges: true,
						discreteValues: enumcount,
						style: "width:" + this.sliderWidth + "px; height: 30px;",
						onMouseUp: dojo.hitch(this, this.execclick),
						onBlur: dojo.hitch(this, this.execclick),
						onChange: dojo.hitch(this, function (value) {
							this.hasChanged = true;
							this.contextObj.set(this.name, this.slideEnum[value].key);
						})
					});

					this.slider.addChild(sliderRule);
					this.slider.addChild(sliderRuleLabels);
					sliderRuleLabels.startup();
					sliderRule.startup();
					this.slider.startup();
					dojo.style(this.slider.progressBar, "background", "none");
					this.domNode.appendChild(this.slider.domNode);
					dojo.style(this.slider.containerNode, 'textAlign', 'left');
				} else {
					// Vertical slider is rendered bottom up, so reversing the enum so it still starts at the top.
					enumArray = enumArray.reverse();
					this.slideEnum = this.slideEnum.reverse();
					var flipped = enumArray.length - (this.currentNr + 1);

					var sliderRuleLabels = new verticalLabels({
						container: 'rightDecoration',
						style: 'cursor: pointer',
						labels: enumArray,
						onMouseUp: dojo.hitch(this, function (e) {
							var value = e.target.innerHTML;
							if (value.indexOf("<") > -1)
								value = dojo.trim(value.substring(0, value.indexOf("<") || value.length));

							if (value != "") {
								for (var i = 0; i < this.slideEnum.length; i++) {
									if (this.slideEnum[i].caption == value) {
										this.currentNr = i;
										this.slider.attr("value", i);
										return;
									}
								}
							}
						})
					}, dom.create('div'));

					var sliderRule = new verticalRule({
						count: enumcount,
						container: 'rightDecoration',
						style: 'width: 5px;'
					}, dom.create('div'));

					this.slider = new verticalSlider({
						name: "slider_widget",
						value: flipped,
						minimum: 0,
						maximum: enumcount - 1,
						intermediateChanges: true,
						discreteValues: enumcount,
						style: "height: " + this.sliderHeight + "px;",
						onMouseUp: dojo.hitch(this, this.execclick),
						onBlur: dojo.hitch(this, this.execclick),
						onChange: dojo.hitch(this, function (value) {
							this.hasChanged = true;
							this.contextObj.set(this.name, this.slideEnum[value].key);
						})
					});

					this.slider.addChild(sliderRule);
					this.slider.addChild(sliderRuleLabels);
					sliderRuleLabels.startup();
					sliderRule.startup();
					this.slider.startup();
					dojo.style(this.slider.progressBar, "background", "none");
					dojo.style(this.domNode, 'height', (this.sliderHeight + 50) + "px"); // IE fix.
					this.domNode.appendChild(this.slider.domNode);
				}
			}
			this.slider.attr('disabled', this.isInactive);
		},

		execclick: function () {
			if (this.hasChanged == true) {
				this.hasChanged = false;
				if (this.onchangemf != '' && this.contextObj) {
					mx.data.action({
						params: {
							applyto: "selection",
							actionname: this.onchangemf,
							guids: [this.contextObj.getGuid()]
						},
						store: {
							caller: this.mxform
						},
						callback: function (obj) {
						},
						error: dojoLang.hitch(this, function (error) {
							console.log(this.id + ": An error occurred while executing microflow: " + error.description);
						})
					}, this);
				}
			}
		},

		startup: function () {
			//housekeeping
			dojo.empty(this.domNode);
			dojo.style(this.domNode, {
				"height": this.sliderHeight + "px",
				"width": this.sliderWidth + "px"
			});

			this.exceptions = [];
		},

		_setDisabledAttr: function (value) {
			this.isInactive = !!value;
			if (this.slider)
				this.slider.attr('disabled', !!value);
		},

		setValueAttr: function (value) {
			if (this.slideEnum && this.slideEnum.length > 0 && this.slider.attr("value") != value)
				for (var i = 0; i < this.slideEnum.length; i++)
					if (this.slideEnum[i].key == value) {
						this.currentNr = i;
						if (this.slider)
							this.slider.attr("value", i);
					}
		},

		update: function (obj, callback) {
			this.getSlideEnum(obj);
			this.renderSlide(obj);

			this.contextObj = obj;

			this._resetSubscriptions();

			callback();
		},

		_resetSubscriptions: function () {
			if (this.attrHandle) {
				mx.data.unsubscribe(this.attrHandle);
				this.attrHandle = null;
			}

			if (this.contextObj) {

				this.attrHandle = this.subscribe({
					guid: this.contextObj.getGuid(),
					attr: this.name,
					callback: dojoLang.hitch(this, function (guid, attr, attrValue) {
						this.setValueAttr(attrValue);
					})
				});
			}
		},

		resize: function () {
			// needed for the mx6 client, notifies the widget when a resize happens, to stay responsive
		},

		uninitialize: function () {
			this.slider && this.slider.destroyRecursive();
		}
	});
});

require(["EnumSlider/widget/EnumSlider"], function () {
	"use strict";
});
