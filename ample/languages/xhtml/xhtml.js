/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


var cXHTMLElement	= function(sLocalName) {
	this.localName	= sLocalName;
};

cXHTMLElement.prototype	= new ample.classes.Element;
cXHTMLElement.prototype.namespaceURI= "http://www.w3.org/1999/xhtml";
cXHTMLElement.prototype.localName	= "#element";
cXHTMLElement.prototype.accessKey	= null;

cXHTMLElement.prototype.$isAccessible	= function() {
	return !this.attributes["disabled"];
};

cXHTMLElement.prototype.$mapAttribute	= function(sName, sValue) {
	switch (sName) {
		case "tabIndex":
			this.tabIndex	= isNaN(sValue) ? -1 : sValue * 1;
			break;

		case "accessKey":
			this.accessKey	= sValue || null;
			break;

		default:
			var oContainer	= this.$getContainer();
			if (oContainer)
				oContainer[sName]	= sValue;
	}
};

cXHTMLElement.html524	= {
	"article":	"div",
	"aside":	"div",
	"section":	"div",
	"footer":	"div",
	"header":	"div",
	"nav":		"div",
		"datalist":	"div",
	"output":	"span"
};

cXHTMLElement.prototype.$getTagOpen	= function() {
	var sHtml	= '<' + (this.localName in cXHTMLElement.html524 ? cXHTMLElement.html524[this.localName] : this.localName);
	for (var sName in this.attributes)
		if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
			sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
	sHtml	+= ' class="' + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
	return sHtml + '>';
};

cXHTMLElement.prototype.$getTagClose	= function() {
	return '</' + (this.localName in cXHTMLElement.html524 ? cXHTMLElement.html524[this.localName] : this.localName) + '>';
};

ample.extend(cXHTMLElement);


var cXHTMLInputElement	= function() {
	cXHTMLElement.apply(this, arguments);
};

cXHTMLInputElement.prototype	= new cXHTMLElement("#element-input");
cXHTMLInputElement.prototype.$hoverable	= true;

cXHTMLInputElement.prototype.tabIndex	= 0;

cXHTMLInputElement.prototype.form	= null;

cXHTMLInputElement.prototype.validity		= null;
cXHTMLInputElement.prototype.willValidate	= true;
cXHTMLInputElement.prototype.checkValidity	= function() {

};
cXHTMLInputElement.prototype.validationMessage	= "";
cXHTMLInputElement.prototype.setCustomValidty	= function(sMessage) {

};

cXHTMLInputElement.isValid	= function(oInstance) {
	return true;
};

cXHTMLInputElement.register	= function(oInstance) {
		for (var oNode = oInstance; oNode = oNode.parentNode;)
		if (oNode instanceof cXHTMLElement_form)
			break;
	if (oNode) {
		oInstance.form	= oNode;
		oNode.elements.$add(oInstance);
		if (oInstance.hasAttribute("name"))
			oNode.elements[oInstance.getAttribute("name")]	= this;
	}
		if (!isNaN(oInstance.getAttribute("tabIndex")))
		oInstance.tabIndex	= oInstance.getAttribute("tabIndex") * 1;
	if (oInstance.hasAttribute("accessKey"))
		oInstance.accessKey	= oInstance.getAttribute("accessKey");
	if (oInstance.attributes["autofocus"])
		oInstance.focus();
};

cXHTMLInputElement.unregister	= function(oInstance) {
		if (oInstance.form) {
		oInstance.form.elements.$remove(oInstance);
		if (oInstance.hasAttribute("name"))
			delete oInstance.form.elements[oInstance.getAttribute("name")];
		oInstance.form	= null;
	}
};

ample.extend(cXHTMLInputElement);


var cXHTMLValidityState	= function() {

};

cXHTMLValidityState.prototype.valueMissing	= false;
cXHTMLValidityState.prototype.typeMismatch	= false;
cXHTMLValidityState.prototype.patternMismatch	= false;
cXHTMLValidityState.prototype.tooLong		= false;
cXHTMLValidityState.prototype.rangeUnderflow	= false;
cXHTMLValidityState.prototype.rangeOverflow	= false;
cXHTMLValidityState.prototype.stepMismatch	= false;
cXHTMLValidityState.prototype.customError	= false;
cXHTMLValidityState.prototype.valid			= true;


var oXHTMLAccessKeyManager	= (function () {
		ample.bind("keydown",	function(oEvent) {
		if (oEvent.altKey && oEvent.keyIdentifier != "Alt") {
			var aKey	= oEvent.keyIdentifier.match(/U\+([\dA-F]{4})/),
				sKey	= aKey ? String.fromCharCode(parseInt(aKey[1], 16)) : oEvent.keyIdentifier;
						for (var nIndex = 0, aElements = this.getElementsByTagNameNS(cXHTMLElement.prototype.namespaceURI, "*"), oElement, oElementDOM; oElement = aElements[nIndex]; nIndex++) {
				if (oElement.tabIndex >= 0 && oElement.$isAccessible() && oElement.accessKey && oElement.accessKey.toUpperCase() == sKey) {
					if ((oElementDOM = oElement.$getContainer()) && oElementDOM.offsetHeight > 0) {
												oElement.focus();
												oEvent.preventDefault();
					}
					break;
				}
			}
		}
	});

		return {

	}
})();


var cXHTMLElement_colorpicker	= function() {
		this.x	= 0;
	this.y	= 0;
	this.b	= 1;
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this._buttonAccept	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "button"));
	this._buttonAccept.setAttribute("class", "accept");
	this._buttonAccept.appendChild(ample.createTextNode("Accept"));
	this._buttonAccept.addEventListener("DOMActivate", function() {
		that.acceptDialog();
	});
	this._buttonCancel	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "button"));
	this._buttonCancel.setAttribute("class", "cancel");
	this._buttonCancel.appendChild(ample.createTextNode("Cancel"));
	this._buttonCancel.addEventListener("DOMActivate", function() {
		that.cancelDialog();
	});
};
cXHTMLElement_colorpicker.prototype	= new cXHTMLElement("colorpicker");

cXHTMLElement_colorpicker.attributes	= {};
cXHTMLElement_colorpicker.attributes.value	= "#FF0000";


cXHTMLElement_colorpicker.prototype._moveTo	= function(sName, oPosition) {
	if (oPosition.x)
		this.$getContainer(sName).style.left	= oPosition.x + "px";
	if (oPosition.y)
		this.$getContainer(sName).style.top	= oPosition.y + "px";
};

cXHTMLElement_colorpicker.prototype._setColor	= function(sColor) {
	var oColor;
	if (oColor = cXHTMLElement_colorpicker._RGBtoXYB(sColor)) {
		this.b	= oColor.b;
		this.x	= oColor.x;
		this.y	= oColor.y;

		this._moveTo('palette-pointer', {'x' : this.x - 9, 'y' : this.y - 9});

		this.$getContainer('color').style.backgroundColor	= sColor;

		this._setColorBrightness(cXHTMLElement_colorpicker._XYBtoRGB({'x': this.x, 'y': this.y, 'b': 0}));
		this._setPaletteBrightness(this.b);

		this._moveTo('brightness-pointer',	{'y' : this.b * 255	- 2});
	}
};

cXHTMLElement_colorpicker.prototype._setColorBrightness	= function(sColor) {
	this.$getContainer('brightness').style.backgroundColor	= sColor;
	this.$getContainer('brightness-shader').style.filter	= "progid:DXImageTransform.Microsoft.Gradient(startColorStr='" + sColor + "', endColorStr='#000000', gradientType='0');";
};

cXHTMLElement_colorpicker.prototype._setPaletteBrightness	= function(nBrightness) {
		var oElementDOM	= this.$getContainer('palette-shader');
	oElementDOM.style.filter		= 'progid:DXImageTransform.Microsoft.alpha(opacity=' + nBrightness * 100 + ')'; 	oElementDOM.style.opacity		= nBrightness; 	oElementDOM.style.MozOpacity	= nBrightness; };

cXHTMLElement_colorpicker.prototype._getComputedStyleByEvent	= function(oEvent, sName) {
	var oPosition	= this.getBoundingClientRect(sName);
	var nPositionX	= oEvent.clientX - oPosition.left;
	var nPositionY	= oEvent.clientY - oPosition.top;

		nPositionX	= nPositionX < 0	? 0 :(nPositionX > 255	? 255	: nPositionX);
	nPositionY	= nPositionY < 0	? 0 :(nPositionY > 255	? 255	: nPositionY);

	return {'x' : nPositionX, 'y': nPositionY};
};

cXHTMLElement_colorpicker.prototype._setColorValue	= function(sColor) {
	this.$getContainer('color').style.backgroundColor	= sColor;
	this.$getContainer('value').value	= sColor;
};

cXHTMLElement_colorpicker.prototype._detachHandlers	= function() {
	document.onmousemove	= null;
	document.onmouseup	= null;
};

cXHTMLElement_colorpicker.prototype._onInputChange	= function(oEvent, sValue) {
	this._setColor(sValue);
};

cXHTMLElement_colorpicker.prototype._onPointersBrightnessMouseMove	= function(oEvent) {
	var oPosition	= this._getComputedStyleByEvent(oEvent, 'brightness');
	this._moveTo('brightness-pointer', {'y' : oPosition.y - 3});

	this.b	= Math.round(100 * oPosition.y / 255) / 100;
	this._setPaletteBrightness(this.b);
	this._setColorValue(cXHTMLElement_colorpicker._XYBtoRGB({'x': this.x, 'y': this.y, 'b': this.b}));
};

cXHTMLElement_colorpicker.prototype._onPointersBrightnessMouseDown	= function(oEvent) {
	var oElement	= this;
	document.onmousemove	= function(e) {
		return oElement._onPointersBrightnessMouseMove(e || event)
	};
	document.onmouseup	= function() {
		oElement._detachHandlers();
	};
	this._onPointersBrightnessMouseMove(oEvent);
};

cXHTMLElement_colorpicker.prototype._onPointerPaletteMouseMove	= function(oEvent) {
	var oPosition	= this._getComputedStyleByEvent(oEvent, "palette");
	this.x	= oPosition.x;
	this.y	= oPosition.y;

	this._moveTo('palette-pointer', {'x' : this.x - 9, 'y' : this.y - 9});
	this._setColorBrightness(cXHTMLElement_colorpicker._XYBtoRGB({'x': this.x, 'y': this.y, 'b': 0}));
	this._setColorValue(cXHTMLElement_colorpicker._XYBtoRGB({'x': this.x, 'y': this.y, 'b': this.b}));
};

cXHTMLElement_colorpicker.prototype._onPointerPaletteMouseDown	= function(oEvent) {
	var oElement	= this;
	document.onmousemove	= function(e) {
		return oElement._onPointerPaletteMouseMove(e || event)
	};
	document.onmouseup	= function() {
		oElement._detachHandlers();
	};
	this._onPointerPaletteMouseMove(oEvent);
};

cXHTMLElement_colorpicker.prototype.acceptDialog	= function() {
	this.attributes.value	= this.$getContainer('value').value;

		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("accept", false, false, null);
	this.dispatchEvent(oEvent);
};

cXHTMLElement_colorpicker.prototype.cancelDialog	= function() {
	this.setAttribute("value", this.attributes.value);

		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("cancel", false, false, null);
	this.dispatchEvent(oEvent);
};

cXHTMLElement_colorpicker.handlers	= {
	"DOMNodeInsertedIntoDocument":	function() {
		this._setColor(cXHTMLElement_colorpicker.attributes.value);
	}
};

cXHTMLElement_colorpicker.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value") {
		this._setColor(sValue || '');
		this.$getContainer('value').value	= sValue || '';
	}
	else
		cXHTMLElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXHTMLElement_colorpicker.prototype.$getTagOpen	= function() {
	return '<div class="colorpicker' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + '" style="' +
				(this.hasAttribute("style") ? this.getAttribute("style") : '') + '">\
				<table cellpadding="0" cellspacing="0" border="0">\
				<tbody>\
					<tr>\
						<td valign="top">\
							<div class="colorpicker--palette" style="position:relative;" onmousedown="ample.$instance(this)._onPointerPaletteMouseDown(event)">\
								<div class="colorpicker--palette-shader"><br /></div>\
								<div class="colorpicker--palette-pointer" style="position:absolute;"><br /></div>\
							</div>\
						</td>\
						<td align="center" valign="top" style="position:relative;display:block;">\
							<div style="width:39px" onmousedown="ample.$instance(this)._onPointersBrightnessMouseDown(event);">\
								<div class="colorpicker--brightness">\
									<div class="colorpicker--brightness-shader"><br /></div>\
								</div>\
								<div class="colorpicker--brightness-pointer" style="position:absolute;left:1px;"><br /></div>\
							</div>\
						</td>\
						<td valign="top">\
							<table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">\
								<tbody>\
									<tr><td align="right"><div class="colorpicker--color"></div></td></tr>\
									<tr><td><br /></td></tr>\
									<tr><td><input autocomplete="no" type="text" value="#FF0000" maxlength="7" class="colorpicker--value" onchange="ample.$instance(this)._onInputChange(event, this.value)" onkeyup="ample.$instance(this)._onInputChange(event, this.value)" onselectstart="event.cancelBubble=true;" oncontextmenu="event.cancelBubble=true"/></td></tr>\
									<tr><td><br /></td></tr>\
									<tr><td>' + this._buttonAccept.$getTag() + '</td></tr>\
									<tr><td height="3"></td></tr>\
									<tr><td>' + this._buttonCancel.$getTag() + '</td></tr>\
								</tbody>\
							</table>\
						</td>\
					</tr>\
				</tbody>\
			</table>\
		</div>';
};

cXHTMLElement_colorpicker.prototype.$getTagClose	= function() {
	return '';
};

