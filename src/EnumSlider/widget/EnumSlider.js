dojo.provide("EnumSlider.widget.EnumSlider");
dojo.require("dijit.form.Slider");

mendix.widget.declare('EnumSlider.widget.EnumSlider', {
	addons       : [mendix.addon._Contextable],
    inputargs: { 
		name : '',
		sliderWidth  : 300,
		sliderHeight  : 50,
		direction : 'horizontal',
		onchangemf : '',
		includeEmpty : false,
		emptyCaption : '',
		enumExceptions : ''
    },
	
	//IMPLEMENTATION
	isInactive : false,
	hasChanged : false,
	context : null,
	slideEnum : null,
	currentNr : 0,
	slider : null,
	exceptions: null,
	
	getSlideEnum : function(context) {
		this.context = context;
		var trackClass = context.getTrackClass ? context.getTrackClass() : context.trackClass; //MWE: getTrackClass() does not exist anymore in 3.0
		if (trackClass == '')
			return;
		
		var meta = mx.metadata.getMetaEntity({ className: trackClass });
		this.slideEnum = [];
		if (this.enumExceptions != '')
			this.exceptions = this.enumExceptions.split(",");
		
		if(meta && meta.getAttributeClass(this.name) == 'Enum') {
			this.slideEnum = meta.getEnumMap(this.name);
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
				spliceList.sort(function(a,b){return a-b});
			}
			for (var i = 0; i < spliceList.length; i++) {
				this.slideEnum.splice(spliceList[i]-i, 1);
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
	
	renderSlide : function (mxobject) {
		var enumArray = [];
		var longestStr = '';
		if (this.slideEnum && this.slideEnum.length > 0) {
			dojo.empty(this.domNode);
			var currentValue = mxobject.getAttribute(this.name);
			for (var i = 0; i < this.slideEnum.length; i++) {
				var strSize = mendix.dom.getStringSize(this.slideEnum[i].caption);
				if (this.slideEnum[i].key == currentValue)
					this.currentNr = i;
				
				if (strSize > longestStr)
					longestStr = strSize;
				enumArray.push(this.slideEnum[i].caption);
			}
			var enumcount = this.slideEnum.length;
			if (this.direction == "horizontal") {
				var sliderRuleLabels = new dijit.form.HorizontalRuleLabels({
					container: 'bottomDecoration',
					labels: enumArray,
					style: 'cursor: pointer',
					onMouseUp : dojo.hitch(this, function (e) {
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

				}, mendix.dom.div());
				
				var sliderRule = new dijit.form.HorizontalRule({
					count: enumcount,
					container: 'bottomDecoration',
					style: 'width: 100%; height: 5px;'
				}, mendix.dom.div());
				
				this.slider = new dijit.form.HorizontalSlider({
					name: "slider_widget",
					value: this.currentNr,
					minimum: 0,
					maximum: enumcount-1,
					intermediateChanges: true,
					discreteValues: enumcount,
					style: "width:"+this.sliderWidth+"px; height: 30px;",
					onMouseUp: dojo.hitch(this, this.execclick),
					onBlur: dojo.hitch(this, this.execclick),
					onChange: dojo.hitch(this, function(value) {
						this.hasChanged = true;
						this.onChange();
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
				var flipped = enumArray.length - (this.currentNr+1);
				
				var sliderRuleLabels = new dijit.form.VerticalRuleLabels({
					container: 'rightDecoration',
					style : 'cursor: pointer',
					labels: enumArray,
					onMouseUp : dojo.hitch(this, function (e) {
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
				}, mendix.dom.div());
				
				var sliderRule = new dijit.form.VerticalRule({
					count: enumcount,
					container: 'rightDecoration',
					style: 'width: 5px;'
				}, mendix.dom.div());
				
				this.slider = new dijit.form.VerticalSlider({
					name: "slider_widget",
					value: flipped,
					minimum: 0,
					maximum: enumcount-1,
					intermediateChanges: true,
					discreteValues: enumcount,
					style: "height: "+this.sliderHeight+"px;",
					onMouseUp: dojo.hitch(this, this.execclick),
					onBlur: dojo.hitch(this, this.execclick),
					onChange: dojo.hitch(this, function(value) {
						this.hasChanged = true;
						this.onChange();
					})
				});
				
				this.slider.addChild(sliderRule);
				this.slider.addChild(sliderRuleLabels);
				sliderRuleLabels.startup();
				sliderRule.startup();
				this.slider.startup();
				dojo.style(this.slider.progressBar, "background", "none");
				dojo.style(this.domNode, 'height', (this.sliderHeight+50)+"px"); // IE fix.
				this.domNode.appendChild(this.slider.domNode);
			}
		}
		this.slider.attr('disabled', this.isInactive);
	},
	
	execclick : function() {
		if (this.hasChanged == true){ 
			this.hasChanged = false;
			if (this.onchangemf != '' && this.context && this.context.getTrackId()) {
				var context = mx.ui.newContext();
				context.setContext(this.context.getTrackEntity(), this.context.getTrackId());
				mx.xas.action({
					actionname	: this.onchangemf,
					context		: context,
					callback	: function() {
						// ok	
					},
					error		: function() {
						// error
					}
				});
				mx.ui.destroyContext(context);
			}
		}
	},
	
	postCreate : function(){
		//housekeeping
		dojo.empty(this.domNode);
		dojo.style(this.domNode, {
			"height" : this.sliderHeight+"px",
			"width" : this.sliderWidth+"px"
		});
		
		this.exceptions = [];
		
		this.initContext();
		this.actRendered();
	},
	
	_setDisabledAttr : function(value) {
		this.isInactive = !!value;
		if (this.slider)
			this.slider.attr('disabled', !!value);
	},
	
	_getValueAttr : function () {
		if (this.slideEnum && this.slider)
			return this.slideEnum[this.slider.attr('value')].key;
		else
			return '';
	},
	
	onChange : function () {
	},
	
	_setValueAttr : function(value) {
		if (this.slideEnum && this.slideEnum.length > 0 && this.slider.attr("value") != value)
			for (var i = 0; i < this.slideEnum.length; i++)
				if (this.slideEnum[i].key == value) {
					this.currentNr = i;
					if (this.slider)
						this.slider.attr("value", i);
				}
	},
	
	applyContext : function(context, callback){
		this.getSlideEnum(context);
		if (context && context.getActiveGUID()) 
			mx.processor.getObject(context.getActiveGUID(), dojo.hitch(this, this.renderSlide));
		else
			logger.warn(this.id + ".applyContext received empty context");
		callback && callback();
	},
	
	uninitialize : function(){
		this.slider && this.slider.destroyRecursive();
	}
});
