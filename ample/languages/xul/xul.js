/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


var cXULController	= function(){};

cXULController.prototype.doCommand	= function(sName) {

};

cXULController.prototype.isCommandEnabled	= function(sName) {

};


var cXULDocument	= function(){};

cXULDocument.prototype.popupNode	= null;
cXULDocument.prototype.tooltipNode	= null;

cXULDocument.prototype.commandDispatcher	= null;

var hXULDocument_overlayFragments	= {};

cXULDocument.prototype.loadOverlay	= function(sUrl, fObserver) {
	var oDocument	= this;
	ample.ajax({
			"url":		sUrl,
			"async":	true,
			"dataType":	"xml",
			"success":	function(oResponse) {
								oOverlayDocumentElement	= oResponse.documentElement; 																																			fXULElement_overlay_applyOverlays(oDocument.documentElement, oOverlayDocumentElement);
												if (fObserver instanceof Function)
					fObserver();
			}
	});
};


ample.extend(ample.classes.Document.prototype, cXULDocument.prototype);

ample.addEventListener("DOMNodeInsertedIntoDocument", function(oEvent) {
	if (oEvent.target instanceof cXULElement && oEvent.target.hasAttribute("id")) {
		var sId	= oEvent.target.getAttribute("id");
		if (hXULDocument_overlayFragments[sId]) {
			fXULElement_overlay_applyOverlays(oEvent.target, hXULDocument_overlayFragments[sId]);
						delete hXULDocument_overlayFragments[sId];
		}
	}
}, true);

ample.addEventListener("DOMAttrModified", function(oEvent) {
	if (oEvent.target instanceof cXULElement && oEvent.attrName == "id") {
		var sId	= oEvent.newValue;
		if (hXULDocument_overlayFragments[sId]) {
			fXULElement_overlay_applyOverlays(oEvent.target, hXULDocument_overlayFragments[sId]);
						delete hXULDocument_overlayFragments[sId];
		}
	}
}, true);


var cXULElement	= function(sLocalName) {
	this.localName	= sLocalName;
};

cXULElement.VIEW_TYPE_VIRTUAL	= 0;	cXULElement.VIEW_TYPE_BOXED		= 1;	cXULElement.VIEW_TYPE_NORMAL	= 2;	
cXULElement.prototype	= new ample.classes.Element;
cXULElement.prototype.namespaceURI	= "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
cXULElement.prototype.localName		= "#element";
cXULElement.prototype.viewType		= cXULElement.VIEW_TYPE_NORMAL;

cXULElement.prototype.$getStyle	= function(sName) {
	var sValue;
	switch (sName) {
		case "-moz-box-flex":
		case "-moz-box-orient":
		case "-moz-box-pack":
		case "-moz-box-align":
		case "width":
		case "height":
						if (sValue = this.attributes["style"])
				if (sValue.match(new RegExp(sName + "\\s*:\\s*[\'\"]?\\s*([^;\'\"]+)\\s*[\'\"]?")))
					return RegExp.$1;

						if (sValue = this.attributes[sName.match(/\w+$/)])
				return sValue;

			return '';

		default:
			return ample.classes.Element.prototype.$getStyle.call(this, sName);
	}
};

cXULElement.prototype.$setStyle	= function(sName, sValue) {
	switch (sName) {
		case "-moz-box-flex":
		case "-moz-box-orient":
		case "-moz-box-pack":
		case "-moz-box-align":
		case "width":
		case "height":
			this.$mapAttribute(sName.match(/\w+$/)[0], sValue);
			break;

		default:
			ample.classes.Element.prototype.$setStyle.call(this, sName, sValue);
	}
};

cXULElement.prototype.$mapAttribute	= function(sName, sValue) {
	var oElementDOM	= this.$getContainer();
	switch (sName) {
		case "hidden":
						if (this.parentNode && this.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED) {
				if (this.parentNode.attributes["orient"] != "vertical")
					oElementDOM.parentNode.style.display	=(sValue == "true" ? "none" : "");
				else
					oElementDOM.parentNode.parentNode.style.display	=(sValue == "true" ? "none" : "");

								if (sValue != "true" && this.viewType == cXULElement.VIEW_TYPE_BOXED)
					oXULReflowManager.schedule(this);
								if (this.parentNode && this.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED)
					oXULReflowManager.schedule(this.parentNode);
			}
						oElementDOM.style.display	=(sValue == "true" ? "none" : "");
			break;

		case "debug":
			break;

		case "flex":
			if (this.parentNode && this.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED)
				oXULReflowManager.schedule(this.parentNode);
			break;

		case "orient":
						break;

		case "pack":
						break;

		case "align":
						break;

		case "width":
		case "height":
			if (this.parentNode && this.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED)
				oElementDOM.parentNode[sName] = sValue;
			oElementDOM.style[sName]	= sValue ? isNaN(sValue) ? sValue : sValue + "px" : '';
			break;
	}
};

cXULElement.prototype.$isAccessible	= function() {
	return this.attributes["disabled"] != "true";
};

cXULElement.prototype.reflow	= function() {
		if (this.attributes.hidden == "true")
		return;

		var nLength	= this.childNodes.length;
	if (nLength && this.viewType == cXULElement.VIEW_TYPE_BOXED) {
		var oElement;
		var nFlex		= 0,
			nPixels		= 0,
			nPercents	= 0,
			nElementFirst	=-1,
			nElementLast	=-1,
			bVertical	= this.attributes["orient"] == "vertical",
			sMeasure	= bVertical ? "height" : "width",
			sMeasureAlt	= bVertical ? "width" : "height",
			nElements	= 0,
			nVirtual	= 0;

				for (var nIndex = 0; nIndex < nLength; nIndex++) {
			oElement	= this.childNodes[nIndex];
			if (oElement.nodeType == ample.classes.Node.ELEMENT_NODE && oElement.viewType != cXULElement.VIEW_TYPE_VIRTUAL) {
				nElements++;
				if ((sMeasure in oElement.attributes) && oElement.attributes[sMeasure].match(/([0-9\.]+)(%?)/)) {
					if (RegExp.$2 == "%") {
						nPercents	+= RegExp.$1 * 1;
						if (nElementFirst ==-1)
							nElementFirst	= nIndex;
						nElementLast= nIndex;
					}
					else
						nPixels		+= RegExp.$1 * 1;
				}
				else
				if ("flex" in oElement.attributes && !isNaN(oElement.attributes["flex"])) {
					nFlex	+= oElement.attributes["flex"] * 1;
					if (nElementFirst ==-1)
						nElementFirst	= nIndex;
					nElementLast= nIndex;
				}
				else {
					var oElementRect	= oElement.getBoundingClientRect();
					nPixels	+= bVertical ? oElementRect.bottom - oElementRect.top : oElementRect.right - oElementRect.left;
				}
			}
		}

				if (nElements) {
			var oElementBox	=(this instanceof cXULElement_row || this instanceof cXULElement_rows) ? this.$getContainer() : this.$getContainer("box-container"),
				oElementDOM,
				oCell;

			if (this instanceof cXULElement_row)
				oElementBox	= oElementBox.parentNode.parentNode;

						if (nFlex) {
				oElementBox.setAttribute(sMeasure, "100%");
				this.$getContainer().style[sMeasure]	= this.attributes[sMeasure] ? (isNaN(this.attributes[sMeasure]) ? this.attributes[sMeasure] : this.attributes[sMeasure] + "px") : "100%";
			}

			var oElementRect	= this.getBoundingClientRect(),
				nPixelsAvailable= bVertical ? oElementRect.bottom - oElementRect.top : oElementRect.right - oElementRect.left,
				nFlexInPercents	= 100 * (1 - nPixels / nPixelsAvailable) - nPercents,
				nFlexInPixels	= nPixelsAvailable * (1 - nPercents / 100) - nPixels,
				nUsedFlex	= 0,
				nUsedPixels	= 0,
				nElementFlex,
				nElementPixels;

			for (nIndex = 0; nIndex < nLength; nIndex++) {
				oElement	= this.childNodes[nIndex];
				if (oElement.nodeType != ample.classes.Node.ELEMENT_NODE)
					nVirtual++;
				else
				if (oElement.viewType != cXULElement.VIEW_TYPE_VIRTUAL) {
					oElementDOM	= oElement.$getContainer();
					oCell	= oElementBox.tBodies[0].rows[bVertical ? nIndex - nVirtual : 0].cells[bVertical ? 0 : nIndex - nVirtual];
					if ("flex" in oElement.attributes && !isNaN(oElement.attributes["flex"])) {
						nElementFlex	= Math.ceil(nFlexInPercents * oElement.attributes["flex"] / nFlex);
						nElementPixels	= nFlexInPixels * oElement.attributes["flex"] / nFlex;
						oCell.setAttribute(sMeasure, (nElementLast == nIndex ? (document.namespaces ? nFlexInPercents - nUsedFlex : Math.ceil(nFlexInPercents - nUsedFlex)) : nElementFlex) + "%");
						nUsedFlex	+= nElementFlex;
						nUsedPixels	+= nElementPixels;
						if (!(oElement instanceof cXULElement_row) && oElementDOM)
							oElementDOM.style[sMeasure]	= "100%";						}
					if ((this.attributes["align"] == "stretch") && oElementDOM)
						oElementDOM.style[sMeasureAlt]	= "100%";
				}
			}
		}
	}

		for (var nIndex = 0, oElement; oElement = this.childNodes[nIndex]; nIndex++)
		if (oElement instanceof cXULElement)
			oElement.reflow();
};

cXULElement.prototype.$getTag		= function() {
	var aHtml		= [],
		bBoxContainer	= this instanceof cXULElement && this.viewType == cXULElement.VIEW_TYPE_BOXED &&!(this instanceof cXULElement_row),
		bBoxChild		= this.parentNode && this.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED &&!(this.parentNode instanceof cXULElement_rows) || this.parentNode instanceof cXULElement_row;

		if (bBoxChild)
		aHtml[aHtml.length]	= cXULElement.getBoxOpenChild(this);

		if (this.viewType != cXULElement.VIEW_TYPE_VIRTUAL) {
		aHtml[aHtml.length]	= this.$getTagOpen().replace(/^(\s*<[\w:]+)/, '$1 id="' +(this.attributes.id || this.uniqueID)+ '"');
				if (bBoxContainer)
			aHtml[aHtml.length]	= cXULElement.getBoxOpen(this);
	}

	for (var nIndex = 0; nIndex < this.childNodes.length; nIndex++)
		aHtml[aHtml.length]	= this.childNodes[nIndex].$getTag();

		if (this.viewType != cXULElement.VIEW_TYPE_VIRTUAL) {
		if (bBoxContainer)
			aHtml[aHtml.length]	= cXULElement.getBoxClose(this);

				aHtml[aHtml.length]	= this.$getTagClose();
	}

		if (bBoxChild)
		aHtml[aHtml.length]	= cXULElement.getBoxCloseChild(this);

	return aHtml.join('');};


var fElement_prototype_$getTag	= ample.classes.Element.prototype.$getTag;
ample.classes.Element.prototype.$getTag	= function() {
	if (this.parentNode instanceof cXULElement)
		return cXULElement.prototype.$getTag.call(this);
	else
		return fElement_prototype_$getTag.call(this);
};

cXULElement.getBoxOpen	= function(oElement) {
	var aHtml	= ['<table cellpadding="0" cellspacing="0" border="0"'],
		sAlign	= oElement.attributes["align"],
		sHeight	= oElement.attributes["height"],
		sWidth	= oElement.attributes["width"];
	if (oElement.attributes["orient"] == "vertical") {
				if (!sAlign || sAlign == "stretch")
			aHtml[aHtml.length]	= ' width="100%"';

				if (!(oElement instanceof cXULElement_window || oElement instanceof cXULElement_dialog || oElement instanceof cXULElement_wizardpage))
		if (!sAlign && sHeight)
			aHtml[aHtml.length]	= ' height="' + sHeight + '"';
	}
	else {
				if (!sAlign || sAlign == "stretch")
			aHtml[aHtml.length]	= ' height="100%"';

				if (!(oElement instanceof cXULElement_window || oElement instanceof cXULElement_dialog || oElement instanceof cXULElement_wizardpage))
		if (!sAlign && sWidth)
			aHtml[aHtml.length]	= ' width="' + sWidth + '"';
	}

	if (oElement instanceof cXULElement_rows)
		aHtml[aHtml.length]	= ' class="xul-' + oElement.localName + '" id="' + (oElement.attributes.id || oElement.uniqueID) + '"';
	else
		aHtml[aHtml.length]	= ' class="xul-box---box-container"';
	aHtml[aHtml.length]	= '><tbody';

	if (oElement.attributes["orient"] != "vertical")
		aHtml[aHtml.length]	= '><tr';

	aHtml[aHtml.length]	= ' class="xul-' + oElement.localName + '--gateway">';

	return aHtml.join('');
};

cXULElement.getBoxOpenChild	= function(oElement) {
	var aHtml	= [],
		oContainer	= oElement.parentNode,
		sAlign	= oElement.attributes["align"],
		sPack	= oElement.attributes["pack"],
		sHeight	= oElement.attributes["height"],
		sWidth	= oElement.attributes["width"];
	if (oContainer.attributes["orient"] == "vertical") {
		aHtml.push('<tr style="');
		if (oElement.nodeType == ample.classes.Node.ELEMENT_NODE) {
			if (oElement.attributes["hidden"] == "true")
				aHtml[aHtml.length]	= 'display:none;';
			if (oElement.viewType == cXULElement.VIEW_TYPE_VIRTUAL)
				aHtml[aHtml.length]	= 'position:absolute;height:0;top:0;left:0;z-index:1;';
		}
		aHtml[aHtml.length]	= '">';
	}
	aHtml[aHtml.length]	= '<td';

	if (oElement.nodeType == ample.classes.Node.ELEMENT_NODE) {
		if (oContainer.attributes["orient"] == "vertical") {
			if (sHeight)
				aHtml[aHtml.length]	= ' height="' + sHeight + '"';
		}
		else {
			aHtml[aHtml.length]	= ' style="';
			if (oElement.attributes["hidden"] == "true")
				aHtml[aHtml.length]	= 'display:none;';
			if (oElement.viewType == cXULElement.VIEW_TYPE_VIRTUAL)
				aHtml[aHtml.length]	= 'position:absolute;width:0;top:0;left:0;z-index:1;';
			else
			if (!(oContainer instanceof cXULElement_row))
				aHtml[aHtml.length]	= 'height:' + (sHeight || '100%');
			aHtml[aHtml.length]	= '"';
			if (sWidth)
				aHtml[aHtml.length]	= ' width="' + sWidth + '"';
		}

				var sHtml1	= "left";
		var sHtml2	= "top";
		if (oElement.attributes["orient"] == "vertical") {
			if (sPack)
				sHtml2	= sPack	== "start" ? "top"	: sPack	== "end" ? "bottom" : "center";
			if (sAlign)
				sHtml1	= sAlign == "start" ? "left" : sAlign == "end" ? "right"	: "center";
		}
		else {
			if (sAlign)
				sHtml2	= sAlign == "start" ? "top"	: sAlign == "end" ? "bottom" : "center";
			if (sPack)
				sHtml1	= sPack	== "start" ? "left" : sPack	== "end" ? "right"	: "center";
		}
		aHtml[aHtml.length]	= ' valign="' + sHtml2 + '" align="' + sHtml1 + '"';
	}

	aHtml[aHtml.length]	= ' class="xul-box---box-child';
		if (oContainer.attributes["debug"] == "true")
		aHtml[aHtml.length]	= ' xul-box-debug-true xul-' + (oContainer.attributes["orient"] != "vertical" ? "h" : "v") + 'box-debug-true';
	aHtml[aHtml.length]	= '">';

	return aHtml.join('');
};

cXULElement.getBoxCloseChild	= function(oElement) {
	var oContainer	= oElement.parentNode;
	return '</td>' +(oContainer.attributes["orient"] == "vertical" ? '</tr>' : '');
};

cXULElement.getBoxClose		= function(oElement) {
	return (oElement.attributes["orient"] != "vertical" ? '</tr>' : '')+ '</tbody></table>';
};

ample.extend(cXULElement);


var cXULInputElement	= function() {
	cXULElement.apply(this, arguments);
};
cXULInputElement.prototype	= new cXULElement;
cXULInputElement.prototype.localName	= "#element-input";
cXULInputElement.prototype.tabIndex	= 0;

cXULInputElement.getSelectionRange	= function(oInstance) {
	var oInput	= oInstance.$getContainer("input");
	if (oInput.setSelectionRange)
		return [oInput.selectionStart, oInput.selectionEnd];
	else
	if (oInput.createTextRange) {
		var oDocumentRange	= document.selection.createRange(),
			oRange	= oInput.createTextRange().duplicate();
		try {
		oRange.setEndPoint("EndToEnd", oDocumentRange);
		} catch (e) {}
		return [oRange.text.length - oDocumentRange.text.length, oRange.text.length];
	}
	else
		return [0, 0];
};

cXULInputElement.setSelectionRange	= function(oInstance, nStart, nEnd) {
	var oInput	= oInstance.$getContainer("input");
	if (oInput.setSelectionRange)
		oInput.setSelectionRange(nStart, nEnd);
	else
	if (oInput.createTextRange) {
		var oRange	= oInput.createTextRange();
		if (nStart != nEnd) {
			oRange.moveEnd("character", nEnd - oRange.text.length);
			oRange.moveStart("character", nStart);
		}
		else
			oRange.move("character", nStart);
		oRange.select();
	}
};

cXULInputElement.dispatchChange	= function(oInstance) {
		var oEvent	= oInstance.ownerDocument.createEvent("UIEvent");
	oEvent.initEvent("change", true, false, window, null);
	oInstance.dispatchEvent(oEvent);
};

ample.extend(cXULInputElement);


var cXULPopupElement	= function() {
	cXULElement.apply(this, arguments);
};
cXULPopupElement.prototype	= new cXULElement;
cXULPopupElement.prototype.localName	= "#element-popup";

cXULPopupElement.POPUP_TYPE_POPUP	= 0;
cXULPopupElement.POPUP_TYPE_TOOLTIP	= 1;
cXULPopupElement.POPUP_TYPE_MODAL	= 2;
cXULPopupElement.POPUP_TYPE_BUBBLE	= 3;

cXULPopupElement.prototype.popupType	= cXULPopupElement.POPUP_TYPE_POPUP;