cXHTMLElement_colorpicker._XYBtoRGB	= function(oXYB) {
	var nH	= 360 / 256 * oXYB.x;
	var nS	= 1 - oXYB.y / 256;
	var nV	= 1 - oXYB.b;

	var nR, nG, nB;

	if (nS == 0)
		nR	= nG = nB = nV;
	else
	{
		var nI	= Math.floor(nH / 60);
		var nF	= nH / 60 - nI;
		var nP	= nV *(1 - nS);
		var nQ	= nV *(1 - nS * nF);
		var nT	= nV *(1 - nS * (1 - nF));

		switch (nI) {
			case 0:		nR	= nV;	nG	= nT;	nB	= nP;	break;
			case 1:		nR	= nQ;	nG	= nV;	nB	= nP;	break;
			case 2:		nR	= nP;	nG	= nV;	nB	= nT;	break;
			case 3:		nR	= nP;	nG	= nQ;	nB	= nV;	break;
			case 4:		nR	= nT;	nG	= nP;	nB	= nV;	break;
			default:	nR	= nV;	nG	= nP;	nB	= nQ;
		}
	}
	return '#' + this._toHex(nR * 256) + this._toHex(nG * 256) + this._toHex(nB * 256);
};

cXHTMLElement_colorpicker._RGBtoXYB	= function(sColor) {
	if (!sColor.match(/^#[0-9a-f]{6}$/i))
		return;

	var nR	= parseInt(sColor.substr(1, 2), 16);
	var nG	= parseInt(sColor.substr(3, 2), 16);
	var nB	= parseInt(sColor.substr(5, 2), 16);

	var nV	= Math.max(nR, nG, nB);
	var nX	= Math.min(nR, nG, nB);
	var nS	= (nV-nX) / nV;
	var nH	= 0;

	var nRed	=(nV - nR) / (nV - nX);
	var nGreen	=(nV - nG) / (nV - nX);
	var nBlue	=(nV - nB) / (nV - nX);

	if (nR == nV)
		nH	=(nG == nX) ? 5 + nBlue	: 1 - nGreen;
	else
	if (nG == nV)
		nH	=(nB == nX) ? 1 + nRed	: 3 - nBlue;
	else
		nH	=(nR == nX) ? 3 + nGreen	: 5 - nRed;

	nH	/=	6;

	return {'x' : (nH * 255), 'y' : (255 - nS * 255), 'b' : 1 - nV / 255};
};

cXHTMLElement_colorpicker._toHex	= function(nValue) {
	var sHexCharacters	= "0123456789ABCDEF";

	if (nValue < 0)
		return "00";
	if (nValue > 255)
		return "FF";
	else
		return sHexCharacters.charAt(Math.floor(nValue / 16)) + sHexCharacters.charAt(nValue % 16);
};

ample.extend(cXHTMLElement_colorpicker);


var cXHTMLElement_datepicker	= function() {
	var oDate	= new Date();
	this.current	= new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this._buttonAccept	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "button"));
	this._buttonAccept.setAttribute("class", "accept");
	this._buttonAccept.appendChild(ample.createTextNode("Accept"));
	this._buttonAccept.addEventListener("DOMActivate", function() {
		that.acceptDialog();
	});
	this._buttonCancel	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "button"));
	this._buttonCancel.setAttribute("class", "cancel");
	this._buttonCancel.appendChild(ample.createTextNode("Cancel"));
	this._buttonCancel.addEventListener("DOMActivate", function() {
		that.cancelDialog();
	});
		this._elementMonth	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "select"));
	this._elementMonth.tabIndex	=-1;
	this._elementMonth.addEventListener("change", function(oEvent) {
		that.doSelectMonth(this.items[this.selectedIndex].getAttribute("value"));
				oEvent.stopPropagation();
	}, false);
		for (var nIndex = 0, oElement; nIndex < 12; nIndex++) {
		oElement	= this._elementMonth.appendChild(ample.createElementNS(this.namespaceURI, "option"));
		oElement.setAttribute("value", nIndex);
		oElement.setAttribute("label", ample.locale.culture.calendar.months.names[nIndex]);
	}
		this._elementYear	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "input"));
	this._elementYear.setAttribute("type", "number");
	this._elementYear.tabIndex	=-1;
	this._elementYear.setAttribute("max", Infinity);
	this._elementYear.addEventListener("change", function(oEvent) {
		that.doSelectYear(this.getAttribute("value"));
				oEvent.stopPropagation();
	}, false);
	this._elementMonthPrevious	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "input"));
	this._elementMonthPrevious.setAttribute("type", "button");
	this._elementMonthPrevious.tabIndex	=-1;
	this._elementMonthNext	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "input"));
	this._elementMonthNext.setAttribute("type", "button");
	this._elementMonthNext.tabIndex	=-1;
		this._elementAccept	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "input"));
	this._elementAccept.setAttribute("type", "button");
	this._elementAccept.setAttribute("value", "OK");
	this._elementAccept.tabIndex	=-1;
	this._elementCancel	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "input"));
	this._elementCancel.setAttribute("type", "button");
	this._elementCancel.setAttribute("value", "Cancel");
	this._elementCancel.tabIndex	=-1;
};

cXHTMLElement_datepicker.prototype	= new cXHTMLElement("datepicker");

cXHTMLElement_datepicker.prototype.current	= null;	cXHTMLElement_datepicker.prototype.value	= null;
cXHTMLElement_datepicker.prototype.min	= null;
cXHTMLElement_datepicker.prototype.max	= null;

cXHTMLElement_datepicker.prototype.show	= function(nLeft, nTop) {
	var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("shown", false, true, null);
	if (this.dispatchEvent(oEvent)) {
		var oStyle	= this.$getContainer().style;
		oStyle.position	= "absolute";
		if (arguments.length > 0)
			oStyle.left	= nLeft + "px";
		if (arguments.length > 1)
			oStyle.top	= nTop + "px";
		oStyle.display	= "";
				this.refresh();
	}
};

cXHTMLElement_datepicker.prototype.hide	= function() {
	var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("hidden", false, true, null);
	if (this.dispatchEvent(oEvent))
		this.$getContainer().style.display	= "none";
};

cXHTMLElement_datepicker.prototype.refresh	= function() {
		this.$getContainer("days-pane").innerHTML	= cXHTMLElement_datepicker.$getTagDays(this, this.current);
	var oItem	= this._elementMonth.querySelector("[value='" + this.current.getMonth() + "']");
	return;
	this._elementMonth.selectItem(oItem);
	this._elementMonth.setAttribute("value", this.current.getMonth());
	this._elementYear.setAttribute("value", this.current.getFullYear());
};

cXHTMLElement_datepicker.prototype._onSelectDay	= function(nDay) {
		this.current.setDate(nDay);
	var nMonth	= this.current.getMonth();
	var nYear	= this.current.getFullYear();

		var sValue	= nYear + '/' + (nMonth + 1 < 10 ? '0' : '') + (nMonth + 1) + '/' + (nDay < 10 ? '0' : '') + nDay;
	if (this.getAttribute("value") != sValue) {
		this.setAttribute("value", sValue);

				var oEvent	= this.ownerDocument.createEvent("UIEvent");
		oEvent.initEvent("change", false, false, window, null);
		this.dispatchEvent(oEvent);
	}

		var oEventAccept	= this.ownerDocument.createEvent("UIEvent");
	oEventAccept.initUIEvent("accept", true, false, window, null);
	this.dispatchEvent(oEventAccept);
};

cXHTMLElement_datepicker.prototype.doSelectMonth	= function(nMonth) {
		this.current.setMonth(nMonth);

	this.$getContainer("days-pane").innerHTML	= cXHTMLElement_datepicker.$getTagDays(this, this.current);
};

cXHTMLElement_datepicker.prototype.doSelectYear	= function(nYear) {
		this.current.setYear(nYear);

	this.$getContainer("days-pane").innerHTML		= cXHTMLElement_datepicker.$getTagDays(this, this.current);
};

cXHTMLElement_datepicker.parseDateFromString	= function(sDate) {
	return new Date(sDate);
};

cXHTMLElement_datepicker.prototype.acceptDialog	= function() {
	this.attributes.value	= this.$getContainer('value').value;

		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("accept", false, false, null);
	this.dispatchEvent(oEvent);
};

cXHTMLElement_datepicker.prototype.cancelDialog	= function() {
	this.setAttribute("value", this.attributes.value);

		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("cancel", false, false, null);
	this.dispatchEvent(oEvent);
};

cXHTMLElement_datepicker.handlers	= {
	"click":		function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.$pseudoTarget == this.$getContainer("month-previous")) {
				var nYear	= this.current.getFullYear();
				this.doSelectMonth(this.current.getMonth() - 1);
				this._elementMonth.setAttribute("value", this.current.getMonth());
				if (this.current.getFullYear() != nYear)
					this._elementYear.setAttribute("value", this.current.getFullYear());
			}
			else
			if (oEvent.$pseudoTarget == this.$getContainer("month-next")) {
				var nYear	= this.current.getFullYear();
				this.doSelectMonth(this.current.getMonth() + 1);
				this._elementMonth.setAttribute("value", this.current.getMonth());
				if (this.current.getFullYear() != nYear)
					this._elementYear.setAttribute("value", this.current.getFullYear());
			}

		}
	},
	"keydown":		function(oEvent) {
			},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this)
			switch (oEvent.attrName) {
				case "min":
					if (oEvent.newValue)
						this.min	= cXHTMLElement_datepicker.parseDateFromString(oEvent.newValue);
					else
						this.min	= null;
					break;

				case "max":
					if (oEvent.newValue)
						this.max	= cXHTMLElement_datepicker.parseDateFromString(oEvent.newValue);
					else
						this.max	= null;
					break;

				case "value":
					if (oEvent.newValue) {
						this.value	= cXHTMLElement_datepicker.parseDateFromString(oEvent.newValue);
						this.current= cXHTMLElement_datepicker.parseDateFromString(oEvent.newValue);
					}
					else {
						this.value	= null;
					}
					this.refresh();
					break;
			}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				var sValue	= this.getAttribute("value");
		if (sValue) {
			this.value	= cXHTMLElement_datepicker.parseDateFromString(sValue);
			this.current= cXHTMLElement_datepicker.parseDateFromString(sValue);
		}
		this._elementMonth.setAttribute("value", this.current.getMonth());
		this._elementYear.setAttribute("value", this.current.getFullYear());
				this.refresh();
	}
};

cXHTMLElement_datepicker.getWeekNum	= function(oDate) {
	var y	= oDate.getFullYear();
	var m	= oDate.getMonth() + 1;
	var d	= 0;
		if (m < 3) {
		var a	= y - 1;
		var b	= (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0);
		var c	= ( (a - 1) / 4 | 0) - ( (a - 1) / 100 | 0) + ( (a - 1) / 400 | 0);
		var s	= b - c;
		var e	= 0;
		var f	= d - 1 + 31 * (m - 1);
	}
		else {
		var a	= y;
		var b	= (a / 4 | 0) - ( a / 100 | 0) + (a / 400 | 0);
		var c	= ( (a - 1) / 4 | 0) - ( (a - 1) / 100 | 0) + ( (a - 1) / 400 | 0);
		var s	= b - c;
		var e	= s + 1;
		var f	= d + ( (153 * (m - 3) + 2) / 5 | 0) + 58 + s;
	}
	var g	= (a + b) % 7;
		var d	= (f + g - e) % 7;
	var n	= f + 3 - d;
	if (n < 0)
		var w	= 53 - ( (g - s) / 5 | 0);
	else if (n > 364 + s)
		var w	= 1;
	else
		var w	= (n / 7 | 0) + 1;
	return w;
};



