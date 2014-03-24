/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


var cAUIElement	= function(sLocalName) {
	this.localName	= sLocalName;
};
cAUIElement.prototype	= new ample.classes.Element;
cAUIElement.prototype.namespaceURI	= "http://www.amplesdk.com/ns/aui";
cAUIElement.prototype.localName		= "#element";

ample.extend(cAUIElement);


var cAUIElement_filepicker	= function(){};
cAUIElement_filepicker.prototype	= new cAUIElement("filepicker");
cAUIElement_filepicker.prototype.tabIndex	= 0;

cAUIElement_filepicker.prototype.$isAccessible	= function() {
	return !this.getAttribute("disabled");
};


cAUIElement_filepicker.prototype._onChange	= function(oEvent) {
	this.attributes["value"]	= this.$getContainer("input").value;

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("change", true, false);
	this.dispatchEvent(oEvent);
};

cAUIElement_filepicker.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer("input").focus();
	},
	"blur":		function(oEvent) {
		this.$getContainer("input").blur();
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "disabled":
						var oElementDOM	= this.$getContainer();
					oElementDOM.className	= oElementDOM.className.replace(oEvent.newValue == "true" ? "normal" : "disabled", oEvent.newValue == "true" ? "disabled" : "normal");
					this.$getContainer("input").disabled	=(oEvent.newValue == "true");
					break;
			}
		}
	}
};

cAUIElement_filepicker.prototype.$getTagOpen	= function() {
	return '<span class="aui-filepicker"><input type="file" class="aui-filepicker--input"' +(this.attributes["disabled"] ? ' disabled="true"' : '')+ ' style="padding-left:3px;" onselectstart="event.cancelBubble=true;" />';
};

cAUIElement_filepicker.prototype.$getTagClose	= function() {
	return '</span>';
};

ample.extend(cAUIElement_filepicker);


var cAUIElement_map	= function(){};
cAUIElement_map.prototype	= new cAUIElement("map");




cAUIElement_map.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "longitude":
					var oCenter	= new GLatLng(oEvent.newValue * 1, this.getAttribute("latitude") * 1);
					this.object.panTo(oCenter);
					break;

				case "latitude":
					var oCenter	= new GLatLng(this.getAttribute("longitude") * 1, oEvent.newValue * 1);
					this.object.panTo(oCenter);
					break;

				case "altitude":
					this.object.setZoom(oEvent.newValue * 1);
					break;
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (window.GMap) {
			this.object	= new GMap(this.$getContainer());
			var oCenter	= new GLatLng(this.getAttribute("longitude") * 1, this.getAttribute("latitude") * 1);
			this.object.setCenter(oCenter, this.getAttribute("altitude") * 1);
		}
		else {
			this.$getContainer().innerHTML	= "Google Maps API was not loaded";
		}
	}
};

cAUIElement_map.prototype.$getTagOpen	= function() {
	return '<div' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"' : '') + '>';
};

cAUIElement_map.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cAUIElement_map);


var cAUIElement_marker	= function(){};
cAUIElement_marker.prototype	= new cAUIElement("marker");

cAUIElement_marker.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "longitude":
					var oCenter	= new GLatLng(oEvent.newValue * 1, this.getAttribute("latitude") * 1);
					this.object.panTo(oCenter);
					break;

				case "latitude":
					var oCenter	= new GLatLng(this.getAttribute("longitude") * 1, oEvent.newValue * 1);
					this.object.panTo(oCenter);
					break;

				case "image":
					this.object.setImage(oEvent.newValue);
					break;
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (window.GMap) {
			if (this.parentNode instanceof cAUIElement_map) {
				var oPoint	= new GLatLng(this.getAttribute("longitude") * 1, this.getAttribute("latitude") * 1);
				this.object	= new GMarker(oPoint);
				this.parentNode.object.addOverlay(this.object);
				var sImage	= this.getAttribute("image");
				if (sImage)
					this.object.setImage(sImage);
			}
		}
	}
};

ample.extend(cAUIElement_marker);


var cAUIElement_pager	= function(){};
cAUIElement_pager.prototype	= new cAUIElement("marker");

cAUIElement_pager.attributes	= {
	pagestep:		"1",
	pagesamount:	"10"
};

cAUIElement_pager.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "pagestep":
					if (!window.isNaN(oEvent.newValue))
						this.goTo(oEvent.newValue);
					break;

				case "pagesamount":
					break;
			}
		}
	}
};