cXULPopupElement.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "top") {
		if (!isNaN(sValue) && !isNaN(this.attributes["left"]))
			this.moveTo(this.attributes["left"] * 1, sValue * 1);
	}
	else
	if (sName == "left") {
		if (!isNaN(sValue) && !isNaN(this.attributes["top"]))
			this.moveTo(sValue * 1, this.attributes["top"] * 1);
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULPopupElement.prototype.showPopup	= function(oElement, nLeft, nTop, nType, oAnchor, sAlign) {
		if (cXULPopupElement.fireEventOnPopup(this, "showing") == false)
		return;

	this.popupType	= nType;

		this.$getContainer().style.display	= "block";
	this.setAttribute("hidden", "false");
	if (this.popupType == cXULPopupElement.POPUP_TYPE_MODAL)
		this.setCapture(true);

	if ((!isNaN(nLeft) && nLeft !=-1) || (!isNaN(nTop) && nTop != -1)) {
		var oPosition	= this.getBoundingClientRect(),
			oPosition1	= this.ownerDocument.documentElement.getBoundingClientRect(),
			oPosition2	= {"top":0, "left":0, "bottom":0, "right":0};
				for (var oNode = this; oNode; oNode = oNode.parentNode)
			if (oNode instanceof cXULWindowElement) {
				oPosition2	= oNode.getBoundingClientRect();
				break;
			}
		if (oPosition.bottom - oPosition.top + nTop > oPosition1.bottom - oPosition1.top)
			nTop	-= oPosition.bottom - oPosition.top;
		if (oPosition.right - oPosition.left + nLeft > oPosition1.right - oPosition1.left)
			nLeft	-= oPosition.right - oPosition.left;
		this.moveTo(nLeft - oPosition2.left, nTop - oPosition2.top);
	}
	else
	if (oElement) {
		var oPosition	= oElement.getBoundingClientRect();
		switch (this.getAttribute("position")) {
			case "after_start":
								this.moveTo(oPosition.left, oPosition.bottom);
				break;

			case"after_end":
								break;

			case"before_start":
								break;

			case"before_end":
								break;

			case"end_after":
								break;

			case"end_before":
								break;

			case"start_after":
								break;

			case"start_before":
								break;

			case"overlap":
								break;
		}
	}

	var bIE	= navigator.userAgent.match(/MSIE ([\d\.]+)/),
		nVersion	= bIE ? RegExp.$1 : 0;
		if (bIE && nVersion < 8) {
		var oPosition2	= this.getBoundingClientRect();
		this.$getContainer("shadow-right").style.height	= (oPosition2.bottom - oPosition2.top - 3)+ "px";
		this.$getContainer("shadow-bottom").style.width	= (oPosition2.right - oPosition2.left - 3)+ "px";
	}
		if (!(bIE && nVersion < 9)) {
				ample.query(this).css("opacity", "0").animate({"opacity":"1"}, "fast");
	}

		cXULPopupElement.fireEventOnPopup(this, "shown");
};

cXULPopupElement.prototype.hidePopup	= function() {
		if (cXULPopupElement.fireEventOnPopup(this, "hiding") == false)
		return;

	this.setAttribute("hidden", "true");

		this.$getContainer().style.display	= "none";

	if (this.popupType == cXULPopupElement.POPUP_TYPE_MODAL)
		this.releaseCapture();

		cXULPopupElement.fireEventOnPopup(this, "hidden");
};

cXULPopupElement.prototype.moveTo	= function(nLeft, nTop) {
	var oElementDOM	= this.$getContainer();
	oElementDOM.style.left	= nLeft		+ "px";
	oElementDOM.style.top	= nTop		+ "px";
};

cXULPopupElement.prototype.sizeTo	= function(nWidth, nHeight) {
	var oElementDOM	= this.$getContainer();
	oElementDOM.style.width	= nWidth	+ "px";
	oElementDOM.style.height= nHeight	+ "px";
};

cXULPopupElement.fireEventOnPopup	= function(oInstance, sName) {
	var oEvent	= oInstance.ownerDocument.createEvent("Event");
	oEvent.initEvent("popup" + sName, true, true);

	return oInstance.dispatchEvent(oEvent);
};

ample.extend(cXULPopupElement);


var cXULSelectElement	= function() {
	cXULElement.apply(this, arguments);
};
cXULSelectElement.prototype	= new cXULElement;
cXULSelectElement.prototype.localName	= "#element-select";

cXULSelectElement.prototype.currentItem		= null; cXULSelectElement.prototype.selectedItems	= null;
cXULSelectElement.prototype.tabIndex		= 0;
cXULSelectElement.prototype.$selectable		= false;

cXULSelectElement.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "seltype") {
			}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULSelectElement.prototype.selectAll	= function() {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

		if (this.getAttribute("type") == "radio" || this.getAttribute("seltype") == "single")
		return;

	this.selectedItems	= new ample.classes.NodeList;
	for (var nIndex = 0; nIndex < this.items.length; nIndex++) {
		this.items[nIndex].setAttribute("selected", "true");
		this.selectedItems.$add(this.items[nIndex]);
	}

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.clearSelection	= function() {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

	for (var nIndex = 0; nIndex < this.selectedItems.length; nIndex++)
		this.selectedItems[nIndex].setAttribute("selected", "false");
	this.selectedItems	= new ample.classes.NodeList;

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.selectItem	= function(oElement) {
	if (this.selectedItems.length == 1 && this.selectedItems[0] == oElement)
		return;

		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

	for (var nIndex = 0; nIndex < this.selectedItems.length; nIndex++)
		this.selectedItems[nIndex].setAttribute("selected", "false");
	this.selectedItems	= new ample.classes.NodeList;

	oElement.setAttribute("selected", "true");

	this.selectedItems.$add(oElement);

	this.currentItem	= oElement;

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.toggleItemSelection	= function(oElement) {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

		if (this.getAttribute("type") == "radio" || this.getAttribute("seltype") == "single")
		if (this.selectedItems.length && this.selectedItems[0] != oElement)
			return;

	var aElements	= new ample.classes.NodeList;
	for (var nIndex = 0; nIndex < this.selectedItems.length; nIndex++) {
		if (this.selectedItems[nIndex] == oElement) {
			oElement.setAttribute("selected", "false");
		}
		else
		{
			aElements.$add(this.selectedItems[nIndex]);
		}
	}
	if (aElements.length == this.selectedItems.length) {
		oElement.setAttribute("selected", "true");
		aElements.$add(oElement);

		this.currentItem	= oElement;
	}
	this.selectedItems	= aElements;

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.addItemToSelection	= function(oElement) {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

		if (this.getAttribute("type") == "radio" || this.getAttribute("seltype") == "single")
		if (this.selectedItems.length)
			return;

	oElement.setAttribute("selected", "true");
	this.selectedItems.$add(oElement);

		cXULSelectElement.fireEventOnSelect(this);
};


cXULSelectElement.prototype.removeItemFromSelection	= function(oElement) {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

	var aElements	= new ample.classes.NodeList;
	for (var nIndex = 0; nIndex < this.selectedItems.length; nIndex++) {
		if (this.selectedItems[nIndex] == oElement) {
			oElement.setAttribute("selected", "false");
		}
		else
		{
			aElements.$add(this.selectedItems[nIndex]);
		}
	}
	this.selectedItems	= aElements;

	if (this.currentItem == oElement)
		this.currentItem	= null;

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.selectItemRange	= function(oElement1, oElement2) {
		if (!cXULSelectElement.fireEventOnBeforeSelect(this))
		return;

		if (this.getAttribute("type") == "radio" || this.getAttribute("seltype") == "single")
		return;

	for (var nIndex = 0; nIndex < this.selectedItems.length; nIndex++)
		this.selectedItems[nIndex].setAttribute("selected", "false");
	this.selectedItems	= new ample.classes.NodeList;

	var nIndex1	= this.items.$indexOf(oElement1);
	var nIndex2	= this.items.$indexOf(oElement2);

	var nIndexMin	= nIndex1;
	var nIndexMax	= nIndex2;

	if (nIndexMin > nIndexMax) {
		nIndexMin	= nIndex2;
		nIndexMax	= nIndex1;
	}

	nIndexMax++;

	for (var nIndex = nIndexMin; nIndex < nIndexMax; nIndex++) {
		this.items[nIndex].setAttribute("selected", "true");
		this.selectedItems.$add(this.items[nIndex]);
	}

		cXULSelectElement.fireEventOnSelect(this);
};

cXULSelectElement.prototype.scrollToIndex	= function(nIndex) {
	if (this.items[nIndex]) {
		var oElementDOM	= this.items[nIndex].$getContainer();
		var oElement	= oElementDOM.parentNode.parentNode.parentNode;
		if (oElement.scrollTop > oElementDOM.offsetTop)
			oElementDOM.scrollIntoView(true);
		else
		if (oElement.offsetHeight + oElement.scrollTop < oElementDOM.offsetTop + oElementDOM.offsetHeight + 3)
			oElementDOM.scrollIntoView(false);
	}
};

cXULSelectElement.fireEventOnSelect	= function(oInstance) {
	if (oInstance.head) {
		if (oInstance.attributes["type"] == "checkbox")
			oInstance.head.$getContainer("command").checked	= oInstance.selectedItems.length == oInstance.items.length ? true : false;
		else
		if (oInstance.attributes["type"] == "radio")
			oInstance.head.$getContainer("command").checked	= oInstance.selectedItems.length != 0;
	}

	var oEvent	= oInstance.ownerDocument.createEvent("Event");
	oEvent.initEvent("select", true, true);
	oInstance.dispatchEvent(oEvent);

	oInstance.doCommand();
};

cXULSelectElement.fireEventOnBeforeSelect	= function(oInstance) {
	var oEvent	= oInstance.ownerDocument.createEvent("Event");
	oEvent.initEvent("beforeselect", false, true);
	return oInstance.dispatchEvent(oEvent);
};

cXULSelectElement.popup	= null;

cXULSelectElement.getSettingsPopup	= function(oInstance) {
	var oPopup	= cXULSelectElement.popup;
		if (!oPopup) {
		oPopup	= oInstance.ownerDocument.documentElement.appendChild(oInstance.ownerDocument.createElementNS(oInstance.namespaceURI, "xul:menupopup"));
				oPopup.addEventListener("DOMActivate", function(oEvent) {
			oPopup.opener.items[oEvent.target.parentNode.childNodes.$indexOf(oEvent.target)].setAttribute("hidden", oEvent.target.getAttribute("checked") == "true" ? "false" : "true");
		}, false);
		cXULSelectElement.popup	= oPopup;
	}
		if (oPopup.parentNode != oInstance) {
		oInstance.appendChild(oPopup);
				oInstance.$getContainer("container").appendChild(oPopup.$getContainer());
				oPopup.opener	= oInstance;

				while (oPopup.firstChild)
			oPopup.removeChild(oPopup.firstChild);

				for (var nIndex = 0, oItem; nIndex < oInstance.items.length; nIndex++) {
			oItem	= oInstance.ownerDocument.createElementNS(oInstance.namespaceURI, "xul:menuitem");
			oItem.setAttribute("type", "checkbox");
			oItem.setAttribute("label", oInstance.items[nIndex].getAttribute("label"));
			if (oInstance.items[nIndex].getAttribute("hidden") != "true")
				oItem.setAttribute("checked", "true");
			oPopup.appendChild(oItem);
		}
	}

	return cXULSelectElement.popup;
};

cXULSelectElement.resizing	= false;
cXULSelectElement.clientX	= 0;
cXULSelectElement.minWidth	= 0;
cXULSelectElement.maxWidth	= 0;

cXULSelectElement.onResizeStart	= function(oEvent) {
	if (oEvent.button == 0 && oEvent.$pseudoTarget == oEvent.currentTarget.$getContainer("resizer")) {
				var oHeader	= oEvent.currentTarget,
			oView	= oHeader.parentNode.parentNode,
			oHeaderRect	= oHeader.getBoundingClientRect(),
			oViewRect	= oView.getBoundingClientRect(),
			oResizer	= oView.$getContainer("resizer");

				oResizer.style.display	= "";
				oResizer.style.left	= (oHeaderRect.right - oViewRect.left) + "px";
				cXULSelectElement.resizing	= true;
		cXULSelectElement.clientX	= oEvent.clientX;
		cXULSelectElement.minWidth	= oHeader.getAttribute("minwidth") * 1 || 0;
		cXULSelectElement.maxWidth	= oHeader.getAttribute("maxwidth") * 1 || Infinity;
	}
};

cXULSelectElement.onResize		= function(oEvent) {
	if (cXULSelectElement.resizing) {
		var oHeader	= oEvent.currentTarget,
			oView	= oHeader.parentNode.parentNode,
			oHeaderRect	= oHeader.getBoundingClientRect(),
			oViewRect	= oView.getBoundingClientRect(),
			oResizer	= oView.$getContainer("resizer"),
			nWidth	=(oHeaderRect.right - oHeaderRect.left)-(cXULSelectElement.clientX - oEvent.clientX);

				nWidth	= Math.min(cXULSelectElement.maxWidth, Math.max(nWidth, cXULSelectElement.minWidth));

				oResizer.style.left	= (oHeaderRect.left - oViewRect.left + nWidth) + "px";
	}
};

cXULSelectElement.onResizeEnd	= function(oEvent) {
	if (cXULSelectElement.resizing) {
		cXULSelectElement.resizing	= false;
				var oHeader	= oEvent.currentTarget,
			oView	= oHeader.parentNode.parentNode,
			oHeaderRect	= oHeader.getBoundingClientRect(),
			oViewRect	= oView.getBoundingClientRect(),
			oResizer	= oView.$getContainer("resizer"),
			nWidth	=(oHeaderRect.right - oHeaderRect.left)-(cXULSelectElement.clientX - oEvent.clientX);
				oResizer.style.display	= "none";

				nWidth	= Math.floor(Math.min(cXULSelectElement.maxWidth, Math.max(nWidth, cXULSelectElement.minWidth)));

				oHeader.setAttribute("width", nWidth);
	}
};

ample.extend(cXULSelectElement);


var cXULWindowElement	= function() {
	cXULElement.apply(this, arguments);
};
cXULWindowElement.prototype	= new cXULElement;
cXULWindowElement.prototype.localName	= "#element-window";

cXULWindowElement.prototype.$draggable	= true;
cXULWindowElement.prototype.$resizable	= true;

cXULWindowElement.modalWindow	= null;

cXULWindowElement.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "title")
		this.$getContainer("title").innerHTML	= sValue || '';
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULWindowElement.prototype.show	= function (nLeft, nTop) {
	var that	= this,
		oContainer	= that.$getContainer(),
		oHead	= that.$getContainer("head"),
		oBody	= that.$getContainer("body"),
		bHeader	= that instanceof cXULElement_wizard ||(that instanceof cXULElement_dialog && cXULElement_dialog.firstChild instanceof cXULElement_dialogheader),
		oHeader	= that.$getContainer("header"),
		oFooter	= that.$getContainer("footer"),
		oComputedStyle	= oContainer.currentStyle || window.getComputedStyle(oContainer, null);

		that.addEventListener("keydown", cXULWindowElement.onkeydown, true);

		var nWidth	= this.getAttribute("width") * 1 || parseInt(oComputedStyle.width),
		nHeight	= this.getAttribute("height") * 1 || parseInt(oComputedStyle.height);
	if (isNaN(nTop) || isNaN(nLeft)) {
		if (this.hasAttribute("screenX") && this.hasAttribute("screenY")) {
			nTop	= this.getAttribute("screenY") * 1;
			nLeft	= this.getAttribute("screenX") * 1;
		}
		else {
			nLeft	=((document.documentElement.clientWidth || document.body.clientWidth) - nWidth) / 2;
			nTop	=((document.documentElement.clientHeight || document.body.clientHeight) - nHeight) / 2;
		}

		nLeft	+= document.documentElement.scrollLeft;
		nTop	+= document.documentElement.scrollTop;
	}

	ample.query(that).css("opacity", "0");
	oContainer.style.width	= 1 + "px";
	oContainer.style.height	= 1 + "px";
	oContainer.style.top	=(nTop + nHeight / 2) + "px";
	oContainer.style.left	=(nLeft + nWidth / 2) + "px";
		oContainer.style.minWidth	= 1 + "px";
	oContainer.style.minHeight	= 1 + "px";

		if (this.getAttribute("hidechrome") != "true")
		oHead.style.display	= "none";
	if (bHeader)
		oHeader.style.display	= "none";
	if (oFooter)
		oFooter.style.display	= "none";
	oBody.style.display	= "none";
		that.setAttribute("hidden", "false");
		ample.query(that).animate(
		{	"opacity":"1",
			"width": nWidth + "px",
			"height": nHeight + "px",
			"top": nTop + "px",
			"left": nLeft + "px"},
		"fast",
		"ease-in",
		function() {
						if (that.getAttribute("hidechrome") != "true")
				oHead.style.display	= "";
			if (bHeader)
				oHeader.style.display	= "";
			if (oFooter)
				oFooter.style.display	= "";
			oBody.style.display	= "";
						ample.query(that).css("opacity", null);
						if (!that.getAttribute("width"))
				oContainer.style.width	= '';
			if (!that.getAttribute("height"))
				oContainer.style.height	= '';
						oContainer.style.minWidth	= "";
			oContainer.style.minHeight	= "";
						oXULReflowManager.schedule(that);

						var sButtonFocus	= that.getAttribute("defaultButton");
			if (sButtonFocus != "")
				if (that.getAttribute("buttons").split(/\s*,\s*/).indexOf(sButtonFocus) != -1)
					that.buttons[sButtonFocus].focus();
						var oEvent	= that.ownerDocument.createEvent("CustomEvent");
			oEvent.initCustomEvent("windowshown", true, false, null);
			that.dispatchEvent(oEvent);
		}
	);
};

cXULWindowElement.prototype.showModal	= function (nTop, nLeft) {
		cXULWindowElement.modalWindow	= this;
	this.addEventListener("modal", cXULWindowElement.oncapture, true);
	ample.modal(this);
		this.show(nTop, nLeft);
};

cXULWindowElement.prototype.hide	= function() {
	var that	= this,
		oContainer	= that.$getContainer(),
		oHead	= that.$getContainer("head"),
		oBody	= that.$getContainer("body"),
		bHeader	= that instanceof cXULElement_wizard ||(that instanceof cXULElement_dialog && cXULElement_dialog.firstChild instanceof cXULElement_dialogheader),
		oHeader	= that.$getContainer("header"),
		oFooter	= that.$getContainer("footer"),
		oRect	= that.getBoundingClientRect();

		if (cXULWindowElement.modalWindow == this) {
		cXULWindowElement.modalWindow	= null;
		this.removeEventListener("modal", cXULWindowElement.oncapture, true);
		ample.modal(null);
	}
		that.removeEventListener("keydown", cXULWindowElement.onkeydown, true);

	var nWidth	= oRect.right - oRect.left,
		nHeight	= oRect.bottom - oRect.top,
		nLeft	= document.documentElement.scrollLeft + oRect.left,
		nTop	= document.documentElement.scrollTop + oRect.top;

		if (this.getAttribute("hidechrome") != "true")
		oHead.style.display	= "none";
	if (bHeader)
		oHeader.style.display	= "none";
	if (oFooter)
		oFooter.style.display	= "none";
	oBody.style.display	= "none";
		oContainer.style.minWidth	= 1 + "px";
	oContainer.style.minHeight	= 1 + "px";
		ample.query(that).animate(
		{	"opacity":"0",
			"width": 1 + "px",
			"height": 1 + "px",
			"top": (nTop + nHeight / 2) + "px",
			"left": (nLeft + nWidth / 2) + "px"},
		"fast",
		"ease-out",
		function() {
						that.setAttribute("hidden", "true");

						if (that.getAttribute("hidechrome") != "true")
				oHead.style.display	= "";
			if (bHeader)
				oHeader.style.display	= "";
			if (oFooter)
				oFooter.style.display	= "";
			oBody.style.display	= "";
						oContainer.style.minWidth	= "";
			oContainer.style.minHeight	= "";
						var oEvent	= that.ownerDocument.createEvent("CustomEvent");
			oEvent.initCustomEvent("windowhidden", true, false, null);
			that.dispatchEvent(oEvent);
		}
	);
};

cXULWindowElement.snooze	= function(oElement) {
	var aQuery	= ample.query(oElement);
	aQuery.animate({"border-color": "#fff"}, 500, function(n) {return Math.sin(Math.PI*6*n)}, function() {
		aQuery.css("border-color", "");
	});
};

cXULWindowElement.oncapture	= function(oEvent) {
	cXULWindowElement.snooze(oEvent.target);
};

cXULWindowElement.onkeydown	= function(oEvent) {
	if (oEvent.target == oEvent.currentTarget)
		if (oEvent.keyIdentifier == "U+001B")				oEvent.target.hide();
};

ample.extend(cXULWindowElement);


var cXULOverlayPI	= function(){};

cXULOverlayPI.prototype	= new ample.classes.ProcessingInstruction;

cXULOverlayPI.prototype.target	= "xul-overlay";

cXULOverlayPI.handlers	= {
	"DOMNodeInserted":	function() {
		var aHref	= this.data.match(/href=('([^']*)'|"([^"]*)")/);
		if (aHref)
			this.ownerDocument.loadOverlay(aHref[2] || aHref[3]);
	}
};

ample.extend(cXULOverlayPI);


cXULElement.prototype.doBroadcast		= function() {
	var oBroadcaster	= this,
		sObserves	= this.attributes.observes;
		if (!(this instanceof cXULElement_broadcaster) && sObserves) {
		oBroadcaster	= this.ownerDocument.getElementById(sObserves);
		if (!(oBroadcaster instanceof cXULElement_broadcaster))
			oBroadcaster	= null;
	}

		if (oBroadcaster) {
		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
		oEvent.initCustomEvent("broadcast", false, false, null);
		oBroadcaster.dispatchEvent(oEvent);
	}
};

var oXULBroadcastDispatcher	= (function () {
		ample.bind("DOMNodeInsertedIntoDocument", function(oEvent) {
		if (oEvent.target instanceof cXULElement) {
			var oElement, sName, sValue, sAttribute;
			if (oEvent.target.localName == "observes") {
				if ((sValue = oEvent.target.attributes["element"]) && (oElement = this.getElementById(sValue)) && oElement instanceof cXULElement_broadcaster) {
					sAttribute	= oEvent.target.attributes["attribute"];
					for (sName in oElement.attributes)
						if (oElement.attributes.hasOwnProperty(sName))
							if ((sName != "id" && sName != "persist") && (!sAttribute || sAttribute == "*" || sAttribute == sName))
								oEvent.target.parentNode.setAttribute(sName, oElement.attributes[sName]);
				}
			}
			else {
				if ((sValue = oEvent.target.attributes["observes"]) && (oElement = this.getElementById(sValue)) && oElement instanceof cXULElement_broadcaster)
					for (sName in oElement.attributes)
						if (oElement.attributes.hasOwnProperty(sName))
							if (sName != "id" && sName != "persist")
								oEvent.target.setAttribute(sName, oElement.attributes[sName]);
			}
		}
	}, true);

		return {
		getControllerForBroadcast:	function(sBroadcast) {

		},
		updateBroadcasts:				function(sBroadcast) {

		}
	}
})();

ample.broadcastDispatcher	= oXULBroadcastDispatcher;


cXULElement.prototype.doCommand		= function() {
	var oCommand	= this,
		sCommand	= this.attributes.command;
		if (!(this instanceof cXULElement_command) && sCommand) {
		oCommand	= this.ownerDocument.getElementById(sCommand);
		if (!(oCommand instanceof cXULElement_command))
			oCommand	= null;
	}

		if (oCommand) {
		var oEvent	= this.ownerDocument.createEvent("CustomEvent");
		oEvent.initCustomEvent("command", true, true, null);
		oCommand.dispatchEvent(oEvent);
	}
};

var oXULCommandDispatcher	= (function () {
		ample.bind("DOMNodeInsertedIntoDocument", function(oEvent) {
		if (oEvent.target instanceof cXULElement) {
			var oElement, sName, sValue;
			if ((sValue = oEvent.target.attributes["command"]) && (oElement = this.getElementById(sValue)) && oElement instanceof cXULElement_command)
				for (sName in oElement.attributes)
					if (oElement.attributes.hasOwnProperty(sName))
						if (sName != "id" && sName != "persist")
							oEvent.target.setAttribute(sName, oElement.attributes[sName]);
		}
	}, true);

		return {
		getControllerForCommand:	function(sCommand) {

		},
		updateCommands:				function(sCommand) {

		}
	}
})();

ample.commandDispatcher	= oXULCommandDispatcher;


var oXULPopupManager	= (function () {

		var oTooltipPane	= null;

		ample.bind("mouseenter",	function(oEvent) {
		for (var oElement = oEvent.target, oTooltip; oElement.nodeType != ample.classes.Node.DOCUMENT_NODE; oElement = oElement.parentNode) {
			if (oElement.$isAccessible()) {
				if (oElement.attributes["tooltiptext"]) {
					oTooltip	= oTooltipPane;
					if (!oTooltip)	{
												oTooltip	= this.documentElement.appendChild(this.createElementNS(oElement.namespaceURI, "xul:tooltip-pane"));
						oTooltipPane	= oTooltip;
					}
					oTooltip.setText(oElement.attributes["tooltiptext"]);
					oTooltip.showPopup(null, oEvent.clientX + document.documentElement.scrollLeft, oEvent.clientY + 18 + document.documentElement.scrollTop, cXULPopupElement.POPUP_TYPE_TOOLTIP);
					ample.tooltipNode	= oTooltip;
				}
				else
				if (oElement.attributes["tooltip"]) {
					oTooltip	= this.getElementById(oElement.attributes["tooltip"]);
					if (oTooltip) {
						oTooltip.showPopup(null, oEvent.clientX + document.documentElement.scrollLeft, oEvent.clientY + 18 + document.documentElement.scrollTop, cXULPopupElement.POPUP_TYPE_TOOLTIP);
						ample.tooltipNode	= oTooltip;
					}
				}
			}
		}
	}, true);

	ample.bind("mouseleave",	function(oEvent) {
		if (ample.tooltipNode)	{
			ample.tooltipNode.hidePopup();
			ample.tooltipNode	= null;
		}
	}, true);

	ample.bind("contextmenu", function(oEvent) {
		for (var oElement = oEvent.target, oPopup; oElement.nodeType != ample.classes.Node.DOCUMENT_NODE; oElement = oElement.parentNode) {
			if (oElement.$isAccessible()) {
				if (oElement.attributes["context"]) {
					if (oPopup = this.getElementById(oElement.attributes["context"])) {
						oPopup.showPopup(oElement, oEvent.clientX + document.documentElement.scrollLeft, oEvent.clientY + document.documentElement.scrollTop, cXULPopupElement.POPUP_TYPE_POPUP);
						this.popupNode	= oPopup;
					}
					oEvent.preventDefault();
					break;
				}
			}
		}
	}, true);

	ample.bind("click", function(oEvent) {
		for (var oElement = oEvent.target, oPopup; oElement.nodeType != ample.classes.Node.DOCUMENT_NODE; oElement = oElement.parentNode) {
			if (oElement.$isAccessible()) {
				if (oElement.attributes["popup"]) {
					if (oPopup = this.getElementById(oElement.attributes["popup"])) {
						oPopup.showPopup(oElement, oEvent.clientX + document.documentElement.scrollLeft, oEvent.clientY + document.documentElement.scrollTop, cXULPopupElement.POPUP_TYPE_POPUP);
						this.popupNode	= oPopup;
					}
					oEvent.preventDefault();
					break;
				}
			}
		}
	}, true);

	ample.bind("mousedown",	function(oEvent) {
				if (this.popupNode && !(oEvent.target == this.popupNode ||(oEvent.target.compareDocumentPosition(this.popupNode) & ample.classes.Node.DOCUMENT_POSITION_CONTAINS))) {
			this.popupNode.hidePopup();
			this.popupNode	= null;

						oEvent.stopPropagation();
		}
				if (ample.tooltipNode) {
			ample.tooltipNode.hidePopup();
			ample.tooltipNode= null;
		}
	}, true);

		return {

	};
})();


var oXULReflowManager	= (function () {
		var nTimeout	= null,
		aReflowStack	= [];

		function fOnTimeout() {
		nTimeout	= null;
		while (aReflowStack.length)
			aReflowStack.shift().reflow();
	};

	function fSchedule(oElement) {
				for (var oNode = oElement, nIndex, nLength = aReflowStack.length; oNode; oNode = oNode.parentNode)
			for (nIndex = 0, nLength; nIndex < nLength; nIndex++)
				if (aReflowStack[nIndex] == oNode)
					return;
				aReflowStack.push(oElement);
		if (!nTimeout)
			nTimeout	= setTimeout(fOnTimeout, 0);
	};

			ample.bind("DOMNodeInsertedIntoDocument", function(oEvent) {
		if (oEvent.target.parentNode instanceof cXULElement && oEvent.target.parentNode.viewType == cXULElement.VIEW_TYPE_BOXED)
			fSchedule(oEvent.target.parentNode);
	}, true);

		ample.bind("resize", function(oEvent) {
		if (!(oEvent instanceof ample.classes.ResizeEvent)) {
			var oElement	= this.querySelector("xul|page", function(){return cXULElement.prototype.namespaceURI});
			if (oElement)
				fSchedule(oElement);
		}
	});

		ample.bind("resizeend", function(oEvent) {
		var oElement	= oEvent.target;
		if (oElement instanceof cXULWindowElement) {
			oElement.setAttribute("width", parseInt(oElement.$getContainer().style.width));
			oElement.setAttribute("height", parseInt(oElement.$getContainer().style.height));
						fSchedule(oElement);
		}
	});

		return {
		"schedule":	function(oElement) {
			fSchedule(oElement);
		}
	};
})();


var oXULWindowManager	= (function () {

		var nWindowIndex	= 1;

		ample.bind("mousedown",	function(oEvent) {
				for (var oElement = oEvent.target, oStyle; oElement; oElement = oElement.parentNode)
			if (oElement instanceof cXULWindowElement)
				if ((oStyle = oElement.$getContainer().style) && (oStyle.zIndex < nWindowIndex))
					oStyle.zIndex	= ++nWindowIndex;
	}, true);

		return {

	};
})();


ample.locale.addCultureInfo("en", {
	messages: {
						"xul.dialog.button.accept":		"OK",
			"xul.dialog.button.cancel":		"Cancel",
			"xul.dialog.button.close":		"Close",
			"xul.dialog.button.help":		"Help",
			"xul.dialog.button.finish":		"Finish",
			"xul.dialog.button.next":		"Next",
			"xul.dialog.button.previous":	"Previous",

						"xul.editor.button.undo":				"Undo typing",
			"xul.editor.button.redo":				"Redo typing",
			"xul.editor.button.justifyleft":		"Align text to the left",
			"xul.editor.button.justifycenter":		"Center text",
			"xul.editor.button.justifyright":		"Align text to the right",
			"xul.editor.button.justifyfull":		"Default alignment",
			"xul.editor.button.outdent":			"Decrease the indent level of the paragraph",
			"xul.editor.button.indent":				"Increase the indent level of the paragraph",
			"xul.editor.button.insertunorderedlist":"Start a bulleted list",
			"xul.editor.button.insertorderedlist":	"Start a numbered list",
			"xul.editor.button.createlink":			"Create a hyperlink",
			"xul.editor.button.unlink":				"Remove hyperlink",
			"xul.editor.button.bold":				"Make the selected text bold",
			"xul.editor.button.italic":				"Italicize the selected text",
			"xul.editor.button.underline":			"Underline the selected text",
			"xul.editor.button.strikethrough":		"Strikethrough the selected text",
			"xul.editor.button.subscript":			"Subscript the selected text",
			"xul.editor.button.superscript":		"Superscript the selected text",
			"xul.editor.button.fontsize":			"Change the font size",
			"xul.editor.button.fontname":			"Change the font name",
			"xul.editor.button.formatblock":		"Format block",
			"xul.editor.button.forecolor":			"Change the text color",
			"xul.editor.button.backcolor":			"Change the text background color",

						"{":"}"
	}
});


var cXULElement_arrowscrollbox	= function() {};

cXULElement_arrowscrollbox.prototype	= new cXULElement("arrowscrollbox");
cXULElement_arrowscrollbox.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_arrowscrollbox.attributes	= {};
cXULElement_arrowscrollbox.attributes.width	= "200";
cXULElement_arrowscrollbox.attributes.height	= "200";

cXULElement_arrowscrollbox.prototype._interval	= null;

cXULElement_arrowscrollbox.prototype.scrollByIndex	= function(nLines) {
	throw new ample.classes.DOMException(DOMException.NOT_SUPPORTED_ERR);
};

cXULElement_arrowscrollbox.prototype._onInterval	= function(sName, nSign) {
	this.$getContainer("gateway")[sName == "vertical" ? "scrollTop" : "scrollLeft"]+= 3 * nSign;
};

cXULElement_arrowscrollbox.prototype._onButtonOver	= function(oEvent, sName, nSign) {
	var oSelf	= this;
	this._interval	= setInterval(function() {
		oSelf._onInterval(sName, nSign);
	}, 30);
};

cXULElement_arrowscrollbox.prototype._onButtonOut	= function(oEvent) {
	this._interval	= clearInterval(this._interval);
};

cXULElement_arrowscrollbox.prototype.$getTagOpen	= function() {
	var sHtml	= '<table cellpadding="0" cellspacing="0" border="0" class="xul-arrowscrollbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
	sHtml	+= '<tbody>';
	sHtml	+= '<tr>';
	if (this.attributes["orient"] == "vertical") {
		sHtml	+= '<td height="1" class="xul-arrowscrollbox-button xul-arrowscrollbox-button-normal xul-arrowscrollbox-button-up xul-arrowscrollbox-button-up-normal" onmouseover="this.className=this.className.replace(/normal/g, \'hover\'); ample.$instance(this)._onButtonOver(event, \'vertical\', -1);" onmouseout="this.className=this.className.replace(/hover/g, \'normal\'); ample.$instance(this)._onButtonOut(event);"><div><br /></div></td>';
		sHtml	+= '</tr><tr>';
	}
	else
		sHtml	+= '<td width="1" class="xul-arrowscrollbox-button xul-arrowscrollbox-button-normal xul-arrowscrollbox-button-left xul-arrowscrollbox-button-left-normal" onmouseover="this.className=this.className.replace(/normal/g, \'hover\'); ample.$instance(this)._onButtonOver(event, \'horizontal\', -1);" onmouseout="this.className=this.className.replace(/hover/g, \'normal\'); ample.$instance(this)._onButtonOut(event);"><div><br /></div></td>';
	sHtml	+= '<td>';
	sHtml	+= '<div class="xul-arrowscrollbox--gateway" style="position:relative; height:' +(this.attributes["height"] -(this.attributes["orient"] == "vertical" ? 18 : 0))+ '; width:' +(this.attributes["width"] -(this.attributes["orient"] != "vertical" ? 18 : 0))+ '; overflow:hidden;">';

	return sHtml;
};

cXULElement_arrowscrollbox.prototype.$getTagClose	= function() {
	var sHtml	= '</div>';
	sHtml  += '</td>';
	if (this.attributes["orient"] == "vertical") {
		sHtml  += '</tr><tr>';
		sHtml  += '<td height="1" class="xul-arrowscrollbox-button xul-arrowscrollbox-button-normal xul-arrowscrollbox-button-down xul-arrowscrollbox-button-down-normal" onmouseover="this.className=this.className.replace(/normal/g, \'hover\'); ample.$instance(this)._onButtonOver(event, \'vertical\', 1);" onmouseout="this.className=this.className.replace(/hover/g, \'normal\');ample.$instance(this)._onButtonOut(event);"><div><br /></div></td>';
	}
	else
		sHtml  += '<td width="1" class="xul-arrowscrollbox-button xul-arrowscrollbox-button-normal xul-arrowscrollbox-button-right xul-arrowscrollbox-button-right-normal" onmouseover="this.className=this.className.replace(/normal/g, \'hover\'); ample.$instance(this)._onButtonOver(event, \'horizontal\', 1);" onmouseout="this.className=this.className.replace(/hover/g, \'normal\');ample.$instance(this)._onButtonOut(event);"><div><br /></div></td>';
	sHtml  += '</tr>';
	sHtml  += '</tbody>';
	sHtml  += '</table>';

	return sHtml;
};

ample.extend(cXULElement_arrowscrollbox);


var cXULElement_box	= function(){};

cXULElement_box.prototype	= new cXULElement("box");
cXULElement_box.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_box.prototype.$getTagOpen	= function() {
	var sWidth	= this.attributes.width,
		sHeight	= this.attributes.height;
	return '<div class="xul-' + this.localName +(this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
		(sWidth ? 'width:' + (isNaN(parseInt(sWidth)) ? sWidth : sWidth + 'px;') : '')+
		(sHeight ? 'height:' + (isNaN(parseInt(sHeight)) ? sHeight : sHeight + 'px;') : '')+
	'">';
};

cXULElement_box.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_box);


var cXULElement_broadcaster	= function(){};
cXULElement_broadcaster.prototype	= new cXULElement("broadcaster");
cXULElement_broadcaster.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

cXULElement_broadcaster.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
						if (oEvent.attrName != "id" && oEvent.attrName != "persist") {
				if (this.attributes["id"]) {
					var aElements	= this.ownerDocument.getElementsByTagNameNS(this.namespaceURI, "*");
					for (var nIndex = 0, oElement, sAttribute; oElement = aElements[nIndex]; nIndex++) {
						if (oElement.localName == "observes") {
							sAttribute	= oElement.attributes["attribute"];
							if ((oElement.attributes["element"] == this.attributes["id"]) && (!sAttribute || sAttribute == "*" || sAttribute == oEvent.attrName)) {
								if (oEvent.newValue == null)
									oElement.parentNode.removeAttribute(oEvent.attrName);
								else
									oElement.parentNode.setAttribute(oEvent.attrName, oEvent.newValue);
																oElement.doBroadcast();
							}
						}
						else {
							if (oElement.attributes["observes"] == this.attributes["id"]) {
								if (oEvent.newValue == null)
									oElement.removeAttribute(oEvent.attrName);
								else
									oElement.setAttribute(oEvent.attrName, oEvent.newValue);
							}
						}
					}
				}
			}
		}
	}
};

ample.extend(cXULElement_broadcaster);


var cXULElement_broadcasterset	= function(){};
cXULElement_broadcasterset.prototype	= new cXULElement("broadcasterset");
cXULElement_broadcasterset.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;


ample.extend(cXULElement_broadcasterset);


var cXULElement_button	= function(){};
cXULElement_button.prototype	= new cXULElement("button");
cXULElement_button.prototype.tabIndex	= 0;
cXULElement_button.prototype.$hoverable	= true;


cXULElement_button.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer().focus();
	},
	"blur":		function(oEvent) {
		this.$getContainer().blur();
	},
	"keydown":	function(oEvent) {
		if (oEvent.keyIdentifier == "Enter" || oEvent.keyIdentifier == "U+0020")
			this.$activate();
	},
	"click":	function(oEvent) {
		if (oEvent.button == 0)
			this.$activate();
	},
	"DOMActivate":	function(oEvent) {
		this.doCommand();
	}
};

cXULElement_button.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$getContainer().disabled	= sValue == "true";
	else
	if (sName == "label")
		this.$getContainer().innerHTML	=(this.attributes["image"] ? '<img src="' + this.attributes["image"] + '" align="absmiddle" /> ' :'') + (sValue || '');
	else
	if (sName == "image")
		this.$getContainer().innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" /> ' :'') + (this.attributes["label"] || '');
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_button.prototype.$getTagOpen	= function() {
	var sHtml	= '<button class="xul-button' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"';
	if (!this.$isAccessible())
		sHtml  += ' disabled="true"';
	sHtml  += ' style="';
	if (this.attributes["width"])
		sHtml  += 'width:'+this.attributes["width"]+';';
	if (this.attributes["height"])
		sHtml  += 'height:'+this.attributes["height"]+';';
	if (this.attributes["hidden"] == "true")
		sHtml  += 'display:none';
	sHtml  += '">';
	if (this.attributes["image"])
		sHtml  += '<img src="' + ample.$encodeXMLCharacters(this.attributes["image"]) + '" align="absmiddle"/> ';
	if (this.attributes["label"])
		sHtml  += ample.$encodeXMLCharacters(this.attributes["label"]);

	return sHtml;
};

cXULElement_button.prototype.$getTagClose	= function() {
	return '</button>';
};

ample.extend(cXULElement_button);


var cXULElement_caption	= function(){};
cXULElement_caption.prototype	= new cXULElement("caption");
cXULElement_caption.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

cXULElement_caption.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		this.parentNode.$getContainer("caption").innerHTML	= (this.hasAttribute("image") ? '<img src="' + this.getAttribute("image") + '" align="absmiddle" /> ' : '')+(this.hasAttribute("label") ? this.getAttribute("label") : '');
		if (this.getAttribute("hidden") != "true")
			this.parentNode.$getContainer("caption").style.display	= "";
	}
};

cXULElement_caption.prototype.$mapAttribute	= function(sName, sValue) {
		if (!(this.parentNode instanceof cXULElement_groupbox))
		return;
		if (sName == "label")
		this.parentNode.$getContainer("caption").innerHTML	=(this.attributes["image"] ? '<img src="' + this.attributes["image"] + '" align="absmiddle" /> ' : '')+ (sValue || '');
	else
	if (sName == "image")
		this.parentNode.$getContainer("caption").innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" /> ' : '') + (this.attributes["label"] ? this.attributes["label"] : '');
	else
	if (sName == "hidden")
		this.parentNode.$getContainer("caption").style.display	= sValue == "true" ? "none" : "";
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

ample.extend(cXULElement_caption);


var cXULElement_checkbox	= function(){};
cXULElement_checkbox.prototype	= new cXULInputElement("checkbox");

cXULElement_checkbox.prototype.$hoverable	= true;


cXULElement_checkbox.handlers	= {
	"keydown":	function(oEvent) {
		if (oEvent.keyIdentifier == "U+0020") {
			this.$activate();
			cXULInputElement.dispatchChange(this);
		}
	},
	"click":	function(oEvent) {
		if (oEvent.button == 0) {
			this.$activate();
			cXULInputElement.dispatchChange(this);
		}
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "value")
				this.setAttribute("checked", oEvent.newValue == "on" ? "true" : "false");
			else
			if (oEvent.attrName == "checked")
				this.setAttribute("value", oEvent.newValue == "true" ? "on" : "off");
		}
	},
	"DOMActivate":	function(oEvent) {
		this.setAttribute("checked", this.getAttribute("checked") == "true" ? "false" : "true");
	}
};

cXULElement_checkbox.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "checked")
		this.$setPseudoClass("checked", sValue == "true");
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	= sValue || '';
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_checkbox.prototype.$getTagOpen		= function() {
	var bChecked	= this.attributes["checked"] == "true",
		bDisabled	= !this.$isAccessible();
	return '<div class="xul-checkbox' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + (bDisabled ? " xul-checkbox_disabled" : "") + (bChecked ? " xul-checkbox_checked" : "") + (bChecked && bDisabled ? " xul-checkbox_checked_disabled xul-checkbox_disabled_checked" : "") + '">\
				<div class="xul-checkbox--input"><br /></div>\
				<div class="xul-checkbox--label">' + (this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : '') + '</div>';
};

cXULElement_checkbox.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_checkbox);


var cXULElement_colorpicker_pane	= function() {
		this.x	= 0;
	this.y	= 0;
	this.b	= 1;
};
cXULElement_colorpicker_pane.prototype	= new cXULPopupElement("colorpicker-pane");

cXULElement_colorpicker_pane.attributes	= {};
cXULElement_colorpicker_pane.attributes.value	= "#FF0000";


cXULElement_colorpicker_pane.prototype._moveTo	= function(sName, oPosition) {
	if (oPosition.x)
		this.$getContainer(sName).style.left	= oPosition.x + "px";
	if (oPosition.y)
		this.$getContainer(sName).style.top	= oPosition.y + "px";
};

cXULElement_colorpicker_pane.prototype._setColor	= function(sColor) {
	var oColor;
	if (oColor = cXULElement_colorpicker_pane._RGBtoXYB(sColor)) {
		this.b	= oColor.b;
		this.x	= oColor.x;
		this.y	= oColor.y;

		this._moveTo('palette-pointer', {'x' : this.x - 9, 'y' : this.y - 9});

		this.$getContainer('color').style.backgroundColor	= sColor;

		this._setColorBrightness(cXULElement_colorpicker_pane._XYBtoRGB({'x': this.x, 'y': this.y, 'b': 0}));
		this._setPaletteBrightness(this.b);

		this._moveTo('brightness-pointer',	{'y' : this.b * 255	- 2});
	}
};

cXULElement_colorpicker_pane.prototype._setColorBrightness	= function(sColor) {
	this.$getContainer('brightness').style.backgroundColor	= sColor;
	this.$getContainer('brightness-shader').style.filter	= "progid:DXImageTransform.Microsoft.Gradient(startColorStr='" + sColor + "', endColorStr='#000000', gradientType='0');";
};

cXULElement_colorpicker_pane.prototype._setPaletteBrightness	= function(nBrightness) {
		var oElementDOM	= this.$getContainer('palette-shader');
	oElementDOM.style.filter		= 'progid:DXImageTransform.Microsoft.alpha(opacity=' + nBrightness * 100 + ')'; 	oElementDOM.style.opacity		= nBrightness; 	oElementDOM.style.MozOpacity	= nBrightness; };

cXULElement_colorpicker_pane.prototype._getComputedStyleByEvent	= function(oEvent, sName) {
	var oPosition	= this.getBoundingClientRect(sName);
	var nPositionX	= oEvent.clientX - oPosition.left;
	var nPositionY	= oEvent.clientY - oPosition.top;

		nPositionX	= nPositionX < 0	? 0 :(nPositionX > 255	? 255	: nPositionX);
	nPositionY	= nPositionY < 0	? 0 :(nPositionY > 255	? 255	: nPositionY);

	return {'x' : nPositionX, 'y': nPositionY};
};

cXULElement_colorpicker_pane.prototype._setColorValue	= function(sColor) {
	this.$getContainer('color').style.backgroundColor	= sColor;
	this.$getContainer('value').value	= sColor;
};

cXULElement_colorpicker_pane.prototype._detachHandlers	= function() {
	document.onmousemove	= null;
	document.onmouseup	= null;
};

cXULElement_colorpicker_pane.prototype._onInputChange	= function(oEvent, sValue) {
	this._setColor(sValue);
};

cXULElement_colorpicker_pane.prototype._onPointersBrightnessMouseMove	= function(oEvent) {
	var oPosition	= this._getComputedStyleByEvent(oEvent, 'brightness');
	this._moveTo('brightness-pointer', {'y' : oPosition.y - 3});

	this.b	= Math.round(100 * oPosition.y / 255) / 100;
	this._setPaletteBrightness(this.b);
	this._setColorValue(cXULElement_colorpicker_pane._XYBtoRGB({'x': this.x, 'y': this.y, 'b': this.b}));
};

cXULElement_colorpicker_pane.prototype._onPointersBrightnessMouseDown	= function(oEvent) {
	var oElement	= this;
	document.onmousemove	= function(e) {
		return oElement._onPointersBrightnessMouseMove(e || event)
	};
	document.onmouseup	= function() {
		oElement._detachHandlers();
	};
	this._onPointersBrightnessMouseMove(oEvent);
};

cXULElement_colorpicker_pane.prototype._onPointerPaletteMouseMove	= function(oEvent) {
	var oPosition	= this._getComputedStyleByEvent(oEvent, "palette");
	this.x	= oPosition.x;
	this.y	= oPosition.y;

	this._moveTo('palette-pointer', {'x' : this.x - 9, 'y' : this.y - 9});
	this._setColorBrightness(cXULElement_colorpicker_pane._XYBtoRGB({'x': this.x, 'y': this.y, 'b': 0}));
	this._setColorValue(cXULElement_colorpicker_pane._XYBtoRGB({'x': this.x, 'y': this.y, 'b': this.b}));
};

cXULElement_colorpicker_pane.prototype._onPointerPaletteMouseDown	= function(oEvent) {
	var oElement	= this;
	document.onmousemove	= function(e) {
		return oElement._onPointerPaletteMouseMove(e || event)
	};
	document.onmouseup	= function() {
		oElement._detachHandlers();
	};
	this._onPointerPaletteMouseMove(oEvent);
};

cXULElement_colorpicker_pane.prototype.acceptDialog	= function() {
	this.attributes.value	= this.$getContainer('value').value;

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("accept", false, false);
	this.dispatchEvent(oEvent);
};

cXULElement_colorpicker_pane.prototype.cancelDialog	= function() {
	this.setAttribute("value", this.attributes.value);

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("cancel", false, false);
	this.dispatchEvent(oEvent);
};

cXULElement_colorpicker_pane.handlers	= {
	"DOMNodeInsertedIntoDocument":	function() {
		this._setColor(cXULElement_colorpicker_pane.attributes.value);
	}
};

cXULElement_colorpicker_pane.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value") {
		this._setColor(sValue || '');
		this.$getContainer('value').value	= sValue || '';
	}
	else
		cXULPopupElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_colorpicker_pane.prototype.$getTagOpen	= function() {
	return '<div class="xul-colorpicker-pane xul-menupopup' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + '" style="' +
				(this.getAttribute("hidden") == "true" ? "display:none;" : '') +
				(this.hasAttribute("style") ? this.getAttribute("style") : '') + '">\
				<div class="xul-menupopup--shadow-right" style="position:absolute;"></div>\
				<div class="xul-menupopup--shadow-bottom" style="position:absolute;"></div>\
				<table cellpadding="0" cellspacing="0" border="0">\
				<tbody>\
					<tr>\
						<td valign="top">\
							<div class="xul-colorpicker-pane--palette" style="position:relative;" onmousedown="ample.$instance(this)._onPointerPaletteMouseDown(event)">\
								<div class="xul-colorpicker-pane--palette-shader"><br /></div>\
								<div class="xul-colorpicker-pane--palette-pointer" style="position:absolute;"><br /></div>\
							</div>\
						</td>\
						<td align="center" valign="top" style="position:relative;display:block;">\
							<div style="width:39px" onmousedown="ample.$instance(this)._onPointersBrightnessMouseDown(event);">\
								<div class="xul-colorpicker-pane--brightness">\
									<div class="xul-colorpicker-pane--brightness-shader"><br /></div>\
								</div>\
								<div class="xul-colorpicker-pane--brightness-pointer" style="position:absolute;left:1px;"><br /></div>\
							</div>\
						</td>\
						<td valign="top">\
							<table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">\
								<tbody>\
									<tr><td align="right"><div class="xul-colorpicker-pane--color"></div></td></tr>\
									<tr><td><br /></td></tr>\
									<tr><td><input autocomplete="no" type="text" value="#FF0000" maxlength="7" class="xul-colorpicker-pane--value" onchange="ample.$instance(this)._onInputChange(event, this.value)" onkeyup="ample.$instance(this)._onInputChange(event, this.value)" onselectstart="event.cancelBubble=true;" oncontextmenu="event.cancelBubble=true"/></td></tr>\
									<tr><td><br /></td></tr>\
									<tr><td><button type="button" onclick="ample.$instance(this).acceptDialog();" class="xul-colorpicker-pane--button-accept">' + ample.locale.localize("xul.dialog.button.accept") + '</button></td></tr>\
									<tr><td height="3"></td></tr>\
									<tr><td><button type="button" onclick="ample.$instance(this).cancelDialog()" class="xul-colorpicker-pane--button-cancel">' + ample.locale.localize("xul.dialog.button.cancel") + '</button></td></tr>\
								</tbody>\
							</table>\
						</td>\
					</tr>\
				</tbody>\
			</table>\
		</div>';
};