cXHTMLElement_datepicker.$getTagDays	= function(oInstance, oDate) {
	var aHtml	= [];

		aHtml.push('<table cellPadding="0" cellSpacing="1" border="0">\
					<thead class="datepicker--header">\
						<tr>\
							<td>&nbsp;</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[1] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[2] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[3] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[4] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[5] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[6] + '</td>\
							<td class="datepicker-head-day">' + ample.locale.culture.calendar.days.namesShort[0] + '</td>\
						</tr>\
					</thead>\
					<tbody>\
						<tr>');

	var oDateToday	= new Date;

	var nWeek	= cXHTMLElement_datepicker.getWeekNum(oDate, true);
		var nWeekDay	= new Date(oDate.getFullYear(), oDate.getMonth(), 1).getDay() - 1;
	if (nWeekDay < 0)
		nWeekDay	= 6;

	aHtml.push('<td align="center" valign="center"><div class="datepicker-week">' + nWeek + '</div></td>');
		for (var nIndex = 0; nIndex < nWeekDay; nIndex++)
		aHtml.push('<td><br /></td>');

	nWeek	= (nWeek >= 52) ? 0 : nWeek; 
	var nDays	= new Date(oDate.getFullYear(), oDate.getMonth() * 1 + 1, 0).getDate();

	for (var nIndex = 1, oDateCurrent, bDateDisabled; nIndex <= nDays; nIndex++) {
		oDateCurrent	= new Date(oDate.getFullYear(), oDate.getMonth(), nIndex);
		bDateDisabled	= (oInstance.min && oDateCurrent < oInstance.min) || (oInstance.max && oDateCurrent > oInstance.max);
		aHtml.push('	<td align="center" valign="center">\
							<div type="button"\
								class="datepicker-day' +(nWeekDay > 4 ? " datepicker-weekend" : '') + (oInstance.value && oDateCurrent.getTime() == oInstance.value.getTime() ? ' datepicker-day_selected' : '') + '\
								' + (oDateToday.getDate() == oDateCurrent.getDate() && oDateToday.getMonth() == oDateCurrent.getMonth() && oDateToday.getFullYear() == oDateCurrent.getFullYear() ? ' datepicker-day_today' : '') + '\
								' + (bDateDisabled ? ' datepicker-day_disabled' : '" onclick="ample.$instance(this)._onSelectDay(' + nIndex + ')') + '"\
								onmouseover="this.className += \' datepicker-day_hover\'" onmouseout="this.className = this.className.replace(\' datepicker-day_hover\', \'\')"\
								>' + nIndex + '</div>\
						</td>');
		if ((nWeekDay == 6) && (nIndex < nDays)) {
			nWeek++;
			if (nWeek == 53)
				nWeek	= (new Date(oDate.getFullYear(), 11, 31).getDay() < 3) ? 1 : nWeek;
			aHtml.push('</tr>\
						<tr>\
							<td align="center" valign="center"><div class="datepicker-week">' + nWeek + '</div></td>');
			nWeekDay	= 0;
		}
		else
			nWeekDay++;
	}

		for (var nIndex = nWeekDay; nIndex < 7; nIndex++)
		aHtml.push(			'<td><br /></td>');

	aHtml.push('		</tr>\
					</tbody>\
				</table>');

	return aHtml.join('');
};

cXHTMLElement_datepicker.prototype.$getTagOpen	= function() {
	return '<div class="datepicker' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + '" style="' +
				(this.hasAttribute("style") ? this.getAttribute("style") : '') + '">\
				<table cellpadding="0" cellspacing="0" border="0">\
					<thead>\
						<tr>\
							<td valign="top">' + this._elementMonthPrevious.$getTag() + '</td>\
							<td>' + this._elementMonth.$getTag() + '</td>\
							<td valign="top">' + this._elementMonthNext.$getTag() + '</td>\
							<td>' + this._elementYear.$getTag() + '</td>\
						</tr>\
					</thead>\
					<tbody>\
						<tr>\
							<td colspan="4" class="datepicker--days-pane"></td>\
						</tr>\
					</tbody>\
					<tfoot>\
						<tr>\
							<td colspan="4" align="center">' +
								this._buttonAccept.$getTag() +
								this._buttonCancel.$getTag() + '\
							</td>\
						</tr>\
					</tfoot>\
				</table>\
			</div>';
};

cXHTMLElement_datepicker.prototype.$getTagClose	= function() {
	return '';
};

ample.extend(cXHTMLElement_datepicker);


var cXHTMLElement_del	= function(){};
cXHTMLElement_del.prototype	= new cXHTMLElement("del");

ample.extend(cXHTMLElement_del);


var cXHTMLElement_ins	= function(){};
cXHTMLElement_ins.prototype	= new cXHTMLElement("ins");

ample.extend(cXHTMLElement_ins);


var cXHTMLElement_area	= function(){};
cXHTMLElement_area.prototype	= new cXHTMLElement("area");

ample.extend(cXHTMLElement_area);


var cXHTMLElement_audio	= function(){};
cXHTMLElement_audio.prototype	= new cXHTMLElement("audio");

ample.extend(cXHTMLElement_audio);



var cXHTMLElement_canvas	= function(){};
cXHTMLElement_canvas.prototype	= new cXHTMLElement("canvas");

cXHTMLElement_canvas.handlers	= {
	"DOMNodeInsertedIntoDocument":	function() {
		this.width	= this.attributes["width"];
		this.height	= this.attributes["height"];
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this)
			if (oEvent.attrName == "width" || oEvent.attrName == "height") {
				this[oEvent.attrName]	= oEvent.attrValue;
			}
	}
};

cXHTMLElement_canvas.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "width" || sName == "height") {
		this.$getContainer()[sName]	= sValue;
	}
	else
		cXHTMLElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXHTMLElement_canvas.prototype.getContext	= function(sMode) {
	return this.$getContainer().getContext(sMode);
};