cAUIElement_pager.prototype.goTo	= function(nIndex) {
	if (nIndex * 1 < this.attributes["pagesamount"] * 1 && nIndex * 1 >= 0) {
				var oElement	= this.$getContainer("body");
		oElement.tBodies[0].rows[0].cells[this.attributes["pagestep"]].className	= oElement.tBodies[0].rows[0].cells[this.attributes["pagestep"]].className.replace("selected", "normal");
		oElement.tBodies[0].rows[0].cells[nIndex].className	= oElement.tBodies[0].rows[0].cells[nIndex].className.replace(/normal|hover|active/, "selected");

		this.attributes["pagestep"]	= nIndex;
	}

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("change", true, false);
	this.dispatchEvent(oEvent);
};

cAUIElement_pager.prototype._onItemClick	= function(oEvent, nIndex) {
	this.goTo(nIndex);
};

cAUIElement_pager.prototype._onButtonClick	= function(oEvent, sButtonType) {
	if (sButtonType == "next") {
		if (this.attributes["pagestep"] * 1 + 1 < this.attributes["pagesamount"] * 1)
			this.goTo(this.attributes["pagestep"] * 1 + 1);
	}
	else
	if (sButtonType == "back") {
		if (this.attributes["pagestep"] * 1 - 1 >= 0)
			this.goTo(this.attributes["pagestep"] * 1 - 1);
	}
};

cAUIElement_pager.prototype.$getTagOpen	= function() {
	var sHtml	= '<table cellpadding="0" cellspacing="0" border="0" class="aui-pager">';
	sHtml	+= '<tbody>';
	sHtml	+= '<tr>';
	sHtml	+= '<td width="1">Page:</td>';
	sHtml	+= '<td>';
	sHtml	+= '<table cellpadding="0" cellspacing="0" border="0" height="100%" class="aui-pager--body">';
	sHtml	+= '<tbody>';
	sHtml	+= '<tr>';
	for (var nIndex = 0; nIndex < this.attributes["pagesamount"] * 1; nIndex++)
		sHtml	+= '<td class="aui-pager-item" onmouseover="this.className=this.className.replace(\'normal\', \'hover\');" onmouseout="this.className=this.className.replace(\'hover\', \'normal\');" onmousedown="this.className=this.className.replace(\'hover\', \'active\');" onmouseup="this.className=this.className.replace(\'active\', \'hover\');" onclick="ample.$instance(this)._onItemClick(event, this.cellIndex)">' + nIndex + '</td>';
	sHtml	+= '</tr>';
	sHtml	+= '</tbody>';
	sHtml	+= '</table>';
	sHtml	+= '</td>';
	sHtml	+= '<td width="1" class="aui-pager-item" onclick="ample.$instance(this)._onButtonClick(event, \'back\')">&lt;&lt;</td>';
	sHtml	+= '<td width="1" class="aui-pager-item" onclick="ample.$instance(this)._onButtonClick(event, \'next\')">&gt;&gt;</td>';
	sHtml	+= '<td> </td>';
	sHtml	+= '</tr>';
	sHtml	+= '</tbody>';
	sHtml	+= '</table>';

	return sHtml;
};

ample.extend(cAUIElement_pager);


var cAUIElement_panel	= function(){};
cAUIElement_panel.prototype	= new cAUIElement("panel");

cAUIElement_panel.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "collapsed":
										break;
			}
		}
	}
};

cAUIElement_panel.prototype.toggle	= function() {
	this.setAttribute("collapsed", this.getAttribute("collapsed") == "true" ? "false" : "true");
};

cAUIElement_panel.prototype.$getTagOpen	= function() {
	return '<div class="aui-panel"' + (this.hasAttribute("style") ? ' style="' + this.getAttribute("style") + '"' : '') + '>\
				<div class="aui-panel--head">\
					<div class="aui-panel--icon"><br /></div>\
					<div class="aui-panel--label">' + ample.$encodeXMLCharacters(this.getAttribute("label")) + '</div>\
				</div>\
				<div class="aui-panel--gateway">';
};

cAUIElement_panel.prototype.$getTagClose	= function() {
	return '	</div>\
			</div>';
};

ample.extend(cAUIElement_panel);


var cAUIElement_panelset	= function(){};
cAUIElement_panelset.prototype	= new cAUIElement("panelset");

cAUIElement_panelset.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "cols":
				case "rows":
					this.refresh();
					break;
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		this.refresh();
				var that	= this;
		this.ownerDocument.addEventListener("resize", function() {
			that.refresh();
		}, false);
	}
};