cXULElement_colorpicker_pane.prototype.$getTagClose	= function() {
	return '';
};

cXULElement_colorpicker_pane._XYBtoRGB	= function(oXYB) {
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

cXULElement_colorpicker_pane._RGBtoXYB	= function(sColor) {
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

cXULElement_colorpicker_pane._toHex	= function(nValue) {
	var sHexCharacters	= "0123456789ABCDEF";

	if (nValue < 0)
		return "00";
	if (nValue > 255)
		return "FF";
	else
		return sHexCharacters.charAt(Math.floor(nValue / 16)) + sHexCharacters.charAt(nValue % 16);
};

ample.extend(cXULElement_colorpicker_pane);


var cXULElement_colorpicker	= function(){
		this.contentFragment	= ample.createDocumentFragment();
	this.popup		= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:colorpicker-pane"));
	this.popup.setAttribute("hidden", "true");
		var that	= this;
	this.popup.addEventListener("accept", function(oEvent) {
				this.hidePopup();

		that.setAttribute("value", this.getAttribute("value"));

				cXULInputElement.dispatchChange(that);

		that.focus();
	}, false);
	this.popup.addEventListener("cancel", function(oEvent) {
				this.hidePopup();
	}, false);
};
cXULElement_colorpicker.prototype	= new cXULInputElement("colorpicker");
cXULElement_colorpicker.prototype.$selectable	= true;

cXULElement_colorpicker.prototype.popup	= null;

cXULElement_colorpicker.attributes	= {};
cXULElement_colorpicker.attributes.value	= "";

cXULElement_colorpicker.prototype.toggle	= function(bState) {
	var bHidden	= this.popup.getAttribute("hidden") == "true";
	if (bState === true || (!arguments.length && bHidden)) {
				this.popup.setAttribute("value", this.getAttribute("value"));

				this.popup.showPopup(this, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
	}
	else
	if (!bHidden) {
		this.popup.hidePopup();
	}
};

cXULElement_colorpicker.prototype._onChange	= function(oEvent) {
	this.attributes["value"]	= this.$getContainer("input").value;

		cXULInputElement.dispatchChange(this);
};

cXULElement_colorpicker.handlers	= {
	"mousedown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

				if (oEvent.target == this && oEvent.button == 0 && oEvent.$pseudoTarget == this.$getContainer("button"))
			this.toggle();
	},
	"mouseenter":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		this.$setPseudoClass("hover", true, "button");
	},
	"mouseleave":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		this.$setPseudoClass("hover", false, "button");
	},
	"keydown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		if (oEvent.keyIdentifier == "U+001B")				this.toggle(false);
	},
		"focus":	function(oEvent) {
		this.$getContainer("input").focus();
	},
	"blur":		function(oEvent) {
		if (this.popup.getAttribute("hidden") != "true")
			this.toggle(false);
		this.$getContainer("input").blur();
	}
};

cXULElement_colorpicker.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.$getContainer("input").value = sValue || '';
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		this.$getContainer("input").disabled	= sValue == "true";
	}
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_colorpicker.prototype.$getTagOpen	= function() {
	return '<div class="xul-colorpicker' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + (!this.$isAccessible() ? " xul-colorpicker_disabled" : "") + '">\
				<div class="xul-colorpicker--field">\
					<div class="xul-colorpicker--button"><br /></div>\
					<input class="xul-colorpicker--input" type="text" autocomplete="off" value="' + this.attributes["value"] + '"' + (!this.$isAccessible() ? ' disabled="true"' : '') +' maxlength="7" onchange="ample.$instance(this)._onChange(event)" style="border:0px solid white;width:100%;" onselectstart="event.cancelBubble=true;" />\
				</div>\
				<div class="xul-colorpicker--gateway">' + this.popup.$getTag() + '</div>\
			</div>';
};

ample.extend(cXULElement_colorpicker);


var cXULElement_column	= function(){};
cXULElement_column.prototype	= new cXULElement("column");

ample.extend(cXULElement_column);


var cXULElement_columns	= function(){};
cXULElement_columns.prototype	= new cXULElement("columns");

ample.extend(cXULElement_columns);


var cXULElement_command	= function(){};
cXULElement_command.prototype	= new cXULElement("command");
cXULElement_command.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

cXULElement_command.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
						if (oEvent.attrName != "id" && oEvent.attrName != "persist") {
				if (this.attributes["id"]) {
					var aElements	= this.ownerDocument.getElementsByTagNameNS(this.namespaceURI, "*");
					for (var nIndex = 0, oElement; oElement = aElements[nIndex]; nIndex++)
						if (oElement.attributes["command"] == this.attributes["id"]) {
							if (oEvent.newValue == null)
								oElement.removeAttribute(oEvent.attrName);
							else
								oElement.setAttribute(oEvent.attrName, oEvent.newValue);
						}
				}
			}
		}
	}
};

ample.extend(cXULElement_command);


var cXULElement_commandset	= function(){};
cXULElement_commandset.prototype	= new cXULElement("commandset");
cXULElement_commandset.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;


ample.extend(cXULElement_commandset);


var cXULElement_datepicker_pane	= function() {
	var oDate	= new Date();
	this.current	= new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this._elementMonth	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:menulist"));
	this._elementMonth.appendChild(ample.createElementNS(this.namespaceURI, "xul:menupopup"));
	this._elementMonth.tabIndex	=-1;
	this._elementMonth.addEventListener("change", function(oEvent) {
		that.doSelectMonth(this.items[this.selectedIndex].getAttribute("value"));
				oEvent.stopPropagation();
	}, false);
		for (var nIndex = 0, oElement; nIndex < 12; nIndex++) {
		oElement	= this._elementMonth.firstChild.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
		oElement.setAttribute("value", nIndex);
		oElement.setAttribute("label", ample.locale.culture.calendar.months.names[nIndex]);
	}
		this._elementYear	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:textbox"));
	this._elementYear.setAttribute("type", "number");
	this._elementYear.tabIndex	=-1;
	this._elementYear.setAttribute("max", Infinity);
	this._elementYear.addEventListener("change", function(oEvent) {
		that.doSelectYear(this.getAttribute("value"));
				oEvent.stopPropagation();
	}, false);
};

cXULElement_datepicker_pane.prototype	= new cXULPopupElement("datepicker-pane");

cXULElement_datepicker_pane.prototype.current= null;	cXULElement_datepicker_pane.prototype.value	= null;
cXULElement_datepicker_pane.prototype.min	= null;
cXULElement_datepicker_pane.prototype.max	= null;

cXULElement_datepicker_pane.prototype.show	= function(nLeft, nTop) {
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
	}
};

cXULElement_datepicker_pane.prototype.hide	= function() {
	var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("hidden", false, true, null);
	if (this.dispatchEvent(oEvent))
		this.$getContainer().style.display	= "none";
};

cXULElement_datepicker_pane.prototype.refresh	= function() {
		this.$getContainer("days-pane").innerHTML	= cXULElement_datepicker_pane.$getTagDays(this, this.current);
	var oItem	= this._elementMonth.firstChild.querySelector("[value='" + this.current.getMonth() + "']");
	this._elementMonth.firstChild.selectItem(oItem);
	this._elementMonth.setAttribute("value", oItem.getAttribute("label"));		this._elementYear.setAttribute("value", this.current.getFullYear());
};

cXULElement_datepicker_pane.prototype._onSelectDay	= function(nDay) {
		this.current.setDate(nDay);
	var nMonth	= this.current.getMonth() + 1;
	var nYear	= this.current.getFullYear();

		var sValue	= nYear + '-' + (nMonth < 10 ? '0' : '') + nMonth + '-' + (nDay < 10 ? '0' : '') + nDay;
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

cXULElement_datepicker_pane.prototype.doSelectMonth	= function(nMonth) {
		this.current.setMonth(nMonth);

	this.$getContainer("days-pane").innerHTML	= cXULElement_datepicker_pane.$getTagDays(this, this.current);
};

cXULElement_datepicker_pane.prototype.doSelectYear	= function(nYear) {
		this.current.setYear(nYear);

	this.$getContainer("days-pane").innerHTML		= cXULElement_datepicker_pane.$getTagDays(this, this.current);
};

cXULElement_datepicker_pane.parseDateFromString	= function(sDate) {
	var aDate	= sDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (aDate) {
		var nYear	= aDate[1] * 1,
			nMonth	= aDate[2] * 1 - 1,
			nDate	= aDate[3] * 1;
				var oDate	= new Date(nYear, nMonth, nDate, 0, 0, 0);
		if (oDate.getFullYear() == nYear && oDate.getMonth() == nMonth && oDate.getDate() == nDate)
			return oDate;
	}
	return null;
};

cXULElement_datepicker_pane.handlers	= {
	"click":		function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.$pseudoTarget == this.$getContainer("month-previous")) {
				var nYear	= this.current.getFullYear();
				this.doSelectMonth(this.current.getMonth() - 1);
				this._elementMonth.setAttribute("value", ample.locale.culture.calendar.months.names[this.current.getMonth()]);
				if (this.current.getFullYear() != nYear)
					this._elementYear.setAttribute("value", this.current.getFullYear());
			}
			else
			if (oEvent.$pseudoTarget == this.$getContainer("month-next")) {
				var nYear	= this.current.getFullYear();
				this.doSelectMonth(this.current.getMonth() + 1);
				this._elementMonth.setAttribute("value", ample.locale.culture.calendar.months.names[this.current.getMonth()]);
				if (this.current.getFullYear() != nYear)
					this._elementYear.setAttribute("value", this.current.getFullYear());
			}

		}
	},
	"keydown":		function(oEvent) {
			},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this)
			if (oEvent.attrName == "min") {
				if (oEvent.newValue)
					this.min	= cXULElement_datepicker_pane.parseDateFromString(oEvent.newValue);
				else
					this.min	= null;
			}
			else
			if (oEvent.attrName == "max") {
				if (oEvent.newValue)
					this.max	= cXULElement_datepicker_pane.parseDateFromString(oEvent.newValue);
				else
					this.max	= null;
			}
			else
			if (oEvent.attrName == "value") {
				this.value	= null;
				if (oEvent.newValue) {
					var oDate	= cXULElement_datepicker_pane.parseDateFromString(oEvent.newValue);
					if (oDate) {
						this.value	= oDate;
						this.current= new Date(oDate);
					}
				}
			}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				var sValue	= this.getAttribute("value");
		if (sValue) {
			var oDate	= cXULElement_datepicker_pane.parseDateFromString(sValue);
			if (oDate) {
				this.value	= oDate;
				this.current= new Date(oDate);
			}
		}
		this._elementMonth.setAttribute("value", ample.locale.culture.calendar.months.names[this.current.getMonth()]);
		this._elementYear.setAttribute("value", this.current.getFullYear());
				this.refresh();
	}
};

cXULElement_datepicker_pane.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.refresh();
	else
	if (sName == "disabled") {
		this._elementMonth.setAttribute("disabled", sValue == "true" ? "true" : "false");
		this._elementYear.setAttribute("disabled", sValue == "true" ? "true" : "false");
	}
	else
		cXULPopupElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_datepicker_pane.getWeekNum	= function(oDate) {
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



cXULElement_datepicker_pane.$getTagDays	= function(oInstance, oDate) {
	var aHtml	= [];

		aHtml.push('<table cellPadding="0" cellSpacing="1" border="0">\
					<thead class="xul-datepicker-pane--header">\
						<tr>\
							<td>&nbsp;</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[1] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[2] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[3] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[4] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[5] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[6] + '</td>\
							<td class="xul-datepicker-pane-head-day">' + ample.locale.culture.calendar.days.namesShort[0] + '</td>\
						</tr>\
					</thead>\
					<tbody>\
						<tr>');

	var oDateToday	= new Date;

	var nWeek	= cXULElement_datepicker_pane.getWeekNum(oDate, true);
		var nWeekDay	= new Date(oDate.getFullYear(), oDate.getMonth(), 1).getDay() - 1;
	if (nWeekDay < 0)
		nWeekDay	= 6;

	aHtml.push('<td align="center" valign="center"><div class="xul-datepicker-pane-week">' + nWeek + '</div></td>');
		for (var nIndex = 0; nIndex < nWeekDay; nIndex++)
		aHtml.push('<td><br /></td>');

	nWeek	= (nWeek >= 52) ? 0 : nWeek; 
	var nDays	= new Date(oDate.getFullYear(), oDate.getMonth() * 1 + 1, 0).getDate();

	for (var nIndex = 1, oDateCurrent, bDateDisabled; nIndex <= nDays; nIndex++) {
		oDateCurrent	= new Date(oDate.getFullYear(), oDate.getMonth(), nIndex);
		bDateDisabled	= (oInstance.min && oDateCurrent < oInstance.min) || (oInstance.max && oDateCurrent > oInstance.max);
		aHtml.push('	<td align="center" valign="center">\
							<div type="button"\
								class="xul-datepicker-pane-day' +(nWeekDay > 4 ? " xul-datepicker-pane-weekend" : '') + (oInstance.value && oDateCurrent.getTime() == oInstance.value.getTime() ? ' xul-datepicker-pane-day_selected' : '') + '\
								' + (oDateToday.getDate() == oDateCurrent.getDate() && oDateToday.getMonth() == oDateCurrent.getMonth() && oDateToday.getFullYear() == oDateCurrent.getFullYear() ? ' xul-datepicker-pane-day_today' : '') + '\
								' + (bDateDisabled ? ' xul-datepicker-pane-day_disabled' : '" onclick="ample.$instance(this)._onSelectDay(' + nIndex + ')') + '"\
								onmouseover="this.className += \' xul-datepicker-pane-day_hover\'" onmouseout="this.className = this.className.replace(\' xul-datepicker-pane-day_hover\', \'\')"\
								>' + nIndex + '</div>\
						</td>');
		if ((nWeekDay == 6) && (nIndex < nDays)) {
			nWeek++;
			if (nWeek == 53)
				nWeek	= (new Date(oDate.getFullYear(), 11, 31).getDay() < 3) ? 1 : nWeek;
			aHtml.push('</tr>\
						<tr>\
							<td align="center" valign="center"><div class="xul-datepicker-pane-week">' + nWeek + '</div></td>');
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

cXULElement_datepicker_pane.prototype.$getTagOpen	= function() {
		this._elementMonth.attributes["disabled"]	= this.$isAccessible() ? "false" : "true";
	this._elementYear.attributes["disabled"]	= this.$isAccessible() ? "false" : "true";
		return '<div class="xul-datepicker-pane xul-menupopup' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + '" style="' +
				(this.getAttribute("hidden") == "true" ? "display:none;" : '') +
				(this.hasAttribute("style") ? this.getAttribute("style") : '') + '">\
				<div class="xul-menupopup--shadow-right" style="position:absolute;"></div>\
				<div class="xul-menupopup--shadow-bottom" style="position:absolute;"></div>\
				<table cellpadding="0" cellspacing="0" border="0">\
					<thead>\
						<tr>\
							<td><button class="xul-datepicker-pane--month-previous" onmouseover="ample.$instance(this).$setPseudoClass(\'hover\', true, \'month-previous\')" onmouseout="ample.$instance(this).$setPseudoClass(\'hover\', false, \'month-previous\')"><br /></button></td>\
							<td>' + this._elementMonth.$getTag() + '</td>\
							<td><button class="xul-datepicker-pane--month-next" onmouseover="ample.$instance(this).$setPseudoClass(\'hover\', true, \'month-next\')" onmouseout="ample.$instance(this).$setPseudoClass(\'hover\', false, \'month-next\')"><br /></button></td>\
							<td>' + this._elementYear.$getTag() + '</td>\
						</tr>\
					</thead>\
					<tbody>\
						<tr>\
							<td colspan="4" class="xul-datepicker-pane--days-pane"></td>\
						</tr>\
					</tbody>\
				</table>\
			</div>';
};

cXULElement_datepicker_pane.prototype.$getTagClose	= function() {
	return '';
};

ample.extend(cXULElement_datepicker_pane);


var cXULElement_datepicker	= function() {
		this.contentFragment	= ample.createDocumentFragment();
	this.popup		= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:datepicker-pane"));
	this.popup.setAttribute("hidden", "true");
		var that	= this;
	this.popup.addEventListener("change", function(oEvent) {
				this.hidePopup();

		that.setAttribute("value", this.getAttribute("value"));

				cXULInputElement.dispatchChange(that);

		that.focus();
	}, false);
};

cXULElement_datepicker.prototype	= new cXULInputElement("datepicker");
cXULElement_datepicker.prototype.$selectable	= true;

cXULElement_datepicker.prototype.popup	= null;

cXULElement_datepicker.prototype.toggle	= function(bState) {
	var bHidden	= this.popup.getAttribute("hidden") == "true";
	if (bState === true || (!arguments.length && bHidden)) {
				this.popup.setAttribute("min", this.getAttribute("min"));
		this.popup.setAttribute("max", this.getAttribute("max"));
		this.popup.setAttribute("value", this.getAttribute("value"));

				this.popup.showPopup(this, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
	}
	else
	if (!bHidden) {
		this.popup.hidePopup();
	}
};

cXULElement_datepicker.handlers	= {
	"mousedown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

				if (oEvent.target == this && oEvent.button == 0 && oEvent.$pseudoTarget == this.$getContainer("button"))
			this.toggle();
	},
	"mouseenter":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		this.$setPseudoClass("hover", true, "button");
	},
	"mouseleave":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		this.$setPseudoClass("hover", false, "button");
	},
	"keydown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		if (oEvent.keyIdentifier == "U+001B")				this.toggle(false);
	},
		"focus":	function(oEvent) {
		this.$getContainer("input").focus();
	},
	"blur":		function(oEvent) {
		if (this.popup.getAttribute("hidden") != "true")
			this.toggle(false);
		this.$getContainer("input").blur();
	}
};

cXULElement_datepicker.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.$getContainer("input").value	= sValue || '';
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		this.$getContainer("input").disabled	= sValue == "true";
	}
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_datepicker.prototype.$getTagOpen	= function() {
	return '<div class="xul-datepicker' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '') + (!this.$isAccessible() ? " xul-datepicker_disabled" : "") + '"' + (this.hasAttribute("style") ? ' style="' + this.getAttribute("style") + '"' : '')+ '>\
				<div class="xul-datepicker--field">\
					<div class="xul-datepicker--button"><br /></div>\
					<input class="xul-datepicker--input" type="text" maxlength="10" value="' + this.getAttribute("value") + '"' + (!this.$isAccessible() ? ' disabled="true"' : "") +' style="border:0px solid white;width:100%;" />\
				</div>\
				<div class="xul-datepicker--gateway">' + this.popup.$getTag() + '</div>\
			</div>';
};

ample.extend(cXULElement_datepicker);


var cXULElement_deck	= function(){};
cXULElement_deck.prototype	= new cXULElement("deck");

cXULElement_deck.prototype.selectedIndex	=-1;
cXULElement_deck.prototype.selectedPanel	= null;

cXULElement_deck.attributes	= {};
cXULElement_deck.attributes.selectedIndex	= "-1";

cXULElement_deck.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "selectedIndex") {
				if (this.childNodes.length > 0) {
					var nValue	= oEvent.newValue * 1;
					if (isNaN(nValue) || this.childNodes.length < nValue || nValue < 0)
						nValue	= 0;

					this.selectedIndex	= nValue;
					this.selectedPanel	= this.childNodes[this.selectedIndex];

					for (var nIndex = 0; nIndex < this.childNodes.length; nIndex++)
						this.childNodes[nIndex].setAttribute("hidden", this.selectedIndex == nIndex ? "false" : "true");
				}

								var oEvent	= this.ownerDocument.createEvent("Event");
				oEvent.initEvent("select", true, true);
				this.dispatchEvent(oEvent);
			}
		}
	}
};

cXULElement_deck.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "selectedIndex") {
		if (this.selectedPanel)
			oXULReflowManager.schedule(this.selectedPanel);
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_deck.prototype.reflow	= function() {
		var sValue	= this.attributes["selectedIndex"];
	if (sValue) {
		delete this.attributes["selectedIndex"];
		this.setAttribute("selectedIndex", sValue);
	}
		cXULElement.prototype.reflow.call(this);
};

cXULElement_deck.prototype.$getTagOpen	= function() {
	return '<div class="xul-deck' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_deck.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_deck);


var cXULElement_description	= function(){};
cXULElement_description.prototype	= new cXULElement("description");

cXULElement_description.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.$getContainer().innerHTML	= sValue || '';
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_description.prototype.$getTagOpen		= function() {
	return '<div class="xul-description' +(this.attributes["class"] ? " " + this.attributes["class"] : '')+ '" style="' +
				'width:100%;height:100%;'+
				(this.attributes["style"] ? this.attributes["style"] : '') +
				'">' + (this.attributes["value"] ? ample.$encodeXMLCharacters(this.attributes["value"]) : "");
};

cXULElement_description.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_description);


var cXULElement_dialog	= function(){
		this.buttons	= {};
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this.buttons.accept	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.accept.addEventListener("DOMActivate", function(oEvent) {
		that.acceptDialog();
	}, false);
	this.buttons.accept.setAttribute("label", ample.locale.localize("xul.dialog.button.accept"));
	this.buttons.accept.setAttribute("class", "accept");
		this.buttons.cancel	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.cancel.addEventListener("DOMActivate", function(oEvent) {
		that.cancelDialog();
	}, false);
	this.buttons.cancel.setAttribute("label", ample.locale.localize("xul.dialog.button.cancel"));
	this.buttons.cancel.setAttribute("class", "cancel");
		this.buttons.help	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.help.addEventListener("DOMActivate", function(oEvent) {
		var oEvent2	= that.ownerDocument.createEvent("Event");
		oEvent2.initEvent("dialoghelp", true, true);
		that.dispatchEvent(oEvent2);
	}, false);
	this.buttons.help.setAttribute("label", ample.locale.localize("xul.dialog.button.help"));
	this.buttons.help.setAttribute("class", "help");
		this.buttons.extra1	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.extra1.addEventListener("DOMActivate", function(oEvent) {
		that.extra1();
	}, false);
	this.buttons.extra1.setAttribute("label", "Extra1");
	this.buttons.extra1.setAttribute("class", "extra1");
		this.buttons.extra2	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.extra2.addEventListener("DOMActivate", function(oEvent) {
		that.extra2();
	}, false);
	this.buttons.extra2.setAttribute("label", "Extra2");
	this.buttons.extra2.setAttribute("class", "extra2");
};
cXULElement_dialog.prototype	= new cXULWindowElement("dialog");
cXULElement_dialog.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;
cXULElement_dialog.prototype.buttons	= null;

cXULElement_dialog.attributes	= {};
cXULElement_dialog.attributes.buttons	= "accept" + "," + "cancel";
cXULElement_dialog.attributes.orient	= "vertical";
cXULElement_dialog.attributes.flex		= "1";
cXULElement_dialog.attributes.width		= "400";
cXULElement_dialog.attributes.height	= "300";

cXULElement_dialog.prototype.acceptDialog	= function() {
	var oEvent2	= this.ownerDocument.createEvent("Event");
	oEvent2.initEvent("dialogaccept", true, true);
	if (this.dispatchEvent(oEvent2))
		this.hide();
};

cXULElement_dialog.prototype.cancelDialog	= function() {
	var oEvent2	= this.ownerDocument.createEvent("Event");
	oEvent2.initEvent("dialogcancel", true, true);
	if (this.dispatchEvent(oEvent2))
		this.hide();
};

cXULElement_dialog.prototype.extra1	= function() {
	var oEvent2	= this.ownerDocument.createEvent("Event");
	oEvent2.initEvent("dialogextra1", true, true);
	this.dispatchEvent(oEvent2);
};

cXULElement_dialog.prototype.extra2	= function() {
	var oEvent2	= this.ownerDocument.createEvent("Event");
	oEvent2.initEvent("dialogextra2", true, true);
	this.dispatchEvent(oEvent2);
};

cXULElement_dialog.prototype.centerWindowOnScreen	= function() {
	var oElementDOM	= this.$getContainer(),
		oPosition	= this.getBoundingClientRect();
	oElementDOM.style.left	=(document.body.clientWidth - oPosition.right + oPosition.left) / 2;
	oElementDOM.style.top	=(document.body.clientHeight - oPosition.bottom + oPosition.top) / 2;
};

cXULElement_dialog.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			var sValue	= oEvent.newValue || '';
			switch (oEvent.attrName) {
				case "buttons":
					this.buttons["help"].setAttribute("hidden", !sValue || sValue.indexOf("help")	==-1 ? "true" : "false");
					this.buttons["cancel"].setAttribute("hidden", !sValue || sValue.indexOf("cancel")	==-1 ? "true" : "false");
					this.buttons["accept"].setAttribute("hidden", !sValue || sValue.indexOf("accept")	==-1 ? "true" : "false");
					this.buttons["extra1"].setAttribute("hidden", !sValue || sValue.indexOf("extra1")	==-1 ? "true" : "false");
					this.buttons["extra2"].setAttribute("hidden", !sValue || sValue.indexOf("extra2")	==-1 ? "true" : "false");
					break;

				case "buttonlabelhelp":
					this.buttons["help"].setAttribute("label", sValue);
					break;

				case "buttonlabelaccept":
					this.buttons["accept"].setAttribute("label", sValue);
					break;

				case "buttonlabelcancel":
					this.buttons["cancel"].setAttribute("label", sValue);
					break;

				case "buttonlabelextra1":
					this.buttons["accept"].setAttribute("label", sValue);
					break;

				case "buttonlabelextra2":
					this.buttons["extra2"].setAttribute("label", sValue);
					break;
			}
		}
	},
	"dragstart":	function(oEvent) {
		if (oEvent.target == this && oEvent.$pseudoTarget != this.$getContainer("title"))
			oEvent.preventDefault();
	}
};

cXULElement_dialog.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "buttonalign") {
		if (sValue == "start")
			this.$getContainer("foot").align	= "left";
		else
		if (sValue == "center")
			this.$getContainer("foot").align	= "center";
		else
			this.$getContainer("foot").align	= "right";
	}
	else
		cXULWindowElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_dialog.prototype.$getTagOpen	= function() {
	return '<div class="xul-dialog' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
				(this.attributes["width"] ? 'width:' + this.attributes["width"] + 'px;' : '') +
				(this.attributes["height"] ? 'height:' + (this.attributes["height"] - 40) + 'px;' : '') +
				(this.attributes["hidden"] == "true" ? 'display:none;' : '') +
				(this.attributes["style"] ? this.attributes["style"] : '') + '">\
				<div class="xul-dialog--head" ' +(this.attributes["hidechrome"] == "true" ? ' style="display:none"': '')+ '>\
					<table cellpadding="0" cellspacing="0" border="0" width="100%">\
						<tbody>\
							<tr>\
								<td class="xul-dialog--title">' + (this.attributes["title"] ? ample.$encodeXMLCharacters(this.attributes["title"]) : " ") + '</td>\
							</tr>\
						</tbody>\
					</table>\
				</div>\
				<div class="xul-dialogheader xul-dialog--header" style="display:none"><div class="xul-dialogheader--title xul-dialog--label"></div><div class="xul-dialogheader--description xul-dialog--description"></div></div>\
				<div class="xul-dialog--body" style="height:100%">';
};

cXULElement_dialog.prototype.$getTagClose	= function() {
	if (this.attributes["buttons"].indexOf("accept") ==-1)
		this.buttons.accept.attributes["hidden"]= "true";
	if (this.attributes["buttonlabelaccept"])
		this.buttons.accept.attributes["label"]	= this.attributes["buttonlabelaccept"];
	if (this.attributes["buttons"].indexOf("cancel") ==-1)
		this.buttons.cancel.attributes["hidden"]= "true";
	if (this.attributes["buttonlabelcancel"])
		this.buttons.cancel.attributes["label"]	= this.attributes["buttonlabelcancel"];
	if (this.attributes["buttons"].indexOf("help") ==-1)
		this.buttons.help.attributes["hidden"]	= "true";
	if (this.attributes["buttonlabelhelp"])
		this.buttons.help.attributes["label"]	= this.attributes["buttonlabelhelp"];
	if (this.attributes["buttons"].indexOf("extra1") ==-1)
		this.buttons.extra1.attributes["hidden"]= "true";
	if (this.attributes["buttonlabelextra1"])
		this.buttons.extra1.attributes["label"]	= this.attributes["buttonlabelextra1"];
	if (this.attributes["buttons"].indexOf("extra2") ==-1)
		this.buttons.extra2.attributes["hidden"]= "true";
	if (this.attributes["buttonlabelextra2"])
		this.buttons.extra2.attributes["label"]	= this.attributes["buttonlabelextra2"];

	return '	</div>\
				<div class="xul-dialog--footer">\
					<table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%" align="' +(this.attributes["buttonalign"] == "start" ? "left" : this.attributes["buttonalign"] == "center" ? "center" : "right")+ '">\
						<tbody>\
							<tr>\
								<td width="100%">' + this.buttons['help'].$getTag() + '</td>\
								<td>' + this.buttons['extra1'].$getTag() + '</td>\
								<td>' + this.buttons['extra2'].$getTag() + '</td>\
								<td>' + this.buttons['accept'].$getTag() + '</td>\
								<td>' + this.buttons['cancel'].$getTag() + '</td>\
							</tr>\
						</tbody>\
					</table>\
				</div>\
			</div>';
};

ample.extend(cXULElement_dialog);


var cXULElement_dialogheader	= function(){};
cXULElement_dialogheader.prototype	= new cXULElement("dialogheader");
cXULElement_dialogheader.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

cXULElement_dialogheader.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.parentNode instanceof cXULElement_dialog) {
			this.$mapAttribute("title", this.getAttribute("title"));
			this.$mapAttribute("description", this.getAttribute("description"));
						this.parentNode.$getContainer("header").style.display	= "";
		}
	}
};

cXULElement_dialogheader.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "title") {
		if (this.parentNode instanceof cXULElement_dialog)
			this.parentNode.$getContainer("label").innerHTML	= sValue || " ";
	}
	else
	if (sName == "description") {
		if (this.parentNode instanceof cXULElement_dialog)
			this.parentNode.$getContainer("description").innerHTML = sValue || " ";
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_dialogheader.prototype.$getTag	= function() {
	return '';
};

ample.extend(cXULElement_dialogheader);



var cXULElement_editor	= function() {
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this._elementFontName	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:menulist"));
	this._elementFontName.tabIndex	=-1;
	this._elementFontName.setAttribute("disabled", "true");
	this._elementFontName.setAttribute("class", "fontname");
	this._elementFontName.setAttribute("value", "Default");
	this._elementFontName.addEventListener("change", function(oEvent) {
		var oDOMDocument	= that.$getContainer("frame").contentWindow.document;
		oDOMDocument.execCommand("fontname", false, this.selectedIndex !=-1 ? this.items[this.selectedIndex].getAttribute("value") : '');
	}, false);
	var oElement,
		oPopup	= this._elementFontName.appendChild(ample.createElementNS(this.namespaceURI, "xul:menupopup"));
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Default");
	oElement.setAttribute("value", "");
	oElement.setAttribute("selected", "true");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Arial");
	oElement.setAttribute("value", "Arial");
	oElement.setAttribute("style", "font-family:Arial");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Arial Black");
	oElement.setAttribute("value", "Arial Black");
	oElement.setAttribute("style", "font-family:'Arial Black'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Book Antiqua");
	oElement.setAttribute("value", "Book Antiqua");
	oElement.setAttribute("style", "font-family:'Book Antiqua'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Comic Sans MS");
	oElement.setAttribute("value", "Comic Sans MS");
	oElement.setAttribute("style", "font-family:'Comic Sans MS'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Courier New");
	oElement.setAttribute("value", "Courier New");
	oElement.setAttribute("style", "font-family:'Courier New'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Georgia");
	oElement.setAttribute("value", "Georgia");
	oElement.setAttribute("style", "font-family:'Georgia'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Helvetica");
	oElement.setAttribute("value", "Helvetica");
	oElement.setAttribute("style", "font-family:'Helvetica'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Tahoma");
	oElement.setAttribute("value", "Tahoma");
	oElement.setAttribute("style", "font-family:'Tahoma'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Times New Roman");
	oElement.setAttribute("value", "Times New Roman");
	oElement.setAttribute("style", "font-family:'Times New Roman'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Trebuchet MS");
	oElement.setAttribute("value", "Trebuchet MS");
	oElement.setAttribute("style", "font-family:'Trebuchet MS'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Verdana");
	oElement.setAttribute("value", "Verdana");
	oElement.setAttribute("style", "font-family:'Verdana'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Webdings");
	oElement.setAttribute("value", "Webdings");
	oElement.setAttribute("style", "font-family:'Webdings'");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Wingdings");
	oElement.setAttribute("value", "Wingdings");
	oElement.setAttribute("style", "font-family:'Wingdings'");
		this._elementFontSize	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:menulist"));
	this._elementFontSize.tabIndex	=-1;
	this._elementFontSize.setAttribute("disabled", "true");
	this._elementFontSize.setAttribute("class", "fontsize");
	this._elementFontSize.setAttribute("value", "Default");
	this._elementFontSize.addEventListener("change", function(oEvent) {
		var oDOMDocument	= that.$getContainer("frame").contentWindow.document;
		oDOMDocument.execCommand("fontsize", false, this.selectedIndex !=-1 ? this.items[this.selectedIndex].getAttribute("value") : '');
	}, false);
	oPopup	= this._elementFontSize.appendChild(ample.createElementNS(this.namespaceURI, "xul:menupopup"));
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Default");
	oElement.setAttribute("value", "");
	oElement.setAttribute("selected", "true");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "1 (8pt)");
	oElement.setAttribute("value", "1");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "2 (10pt)");
	oElement.setAttribute("value", "2");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "3 (12pt)");
	oElement.setAttribute("value", "3");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "4 (14pt)");
	oElement.setAttribute("value", "4");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "5 (18pt)");
	oElement.setAttribute("value", "5");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "6 (24pt)");
	oElement.setAttribute("value", "6");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "7 (36pt)");
	oElement.setAttribute("value", "7");
		this._elementFormat		= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:menulist"));
	this._elementFormat.tabIndex	=-1;
	this._elementFormat.setAttribute("disabled", "true");
	this._elementFormat.setAttribute("class", "formatblock");
	this._elementFormat.setAttribute("value", "Default");
	this._elementFormat.addEventListener("change", function(oEvent) {
		var oDOMDocument	= that.$getContainer("frame").contentWindow.document;
		oDOMDocument.execCommand("formatblock", false, this.selectedIndex !=-1 ? this.items[this.selectedIndex].getAttribute("value") : '');
	}, false);
	oPopup	= this._elementFormat.appendChild(ample.createElementNS(this.namespaceURI, "xul:menupopup"));
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Default");
	oElement.setAttribute("value", "");
	oElement.setAttribute("selected", "true");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Paragraph");
	oElement.setAttribute("value", "p");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Address");
	oElement.setAttribute("value", "address");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Preformatted");
	oElement.setAttribute("value", "pre");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 1");
	oElement.setAttribute("value", "h1");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 2");
	oElement.setAttribute("value", "h2");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 3");
	oElement.setAttribute("value", "h3");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 4");
	oElement.setAttribute("value", "h4");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 5");
	oElement.setAttribute("value", "h5");
	oElement	= oPopup.appendChild(ample.createElementNS(this.namespaceURI, "xul:menuitem"));
	oElement.setAttribute("label", "Heading 6");
	oElement.setAttribute("value", "h6");
};