if (!document.createElement('canvas').getContext) {
    var fDOMNodeInsertedIntoDocument	= cXHTMLElement_canvas.handlers["DOMNodeInsertedIntoDocument"];
  cXHTMLElement_canvas.handlers["DOMNodeInsertedIntoDocument"]	= function(oEvent) {
	    if (fDOMNodeInsertedIntoDocument)
    	fDOMNodeInsertedIntoDocument.call(this, oEvent);
    	G_vmlCanvasManager_.initElement(this.$getContainer());
  };

    var m = Math;
  var mr = m.round;
  var ms = m.sin;
  var mc = m.cos;
  var abs = m.abs;
  var sqrt = m.sqrt;

    var Z = 10;
  var Z2 = Z / 2;

  
  function getContext() {
    return this.context_ ||
        (this.context_ = new CanvasRenderingContext2D_(this));
  }

  var slice = Array.prototype.slice;

  
  function bind(f, obj, var_args) {
    var a = slice.call(arguments, 2);
    return function() {
      return f.apply(obj, a.concat(slice.call(arguments)));
    };
  }

  var G_vmlCanvasManager_ = {
    init: function(opt_doc) {
      if (/MSIE/.test(navigator.userAgent) && !window.opera) {
        var doc = opt_doc || document;
                        doc.createElement('canvas');
        doc.attachEvent('onreadystatechange', bind(this.init_, this, doc));
      }
    },

    init_: function(doc) {
            if (!doc.namespaces['g_vml_']) {
        doc.namespaces.add('g_vml_', 'urn:schemas-microsoft-com:vml',
                           '#default#VML');

      }
      if (!doc.namespaces['g_o_']) {
        doc.namespaces.add('g_o_', 'urn:schemas-microsoft-com:office:office',
                           '#default#VML');
      }

            if (!doc.styleSheets['ex_canvas_']) {
        var ss = doc.createStyleSheet();
        ss.owningElement.id = 'ex_canvas_';
        ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
                        'text-align:left;width:300px;height:150px}' +
            'g_vml_\\:*{behavior:url(#default#VML)}' +
            'g_o_\\:*{behavior:url(#default#VML)}';

      }

    },

    
    initElement: function(el) {
      if (!el.getContext) {

        el.getContext = getContext;

                                el.innerHTML = '';

                el.attachEvent('onpropertychange', onPropertyChange);
        el.attachEvent('onresize', onResize);

        var attrs = el.attributes;
        if (attrs.width && attrs.width.specified) {
                              el.style.width = attrs.width.nodeValue + 'px';
        } else {
          el.width = el.clientWidth;
        }
        if (attrs.height && attrs.height.specified) {
                              el.style.height = attrs.height.nodeValue + 'px';
        } else {
          el.height = el.clientHeight;
        }
              }
      return el;
    }
  };

  function onPropertyChange(e) {
    var el = e.srcElement;

    switch (e.propertyName) {
      case 'width':
        el.style.width = el.attributes.width.nodeValue + 'px';
        el.getContext().clearRect();
        break;
      case 'height':
        el.style.height = el.attributes.height.nodeValue + 'px';
        el.getContext().clearRect();
        break;
    }
  }

  function onResize(e) {
    var el = e.srcElement;
    if (el.firstChild) {
      el.firstChild.style.width =  el.clientWidth + 'px';
      el.firstChild.style.height = el.clientHeight + 'px';
    }
  }

  G_vmlCanvasManager_.init();

    var dec2hex = [];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < 16; j++) {
      dec2hex[i * 16 + j] = i.toString(16) + j.toString(16);
    }
  }

  function createMatrixIdentity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  function matrixMultiply(m1, m2) {
    var result = createMatrixIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++) {
          sum += m1[x][z] * m2[z][y];
        }

        result[x][y] = sum;
      }
    }
    return result;
  }

  function copyState(o1, o2) {
    o2.fillStyle     = o1.fillStyle;
    o2.lineCap       = o1.lineCap;
    o2.lineJoin      = o1.lineJoin;
    o2.lineWidth     = o1.lineWidth;
    o2.miterLimit    = o1.miterLimit;
    o2.shadowBlur    = o1.shadowBlur;
    o2.shadowColor   = o1.shadowColor;
    o2.shadowOffsetX = o1.shadowOffsetX;
    o2.shadowOffsetY = o1.shadowOffsetY;
    o2.strokeStyle   = o1.strokeStyle;
    o2.globalAlpha   = o1.globalAlpha;
    o2.arcScaleX_    = o1.arcScaleX_;
    o2.arcScaleY_    = o1.arcScaleY_;
    o2.lineScale_    = o1.lineScale_;
  }

  function processStyle(styleString) {
    var str, alpha = 1;

    styleString = String(styleString);
    if (styleString.substring(0, 3) == 'rgb') {
      var start = styleString.indexOf('(', 3);
      var end = styleString.indexOf(')', start + 1);
      var guts = styleString.substring(start + 1, end).split(',');

      str = '#';
      for (var i = 0; i < 3; i++) {
        str += dec2hex[Number(guts[i])];
      }

      if (guts.length == 4 && styleString.substr(3, 1) == 'a') {
        alpha = guts[3];
      }
    } else {
      str = styleString;
    }

    return {color: str, alpha: alpha};
  }

  function processLineCap(lineCap) {
    switch (lineCap) {
      case 'butt':
        return 'flat';
      case 'round':
        return 'round';
      case 'square':
      default:
        return 'square';
    }
  }

  
  function CanvasRenderingContext2D_(surfaceElement) {
    this.m_ = createMatrixIdentity();

    this.mStack_ = [];
    this.aStack_ = [];
    this.currentPath_ = [];

        this.strokeStyle = '#000';
    this.fillStyle = '#000';

    this.lineWidth = 1;
    this.lineJoin = 'miter';
    this.lineCap = 'butt';
    this.miterLimit = Z * 1;
    this.globalAlpha = 1;
    this.canvas = surfaceElement;

    var el = surfaceElement.ownerDocument.createElement('div');
    el.style.width =  surfaceElement.clientWidth + 'px';
    el.style.height = surfaceElement.clientHeight + 'px';
    el.style.overflow = 'hidden';
    el.style.position = 'absolute';
    surfaceElement.appendChild(el);

    this.element_ = el;
    this.arcScaleX_ = 1;
    this.arcScaleY_ = 1;
    this.lineScale_ = 1;
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    this.element_.innerHTML = '';
  };

  contextPrototype.beginPath = function() {
            this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    var p = this.getCoords_(aX, aY);
    this.currentPath_.push({type: 'moveTo', x: p.x, y: p.y});
    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.lineTo = function(aX, aY) {
    var p = this.getCoords_(aX, aY);
    this.currentPath_.push({type: 'lineTo', x: p.x, y: p.y});

    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = this.getCoords_(aX, aY);
    var cp1 = this.getCoords_(aCP1x, aCP1y);
    var cp2 = this.getCoords_(aCP2x, aCP2y);
    bezierCurveTo(this, cp1, cp2, p);
  };

    function bezierCurveTo(self, cp1, cp2, p) {
    self.currentPath_.push({
      type: 'bezierCurveTo',
      cp1x: cp1.x,
      cp1y: cp1.y,
      cp2x: cp2.x,
      cp2y: cp2.y,
      x: p.x,
      y: p.y
    });
    self.currentX_ = p.x;
    self.currentY_ = p.y;
  }

  contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
        
    var cp = this.getCoords_(aCPx, aCPy);
    var p = this.getCoords_(aX, aY);

    var cp1 = {
      x: this.currentX_ + 2.0 / 3.0 * (cp.x - this.currentX_),
      y: this.currentY_ + 2.0 / 3.0 * (cp.y - this.currentY_)
    };
    var cp2 = {
      x: cp1.x + (p.x - this.currentX_) / 3.0,
      y: cp1.y + (p.y - this.currentY_) / 3.0
    };

    bezierCurveTo(this, cp1, cp2, p);
  };

  contextPrototype.arc = function(aX, aY, aRadius,
                                  aStartAngle, aEndAngle, aClockwise) {
    aRadius *= Z;
    var arcType = aClockwise ? 'at' : 'wa';

    var xStart = aX + mc(aStartAngle) * aRadius - Z2;
    var yStart = aY + ms(aStartAngle) * aRadius - Z2;

    var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
    var yEnd = aY + ms(aEndAngle) * aRadius - Z2;

        if (xStart == xEnd && !aClockwise) {
      xStart += 0.125;                            }

    var p = this.getCoords_(aX, aY);
    var pStart = this.getCoords_(xStart, yStart);
    var pEnd = this.getCoords_(xEnd, yEnd);

    this.currentPath_.push({type: arcType,
                           x: p.x,
                           y: p.y,
                           radius: aRadius,
                           xStart: pStart.x,
                           yStart: pStart.y,
                           xEnd: pEnd.x,
                           yEnd: pEnd.y});

  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
  };

  contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.stroke();

    this.currentPath_ = oldPath;
  };

  contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.fill();

    this.currentPath_ = oldPath;
  };

  contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
    var gradient = new CanvasGradient_('gradient');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    return gradient;
  };

  contextPrototype.createRadialGradient = function(aX0, aY0, aR0,
                                                   aX1, aY1, aR1) {
    var gradient = new CanvasGradient_('gradientradial');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.r0_ = aR0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    gradient.r1_ = aR1;
    return gradient;
  };

  contextPrototype.drawImage = function(image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

        var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

        var w = image.width;
    var h = image.height;

        image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    if (arguments.length == 3) {
      dx = arguments[1];
      dy = arguments[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (arguments.length == 5) {
      dx = arguments[1];
      dy = arguments[2];
      dw = arguments[3];
      dh = arguments[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (arguments.length == 9) {
      sx = arguments[1];
      sy = arguments[2];
      sw = arguments[3];
      sh = arguments[4];
      dx = arguments[5];
      dy = arguments[6];
      dw = arguments[7];
      dh = arguments[8];
    } else {
      throw Error('Invalid number of arguments');
    }

    var d = this.getCoords_(dx, dy);

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

        vmlStr.push(' <g_vml_:group',
                ' coordsize="', Z * W, ',', Z * H, '"',
                ' coordorigin="0,0"' ,
                ' style="width:', W, 'px;height:', H, 'px;position:absolute;');

                
    if (this.m_[0][0] != 1 || this.m_[0][1]) {
      var filter = [];

            filter.push('M11=', this.m_[0][0], ',',
                  'M12=', this.m_[1][0], ',',
                  'M21=', this.m_[0][1], ',',
                  'M22=', this.m_[1][1], ',',
                  'Dx=', mr(d.x / Z), ',',
                  'Dy=', mr(d.y / Z), '');

                  var max = d;
      var c2 = this.getCoords_(dx + dw, dy);
      var c3 = this.getCoords_(dx, dy + dh);
      var c4 = this.getCoords_(dx + dw, dy + dh);

      max.x = m.max(max.x, c2.x, c3.x, c4.x);
      max.y = m.max(max.y, c2.y, c3.y, c4.y);

      vmlStr.push('padding:0 ', mr(max.x / Z), 'px ', mr(max.y / Z),
                  'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(',
                  filter.join(''), ", sizingmethod='clip');")
    } else {
      vmlStr.push('top:', mr(d.y / Z), 'px;left:', mr(d.x / Z), 'px;');
    }

    vmlStr.push(' ">' ,
                '<g_vml_:image src="', image.src, '"',
                ' style="width:', Z * dw, 'px;',
                ' height:', Z * dh, 'px;"',
                ' cropleft="', sx / w, '"',
                ' croptop="', sy / h, '"',
                ' cropright="', (w - sx - sw) / w, '"',
                ' cropbottom="', (h - sy - sh) / h, '"',
                ' />',
                '</g_vml_:group>');

    this.element_.insertAdjacentHTML('BeforeEnd',
                                    vmlStr.join(''));
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;
    var a = processStyle(aFill ? this.fillStyle : this.strokeStyle);
    var color = a.color;
    var opacity = a.alpha * this.globalAlpha;

    var W = 10;
    var H = 10;

    lineStr.push('<g_vml_:shape',
                 ' filled="', !!aFill, '"',
                 ' style="position:absolute;width:', W, 'px;height:', H, 'px;"',
                 ' coordorigin="0 0" coordsize="', Z * W, ' ', Z * H, '"',
                 ' stroked="', !aFill, '"',
                 ' path="');

    var newSeq = false;
    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];
      var c;

      switch (p.type) {
        case 'moveTo':
          c = p;
          lineStr.push(' m ', mr(p.x), ',', mr(p.y));
          break;
        case 'lineTo':
          lineStr.push(' l ', mr(p.x), ',', mr(p.y));
          break;
        case 'close':
          lineStr.push(' x ');
          p = null;
          break;
        case 'bezierCurveTo':
          lineStr.push(' c ',
                       mr(p.cp1x), ',', mr(p.cp1y), ',',
                       mr(p.cp2x), ',', mr(p.cp2y), ',',
                       mr(p.x), ',', mr(p.y));
          break;
        case 'at':
        case 'wa':
          lineStr.push(' ', p.type, ' ',
                       mr(p.x - this.arcScaleX_ * p.radius), ',',
                       mr(p.y - this.arcScaleY_ * p.radius), ' ',
                       mr(p.x + this.arcScaleX_ * p.radius), ',',
                       mr(p.y + this.arcScaleY_ * p.radius), ' ',
                       mr(p.xStart), ',', mr(p.yStart), ' ',
                       mr(p.xEnd), ',', mr(p.yEnd));
          break;
      }


            
                  if (p) {
        if (min.x == null || p.x < min.x) {
          min.x = p.x;
        }
        if (max.x == null || p.x > max.x) {
          max.x = p.x;
        }
        if (min.y == null || p.y < min.y) {
          min.y = p.y;
        }
        if (max.y == null || p.y > max.y) {
          max.y = p.y;
        }
      }
    }
    lineStr.push(' ">');

    if (!aFill) {
      var lineWidth = this.lineScale_ * this.lineWidth;

                  if (lineWidth < 1) {
        opacity *= lineWidth;
      }

      lineStr.push(
        '<g_vml_:stroke',
        ' opacity="', opacity, '"',
        ' joinstyle="', this.lineJoin, '"',
        ' miterlimit="', this.miterLimit, '"',
        ' endcap="', processLineCap(this.lineCap), '"',
        ' weight="', lineWidth, 'px"',
        ' color="', color, '" />'
      );
    } else if (typeof this.fillStyle == 'object') {
      var fillStyle = this.fillStyle;
      var angle = 0;
      var focus = {x: 0, y: 0};

            var shift = 0;
            var expansion = 1;

      if (fillStyle.type_ == 'gradient') {
        var x0 = fillStyle.x0_ / this.arcScaleX_;
        var y0 = fillStyle.y0_ / this.arcScaleY_;
        var x1 = fillStyle.x1_ / this.arcScaleX_;
        var y1 = fillStyle.y1_ / this.arcScaleY_;
        var p0 = this.getCoords_(x0, y0);
        var p1 = this.getCoords_(x1, y1);
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        angle = Math.atan2(dx, dy) * 180 / Math.PI;

                if (angle < 0) {
          angle += 360;
        }

                        if (angle < 1e-6) {
          angle = 0;
        }
      } else {
        var p0 = this.getCoords_(fillStyle.x0_, fillStyle.y0_);
        var width  = max.x - min.x;
        var height = max.y - min.y;
        focus = {
          x: (p0.x - min.x) / width,
          y: (p0.y - min.y) / height
        };

        width  /= this.arcScaleX_ * Z;
        height /= this.arcScaleY_ * Z;
        var dimension = m.max(width, height);
        shift = 2 * fillStyle.r0_ / dimension;
        expansion = 2 * fillStyle.r1_ / dimension - shift;
      }

                  var stops = fillStyle.colors_;
      stops.sort(function(cs1, cs2) {
        return cs1.offset - cs2.offset;
      });

      var length = stops.length;
      var color1 = stops[0].color;
      var color2 = stops[length - 1].color;
      var opacity1 = stops[0].alpha * this.globalAlpha;
      var opacity2 = stops[length - 1].alpha * this.globalAlpha;

      var colors = [];
      for (var i = 0; i < length; i++) {
        var stop = stops[i];
        colors.push(stop.offset * expansion + shift + ' ' + stop.color);
      }

                  lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"',
                   ' method="none" focus="100%"',
                   ' color="', color1, '"',
                   ' color2="', color2, '"',
                   ' colors="', colors.join(','), '"',
                   ' opacity="', opacity2, '"',
                   ' g_o_:opacity2="', opacity1, '"',
                   ' angle="', angle, '"',
                   ' focusposition="', focus.x, ',', focus.y, '" />');
    } else {
      lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity,
                   '" />');
    }

    lineStr.push('</g_vml_:shape>');

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
  };

  contextPrototype.fill = function() {
    this.stroke(true);
  }

  contextPrototype.closePath = function() {
    this.currentPath_.push({type: 'close'});
  };

  
  contextPrototype.getCoords_ = function(aX, aY) {
    var m = this.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
    }
  };

  contextPrototype.save = function() {
    var o = {};
    copyState(this, o);
    this.aStack_.push(o);
    this.mStack_.push(this.m_);
    this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
  };

  contextPrototype.restore = function() {
    copyState(this.aStack_.pop(), this);
    this.m_ = this.mStack_.pop();
  };

  function matrixIsFinite(m) {
    for (var j = 0; j < 3; j++) {
      for (var k = 0; k < 2; k++) {
        if (!isFinite(m[j][k]) || isNaN(m[j][k])) {
          return false;
        }
      }
    }
    return true;
  }

  function setM(ctx, m, updateLineScale) {
    if (!matrixIsFinite(m)) {
      return;
    }
    ctx.m_ = m;

    if (updateLineScale) {
                              var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      ctx.lineScale_ = sqrt(abs(det));
    }
  }

  contextPrototype.translate = function(aX, aY) {
    var m1 = [
      [1,  0,  0],
      [0,  1,  0],
      [aX, aY, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.rotate = function(aRot) {
    var c = mc(aRot);
    var s = ms(aRot);

    var m1 = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.scale = function(aX, aY) {
    this.arcScaleX_ *= aX;
    this.arcScaleY_ *= aY;
    var m1 = [
      [aX, 0,  0],
      [0,  aY, 0],
      [0,  0,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
    var m1 = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
    var m = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, m, true);
  };

  
  contextPrototype.clip = function() {
      };

  contextPrototype.arcTo = function() {
      };

  contextPrototype.createPattern = function() {
    return new CanvasPattern_;
  };

    function CanvasGradient_(aType) {
    this.type_ = aType;
    this.x0_ = 0;
    this.y0_ = 0;
    this.r0_ = 0;
    this.x1_ = 0;
    this.y1_ = 0;
    this.r1_ = 0;
    this.colors_ = [];
  }

  CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
    aColor = processStyle(aColor);
    this.colors_.push({offset: aOffset,
                       color: aColor.color,
                       alpha: aColor.alpha});
  };

  function CanvasPattern_() {}

    G_vmlCanvasManager = G_vmlCanvasManager_;
  CanvasRenderingContext2D = CanvasRenderingContext2D_;
  CanvasGradient = CanvasGradient_;
  CanvasPattern = CanvasPattern_;
}

ample.extend(cXHTMLElement_canvas);



var cXHTMLElement_embed	= function(){};
cXHTMLElement_embed.prototype	= new cXHTMLElement("embed");

ample.extend(cXHTMLElement_embed);



var cXHTMLElement_figure	= function(){};
cXHTMLElement_figure.prototype	= new cXHTMLElement("figure");

ample.extend(cXHTMLElement_figure);



var cXHTMLElement_iframe	= function(){};
cXHTMLElement_iframe.prototype	= new cXHTMLElement("iframe");

ample.extend(cXHTMLElement_iframe);



var cXHTMLElement_img	= function(){};
cXHTMLElement_img.prototype	= new cXHTMLElement("img");

cXHTMLElement_img.prototype.$getTagOpen	= function() {
	var sHtml	= '<' + this.localName + ' onmousedown="return '+ "false" + '" ondragstart="return '+ "false" + '"';
	for (var sName in this.attributes)
		if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
			sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
	sHtml	+= ' class="' + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
	return sHtml + '/>';
};

cXHTMLElement_img.prototype.$getTagClose	= function() {
	return '';
};

ample.extend(cXHTMLElement_img);


var cXHTMLElement_map	= function(){};
cXHTMLElement_map.prototype	= new cXHTMLElement("map");

ample.extend(cXHTMLElement_map);


var cXHTMLElement_object	= function(){};
cXHTMLElement_object.prototype	= new cXHTMLElement("object");

cXHTMLElement_object.prototype.$getTag	= function() {
	if (window.navigator.userAgent.indexOf("Gecko") >-1) {
		var sHtml	= '<embed';
		for (var sName in this.attributes)
			if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
				sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
		sHtml	+= ' class="' + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
		for (var nIndex = 0; nIndex < this.childNodes.length; nIndex++)
			sHtml	+= ' ' + this.childNodes[nIndex].attributes["name"] + '="' + this.childNodes[nIndex].attributes["value"] + '"';
		return sHtml + ' />';
	}
	else
		return this.$getTag.call(this);
};

ample.extend(cXHTMLElement_object);


var cXHTMLElement_param	= function(){};
cXHTMLElement_param.prototype	= new cXHTMLElement("param");

ample.extend(cXHTMLElement_param);


var cXHTMLElement_source	= function(){};
cXHTMLElement_source.prototype	= new cXHTMLElement("source");

ample.extend(cXHTMLElement_source);



var cXHTMLElement_video	= function(){};
cXHTMLElement_video.prototype	= new cXHTMLElement("video");

ample.extend(cXHTMLElement_video);



var cXHTMLElement_button	= function(){
		this.validity	= new cXHTMLValidityState;
};
cXHTMLElement_button.prototype	= new cXHTMLInputElement("button");

cXHTMLElement_button.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer().focus();
	},
	"blur":		function(oEvent) {
		this.$getContainer().blur();
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				cXHTMLInputElement.register(this);
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
				cXHTMLInputElement.unregister(this);
	},
	"mousedown":	function() {
		this.$setPseudoClass("active", true);
		this.setCapture(true);
	},
	"mouseup":	function() {
		this.$setPseudoClass("active", false);
		this.releaseCapture();
	},
	"click":	function(oEvent) {
		if (oEvent.button == 0)
			this.$activate();
	}
};

cXHTMLElement_button.prototype.$getTagOpen	= function() {
	var sClassName	=(this.prefix ? this.prefix + '-' : '') + this.localName,
		bDisabled	= this.attributes["disabled"] && this.attributes["disabled"] != "false";
	return '<span class="' + sClassName + ' ' +
				("class" in this.attributes ? ' ' + this.attributes["class"] : '') +
				' ' + sClassName + '_' + (bDisabled ? 'disabled' : 'enabled') + ' '+
				'" ' +(this.attributes.style ? ' style="' + this.attributes.style + '"' : '')+ '>\
				<span class="' + sClassName + '--before" style="float:left"></span>\
				<span class="' + sClassName + '--after" style="float:right"></span>\
				<div class="' + sClassName + '--field" style="position:relative">\
					<div class="' + sClassName + '--label">';
};

cXHTMLElement_button.prototype.$getTagClose	= function() {
	return '		</div>\
				</div>\
			</span>';
};

ample.extend(cXHTMLElement_button);


var cXHTMLElement_datalist	= function(){};
cXHTMLElement_datalist.prototype	= new cXHTMLElement("datalist");

ample.extend(cXHTMLElement_datalist);




var cXHTMLElement_fieldset	= function() {
	this.elements	= new ample.classes.NodeList;
};
cXHTMLElement_fieldset.prototype	= new cXHTMLElement("fieldset");

cXHTMLElement_fieldset.prototype.elements	= null;

ample.extend(cXHTMLElement_fieldset);


var cXHTMLElement_form	= function() {
	this.elements	= new ample.classes.NodeList;
};
cXHTMLElement_form.prototype	= new cXHTMLElement("form");

cXHTMLElement_form.prototype.elements	= null;
cXHTMLElement_form.prototype.length		= 0;

cXHTMLElement_form.prototype.submit	= function() {
		var sTarget	= this.getAttribute("target"),
		oTarget;
	if (sTarget.match(/#(.+)$/) && (oTarget = this.ownerDocument.getElementById(window.RegExp.$1))) {
		var aValue	= [],
			sAction	= this.getAttribute("action"),
			vValue,
			sName,
			oElement;
		for (var nIndex = 0; nIndex < this.elements.length; nIndex++) {
			oElement	= this.elements[nIndex];
			if (!oElement.hasAttribute("disabled") && oElement.hasAttribute("name") && (vValue = oElement.$getValue()) != null)	{
				sName	= oElement.getAttribute("name");
				if (vValue instanceof window.Array)
					for (var nValue = 0; nValue < vValue.length; nValue++)
						aValue.push(sName + '=' + vValue[nValue]);
				else
					aValue.push(sName + '=' + vValue);
			}
		}
		function fComplete(oRequest) {
						ample(oTarget).html(oRequest.responseText);
		};
		vValue	= window.encodeURI(aValue.join('&'));
		if (this.getAttribute("method").toLowerCase() == "post")
			ample.ajax({"type": "POST", "url": sAction, "headers": {'Content-Type': 'application/x-www-form-urlencoded'}, "data": vValue, "complete": fComplete});
		else
			ample.ajax({"type": "GET", "url": sAction.replace(/\?.+/, '') + '?' + vValue, "complete": fComplete});
	}
	else
		this.$getContainer().submit();
};

cXHTMLElement_form.prototype.reset	= function() {
	this.$getContainer().reset();
};

cXHTMLElement_form.prototype.checkValidity	= function() {

};

cXHTMLElement_form.prototype.dispatchFormInput	= function() {

};

cXHTMLElement_form.prototype.dispatchFormChange	= function() {

};


cXHTMLElement_form.prototype._onSubmit	= function() {
		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("submit", true, true);
	return this.dispatchEvent(oEvent);
};

cXHTMLElement_form.prototype._onReset	= function() {
		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("reset", true, true);
	return this.dispatchEvent(oEvent);
};

cXHTMLElement_form.prototype.$getTagOpen	= function() {
	var sHtml	= '<' + this.localName + ' onsubmit="var oElement = ample.$instance(this); if (oElement._onSubmit()) oElement.submit(); return false;" onreset="var oElement = ample.$instance(this); if (oElement._onReset()) oElement.reset(); return false;"';
	for (var sName in this.attributes)
		if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
			sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
	sHtml	+= ' class="' + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
	return sHtml + '>';
};

ample.extend(cXHTMLElement_form);


var cXHTMLElement_input	= function(){
	this.validity	= new cXHTMLValidityState;
		this.contentFragment	= ample.createDocumentFragment();
	var that	= this;
	this._spinButtons	= ample.createElement("spinbuttons");
	this._spinButtons.addEventListener("spin", function(oEvent) {
		oEvent.detail ? that.stepUp() : that.stepDown();
				cXHTMLElement_input.dispatchInputEvent(that);
	});
	this.contentFragment.appendChild(this._spinButtons);
};
cXHTMLElement_input.prototype	= new cXHTMLInputElement("input");

cXHTMLElement_input.prototype.value	= "";
cXHTMLElement_input.prototype.checked	= false;

cXHTMLElement_input.prototype.selectionStart	= null;
cXHTMLElement_input.prototype.selectionEnd		= null;

cXHTMLElement_input.prototype.list	= null;
cXHTMLElement_input.prototype.selectedOption	= null;

cXHTMLElement_input.prototype.valueAsNumber	= NaN;
cXHTMLElement_input.prototype.valueAsDate	= null;

cXHTMLElement_input.prototype.$captured	= false;

cXHTMLElement_input.prototype.$isAccessible	= function() {
	return cXHTMLElement.prototype.$isAccessible.call(this) && this.attributes["type"] != "hidden";
};

cXHTMLElement_input.prototype.select	= function() {
	this.$getContainer().select();
};

cXHTMLElement_input.prototype.setSelectionRange	= function() {

};

cXHTMLElement_input.prototype.stepUp	= function() {
	var nValue	= parseFloat(this.attributes["value"]),
		nStep	= parseFloat(this.attributes["step"]) || 1,
		nMin	= parseFloat(this.attributes["min"]),
		nMax	= parseFloat(this.attributes["max"]);

	if (isNaN(nMin))
		nMin	= 0;
	if (isNaN(nMax))
		nMax	= 100;
	if (nMax < nMin)
		nMax	= nMin;

	if (isNaN(nValue))
		nValue	= nMax;
	else
	if (nValue + nStep > nMax)
		nValue	= nMax;
	else
		nValue	+= nStep;

	this.value	= '' + nValue;
	this.valueAsNumber	= nValue;
	this.setAttribute("value", nValue);
};

cXHTMLElement_input.prototype.stepDown	= function() {
	var nValue	= parseFloat(this.attributes["value"]),
		nStep	= parseFloat(this.attributes["step"]) || 1,
		nMin	= parseFloat(this.attributes["min"]),
		nMax	= parseFloat(this.attributes["max"]);

	if (isNaN(nMin))
		nMin	= 0;
	if (isNaN(nMax))
		nMax	= 100;
	if (nMax < nMin)
		nMax	= nMin;

	if (isNaN(nValue))
		nValue	= nMin;
	else
	if (nValue - nStep < nMin)
		nValue	= nMin;
	else
		nValue	-= nStep;

	this.value	= '' + nValue;
	this.valueAsNumber	= nValue;
	this.setAttribute("value", nValue);
};

cXHTMLElement_input.handlers	= {
	"focus":	function(oEvent) {
		var that	= this;
		setTimeout(function(){try {that.$getContainer("value").focus();that.$getContainer("field").scrollLeft=0;}catch(e){}},0);
		this.$getContainer("placeholder").style.display	= "none";
	},
	"blur":		function(oEvent) {
		this.$getContainer("placeholder").style.display	= this.attributes.value ? "none" : "";
				switch (this.attributes["type"]) {
			case "date":
			case "color":
			case "datetime":
			case "datetime-local":
			case "month":
			case "week":
				cXHTMLElement_input.toggle(this, false);
				break;
		}
	},
	"click":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.$pseudoTarget == this.$getContainer("button")) {
				switch (this.attributes["type"]) {
					case "file":
					case "date":
					case "color":
					case "datetime":
					case "datetime-local":
					case "month":
					case "week":
						this.$activate();
						break;
				}
			}
			else {
				switch (this.attributes["type"]) {
					case "radio":
					case "checkbox":
						this.$activate();
						break;
				}
			}
		}
	},
	"mousedown":	function(oEvent) {
		if (oEvent.target == this) {
			switch (this.attributes["type"]) {
				case "range":
					if (oEvent.$pseudoTarget != this.$getContainer("button"))
						break;
				case "reset":
				case "submit":
				case "button":
					this.$captured	= true;
					this.setCapture(true);
					this.$setPseudoClass("active", true);
					break;
			}
		}
	},
	"mouseup":	function(oEvent) {
		if (oEvent.target == this) {
			switch (this.attributes["type"]) {
				case "reset":
				case "submit":
				case "button":
				case "range":
					if (this.$captured) {
						this.$captured	= false;
						this.releaseCapture();
						this.$setPseudoClass("active", false);
												if (this.attributes["type"] == "range")
							this.setAttribute("value", this.valueAsNumber);
					}
					break;
			}
		}
	},
	"mousemove":	function(oEvent) {
		if (oEvent.target == this) {
			switch (this.attributes["type"]) {
				case "range":
					if (this.$captured) {
						var oRect	= this.getBoundingClientRect("field"),
							nLeft	= Math.max(oRect.left, Math.min(oEvent.clientX, oRect.right)),
							nRatio	= (nLeft - oRect.left) / (oRect.right - oRect.left);

						var nStep	= parseFloat(this.attributes["step"]) || 1,
							nMin	= parseFloat(this.attributes["min"]),
							nMax	= parseFloat(this.attributes["max"]);

						if (isNaN(nMin))
							nMin	= 0;
						if (isNaN(nMax))
							nMax	= 100;
						if (nMax < nMin)
							nMax	= nMin;
												this.valueAsNumber	= Math.round(nStep * (nMin + (nMax - nMin) * nRatio)) / nStep;
												this.$getContainer("button").style.left	= cXHTMLElement_input.getRangeOffset(this, this.valueAsNumber);
					}
					break;
			}
		}
	},
	"keydown":	function(oEvent) {
				if (oEvent.target == this) {
			var sKey	= oEvent.keyIdentifier;
			switch (this.attributes["type"]) {
				case "range":
					if (sKey == "Right") {
						this.stepUp();
						cXHTMLElement_input.dispatchInputEvent(this);
					}
					else
					if (sKey == "Left") {
						this.stepDown();
						cXHTMLElement_input.dispatchInputEvent(this);
					}
					break;

				case "number":
					if (sKey == "Up") {
						this.stepUp();
						cXHTMLElement_input.dispatchInputEvent(this);
					}
					else
					if (sKey == "Down") {
						this.stepDown();
						cXHTMLElement_input.dispatchInputEvent(this);
					}
					break;

				case "radio":
					break;

				case "checkbox":
					if (sKey == "U+0020")													break;
			}
		}
	},
	"keyup":	function(oEvent) {
			},
	"DOMActivate":	function(oEvent) {
		if (oEvent.target == this) {
			switch (this.attributes["type"]) {
				case "file":
					this.$getContainer("value").click();
					break;

				case "color":
				case "date":
				case "datetime":
				case "datetime-local":
				case "month":
				case "week":
					cXHTMLElement_input.toggle(this);
					break;

				case "checkbox":
					this.setAttribute("checked", this.attributes["checked"] == "true" ? "false" : "true");
					break;

				case "radio":
					var sName	= this.attributes["name"];
					if (sName && this.form)
						for (var nIndex = 0, oElement; nIndex < this.form.elements.length; nIndex++)
							if ((oElement = this.form.elements[nIndex]) && oElement.attributes["type"] == "radio" && oElement.attributes["name"] == sName)
								if (oElement.attributes["checked"] == "true")
									this.form.elements[nIndex].removeAttribute("checked");
					this.setAttribute("checked", "true");
					break;
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				cXHTMLInputElement.register(this);
				this.$selectable	= this.attributes["type"] != "range";
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
				cXHTMLInputElement.unregister(this);
	}
};

cXHTMLElement_input.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "type") {
				var oElementDOM	= this.$getContainer(),
			oFactory	= document.createElement("div");
		oFactory.innerHTML	= this.$getTag();
		oElementDOM.parentNode.replaceChild(oFactory.firstChild, oElementDOM);
	}
	else
	if (sName == "placeholder") {
		this.$getContainer("placeholder").innerHTML	= ample.$encodeXMLCharacters(sValue || '');
	}
	else
	if (sName == "checked") {
		this.$setPseudoClass("checked", sValue != null && sValue != "false");
	}
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue != null, "value");			this.$getContainer("value").disabled	= sValue != null;
	}
	else
	if (sName == "value") {
		if (this.attributes["type"] == "range") {
			this.$getContainer("button").style.left	= cXHTMLElement_input.getRangeOffset(this, sValue || '');
		}
		else {
			this.$getContainer("value").value	= sValue || '';
		}
	}
	else
		cXHTMLElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXHTMLElement_input.toggle	= function(oInstance, bForce) {
		var oPopup	= oInstance.$getContainer("popup");
	if ((arguments.length > 1 && bForce == true) || !(arguments.length > 1 || oPopup.style.display != "none")) {
		oInstance.$setPseudoClass("active", true);
		oPopup.style.display	= "";
	}
	else {
		oInstance.$setPseudoClass("active", false);
		oPopup.style.display	= "none";
	}

	switch (oInstance.attributes.type) {
		case "date":
		case "datetime":
		case "datetime-local":
		case "month":
		case "week":
			if (!oInstance.datepicker) {
				var oElement	= ample.createElement("datepicker");
				oPopup.innerHTML	= oElement.$getTag();
				oInstance.contentFragment.appendChild(oElement);
				oInstance.datepicker	= oElement;
			}
			oInstance.datepicker.setAttribute("value", "2010-11-23");
			break;

		case "color":
			if (!oInstance.colorpicker) {
				var oElement	= ample.createElement("colorpicker");
				oPopup.innerHTML	= oElement.$getTag();
				oInstance.contentFragment.appendChild(oElement);
				oInstance.colorpicker	= oElement;
			}
			oInstance.colorpicker.setAttribute("value", "#ffffff");
			break;
	}
};