cAUIElement_panelset.prototype.refresh	= function() {
	var aSize	= [],
		nFlex	= 0,
		nSize	= 0,
		nPanelsetSize	= 0,
		bVertical	= false,
		oElement;
	if (this.hasAttribute("rows")) {
		aSize	= this.getAttribute("rows").replace(/^\s+|\s+$/g, '').split(/\s+/);
		nPanelsetSize	= this.$getContainer().offsetHeight;
		bVertical	= true;
	}
	else
	if (this.hasAttribute("cols")) {
		aSize	= this.getAttribute("cols").replace(/^\s+|\s+$/g, '').split(/\s+/);
		nPanelsetSize	= this.$getContainer().offsetWidth;
		bVertical	= false;
	}

		for (var nIndex = 0; nIndex < this.childNodes.length; nIndex++) {
		if (aSize[nIndex].match(/(\d*)\*/))
			nFlex	+=(RegExp.$1 || 1)* 1;
		else {
			oElement	= this.childNodes[nIndex].$getContainer();
			oElement.style[bVertical ? "height" : "width"]	= aSize[nIndex];
			nSize	+= oElement[bVertical ? "offsetHeight" : "offsetWidth"];
		}
	}
		for (var nIndex = 0, nOffset = 0; nIndex < this.childNodes.length; nIndex++) {
		if (aSize[nIndex].match(/(\d*)\*/))
			this.childNodes[nIndex].$getContainer().style[bVertical ? "height" : "width"]	= Math.floor((nPanelsetSize - nSize)*(RegExp.$1 || 1)/ nFlex - 2)+ "px";
	}
};

cAUIElement_panelset.prototype.$getTagOpen	= function() {
	return '<div class="aui-panelset' + (this.hasAttribute("rows") ? ' aui-panelset-rows-' : this.hasAttribute("cols") ? ' aui-panelset-cols-' : '')+ '"' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"' : '') + '>';
};

cAUIElement_panelset.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cAUIElement_panelset);


var cAUIElement_sidebar	= function(){};
cAUIElement_sidebar.prototype	= new cAUIElement("sidebar");

cAUIElement_sidebar.prototype.toggle	= function(bState) {
	var oContainer	= this.$getContainer(),
		oStyle		= oContainer.style;
		var oPositionOld	= this.getBoundingClientRect();
	oStyle.width	= "";
	oStyle.height	= "";
		this.$setPseudoClass("hover", bState || false);
		var oPositionNew	= this.getBoundingClientRect();
	oStyle.width	=(oPositionOld.right - oPositionOld.left) + "px";
	oStyle.height	=(oPositionOld.bottom - oPositionOld.top) + "px";
		ample.query(this).animate({"width": (oPositionNew.right - oPositionNew.left) + "px", "height": (oPositionNew.bottom - oPositionNew.top) + "px"}, 500);
};

cAUIElement_sidebar.handlers	= {
	"mouseenter":	function(oEvent) {
		this.toggle(true);
	},
	"mouseleave":	function(oEvent) {
		this.toggle(false);
	}
};

cAUIElement_sidebar.prototype.$getTagOpen	= function() {
	var sHtml	= '<div' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"' : '') + ' class="aui-sidebar';
	sHtml	+=(this.attributes["class"] ? " " + "aui-sidebar-" + this.attributes["class"] : '') + '">';

	return sHtml;
};

cAUIElement_sidebar.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cAUIElement_sidebar);


var cAUIElement_sound	= function(){};
cAUIElement_sound.prototype	= new cAUIElement("sound");

cAUIElement_sound.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "src":
					this.$getContainer().FileName	= oEvent.newValue;
					break;

				case "autostart":
					this.$getContainer().AutoStart	= oEvent.newValue == "true";
					break;
			}
		}
	}
};

cAUIElement_sound.prototype.play	= function() {
	this.$getContainer().CurrentPosition	= 0;
	if (this.$getContainer().OpenState == 6)
		this.$getContainer().Play();
};

cAUIElement_sound.prototype.stop	= function() {
	if (this.$getContainer().OpenState == 6)
		this.$getContainer().Stop();
};

cAUIElement_sound.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.getAttribute("src")) {
			var oSelf	= this;
			window.setTimeout(function() {
				oSelf.setAttribute("src", oSelf.getAttribute("src"));
			}, 0);
		}
	}
};

cAUIElement_sound.prototype.$getTagOpen	= function() {
	return '<object classid="' + "clsid:22D6F312-B0F6-11D0-94AB-0080C74C7E95" + '" style="' + "display:none" + '"><param name="' + "AutoStart" + '" value="false"/></object>';
};

ample.extend(cAUIElement_sound);


var cAUIElement_xhtml	= function(){};
cAUIElement_xhtml.prototype	= new cAUIElement("xhtml");

cAUIElement_xhtml.prototype.innerHTML	= null;

cAUIElement_xhtml.prototype.$getTag	= function() {
	return this.innerHTML;
};

ample.extend(cAUIElement_xhtml);

})()