cXULElement_editor.prototype	= new cXULInputElement("editor");
cXULElement_editor.prototype.$selectable	= true;

cXULElement_editor.prototype.contentDocument	= null;

cXULElement_editor.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer("frame").contentWindow.focus();
	},
	"blur":		function(oEvent) {
		var oNode	= this.firstChild || this.appendChild(this.ownerDocument.createCDATASection()),
			sHtml	= cXULElement_editor.sanityze(this.contentDocument.body.innerHTML);
		if (sHtml != oNode.data) {
			oNode.replaceData(0, oNode.length, sHtml);
						cXULInputElement.dispatchChange(this);
		}
		if (window.controllers)
			document.body.focus();
		else
			window.focus();
				cXULElement_editor.resetButtons(this);
	},
	"DOMCharacterDataModified":	function() {
		if (this.firstChild.data != this.contentDocument.body.innerHTML)
			this.contentDocument.body.innerHTML	= this.firstChild.data;
	},
	"DOMNodeInsertedIntoDocument":	function() {
		var oDOMElement	= this.$getContainer("frame"),
			bGecko	= navigator.userAgent.match(/Gecko\/([\d\.]+)/),
			bEnabled	= this.$isAccessible(),
			that	= this;
		if (bEnabled) {
			if (!bGecko)
				oDOMElement.contentWindow.document.designMode	= "on";
			setTimeout(function(){
				if (bGecko)
					oDOMElement.contentWindow.document.designMode	= "on";
				setTimeout(function(){
					cXULElement_editor.initializeDocument(that);
				}, 0);
			}, 0);
		}
	},
	"DOMNodeRemovedFromDocument":	function() {
		cXULElement_editor.finalizeDocument(this);
	}
};

cXULElement_editor.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		this.$getContainer("frame").contentWindow.document.designMode	= sValue == "true" ? "off" : "on";
					cXULElement_editor.resetButtons(this);
				if (navigator.userAgent.match(/MSIE ([\d\.]+)/)) {
			var that	= this;
			cXULElement_editor.finalizeDocument(that);
			setTimeout(function() {
				cXULElement_editor.initializeDocument(that);
			}, 0);
		}
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_editor.commands	= [
		[
		["undo",	"Undo",		ample.locale.localize("xul.editor.button.undo")],
		["redo",	"Redo",		ample.locale.localize("xul.editor.button.redo")]
	],
	[
		["justifyleft",	"Left",		ample.locale.localize("xul.editor.button.justifyleft")],
		["justifycenter",	"Center",	ample.locale.localize("xul.editor.button.justifycenter")],
		["justifyright",	"Right",	ample.locale.localize("xul.editor.button.justifyright")],
		["justifyfull",		"None",		ample.locale.localize("xul.editor.button.justifyfull")]
	],
	[
		["outdent",		"Outdent",	ample.locale.localize("xul.editor.button.outdent")],
		["indent",		"Indent",	ample.locale.localize("xul.editor.button.indent")]
	],
	[
		["insertunorderedlist",		"Unordered",	ample.locale.localize("xul.editor.button.insertunorderedlist")],
		["insertorderedlist",		"Ordered",		ample.locale.localize("xul.editor.button.insertorderedlist")]
	],
	[
		["createlink",	"Link",		ample.locale.localize("xul.editor.button.createlink")],
		["unlink",		"Unlink",	ample.locale.localize("xul.editor.button.unlink")]
	],
	[
		["bold",			"Bold",				ample.locale.localize("xul.editor.button.bold")],
		["italic",			"Emphasis",			ample.locale.localize("xul.editor.button.italic")],
		["underline",		"Underline",		ample.locale.localize("xul.editor.button.underline")],
		["strikethrough",	"Strikethrough",	ample.locale.localize("xul.editor.button.strikethrough")]
	],
	[
		["subscript",		"Subscript",		ample.locale.localize("xul.editor.button.subscript")],
		["superscript",		"Superscript",		ample.locale.localize("xul.editor.button.superscript")]
	]
	
];

cXULElement_editor.htmlmap	= [
		[/<(B|b|STRONG)>(.*?)<\/\1>/gm, "<strong>$2</strong>"],
	[/<(I|i|EM)>(.*?)<\/\1>/gm, "<em>$2</em>"],
	[/<P>(.*?)<\/P>/gm, "<p>$1</p>"],
	[/<A (.*?)<\/A>/gm, "<a $1</a>"],
	[/<LI>(.*?)<\/LI>/gm, "<li>$1</li>"],
	[/<UL>(.*?)<\/UL>/gm, "<ul>$1</ul>"],
	[/<span style="font-weight: normal;">(.*?)<\/span>/gm, "$1"],
	[/<span style="font-weight: bold;">(.*?)<\/span>/gm, "<strong>$1</strong>"],
	[/<span style="font-style: italic;">(.*?)<\/span>/gm, "<em>$1</em>"],
	[/<span style="(font-weight: bold; ?|font-style: italic; ?){2}">(.*?)<\/span>/gm, "<strong><em>$2</em></strong>"],
	[/<([a-z]+) style="font-weight: normal;">(.*?)<\/\1>/gm, "<$1>$2</$1>"],
	[/<([a-z]+) style="font-weight: bold;">(.*?)<\/\1>/gm, "<$1><strong>$2</strong></$1>"],
	[/<([a-z]+) style="font-style: italic;">(.*?)<\/\1>/gm, "<$1><em>$2</em></$1>"],
	[/<([a-z]+) style="(font-weight: bold; ?|font-style: italic; ?){2}">(.*?)<\/\1>/gm, "<$1><strong><em>$3</em></strong></$1>"],
	[/<(br|BR)>/g, "<br />"],
	[/<(hr|HR)( style="width: 100%; height: 2px;")?>/g, "<hr />"]
];

cXULElement_editor.sanityze	= function(sHtml) {
	for (var nIndex = 0; nIndex < cXULElement_editor.htmlmap.length; nIndex++)
		sHtml	= sHtml.replace(cXULElement_editor.htmlmap[nIndex][0], cXULElement_editor.htmlmap[nIndex][1]);

	return sHtml.replace(/<a( target="_blank")?/g, '<a target="_blank"')
				.replace(/\r?\n/g, "")
				.replace(/<br\s*\/>$/, "")
	;
};

cXULElement_editor.initializeDocument	= function(oInstance) {
	var oDOMElement		= oInstance.$getContainer("frame"),
		oDOMDocument	= oDOMElement.contentWindow.document;

		var sStyle	= '0<style type="text/css">p{margin:0}html,body{margin:0;padding:0}body{padding-left:2px;height:100%;background-color:transparent}</style>',			oFactory= oDOMDocument.createElement("div");
	oFactory.innerHTML	= sStyle;
	oDOMDocument.getElementsByTagName("head")[0].appendChild(oFactory.childNodes[1]);
		oInstance.contentDocument	= oDOMDocument;
		oDOMDocument.body.innerHTML	= oInstance.firstChild ? oInstance.firstChild.data : '';

		var fOnMouseDown	= function(oEvent) {
				if (oInstance.$isAccessible()) {
			try {
				oDOMElement.contentWindow.document.designMode	= "on";
			} catch (e) {
				var f	= arguments.callee
				setTimeout(function(){f(oEvent)}, 0);
				return;
			}

			var oMouseEvent	= oInstance.ownerDocument.createEvent("MouseEvent");
			oMouseEvent.initMouseEvent("mousedown", true, true, window, 1, oEvent.screenX, oEvent.screenY, oEvent.clientX, oEvent.clientY, oEvent.ctrlKey, oEvent.altKey, oEvent.shiftKey, oEvent.metaKey, 0, null);
			oMouseEvent.$pseudoTarget	= oInstance.$getContainer("frame");
			oInstance.dispatchEvent(oMouseEvent);
		}
	};
	function fOnKeyUp(oEvent) {
		if (oEvent.keyCode == 9 && oInstance.ownerDocument.activeElement == oInstance)
			fUpdateState(oEvent);
	};
	function fOnKeyDown(oEvent) {
				if (oInstance.$isAccessible() && oEvent.keyCode == 9) {
			var oKeydownEvent	= oInstance.ownerDocument.createEvent("KeyboardEvent");
			oKeydownEvent.initKeyboardEvent("keydown", true, true, window, "U+0009", null, (oEvent.ctrlKey ? "Control" : "") + (oEvent.shiftKey ? "Shift" : "") + (oEvent.altKey ? "Alt" : ""));
			oKeydownEvent.$pseudoTarget	= oInstance.$getContainer("frame");
			oInstance.dispatchEvent(oKeydownEvent);
			if (!window.controllers) {
				if (oEvent.preventDefault)
					oEvent.preventDefault();
				else
					oEvent.returnValue	= false;
			}
		}
				if (window.controllers)
			if (oEvent.ctrlKey) {
				switch (oEvent.keyCode) {
					case 66:							this.execCommand('bold', false, null);
						oEvent.preventDefault();
						break;
					case 73:							this.execCommand('italic', false, null);
						oEvent.preventDefault();
						break;
					case 85:							this.execCommand('underline', false, null);
						oEvent.preventDefault();
						break;
				}
			}
	};
	var fUpdateState	= function(oEvent) {
		if (oInstance.$isAccessible())
			cXULElement_editor.updateButtons(oInstance);
	};
	if (oDOMDocument.addEventListener) {
		oDOMDocument.addEventListener("mouseup", fUpdateState, true);
		oDOMDocument.addEventListener("keyup", fOnKeyUp, true);
		oDOMDocument.addEventListener("keydown", fOnKeyDown, false);
		oDOMDocument.addEventListener("mousedown", fOnMouseDown, true);
	}
	else {
		oDOMDocument.attachEvent("onmouseup", fUpdateState);
		oDOMDocument.attachEvent("onkeyup", fOnKeyUp);
		oDOMDocument.attachEvent("onkeydown", fOnKeyDown);
		oDOMDocument.attachEvent("onmousedown", fOnMouseDown);
	}
};

cXULElement_editor.finalizeDocument	= function(oInstance) {
	var oDOMDocument	= oInstance.$getContainer("frame").contentWindow.document;

};

cXULElement_editor.prototype._onButtonClick	= function(sCommand) {
	var oWindow	= this.$getContainer('frame').contentWindow,
		vValue	= null;
		if (!this.$isAccessible())		return;
		if (sCommand == "createlink")
		vValue	= prompt("Enter the URL:", "http://");
	oWindow.focus();
	oWindow.document.execCommand(sCommand, false, vValue);
	cXULElement_editor.updateButtons(this);
};

cXULElement_editor.fontSizeValueInPixels	= [0, 10, 13, 16, 18, 24, 32, 48];
cXULElement_editor.fontSizeValueInPoints	= [0, 8, 10, 12, 14, 18, 24, 36];
cXULElement_editor.fontSizeValueToFontSizeNumber	= function(sValue) {
	var aFontSize	= sValue.match(/(\d*)(px|pt)?/);
	if (aFontSize[2] == "px")
		return cXULElement_editor.fontSizeValueInPixels.indexOf(Number(aFontSize[1]));
	else
	if (aFontSize[2] == "pt")
		return cXULElement_editor.fontSizeValueInPoints.indexOf(Number(aFontSize[1]));
	return aFontSize[1];
};

cXULElement_editor.updateButtons	= function(oInstance) {
	var oDOMDocument	= oInstance.$getContainer('frame').contentWindow.document,
		oToolBar	= oInstance.$getContainer("toolbar"),
		oButton,
		sCommand,
		sValue,
		oItem;
		for (var nGroup = 0; nGroup < cXULElement_editor.commands.length; nGroup++)
		for (var nIndex = 0; nIndex < cXULElement_editor.commands[nGroup].length; nIndex++) {
			oButton	= oToolBar.getElementsByTagName("p")[nGroup].getElementsByTagName("button")[nIndex];
			sCommand= cXULElement_editor.commands[nGroup][nIndex][0];
			if (sCommand != "indent" && sCommand != "outdent" && sCommand != "createlink" && sCommand != "unlink" && sCommand != "undo" && sCommand != "redo") {
								if (oDOMDocument.queryCommandState(sCommand)) {
					if (!oButton.className.match(/ xul-button_active/))
						oButton.className += " xul-button_active";
				}
				else
					oButton.className	= oButton.className.replace(/ xul-button_active/, '');
			}
						if (!oDOMDocument.queryCommandEnabled(sCommand)) {
				if (!oButton.className.match(/ xul-button_disabled/))
					oButton.className += " xul-button_disabled";
			}
			else
				oButton.className	= oButton.className.replace(/ xul-button_disabled/, '');
		}
		sValue	= String(oDOMDocument.queryCommandValue("fontname")).replace(/^'|'$/g, '');
	oItem	= oInstance._elementFontName.menupopup.querySelector("[value='" + sValue + "']");
	oInstance._elementFontName.setAttribute("disabled", !oDOMDocument.queryCommandEnabled("fontname"));
	oInstance._elementFontName.menupopup.selectItem(oItem);
	oInstance._elementFontName.setAttribute("value", oItem ? oItem.getAttribute("label") : '');
	sValue	= cXULElement_editor.fontSizeValueToFontSizeNumber(String(oDOMDocument.queryCommandValue("fontsize")));
	oItem	= oInstance._elementFontSize.menupopup.querySelector("[value='" + sValue + "']");
	oInstance._elementFontSize.setAttribute("disabled", !oDOMDocument.queryCommandEnabled("fontsize"));
	oInstance._elementFontSize.menupopup.selectItem(oItem);		oInstance._elementFontSize.setAttribute("value", oItem ? oItem.getAttribute("label") : '');
	sValue	= String(oDOMDocument.queryCommandValue("formatblock")).toLowerCase();
	oItem	= oInstance._elementFormat.menupopup.querySelector("[value='" + sValue + "']");
	oInstance._elementFormat.setAttribute("disabled", !oDOMDocument.queryCommandEnabled("formatblock"));
	oInstance._elementFormat.menupopup.selectItem(oItem);
	oInstance._elementFormat.setAttribute("value", oItem ? oItem.getAttribute("label") : '');
};

cXULElement_editor.resetButtons	= function(oInstance) {
	var oDOMDocument	= oInstance.$getContainer('frame').contentWindow.document,
		oToolBar	= oInstance.$getContainer("toolbar"),
		oButton,
		sCommand;
		for (var nGroup = 0; nGroup < cXULElement_editor.commands.length; nGroup++)
		for (var nIndex = 0; nIndex < cXULElement_editor.commands[nGroup].length; nIndex++) {
			oButton	= oToolBar.getElementsByTagName("p")[nGroup].getElementsByTagName("button")[nIndex];
			sCommand= cXULElement_editor.commands[nGroup][nIndex][0];
			oButton.className	= oButton.className.replace(/ xul-button_active/, '');
			if (!oButton.className.match(/ xul-button_disabled/))
				oButton.className += " xul-button_disabled";
		}
	oInstance._elementFontName.setAttribute("disabled", "true");
	oInstance._elementFontSize.setAttribute("disabled", "true");
	oInstance._elementFormat.setAttribute("disabled", "true");
};

cXULElement_editor.prototype.$getTagOpen	= function() {
	return '<div class="xul-editor' + (this.getAttribute("disabled") == "true" ? ' xul-editor_disabled' : '') + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"' + (this.hasAttribute("style") ? ' style="' + this.getAttribute("style") + '"' : '')+ '>\
				<div class="xul-editor--toolbar" style="position:relative" xonmousedown="return false">\
					<div>'+
						(function(){
							var aHtml	= [];
							for (var nGroup = 0; nGroup < 5; nGroup++) {
								aHtml.push('<p class="xul-editor-buttonbar" style="display:inline' + (navigator.userAgent.match(/MSIE ([\d\.]+)/) && RegExp.$1 < 8 ? '' : '-block') + '">');
								for (var nIndex = 0; nIndex < cXULElement_editor.commands[nGroup].length; nIndex++)
									aHtml.push('<button class="xul-button ' + cXULElement_editor.commands[nGroup][nIndex][0] + ' xul-button_disabled" \
													title="' + cXULElement_editor.commands[nGroup][nIndex][2] + '"\
													onclick="ample.$instance(this)._onButtonClick(\'' + cXULElement_editor.commands[nGroup][nIndex][0] + '\')"\
													onmouseover="if (ample.$instance(this).$isAccessible()) this.className += \' xul-button_hover\'"\
													onmouseout="if (ample.$instance(this).$isAccessible()) this.className = this.className.replace(/ xul-button_hover/, \'\')"\
													></button>');
								aHtml.push('</p>');
							}
							return aHtml.join('');
						})()+'\
					</div>\
					<div>'+
						(function(){
							var aHtml	= [];
							for (var nGroup = 5; nGroup < cXULElement_editor.commands.length; nGroup++) {
								aHtml.push('<p class="xul-editor-buttonbar" style="display:inline' + (navigator.userAgent.match(/MSIE ([\d\.]+)/) && RegExp.$1 < 8 ? '' : '-block') + '">');
								for (var nIndex = 0; nIndex < cXULElement_editor.commands[nGroup].length; nIndex++)
									aHtml.push('<button class="xul-button ' + cXULElement_editor.commands[nGroup][nIndex][0] + ' xul-button_disabled" \
													title="' + cXULElement_editor.commands[nGroup][nIndex][2] + '"\
													onclick="ample.$instance(this)._onButtonClick(\'' + cXULElement_editor.commands[nGroup][nIndex][0] + '\')"\
													onmouseover="if (ample.$instance(this).$isAccessible()) this.className += \' xul-button_hover\'"\
													onmouseout="if (ample.$instance(this).$isAccessible()) this.className = this.className.replace(/ xul-button_hover/, \'\')"\
													></button>');
								aHtml.push('</p>');
							}
							return aHtml.join('');
						})()+'\
						<div class="xul-editor-buttonbar" style="display:inline' + (navigator.userAgent.match(/MSIE ([\d\.]+)/) && RegExp.$1 < 8 ? '' : '-block') + '">' +
							'<a href="javascript:;" style="color:black;text-decoration:none;cursor:default;">' + this._elementFontName.$getTag() + '</a>' +
							'<a href="javascript:;" style="color:black;text-decoration:none;cursor:default;">' + this._elementFontSize.$getTag() + '</a>' +
							'<a href="javascript:;" style="color:black;text-decoration:none;cursor:default;">' + this._elementFormat.$getTag() + '</a>' +'\
						</div>\
					</div>\
				</div>\
				<div class="xul-editor--input" style="position:relative;height:100%;">\
					<iframe class="xul-editor--frame" src="about:blank" frameborder="0" allowtransparency="true" style="width:100%;height:100%"></iframe>\
				</div>\
				<div class="xul-editor--gateway" style="display:none">';
};

cXULElement_editor.prototype.$getTagClose	= function() {
	return		'</div>\
			</div>';
};

ample.extend(cXULElement_editor);


var cXULElement_grid	= function() {
	this.cols	= new ample.classes.NodeList;
	this.rows	= new ample.classes.NodeList;
};
cXULElement_grid.prototype	= new cXULElement("grid");

cXULElement_grid.prototype.$getTagOpen	= function() {
	var sWidth	= this.attributes.width,
		sHeight	= this.attributes.height;
	return '<div class="xul-grid' +(this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
		(sWidth ? 'width:' + (isNaN(parseInt(sWidth)) ? sWidth : sWidth + 'px;') : '')+
		(sHeight ? 'height:' + (isNaN(parseInt(sHeight)) ? sHeight : sHeight + 'px;') : '')+
	'">';
};

cXULElement_grid.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_grid);


var cXULElement_groupbox	= function(){};
cXULElement_groupbox.prototype	= new cXULElement("groupbox");
cXULElement_groupbox.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_groupbox.attributes	= {};
cXULElement_groupbox.attributes.orient	= "vertical";


cXULElement_groupbox.prototype.$getTagOpen		= function() {
	var sWidth	= this.attributes.width,
		sHeight	= this.attributes.height;
	return '<div class="xul-groupbox' +(this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
			(sWidth ? 'width:' + (isNaN(parseInt(sWidth)) ? sWidth : sWidth + 'px;') : '')+
			(sHeight ? 'height:' + (isNaN(parseInt(sHeight)) ? sHeight : sHeight + 'px;') : '')+
				'">\
				<table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">\
					<thead>\
						<tr>\
							<td class="xul-groupbox-head-left"></td>\
							<td class="xul-groupbox-head"><span class="xul-groupbox--caption xul-caption" style="display:none;"></span></td>\
							<td class="xul-groupbox-head-right"></td>\
						</tr>\
					</thead>\
					<tbody>\
						<tr>\
							<td class="xul-groupbox-body-left"></td>\
							<td height="100%" class="xul-groupbox-body">';
};

cXULElement_groupbox.prototype.$getTagClose	= function() {
	return 					'</td>\
							<td class="xul-groupbox-body-right"></td>\
						</tr>\
					</tbody>\
					<tfoot>\
						<tr>\
							<td class="xul-groupbox-foot-left"></td>\
							<td class="xul-groupbox-foot"></td>\
							<td class="xul-groupbox-foot-right"></td>\
						</tr>\
					</tfoot>\
				</table>\
			</div>';
};

ample.extend(cXULElement_groupbox);


var cXULElement_hbox	= function(){};
cXULElement_hbox.prototype	= new cXULElement_box;
cXULElement_hbox.prototype.localName	= "hbox";

cXULElement_hbox.attributes	= {};
cXULElement_hbox.attributes.orient	= "horizontal";

ample.extend(cXULElement_hbox);


var cXULElement_iframe	= function(){};
cXULElement_iframe.prototype	= new cXULElement("iframe");
cXULElement_iframe.prototype.tabIndex	= 0;

cXULElement_iframe.prototype.contentDocument	= null;
cXULElement_iframe.prototype.contentWindow		= null;

cXULElement_iframe.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "src")
		this.$getContainer().src	= sValue || "about:blank";
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_iframe.prototype._onLoad	= function(oEvent) {
	this.contentWindow		= this.$getContainer().contentWindow;
	this.contentDocument	= this.$getContainer().contentDocument;

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("load", false, false);
	this.dispatchEvent(oEvent);
};

cXULElement_iframe.prototype._onUnLoad	= function(oEvent) {
	this.contentWindow		= null;
	this.contentDocument	= null;

		var oEvent	= this.ownerDocument.createEvent("Event");
	oEvent.initEvent("unload", false, false);
	this.dispatchEvent(oEvent);
};

cXULElement_iframe.prototype.$getTagOpen	= function() {
	return '<iframe class="xul-iframe' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" height="' +(this.attributes["height"] || '100%')+ '" width="' +(this.attributes["width"] || '100%')+ '" src="' + (this.attributes["src"] ? ample.$encodeXMLCharacters(this.attributes["src"]) : 'about:blank') + '" frameborder="0" border="0" scrolling="no" onload="ample.$instance(this)._onLoad(event)" onunload="ample.$instance(this)._onUnLoad(event)">';
};

cXULElement_iframe.prototype.$getTagClose	= function() {
	return '</iframe>';
};

ample.extend(cXULElement_iframe);


var cXULElement_image	= function(){};
cXULElement_image.prototype	= new cXULElement("image");

cXULElement_image.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "src")
		this.$getContainer().src	= sValue || "about:blank";
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_image.prototype._onLoad	= function(oEvent) {
		var oEvent2	= this.ownerDocument.createEvent("Event");
	oEvent2.initEvent("load", false, false);
	this.dispatchEvent(oEvent2);
};

cXULElement_image.prototype.$getTagOpen	= function() {
	return '<img class="xul-image' +(this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' +(this.attributes["width"] ? ' width="' + this.attributes["width"] + '"' : '')+(this.attributes["height"] ? ' height="' + this.attributes["height"] + '"' : '') + (this.attributes["src"] ? ' src="' + ample.$encodeXMLCharacters(this.attributes["src"]) + '"' :'') + ' onload="ample.$instance(this)._onLoad(event)"/>';
};

ample.extend(cXULElement_image);


var cXULElement_key	= function(){};
cXULElement_key.prototype	= new cXULElement("key");
cXULElement_key.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

cXULElement_key._handleKeyDown	= function(oEvent, oElement) {
		if (oElement.hasAttribute("modifiers")) {
		var aModifiers	= oElement.getAttribute("modifiers").replace(/,/g, " ").split(" ");
		for (var nIndex = 0; nIndex < aModifiers.length; nIndex++) {
			switch (aModifiers[nIndex]) {
				case "shift":	if (!oEvent.shiftKey)	return;	break;
				case "alt":		if (!oEvent.altKey)		return;	break;
				case "meta":	if (!oEvent.metaKey)	return;	break;
				case "control":	if (!oEvent.ctrlKey)	return;	break;
			}
		}
	}

		if (oElement.hasAttribute("key")) {
		var sIdentifier	= oEvent.keyIdentifier,
			sKey	= oElement.getAttribute("key");
		if (sIdentifier.match(/^U\+(\d+)/)) {
			if (String.fromCharCode(parseInt(RegExp.$1, 16)).toLowerCase() != sKey.toLowerCase())
				return;
		}
		else
		if (oEvent.keyIdentifier != sKey)
			return;
	}

			if (oElement.hasAttribute("keycode"))
		if (oElement.getAttribute("keycode") != oEvent.keyCode)
			return;

		oElement.doCommand();
};

cXULElement_key.handlers	= {
	"DOMAttrModified" : function (oEvent) {
		if (oEvent.target == this) {
			switch (oEvent.attrName) {
				case "keytext":
					var aElements	= this.ownerDocument.querySelectorAll("[key='" + this.attributes["id"] + "']");
					for (var nIndex = 0, nLength = aElements.length; nIndex < nLength; nIndex++)
						if (aElements[nIndex].namespaceURI == this.namespaceURI)
							aElements[nIndex].setAttribute("acceltext", oEvent.newValue || '');
					break;
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		var oElement	= oEvent.target;
		this.ownerDocument.addEventListener("keydown", function(oEvent){cXULElement_key._handleKeyDown(oEvent, oElement)}, false);
	}
};

ample.extend(cXULElement_key);


var cXULElement_keyset	= function(){};
cXULElement_keyset.prototype	= new cXULElement("keyset");
cXULElement_keyset.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;


ample.extend(cXULElement_keyset);


var cXULElement_label	= function(){};
cXULElement_label.prototype	= new cXULElement("label");


cXULElement_label.handlers	= {
	"click":	function(oEvent) {
		if (oEvent.button == 0)
			this.$activate();
	},
	"DOMActivate":	function(oEvent) {
		var oControl;
		if (!oEvent.defaultPrevented)
			if (this.attributes["control"] && (oControl = this.ownerDocument.getElementById(this.attributes["control"])))
				oControl.focus();
	}
};

cXULElement_label.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.$getContainer().innerHTML	= sValue || '';
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_label.prototype.$getTagOpen	= function() {
	return '<label class="xul-label' +(this.attributes["class"] ? " " + this.attributes["class"] : "")+ '">' + (this.attributes["value"] ? ample.$encodeXMLCharacters(this.attributes["value"]) : '');
};

cXULElement_label.prototype.$getTagClose	= function() {
	return '</label>';
};

ample.extend(cXULElement_label);


var cXULElement_listbody	= function(){};
cXULElement_listbody.prototype	= new cXULElement("listbody");


cXULElement_listbody.prototype._onScroll	= function() {
	if (this.parentNode.head)
		this.parentNode.head.$getContainer("area").scrollLeft	= this.$getContainer("area").scrollLeft;
};


cXULElement_listbody.prototype.$getTagOpen	= function() {
	var bOldTrident	= navigator.userAgent.match(/MSIE ([\d.]+)/) && RegExp.$1 < 8;
	return '<tr' +(this.attributes["hidden"] == "true" ? ' style="display:hidden;"' : '')+ '>\
				<td style="height:100%">\
					<div class="xul-listbody--area" style="height:100%;overflow:scroll;position:relative;" onscroll="return ample.$instance(this)._onScroll(event)">\
						' + (bOldTrident ? '<div style="position:absolute;border-left: solid 18px white;margin-left:-18px;">' : '')+'\
						<table cellpadding="0" cellspacing="0" border="0" class="xul-listbody' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' + (!bOldTrident ? ' style="position:absolute"' : '')+ '>\
							<tbody class="xul-listbody--gateway">';
};

cXULElement_listbody.prototype.$getTagClose	= function() {
	var bOldTrident	= navigator.userAgent.match(/MSIE ([\d.]+)/) && RegExp.$1 < 8;
	var aHtml	= ['</tbody>'];
	if (this.parentNode.firstChild instanceof cXULElement_listhead) {
		aHtml.push('<tfoot class="xul-listbody--foot">');
		aHtml.push('<tr>');
		if (this.parentNode.attributes["type"] == "checkbox" || this.parentNode.attributes["type"] == "radio")
			aHtml.push('<td width="20"><div style="width:20px;"></div></td>');
		for (var nIndex = 0, aItems = this.parentNode.firstChild.childNodes, oItem; oItem = aItems[nIndex]; nIndex++)
			aHtml.push('<td style="padding-top:0px;padding-bottom:0px;height:1px;' + (oItem.attributes["hidden"] == "true" ? 'display:none' : '') + '" class="xul-listcell"><div style="height:1px;' + (oItem.attributes["width"] ? 'width:' + oItem.attributes["width"] + 'px;' : '') + '"></div><div style="height:1px;' + (oItem.attributes["minwidth"] ? 'width:' + oItem.attributes["minwidth"] + 'px' : '') + '"></div></td>');
		aHtml.push('</tr>');
		aHtml.push('</tfoot>');
	}
	aHtml.push('</table>');
	if (bOldTrident)
		aHtml.push('</div>');
	aHtml.push('</div>');
	aHtml.push('</td>');
	aHtml.push('</tr>');

	return aHtml.join('');
};

ample.extend(cXULElement_listbody);


var cXULElement_listbox	= function() {
		this.items	= new ample.classes.NodeList;
	this.selectedItems	= new ample.classes.NodeList;
};
cXULElement_listbox.prototype	= new cXULSelectElement("listbox");

cXULElement_listbox.prototype.head	= null; cXULElement_listbox.prototype.body	= null; 

cXULElement_listbox.handlers	= {
	"keydown":	function(oEvent) {
		if (this.currentItem) {
			if (oEvent.keyIdentifier == "Up") {
								var nIndex	= this.selectedItems[this.selectedItems.length-1].$getContainer().rowIndex;
				if (nIndex > 0) {
					if (oEvent.shiftKey && this.getAttribute("seltype") !== "single") {
												if (this.selectedItems.length > 1)
							if (this.currentItem.$getContainer().rowIndex > this.selectedItems[0].$getContainer().rowIndex)
								nIndex++;

						this.toggleItemSelection(this.items[nIndex-1]);
					}
					else
					{
						this.selectItem(this.items[nIndex-1]);
					}

										this.scrollToIndex(nIndex-1);
				}

								oEvent.preventDefault();
			}
			else
			if (oEvent.keyIdentifier == "Down") {
								var nIndex	= this.selectedItems[this.selectedItems.length-1].$getContainer().rowIndex;
				if (nIndex < this.items.length-1) {
					if (oEvent.shiftKey && this.getAttribute("seltype") !== "single") {
												if (this.selectedItems.length > 1)
							if (this.currentItem.$getContainer().rowIndex < this.selectedItems[0].$getContainer().rowIndex)
								nIndex--;

						this.toggleItemSelection(this.items[nIndex+1]);
					}
					else
						this.selectItem(this.items[nIndex+1]);

										this.scrollToIndex(nIndex+1);
				}

								oEvent.preventDefault();
			}
		}
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this)
			if (oEvent.attrName == "seltype") {
				if (this.selectedItems.length) {
					this.selectItem(this.selectedItems[0]);
				}
			}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_listbody)
				this.body	= oEvent.target;
			else
			if (oEvent.target instanceof cXULElement_listhead)
				this.head	= oEvent.target;
		}
		else
		if (oEvent.target instanceof cXULElement_listitem) {
			if (oEvent.target.nextSibling)
				this.items.$add(oEvent.target, this.items.$indexOf(oEvent.target.nextSibling));
			else
				this.items.$add(oEvent.target);
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_listbody)
				this.body	= null;
			else
			if (oEvent.target instanceof cXULElement_listhead)
				this.head	= null;
		}
		else
		if (oEvent.target instanceof cXULElement_listitem) {
						if (this.selectedItems.$indexOf(oEvent.target) !=-1)
				this.removeItemFromSelection(oEvent.target);
						this.items.$remove(oEvent.target);
		}
	}
};

cXULElement_listbox.sort	= function(oInstance, nCell, bDir) {
		if (oInstance.attributes["type"] != "radio" && oInstance.attributes["type"] != "checkbox")
		nCell++;

	if (oInstance.items.length) {
		var aElements	= [];
		for (var nIndex = 0; nIndex < oInstance.items.length; nIndex++)
			aElements.push(oInstance.items[nIndex]);
		aElements.sort(function(oElement1, oElement2){return oElement1.cells[nCell-1].attributes["label"] > oElement2.cells[nCell-1].attributes["label"] ? bDir ? 1 :-1 : oElement1.cells[nCell-1].attributes["label"] == oElement2.cells[nCell-1].attributes["label"] ? 0 : bDir ?-1 : 1;});
		oInstance.items	= new ample.classes.NodeList;
		for (var nIndex = 0; nIndex < aElements.length; nIndex++)
			oInstance.items.$add(aElements[nIndex]);

		var oElementDOM	= oInstance.body.$getContainer("gateway");
		for (var nIndex = 0; nIndex < oInstance.items.length; nIndex++) {
			oElementDOM.appendChild(oInstance.items[nIndex].$getContainer());
			if (oInstance.items[nIndex].attributes["selected"] == "true")
				oInstance.items[nIndex].setAttribute("selected", "true");
		}
	}
};