cXHTMLElement_input.getRangeOffset	= function(oInstance, nValue) {
	var nMax	= parseFloat(oInstance.attributes.max),
		nMin	= parseFloat(oInstance.attributes.min);

	if (isNaN(nMin))
		nMin	= 0;
	if (isNaN(nMax))
		nMax	= 100;
	if (nMax < nMin)
		nMax	= nMin;

	return 100 * (Math.max(nMin, Math.min(nMax, nValue)) - nMin) / (nMax - nMin) + '%';
};

cXHTMLElement_input.dispatchInputEvent	= function(oInstance) {
	var oEvent	= oInstance.ownerDocument.createEvent("Event");
	oEvent.initEvent("input", false, false);
	oInstance.dispatchEvent(oEvent);
};

cXHTMLElement_input.html524	= {
	"hidden":	"hidden",
	"password":	"password",
	"checkbox":	"checkbox",
	"radio":	"radio",
	"file":		"file",
	"submit":	"submit",
	"image":	"image",
	"reset":	"reset",
	"button":	"button"
};

cXHTMLElement_input.prototype.$getTagOpen		= function() {
	var sType	= this.attributes.type || "text",
		sValue	= this.attributes.value || "",
		sClassName	=(this.prefix ? this.prefix + '-' : '') + this.localName,
		sClassNameType	= sClassName + '-type-' + sType,
		bChecked	= this.attributes["checked"] && this.attributes["checked"] != "false",
		bRequired	= this.attributes["required"] && this.attributes["required"] != "false",
		bDisabled	= this.attributes["disabled"] && this.attributes["disabled"] != "false",
		bReadonly	= this.attributes["readonly"] && this.attributes["readonly"] != "false",
		bValid		= cXHTMLInputElement.isValid(this),
		aHtml	= [];
	aHtml.push('<span class="' + sClassName + ' ' + sClassNameType +
						("class" in this.attributes ? ' ' + this.attributes["class"] : '') +
						' ' + sClassName + '_' + (bChecked ? 'checked' : '') + ' '+
						' ' + sClassName + '_' + (bRequired ? 'required' : 'optional') + ' '+
						' ' + sClassName + '_' + (bDisabled ? 'disabled' : 'enabled') + ' '+
						' ' + sClassName + '_' + (bReadonly ? 'read-only' : 'read-write') + ' '+
						' ' + sClassName + '_' + (bValid ? 'valid' : 'invalid') + ' '+
				'" ' +(this.attributes.style ? ' style="' + this.attributes.style + '"' : '')+ '>');
	aHtml.push(	'<div style="position:absolute;white-space:nowrap;' + (sValue == '' ? '' : 'display:none')+ '" class="' + sClassName + '--placeholder">' +
					(this.getAttribute("placeholder") || '')+
				'</div>');
	aHtml.push(	'<span class="' + sClassName + '--before ' + sClassNameType + '--before" style="float:left"></span>');
	aHtml.push(	'<span class="' + sClassName + '--after ' + sClassNameType + '--after" style="float:right"></span>');
	aHtml.push(	'<div class="' + sClassName + '--field ' + sClassNameType + '--field" style="position:relative">');
	aHtml.push(		'<div class="' + sClassName + '--button ' + sClassNameType + '--button" style="' +
						(sType == "range"
							? "left:" + cXHTMLElement_input.getRangeOffset(this, sValue)
							: "right:0")+
					'">');
	if (sType == "number" || sType == "time")
		aHtml.push(this._spinButtons.$getTag());
	aHtml.push(		'</div>');
	aHtml.push(		'<input class="' + sClassName + '--value ' + sClassNameType + '--value" \
						type="' +(cXHTMLElement_input.html524[sType] || "text")+ '" \
						onchange="var o = ample.$instance(this).$getContainer(\'label\'); o.innerText = o.textContent = this.value"' +
						(this.attributes["readonly"] ? ' readonly="true"' : '') +
						(this.attributes["disabled"] ? ' disabled="true"' : '') +
						(this.attributes["maxlength"] ? ' maxlength="' + this.attributes["maxlength"] + '"' : '') +
						(sValue ? ' value="' + ample.$encodeXMLCharacters(sValue) + '"' : '') +
						(this.attributes["name"] ? ' name="' + ample.$encodeXMLCharacters(this.attributes["name"]) + '"' : '')+
					'/>');
	aHtml.push(		'<div class="' + sClassName + '--label ' + sClassNameType + '--label">' +
						(sType == "reset" || sType == "submit" || sType == "button"
							? sValue
							: sType == "date"
								? ample.locale.format(ample.locale.parseDate(sValue, "yyyy-mm-dd"), "D")
								: sType == "time" || sType == "color"
									? sValue : '') +
					'</div>');
	aHtml.push(	'</div>');
	aHtml.push(	'<div class="' + sClassName + '--popup" style="position:absolute;display:none">');
	return aHtml.join('');
};

cXHTMLElement_input.prototype.$getTagClose	= function() {
	var aHtml	= [];
	aHtml.push(	'</div>');
	aHtml.push('</span>');
	return aHtml.join('');
};

ample.extend(cXHTMLElement_input);




var cXHTMLElement_keygen	= function(){
		this.validity	= new cXHTMLValidityState;
};
cXHTMLElement_keygen.prototype	= new cXHTMLInputElement("keygen");

ample.extend(cXHTMLElement_keygen);


var cXHTMLElement_label	= function(){};
cXHTMLElement_label.prototype	= new cXHTMLElement("label");

cXHTMLElement_label.handlers	= {
	"click":	function() {
		this.$activate();
	},
	"DOMActivate":	function(oEvent) {
		var oControl;
		if (this.attributes["for"] && (oControl = this.ownerDocument.getElementById(this.attributes["for"])))
			if (oControl instanceof cXHTMLInputElement)
				oControl.focus();
	}
};

ample.extend(cXHTMLElement_label);


var cXHTMLElement_legend	= function(){};
cXHTMLElement_legend.prototype	= new cXHTMLElement("legend");

ample.extend(cXHTMLElement_legend);


var cXHTMLElement_meter	= function(){};
cXHTMLElement_meter.prototype	= new cXHTMLElement("meter");

ample.extend(cXHTMLElement_meter);


var cXHTMLElement_optgroup	= function(){};
cXHTMLElement_optgroup.prototype	= new cXHTMLElement("optgroup");
cXHTMLElement_optgroup.prototype.$selectable	= false;

cXHTMLElement_optgroup.handlers	= {
	"mouseover":	function(oEvent) {
		if (oEvent.target == this)
			this.$setPseudoClass("hover", true, "value");
	},
	"mouseout":	function(oEvent) {
		if (oEvent.target == this)
			this.$setPseudoClass("hover", false, "value");
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				for (var oNode = this, nDepth = 0; oNode = oNode.parentNode;)
			if (oNode instanceof cXHTMLElement_select)
				break;
			else
				nDepth++;
		if (oNode) {
						if (this.parentNode != oNode)
				this.$getContainer("gap").style.width	= nDepth + "em";
		}
	}
};

cXHTMLElement_optgroup.prototype.$getTagOpen	= function() {
	var sClassName	= (this.prefix ? this.prefix + '-' : '') + this.localName;
	return '<div class="' +	sClassName +
				("class" in this.attributes ? ' ' + this.attributes["class"] : '')+
				(this.attributes["disabled"] ? ' ' + sClassName + '_disabled' : '')+
			'">\
				<div class="' + sClassName + '--gap" style="height:1em;float:left"></div>\
				<div class="' + sClassName + '--value">' +(this.attributes.label || '')+ '</div>\
				<div class="' + sClassName + '--gateway">';
};

cXHTMLElement_optgroup.prototype.$getTagClose	= function() {
	return 		'</div>\
			</div>';
};

ample.extend(cXHTMLElement_optgroup);


var cXHTMLElement_option	= function(){};
cXHTMLElement_option.prototype	= new cXHTMLElement("option");
cXHTMLElement_option.prototype.$selectable	= false;
cXHTMLElement_option.prototype.$hoverable	= true;

cXHTMLElement_option.ensureRowIsVisible	= function(oInstance) {
	for (var oElement = oInstance; oElement = oElement.parentNode;)
		if (oElement instanceof cXHTMLElement_select) {
			var oScroll	= oElement.$getContainer("popup"),
				oInput	= oInstance.$getContainer(),
				nDiffTop	= oInput.offsetTop - oScroll.offsetTop,
				nDiffHeight	= oInput.offsetHeight - oScroll.offsetHeight;
			if (oScroll.scrollTop < nDiffTop + nDiffHeight)
				oScroll.scrollTop	= nDiffTop + nDiffHeight;
			else
			if (oScroll.scrollTop > nDiffTop)
				oScroll.scrollTop	= nDiffTop;
			break;
		}
};

cXHTMLElement_option.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				for (var oNode = this, nDepth = 0; oNode = oNode.parentNode;)
			if (oNode instanceof cXHTMLElement_select)
				break;
			else
				nDepth++;
		if (oNode) {
			oNode.options.$add(this);
						if (this.parentNode != oNode)
				this.$getContainer("gap").style.width	= nDepth + "em";
		}
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
				for (var oNode = this; oNode = oNode.parentNode;)
			if (oNode instanceof cXHTMLElement_select)
				break;
		if (oNode)
			oNode.options.$remove(this);
	}
};

cXHTMLElement_option.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "selected")
		this.$setPseudoClass("selected", sValue != null && sValue != "false");
	else
	if (sName == "label")
		this.$getContainer("gateway").innerHTML	= ample.$encodeXMLCharacters(sValue || '');
	else
		cXHTMLElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXHTMLElement_option.prototype.$getTagOpen	= function() {
	var sClassName	= (this.prefix ? this.prefix + '-' : '') + this.localName;
	return '<div class="' +	sClassName +
				("class" in this.attributes ? ' ' + this.attributes["class"] : '')+
				(this.attributes["disabled"] ? ' ' + sClassName + '_disabled' : '')+
			'">\
				<div class="' + sClassName + '--gap" style="height:1em;float:left"></div>\
				<div class="' + sClassName + '--gateway">' +(this.attributes.label || '');
};

cXHTMLElement_option.prototype.$getTagClose	= function() {
	return 		'</div>\
			</div>';
};

ample.extend(cXHTMLElement_option);


var cXHTMLElement_output	= function(){};
cXHTMLElement_output.prototype	= new cXHTMLElement("output");

ample.extend(cXHTMLElement_output);


var cXHTMLElement_progress	= function(){};
cXHTMLElement_progress.prototype	= new cXHTMLElement("progress");

ample.extend(cXHTMLElement_progress);


var cXHTMLElement_select	= function() {
		this.validity	= new cXHTMLValidityState;
		this.options	= new ample.classes.NodeList;

	var oSelf	= this;
	this.options.add	= function (oElement, nIndex) {oSelf.add(oElement, nIndex)};
	this.options.remove	= function (nIndex) {oSelf.remove(nIndex)};
};
cXHTMLElement_select.prototype	= new cXHTMLInputElement("select");

cXHTMLElement_select.prototype.options	= null;
cXHTMLElement_select.prototype.selectedIndex	=-1;

cXHTMLElement_select.prototype.add		= function(oElement, nIndex) {
	return this.appendChild(oElement);
};

cXHTMLElement_select.prototype.remove	= function(nIndex) {
	return this.removeChild(this.options[nIndex]);
};

cXHTMLElement_select.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer("value").focus();
	},
	"blur":		function(oEvent) {
				if (!this.attributes.multiple)
			cXHTMLElement_select.toggle(this, false);
		this.$getContainer("value").blur();
	},
	"mousedown":function(oEvent) {
		if (oEvent.target == this && oEvent.$pseudoTarget == this.$getContainer("button"))
			cXHTMLElement_select.toggle(this);
	},
	"keydown":	function(oEvent) {
		if (oEvent.keyIdentifier == "Up") {
						if (this.selectedIndex !=-1)
				this.options[this.selectedIndex].removeAttribute("selected");
						if (this.selectedIndex > 0)
				this.selectedIndex--;
			else
			if (this.options.length)
				this.selectedIndex	= this.options.length - 1;
						if (this.selectedIndex >-1) {
				this.options[this.selectedIndex].setAttribute("selected", "true");
				cXHTMLElement_option.ensureRowIsVisible(this.options[this.selectedIndex]);
			}
						oEvent.preventDefault();
		}
		else
		if (oEvent.keyIdentifier == "Down") {
						if (this.selectedIndex !=-1)
				this.options[this.selectedIndex].removeAttribute("selected");
						if (this.selectedIndex < this.options.length - 1)
				this.selectedIndex++;
			else
			if (this.options.length)
				this.selectedIndex	= 0;
						if (this.selectedIndex >-1) {
				this.options[this.selectedIndex].setAttribute("selected", "true");
				cXHTMLElement_option.ensureRowIsVisible(this.options[this.selectedIndex]);
			}
						oEvent.preventDefault();
		}
	},
	"click":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.$pseudoTarget == this.$getContainer("button"))
				cXHTMLElement_select.toggle(this);
		}
	},
	"mousedown":	function(oEvent) {
		if (oEvent.target instanceof cXHTMLElement_option) {
			if (this.options[this.selectedIndex] != oEvent.target) {
				if (this.selectedIndex >-1)
					this.options[this.selectedIndex].removeAttribute("selected");
				this.options[this.selectedIndex = this.options.$indexOf(oEvent.target)].setAttribute("selected", "true");
				cXHTMLElement_option.ensureRowIsVisible(this.options[this.selectedIndex]);
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				cXHTMLInputElement.register(this);
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
				cXHTMLInputElement.unregister(this);
	}
};

cXHTMLElement_select.toggle	= function(oInstance, bForce) {
	var oPopup	= oInstance.$getContainer("popup");
	if ((arguments.length > 1 && bForce == true) || !(arguments.length > 1 || oPopup.style.display != "none")) {
		oInstance.$setPseudoClass("active", true);
		oPopup.style.display	= "";
	}
	else {
		oInstance.$setPseudoClass("active", false);
		oPopup.style.display	= "none";
	}
};

cXHTMLElement_select.prototype.$getTagOpen	= function() {
	var sClassName	= (this.prefix ? this.prefix + '-' : '') + this.localName,
		bMultiple	= "multiple" in this.attributes || this.attributes.multiple == "true",
		bPopupMode	= bMultiple;
	return '<span class="' + sClassName + ' ' + (bMultiple ? sClassName + '-multiple-' : '') +
					("class" in this.attributes ? ' ' + this.attributes["class"] : '')+
					(this.attributes["required"] ? ' ' + sClassName + '_required' : '')+
					(this.attributes["disabled"] ? ' ' + sClassName + '_disabled' : '')+
			'">\
				<div style="position:absolute;margin-top:-2px;white-space:nowrap" class="' + sClassName + '--placeholder">' +(this.attributes["placeholder"] ? ample.$encodeXMLCharacters(this.attributes["placeholder"]) : '')+ '</div>\
					<div class="' + sClassName + '--field" style="position:relative;' + (bPopupMode ? 'display:none' : '') + '">\
					<div class="' + sClassName + '--button" style="right:0"></div>\
					<input class="' + sClassName + '--value" type="text" />\
					<div class="' + sClassName + '--label" />\
					</div>\
					<div class="' + sClassName + '--popup' + (bMultiple ? ' ' + sClassName + '-multiple---popup' : '') +'" style="' +(bPopupMode ? '' : 'position:absolute;display:none;')+ '">\
					<div class="' + sClassName + '--gateway" style="margin:1px">';
};

cXHTMLElement_select.prototype.$getTagClose	= function() {
	return 			'</div>\
				</div>\
			</span>';
};

ample.extend(cXHTMLElement_select);


var cXHTMLElement_textarea	= function(){
	this.validity	= new cXHTMLValidityState;
};
cXHTMLElement_textarea.prototype	= new cXHTMLInputElement("textarea");

cXHTMLElement_textarea.prototype.select	= function() {
	this.$getContainer().select();
};

cXHTMLElement_textarea.prototype._onChange	= function(oEvent) {
		var oEvent2	= this.ownerDocument.createEvent("UIEvent");
	oEvent2.initUIEvent("change", true, false, window, null);
	this.dispatchEvent(oEvent2);
};

cXHTMLElement_textarea.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer("value").focus();
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				cXHTMLInputElement.register(this);
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
				cXHTMLInputElement.unregister(this);
	}
};