cXULElement_listbox.prototype.$getTagOpen	= function() {
	var sHeight	= this.attributes["height"],
		sWidth	= this.attributes["width"];
	return '<div class="xul-listbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? " xul-listbox_disabled" : "") + '" style="' + (sHeight ? 'height:' + (sHeight * 1 == sHeight ? sHeight + "px" : sHeight) + ';' : '') + (sWidth ? 'width:' + (sWidth * 1 == sWidth ? sWidth + "px" : sWidth) + ';' : '') + (this.attributes["style"] ? this.attributes["style"] + '' : '') + '">\
				<div style="position:relative;height:100%;top:0;padding-bottom:inherit;">\
					<div class="xul-listbox--resizer" style="height:100%;position:absolute;top:0px;display:none;z-index:1"></div>\
					<table cellpadding="0" cellspacing="0" border="0" height="100%" width="100%" style="position:absolute">\
						<tbody class="xul-listbox--gateway">';
};

cXULElement_listbox.prototype.$getTagClose	= function() {
	return 				'</tbody>\
					</table>\
					</div>\
			</div>';
};

ample.extend(cXULElement_listbox);


var cXULElement_listcell	= function(){};
cXULElement_listcell.prototype	= new cXULElement("listcell");



cXULElement_listcell.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "label")
		this.$getContainer("gateway").innerHTML	=(this.attributes["src"] ? '<img src="' + this.attributes["src"] + '" align="absmiddle" /> ' :'') + (sValue || '');
	else
	if (sName == "src")
		this.$getContainer("gateway").innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" /> ' :'') + (this.attributes["label"] || '');
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_listcell.prototype.$getTagOpen	= function() {
	var oHeader	= this.parentNode.parentNode.parentNode.firstChild.childNodes[this.parentNode.childNodes.$indexOf(this)];
	var sHtml	= '<td class="xul-listcell' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' + (oHeader && oHeader.attributes["hidden"] == "true" ? ' style="display:none;"' : '') + '><div class="xul-listcell--box" style="position:relative;width:100%;"><div class="xul-listcell--label xul-listcell--gateway" style="position:absolute;width:100%;overflow:hidden;">';
	if (this.attributes["image"])
		sHtml	+= '<img src="' + ample.$encodeXMLCharacters(this.attributes["image"]) + '" align="absmiddle"/> ';
	if (this.attributes["label"])
		sHtml	+= ample.$encodeXMLCharacters(this.attributes["label"]);

	return sHtml;
};

cXULElement_listcell.prototype.$getTagClose	= function() {
	return '</div></div></td>';
};

ample.extend(cXULElement_listcell);


var cXULElement_listcol	= function(){};
cXULElement_listcol.prototype	= new cXULElement("listcol");

cXULElement_listcol.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "sortDirection") {
							}
		}
	}
};

cXULElement_listcol.prototype.$getTagOpen	= function() {
	return '<td class="xul-listcol' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></td>';
};

ample.extend(cXULElement_listcol);


var cXULElement_listcols	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_listcols.prototype	= new cXULElement("listcols");

cXULElement_listcols.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listcol)
				this.items.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listcol)
				this.items.$remove(oEvent.target);
	}
};

cXULElement_listcols.prototype.$getTagOpen	= function() {
	return '<table cellpadding="0" cellspacing="0" border="0" width="100%" class="xul-listcols' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
				<tbody>\
					<tr>';
};

cXULElement_listcols.prototype.$getTagClose	= function() {
	return			'</tr>\
				</tbody>\
			</table>';
};

ample.extend(cXULElement_listcols);


var cXULElement_listhead	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_listhead.prototype	= new cXULElement("listhead");

cXULElement_listhead.$isAccessible	= function() {
	return this.parentNode ? this.parentNode.$isAccessible() : true;
};

cXULElement_listhead.prototype._getPrimaryColIndex	= function() {
	for (var nIndex = 0; nIndex < this.items.length; nIndex++)
		if (this.items[nIndex].attributes["primary"] == "true")
			return nIndex;
	return -1;
};

cXULElement_listhead.prototype._onCommandClick	= function(oEvent) {
	if (this.parentNode.attributes["type"] == "checkbox") {
		if (this.$getContainer("command").checked)
			this.parentNode.selectAll();
		else
			this.parentNode.clearSelection();
	}
	else
	if (this.parentNode.attributes["type"] == "radio") {
		if (this.$getContainer("command").checked)
			this.parentNode.clearSelection();
	}
};

cXULElement_listhead.handlers	= {
	"click":	function(oEvent) {
		if (!this.$isAccessible() || !this.parentNode.$isAccessible() || !this.parentNode.parentNode.$isAccessible())
			return;

		if (oEvent.button == 2 || (oEvent.button == 0 && oEvent.target == this && oEvent.$pseudoTarget == this.$getContainer("settings"))) {
			var oPopup	= cXULSelectElement.getSettingsPopup(this);
			oPopup.showPopup(this, 0, 0, cXULPopupElement.POPUP_TYPE_POPUP);

			if (oEvent.button == 2) {
								var oPositionPopup	= oPopup.getBoundingClientRect();
								oPopup.moveTo(	oEvent.clientX - oPositionPopup.left,
								oEvent.clientY - oPositionPopup.top);

								oEvent.preventDefault();
			}
			else {
								var oPositionPopup	= oPopup.getBoundingClientRect(),
					oPositionSelf	= this.getBoundingClientRect();
								oPopup.moveTo(	oPositionSelf.right - oPositionPopup.right,
								oPositionSelf.bottom - oPositionPopup.top);
			}

			this.ownerDocument.popupNode	= oPopup;
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listheader)
				this.items.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listheader)
				this.items.$remove(oEvent.target);
	}
};

cXULElement_listhead.prototype.$getTagOpen	= function() {
	return '<tr' + (this.attributes["hidden"] == "true" ? ' style="display:none"' : '') + '>\
				<td class="xul-listhead--container">\
					<div class="xul-listheader" style="float:right;width:16px"><div class="xul-listhead--settings"><br /></div></div>\
					<div class="xul-listhead--area" style="height:20px;overflow:hidden;position:relative;">\
						<table cellpadding="0" cellspacing="0" border="0" style="position:absolute;" class="xul-listhead' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
							<tbody>\
								<tr class="xul-listhead--gateway" style="height:1em;vertical-align:top">' +
									(this.parentNode.attributes["type"] == "checkbox" || this.parentNode.attributes["type"] == "radio"
									? ('<td class="xul-listheader" style="width:20px;padding:0;">' +
											'<div>' +
												(this.parentNode.attributes["type"] == "checkbox"
												? '<input type="checkbox" name="' + this.parentNode.uniqueID + '_cmd" class="xul-listheader--command" onclick="return ample.$instance(this)._onCommandClick(event)" autocomplete="off" />'
												: (this.parentNode.attributes["type"] == "radio"
													? '<input type="radio" name="' + this.parentNode.uniqueID + '_cmd" class="xul-listheader--command" checked="true" onclick="return ample.$instance(this)._onCommandClick(event)"/>'
													: ' ')) +
											'</div>' +
											'<div style="height:1pt;font-size:1px;width:20px;"></div>'+
										'</td>')
									: '');
};

cXULElement_listhead.prototype.$getTagClose	= function() {
	return 						'</tr>\
							</tbody>\
						</table>\
					</div>\
				</td>\
			</tr>';
};

ample.extend(cXULElement_listhead);


var cXULElement_listheader	= function(){};
cXULElement_listheader.prototype	= new cXULElement("listheader");
cXULElement_listheader.prototype.$hoverable	= true;

cXULElement_listheader.attributes	= {
	"minwidth":	"16",
	"sortDirection":	"natural"
};

cXULElement_listheader.prototype.$isAccessible	= function() {
	return this.parentNode ? this.parentNode.$isAccessible() : true;
};

cXULElement_listheader.handlers	= {
	"mouseleave":	function(oEvent) {
		this.$setPseudoClass("active", false);
	},
	"mousedown":	function(oEvent) {
		this.setCapture(true);
		cXULSelectElement.onResizeStart(oEvent);
		if (!cXULSelectElement.resizing)
			this.$setPseudoClass("active", true);
	},
	"mouseup":		function(oEvent) {
		this.releaseCapture();
		if (!cXULSelectElement.resizing)
			this.$setPseudoClass("active", false);
		cXULSelectElement.onResizeEnd(oEvent);
	},
	"mousemove":	function(oEvent) {
		cXULSelectElement.onResize(oEvent);
	},
	"click":		function(oEvent) {
		if (oEvent.button < 2 && oEvent.$pseudoTarget != this.$getContainer("resizer"))
			this.setAttribute("sortDirection", this.getAttribute("sortDirection") != "ascending" ? "ascending" : "descending");
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "hidden") {
				var nCell	= this.parentNode.items.$indexOf(this);
				for (var nIndex = 0, aItems = this.parentNode.parentNode.items; nIndex < aItems.length; nIndex++)
					aItems[nIndex].cells[nCell].setAttribute("hidden", oEvent.newValue);
			}
		}
	}
};

cXULElement_listheader.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "sortDirection")
		cXULElement_listbox.sort(this.parentNode.parentNode, this.$getContainer().cellIndex, sValue == "ascending");
	else
	if (sName == "width") {
		this.$getContainer("stretch").style.width	= sValue != null ? sValue + "px" : '';
		this.parentNode.parentNode.body.$getContainer("foot").rows[0].cells[this.parentNode.items.$indexOf(this) + (this.parentNode.parentNode.attributes["type"] ? 1 : 0)].getElementsByTagName("div")[0].style.width	= sValue != null ? sValue + "px" : '';
	}
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	= sValue || '';
	else
	if (sName == "hidden") {
		var nCell	= this.parentNode.items.$indexOf(this);
		this.$getContainer().style.display	= sValue == "true" ? "none" : "";
		this.parentNode.parentNode.body.$getContainer("foot").rows[0].cells[nCell + (this.parentNode.parentNode.attributes["type"] ? 1 : 0)].style.display	= sValue == "true" ? "none" : "";
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_listheader.prototype.$getTagOpen	= function() {
	return '<td class="xul-listheader' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' +(this.attributes["hidden"] == "true" ? ' style="display:none"' : "")+ '>\
				<div class="xul-listheader--box" style="position:relative;width:100%;">\
					<div class="xul-listheader--label xul-listheader--gateway" style="position:absolute;width:100%;overflow:hidden;"> ' + (this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : "");
};

cXULElement_listheader.prototype.$getTagClose	= function() {
	return			'</div>\
					<div class="xul-listheader--resizer" style="position: absolute;right:0px;"><br /></div>\
				</div>\
				<div class="xul-listheader--stretch" style="height:1pt;font-size:1px;' + (this.attributes["width"] ? 'width:' + this.attributes["width"] + 'px' : "") + '"></div>\
				<div style="height:1pt;font-size:1px;' + (this.attributes["minwidth"] ? 'width:' + this.attributes["minwidth"] + 'px' : '') + '"></div>\
			</td>';
};

ample.extend(cXULElement_listheader);


var cXULElement_listitem	= function() {
		this.cells	= new ample.classes.NodeList;
};
cXULElement_listitem.prototype	= new cXULElement("listitem");
cXULElement_listitem.prototype.$hoverable	= true;

cXULElement_listitem.handlers	= {
	"mousedown":	function(oEvent) {
		var oView	= this.parentNode.parentNode;
		if (!oView.$isAccessible())
			return;
				if (oEvent.button == 2 && oView.selectedItems.$indexOf(this) !=-1)
			return;

		if (oView.getAttribute("seltype") == "single") {
			oView.selectItem(this);
		} else {
			if (oEvent.shiftKey) {
				if (oView.currentItem)
					oView.selectItemRange(this, oView.currentItem);
			}
			else
			{
				if (oEvent.ctrlKey)
					oView.toggleItemSelection(this);
				else
					oView.selectItem(this);
			}
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listcell)
				this.cells.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_listcell)
				this.cells.$remove(oEvent.target);
	}
};

cXULElement_listitem.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "selected") {
		this.$setPseudoClass("selected", sValue == "true");
		if (this.parentNode.parentNode.attributes["type"] == "checkbox" || this.parentNode.parentNode.attributes["type"] == "radio")
			this.$getContainer("command").checked	= sValue == "true";
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_listitem.prototype.$isAccessible	= function() {
	var oParent	= this.parentNode;
	return oParent && oParent.parentNode ? oParent.parentNode.$isAccessible() : true;
};

cXULElement_listitem.prototype._onCommandClick	= function(oEvent) {
	if (this.$getContainer("command").checked) {
		if (this.parentNode.parentNode.attributes["type"] == "radio")
			this.parentNode.parentNode.selectItem(this);
		else
		if (this.parentNode.parentNode.attributes["type"] == "checkbox")
			this.parentNode.parentNode.addItemToSelection(this);
	}
	else {
		this.parentNode.parentNode.removeItemFromSelection(this);
	}
};

cXULElement_listitem.prototype.$getTagOpen	= function() {
	var oListBox	= this.parentNode.parentNode;
	return '<tr class="xul-listitem' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="height:1.2em;vertical-align:top">' +
				(this.attributes["label"] || (oListBox && (oListBox.attributes["type"] == "checkbox" || oListBox.attributes["type"] == "radio"))
				? ('<td style="padding:0" onmousedown="event.cancelBubble=true;" class="xul-listcell">' +
					(this.attributes["label"]
					? '<div class="xul-listcell--gateway">' + ample.$encodeXMLCharacters(this.attributes["label"]) + '</div>'
					: (this.parentNode.parentNode.attributes["type"] == "checkbox"
						? '<input type="checkbox" name="' + oListBox.uniqueID + '_cmd" class="xul-listitem--command" onclick="return ample.$instance(this)._onCommandClick(event);" autocomplete="off"/>'
							: (this.parentNode.parentNode.attributes["type"] == "radio"
							? '<input type="radio" name="' + oListBox.uniqueID + '_cmd" class="xul-listitem--command" onclick="return ample.$instance(this)._onCommandClick(event);"/>'
						: ' ')))+
				'</td>')
				: '');
};

cXULElement_listitem.prototype.$getTagClose	= function() {
	return '</tr>';
};

ample.extend(cXULElement_listitem);



var cXULElement_menu	= function(){};
cXULElement_menu.prototype	= new cXULElement("menu");

cXULElement_menu.prototype.$hoverable	= true;

cXULElement_menu.prototype.menupopup	= null;	
cXULElement_menu.handlers	= {
	"mouseenter":	function(oEvent) {
		if (this.parentNode.selectedItem || this.parentNode instanceof cXULElement_menupopup)
			this.parentNode.selectItem(this);
	},
	"mousedown":	function(oEvent) {
		if (oEvent.target == this) {
			if (!this.$isAccessible())
				return;

			if (oEvent.button == 0)
				this.$activate();
		}
	},
	"DOMActivate":	function(oEvent) {
		if (oEvent.target.parentNode instanceof cXULElement_menubar)
			this.parentNode.selectItem(this.parentNode.selectedItem == this ? null : this);
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menupopup)
				this.menupopup	= oEvent.target;
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menupopup)
				this.menupopup	= null;
		}
	}
};

cXULElement_menu.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "open") {
			}
	else
	if (sName == "selected") {
		this.$setPseudoClass("selected", sValue == "true");
		if (this.parentNode instanceof cXULElement_menupopup)
			this.$setPseudoClass("selected", sValue == "true", "arrow");
	}
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	= sValue;
	else
	if (sName == "image") {
		if (this.parentNode instanceof cXULElement_menupopup)
			this.$getContainer("image").style.backgroundImage	= sValue ? "url(" + sValue + ")" : '';
	}
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		if (this.parentNode instanceof cXULElement_menupopup)
			this.$setPseudoClass("disabled", sValue == "true", "arrow");
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_menu.prototype.$getTagOpen	= function() {
	if (this.parentNode instanceof cXULElement_menupopup)
		return '<tr class="xul-menu' + (!this.$isAccessible() ? " xul-menu_disabled" : "") + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
					<td width="18"><div class="xul-menu--image"' +(this.attributes["image"] ? ' style="background-image:url('+ ample.$encodeXMLCharacters(this.attributes["image"]) + ')"' : '')+ '></div></td>\
					<td nowrap="nowrap" class="xul-menu--label">' + (this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : ' ')+ '</td>\
					<td valign="top" class="xul-menupopup--gateway">';
	else
		return '	<td nowrap="nowrap" valign="center" class="xul-menu' + (!this.$isAccessible() ? " xul-menu_disabled" : "") + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
						<div class="xul-menu--label">' + (this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : ' ') + '</div>\
						<div class="xul-menu--gateway">';
};

cXULElement_menu.prototype.$getTagClose	= function() {
	if (this.parentNode instanceof cXULElement_menupopup)
		return 		'</td>\
					<td width="16"><div class="xul-menu--arrow' + (!this.$isAccessible() ? ' xul-menu--arrow_disabled' : '') + '"><br /></div></td>\
				</tr>';
	else
		return '		</div>\
					</td>';
};

ample.extend(cXULElement_menu);


var cXULElement_menubar	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_menubar.prototype	= new cXULElement("menubar");
cXULElement_menubar.prototype.$selectable	= false;

cXULElement_menubar.prototype.items	= null;
cXULElement_menubar.prototype.selectedItem	= null;

cXULElement_menubar.attributes	= {};
cXULElement_menubar.attributes.active	= "false";

cXULElement_menubar.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menu || oEvent.target instanceof cXULElement_menuitem)
				this.items.$add(oEvent.target);
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menu || oEvent.target instanceof cXULElement_menuitem)
				this.items.$remove(oEvent.target);
		}
	}
};

cXULElement_menubar.prototype.selectItem	= function(oItem) {
	if (this.selectedItem == oItem)
		return;

		if (this.selectedItem) {
		this.removeAttribute("active");

		if (this.selectedItem.menupopup)
			this.selectedItem.menupopup.hidePopup();
		this.selectedItem.setAttribute("selected", "false");
	}

		if (oItem) {
		if (oItem.menupopup && oItem.$isAccessible()) {
			oItem.menupopup.showPopup(this, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
			oItem.menupopup.addEventListener("popuphidden", function(oEvent) {
				if (oEvent.target == this) {
					if (this.opener.attributes["active"] == "true")	{
						this.opener.selectedItem.setAttribute("selected", "false");
						this.opener.selectedItem.$setPseudoClass("hover", false);
						this.opener.selectedItem	= null;
					}
					this.removeEventListener("popuphidden", arguments.callee, false);

					this.opener	= null;
					this.ownerDocument.popupNode	= null;
				}
			}, false);
						oItem.menupopup.opener	= this;
			this.ownerDocument.popupNode	= oItem.menupopup;
		}

		this.setAttribute("active", "true");

		oItem.setAttribute("selected", "true");
	}

	this.selectedItem	= oItem;
};

cXULElement_menubar.prototype.$getTagOpen		= function() {
	return '<div class="xul-menubar' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
				<table cellpadding="0" cellspacing="0" border="0" width="100%">\
					<tbody>\
						<tr class="xul-menubar--gateway">';
};

cXULElement_menubar.prototype.$getTagClose	= function() {
	return 					'<td width="100%"><br /></td>\
						</tr>\
					</tbody>\
				</table>\
			</div>';
};

ample.extend(cXULElement_menubar);


var cXULElement_menuitem	= function(){};
cXULElement_menuitem.prototype	= new cXULElement("menuitem");

cXULElement_menuitem.prototype.$hoverable	= true;

cXULElement_menuitem.handlers	= {
	"mouseenter":	function(oEvent) {
		this.parentNode.selectItem(this);
	},
	"mouseleave":	function(oEvent) {
				this.parentNode.selectItem(null);
	},
	"click":	function(oEvent) {
				if (!this.$isAccessible())
			return;

		if (oEvent.button == 0)
			this.$activate();
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "checked") {
								var oElement	= this.parentNode;
				if (this.attributes["type"] == "radio" && oEvent.newValue == "true") {
					for (var nIndex = 0, oItem; nIndex < oElement.items.length; nIndex++) {
						oItem	= oElement.items[nIndex];
						if (oItem instanceof cXULElement_menuitem && oItem.attributes["type"] == "radio")
							if (oItem != this && oItem.attributes["name"] == this.attributes["name"])
								oItem.setAttribute("checked", "false");
					}
				}
			}
		}
	},
	"DOMActivate":	function(oEvent) {
		if (this.attributes["type"] == "checkbox")
			this.setAttribute("checked", this.attributes["checked"] == "true" ? "false" : "true");
		else
		if (this.attributes["type"] == "radio")
			this.setAttribute("checked", "true");

				this.doCommand();
	}
};

cXULElement_menuitem.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "selected")
		this.$setPseudoClass("selected", sValue == "true");
	else
	if (sName == "label") {
		var oCell	= this.$getContainer().cells[1];
				if (document.namespaces)
			oCell.innerText	= sValue || '';
		else
			oCell.innerHTML	= sValue || '';
	}
	else
	if (sName == "image")
		this.$getContainer("image").style.backgroundImage	= sValue ? "url(" + sValue + ")" : '';
	else
	if (sName == "type") {
			}
	else
	if (sName == "checked")
		this.$setPseudoClass("checked", sValue == "true");
	else
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_menuitem.prototype.scrollIntoView	= function() {
	var oElementDOM	= this.$getContainer(),
		oParentDOM	= oElementDOM.parentNode;

	if (oParentDOM.scrollTop > oElementDOM.offsetTop)
		oParentDOM.scrollTop	= oElementDOM.offsetTop - 1;
	if (oParentDOM.scrollTop < oElementDOM.offsetTop - oParentDOM.offsetHeight + oElementDOM.offsetHeight)
		oParentDOM.scrollTop	= oElementDOM.offsetTop - oParentDOM.offsetHeight + oElementDOM.offsetHeight + 3;
};

cXULElement_menuitem.prototype.$getTagOpen		= function() {
	var bDisabled	= !this.$isAccessible(),
		bChecked	= this.attributes["checked"] == "true";
	return '<tr class="xul-menuitem' + (bDisabled ? " xul-menuitem_disabled" : "") + (bChecked ? ' xul-menuitem_checked' : '') + (bChecked && bDisabled ? ' xul-menuitem_checked_disabled xul-menuitem_disabled_checked' : '') + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"' : '') + '>\
				<td width="18"><div class="xul-menuitem--image xul-menuitem-type---image' + (this.attributes["type"] ? ' xul-menuitem-type-' + this.attributes["type"] + '--image' : '') + '"' +(this.attributes["image"] ? ' style="background-image:url('+ ample.$encodeXMLCharacters(this.attributes["image"]) + ')"' : '')+ '></div></td>\
				<td nowrap="nowrap" class="xul-menuitem--label" style="white-space:nowrap;">' +(this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : ' ');
};

cXULElement_menuitem.prototype.$getTagClose		= function() {
	return		'</td>\
				<td width="2"></td>\
				<td width="16"><div style="width:16px;"><br /></div></td>\
			</tr>';
};

ample.extend(cXULElement_menuitem);


var cXULElement_menulist	= function() {
		this.items			= new ample.classes.NodeList;
};
cXULElement_menulist.prototype	= new cXULInputElement("menulist");

cXULElement_menulist.attributes	= {
	"value":	""
};

cXULElement_menulist.prototype.items	= null;
cXULElement_menulist.prototype.menupopup	= null;

cXULElement_menulist.prototype.selectedIndex	=-1;
cXULElement_menulist.prototype.selectedText		= null;
cXULElement_menulist.prototype.selectedItem		= null;	
cXULElement_menulist.prototype.select	= function() {
	this.$getContainer("input").select();
};

cXULElement_menulist.prototype.appendItem	= function(sLabel, sValue) {
	return this.insertItemAt(this.items.length, sLabel, sValue);
};

cXULElement_menulist.prototype.insertItemAt	= function(nIndex, sLabel, sValue) {
	if (nIndex <= this.items.length) {
				var oElement	= this.ownerDocument.createElementNS(this.namespaceURI, "xul:menuitem");
		if (nIndex < this.items.length - 1)
			this.menupopup.insertBefore(oElement, this.items[nIndex]);
		else
			this.menupopup.appendChild(oElement);
				oElement.setAttribute("label", sLabel);
		oElement.setAttribute("value", sValue);

		return oElement;
	}
	else
		throw new ample.classes.DOMException(DOMException.NOT_FOUND_ERR);
};

cXULElement_menulist.prototype.removeItemAt	= function(nIndex) {
	if (this.items[nIndex])
		return this.menupopup.removeChild(this.items[nIndex]);
	else
		throw new ample.classes.DOMException(DOMException.NOT_FOUND_ERR);
};

cXULElement_menulist.prototype.select	= function() {
	this.$getContainer("input").select();
};

cXULElement_menulist.prototype.toggle	= function(bState) {
	if (!this.menupopup)
		return;
	var bHidden	= this.menupopup.getAttribute("hidden") == "true";
	if (bState === true || (!arguments.length && bHidden)) {
				this.menupopup.showPopup(this, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
	}
	else
	if (!bHidden) {
		this.menupopup.hidePopup();
	}
};

cXULElement_menulist.prototype._onChange = function(oEvent) {
	var oInput	= this.$getContainer("input");

};

cXULElement_menulist.handlers	= {
	"mousedown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

				if (oEvent.target == this && oEvent.button == 0 && oEvent.$pseudoTarget == this.$getContainer("button"))
			this.toggle();
	},
	"mouseenter":	function(oEvent) {
				this.$setPseudoClass("hover", true, "button");
	},
	"mouseleave":	function(oEvent) {
		this.$setPseudoClass("hover", false, "button");
	},
	"keydown":	function(oEvent) {
		if (!this.menupopup)
			return;
		switch (oEvent.keyIdentifier) {
			case "Up":
				if (this.menupopup.getAttribute("hidden") == "true")
					this.toggle(true);
				else {
					var nIndex	= this.selectedIndex;
					while (nIndex--> 0) {
						if (this.items[nIndex].$getContainer().style.display != "none") {
							if (this.items[this.selectedIndex])
								this.items[this.selectedIndex].setAttribute("selected", "false");
							this.items[nIndex].setAttribute("selected", "true");
							this.items[nIndex].scrollIntoView();
							this.selectedIndex	= nIndex;
							break;
						}
					}
				}
				oEvent.preventDefault();
				break;

			case "Down":
				if (this.menupopup.getAttribute("hidden") == "true")
					this.toggle(true);
				else {
					var nIndex	= this.selectedIndex;
					while (++nIndex < this.items.length) {
						if (this.items[nIndex].$getContainer().style.display != "none") {
							if (this.items[this.selectedIndex])
								this.items[this.selectedIndex].setAttribute("selected", "false");
							this.items[nIndex].setAttribute("selected", "true");
							this.items[nIndex].scrollIntoView();
							this.selectedIndex	= nIndex;
							break;
						}
					}
				}
				oEvent.preventDefault();
				break;

			case "U+001B":					this.toggle(false);
				break;

			case "Enter":					if (this.menupopup.getAttribute("hidden") != "true") {
					if (this.items[this.selectedIndex]) {
						this.selectedText	= this.items[this.selectedIndex].getAttribute("label");
						this.setAttribute("value", this.selectedText);
					}
					this.toggle(false);
				}

								cXULInputElement.dispatchChange(this);

								oEvent.preventDefault();
		}
	},
	"keyup":	function(oEvent) {
		switch (oEvent.keyIdentifier) {
			case "U+001B":				case "Enter":
			case "U+0009":					return;

			case "Up":
			case "Down":
			case "Left":
			case "Right":
				return;
		}

		var sSelectedText	= this.$getContainer("input").value;
		if (this.selectedText == sSelectedText)
			return;

				var nOptions	= 0,
			bFound;
		for (var nIndex = 0; nIndex < this.items.length; nIndex++) {
			bFound	= this.items[nIndex].getAttribute("label").substring(0, sSelectedText.length) == sSelectedText;
			if (this.attributes["filter"] == "true")
				this.items[nIndex].$getContainer().style.display	= bFound ? "block" : "none";

			if (this.items[nIndex].$getContainer().style.display != "none" && bFound) {
				if (!nOptions) {
					if (this.items[this.selectedIndex])
						this.items[this.selectedIndex].setAttribute("selected", "false");
					this.items[nIndex].setAttribute("selected", "true");
					this.items[nIndex].scrollIntoView();
						this.selectedIndex	= nIndex;
				}
				nOptions++;
			}
		}

		if (nOptions)
			this.toggle(true);
		else
			this.toggle(false);

		this.selectedText	= sSelectedText;
	},
	"focus":	function(oEvent) {
		this.$getContainer("input").focus();
	},
	"blur":		function(oEvent) {
		if (this.menupopup && this.menupopup.getAttribute("hidden") != "true")
			this.toggle(false);
		this.$getContainer("input").blur();
	},
	"DOMActivate":	function(oEvent) {
		if (oEvent.target instanceof cXULElement_menuitem) {
			var sValue	= this.$getContainer("input").value;
			this.setAttribute("value", oEvent.target.getAttribute("label"));
			this.selectedIndex	= this.items.$indexOf(oEvent.target);
			this.toggle(false);

			if (sValue != this.$getContainer("input").value) {
								cXULInputElement.dispatchChange(this);
			}
		}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		var oElement	= this.querySelector(">xul|menupopup>xul|menuitem[checked=true]", function() {
			return oEvent.target.namespaceURI;
		});
		if (oElement)
			this.$getContainer("input").value	= oElement.getAttribute("label");
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menupopup)
				this.menupopup	= oEvent.target;
		}
		else
		if (oEvent.target instanceof cXULElement_menuitem)
			this.items.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menupopup)
				this.menupopup	= null;
		}
		else
		if (oEvent.target instanceof cXULElement_menuitem)
			this.items.$remove(oEvent.target);
	}
};

cXULElement_menulist.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value")
		this.$getContainer("input").value	= sValue || '';
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		this.$getContainer("input").disabled	= sValue == "true";
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_menulist.prototype.$getTagOpen		= function() {
	return	'<div class="xul-menulist' +(!this.$isAccessible() ? " xul-menulist_disabled" : '') + (this.attributes["class"] ? ' ' + this.attributes["class"] : '') + '"' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"' : '') +'>\
				<div class="xul-menulist--field">\
					<div class="xul-menulist--button" onmouseout="ample.$instance(this).$setPseudoClass(\'active\', false, \'button\');" onmousedown="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'active\', true, \'button\');" onmouseup="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'active\', false, \'button\');" oncontextmenu="return false;"><br /></div>\
					<input class="xul-menulist--input" type="text" autocomplete="off" style="border:0px solid white;width:100%;" onselectstart="event.cancelBubble=true;" onchange="ample.$instance(this)._onChange(event)" value="' + this.attributes["value"] + '"' + (!this.$isAccessible() ? ' disabled="disabled"' : '') + (this.attributes["editable"] != "true" || this.attributes["readonly"] ? ' readonly="true"' : '') + (this.attributes["name"] ? ' name="' + this.attributes["name"] + '"' : '') + '/>\
				</div>\
				<div class="xul-menulist--gateway">';
};

cXULElement_menulist.prototype.$getTagClose	= function() {
	return		'</div>\
			</div>';
};

ample.extend(cXULElement_menulist);


var cXULElement_menupopup	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_menupopup.prototype	= new cXULPopupElement("menupopup");

cXULElement_menupopup.prototype.items	= null;
cXULElement_menupopup.prototype.selectedItem	= null;

cXULElement_menupopup.attributes	= {};
cXULElement_menupopup.attributes.hidden	= "true";

cXULElement_menupopup.prototype.selectItem	= function(oItem) {
		if (this.selectedItem == oItem)
		return;

		if (this.selectedItem) {
		var oMenuPopupOld	= this.selectedItem.menupopup;
		if (oMenuPopupOld) {
			this._timeOutHide	= setTimeout(function() {
				oMenuPopupOld.hidePopup();
			}, 300);
		}
				this.selectedItem.setAttribute("selected", "false");
	}

		if (this._timeOutShow)
		this._timeOutShow	= clearTimeout(this._timeOutShow);

	if (oItem) {
				if (oItem.menupopup && oItem.$isAccessible()) {
			var oMenuPopupNew	= oItem.menupopup;
			this._timeOutShow	= setTimeout(function() {
				oMenuPopupNew.showPopup(null, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
			}, 300);
		}
				oItem.setAttribute("selected", "true");
	}

		this.selectedItem	= oItem;
};



cXULElement_menupopup.handlers	= {
	"popuphidden":	function(oEvent) {
				if (oEvent.target == this && this.selectedItem)
			this.selectItem(null);
	},
	"DOMActivate":	function(oEvent) {
		if (oEvent.target instanceof cXULElement_menuitem)
			this.hidePopup();
				if (this.ownerDocument.popupNode == this)
			this.ownerDocument.popupNode	= null;
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menu || oEvent.target instanceof cXULElement_menuitem)
				this.items.$add(oEvent.target);
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_menu || oEvent.target instanceof cXULElement_menuitem)
				this.items.$remove(oEvent.target);
		}
	}
};

cXULElement_menupopup.prototype.$getTagOpen	= function() {
	return '<div class="xul-menupopup' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="position:absolute;' + (this.attributes["hidden"] == "true" ? 'display:none;' : '') + '">\
				<div class="xul-menupopup--shadow-right" style="position:absolute;"></div>\
				<div class="xul-menupopup--shadow-bottom" style="position:absolute;font-size:1px;"></div>\
				<table cellpadding="0" cellspacing="0" border="0" cols="4">\
					<tbody class="xul-menupopup--gateway">';
};

cXULElement_menupopup.prototype.$getTagClose	= function() {
	return 			'</tbody>\
				</table>\
			</div>';
};

ample.extend(cXULElement_menupopup);


var cXULElement_menuseparator	= function(){};
cXULElement_menuseparator.prototype	= new cXULElement("menuseparator");

cXULElement_menuseparator.prototype.$getTagOpen	= function() {
	return '<tr>\
				<td colspan="4"><div class="xul-menuseparator' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></div></td>\
			</tr>';
};

ample.extend(cXULElement_menuseparator);


var cXULElement_observes	= function(){};
cXULElement_observes.prototype	= new cXULElement("observes");
cXULElement_observes.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;

ample.extend(cXULElement_observes);


var cXULElement_overlay	= function(){};
cXULElement_overlay.prototype	= new cXULElement("overlay");