cXHTMLElement_textarea.prototype.$getTagOpen	= function() {
	var sClassName	= (this.prefix ? this.prefix + '-' : '') + this.localName,
		aHtml	=['<span'];
	for (var sName in this.attributes)
		if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
			aHtml.push(' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"');
	aHtml.push(' class="' + sClassName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '">');
	aHtml.push(	'<div style="position:absolute;margin-top:-2px;white-space:nowrap" class="' + sClassName + '--placeholder">' +(this.getAttribute("placeholder") || '')+ '</div>');
	aHtml.push(	'<div class="' + sClassName + '--field" style="position:relative;height:100%;">');
	aHtml.push(		'<textarea class="' + sClassName + '--value" onchange="ample.$instance(this)._onChange(event)" style="width:100%;height:100%">');
	return aHtml.join('');
};

cXHTMLElement_textarea.prototype.$getTagClose	= function() {
	return 			'</textarea>\
				</div>\
			</span>';
};

ample.extend(cXHTMLElement_textarea);


var cXHTMLElement_blockquote	= function(){};
cXHTMLElement_blockquote.prototype	= new cXHTMLElement("blockquote");

ample.extend(cXHTMLElement_blockquote);


var cXHTMLElement_dd	= function(){};
cXHTMLElement_dd.prototype	= new cXHTMLElement("dd");

ample.extend(cXHTMLElement_dd);


var cXHTMLElement_div	= function(){};
cXHTMLElement_div.prototype	= new cXHTMLElement("div");

ample.extend(cXHTMLElement_div);


var cXHTMLElement_dl	= function(){};
cXHTMLElement_dl.prototype	= new cXHTMLElement("dl");

ample.extend(cXHTMLElement_dl);


var cXHTMLElement_dt	= function(){};
cXHTMLElement_dt.prototype	= new cXHTMLElement("dt");

ample.extend(cXHTMLElement_dt);


var cXHTMLElement_figcaption	= function(){};
cXHTMLElement_figcaption.prototype	= new cXHTMLElement("figcaption");

ample.extend(cXHTMLElement_figcaption);


var cXHTMLElement_figure	= function(){};
cXHTMLElement_figure.prototype	= new cXHTMLElement("figure");

ample.extend(cXHTMLElement_figure);


var cXHTMLElement_hr	= function(){};
cXHTMLElement_hr.prototype	= new cXHTMLElement("hr");

ample.extend(cXHTMLElement_hr);


var cXHTMLElement_li	= function(){};
cXHTMLElement_li.prototype	= new cXHTMLElement("li");

ample.extend(cXHTMLElement_li);


var cXHTMLElement_ol	= function(){};
cXHTMLElement_ol.prototype	= new cXHTMLElement("ol");

ample.extend(cXHTMLElement_ol);


var cXHTMLElement_p	= function(){};
cXHTMLElement_p.prototype	= new cXHTMLElement("p");

ample.extend(cXHTMLElement_p);


var cXHTMLElement_pre	= function(){};
cXHTMLElement_pre.prototype	= new cXHTMLElement("pre");

ample.extend(cXHTMLElement_pre);


var cXHTMLElement_ul	= function(){};
cXHTMLElement_ul.prototype	= new cXHTMLElement("ul");

ample.extend(cXHTMLElement_ul);


var cXHTMLElement_command	= function(){};
cXHTMLElement_command.prototype	= new cXHTMLElement("command");

ample.extend(cXHTMLElement_command);


var cXHTMLElement_details	= function(){};
cXHTMLElement_details.prototype	= new cXHTMLElement("details");

ample.extend(cXHTMLElement_details);


var cXHTMLElement_menu	= function(){};
cXHTMLElement_menu.prototype	= new cXHTMLElement("menu");

ample.extend(cXHTMLElement_menu);


var cXHTMLElement_summary	= function(){};
cXHTMLElement_summary.prototype	= new cXHTMLElement("summary");

ample.extend(cXHTMLElement_summary);


var cXHTMLElement_base	= function(){};
cXHTMLElement_base.prototype	= new cXHTMLElement("base");

ample.extend(cXHTMLElement_base);


var cXHTMLElement_head	= function(){};
cXHTMLElement_head.prototype	= new cXHTMLElement("head");

ample.extend(cXHTMLElement_head);


var cXHTMLElement_link	= function(){};
cXHTMLElement_link.prototype	= new cXHTMLElement("link");

ample.extend(cXHTMLElement_link);


var cXHTMLElement_meta	= function(){};
cXHTMLElement_meta.prototype	= new cXHTMLElement("meta");

ample.extend(cXHTMLElement_meta);


var cXHTMLElement_style	= function(){};
cXHTMLElement_style.prototype	= new cXHTMLElement("style");

ample.extend(cXHTMLElement_style);


var cXHTMLElement_title	= function(){};
cXHTMLElement_title.prototype	= new cXHTMLElement("title");

ample.extend(cXHTMLElement_title);


var cXHTMLElement_dialog	= function(){};
cXHTMLElement_dialog.prototype	= new cXHTMLElement("dialog");

ample.extend(cXHTMLElement_dialog);


var cXHTMLElement_html	= function(){};
cXHTMLElement_html.prototype	= new cXHTMLElement("html");

ample.extend(cXHTMLElement_html);


var cXHTMLElement_eventsource	= function(){};
cXHTMLElement_eventsource.prototype	= new cXHTMLElement("eventsource");

ample.extend(cXHTMLElement_eventsource);


var cXHTMLElement_noscript	= function(){};
cXHTMLElement_noscript.prototype	= new cXHTMLElement("noscript");

ample.extend(cXHTMLElement_noscript);


var cXHTMLElement_script	= function(){};
cXHTMLElement_script.prototype	= new cXHTMLElement("script");

cXHTMLElement_script.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		var sType	=(this.attributes["type"] || '').match(/(\w+)\/([-\w]+\+)?(?:x\-)?([-\w]+)?;?(.+)?/) ? RegExp.$3 : '';
		if (this.attributes["src"])
			this.$getContainer().src	= this.attributes["src"];
		else
		if (this.firstChild &&(sType == "" || sType == "javascript" || sType == "ecmascript")) {
			var oElement	= document.body.appendChild(document.createElement("script"));
			oElement.type	= "text/javascript";
			oElement.text	= this.firstChild.nodeValue;
		}
	}
};

ample.extend(cXHTMLElement_script);


var cXHTMLElement_address	= function(){};
cXHTMLElement_address.prototype	= new cXHTMLElement("address");

ample.extend(cXHTMLElement_address);


var cXHTMLElement_article	= function(){};
cXHTMLElement_article.prototype	= new cXHTMLElement("article");

ample.extend(cXHTMLElement_article);


var cXHTMLElement_aside	= function(){};
cXHTMLElement_aside.prototype	= new cXHTMLElement("aside");

ample.extend(cXHTMLElement_aside);


var cXHTMLElement_body	= function(){};
cXHTMLElement_body.prototype	= new cXHTMLElement("body");

ample.extend(cXHTMLElement_body);


var cXHTMLElement_footer	= function(){};
cXHTMLElement_footer.prototype	= new cXHTMLElement("footer");

ample.extend(cXHTMLElement_footer);


var cXHTMLElement_h1	= function(){};
cXHTMLElement_h1.prototype	= new cXHTMLElement("h1");

ample.extend(cXHTMLElement_h1);


var cXHTMLElement_h2	= function(){};
cXHTMLElement_h2.prototype	= new cXHTMLElement("h2");

ample.extend(cXHTMLElement_h2);


var cXHTMLElement_h3	= function(){};
cXHTMLElement_h3.prototype	= new cXHTMLElement("h3");

ample.extend(cXHTMLElement_h3);


var cXHTMLElement_h4	= function(){};
cXHTMLElement_h4.prototype	= new cXHTMLElement("h4");

ample.extend(cXHTMLElement_h4);


var cXHTMLElement_h5	= function(){};
cXHTMLElement_h5.prototype	= new cXHTMLElement("h5");

ample.extend(cXHTMLElement_h5);


var cXHTMLElement_h6	= function(){};
cXHTMLElement_h6.prototype	= new cXHTMLElement("h6");

ample.extend(cXHTMLElement_h6);


var cXHTMLElement_header	= function(){};
cXHTMLElement_header.prototype	= new cXHTMLElement("header");

ample.extend(cXHTMLElement_header);


var cXHTMLElement_nav	= function(){};
cXHTMLElement_nav.prototype	= new cXHTMLElement("nav");

ample.extend(cXHTMLElement_nav);


var cXHTMLElement_section	= function(){};
cXHTMLElement_section.prototype	= new cXHTMLElement("section");

ample.extend(cXHTMLElement_section);


var cXHTMLElement_spinbuttons	= function(){};
cXHTMLElement_spinbuttons.prototype	= new cXHTMLElement("spinbuttons");

cXHTMLElement_spinbuttons.captured	= false;
cXHTMLElement_spinbuttons.interval	= null;
cXHTMLElement_spinbuttons.timeout		= null;

cXHTMLElement_spinbuttons.handlers	= {
	"mousedown":	function(oEvent) {
		if (oEvent.$pseudoTarget == this.$getContainer("button-up")) {
			this.spin(true);
			var that	= this;
			cXHTMLElement_spinbuttons.timeout	= setTimeout(function() {
				cXHTMLElement_spinbuttons.interval	= setInterval(function() {
					that.spin(true);
				}, 100);
			}, 500);
			this.$setPseudoClass("active", true, "button-up");
			this._captured	= true;
			this.setCapture(true);
		}
		else
		if (oEvent.$pseudoTarget == this.$getContainer("button-down")) {
			this.spin(false);
			var that	= this;
			cXHTMLElement_spinbuttons.timeout	= setTimeout(function() {
				cXHTMLElement_spinbuttons.interval	= setInterval(function() {
					that.spin(false);
				}, 100);
			}, 500);
			this.$setPseudoClass("active", true, "button-down");
			this._captured	= true;
			this.setCapture(true);
		}
	},
	"mouseup":	function(oEvent) {
		if (this._captured) {
			this._captured	= false;
			clearTimeout(cXHTMLElement_spinbuttons.timeout);
			clearInterval(cXHTMLElement_spinbuttons.interval);
			this.$setPseudoClass("active", false, "button-up");
			this.$setPseudoClass("active", false, "button-down");
			this.releaseCapture();
		}
	},
	"DOMAttrModifed":	function(oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "disabled":
					this.$setPseudoClass("disabled", oEvent.newValue == "true");
					break;
			}
		}
	}
};

cXHTMLElement_spinbuttons.prototype.spin	= function(bForward) {
	var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("spin", false, false, bForward);
	this.dispatchEvent(oEvent);
};

cXHTMLElement_spinbuttons.prototype.$getTagOpen	= function() {
	return '<div class="spinbuttons' + (!this.$isAccessible() ? ' spinbuttons_disabled' : '')+ '" onmousedown="return false" onselectstart="return false">\
				<div class="spinbuttons--button-up" onmouseover="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', true, \'button-up\')" onmouseout="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', false, \'button-up\')"><br/></div>\
				<div class="spinbuttons--button-down" onmouseover="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', true, \'button-down\')" onmouseout="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', false, \'button-down\')"><br/></div>\
			</div>';
};
cXHTMLElement_spinbuttons.prototype.$getTagClose	= function() {
	return '';
};

ample.extend(cXHTMLElement_spinbuttons);


var cXHTMLElement_caption	= function(){};
cXHTMLElement_caption.prototype	= new cXHTMLElement("caption");

ample.extend(cXHTMLElement_caption);


var cXHTMLElement_col	= function(){};
cXHTMLElement_col.prototype	= new cXHTMLElement("col");

ample.extend(cXHTMLElement_col);


var cXHTMLElement_colgroup	= function(){};
cXHTMLElement_colgroup.prototype	= new cXHTMLElement("colgroup");

ample.extend(cXHTMLElement_colgroup);


var cXHTMLElement_table	= function() {
	this.tHead		= null;
	this.tBodies	= new ample.classes.NodeList;
	this.tFoot		= null;

	this.caption	= null;

	this.rows	= new ample.classes.NodeList;
};
cXHTMLElement_table.prototype	= new cXHTMLElement("table");

cXHTMLElement_table.prototype.tHead	= null;
cXHTMLElement_table.prototype.tBodies	= null;
cXHTMLElement_table.prototype.tFoot	= null;
cXHTMLElement_table.prototype.caption	= null;
cXHTMLElement_table.prototype.rows	= null;

cXHTMLElement_table.prototype.insertRow	= function(nIndex) {
	var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "tr");
	return nIndex ==-1 ? this.appendChild(oElement) : this.insertBefore(oElement, this.rows[nIndex]);
};

cXHTMLElement_table.prototype.deleteRow	= function(nIndex) {
	return this.removeChild(this.rows[nIndex]);
};

cXHTMLElement_table.prototype.createCaption	= function() {

};

cXHTMLElement_table.prototype.deleteCaption	= function() {

};

cXHTMLElement_table.prototype.createTHead	= function() {

};

cXHTMLElement_table.prototype.deleteTHead	= function() {

};

cXHTMLElement_table.prototype.createTFoot	= function() {

};

cXHTMLElement_table.prototype.deleteTFoot	= function() {

};

cXHTMLElement_table.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_caption)
				this.caption	= oEvent.target;
			else
			if (oEvent.target instanceof cXHTMLElement_tbody)
				this.tBodies.$add(oEvent.target);
			else
			if (oEvent.target instanceof cXHTMLElement_tfoot)
				this.tFoot	= oEvent.target;
			else
			if (oEvent.target instanceof cXHTMLElement_thead)
				this.tHead	= oEvent.target;
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_caption)
				this.caption	= null;
			else
			if (oEvent.target instanceof cXHTMLElement_tbody)
				this.tBodies.$remove(oEvent.target);
			else
			if (oEvent.target instanceof cXHTMLElement_tfoot)
				this.tFoot	= nullt;
			else
			if (oEvent.target instanceof cXHTMLElement_thead)
				this.tHead	= null;
	}
};

ample.extend(cXHTMLElement_table);


var cXHTMLElement_tbody	= function() {
	this.rows	= new ample.classes.NodeList;
};
cXHTMLElement_tbody.prototype	= new cXHTMLElement("tbody");

cXHTMLElement_tbody.prototype.rows	= null;

cXHTMLElement_tbody.prototype.insertRow	= function(nIndex) {
	var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "tr");
	return nIndex ==-1 ? this.appendChild(oElement) : this.insertBefore(oElement, this.rows[nIndex]);
};

cXHTMLElement_tbody.prototype.deleteRow	= function(nIndex) {
	return this.removeChild(this.rows[nIndex]);
};

cXHTMLElement_tbody.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$remove(oEvent.target);
	}
};

ample.extend(cXHTMLElement_tbody);


var cXHTMLElement_td	= function(){};
cXHTMLElement_td.prototype	= new cXHTMLElement("td");

ample.extend(cXHTMLElement_td);


var cXHTMLElement_tfoot	= function() {
	this.rows	= new ample.classes.NodeList;
};
cXHTMLElement_tfoot.prototype	= new cXHTMLElement("tfoot");

cXHTMLElement_tfoot.prototype.rows	= null;

cXHTMLElement_tfoot.prototype.insertRow	= function(nIndex) {
	var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "tr");
	return nIndex ==-1 ? this.appendChild(oElement) : this.insertBefore(oElement, this.rows[nIndex]);
};

cXHTMLElement_tfoot.prototype.deleteRow	= function(nIndex) {
	return this.removeChild(this.rows[nIndex]);
};

cXHTMLElement_tfoot.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$remove(oEvent.target);
	}
};

ample.extend(cXHTMLElement_tfoot);


var cXHTMLElement_th	= function(){};
cXHTMLElement_th.prototype	= new cXHTMLElement("th");

ample.extend(cXHTMLElement_th);


var cXHTMLElement_thead	= function() {
	this.rows	= new ample.classes.NodeList;
};
cXHTMLElement_thead.prototype	= new cXHTMLElement("thead");

cXHTMLElement_thead.prototype.rows	= null;

cXHTMLElement_thead.prototype.insertRow	= function(nIndex) {
	var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "tr");
	return nIndex ==-1 ? this.appendChild(oElement) : this.insertBefore(oElement, this.rows[nIndex]);
};

cXHTMLElement_thead.prototype.deleteRow	= function(nIndex) {
	return this.removeChild(this.rows[nIndex]);
};

cXHTMLElement_thead.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_tr)
				this.rows.$remove(oEvent.target);
	}
};

ample.extend(cXHTMLElement_thead);


var cXHTMLElement_tr	= function() {
	this.cells	= new ample.classes.NodeList;
};
cXHTMLElement_tr.prototype	= new cXHTMLElement("tr");

cXHTMLElement_tr.prototype.cells	= null;

cXHTMLElement_tr.prototype.insertCell	= function(nIndex) {
	var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "td");
	return nIndex ==-1 ? this.appendChild(oElement) : this.insertBefore(oElement, this.rows[nIndex]);
};

cXHTMLElement_tr.prototype.deleteCell	= function(nIndex) {
	return this.removeChild(this.cells[nIndex]);
};

cXHTMLElement_tr.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_td || oEvent.target instanceof cXHTMLElement_th)
				this.cells.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXHTMLElement_td || oEvent.target instanceof cXHTMLElement_th)
				this.cells.$remove(oEvent.target);
	}
};

ample.extend(cXHTMLElement_tr);


var cXHTMLElement_a	= function(){};
cXHTMLElement_a.prototype	= new cXHTMLElement("a");
cXHTMLElement_a.prototype.tabIndex	= 0;
cXHTMLElement_a.prototype.$hoverable= true;

cXHTMLElement_a.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer().focus();
	},
	"blur":		function(oEvent) {
		this.$getContainer().blur();
	},
	"click":	function(oEvent) {
		if (oEvent.button == 0) {
			var oDOMActivateEvent	= this.ownerDocument.createEvent("UIEvent");
			oDOMActivateEvent.initUIEvent("DOMActivate", true, true, window, null);
			if (!this.dispatchEvent(oDOMActivateEvent))
				oEvent.preventDefault();
		}
	},
	"DOMActivate":	function(oEvent) {
				if (document.namespaces) {
			var sHref	= this.$getContainer().href,
				aUrl	= sHref.match(/^([^#]*)#(.*)/);
			if (aUrl && window.location.href.match(/^([^#]*)#/) && aUrl[1] == window.RegExp.$1)
				ample.bookmark(aUrl[2]);
		}

				var oTarget;
		if (this.getAttribute("target").match(/#(.+)$/) && (oTarget = this.ownerDocument.getElementById(window.RegExp.$1)))	{
						ample.query(oTarget).load(this.getAttribute("href"));

						oEvent.preventDefault();
		}
	}
}

ample.extend(cXHTMLElement_a);


var cXHTMLElement_abbr	= function(){};
cXHTMLElement_abbr.prototype	= new cXHTMLElement("abbr");

ample.extend(cXHTMLElement_abbr);


var cXHTMLElement_b	= function(){};
cXHTMLElement_b.prototype	= new cXHTMLElement("b");

ample.extend(cXHTMLElement_b);


var cXHTMLElement_bdo	= function(){};
cXHTMLElement_bdo.prototype	= new cXHTMLElement("bdo");

ample.extend(cXHTMLElement_bdo);


var cXHTMLElement_br	= function(){};
cXHTMLElement_br.prototype	= new cXHTMLElement("br");

cXHTMLElement_br.prototype.$getTagOpen	= function() {
	var sHtml	= '<' + this.localName;
	for (var sName in this.attributes)
		if (this.attributes.hasOwnProperty(sName) && sName != "class" && sName != "id" && sName.indexOf(':') ==-1)
			sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
	sHtml	+= ' class="' + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
	return sHtml + '/>';
};

cXHTMLElement_br.prototype.$getTagClose	= function() {
	return '';
};

ample.extend(cXHTMLElement_br);


var cXHTMLElement_cite	= function(){};
cXHTMLElement_cite.prototype	= new cXHTMLElement("cite");

ample.extend(cXHTMLElement_cite);


var cXHTMLElement_code	= function(){};
cXHTMLElement_code.prototype	= new cXHTMLElement("code");

ample.extend(cXHTMLElement_code);


var cXHTMLElement_dfn	= function(){};
cXHTMLElement_dfn.prototype	= new cXHTMLElement("dfn");

ample.extend(cXHTMLElement_dfn);


var cXHTMLElement_em	= function(){};
cXHTMLElement_em.prototype	= new cXHTMLElement("em");

ample.extend(cXHTMLElement_em);


var cXHTMLElement_i	= function(){};
cXHTMLElement_i.prototype	= new cXHTMLElement("i");

ample.extend(cXHTMLElement_i);


var cXHTMLElement_kbd	= function(){};
cXHTMLElement_kbd.prototype	= new cXHTMLElement("kbd");

ample.extend(cXHTMLElement_kbd);


var cXHTMLElement_mark	= function(){};
cXHTMLElement_mark.prototype	= new cXHTMLElement("mark");

ample.extend(cXHTMLElement_mark);


var cXHTMLElement_q	= function(){};
cXHTMLElement_q.prototype	= new cXHTMLElement("q");

ample.extend(cXHTMLElement_q);


var cXHTMLElement_rp	= function(){};
cXHTMLElement_rp.prototype	= new cXHTMLElement("rp");

ample.extend(cXHTMLElement_rp);


var cXHTMLElement_rt	= function(){};
cXHTMLElement_rt.prototype	= new cXHTMLElement("rt");

ample.extend(cXHTMLElement_rt);


var cXHTMLElement_ruby	= function(){};
cXHTMLElement_ruby.prototype	= new cXHTMLElement("ruby");

ample.extend(cXHTMLElement_ruby);


var cXHTMLElement_samp	= function(){};
cXHTMLElement_samp.prototype	= new cXHTMLElement("samp");

ample.extend(cXHTMLElement_samp);


var cXHTMLElement_small	= function(){};
cXHTMLElement_small.prototype	= new cXHTMLElement("small");

ample.extend(cXHTMLElement_small);


var cXHTMLElement_span	= function(){};
cXHTMLElement_span.prototype	= new cXHTMLElement("span");

ample.extend(cXHTMLElement_span);


var cXHTMLElement_strong	= function(){};
cXHTMLElement_strong.prototype	= new cXHTMLElement("strong");

ample.extend(cXHTMLElement_strong);


var cXHTMLElement_sub	= function(){};
cXHTMLElement_sub.prototype	= new cXHTMLElement("sub");

ample.extend(cXHTMLElement_sub);


var cXHTMLElement_sup	= function(){};
cXHTMLElement_sup.prototype	= new cXHTMLElement("sup");

ample.extend(cXHTMLElement_sup);


var cXHTMLElement_time	= function(){};
cXHTMLElement_time.prototype	= new cXHTMLElement("time");

ample.extend(cXHTMLElement_time);


var cXHTMLElement_var	= function(){};
cXHTMLElement_var.prototype	= new cXHTMLElement("var");

ample.extend(cXHTMLElement_var);


var cXHTMLElement_wbr	= function(){};
cXHTMLElement_wbr.prototype	= new cXHTMLElement("wbr");

ample.extend(cXHTMLElement_wbr);


function fXHTMLElement_isInputInForm(oElement) {
	return oElement instanceof cXHTMLInputElement && oElement.form;
};

ample.extend(ample.classes.NodeSelector.pseudoClass, {
	"default":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& (oElement.attributes.type == "checkbox" || oElement.attributes.type == "radio")
				&& (oElement.attributes.checked == oElement.defaultChecked);
	},
	"optional":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&&!(oElement.attributes["required"] == "" || oElement.attributes["required"] == "true");
	},
	"required":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& (oElement.attributes["required"] == "" || oElement.attributes["required"] == "true");
	},
	"read-write":	function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&&!(oElement.attributes["readonly"] == "" || oElement.attributes["readonly"] == "true");
	},
	"read-only":	function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& (oElement.attributes["readonly"] == "" || oElement.attributes["readonly"] == "true");
	},
	"invalid":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& oElement.validity &&!oElement.validity.valid;
	},
	"valid":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& oElement.validity && oElement.validity.valid;
	},
	"in-range":		function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& oElement.validity && !oElement.rangeUnderflow &&!oElement.validity.rangeOverflow;
	},
	"out-of-range":	function(oElement) {
		return fXHTMLElement_isInputInForm(oElement)
				&& oElement.validity && (oElement.rangeUnderflow || oElement.validity.rangeOverflow);
	}
});


function copyElements(sSourceNS, sTargetNS, aElements) {
	for (var nIndex = 0, fSource, fTarget; nIndex < aElements.length; nIndex++) {
		fSource	= ample.classes[sSourceNS + '#' + aElements[nIndex]];
		fTarget	= function() {
			fSource.call(this);
		};
		fTarget.prototype	= new fSource;
		fTarget.prototype.localName		= aElements[nIndex];
		fTarget.prototype.namespaceURI	= sTargetNS;
				fTarget.handlers	= fSource.handlers;
		fTarget.attributes	= fSource.attributes;
				ample.extend(fTarget);
	}
};

copyElements("http://www.w3.org/2008/SMIL30/", "http://www.w3.org/1999/xhtml",
	["set", "animate", "animateColor", "animateMotion", "par", "seq", "excl"]
);

})()