function fXULElement_overlay_applyOverlays(oAmpleNode, oOverlayNode) {

		for (var nIndex = 0; nIndex < oOverlayNode.childNodes.length; nIndex++) {
		var oOverlayChild	= oOverlayNode.childNodes[nIndex];
		if (oOverlayChild.nodeType == ample.classes.Node.TEXT_NODE && oOverlayChild.nodeValue.trim() == '')
			continue;
		if (oOverlayChild.nodeType == ample.classes.Node.COMMENT_NODE)
			continue;
		if (oOverlayChild.nodeType == ample.classes.Node.ELEMENT_NODE) {
			var oAmpleMatchingElement	= null;
			if (oOverlayChild.getAttribute('id')) {
								var sId	= oOverlayChild.getAttribute('id');
				oAmpleMatchingElement	= ample.getElementById(sId);
				if (!oAmpleMatchingElement) {
										if (oOverlayNode == oOverlayNode.ownerDocument.documentElement) {
																		hXULDocument_overlayFragments[sId]	= oOverlayChild;
						continue;
					}
					else {
												oAmpleMatchingElement	= fXULElement_overlay_importAndAdd(oAmpleNode, oOverlayChild);
					}
				}
				else {
															if (oOverlayChild.getAttribute('removeelement') == 'true')	{
												oAmpleMatchingElement.parentNode.removeChild(oAmpleMatchingElement);
						continue;
					}
									}
			}
			else {
								if (oOverlayNode == oOverlayNode.ownerDocument.documentElement) {
										oAmpleMatchingElement	= fXULElement_overlay_importAndAdd(oAmpleNode.ownerDocument.documentElement, oOverlayChild);
				}
				else {
										oAmpleMatchingElement	= fXULElement_overlay_importAndAdd(oAmpleNode, oOverlayChild); 				}
			}
			fXULElement_overlay_mergeAttributes(oAmpleMatchingElement, oOverlayChild);
			fXULElement_overlay_applyOverlays(oAmpleMatchingElement, oOverlayChild);
		}
		else
			alert('Non-XUL element in overlay.'+oOverlayChild); 	}
};

function fXULElement_overlay_importAndAdd(oParent, oOverlayNodeToAdd) {
	var oAmpleNewNode	= ample.importNode(oOverlayNodeToAdd, false);
		var hAttributeFilter	= {insertafter:1, insertbefore:1, position:1};
	for (var sAttributeName in hAttributeFilter) {
		if (hAttributeFilter.hasOwnProperty(sAttributeName))
			if (oAmpleNewNode.hasAttribute(sAttributeName))
				oAmpleNewNode.removeAttribute(sAttributeName);
	}
	if (oOverlayNodeToAdd.getAttribute('insertafter')) {
		var aInsertAfter	= oOverlayNodeToAdd.getAttribute('insertafter').split(',');
		for (var nIndex = 0; nIndex < aInsertAfter.length; nIndex++) {
			oInsertAfterElement	= ample.getElementById(aInsertAfter[nIndex].trim());
						for (var nAfterIndex = 0; nAfterIndex < oParent.childNodes.length; nAfterIndex++) {
				if (oParent.childNodes[nAfterIndex] == oInsertAfterElement) {
					if (nAfterIndex == oParent.childNodes.length-1)
						oParent.appendChild(oAmpleNewNode);
					else
						oParent.insertBefore(oAmpleNewNode, oParent.childNodes[nAfterIndex+1]);
					return oAmpleNewNode;
				}
			}
		}
	}
	if (oOverlayNodeToAdd.getAttribute('insertbefore')) {
		var aInsertBefore	= oOverlayNodeToAdd.getAttribute('insertbefore').split(',');
		for (var nIndex = 0; nIndex < aInsertBefore.length; nIndex++) {
			oInsertBeforeElement	= ample.getElementById(aInsertBefore[nIndex].trim());
			if (oInsertBeforeElement) {
				oParent.insertBefore(oAmpleNewNode, oInsertBeforeElement);
				return oAmpleNewNode;
			}
		}
	}
	if (oOverlayNodeToAdd.getAttribute('position')) {
		var nPosition	= oOverlayNodeToAdd.getAttribute('position') * 1;
		if (nPosition >= 1 && nPosition <= oParent.childNodes.length) {
						oParent.insertBefore(oAmpleNewNode, oParent.childNodes[nPosition-1]);
						return oAmpleNewNode;
		}
	}
	oParent.appendChild(oAmpleNewNode);
	return oAmpleNewNode;
}

function fXULElement_overlay_mergeAttributes(oAmpleNode, oOverlayNode) {
	var hAttributeFilter	= {insertafter:1, insertbefore:1, position:1};
	if (oOverlayNode.attributes) {
		for (var nCounter = 0; nCounter < oOverlayNode.attributes.length; nCounter++) {
			var oAttr	= oOverlayNode.attributes[nCounter];
			if (!hAttributeFilter.hasOwnProperty(oAttr.name) || !hAttributeFilter[oAttr.name])
				oAmpleNode.setAttribute(oAttr.name, oAttr.value);
		}
		return;
	}
		for (var nCounter = 0; nCounter < oOverlayNode.attributes.length; nCounter++) {
		var oAttr	= oOverlayNode.attributes[nCounter];
		if (!(oAttr.value instanceof Function) && !(oAttr.value instanceof Object) && (!hAttributeFilter.hasOwnProperty(oAttr.name) || !hAttributeFilter[oAttr.name])) {
			oAmpleNode.setAttribute(oAttr.name, oAttr.value);
		}
	}
}


cXULElement_overlay.prototype.$getTagOpen	= function() {
	return '';
};

ample.extend(cXULElement_overlay);


var cXULElement_page	= function(){};
cXULElement_page.prototype	= new cXULElement("page");
cXULElement_page.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_page.attributes	= {};
cXULElement_page.attributes.orient	= "vertical";
cXULElement_page.attributes.width	= "100%";
cXULElement_page.attributes.height	= "100%";

cXULElement_page.prototype.$getTagOpen	= function() {
	return '<div class="xul-page' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
				(this.attributes["width"] ? 'width:' +(isNaN(this.attributes["width"]) ? this.attributes["width"] : this.attributes["width"] + "px") : '')+ ';' +
				(this.attributes["height"] ? 'height:' +(isNaN(this.attributes["height"]) ? this.attributes["height"] : this.attributes["height"] + "px") : '')+ ';' +
				(this.attributes["style"] ? this.attributes["style"] : '') + '">';
};

cXULElement_page.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_page);
var cXULElement_panel	= function(){};
cXULElement_panel.prototype	= new cXULPopupElement("panel");
cXULElement_panel.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_panel.attributes	= {};
cXULElement_panel.attributes.orient	= "vertical";
cXULElement_panel.attributes.width	= "150";

cXULElement_panel.prototype.$getTagOpen	= function() {
	return '<div class="xul-panel' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="display:none;position:absolute;width:' + this.attributes["width"] + 'px;" onmousedown="event.cancelBubble=true;" oncontextmenu="return false">';
};

cXULElement_panel.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_panel);


var cXULElement_popupset	= function(){};
cXULElement_popupset.prototype	= new cXULElement("popupset");
cXULElement_popupset.prototype.viewType	= cXULElement.VIEW_TYPE_VIRTUAL;


ample.extend(cXULElement_popupset);


var cXULElement_progressmeter	= function(){};
cXULElement_progressmeter.prototype	= new cXULElement("progressmeter");

cXULElement_progressmeter.prototype._interval	= null;
cXULElement_progressmeter.prototype._left		= 0;

cXULElement_progressmeter.attributes	= {};
cXULElement_progressmeter.attributes.value	= "100";

cXULElement_progressmeter.prototype._onInterval	= function() {
	this._left	= this._left + 1 > 100 + 30 ? 0 : this._left + 1;

	this.$getContainer("value").style.left	=(this._left > 30 ? this._left - 30 : 0)+ '%';
	this.$getContainer("value").style.width	=(this._left < 30 ? this._left : 100 + 30 - this._left < 30 ? 100 + 30 - this._left : 30)+ '%';
};

cXULElement_progressmeter.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.getAttribute("mode") == "undetermined") {
			var oSelf	= this;
			this._interval	= setInterval(function() {
				oSelf._onInterval();
			}, 40);
		}
	},
	"DOMNodeRemovedFromDocument":	function(oEvent) {
		if (this._interval)
			clearInterval(this._interval);
	}
};

cXULElement_progressmeter.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value") {
		if (this.attributes["mode"] != "undetermined")
			this.$getContainer("value").style.width	= sValue + '%';
	}
	else
	if (sName == "mode") {
		if (sValue == "undetermined") {
			if (!this._interval) {
				var oElementDOM	= this.$getContainer("value");
				oElementDOM.style.width	= '0%';
				oElementDOM.style.left	= '0%';

				this._left	= 0;
				var oSelf	= this;
				this._interval	= setInterval(function() {
					oSelf._onInterval();
				}, 40);
			}
		}
		else {
			if (this._interval) {
				clearInterval(this._interval);
				this._interval	= null;
			}
			var oElementDOM	= this.$getContainer("value");
			oElementDOM.style.width	= this.attributes["value"] + '%';
			oElementDOM.style.left	= '0%';
		}
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_progressmeter.prototype.$getTagOpen	= function() {
	return '<div class="xul-progressmeter' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="'+
				'width:' + (this.attributes["width"] ? this.attributes["width"] : "100%") + ';' +
				(this.attributes["hidden"] == "true" ? 'display:none;' : "") + '">\
				<div class="xul-progressmeter--before" style="float:left"></div>\
				<div class="xul-progressmeter--after" style="float:right"></div>\
				<div class="xul-progressmeter--bar">\
					<div class="xul-progressmeter--value" style="position:relative;font-size:1px;width:' + this.attributes["value"] + '%"></div>\
				</div>\
			</div>';
};

ample.extend(cXULElement_progressmeter);


var cXULElement_radio	= function(){};
cXULElement_radio.prototype	= new cXULElement("radio");

cXULElement_radio.prototype.$hoverable	= true;

cXULElement_radio.prototype.group	= null;

cXULElement_radio.prototype.$isAccessible	= function() {
	return this.getAttribute("disabled") != "true" && (this.group ? this.group.$isAccessible() : true);
};

cXULElement_radio.handlers	= {
	"click":	function(oEvent) {
		if (oEvent.button == 0) {
			this.setAttribute("selected", "true");
						if (this.group)
				cXULInputElement.dispatchChange(this.group);
		}
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "selected") {
				var oGroup	= this.group;
				if (oGroup) {
					if (oEvent.newValue == "true") {
												if (oGroup.selectedItem)
							oGroup.selectedItem.setAttribute("selected", "false");

						oGroup.selectedIndex	= this.group.items.$indexOf(this);
						oGroup.selectedItem		= this;
						oGroup.attributes["value"]	= this.attributes["value"];
					}
					else {
						oGroup.selectedIndex	=-1;
						oGroup.selectedItem		= null;
						oGroup.attributes["value"]	= "";
					}
				}
			}
		}
	}
};

cXULElement_radio.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	= sValue || '';
	else
	if (sName == "selected")
		this.$setPseudoClass("selected", sValue == "true");
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_radio.prototype.$getTagOpen		= function() {
	var bSelected	= this.attributes["selected"] == "true",
		bDisabled	= !this.$isAccessible();
	return '<div class="xul-radio' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (bDisabled ? " xul-radio_disabled" : "") + (bSelected ? " xul-radio_selected" : "") + (bSelected && bDisabled ? " xul-radio_selected_disabled xul-radio_disabled_selected" : "") + '">\
				<div class="xul-radio--input"><br /></div>\
				<div class="xul-radio--label">' +(this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : '')+ '</div>';
};

cXULElement_radio.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_radio);


var cXULElement_radiogroup	= function() {
		this.items		= new ample.classes.NodeList;
};
cXULElement_radiogroup.prototype	= new cXULInputElement("radiogroup");
cXULElement_radiogroup.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_radiogroup.prototype.selectedIndex	=-1;
cXULElement_radiogroup.prototype.selectedItem	= null;

cXULElement_radiogroup.attributes	= {};
cXULElement_radiogroup.attributes.orient	= "vertical";
cXULElement_radiogroup.attributes.value	= "";

cXULElement_radiogroup.prototype.appendItem	= function(sName, sValue) {

};

cXULElement_radiogroup.prototype.insertItemAt= function(nIndex, sName, sValue) {

};

cXULElement_radiogroup.prototype.removeItemAt= function(nIndex) {

};

cXULElement_radiogroup.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "value") {
				for (var nIndex = 0; nIndex < this.items.length; nIndex++) {
					if (this.items[nIndex].attributes["value"] == oEvent.newValue) {
						this.items[nIndex].setAttribute("selected", "true");
						break;
					}
				}
			}
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target instanceof cXULElement_radio) {
			this.items.$add(oEvent.target);
			oEvent.target.group	= this;
						if (oEvent.target.attributes["selected"] == "true") {
				this.selectedIndex	= this.items.length - 1;
				this.selectedItem	= oEvent.target;
			}
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target instanceof cXULElement_radio) {
						if (oEvent.target.attributes["selected"] == "true") {
				if (this.selectedItem == oEvent.target) {
					this.selectedIndex	=-1;
					this.selectedItem	= null;
				}
			}			oEvent.target.group	= null;
			this.items.$remove(oEvent.target);
		}
	}
};

cXULElement_radiogroup.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_radiogroup.prototype.$getTagOpen	= function() {
	return '<div class="xul-radiogroup' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? " xul-radiogroup_disabled" : "") + '">';
};

cXULElement_radiogroup.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_radiogroup);


var cXULElement_row	= function(){};
cXULElement_row.prototype	= new cXULElement("row");
cXULElement_row.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_row.attributes	= {};
cXULElement_row.attributes.orient	= "horizontal";

cXULElement_row.prototype.$getTagOpen		= function() {
	return '<tr class="xul-row' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' +(this.attributes["height"] ? ' height="' + this.attributes["height"] + '"' : '')+(this.attributes["hidden"] == "true" ? ' style="display:none"' : '')+'>';
};

cXULElement_row.prototype.$getTagClose	= function() {
	return '</tr>';
};

ample.extend(cXULElement_row);


var cXULElement_rows	= function(){};
cXULElement_rows.prototype	= new cXULElement("rows");
cXULElement_rows.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_rows.attributes	= {};
cXULElement_rows.attributes.height	= "100%";
cXULElement_rows.attributes.width	= "100%";
cXULElement_rows.attributes.orient	= "vertical";

ample.extend(cXULElement_rows);


var cXULElement_scale	= function(){};

cXULElement_scale.prototype	= new cXULInputElement("scale");

cXULElement_scale.attributes	= {
	"min":	"0",
	"max":	"100",
	"value":"0"
};

cXULElement_scale.captured	= false;
cXULElement_scale.button	=-1;
cXULElement_scale.clientRect= null;
cXULElement_scale.prevValue	= "";

cXULElement_scale.handlers	= {
	"mousedown":	function(oEvent) {
		if (oEvent.$pseudoTarget && oEvent.$pseudoTarget.className.match(/xul-scale--button/)) {
			cXULElement_scale.startSession(this, oEvent.$pseudoTarget);
		}
	},
	"mouseup":		function(oEvent) {
		if (cXULElement_scale.captured) {
			cXULElement_scale.finishSession(this);
						if (cXULElement_scale.prevValue != this.getAttribute("value"))
				cXULInputElement.dispatchChange(this);
		}
	},
	"keydown":	function(oEvent) {
		if (cXULElement_scale.captured && oEvent.keyIdentifier == "U+001B") {				cXULElement_scale.finishSession(this);
			this.setAttribute("value", cXULElement_scale.prevValue);
		}
	},
	"mousemove":	function(oEvent) {
		if (cXULElement_scale.captured) {
			var oElement= this.$getContainer("bar").getElementsByTagName("div")[cXULElement_scale.button],
				aValues	= this.getAttribute("value").split(","),
				nMin	= this.getAttribute("min") * 1,
				nMax	= this.getAttribute("max") * 1,
				bOrient	= this.getAttribute("orient") == "vertical",
				nSize	= bOrient
							? 100 * (oEvent.clientY - cXULElement_scale.clientRect.top) / (cXULElement_scale.clientRect.bottom - cXULElement_scale.clientRect.top)
							: 100 * (oEvent.clientX - cXULElement_scale.clientRect.left) / (cXULElement_scale.clientRect.right - cXULElement_scale.clientRect.left),
				nValue	= nMin + nSize	* (nMax - nMin) / 100;

						if (cXULElement_scale.button > 0)
				if (nValue < aValues[cXULElement_scale.button - 1] * 1)
					nValue	= aValues[cXULElement_scale.button - 1] * 1;
						if (cXULElement_scale.button < aValues.length - 1)
				if (nValue > aValues[cXULElement_scale.button + 1] * 1)
					nValue	= aValues[cXULElement_scale.button + 1] * 1;
						nValue	= Math.min(nMax, Math.max(nMin, nValue));

			aValues[cXULElement_scale.button]	= nValue;
						this.setAttribute("value", aValues.join(","));
						oElement.style[bOrient ? "top" : "left"]	= 100 * (nValue - nMin) / (nMax - nMin) + "%";

					}
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		cXULElement_scale.redraw(this);
	}
};

cXULElement_scale.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value") {
		if (!cXULElement_scale.captured)
			cXULElement_scale.redraw(this);
	}
	else
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_scale.startSession	= function(oInstance, oThumb) {
	var oRect	= oInstance.getBoundingClientRect();
	cXULElement_scale.captured	= true;
	for (var nIndex = 0, aElements = oInstance.$getContainer("bar").getElementsByTagName("div"), oElement; oElement = aElements[nIndex]; nIndex++)
		if (oElement == oThumb)
			break;
	cXULElement_scale.button	= nIndex;
	cXULElement_scale.clientRect	= oRect;
	cXULElement_scale.prevValue	= oInstance.getAttribute("value");
	oInstance.setCapture(true);
		oElement.className	+= ' xul-scale--button_active';
};

cXULElement_scale.finishSession	= function(oInstance) {
	var oElement	= oInstance.$getContainer("bar").getElementsByTagName("div")[cXULElement_scale.button];
	cXULElement_scale.captured	= false;
	cXULElement_scale.button	=-1;
	cXULElement_scale.clientRect	= null;
	oInstance.releaseCapture();
		oElement.className	= oElement.className.replace(/ xul-scale--button_active/, '');
};

cXULElement_scale.redraw	= function(oInstance) {
	var aValue	= oInstance.getAttribute("value").split(","),
		nMin	= oInstance.getAttribute("min") * 1,
		nMax	= oInstance.getAttribute("max") * 1,
		bOrient	= oInstance.getAttribute("orient") == "vertical",
		aHtml	= [];
	for (var nIndex = 0, nValue; nIndex < aValue.length; nIndex++) {
		nValue	= Math.min(nMax, Math.max(nMin, aValue[nIndex]));
		aHtml.push('<div class="xul-scale--button" style="position:absolute;' + (bOrient ? "top" : "left")+ ':' + (100 * (nValue - nMin) / (nMax - nMin)) + '%" onmouseover="if (ample.$instance(this).$isAccessible()) this.className += \' xul-scale--button_hover\'" onmouseout="if (ample.$instance(this).$isAccessible()) if (!this.className.match(/_disabled/)) this.className = this.className.replace(\' xul-scale--button_hover\', \'\')"></div>');
	}
	oInstance.$getContainer("bar").innerHTML	= aHtml.join('');
};

cXULElement_scale.prototype.$getTagOpen	= function() {
	return '<div class="xul-scale' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? " xul-scale_disabled" : '') + (" xul-scale-orient-" +(this.attributes["orient"] == "vertical" ? "vertical" : "horizontal")) + '"' + (this.attributes["style"] ? ' style="' + this.attributes["style"] + '"': '') + '>\
				<div class="xul-scale--before" style="float:left"></div>\
				<div class="xul-scale--after" style="float:right"></div>\
				<div class="xul-scale--bar" onmousedown="return false" style="position:relative"></div>\
				<input type="text" value="' + this.attributes["value"] + '" autocomplete="off" style="display:none;width:1px;height:1px;" class="xul-scale--input"/>\
			</div>';
};

ample.extend(cXULElement_scale);


var cXULElement_script	= function(){};
cXULElement_script.prototype	= new cXULElement("script");

cXULElement_script.attributes	= {};
cXULElement_script.attributes.hidden	= "true";


cXULElement_script.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.attributes["src"])
			this.$getContainer().src	= this.attributes["src"];
		else
		if (this.firstChild) {
			var oElement	= document.body.appendChild(document.createElement("script"));
			oElement.type	= "text/javascript";
			oElement.text	= this.firstChild.nodeValue;
		}
	}
};

cXULElement_script.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "src") {
		if (sValue)
			this.$getContainer().src	= sValue || '';
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_script.prototype.$getTagOpen	= function() {
	return '<script type="text/javascript">';
};

cXULElement_script.prototype.$getTagClose	= function() {
	return '</script>';
};

ample.extend(cXULElement_script);


var cXULElement_scrollbox	= function(){};
cXULElement_scrollbox.prototype	= new cXULElement("scrollbox");
cXULElement_scrollbox.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_scrollbox.prototype.$getTagOpen	= function() {
	return '<div class="xul-scrollbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="position:relative;overflow:auto;width:100%;height:100%;">\
				<div style="position:absolute;width:100%;height:100%;">';
};

cXULElement_scrollbox.prototype.$getTagClose	= function() {
	return '	</div>\
			</div>';
};

ample.extend(cXULElement_scrollbox);


var cXULElement_separator	= function(){};
cXULElement_separator.prototype	= new cXULElement("separator");

cXULElement_separator.prototype.$getTagOpen	= function() {
	return '<div class="xul-separator' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="height:1.5em;width:1.5em;"><img height="1" width="1" /></div>';
};

ample.extend(cXULElement_separator);


var cXULElement_sidebar	= function(){};
cXULElement_sidebar.prototype	= new cXULElement("sidebar");
cXULElement_sidebar.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_sidebar.attributes	= {};
cXULElement_sidebar.attributes.orient	= "vertical";
cXULElement_sidebar.attributes.width	= "100%";
cXULElement_sidebar.attributes.height	= "100%";

cXULElement_sidebar.prototype.$getTagOpen	= function() {
	return '<div class="xul-sidebar' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
				(this.attributes["style"] ? this.attributes["style"] : '') + '">';
};

cXULElement_sidebar.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_sidebar);


var cXULElement_spacer	= function(){};
cXULElement_spacer.prototype	= new cXULElement("spacer");

cXULElement_spacer.prototype.$getTagOpen	= function() {
	var sHtml	= '<div class="xul-spacer' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="';
	sHtml	+= 'width:' +(this.attributes["width"] ? this.attributes["width"] : '0')+ 'px;';
	sHtml	+= 'height:' +(this.attributes["height"]? this.attributes["height"]: '0')+ 'px;';
	sHtml	+= '"><img height="1" width="1" /></div>';

	return sHtml;
};

ample.extend(cXULElement_spacer);


var cXULElement_spinbuttons	= function(){};
cXULElement_spinbuttons.prototype	= new cXULElement("spinbuttons");

cXULElement_spinbuttons.interval	= null;
cXULElement_spinbuttons.timeout		= null;

cXULElement_spinbuttons.handlers	= {
	"mousedown":	function(oEvent) {
		if (oEvent.$pseudoTarget == this.$getContainer("button-up")) {
			this.spin(true);
			var that	= this;
			cXULElement_spinbuttons.timeout	= setTimeout(function() {
				cXULElement_spinbuttons.interval	= setInterval(function() {
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
			cXULElement_spinbuttons.timeout	= setTimeout(function() {
				cXULElement_spinbuttons.interval	= setInterval(function() {
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
			clearTimeout(cXULElement_spinbuttons.timeout);
			clearInterval(cXULElement_spinbuttons.interval);
			this.$setPseudoClass("active", false, "button-up");
			this.$setPseudoClass("active", false, "button-down");
			this.releaseCapture();
		}
	}
};

cXULElement_spinbuttons.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_spinbuttons.prototype.spin	= function(bForward) {
	var oEvent	= this.ownerDocument.createEvent("CustomEvent");
	oEvent.initCustomEvent("spin", false, false, bForward);
	this.dispatchEvent(oEvent);
};

cXULElement_spinbuttons.prototype.$getTagOpen	= function() {
	return '<div class="xul-spinbuttons' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? ' xul-spinbuttons_disabled' : '')+ '" onmousedown="return false" onselectstart="return false">\
				<div class="xul-spinbuttons--button-up" onmouseover="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', true, \'button-up\')" onmouseout="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', false, \'button-up\')"><br/></div>\
				<div class="xul-spinbuttons--button-down" onmouseover="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', true, \'button-down\')" onmouseout="if (ample.$instance(this).$isAccessible()) ample.$instance(this).$setPseudoClass(\'hover\', false, \'button-down\')"><br/></div>\
			</div>';
};

ample.extend(cXULElement_spinbuttons);


var cXULElement_splitter	= function(){};
cXULElement_splitter.prototype	= new cXULElement("splitter");

cXULElement_splitter.prototype._clientX	= 0;
cXULElement_splitter.prototype._clientY	= 0;
cXULElement_splitter.prototype._offsetX	= 0;
cXULElement_splitter.prototype._offsetY	= 0;

cXULElement_splitter.prototype.$hoverable	= true;
cXULElement_splitter.prototype.$selectable	= false;

cXULElement_splitter.offset	= 0;
cXULElement_splitter.client	= 0;
cXULElement_splitter.active	= false;

cXULElement_splitter.handlers	= {
	"mousedown":	function(oEvent) {
				if (oEvent.button != 0)
			return;

		this.setCapture(true);
		this.$setPseudoClass("active", true);
		cXULElement_splitter.active	= true;

				var oElementDOM	= this.$getContainer("image"),
			oRectImage	= this.getBoundingClientRect("image"),
			oRectParent	= this.parentNode.getBoundingClientRect();
		if (this.parentNode.getAttribute("orient") == "vertical") {
			cXULElement_splitter.offset	= oRectImage.top;
			cXULElement_splitter.client	= oEvent.clientY;
			oElementDOM.style.width	=(oRectParent.right - oRectParent.left - 2)+ "px";
		}
		else {
			cXULElement_splitter.offset	= oRectImage.left;
			cXULElement_splitter.client	= oEvent.clientX;
			oElementDOM.style.height	=(oRectParent.bottom - oRectParent.top - 2)+ "px";
		}
	},
	"mouseup":		function(oEvent) {
				if (oEvent.button != 0)
			return;

		this.releaseCapture();
		this.$setPseudoClass("active", false);
		cXULElement_splitter.active	= false;

		var oElementDOM	= this.$getContainer("image"),
			bVertical	= this.parentNode.getAttribute("orient") == "vertical",
			sMeasure	= bVertical ? "height" : "width",
			nOffset		= oEvent[bVertical ? "clientY" : "clientX"] - cXULElement_splitter.client,
			nValue,
			nValue2,
			nMin,
			nMax;

				if (this.parentNode.getAttribute("orient") == "vertical") {
			oElementDOM.style.width	= "";
			oElementDOM.style.top	= "";
		}
		else {
			oElementDOM.style.height= "";
			oElementDOM.style.left	= "";
		}

				if (this.previousSibling &&(nValue = this.previousSibling.attributes[sMeasure] * 1)) {
			nValue2	= nValue + nOffset;
			if (nMin = this.previousSibling.attributes["min" + sMeasure])
				nValue2	= Math.max(nMin, nValue2);
			if (nMax = this.previousSibling.attributes["max" + sMeasure])
				nValue2	= Math.min(nMax, nValue2);
			this.previousSibling.setAttribute(sMeasure, nValue2);
		}
				if (this.nextSibling &&(nValue = this.nextSibling.attributes[sMeasure] * 1)) {
			nValue2	= nValue - nOffset;
			if (nMin = this.nextSibling.attributes["min" + sMeasure])
				nValue2	= Math.max(nMin, nValue2);
			if (nMax = this.nextSibling.attributes["max" + sMeasure])
				nValue2	= Math.min(nMax, nValue2);
			this.nextSibling.setAttribute(sMeasure, nValue2);
		}

				oXULReflowManager.schedule(this.parentNode);
	},
	"mousemove":	function(oEvent) {
		if (cXULElement_splitter.active) {
			var oElementDOM	= this.$getContainer("image"),
				bVertical	= this.parentNode.getAttribute("orient") == "vertical",
				sMeasure	= bVertical ? "height" : "width",
				nOffset		= oEvent[bVertical ? "clientY" : "clientX"] - cXULElement_splitter.client,
				nValue,
				nMin,
				nMax;

						if (this.previousSibling &&(nValue = this.previousSibling.attributes[sMeasure] * 1))
				if (!((nMin = this.previousSibling.attributes["min" + sMeasure]) && nMin > nValue + nOffset) && !((nMax = this.previousSibling.attributes["max" + sMeasure]) && nMax < nValue + nOffset))
					oElementDOM.style[this.parentNode.getAttribute("orient") == "vertical" ? "top" : "left"]	=(cXULElement_splitter.offset + nOffset)+ "px";
						if (this.nextSibling &&(nValue = this.nextSibling.attributes[sMeasure] * 1))
				if (!((nMin = this.nextSibling.attributes["min" + sMeasure]) && nMin > nValue - nOffset) && !((nMax = this.nextSibling.attributes["max" + sMeasure]) && nMax < nValue - nOffset))
					oElementDOM.style[this.parentNode.getAttribute("orient") == "vertical" ? "top" : "left"]	=(cXULElement_splitter.offset + nOffset)+ "px";
		}
	}
};

cXULElement_splitter.prototype.$getTagOpen	= function() {
	return '<div class="xul-splitter' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + ' xul-splitter-' +(this.parentNode.attributes["orient"] == "vertical" ? "vertical" : "horizontal")+ '" style="line-height:1px"><div class="xul-splitter--image"></div>';
};

cXULElement_splitter.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_splitter);


var cXULElement_stack	= function(){};
cXULElement_stack.prototype	= new cXULElement("stack");

cXULElement_stack.prototype.reflow	= function() {
		for (var nIndex = 0, oElementDOM; nIndex < this.childNodes.length; nIndex++)
		if (oElementDOM = this.childNodes[nIndex].$getContainer())
			oElementDOM.style.position	= "absolute";
};

cXULElement_stack.prototype.$getTagOpen	= function() {
	return '<div class="xul-stack' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="position:relative">';
};

cXULElement_stack.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_stack);


var cXULElement_statusbar	= function(){};
cXULElement_statusbar.prototype	= new cXULElement("statusbar");
cXULElement_statusbar.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_statusbar.attributes	= {};
cXULElement_statusbar.attributes.width	= "100%";
cXULElement_statusbar.attributes.height	= "22";

cXULElement_statusbar.prototype.$selectable	= false;

cXULElement_statusbar.prototype.$getTagOpen	= function() {
	return '<div class="xul-statusbar' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_statusbar.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_statusbar);


var cXULElement_statusbarpanel	= function(){};
cXULElement_statusbarpanel.prototype	= new cXULElement("statusbarpanel");

cXULElement_statusbarpanel.attributes	= {};
cXULElement_statusbarpanel.attributes.align	= "center";

cXULElement_statusbarpanel.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "label")
		this.$getContainer().innerHTML	=(this.attributes["image"] ? '<img src="' + this.attributes["image"] + '" align="absmiddle"/>' : '') + (sValue || '');
	else
	if (sName == "image")
		this.$getContainer().innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle"/>' : '') + (this.attributes["label"] || '');
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_statusbarpanel.prototype.$getTagOpen	= function() {
	var sHtml	= '<div class="xul-statusbarpanel' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
	if (this.attributes["image"])
		sHtml	+= '<img src="' + ample.$encodeXMLCharacters(this.attributes["image"]) + '" align="absmiddle"/>';
	else
	if (this.attributes["label"])
		sHtml	+= ample.$encodeXMLCharacters(this.attributes["label"]);
	return sHtml;
};

cXULElement_statusbarpanel.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_statusbarpanel);


var cXULElement_tab	= function(){};
cXULElement_tab.prototype	= new cXULElement("tab");
cXULElement_tab.prototype.$hoverable	= true;

cXULElement_tab.handlers	= {
	"mousedown":	function(oEvent) {
		if (oEvent.button == 0)
			this.$activate();
	},
	"DOMActivate":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		this.parentNode.goTo(this.parentNode.items.$indexOf(this));
		this.doCommand();
	}
};

cXULElement_tab.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "selected")
		this.$setPseudoClass("selected", sValue == "true");
	else
	if (sName == "label")
		this.$getContainer("gateway").innerHTML	=(this.attributes["image"] ? '<img src="' + this.attributes["image"] + '" align="absmiddle" /> ' :'') + (sValue || '');
	else
	if (sName == "image")
		this.$getContainer("gateway").innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" /> ' :'') + (this.attributes["label"] || '');
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_tab.prototype.$getTagOpen	= function() {
	return '<div class="xul-tab' + (!this.$isAccessible() ? " xul-tab_disabled" : "") +(this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
				<div class="xul-tab--before" style="float:left;height:100%"></div>\
				<div class="xul-tab--after" style="float:right;height:100%"></div>\
				<div class="xul-tab--gateway">'+
					(this.attributes["image"] ? '<img src="' + ample.$encodeXMLCharacters(this.attributes["image"]) + '" border="0" align="absmiddle"/> ' : '')+
					(this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : '');
};

cXULElement_tab.prototype.$getTagClose	= function() {
	return '	</div>\
			</div>';
};

ample.extend(cXULElement_tab);


var cXULElement_tabbox	= function(){};
cXULElement_tabbox.prototype	= new cXULElement("tabbox");

cXULElement_tabbox.prototype.tabs		= null; cXULElement_tabbox.prototype.tabpanels	= null; 
cXULElement_tabbox.prototype.selectedIndex	= -1;
cXULElement_tabbox.prototype.selectedTab	= null; cXULElement_tabbox.prototype.selectedPanel	= null; 
cXULElement_tabbox.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_tabs)
				this.tabs	= oEvent.target;
			else
			if (oEvent.target instanceof cXULElement_tabpanels)
				this.tabpanels	= oEvent.target;
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_tabs)
				this.tabs	= oEvent.target;
			else
			if (oEvent.target instanceof cXULElement_tabpanels)
				this.tabpanels	= oEvent.target;
		}
	}
};

cXULElement_tabbox.attributes	= {};
cXULElement_tabbox.attributes.orient	= "vertical";

cXULElement_tabbox.prototype.$getTagOpen	= function() {
	return '<div class="xul-tabbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_tabbox.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_tabbox);


var cXULElement_tabpanel	= function(){};
cXULElement_tabpanel.prototype	= new cXULElement("tabpanel");
cXULElement_tabpanel.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_tabpanel.attributes	= {};
cXULElement_tabpanel.attributes.hidden	= "true";
cXULElement_tabpanel.attributes.width	= "100%";


cXULElement_tabpanel.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.parentNode instanceof cXULElement_tabpanels) {
			var oTabBox	= this.parentNode.parentNode;
			if (oTabBox instanceof cXULElement_tabbox) {
				if (!isNaN(oTabBox.attributes["selectedIndex"]) && oTabBox.tabs.items.length > oTabBox.attributes["selectedIndex"] && this.parentNode.items.$indexOf(this) == oTabBox.attributes["selectedIndex"] * 1)
					oTabBox.tabs.goTo(oTabBox.attributes["selectedIndex"] * 1);
				else
				if (!this.nextSibling)
					oTabBox.tabs.goTo(0);
			}
		}
	}
};

cXULElement_tabpanel.prototype.$getTagOpen	= function() {
	return '<div class="xul-tabpanel' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' +(this.attributes["hidden"] != "false" ? ' style="display:none"' : '')+ '>';
};

cXULElement_tabpanel.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_tabpanel);


var cXULElement_tabpanels	= function() {
		this.items		= new ample.classes.NodeList;
};
cXULElement_tabpanels.prototype	= new cXULElement("tabpanels");

cXULElement_tabpanels.prototype.selectedIndex	= null; cXULElement_tabpanels.prototype.selectedPanel	= null; 

cXULElement_tabpanels.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_tabpanel)
				this.items.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_tabpanel)
				this.items.$remove(oEvent.target);
	}
};

cXULElement_tabpanels.prototype.$getTagOpen	= function() {
	return '<div class="xul-tabpanels' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_tabpanels.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_tabpanels);


var cXULElement_tabs	= function() {
		this.items		= new ample.classes.NodeList;
};
cXULElement_tabs.prototype	= new cXULElement("tabs");
cXULElement_tabs.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_tabs.prototype.tabIndex	= 0;
cXULElement_tabs.prototype.$selectable	= false;

cXULElement_tabs.prototype.selectedIndex	=-1;	cXULElement_tabs.prototype.selectedItem		= null; 
cXULElement_tabs.prototype.advanceSelectedTab	= function(nDir) {
	if (nDir == 1)
		this.goTo(this.parentNode.selectedIndex + 1);
	else
	if (nDir ==-1)
		this.goTo(this.parentNode.selectedIndex - 1);
};

cXULElement_tabs.prototype.goTo		= function(nIndex) {
		if (this.parentNode.selectedIndex != nIndex && this.items[nIndex]) {
				var oEvent	= this.ownerDocument.createEvent("Event");
		oEvent.initEvent("beforeselect", false, true);
		if (this.dispatchEvent(oEvent) == false)
			return;

				if (this.parentNode.selectedTab)
			this.parentNode.selectedTab.setAttribute("selected", "false");
		if (this.parentNode.selectedPanel)
			this.parentNode.selectedPanel.setAttribute("hidden", "true");

				this.parentNode.selectedTab		= this.items[nIndex];
		this.parentNode.selectedTab.setAttribute("selected", "true");
		if (this.parentNode.tabpanels && this.parentNode.tabpanels.items[nIndex]) {
			this.parentNode.selectedPanel	= this.parentNode.tabpanels.items[nIndex];
			this.parentNode.selectedPanel.setAttribute("hidden", "false");
						oXULReflowManager.schedule(this.parentNode.selectedPanel);
		}

		this.parentNode.selectedIndex	= nIndex;

				var oEvent	= this.ownerDocument.createEvent("Event");
		oEvent.initEvent("select", true, true);
		this.dispatchEvent(oEvent);
	}
};

cXULElement_tabs.prototype.appendItem	= function(sLabel, sValue) {
	this.insertItemAt(this.items.length, sLabel, sValue);
};

cXULElement_tabs.prototype.insertItemAt	= function(nIndex, sLabel, sValue) {
	};

cXULElement_tabs.prototype.removeItemAt	= function(nIndex) {
	};

cXULElement_tabs.handlers	= {
	"keydown":	function(oEvent) {
		switch (oEvent.keyIdentifier) {
			case "Left":
				var oTabBox	= this.parentNode;
				if (oTabBox.selectedTab && oTabBox.selectedTab.previousSibling)
					oTabBox.selectedTab.previousSibling.$activate();
				break;

			case "Right":
				var oTabBox	= this.parentNode;
				if (oTabBox.selectedTab && oTabBox.selectedTab.nextSibling)
					oTabBox.selectedTab.nextSibling.$activate();
				break;
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_tab)
				this.items.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_tab)
				this.items.$remove(oEvent.target);
	}
};

cXULElement_tabs.prototype.$getTagOpen	= function() {
	return '<div class="xul-tabs' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_tabs.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_tabs);


var cXULElement_textbox	= function(){
		this.contentFragment	= ample.createDocumentFragment();
	this.spinButtons		= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:spinbuttons"));
		var that	= this;
	this.spinButtons.addEventListener("spin", function(oEvent) {
		var nValue	=(that.getAttribute("value") * 1 || 0) + (oEvent.detail ? 1 :-1);
		if (nValue >= that.getAttribute("min") * 1 && nValue <= that.getAttribute("max") * 1) {
			that.setAttribute("value", nValue);
			cXULInputElement.dispatchChange(this);
		}
	}, false);
};
cXULElement_textbox.prototype	= new cXULInputElement("textbox");
cXULElement_textbox.prototype.$selectable	= true;

cXULElement_textbox.attributes	= {
	"min":		"0",
	"max":		"Infinity",
	"increment":"1",
	"value":	""
};

cXULElement_textbox.handlers	= {
	"focus":	function(oEvent) {
		this.$getContainer("input").focus();
				this.$getContainer("placeholder").style.display	= "none";
	},
	"blur":		function(oEvent) {
		this.$getContainer("input").blur();
				if (!this.$getContainer("input").value)
			this.$getContainer("placeholder").style.display	= "";
	},
	"keydown":	function(oEvent) {
		if (this.attributes["type"] == "number") {
			if (oEvent.keyIdentifier == "Up" || oEvent.keyIdentifier == "Down")
				this.spinButtons.spin(oEvent.keyIdentifier == "Up");
		}
	},
	"keyup":	function(oEvent) {
		this.attributes["value"]	= this.$getContainer("input").value;
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "disabled") {
				if (this.attributes["type"] == "number")
					this.spinButtons.setAttribute("disabled", oEvent.newValue == "true" ? "true" : "false");
			}
			else
			if (oEvent.attrName == "type") {
							}
			else
			if (oEvent.attrName == "maxlength") {
							}
		}
	}
};

cXULElement_textbox.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "value") {
		this.$getContainer("placeholder").style.display	= sValue ? "none" : '';
		this.$getContainer("input").value	= sValue || '';
	}
	else
	if (sName == "disabled") {
		this.$setPseudoClass("disabled", sValue == "true");
		this.$getContainer("input").disabled	= sValue == "true";
	}
	else
	if (sName == "readonly")
		this.$getContainer("input").readOnly	= sValue == "true";
	else
	if (sName == "placeholder")
		this.$getContainer("placeholder").innerHTML	= sValue || '';
	else
	if (sName == "type") {
			}
	else
	if (sName == "multiline") {
			}
	else
	if (sName == "row") {
		if (this.attributes["multiline"] == "true")
			this.$getContainer("input").rows	= sValue || '';
	}
	else
	if (sName == "cols") {
		if (this.attributes["multiline"] == "true")
			this.$getContainer("input").cols	= sValue || '';
	}
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_textbox.prototype._onChange	= function(oEvent) {
		cXULInputElement.dispatchChange(this);
};

cXULElement_textbox.prototype.$getTagOpen	= function(oElement) {
	var bMultiline	= this.attributes["multiline"] == "true";
	if (this.attributes["type"] == "number")
		this.spinButtons.attributes["disabled"]	= this.$isAccessible() ? "false" : "true";
	return	'<div class="xul-textbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (bMultiline ? ' xul-textbox-multiline-true' : '') + " xul-textbox-type-" + (this.attributes["type"] || '') + (!this.$isAccessible() ? " xul-textbox_disabled" : '')+ '" style="'+
				(this.attributes["height"] ? 'height:' + this.attributes["height"] + ';' : '')+
				(this.attributes["width"] ? 'width:' + this.attributes["width"] + ';' : '')+
				(this.attributes["style"] ? this.attributes["style"] : '')+'">\
				<div class="xul-textbox--placeholder" style="position:absolute;' + (this.getAttribute("value") == '' ? '' : 'display:none')+ '" onmousedown="var o = ample.$instance(this); setTimeout(function(){o.$getContainer(\'input\').focus();o.$getContainer(\'input\').select()}, 0)">' + (this.attributes["placeholder"] ? ample.$encodeXMLCharacters(this.attributes["placeholder"]) : '') + '</div>\
				<div class="xul-textbox--field">\
					' + (this.attributes["type"] == "number" ? this.spinButtons.$getTag() : this.attributes["type"] == "search" ? '<div class="xul-textbox--button" onmousedown="return false"></div>' : '')+ '\
					<' +
					(bMultiline
						?("textarea" + (this.attributes["rows"] ? ' rows="' + this.attributes["rows"] + '"' : '')+(this.attributes["cols"] ? ' cols="' + this.attributes["cols"] + '"' : ''))
						: this.attributes["type"] == "password"
							? 'input type="password"'
							: 'input type="text"')+
						' class="xul-textbox--input" name="' + ample.$encodeXMLCharacters(this.attributes["name"] || '') + '" autocomplete="off" style="width:100%;' + (bMultiline ? 'height:100%;' : '') + 'border:0px solid white;"'+
						' onblur="ample.$instance(this)._onChange(event)" onselectstart="event.cancelBubble=true;"'+
						(!this.$isAccessible() ? ' disabled="true"' : '')+
						(this.attributes["readonly"] == "true" ? ' readonly="true"' : '')+
						(this.hasAttribute("maxlength") ? ' maxlength="' + this.getAttribute("maxlength") + '"' : '')+
					(bMultiline
						? '>' + (this.attributes["value"] ? ample.$encodeXMLCharacters(this.attributes["value"]) : '') + '</textarea>'
						:(this.attributes["value"] ? ' value="' + ample.$encodeXMLCharacters(this.attributes["value"]) + '"' : '') +' />')+ '\
				</div>\
			</div>';
};

ample.extend(cXULElement_textbox);


var cXULElement_timepicker	= function() {
		this.contentFragment	= ample.createDocumentFragment();
	this.spinButtons		= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:spinbuttons"));
		var that	= this;
	this.spinButtons.addEventListener("spin", function(oEvent) {
		var aTime	= that.attributes["value"].split(":"),
			aRange	= cXULInputElement.getSelectionRange(that);
		var sComponent	= cXULElement_timepicker.getEditComponent(that),
			nComponent;
		switch (sComponent) {
			case 'h':
				nComponent	= aTime[0] * 1 + (oEvent.detail ? 1 :-1);
				if (nComponent > 23)
					nComponent	= 0;
				else
				if (nComponent < 0)
					nComponent	= 23;
				aTime[0]	= (nComponent.toString().length < 2 ? '0' : '') + nComponent;
				break;
			case 'm':
				nComponent	= aTime[1] * 1 + (oEvent.detail ? 1 :-1);
				if (nComponent > 59)
					nComponent	= 0;
				else
				if (nComponent < 0)
					nComponent	= 59;
				aTime[1]	= (nComponent.toString().length < 2 ? '0' : '') + nComponent;
				break;
			case 's':
			default:
				nComponent	= aTime[2] * 1 + (oEvent.detail ? 1 :-1);
				if (nComponent > 59)
					nComponent	= 0;
				else
				if (nComponent < 0)
					nComponent	= 59;
				aTime[2]	= (nComponent.toString().length < 2 ? '0' : '') + nComponent;
		}
		that.setAttribute("value", aTime.join(':'));
		cXULElement_timepicker.setEditComponent(that, sComponent);
	}, false);
};
cXULElement_timepicker.prototype	= new cXULInputElement("timepicker");

cXULElement_timepicker.attributes	= {
	"mask":		'hh:mm:ss',
	"value":	'00:00:00'
};


cXULElement_timepicker.prototype._onInputTimeChange	= function(oEvent, sName, sValue) {
	this._setValue(sName, sValue);

		cXULInputElement.dispatchChange(this);
};

cXULElement_timepicker.handlers	= {
	"focus":	function(oEvent) {
		var oInput	= this.$getContainer("input");
		oInput.focus();
		cXULElement_timepicker.setEditComponent(this, oInput.lastCursorPosition || 'h');
	},
	"blur":		function(oEvent) {
		var oInput	= this.$getContainer("input");
		oInput.lastCursorPosition	= cXULElement_timepicker.getEditComponent(this);
		oInput.blur();
	},
	"keydown":	function(oEvent) {
		if (oEvent.keyIdentifier == "Up") {
			this.spinButtons.spin(true);
			oEvent.preventDefault();
		}
		else
		if (oEvent.keyIdentifier == "Down") {
			this.spinButtons.spin(false);
			oEvent.preventDefault();
		}
		else
		if (oEvent.keyIdentifier == "Left") {
			switch (cXULElement_timepicker.getEditComponent(this)) {
				case "s":
					cXULElement_timepicker.setEditComponent(this, 'm');
					break;
				case "m":
					cXULElement_timepicker.setEditComponent(this, 'h');
					break;
			}
			oEvent.preventDefault();
		}
		else
		if (oEvent.keyIdentifier == "Right") {
			switch (cXULElement_timepicker.getEditComponent(this)) {
				case "m":
					cXULElement_timepicker.setEditComponent(this, 's');
					break;
				case "h":
					cXULElement_timepicker.setEditComponent(this, 'm');
					break;
			}
			oEvent.preventDefault();
		}
	},
	"mouseup":	function(oEvent) {
		if (oEvent.$pseudoTarget == this.$getContainer("input"))
			cXULElement_timepicker.setEditComponent(this, cXULElement_timepicker.getEditComponent(this));
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "disabled") {
				this.spinButtons.setAttribute("disabled", oEvent.newValue == "true" ? "true" : "false");
			}
		}
	}
};

cXULElement_timepicker.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "value")
		this.$getContainer("input").value	= sValue || '';
	else
		cXULInputElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_timepicker.getEditComponent	= function(oInstance) {
	var aRange	= cXULInputElement.getSelectionRange(oInstance);
	if (aRange[1] > 5)
		return 's';
	else
	if (aRange[1] > 2)
		return 'm';
	else
		return 'h';
};

cXULElement_timepicker.setEditComponent	= function(oInstance, sComponent) {
	var nStart	= 0,
		nEnd	= 8;
	switch (sComponent) {
		case 's':
			nStart	= 6;
			nEnd	= 8;
			break;
		case 'm':
			nStart	= 3;
			nEnd	= 5;
			break;
		case 'h':
		default:
			nStart	= 0;
			nEnd	= 2;
			break;
	}
	cXULInputElement.setSelectionRange(oInstance, nStart, nEnd);
};

cXULElement_timepicker.prototype.$getTagOpen		= function() {
	var aTime	= this.attributes["value"].split(":");
	this.spinButtons.attributes["disabled"]	= this.$isAccessible() ? "false" : "true";
	return '<div class="xul-timepicker' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? " xul-timepicker_disabled" : '') + '">\
				<div class="xul-timepicker--field">\
						' + this.spinButtons.$getTag() + '\
					<input type="text" class="xul-timepicker--input" maxlength="8"' +(!this.$isAccessible() ? ' disabled="true"' : '')+ ' style="border:0px solid white;width:100%;" value="' + (aTime ? aTime[0] : "00") + ':' + (aTime ? aTime[1] : "00") + ':' + (aTime ? aTime[2] : "00") + '" />\
				</div>\
			</div>';
};

ample.extend(cXULElement_timepicker);


var cXULElement_toolbar	= function(){};
cXULElement_toolbar.prototype	= new cXULElement("toolbar");
cXULElement_toolbar.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_toolbar.prototype.$selectable	= false;

cXULElement_toolbar.prototype.$getTagOpen		= function() {
	return '<div class="xul-toolbar' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_toolbar.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_toolbar);


var cXULElement_toolbarbutton	= function(){};
cXULElement_toolbarbutton.prototype	= new cXULElement("toolbarbutton");

cXULElement_toolbarbutton.prototype.$hoverable	= true;

cXULElement_toolbarbutton.handlers	= {
	"mouseout":		function(oEvent) {
		if (this.getAttribute("open") != "true")
			this.$setPseudoClass("active", false);
	},
	"mouseup":		function(oEvent) {
		if (this.getAttribute("open") != "true")
			this.$setPseudoClass("active", false);
	},
	"mousedown":	function(oEvent) {
		if (!this.$isAccessible())
			return;

		if (oEvent.button == 0) {
			var sType	= this.getAttribute("type");
			if (sType == "menu-button") {
								if (oEvent.$pseudoTarget == this.$getContainer("arrow")) {
					if (this.getAttribute("open") == "true")
						this.setAttribute("open", "false");
					else {
						this.setAttribute("open", "true");
						this.$setPseudoClass("active", true);
					}
				}
				else
				if (this.getAttribute("open") == "true")
					return;
			}
			else
			if (sType == "menu") {
				if (this.getAttribute("open") != "true")
					this.setAttribute("open", "true");
				else
					return;
			}
			else
			if (sType == "checkbox") {
				if (this.getAttribute("checked") == "true")
					this.setAttribute("checked", "false");
				else
					this.setAttribute("checked", "true");
			}
			else
			if (sType == "radio") {
				if (this.getAttribute("checked") != "true") {
					var sGroup	= this.getAttribute("group").match(/^\w+$/),
						sNamespaceURI	= this.namespaceURI;
					if (sGroup) {
												var aGroup	= this.ownerDocument.querySelectorAll("xul|toolbarbutton[group=" + sGroup[0] + "][checked=true]", function() {return sNamespaceURI;});
						for (var nIndex = 0; nIndex < aGroup.length; nIndex++)
							aGroup[nIndex].setAttribute("checked", "false");
												this.setAttribute("checked", "true");
					}
				}
			}

						this.$setPseudoClass("active", true);
		}
	},
	"click":	function(oEvent) {
		var sType	= this.getAttribute("type");
		if (oEvent.target == this && oEvent.button == 0) {
			if (sType == "menu-button") {
				if (oEvent.$pseudoTarget != this.$getContainer("arrow"))
					this.$activate();
			}
			else
			if (sType != "menu")
				this.$activate();
		}
	},
	"DOMActivate":	function(oEvent) {
		if (oEvent.target == this)
			this.doCommand();
	}
};

cXULElement_toolbarbutton.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "open") {
		var oElement	= this.getElementsByTagNameNS(this.namespaceURI, "menupopup")[0];
		if (oElement) {
			if (sValue == "true") {
				var that	= this;
				oElement.showPopup(this, -1, -1, cXULPopupElement.POPUP_TYPE_POPUP);
				oElement.addEventListener("popuphidden", function(oEvent) {
					oElement.removeEventListener("popuphidden", arguments.callee, false);
										that.$setPseudoClass("active", false);
					that.setAttribute("open", "false");
				}, false);
								this.ownerDocument.popupNode	= oElement;
			}
			else {
				oElement.hidePopup();
								this.ownerDocument.popupNode	= null;
			}
		}
	}
	else
	if (sName == "disabled")
		this.$setPseudoClass("disabled", sValue == "true");
	else
	if (sName == "type") {
			}
	else
	if (sName == "checked") {
		var sType	= this.getAttribute("type");
		if (sType == "checkbox" || sType == "radio")
			this.$setPseudoClass("checked", sValue == "true");
	}
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	=(this.attributes["image"] ? '<img src="' + this.attributes["image"] + '" align="absmiddle" />' : '') + ' ' + (sValue || '');
	else
	if (sName == "image")
		this.$getContainer("label").innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" />' : '') + ' ' + (this.attributes["label"] || '');
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_toolbarbutton.prototype.$getTagOpen	= function() {
	var sType	= this.getAttribute("type");
	return '<table cellpadding="0" cellspacing="0" border="0" class="xul-toolbarbutton' +
				(!this.$isAccessible() ? " xul-toolbarbutton_disabled" : "") +
				((sType == "radio" || sType == "checkbox") && this.getAttribute("checked") == "true" ? " xul-toolbarbutton_checked" : "") +
				(this.attributes["class"] ? " " + this.attributes["class"] : "") + '">\
				<tbody>\
					<tr height="3">\
						<td width="3" rowspan="3" class="xul-toolbarbutton-left"><div style="width:3px"/></td>\
						<td class="xul-toolbarbutton-top"></td>'+
					(sType == "menu-button"
						? '<td width="3" rowspan="3" class="xul-toolbarbutton-right"></td>'
								: '')+
					(sType == "menu" || sType == "menu-button"
						? '<td class="xul-toolbarbutton-top"></td>'
								: '')+ '\
						<td width="3" rowspan="3" class="xul-toolbarbutton-right"><div style="width:3px"/></td>\
					</tr>\
					<tr>\
						<td nowrap="nowrap">\
							<div class="xul-toolbarbutton--label">' +
					(this.hasAttribute("image")
						? '<img src="' + ample.$encodeXMLCharacters(this.getAttribute("image")) + '" align="absmiddle"/>'
						: '')+
					(this.hasAttribute("label")
						? ' ' + ample.$encodeXMLCharacters(this.getAttribute("label"))
						: '')+ '\
							</div>\
							<div class="xul-toolbarbutton--gateway">';

	return sHtml;
};

cXULElement_toolbarbutton.prototype.$getTagClose	= function() {
	var sType	= this.getAttribute("type");
	return '				</div>\
						</td>'+
					(sType == "menu" || sType == "menu-button"
						? '<td class="xul-toolbarbutton-arrow"><div class="xul-toolbarbutton--arrow"><br /></div></td>'
						: '') + '\
					</tr>\
					<tr height="3">\
						<td class="xul-toolbarbutton-bottom"></td>'+
					(sType == "menu" || sType == "menu-button"
						? '<td class="xul-toolbarbutton-bottom"></td>'
						: '')+ '\
					</tr>\
				</tbody>\
			</table>';
};

ample.extend(cXULElement_toolbarbutton);


var cXULElement_toolbargrippy	= function(){};
cXULElement_toolbargrippy.prototype	= new cXULElement("toolbargrippy");

cXULElement_toolbargrippy.prototype.$getTagOpen	= function() {
	return (this.parentNode instanceof cXULElement_menubar ? "<td>" : "") + '<div class="xul-toolbargrippy' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></div>';
};

cXULElement_toolbargrippy.prototype.$getTagClose	= function() {
	return this.parentNode instanceof cXULElement_menubar ? "</td>" : "";
};

ample.extend(cXULElement_toolbargrippy);


var cXULElement_toolbarseparator	= function(){};
cXULElement_toolbarseparator.prototype	= new cXULElement("toolbarseparator");

cXULElement_toolbarseparator.prototype.$getTagOpen	= function() {
	return '<div class="xul-toolbarseparator' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></div>';
};

ample.extend(cXULElement_toolbarseparator);


var cXULElement_toolbarspacer	= function(){};
cXULElement_toolbarspacer.prototype	= new cXULElement("toolbarspacer");

cXULElement_toolbarspacer.prototype.$getTagOpen	= function() {
	return '<div class="xul-toolbarspacer' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></div>';
};

ample.extend(cXULElement_toolbarspacer);


var cXULElement_toolbarspring	= function(){};
cXULElement_toolbarspring.prototype	= new cXULElement("toolbarspring");

cXULElement_toolbarspring.attributes	= {};
cXULElement_toolbarspring.attributes.flex	= "1";

cXULElement_toolbarspring.prototype.$getTagOpen	= function() {
	return '<div class="xul-toolbarspring' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"><br /></div>';
};

ample.extend(cXULElement_toolbarspring);


var cXULElement_toolbox	= function(){};
cXULElement_toolbox.prototype	= new cXULElement("toolbox");
cXULElement_toolbox.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_toolbox.attributes	= {};
cXULElement_toolbox.attributes.orient	= "vertical";

cXULElement_toolbox.prototype.$getTagOpen		= function() {
	return '<div class="xul-toolbox' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_toolbox.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_toolbox);


var cXULElement_tooltip_pane	= function(){};
cXULElement_tooltip_pane.prototype	= new cXULPopupElement("tooltip-pane");

cXULElement_tooltip_pane.prototype.setText	= function(sValue) {
	this.$getContainer("gateway").innerHTML	= sValue;
};

cXULElement_tooltip_pane.prototype.$getTagOpen	= function() {
	return '<div class="xul-tooltip-pane" style="position:absolute;display:none;">\
				<div class="xul-menupopup--shadow-right" style="position:absolute;"></div>\
				<div class="xul-menupopup--shadow-bottom" style="position:absolute;"></div>\
				<div class="xul-tooltip-pane--gateway">';
};

cXULElement_tooltip_pane.prototype.$getTagClose	= function() {
	return '	</div>\
			</div>';
};

ample.extend(cXULElement_tooltip_pane);


var cXULElement_tooltip	= function(){};
cXULElement_tooltip.prototype	= new cXULPopupElement("tooltip");
cXULElement_tooltip.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_tooltip.prototype.$getTagOpen		= function() {
	return '<div style="display:none;position:absolute;" class="xul-tooltip' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '">';
};

cXULElement_tooltip.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_tooltip);


var cXULElement_tree	= function() {
		this.items	= new ample.classes.NodeList;
	this.selectedItems	= new ample.classes.NodeList;
};
cXULElement_tree.prototype	= new cXULSelectElement("tree");

cXULElement_tree.prototype.head	= null;
cXULElement_tree.prototype.body	= null;

cXULElement_tree.prototype.changeOpenState		= function(oRow, bState) {
	if (oRow && oRow instanceof cXULElement_treerow) {
		if (arguments.length < 2)
			bState	= oRow.parentNode.getAttribute("open") != "true";
		oRow.setAttribute("open", bState ? "true" : "false");
	}
};

cXULElement_tree.prototype.ensureRowIsVisible	= function(nIndex) {
	var oElement	= this.items[nIndex];
	do {
		if (oElement.parentNode.attributes["hidden"] == "true")
			return false;
		oElement	= oElement.parentNode.parentNode;
	} while (oElement != this.body);

		return true;
};

cXULElement_tree.handlers	= {
	"keydown":	function(oEvent) {
		if (this.currentItem) {
			if (oEvent.keyIdentifier == "Up") {
								var nIndex	= this.selectedItems[this.selectedItems.length-1].$getContainer().rowIndex;

								while (nIndex - 1 > 0 && this.ensureRowIsVisible(nIndex - 1) == false)
					nIndex--;

				if (nIndex > 0) {
					if (oEvent.shiftKey) {
												if (this.selectedItems.length > 1)
							if (this.currentItem.$getContainer().rowIndex > this.selectedItems[0].$getContainer().rowIndex)
								nIndex++;

						this.toggleItemSelection(this.items[nIndex-1]);
					}
					else
						this.selectItem(this.items[nIndex-1]);

										this.scrollToIndex(nIndex-1);
				}
								oEvent.preventDefault();
			}
			else
			if (oEvent.keyIdentifier == "Down") {
								var nIndex	= this.selectedItems[this.selectedItems.length-1].$getContainer().rowIndex;

								while (nIndex + 1 < this.items.length && this.ensureRowIsVisible(nIndex + 1) == false)
					nIndex++;

				if (nIndex < this.items.length - 1) {
					if (oEvent.shiftKey) {
												if (this.selectedItems.length > 1)
							if (this.currentItem.$getContainer().rowIndex < this.selectedItems[0].$getContainer().rowIndex)
								nIndex--;

						this.toggleItemSelection(this.items[nIndex+1]);
					}
					else
						this.selectItem(this.items[nIndex+1]);

										this.scrollToIndex(nIndex+1);
				}
								oEvent.preventDefault();
			}
			else
			if (oEvent.keyIdentifier == "Right") {
								if (this.currentItem.children) {
					if (this.currentItem.attributes["open"] == "true")
						this.selectItem(this.currentItem.children.items[0]);
					else
						this.currentItem.setAttribute("open", "true");
				}

								oEvent.preventDefault();
			}
			else
			if (oEvent.keyIdentifier == "Left") {
								if (this.currentItem.children && this.currentItem.attributes["open"] == "true")
					this.currentItem.setAttribute("open", "false");
				else
				if (this.currentItem.parentNode.parentNode != this.body)
					this.selectItem(this.currentItem.parentNode.parentNode);

								oEvent.preventDefault();
			}
			else
			if (oEvent.keyIdentifier == "Enter") {
								if (this.currentItem.children)
					this.currentItem.setAttribute("open", this.currentItem.attributes["open"] == "true" ? "false" : "true");
			}
		}
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "seltype") {
							}
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
	 		if (oEvent.target instanceof cXULElement_treebody)
				this.body	= oEvent.target;
			else
			if (oEvent.target instanceof cXULElement_treecols)
				this.head	= oEvent.target;
		}
		else {
			if (oEvent.target instanceof cXULElement_treeitem) {
								var oItemPrevious	= cXULElement_tree.getPreviousItem(oEvent.target);
								if (oItemPrevious)
					this.items.$add(oEvent.target, this.items.$indexOf(oItemPrevious) + 1);
				else
					this.items.$add(oEvent.target);
			}
			else
			if (oEvent.target instanceof cXULElement_treechildren) {
				var oItemPrevious	= oEvent.target.parentNode instanceof cXULElement_treeitem ? oEvent.target.parentNode : null;
								var oTree	= this;
				(function(oChildren, oItemPrevious) {
					for (var nIndex = 0, oItem; nIndex < oChildren.items.length; nIndex++) {
						oItem = oChildren.items[nIndex];
						if (oItemPrevious) {
							oTree.items.$add(oItem, oTree.items.$indexOf(oItemPrevious) + 1);
							oItemPrevious	= oItem;
						}
						else
							oTree.items.$add(oItem);
												if (oItem.children)
							arguments.callee(oItem.children, oItem);
					}
				})(oEvent.target, oItemPrevious);
			}
		}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this) {
			if (oEvent.target instanceof cXULElement_treebody)
				this.body	= null;
			else
			if (oEvent.target instanceof cXULElement_treecols)
				this.head	= null;
		}
		else {
			if (oEvent.target instanceof cXULElement_treeitem) {
								if (this.selectedItems.$indexOf(oEvent.target) !=-1)
					this.removeItemFromSelection(oEvent.target);
								this.items.$remove(oEvent.target);
			}
			else
			if (oEvent.target instanceof cXULElement_treechildren) {
								var oTree	= this;
				(function(oChildren) {
					for (var nIndex = 0, oItem; nIndex < oChildren.items.length; nIndex++) {
						oItem	= oChildren.items[nIndex];
						oTree.items.$remove(oItem);
												if (oItem.children)
							arguments.callee(oItem.children);
					}
				})(oEvent.target);
			}
		}
	}
};

cXULElement_tree.getPreviousItem	= function(oItem) {
	var oItemPrevious	= oItem.previousSibling;
	if (oItemPrevious)
		while (oItemPrevious.children && oItemPrevious.children.items.length)
			oItemPrevious	= oItemPrevious.children.items[oItemPrevious.children.items.length - 1];
	else
	if (oItem.parentNode && oItem.parentNode.parentNode instanceof cXULElement_treeitem)
		oItemPrevious	= oItem.parentNode.parentNode;
		return oItemPrevious;
};

cXULElement_tree.getNextItem		= function(oItem) {

};

cXULElement_tree.prototype.$getTagOpen		= function() {
	var sHeight	= this.attributes["height"],
		sWidth	= this.attributes["width"];
	return '<div class="xul-tree' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + (!this.$isAccessible() ? " xul-tree_disabled" : "") + '" style="' + (sHeight ? 'height:' + (sHeight * 1 == sHeight ? sHeight + "px" : sHeight) + ';' : '') + (sWidth ? 'width:' + (sWidth * 1 == sWidth ? sWidth + "px" : sWidth) + ';' : '') + (this.attributes["style"] ? this.attributes["style"] + '' : '') + '">\
				<div style="position:relative;height:100%;top:0;padding-bottom:inherit;">\
					<div class="xul-tree--resizer" style="height:100%;position:absolute;top:0px;display:none;z-index:1"></div>\
					<table cellpadding="0" cellspacing="0" border="0" height="100%" width="100%" style="position:absolute">\
						<tbody class="xul-tree--gateway">';
};

cXULElement_tree.prototype.$getTagClose	= function() {
	return 				'</tbody>\
					</table>\
				</div>\
			</div>';
};

ample.extend(cXULElement_tree);


var cXULElement_treebody	= function(){};
cXULElement_treebody.prototype	= new cXULElement("treebody");

cXULElement_treebody.prototype.children	= null;


cXULElement_treebody.prototype._onScroll	= function() {
	if (this.parentNode.head)
		this.parentNode.head.$getContainer("area").scrollLeft	= this.$getContainer("area").scrollLeft;
};

cXULElement_treebody.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treechildren) {
				oEvent.target.tree	= this.parentNode;

								this.children	= oEvent.target;
			}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treechildren) {
				oEvent.target.tree	= null;

								this.children	= null;
			}
	}
};

cXULElement_treebody.prototype.$getTagOpen	= function() {
	var bOldTrident	= navigator.userAgent.match(/MSIE ([\d.]+)/) && RegExp.$1 < 8;
	return '<tr' +(this.attributes["hidden"] == "true" ? ' style="display:hidden;"' : '')+ '>\
				<td style="height:100%">\
					<div class="xul-treebody--area" style="height:100%;width:100%;overflow:scroll;position:relative;" onscroll="return ample.$instance(this)._onScroll(event)">\
						' + (bOldTrident ? '<div style="position:absolute;border-left:solid 18px white;margin-left:-18px;">' : '')+'\
						<table cellpadding="0" cellspacing="0" border="0" class="xul-treebody' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' + (!bOldTrident ? ' style="position:absolute"' : '')+ '>\
							<tbody class="xul-treebody--gateway">';
};

cXULElement_treebody.prototype.$getTagClose	= function() {
	var bOldTrident	= navigator.userAgent.match(/MSIE ([\d.]+)/) && RegExp.$1 < 8;
	var aHtml	= ['</tbody>'];
	if (this.parentNode.head) {
		aHtml.push('<tfoot class="xul-treebody--foot">');
		aHtml.push('<tr>');
		if (this.parentNode.attributes["type"] == "checkbox" || this.parentNode.attributes["type"] == "radio")
			aHtml.push('<td width="20"><div style="width:20px"></div></td>');
		for (var nIndex = 0, aItems = this.parentNode.head.items, oItem; oItem = aItems[nIndex]; nIndex++)
			aHtml.push('<td style="padding-top:0px;padding-bottom:0px;height:1px;' + (oItem.attributes["hidden"] == "true" ? 'display:none' : '') + '" class="xul-treecell"><div style="height:1px;' + (oItem.attributes["width"] ? 'width:' + oItem.attributes["width"] + 'px;' : '') + '"></div><div style="height:1px;' + (oItem.attributes["minwidth"] ? 'width:' + oItem.attributes["minwidth"] + 'px' : '') + '"></div></td>');
		aHtml.push('</tr>');
		aHtml.push('</tfoot>');
	}
	aHtml.push('</table>');
	if (bOldTrident)
		aHtml.push('</div>');
	aHtml.push('</div>');
	aHtml.push('</td>');
	aHtml.push('</tr>');

	return aHtml.join('');
};

ample.extend(cXULElement_treebody);


var cXULElement_treecell	= function(){};
cXULElement_treecell.prototype	= new cXULElement("treecell");

cXULElement_treecell.handlers	= {
	"mousedown":	function(oEvent) {
		if (oEvent.target == this && oEvent.$pseudoTarget == this.$getContainer("toc"))
			this.parentNode.parentNode.setAttribute("open", this.parentNode.parentNode.getAttribute("open") == "true" ? "false" : "true");
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		var oChildren	= this.parentNode.parentNode.parentNode;
		if (oChildren.tree.head && oChildren.tree.head._getPrimaryColIndex() == this.parentNode.childNodes.$indexOf(this))
			oXULReflowManager.schedule(oChildren);
	}
};

cXULElement_treecell.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "label")
		this.$getContainer("gateway").innerHTML	=(this.attributes["src"] ? '<img src="' + this.attributes["src"] + '" align="absmiddle" /> ' :'') + (sValue || '');
	else
	if (sName == "src")
		this.$getContainer("gateway").innerHTML	=(sValue ? '<img src="' + sValue + '" align="absmiddle" /> ' :'') + (this.attributes["label"] || '');
	else
	if (sName == "editable") {
		if (sValue == "true") {
			var oElementDOM	= this.$getContainer("gateway");
			oElementDOM.innerHTML	= '<input style="border:none; margin:0px; margin-left: 2px; padding-left: 2px; padding-top:1px; width:100px;" onselectstart="event.cancelBubble=true;" onchange="ample.$instance(this).setAttribute(\'label\', this.value)" onblur="this.onchange();" onkeydown="if (event.keyCode == 13) this.onchange(); else if (event.keyCode == 27) ample.$instance(this).setAttribute(\'editable\', \'false\')"/>';
			oElementDOM.firstChild.focus();
			oElementDOM.firstChild.value	= this.attributes["label"] || '';
		}
		else
			this.$mapAttribute("label", this.attributes["label"]);
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_treecell.prototype.$getTagOpen	= function() {
	var oChildren	= this.parentNode.parentNode.parentNode,
		oHead	= oChildren && oChildren.tree ? oChildren.tree.head : null,
		nCellIndex	= this.parentNode.childNodes.$indexOf(this);
	var sHtml	= '<td class="xul-treecell' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '"' + (oHead && oHead.childNodes[nCellIndex] && oHead.childNodes[nCellIndex].attributes["hidden"] == "true" ? ' style="display:none"' : '') + '>';
	sHtml	+= '<div class="xul-treecell--box" style="position:relative;width:100%;"><div class="xul-treecell--label" style="position:absolute;width:100%;overflow:hidden;">';
	if (oHead && oHead._getPrimaryColIndex() == nCellIndex) {
		var oElementCurrent	= this;
		do {
			if (oElementCurrent instanceof cXULElement_treeitem)
				sHtml	+= '<div style="float:left;"><br /></div>';
			else
			if (oElementCurrent instanceof cXULElement_tree)
				break;
		} while(oElementCurrent = oElementCurrent.parentNode);
	}

	sHtml	+= '<div class="xul-treecell--gateway" style="width:100%">';
	if (this.attributes["src"])
		sHtml	+= '<img src="' + ample.$encodeXMLCharacters(this.attributes["src"]) + '" align="absmiddle"/> ';
	sHtml	+= this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : '';

	return sHtml;
};

cXULElement_treecell.prototype.$getTagClose	= function() {
	return '</div></div></div></td>';
};

ample.extend(cXULElement_treecell);


var cXULElement_treechildren	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_treechildren.prototype	= new cXULElement("treechildren");

cXULElement_treechildren.prototype.tree	= null;

cXULElement_treechildren.prototype.reflow	= function() {
	var nPrimaryCol	= this.tree.head._getPrimaryColIndex();
	if (nPrimaryCol ==-1)
		return;

	var aStack	= [];
	for (var oElement = this; !(oElement instanceof cXULElement_tree); oElement = oElement.parentNode.parentNode)
		aStack.unshift(oElement);
	this._refresh(aStack, nPrimaryCol);
};

cXULElement_treechildren.prototype._refresh	= function(aStack, nPrimaryCol) {
	var nDepth		= aStack.length,
		oChildren	= aStack[nDepth - 1],
		bTreeLines	= this.tree.attributes["treelines"] != "false",
		nItems		= oChildren.items.length;

	for (var nItem = 0, oItem, oElementDOM; nItem < nItems; nItem++) {
				oItem		= oChildren.items[nItem];
		if (oItem.row && oItem.row.cells.length > nPrimaryCol) {
			oElementDOM	= oItem.row.cells[nPrimaryCol].$getContainer("label");

			if (bTreeLines) {
								for (var nIndex = 0; nIndex < nDepth - 1; nIndex++)
					oElementDOM.childNodes[nIndex].className = "xul-treecell-line" +(aStack[nIndex + 1].parentNode == aStack[nIndex + 1].parentNode.parentNode.items[aStack[nIndex + 1].parentNode.parentNode.items.length - 1] ? "" : " xul-treecell-line-regular");

								oElementDOM.childNodes[nDepth - 1].className	= "xul-treecell-line xul-treecell-line-" +(nItem == nItems - 1 ? "last" : "next");
			}

						if (oItem.attributes["container"] == "true") {
								if (oItem.children)
					this._refresh(aStack.concat(oItem.children), nPrimaryCol);

								oElementDOM.childNodes[nDepth - 1].className = "xul-treecell--toc" +(oChildren.items[nItem].attributes["open"] == "true" ? " xul-treecell--toc_open" : "");
			}
		}
	}
};

cXULElement_treechildren.handlers	= {
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "hidden") {
				for (var nIndex = 0; nIndex < this.items.length; nIndex++) {
					this.items[nIndex].setAttribute("hidden", oEvent.newValue);
					if (this.items[nIndex].children && this.items[nIndex].attributes["open"] != "false")
						this.items[nIndex].children.setAttribute("hidden", oEvent.newValue);
				}
			}
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		var oItem	= oEvent.target;
		if (oItem.parentNode == this)
			if (oItem instanceof cXULElement_treeitem) {
				var oItemNext	= oItem.nextSibling;
				if (oItemNext)
					this.items.$add(oItem, this.items.$indexOf(oItemNext));
				else
					this.items.$add(oItem);
			}
	},
	"DOMNodeRemoved":	function(oEvent) {
		var oItem	= oEvent.target;
		if (oItem.parentNode == this)
			if (oItem instanceof cXULElement_treeitem)
				this.items.$remove(oItem);
	}
};

cXULElement_treechildren.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "hidden") {
			}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_treechildren.prototype.$getContainer	= function(sName) {
	return this.parentNode && sName == "gateway" ? this.parentNode.$getContainer("gateway") : null;
};

ample.extend(cXULElement_treechildren);


var cXULElement_treecol	= function(){};
cXULElement_treecol.prototype	= new cXULElement("treecol");
cXULElement_treecol.prototype.$hoverable	= true;

cXULElement_treecol.attributes	= {
	"minwidth":	"16",
	"sortDirection":	"natural"
};

cXULElement_treecol.prototype.$isAccessible	= function() {
	return this.parentNode ? this.parentNode.$isAccessible() : true;
};

cXULElement_treecol.handlers	= {
	"mouseleave":	function(oEvent) {
		this.$setPseudoClass("active", false);
	},
	"mousedown":	function(oEvent) {
		this.setCapture(true);
		cXULSelectElement.onResizeStart(oEvent);
		if (!cXULSelectElement.resizing)
			this.$setPseudoClass("active", true);
	},
	"mouseup":		function(oEvent) {
		this.releaseCapture();
		if (!cXULSelectElement.resizing)
			this.$setPseudoClass("active", false);
		cXULSelectElement.onResizeEnd(oEvent);
	},
	"mousemove":	function(oEvent) {
		cXULSelectElement.onResize(oEvent);
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName ==  "hidden") {
				var nCell	= this.parentNode.items.$indexOf(this);
				for (var nIndex = 0, aItems = this.parentNode.parentNode.items; nIndex < aItems.length; nIndex++)
					if (aItems[nIndex].row)
						aItems[nIndex].row.cells[nCell].setAttribute("hidden", oEvent.newValue);
			}
		}
	}
};

cXULElement_treecol.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "width") {
		this.$getContainer("stretch").style.width	= sValue != null ? sValue + "px" : '';
		this.parentNode.parentNode.body.$getContainer("foot").rows[0].cells[this.parentNode.items.$indexOf(this) + (this.parentNode.parentNode.attributes["type"] ? 1 : 0)].getElementsByTagName("div")[0].style.width	= sValue != null ? sValue + "px" : '';
	}
	else
	if (sName == "label")
		this.$getContainer("label").innerHTML	= sValue || '';
	else
	if (sName == "hidden") {
		var nCell	= this.parentNode.items.$indexOf(this);
		this.$getContainer().style.display	= sValue == "true" ? "none" : "";
		this.parentNode.parentNode.body.$getContainer("foot").rows[0].cells[nCell + (this.parentNode.parentNode.attributes["type"] ? 1 : 0)].style.display	= sValue == "true" ? "none" : "";
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_treecol.prototype.$getTagOpen	= function() {
	return '<td class="xul-treecol' +(this.attributes["class"] ? " " + this.attributes["class"] : "")+ '"' + (this.attributes["hidden"] == "true" ? ' style="display:none"' : "")+ '>\
				<div class="xul-treecol--box" style="position:relative;width:100%;">\
					<div class="xul-treecol--label xul-treecol--gateway" style="position:absolute;width:100%;overflow:hidden;"> ' +(this.attributes["label"] ? ample.$encodeXMLCharacters(this.attributes["label"]) : "");
};

cXULElement_treecol.prototype.$getTagClose	= function() {
	return			'</div>\
					<div class="xul-treecol--resizer" style="position: absolute;right:0px;"><br /></div>\
				</div>\
				<div class="xul-treecol--stretch" style="height:1pt;font-size:1px;' + (this.attributes["width"] ? 'width:' + this.attributes["width"] + 'px' : '') + '"></div>\
				<div style="height:1pt;font-size:1px;' + (this.attributes["minwidth"] ? 'width:' + this.attributes["minwidth"] + 'px' : '') + '"></div>\
			</td>';
};

ample.extend(cXULElement_treecol);


var cXULElement_treecols	= function() {
		this.items	= new ample.classes.NodeList;
};
cXULElement_treecols.prototype	= new cXULElement("treecols");

cXULElement_treecols.$isAccessible	= function() {
	return this.parentNode ? this.parentNode.$isAccessible() : true;
};

cXULElement_treecols.prototype._getPrimaryColIndex	= function() {
	for (var nIndex = 0; nIndex < this.items.length; nIndex++)
		if (this.items[nIndex].attributes["primary"] == "true")
			return nIndex;
	return -1;
};

cXULElement_treecols.prototype._onCommandClick	= function(oEvent) {
	if (this.parentNode.attributes["type"] == "checkbox") {
		if (this.$getContainer("command").checked)
			this.parentNode.selectAll();
		else
			this.parentNode.clearSelection();
	}
	else
	if (this.parentNode.attributes["type"] == "radio") {
		if (this.$getContainer("command").checked)
			this.parentNode.clearSelection();
	}
};

cXULElement_treecols.handlers	= {
	"click":	function(oEvent) {
		if (!this.$isAccessible() || !this.parentNode.$isAccessible() || !this.parentNode.parentNode.$isAccessible())
			return;

		if (oEvent.button == 2 || (oEvent.button == 0 && oEvent.target == this && oEvent.$pseudoTarget == this.$getContainer("settings"))) {
			var oPopup	= cXULSelectElement.getSettingsPopup(this);
			oPopup.showPopup(this, 0, 0, cXULPopupElement.POPUP_TYPE_POPUP);

			if (oEvent.button == 2) {
								var oPositionPopup	= oPopup.getBoundingClientRect();
								oPopup.moveTo(	oEvent.clientX - oPositionPopup.left,
								oEvent.clientY - oPositionPopup.top);

								oEvent.preventDefault();
			}
			else {
								var oPositionPopup	= oPopup.getBoundingClientRect(),
					oPositionSelf	= this.getBoundingClientRect();
								oPopup.moveTo(	oPositionSelf.right - oPositionPopup.right,
								oPositionSelf.bottom - oPositionPopup.top);
			}

			this.ownerDocument.popupNode	= oPopup;
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		var oTarget	= oEvent.target;
		if (oTarget.parentNode == this)
			if (oTarget instanceof cXULElement_treecol) {
				var oColNext	= oTarget.nextSibling;
				if (oColNext)
					this.items.$add(oTarget, this.items.$indexOf(oColNext));
				else
					this.items.$add(oTarget);
			}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treecol)
				this.items.$remove(oEvent.target);
	}
};

cXULElement_treecols.prototype.$getTagOpen	= function() {
	return '<tr' + (this.attributes["hidden"] == "true" ? ' style="display:none"' : '') + '>\
				<td class="xul-treecols--container">\
					<div class="xul-treecol' + (this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="float:right;width:16px"><div class="xul-treecols--settings"><br /></div></div>\
					<div class="xul-treecols--area" style="height:20px;overflow:hidden;position:relative;">\
						<table cellpadding="0" cellspacing="0" border="0" class="xul-treecols" style="position:absolute">\
							<tbody>\
								<tr class="xul-treecols--gateway" style="height:1em;vertical-align:top">' +
									(this.parentNode.attributes["type"] == "checkbox" || this.parentNode.attributes["type"] == "radio"
									? ('<td class="xul-treecol" style="width:20px;padding:0;">' +
											'<div>' +
												(this.parentNode.attributes["type"] == "checkbox"
												? '<input type="checkbox" name="' + this.parentNode.uniqueID + '_cmd" class="xul-treecol--command" onclick="return ample.$instance(this)._onCommandClick(event)" autocomplete="off" />'
												: (this.parentNode.attributes["type"] == "radio"
													? '<input type="radio" name="' + this.parentNode.uniqueID + '_cmd" class="xul-treecol--command" checked="true" onclick="return ample.$instance(this)._onCommandClick(event)"/>'
													: ' ')) +
											'</div>' +
											'<div style="height:1pt;font-size:1px;width:20px;"></div>'+
										'</td>')
									: '');
};

cXULElement_treecols.prototype.$getTagClose	= function() {
	return 						'</tr>\
							</tbody>\
						</table>\
					</div>\
				</td>\
			</tr>';
};

ample.extend(cXULElement_treecols);


var cXULElement_treeitem	= function(){};
cXULElement_treeitem.prototype	= new cXULElement("treeitem");

cXULElement_treeitem.prototype.row		= null; cXULElement_treeitem.prototype.children	= null; 
cXULElement_treeitem.attributes	= {};
cXULElement_treeitem.attributes.open	= "false";



cXULElement_treeitem.handlers	= {
	"mousedown":	function(oEvent) {
		var oView	= this.parentNode.tree;
		if (!oView.$isAccessible())
			return;
				if (oEvent.target.parentNode != this && oEvent.target.parentNode.parentNode != this)
			return;

				if (oEvent.button == 2 && oView.selectedItems.$indexOf(this) !=-1)
			return;

		if (oEvent.shiftKey) {
			if (oView.currentItem)
				oView.selectItemRange(this, oView.currentItem);
		}
		else {
			if (oEvent.ctrlKey)
				oView.toggleItemSelection(this);
			else
				oView.selectItem(this);
		}
	},
	"DOMAttrModified":	function(oEvent) {
		if (oEvent.target == this) {
			if (oEvent.attrName == "open") {
				if (this.children) {
										this.children.setAttribute("hidden", oEvent.newValue == "true" ? "false" : "true");
										var oEvent	= this.ownerDocument.createEvent("Event");
					oEvent.initEvent("OpenStateChange", true, false);
					this.dispatchEvent(oEvent);
				}
			}
		}
	},
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treerow)
				this.row		= oEvent.target;
			else
			if (oEvent.target instanceof cXULElement_treechildren) {
				this.children	= oEvent.target;
				oEvent.target.tree	= this.parentNode.tree;
			}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treerow)
				this.row		= null;
			else
			if (oEvent.target instanceof cXULElement_treechildren) {
				this.children	= null;
				oEvent.target.tree	= null;
			}
	}
};

cXULElement_treeitem.prototype.$mapAttribute	= function(sName, sValue) {
	var oParent	= this.parentNode;
	if (sName == "selected") {
		this.$setPseudoClass("selected", sValue == "true");
		if (oParent && oParent.tree)
			if (oParent.tree.attributes["type"] == "checkbox" || oParent.tree.attributes["type"] == "radio")
				this.$getContainer("command").checked	= sValue == "true";
	}
	else
	if (sName == "open") {
				if (oParent && oParent.tree && this.row && oParent.tree.head) {
			var nIndex	= oParent.tree.head._getPrimaryColIndex();
			if (nIndex !=-1 && this.row.cells[nIndex]) {
								this.row.cells[nIndex].$setPseudoClass("open", sValue == "true", "toc");
			}
		}
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_treeitem.prototype.$getContainer	= function(sName) {
	return sName == "gateway" ? this.parentNode.$getContainer("gateway") : this.row ? this.row.$getContainer(sName) : null;
};

ample.extend(cXULElement_treeitem);


var cXULElement_treerow	= function() {
		this.cells		= new ample.classes.NodeList;
};
cXULElement_treerow.prototype	= new cXULElement("treerow");
cXULElement_treerow.prototype.$hoverable	= true;

cXULElement_treerow.prototype.$isAccessible	= function() {
	return this.parentNode && this.parentNode.parentNode && this.parentNode.parentNode.tree ? this.parentNode.parentNode.tree.$isAccessible() : true;
};

cXULElement_treerow.prototype._onCommandClick	= function(oEvent) {
	var oTree	= this.parentNode.parentNode.tree;
	if (this.$getContainer("command").checked) {
		if (oTree.attributes["type"] == "radio")
			oTree.selectItem(this.parentNode);
		else
		if (oTree.attributes["type"] == "checkbox")
			oTree.addItemToSelection(this.parentNode);
	}
	else
		oTree.removeItemFromSelection(this.parentNode);
};

cXULElement_treerow.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		var oTarget	= oEvent.target;
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treecell) {
				var oCellNext	= oTarget.nextSibling;
				if (oCellNext)
					this.cells.$add(oTarget, this.cells.$indexOf(oCellNext));
				else
					this.cells.$add(oTarget);
			}
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_treecell)
				this.cells.$remove(oEvent.target);
	},
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				var oItem	= this.parentNode,
			aItems	= oItem.parentNode.tree.items;
		var nItemIndex	= aItems.$indexOf(oItem);
		if (aItems[nItemIndex - 1]) {
			var oItemPrevious	= aItems[nItemIndex - 1].$getContainer();
			if (oItemPrevious) {
				var oRowContainer	= this.$getContainer();
				if (oRowContainer != oItemPrevious.nextSibling)
					oRowContainer.parentNode.insertBefore(oRowContainer, oItemPrevious.nextSibling);
			}
		}
	}
};

cXULElement_treerow.prototype.$getTagOpen	= function() {
	var oTree	= this.parentNode.parentNode.tree;
	if (this.parentNode.parentNode.parentNode.attributes["open"] == "false")
		this.parentNode.parentNode.attributes["hidden"] = "true";

	return '<tr class="xul-treerow' + (this.attributes["class"] ? " " + this.attributes["class"] : '') + '" style="height:1.2em;vertical-align:top;' + (this.parentNode.parentNode.parentNode.attributes["open"] == "false" ? 'display:none' : '')+ '">' +
			(this.parentNode.attributes["label"] || (oTree && (oTree.attributes["type"] == "checkbox" || oTree.attributes["type"] == "radio"))
			? ('<td style="padding:0" onmousedown="event.cancelBubble=true" class="xul-treecell">' +
				(this.parentNode.attributes["label"]
				? '<div class="xul-treecell--gateway">' + this.parentNode.attributes["label"] + '</div>'
				: (oTree.attributes["type"] == "checkbox"
					? '<input type="checkbox" name="' + oTree.uniqueID + '_cmd" class="xul-treeitem--command" onclick="ample.$instance(this)._onCommandClick(event);" autocomplete="off"/>'
						: (oTree.attributes["type"] == "radio"
						? '<input type="radio" name="' + oTree.uniqueID + '_cmd" class="xul-treeitem--command" onclick="ample.$instance(this)._onCommandClick(event);"/>'
					: ' ')))+
			'</td>')
			: '');
};

cXULElement_treerow.prototype.$getTagClose	= function() {
	return '</tr>';
};

ample.extend(cXULElement_treerow);


var cXULElement_vbox	= function(){};
cXULElement_vbox.prototype	= new cXULElement_box;
cXULElement_vbox.prototype.localName	= "vbox";

cXULElement_vbox.attributes	= {};
cXULElement_vbox.attributes.orient	= "vertical";

ample.extend(cXULElement_vbox);


var cXULElement_window	= function(){};
cXULElement_window.prototype	= new cXULWindowElement("window");
cXULElement_window.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_window.attributes	= {};
cXULElement_window.attributes.orient	= "vertical";
cXULElement_window.attributes.flex		= "1";
cXULElement_window.attributes.width		= "400";
cXULElement_window.attributes.height	= "300";

cXULElement_window.handlers	= {
	"dragstart":	function(oEvent) {
		if (oEvent.target == this && oEvent.$pseudoTarget != this.$getContainer("title"))
			oEvent.preventDefault();
	}
};

cXULElement_window.prototype.$getTagOpen	= function() {
	return '<div class="xul-window'+(this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
				(this.attributes["width"] ? 'width:' + this.attributes["width"] + 'px;' : '') +
				(this.attributes["height"] ? 'height:' + this.attributes["height"] + 'px;' : '') +
				(this.attributes["hidden"] == "true" ? 'display:none;' : '') +
				(this.attributes["style"] ? this.attributes["style"] : '') + '">\
				<div class="xul-window--head" ' +(this.attributes["hidechrome"] == "true" ? ' style="display:none"': '')+ '>\
					<table cellpadding="0" cellspacing="0" border="0" width="100%" height="20">\
						<tbody>\
							<tr>\
								<td class="xul-window--title">' +(this.attributes["title"] ? ample.$encodeXMLCharacters(this.attributes["title"]) : " ")+ '</td>\
								<td width="1"><div class="xul-window--button-close xul-window--button-close_normal" onclick="ample.$instance(this).hide()" onmouseover="this.className=this.className.replace(\'normal\', \'hover\')" onmouseout="this.className=this.className.replace(/hover|active/, \'normal\')" onmousedown="this.className=this.className.replace(\'hover\', \'active\')" onmouseup="this.className=this.className.replace(\'active\', \'normal\')"><br /></div></td>\
							</tr>\
						</tbody>\
					</table>\
				</div>\
				<div class="xul-window--body" style="height:100%">';
};

cXULElement_window.prototype.$getTagClose	= function() {
	return '	</div>\
			</div>';
};

ample.extend(cXULElement_window);


var cXULElement_wizard	= function() {
		this.buttons	= {};
	this.wizardPages= new ample.classes.NodeList;
		var that	= this;
	this.contentFragment	= ample.createDocumentFragment();
		this.buttons.back	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.back.addEventListener("DOMActivate", function(oEvent) {
		that.rewind();
	}, false);
	this.buttons.back.setAttribute("label", ample.locale.localize("xul.dialog.button.previous"));
	this.buttons.back.setAttribute("class", "back");
		this.buttons.next	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.next.addEventListener("DOMActivate", function(oEvent) {
		that.advance();
	}, false);
	this.buttons.next.setAttribute("label", ample.locale.localize("xul.dialog.button.next"));
	this.buttons.next.setAttribute("class", "next");
		this.buttons.finish	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.finish.addEventListener("DOMActivate", function(oEvent) {
		that.finish();
	}, false);
	this.buttons.finish.setAttribute("label", ample.locale.localize("xul.dialog.button.finish"));
	this.buttons.finish.setAttribute("class", "finish");
		this.buttons.cancel	= this.contentFragment.appendChild(ample.createElementNS(this.namespaceURI, "xul:button"));
	this.buttons.cancel.addEventListener("DOMActivate", function(oEvent) {
		that.cancel();
	}, false);
	this.buttons.cancel.setAttribute("label", ample.locale.localize("xul.dialog.button.cancel"));
	this.buttons.cancel.setAttribute("class", "cancel");
};
cXULElement_wizard.prototype	= new cXULWindowElement("wizard");

cXULElement_wizard.prototype.currentPage	= null;
cXULElement_wizard.prototype.wizardPages	= null;
cXULElement_wizard.prototype.buttons		= null;

cXULElement_wizard.attributes	= {};
cXULElement_wizard.attributes.width		= "400";
cXULElement_wizard.attributes.height	= "300";

cXULElement_wizard.prototype.advance	= function(sId) {
	if (this.currentPage) {
		if (!cXULElement_wizardpage.dispatchEvent_onPage(this.currentPage, "hide"))
			return;

		if (!cXULElement_wizardpage.dispatchEvent_onPage(this.currentPage, "advanced"))
			return;
	}

	if (!cXULElement_wizard.dispatchEvent_onWizard(this, "next"))
		return;

	if (this.currentPage) {
		var oPage	= sId ? this.getPage(sId) : cXULElement_wizard.getNextPage(this, this.currentPage);
		if (oPage) {
			cXULElement_wizard.goTo(this, oPage);
						cXULElement_wizardpage.dispatchEvent_onPage(oPage, "show");
		}
	}
};

cXULElement_wizard.prototype.rewind	= function() {
	if (this.currentPage) {
		if (!cXULElement_wizardpage.dispatchEvent_onPage(this.currentPage, "hide"))
			return;

		if (!cXULElement_wizardpage.dispatchEvent_onPage(this.currentPage, "rewound"))
			return;
	}

	if (!cXULElement_wizard.dispatchEvent_onWizard(this, "back"))
		return;

	if (this.currentPage) {
		var oPage	= cXULElement_wizard.getPrevPage(this, this.currentPage);
		if (oPage) {
			cXULElement_wizard.goTo(this, oPage);
						cXULElement_wizardpage.dispatchEvent_onPage(oPage, "show");
		}
	}
};

cXULElement_wizard.prototype.cancel	= function() {
	if (cXULElement_wizard.dispatchEvent_onWizard(this, "cancel"))
		this.hide();
};

cXULElement_wizard.prototype.finish	= function() {
	if (cXULElement_wizard.dispatchEvent_onWizard(this, "finish"))
		this.hide();
};

cXULElement_wizard.prototype.goTo	= function(sId) {
	var oPage	= this.getPageById(sId);
	if (oPage)
		cXULElement_wizard.goTo(this, oPage);
};

cXULElement_wizard.prototype.getPageById	= function(sId) {
	for (var nIndex = 0; nIndex < this.wizardPages.length; nIndex++)
		if (this.wizardPages[nIndex].attributes["pageid"] == sId)
			return this.wizardPages[nIndex];

	return null;
};

cXULElement_wizard.prototype.getButton	= function(sName) {
	return this.buttons[sName];
};

cXULElement_wizard.prototype.reflow	= function() {
	if (this.currentPage)
		this.currentPage.reflow();
};

cXULElement_wizard.dispatchEvent_onWizard	= function(oElement, sName) {
	var oEvent	= oElement.ownerDocument.createEvent("Event");
	oEvent.initEvent("wizard" + sName, true, true);

	return oElement.dispatchEvent(oEvent);
};

cXULElement_wizard.handlers	= {
	"DOMNodeInserted":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_wizardpage)
				this.wizardPages.$add(oEvent.target);
	},
	"DOMNodeRemoved":	function(oEvent) {
		if (oEvent.target.parentNode == this)
			if (oEvent.target instanceof cXULElement_wizardpage)
				this.wizardPages.$remove(oEvent.target);
	},
	"dragstart":	function(oEvent) {
		if (oEvent.target == this && oEvent.$pseudoTarget != this.$getContainer("title"))
			oEvent.preventDefault();
	}
};

cXULElement_wizard.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "pagestep") {
		if (this.wizardPages[sValue])
			cXULElement_wizard.goTo(this, this.wizardPages[sValue]);
	}
	else
	if (sName == "canAdvance" || sName == "canRewind") {
		if (this.currentPage)
			cXULElement_wizard.goTo(this, this.currentPage);
	}
	else
		cXULWindowElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_wizard.goTo	= function(oElement, oPage) {
		if (oElement.currentPage)
		oElement.currentPage.$getContainer().style.display	= "none";

		oPage.$getContainer().style.display	= "";

		oElement.$getContainer("label").innerHTML	= oPage.attributes["label"] || " ";
	oElement.$getContainer("description").innerHTML	= oPage.attributes["description"] || " ";
	oElement.$getContainer("header").className	= "xul-wizardheader xul-wizard--header " + (oPage.attributes["class"] || "");

		var bNext	= cXULElement_wizard.getNextPage(oElement, oPage) != null,			bPrev	= cXULElement_wizard.getPrevPage(oElement, oPage) != null;		oElement.buttons["back"].setAttribute("disabled", String(!bPrev || oElement.getAttribute("canRewind") == "false"));
	oElement.buttons["next"].setAttribute("disabled", String(oElement.getAttribute("canAdvance") == "false"));
	oElement.buttons["next"].setAttribute("hidden", bNext ? "false" : "true");
	oElement.buttons["finish"].setAttribute("hidden", bNext ? "true" : "false");

		oElement.currentPage	= oPage;
};

cXULElement_wizard.getPrevPage	= function(oElement, oPage) {
	var sId	= oPage.attributes["pageid"];
	if (sId)
		for (var oNode = oElement.lastChild; oNode; oNode = oNode.previousSibling)
			if (oNode instanceof cXULElement_wizardpage && oNode.attributes["next"] == sId)
				return oNode;
	while (oPage = oPage.previousSibling)
		if (oPage instanceof cXULElement_wizardpage)
			return oPage;
	return null;
};

cXULElement_wizard.getNextPage	= function(oElement, oPage) {
	var sId	= oPage.attributes["next"];
	if (sId)
		for (var oNode = oElement.firstChild; oNode; oNode = oNode.nextSibling)
			if (oNode instanceof cXULElement_wizardpage && oNode.attributes["pageid"] == sId)
				return oNode;
	while (oPage = oPage.nextSibling)
		if (oPage instanceof cXULElement_wizardpage)
			return oPage;
	return null;
};

cXULElement_wizard.prototype.$getTagOpen	= function() {
	return '<div class="xul-wizard'+(this.attributes["class"] ? " " + this.attributes["class"] : "") + '" style="' +
				(this.attributes["width"] ? 'width:' + this.attributes["width"] + 'px;' : '') +
				(this.attributes["height"] ? 'height:' + (this.attributes["height"] - 100) + 'px;' : '') +
				(this.attributes["hidden"] == "true" ? 'display:none;' : '') +
				(this.attributes["style"] ? this.attributes["style"] : '') + '">\
				<div class="xul-wizard--head" ' +(this.attributes["hidechrome"] == "true" ? ' style="display:none"': '')+ '>\
					<table cellpadding="0" cellspacing="0" border="0" width="100%">\
						<tbody>\
							<tr><td class="xul-wizard--title">' +(this.attributes["title"] ? ample.$encodeXMLCharacters(this.attributes["title"]) : " ")+ '</td></tr>\
						</tbody>\
					</table>\
				</div>\
				<div class="xul-wizardheader xul-wizard--header"><div class="xul-wizardheader--title xul-wizard--label"></div><div class="xul-wizardheader--description xul-wizard--description"></div></div>\
				<div class="xul-wizard--body" style="height:100%">\
					<div class="xul-wizard--gateway" style="height:100%">';
};

cXULElement_wizard.prototype.$getTagClose	= function() {
	return '		</div>\
					<div class="xul-wizard--footer">\
						<table cellpadding="0" cellspacing="0" border="0" height="100%" align="' +(this.attributes["buttonalign"] == "start" ? "left" : this.attributes["buttonalign"] == "center" ? "center" : "right")+ '">\
							<tbody>\
								<tr>\
									<td>' + this.buttons['back'].$getTag() + '</td>\
									<td>' + this.buttons['next'].$getTag() + '</td>\
									<td>' + this.buttons['finish'].$getTag() + '</td>\
									<td width="8"><br /></td>\
									<td>' + this.buttons['cancel'].$getTag() + '</td>\
								</tr>\
							</tbody>\
						</table>\
					</div>\
				</div>\
			</div>';
};

ample.extend(cXULElement_wizard);


var cXULElement_wizardpage	= function(){};
cXULElement_wizardpage.prototype	= new cXULElement("wizardpage");
cXULElement_wizardpage.prototype.viewType	= cXULElement.VIEW_TYPE_BOXED;

cXULElement_wizardpage.attributes	= {};
cXULElement_wizardpage.attributes.orient	= "vertical";
cXULElement_wizardpage.attributes.flex		= "1";
cXULElement_wizardpage.attributes.width		= "100%";
cXULElement_wizardpage.attributes.height	= "100%";

cXULElement_wizardpage.dispatchEvent_onPage	= function(oElement, sName) {
	var oEvent	= oElement.ownerDocument.createEvent("Event");
	oEvent.initEvent("page" + sName, true, true);
	return oElement.dispatchEvent(oEvent);
};

cXULElement_wizardpage.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
				if (!this.parentNode.currentPage)
			cXULElement_wizard.goTo(this.parentNode, this);
	}
};

cXULElement_wizardpage.prototype.$mapAttribute	= function(sName, sValue) {
	if (sName == "label") {
		if (this.parentNode.currentPage == this)
			this.parentNode.$getContainer("label").innerHTML	= sValue || '';
	}
	else
	if (sName == "description") {
		if (this.parentNode.currentPage == this)
			this.parentNode.$getContainer("description").innerHTML	= sValue || '';
	}
	else
	if (sName == "class") {
		if (this.parentNode.currentPage == this)
			this.parentNode.$getContainer("header").className	= "xul-wizardheader xul-wizard--header " +(sValue || '');
	}
	else
		cXULElement.prototype.$mapAttribute.call(this, sName, sValue);
};

cXULElement_wizardpage.prototype.$getTagOpen	= function() {
	return '<div class="xul-wizardpage" style="display:none;height:100%">';
};

cXULElement_wizardpage.prototype.$getTagClose	= function() {
	return '</div>';
};

ample.extend(cXULElement_wizardpage);

})()
