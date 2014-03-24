/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


var cSVGElement	= function(sLocalName) {
	this.localName	= sLocalName;
};
cSVGElement.prototype	= new ample.classes.Element;
cSVGElement.prototype.namespaceURI	= "http://www.w3.org/2000/svg";
cSVGElement.prototype.localName		= "-element";

cSVGElement.useVML	= navigator.userAgent.match(/MSIE ([\d.]+)/) && RegExp.$1 < 9;

if (cSVGElement.useVML) {
		document.namespaces.add("svg2vml", "urn:schemas-microsoft-com:vml", "#default#VML");

	cSVGElement.prototype.getBBox	= function() {
		var oBCRectRoot	= cSVGElement.getViewportElement(this).$getContainer().getBoundingClientRect(),
			oBCRectThis	= this.$getContainer().getBoundingClientRect(),
			oSVGRect	= new cSVGRect(
								oBCRectThis.left - oBCRectRoot.left + 1,									oBCRectThis.top - oBCRectRoot.top + 1,									oBCRectThis.right - oBCRectThis.left,
								oBCRectThis.bottom - oBCRectThis.top
			);

		return oSVGRect;
	};

	cSVGElement.getMatrix	= function(oElement) {
		var aMatrix		= cSVGElement.matrixCreate();
		for (var oParent = oElement; !(oParent instanceof cSVGElement_svg); oParent = oParent.parentNode)
			aMatrix	= cSVGElement.matrixMultiply(cSVGElement.getMatrixOwn(oParent), aMatrix);
		return aMatrix;
	};

	cSVGElement.getMatrixOwn	= function(oElement) {
		var sValue		= oElement.attributes["transform"] || '',
			aCommands	= sValue.match(/\w+\([^\)]+\s*,?\)/g),
			aMatrix		= cSVGElement.matrixCreate();

		if (aCommands) {
						for (var i = 0; i < aCommands.length; i++) {
				var aCommand	= aCommands[i].match(/(\w+)\(([^\)]+)\)/),
					sCommand	= aCommand[1],
					aParameters	= aCommand[2].split(/[\s,]+/).map(function(nValue) {
						return nValue * 1.0;
					});

				switch (sCommand) {
					case "translate":							aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [1,	0,	aParameters[0]],
																		[0, 1,	aParameters.length > 1 ? aParameters[1] : 0],
																		[0, 0,	1]]);
						break;

					case "matrix":								aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [aParameters[0],	aParameters[2],	aParameters[4]],
																		[aParameters[1],	aParameters[3],	aParameters[5]],
																		[0,	0, 1]]);
						break;

					case "scale":								var iScaleX	= aParameters[0],
							iScaleY	= aParameters.length > 1 ? aParameters[1] : iScaleX;

						aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [iScaleX,	0,		0],
																		[0,		iScaleY,	0],
																		[0,		0,			1]]);
						break;

					case "rotate":								var iAngle	= aParameters[0] * Math.PI / 180,
							iCos	= Math.cos(iAngle),
							iSin	= Math.sin(iAngle);

												if (aParameters.length == 3)
							aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [1,	0,	aParameters[1]],
																			[0,	1,	aParameters[2]],
																			[0,	0, 1]]);
												aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [iCos,	-iSin,	0],
																		[iSin,	iCos,	0],
																		[0,		0,		1]]);
												if (aParameters.length == 3)
							aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [1,	0,	-aParameters[1]],
																			[0,	1,	-aParameters[2]],
																			[0,	0, 1]]);
						break;

					case "skewX":								var iAngle	= aParameters[0] * Math.PI / 180,
							iTan	= Math.tan(iAngle);

						aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [1,		iTan,	0],
																		[0,		1,		0],
																		[0,		0,		1]]);
						break;

					case "skewY":								var iAngle	= aParameters[0] * Math.PI / 180,
							iTan	= Math.tan(iAngle);

						aMatrix	= cSVGElement.matrixMultiply(aMatrix, [ [1,		0,		0],
																		[iTan,	1,		0],
																		[0,		0,		1]]);
						break;
				}
			}
		}

		return aMatrix;
	};

	cSVGElement.setMatrixOwn	= function(oElement, aMatrix) {
		var oElementDOM	= oElement.$getContainer(),
			aAspect	= cSVGElement.getAspectRatio(oElement);

		if (oElement instanceof cSVGElement_image || oElement instanceof cSVGElement_foreignObject) {
						var oMatrix	= oElementDOM.filters.item('DXImageTransform.Microsoft.Matrix');
			if (aMatrix[0][0] != 1 || aMatrix[1][1] != 1 || aMatrix[0][1] != 0 || aMatrix[1][0] != 0) {
				oMatrix.M11	= aMatrix[0][0];
				oMatrix.M12	= aMatrix[0][1];
				oMatrix.M21	= aMatrix[1][0];
				oMatrix.M22	= aMatrix[1][1];
				oMatrix.enabled	= true;
			}
			else
				oMatrix.enabled	= false;
						aMatrix	= cSVGElement.matrixMultiply(aMatrix, [[1, 0, oElement.getAttribute("x") || 0], [0, 1, oElement.getAttribute("y") || 0], [0, 0, 1]]);
						oElementDOM.style.left	= Math.round(aMatrix[0][2]) + "px";
			oElementDOM.style.top	= Math.round(aMatrix[1][2]) + "px";
		}
		else {
			if (oElementDOM.tagName == "group")
				oElementDOM	= oElementDOM.getElementsByTagName("shape")[0];
			if (!oElementDOM)
				return;

						if (!oElementDOM.skew.on)
				oElementDOM.skew.on	= true;
			oElementDOM.skew.matrix	= [aMatrix[0][0], aMatrix[0][1], aMatrix[1][0], aMatrix[1][1], 0, 0].map(function(nValue) {
				return nValue.toFixed(8);
			});

			oElementDOM.skew.offset	= Math.floor(aMatrix[0][2] * aAspect[0]) + "px" + " " + Math.floor(aMatrix[1][2] * aAspect[1]) + "px";
		}
	};

	cSVGElement.applyTransform	= function(oElement) {
		if (!(oElement instanceof cSVGElement_g))
			cSVGElement.setMatrixOwn(oElement, cSVGElement.getMatrix(oElement));
		else
			for (var nIndex = 0; nIndex < oElement.childNodes.length; nIndex++)
				if (oElement.childNodes[nIndex].nodeType == 1)
					cSVGElement.applyTransform(oElement.childNodes[nIndex]);
	};

		cSVGElement.prototype.$getStyle	= function(sName) {
		var sValue;

				if (sValue = this.attributes["style"])
			if (sValue.match(new RegExp(sName + "\\s*:\\s*[\'\"]?\\s*([^;\'\"]+)\\s*[\'\"]?")))
				return RegExp.$1;

				if (sValue = this.attributes[sName])
			return sValue;

		return '';
	};

	cSVGElement.prototype.$setStyle	= function(sName, sValue) {
		var oElementDOM	= this.$getContainer();
		if (this instanceof cSVGElement_text)
			oElementDOM	= oElementDOM.getElementsByTagName("shape")[0];

				if (!oElementDOM)
			return;

		switch (sName) {
						case "opacity":
				if (this instanceof cSVGElement_image) {
					var oAlpha	= oElementDOM.filters.item('DXImageTransform.Microsoft.Alpha');
					oAlpha.enabled	= sValue != 1;
					oAlpha.opacity	= sValue * 100;
				}
				else {
					this.$setStyle("fill-opacity", this.$getStyleComputed("fill-opacity"));
					this.$setStyle("stroke-opacity", this.$getStyleComputed("stroke-opacity"));
				}
				break;
						case "fill":
				oElementDOM.fill.on	= sValue != "none";
				var aValue, oGradient;
				if (aValue = sValue.match(/url\(['"]?#([^'")]+)['"]?\)/)) {
					if (oGradient = this.ownerDocument.getElementById(aValue[1])) {
						if (oGradient instanceof cSVGElement_linearGradient || oGradient instanceof cSVGElement_radialGradient) {
							if (oGradient instanceof cSVGElement_linearGradient) {
								var x1	= parseFloat(oGradient.getAttribute("x1") || "0") / (oGradient.getAttribute("x1").indexOf("%") ==-1 ? 1 : 100),
									x2	= parseFloat(oGradient.getAttribute("x2") || "1") / (oGradient.getAttribute("x2").indexOf("%") ==-1 ? 1 : 100),
									y1	= parseFloat(oGradient.getAttribute("y1") || "0") / (oGradient.getAttribute("y1").indexOf("%") ==-1 ? 1 : 100),
									y2	= parseFloat(oGradient.getAttribute("y2") || "0") / (oGradient.getAttribute("y2").indexOf("%") ==-1 ? 1 : 100);

								if (x1 == x2 && y1 == y2) {
									oElementDOM.fill.type		= "solid";
								}
								else {
									oElementDOM.fill.type		= "gradient";
									oElementDOM.fill.focus		= y2 > y1 ? "0%" : "100%";
									oElementDOM.fill.angle		= 180 + Math.round(Math.atan((x1 - x2) / (y1 - y2)) * 180 / Math.PI);
								}
							}
							else {
								var cx	= parseFloat(oGradient.getAttribute("cx") || "0.5") / (oGradient.getAttribute("cx").indexOf("%") ==-1 ? 1 : 100),
									cy	= parseFloat(oGradient.getAttribute("cy") || "0.5") / (oGradient.getAttribute("cy").indexOf("%") ==-1 ? 1 : 100);
								oElementDOM.fill.type		= "gradientTitle";
								oElementDOM.fill.focus		= "100%";																	oElementDOM.fill.focusposition	= "0.5 0.5";									oElementDOM.fill.focussize		= "0 0";							}
														oElementDOM.fill.method		= "sigma";

														for (var oGradientStop = oGradient; oGradientStop && oGradientStop.hasAttribute("xlink:href"); oGradientStop = this.ownerDocument.getElementById(oGradientStop.getAttribute("xlink:href").substr(1)))
								if (oGradientStop.hasChildNodes())
									break;

							if (oGradientStop) {
																var aColors	= [],
									nOpacity	=(this.$getStyleComputed("opacity") || 1) * (this.$getStyleComputed("fill-opacity") || 1);
								for (var i = 0, oStop, sColor; oStop = oGradientStop.childNodes[i]; i++)
									if (oGradientStop.childNodes[i] instanceof cSVGElement_stop)
										aColors.push([parseFloat(oStop.getAttribute("offset") || "1") / (oStop.getAttribute("offset").indexOf("%") ==-1 ? 1 : 100), ((sColor = oStop.$getStyle("stop-color")) in oSVGElement_colors ? 'rgb(' + oSVGElement_colors[sColor] + ')' : cSVGElement.correctColor(sColor)), nOpacity * parseFloat(oStop.$getStyle("stop-opacity") || "1")]);

								var nLength	= aColors.length;
								if (nLength) {
																		aColors	= aColors.sort(function(color1, color2) {
										return color1[0] > color2[0];
									});

																		if (aColors[0][0] != 0)
										oElementDOM.fill.color		= aColors[0][1];
																		if (aColors[nLength - 1][0] != 1)
										oElementDOM.fill.color2		= aColors[nLength - 1][1];

									var aColors2	= [];
									for (var i = 0; i < nLength; i++)
										aColors2.push(aColors[i][0].toFixed(3) + " " + aColors[i][1]);

									oElementDOM.fill.colors.value	= aColors2.join(", ");
									oElementDOM.fill.opacity	= aColors[nLength - 1][2];
								}
							}
						}
						else
						if (oGradient instanceof cSVGElement_pattern) {
													}
					}
				}
				else
					oElementDOM.fill.color	= sValue in oSVGElement_colors ? 'rgb(' + oSVGElement_colors[sValue] + ')' : cSVGElement.correctColor(sValue);
				break;
			case "fill-opacity":
				if (sValue == null || sValue == "")
					sValue	= 1;
				sValue	=(this.$getStyleComputed("opacity") || 1) * sValue;
				if (sValue > 1)
					sValue	= 1;
				if (oElementDOM.fill.opacity != sValue)
					oElementDOM.fill.opacity	= sValue;
				break;
						case "stroke":
				oElementDOM.stroke.on	= sValue != "none";
				oElementDOM.stroke.color	= sValue in oSVGElement_colors ? 'rgb(' + oSVGElement_colors[sValue] + ')' : cSVGElement.correctColor(sValue);
				break;
			case "stroke-width":
				var aStrokeWidth	= sValue.match(/([\d.]+)(.*)/),
					nStrokeWidth	= aStrokeWidth[1] * cSVGElement.getScaleFactor(this) * Math.sqrt(Math.abs(cSVGElement.matrixDeterminant(cSVGElement.getMatrix(this))));
				oElementDOM.stroke.weight	= nStrokeWidth + (aStrokeWidth[2] || 'px');
				if (nStrokeWidth < 1 && !(this instanceof cSVGElement_text || this instanceof cSVGElement_tspan || this instanceof cSVGElement_textPath))
					oElementDOM.stroke.opacity	= (this.attributes["stroke-opacity"] || 1) * nStrokeWidth;
				else
					oElementDOM.stroke.opacity	= 1;
				break;
			case "stroke-opacity":
				if (sValue == null || sValue == "")
					sValue	= 1;
				sValue	=(this.$getStyleComputed("opacity") || 1) * sValue;
				var aStrokeWidth,
					nStrokeWidth	= 1;
				if (aStrokeWidth =(this.$getStyleComputed("stroke-width") || "1").match(/([\d.]+)(.*)/)) {
					nStrokeWidth	= aStrokeWidth[1] * cSVGElement.getScaleFactor(this) * Math.sqrt(Math.abs(cSVGElement.matrixDeterminant(cSVGElement.getMatrix(this))));
					if (nStrokeWidth < 1 && !(this instanceof cSVGElement_text || this instanceof cSVGElement_tspan || this instanceof cSVGElement_textPath))
						sValue	= sValue * nStrokeWidth;
				}
				if (sValue > 1)
					sValue	= 1;
				if (oElementDOM.stroke.opacity != sValue)
					oElementDOM.stroke.opacity	= sValue;
				break;
			case "stroke-linejoin":
				oElementDOM.stroke.joinStyle	= sValue;
				break;
			case "stroke-miterlimit":
				oElementDOM.stroke.miterLimit	= sValue;
				break;
			case "stroke-linecap":
				oElementDOM.stroke.endCap		= cSVGElement.strokeLineCapToEndCap(sValue);
				break;
			case "stroke-dasharray":
				oElementDOM.stroke.dashStyle	= sValue;
				break;
						case "marker-start":
				oElementDOM.stroke.startarrow	= sValue == "none" ? "none" : "classic";
				break;
			case "marker-end":
				oElementDOM.stroke.endarrow	= sValue == "none" ? "none" : "classic";
				break;
						case "text-anchor":
				oElementDOM.getElementsByTagName("textpath")[0].style["v-text-align"]	= cSVGElement.textAnchorToVTextAlign(sValue);
				break;
			case "font-size":
				var aFontSize	= sValue.match(/(^[\d.]*)(.*)$/),
					sFontSizeUnit	= aFontSize[2] || "px",
					nFontSizeValue	= aFontSize[1],
					nFontSize	= Math.round(nFontSizeValue * cSVGElement.getScaleFactor(this)),
					nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

				oElementDOM.style.marginTop	=-(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35) + "px";
				oElementDOM.getElementsByTagName("textpath")[0].style.fontSize	= nFontSize + sFontSizeUnit;
				break;
			case "font-family":
				oElementDOM.getElementsByTagName("textpath")[0].style.fontFamily	= "'" + sValue + "'";
				break;
			case "font-weight":
				oElementDOM.getElementsByTagName("textpath")[0].style.fontWeight	= sValue;
				break;
			case "font-style":
				oElementDOM.getElementsByTagName("textpath")[0].style.fontStyle		= sValue;
				break;
			case "visibility":
				oElementDOM.style.visibility	= sValue;
				break;
		}
	};

	cSVGElement.prototype.$getStyleComputed	= function(sName) {
		var sValue	= this.$getStyle(sName);
		if (sValue == "currentColor")
			return oElement.$getStyleComputed("color");

		if (sValue && sValue != "inherit")
			return sValue;

				var oParent	= this.parentNode;
		if (oParent && (sValue == "inherit" || oParent instanceof cSVGElement_g || oParent instanceof cSVGElement_text || oParent instanceof cSVGElement_a))
			return this.parentNode.$getStyleComputed(sName);

		return '';
	};

		cSVGElement.applyCSS	= function(oElement) {
					var oElementDOM	= oElement.$getContainer();
			if (!oElementDOM)					return;
			var oStyle	= oElementDOM.currentStyle,
				sValue;
						if (sValue = oStyle["opacity"])
				oElement.$setStyle("opacity", sValue);
						if (sValue = oStyle["fill"])
				oElement.$setStyle("fill", sValue);
			if (sValue = oStyle["fill-opacity"])
				oElement.$setStyle("fill-opacity", sValue);
						if (sValue = oStyle["stroke"])
				oElement.$setStyle("stroke", sValue);
			if (sValue = oStyle["stroke-width"])
				oElement.$setStyle("stroke-width", sValue);
			if (sValue = oStyle["stroke-opacity"])
				oElement.$setStyle("stroke-opacity", sValue);
			if (sValue = oStyle["stroke-linejoin"])
				oElement.$setStyle("stroke-linejoin", sValue);
			if (sValue = oStyle["stroke-miterlimit"])
				oElement.$setStyle("stroke-miterlimit", sValue);
			if (sValue = oStyle["stroke-linecap"])
				oElement.$setStyle("stroke-linecap", sValue);
			if (sValue = oStyle["stroke-dasharray"])
				oElement.$setStyle("stroke-dasharray", sValue);
						if (sValue = oStyle["marker-start"])
				oElement.$setStyle("marker-start", sValue);
			if (sValue = oStyle["marker-end"])
				oElement.$setStyle("marker-end", sValue);
						if (oElement instanceof cSVGElement_text || oElement instanceof cSVGElement_tspan || oElement instanceof cSVGElement_textPath) {
				if (!oElement.$getStyleComputed("text-anchor") && (sValue = oStyle["text-anchor"]))
					oElement.$setStyle("text-anchor", sValue);
				if (!oElement.$getStyleComputed("font-weight") && (sValue = oStyle["fontWeight"]))
					oElement.$setStyle("font-weight", sValue);
				if (!oElement.$getStyleComputed("font-family") && (sValue = oStyle["fontFamily"]))
					oElement.$setStyle("font-family", sValue);
				if (!oElement.$getStyleComputed("font-size") && (sValue = oStyle["fontSize"]))
					oElement.$setStyle("font-size", sValue);
				if (!oElement.$getStyleComputed("font-style") && (sValue = oStyle["fontStyle"]))
					oElement.$setStyle("font-style", sValue);
			}
	};

	cSVGElement.applyCSSSizes	= function(oElement) {
		var oElementDOM	= oElement.$getContainer();
		if (!oElementDOM)				return;
		var oStyle	= oElementDOM.currentStyle,
			sValue;
		if (sValue = (oStyle["stroke-width"] || oElement.$getStyleComputed("stroke-width")))
			oElement.$setStyle("stroke-width", sValue);
		if (sValue = (oStyle["stroke-opacity"] || oElement.$getStyleComputed("stroke-opacity")))
			oElement.$setStyle("stroke-opacity", sValue);
				if (oElement instanceof cSVGElement_text || oElement instanceof cSVGElement_tspan || oElement instanceof cSVGElement_textPath) {
			if (sValue = oElement.$getStyleComputed("font-size"))
				oElement.$setStyle("font-size", sValue);
		}
		for (var oChild = oElement.firstChild; oChild; oChild = oChild.nextSibling)
			if (!(oChild instanceof cSVGElement_g))
				cSVGElement.applyCSSSizes(oChild);
	};

		cSVGElement.matrixCreate	= function() {
		return [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
	};

	cSVGElement.matrixMultiply	= function(aMatrix1, aMatrix2) {
		var aResult	= cSVGElement.matrixCreate();

		for (var x = 0; x < 3; x++) {
			for (var y = 0; y < 3; y++) {
				for (var z = 0, nResult = 0; z < 3; z++)
					nResult	+= aMatrix1[x][z] * aMatrix2[z][y];
				aResult[x][y]	= nResult;
			}
		}
		return aResult;
	};

	cSVGElement.matrixDeterminant	= function(aMatrix) {
		return aMatrix[0][0] * aMatrix[1][1] - aMatrix[0][1] * aMatrix[1][0];
	};

		cSVGElement.getViewportElement	= function(oElement) {
		for (var oNode = oElement; oNode; oNode = oNode.parentNode)
			if (oNode instanceof cSVGElement_svg)
				return oNode;
		return null;
	};

	cSVGElement.getAspectRatio		= function(oElement) {
		var aAspect	= [1, 1],
			oNode	= cSVGElement.getViewportElement(oElement);
		if (oNode) {
			var aViewBox= (oNode.attributes["viewBox"] || "").split(/[\s,]/),
				aWidth	= (oNode.attributes["width"] || "").match(/([\d.]+)([%\w]*)/),
				aHeight	= (oNode.attributes["height"] || "").match(/([\d.]+)([%\w]*)/);
						if (aViewBox.length < 4) {
				if (!aWidth)
					aWidth	= [null, 600, "px"];
				if (!aHeight)
					aHeight	= [null, 600, "px"];
				aViewBox	= [0, 0, aWidth[1], aHeight[1]];
			}
			else {
				if (!aWidth)
					aWidth	= [null, aViewBox[2], "px"];
				if (!aHeight)
					aHeight	= [null, aViewBox[3], "px"];
			}

			if (aWidth[2] == "%" || aHeight[2] == "%") {
				var oBCRect		= oNode.getBoundingClientRect();
				if (aWidth[2] == "%") {
					if (oBCRect.right - oBCRect.left) {
						aWidth		= [null, oBCRect.right - oBCRect.left, "px"];
						aHeight		= [null,(oBCRect.right - oBCRect.left)/(aViewBox[2] / aViewBox[3]), "px"];
					}
				}
				else
				if (aHeight[2] == "%") {
					if (oBCRect.bottom - oBCRect.top) {
						aHeight	= [null,(oBCRect.bottom - oBCRect.top)*(aViewBox[2] / aViewBox[3]), "px"];
						aWidth	= [null, oBCRect.bottom - oBCRect.top, "px"];
					}
				}
			}

						var nRatio	= (aViewBox[2] / aViewBox[3]) / (aWidth[1] / aHeight[1]);
			if (nRatio > 1)
				aHeight[1]	/= nRatio;
			else
				aWidth[1]	*= nRatio;
						aAspect	= [cSVGElement.toPixels(aWidth[1] + aWidth[2]) / aViewBox[2], cSVGElement.toPixels(aHeight[1] + aHeight[2]) / aViewBox[3]];
		}
		return aAspect;
	};

	cSVGElement.getScaleFactor	= function(oElement) {
		var aAspect	= cSVGElement.getAspectRatio(oElement);
		return Math.sqrt(aAspect[0] * aAspect[1]);
	};

	cSVGElement.toPixels	= function(sValue) {
		var aValue	= sValue.match(/([\d.]+)([%\w]*)/),
			nValue	= aValue[1];
		switch (aValue[2]) {
			case "pc":					nValue	= nValue * 12;
			case "pt":					nValue	= nValue / 72;				case "in":					nValue	= nValue * 2.54;
			case "cm":
				nValue	= nValue * 10;
			case "mm":
				nValue	= nValue / 0.264;
				break;
			case "px":
			default:
				break;
		}
		return nValue;
	};

	cSVGElement.getTagStyle	= function(oElement) {
		var nOpacity		= oElement.$getStyleComputed("opacity") || 1,
			sFill			= oElement.$getStyleComputed("fill"),
			nFillOpacity	=(oElement.$getStyleComputed("fill-opacity") || 1) * nOpacity,
			sStroke			= oElement.$getStyleComputed("stroke"),
			nStrokeOpacity	=(oElement.$getStyleComputed("stroke-opacity") || 1) * nOpacity,
			sStrokeWidth	= oElement.$getStyleComputed("stroke-width") || "1",
			sStrokeLineJoin	= oElement.$getStyleComputed("stroke-linejoin") || 'miter',
			sStrokeMiterLimit	= oElement.$getStyleComputed("stroke-miterlimit") || '4',
			sStrokeLineCap	= oElement.$getStyleComputed("stroke-linecap") || 'square',
			sStrokeDashArray= oElement.$getStyleComputed("stroke-dasharray");

		var aColor;
				if (sFill && sFill.match(/rgba\(([^\)]+)\)/)) {
			aColor	= RegExp.$1.split(/\s?,\s?/);
			nFillOpacity	*= aColor.pop();
			sFill	= 'rgb(' + aColor.join(',') + ')';
		}
				if (sStroke && sStroke.match(/rgba\(([^\)]+)\)/)) {
			aColor	= RegExp.$1.split(/\s?,\s?/);
			nStrokeOpacity	*= aColor.pop();
			sStroke	= 'rgb(' + aColor.join(',') + ')';
		}

		if (sStrokeWidth) {
			var aStrokeWidth	= sStrokeWidth.match(/([\d.]+)(.*)/),
				nStrokeWidth	= aStrokeWidth[1] * cSVGElement.getScaleFactor(oElement) * Math.sqrt(Math.abs(cSVGElement.matrixDeterminant(cSVGElement.getMatrix(oElement))));
			if (nStrokeWidth < 1 && !(oElement instanceof cSVGElement_text || oElement instanceof cSVGElement_tspan || oElement instanceof cSVGElement_textPath))
				nStrokeOpacity	= nStrokeOpacity * nStrokeWidth;
			sStrokeWidth	= nStrokeWidth + (aStrokeWidth[2] || "px");
		}

		if (nFillOpacity > 1)
			nFillOpacity	= 1;
		if (nStrokeOpacity > 1)
			nStrokeOpacity	= 1;

		return '<svg2vml:fill on="' + (sFill == "none" ? "false" : "true") + '" color="' + (sFill in oSVGElement_colors ? 'rgb(' + oSVGElement_colors[sFill] + ')' : cSVGElement.correctColor(sFill) || 'black') + '"\
					' + (nFillOpacity != 1 ? ' opacity="' + nFillOpacity + '"' : '') + '\
				/><svg2vml:stroke on="' + (sStroke && sStroke != "none" ? "true" : "false") + '" color="' + (sStroke in oSVGElement_colors ? 'rgb(' + oSVGElement_colors[sStroke] + ')' : cSVGElement.correctColor(sStroke) || 'black') + '"\
					' + (nStrokeOpacity != 1 ? ' opacity="' + nStrokeOpacity + '"' : '') + '\
					' + (sStrokeWidth ? ' weight="' + sStrokeWidth + '"' : '') + '\
					' + (sStrokeLineCap ? ' endCap="' + cSVGElement.strokeLineCapToEndCap(sStrokeLineCap) + '"' : '') + '\
					' + (sStrokeDashArray ? ' dashStyle="' + sStrokeDashArray.replace(/,/g, ' ') + '"' : '') + '\
					' + (sStrokeLineJoin ? ' joinStyle="' + sStrokeLineJoin + '"' : '') + '\
					' + (sStrokeMiterLimit ? ' miterLimit="' + sStrokeMiterLimit + '"' : '') + '\
				/><svg2vml:skew on="true" origin="-0.5,-0.5" matrix="1,0,0,1"/>';
	};

	cSVGElement.strokeDashArrayToDashStyle	= function(sStrokeDashArray, nStrokeWidth) {
		return sStrokeDashArray.split(",").map(function(sValue) {
			return Math.ceil(sValue / nStrokeWidth);
		}).join(" ");
	};

	cSVGElement.strokeLineCapToEndCap	= function(sStrokeLineCap) {
		return {"butt": "flat", "round": "round"}[sStrokeLineCap] || "square";
	};

	cSVGElement.textAnchorToVTextAlign	= function(sTextAnchor) {
		return {"middle": "center", "end": "right"}[sTextAnchor] || "left";
	};

	cSVGElement.correctColor	= function(sColor) {
		var aColor;
		if (sColor && sColor.match(/rgb\(([^\)]+)\)/) && (aColor = RegExp.$1.split(/\s*%\s*,?\s*/)) && aColor.length == 3)
			sColor	= 'rgb(' + Math.round(2.55 * aColor[0]) + "," + Math.round(2.55 * aColor[1]) + "," + Math.round(2.55 * aColor[2]) + ")";
		return sColor;
	};

	var oSVGElement_colors	= {
		'aliceblue':	[240,248,255],
		'antiquewhite':	[250,235,215],
		'aqua':			[0,255,255],
		'aquamarine':	[127,255,212],
		'azure':		[240,255,255],
		'beige':		[245,245,220],
		'bisque':		[255,228,196],
		'black':		[0,0,0],
		'blanchedalmond':	[255,235,205],
		'blue':			[0,0,255],
		'blueviolet':	[138,43,226],
		'brown':		[165,42,42],
		'burlywood':	[222,184,135],
		'cadetblue':	[95,158,160],
		'chartreuse':	[127,255,0],
		'chocolate':	[210,105,30],
		'coral':		[255,127,80],
		'cornflowerblue':	[100,149,237],
		'cornsilk':		[255,248,220],
		'crimson':		[220,20,60],
		'cyan':			[0,255,255],
		'darkblue':		[0,0,139],
		'darkcyan':		[0,139,139],
		'darkgoldenrod':[184,134,11],
		'darkgray':		[169,169,169],
		'darkgreen':	[0,100,0],
		'darkkhaki':	[189,183,107],
		'darkmagenta':	[139,0,139],
		'darkolivegreen':	[85,107,47],
		'darkorange':	[255,140,0],
		'darkorchid':	[153,50,204],
		'darkred':		[139,0,0],
		'darksalmon':	[233,150,122],
		'darkseagreen':	[143,188,143],
		'darkslateblue':[72,61,139],
		'darkslategray':[47,79,79],
		'darkturquoise':[0,206,209],
		'darkviolet':	[148,0,211],
		'deeppink':		[255,20,147],
		'deepskyblue':	[0,191,255],
		'dimgray':		[105,105,105],
		'dodgerblue':	[30,144,255],
		'firebrick':	[178,34,34],
		'floralwhite':	[255,250,240],
		'forestgreen':	[34,139,34],
		'fuchsia':		[255,0,255],
		'gainsboro':	[220,220,220],
		'ghostwhite':	[248,248,255],
		'gold':			[255,215,0],
		'goldenrod':	[218,165,32],
		'gray':			[128,128,128],
		'green':		[0,128,0],
		'greenyellow':	[173,255,47],
		'honeydew':		[240,255,240],
		'hotpink':		[255,105,180],
		'indianred':	[205,92,92],
		'indigo':		[75,0,130],
		'ivory':		[255,255,240],
		'khaki':		[240,230,140],
		'lavender':		[230,230,250],
		'lavenderblush':[255,240,245],
		'lawngreen':	[124,252,0],
		'lemonchiffon':	[255,250,205],
		'lightblue':	[173,216,230],
		'lightcoral':	[240,128,128],
		'lightcyan':	[224,255,255],
		'lightgoldenrodyellow':	[250,250,210],
		'lightgreen':	[144,238,144],
		'lightgrey':	[211,211,211],
		'lightpink':	[255,182,193],
		'lightsalmon':	[255,160,122],
		'lightseagreen':[32,178,170],
		'lightskyblue':	[135,206,250],
		'lightslategray':	[119,136,153],
		'lightsteelblue':	[176,196,222],
		'lightyellow':	[255,255,224],
		'lime':			[0,255,0],
		'limegreen':	[50,205,50],
		'linen':		[250,240,230],
		'magenta':		[255,0,255],
		'maroon':		[128,0,0],
		'mediumaquamarine':	[102,205,170],
		'mediumblue':	[0,0,205],
		'mediumorchid':	[186,85,211],
		'mediumpurple':	[147,112,219],
		'mediumseagreen':	[60,179,113],
		'mediumslateblue':	[123,104,238],
		'mediumspringgreen':[0,250,154],
		'mediumturquoise':	[72,209,204],
		'mediumvioletred':	[199,21,133],
		'midnightblue':	[25,25,112],
		'mintcream':	[245,255,250],
		'mistyrose':	[255,228,225],
		'moccasin':		[255,228,181],
		'navajowhite':	[255,222,173],
		'navy':			[0,0,128],
		'oldlace':		[253,245,230],
		'olive':		[128,128,0],
		'olivedrab':	[107,142,35],
		'orange':		[255,165,0],
		'orangered':	[255,69,0],
		'orchid':		[218,112,214],
		'palegoldenrod':[238,232,170],
		'palegreen':	[152,251,152],
		'paleturquoise':[175,238,238],
		'palevioletred':[219,112,147],
		'papayawhip':	[255,239,213],
		'peachpuff':	[255,218,185],
		'peru':			[205,133,63],
		'pink':			[255,192,203],
		'plum':			[221,160,221],
		'powderblue':	[176,224,230],
		'purple':		[128,0,128],
		'red':			[255,0,0],
		'rosybrown':	[188,143,143],
		'royalblue':	[65,105,225],
		'saddlebrown':	[139,69,19],
		'salmon':		[250,128,114],
		'sandybrown':	[244,164,96],
		'seagreen':		[46,139,87],
		'seashell':		[255,245,238],
		'sienna':		[160,82,45],
		'silver':		[192,192,192],
		'skyblue':		[135,206,235],
		'slateblue':	[106,90,205],
		'slategray':	[112,128,144],
		'snow':			[255,250,250],
		'springgreen':	[0,255,127],
		'steelblue':	[70,130,180],
		'tan':			[210,180,140],
		'teal':			[0,128,128],
		'thistle':		[216,191,216],
		'tomato':		[255,99,71],
		'turquoise':	[64,224,208],
		'violet':		[238,130,238],
		'wheat':		[245,222,179],
		'white':		[255,255,255],
		'whitesmoke':	[245,245,245],
		'yellow':		[255,255,0],
		'yellowgreen':	[154,205,50]
	};

	cSVGElement.prototype.refresh	= function() {
		switch (this.localName) {
			case "text":
			case "textPath":
			case "tspan":
				this.$setStyle("font-size", this.$getStyleComputed("font-size") || "16px");
							case "circle":
			case "ellipse":
			case "line":
			case "path":
			case "polygon":
			case "polyline":
			case "rect":
								cSVGElement.setMatrixOwn(this, cSVGElement.getMatrix(this));
								this.$setStyle("stroke-width", this.$getStyleComputed("stroke-width") || "1");
				break;
			case "svg":
				cSVGElement_svg.resize(this);
				break;
		}
				for (var oNode = this.firstChild; oNode; oNode = oNode.nextSibling)
			if (oNode instanceof cSVGElement)
				oNode.refresh();
	};

	cSVGElement.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "transform") {
			cSVGElement.applyTransform(this);
		}
		else
			this.$setStyle(sName, sValue);
	};
}
else {
	cSVGElement.prototype.$mapAttribute	= function(sName, sValue) {
		var oElementDOM	= this.$getContainer();
		if (oElementDOM) {
			if (sValue === null)
				oElementDOM.removeAttribute(sName);
			else
				oElementDOM.setAttribute(sName, sValue);
		}
	};

	cSVGElement.prototype.getBBox	= function() {
		return this.$getContainer().getBBox();
	};

		cSVGElement.prototype.$getTagOpen	= function() {
		var sHtml	= '<' + this.tagName;
		for (var sName in this.attributes)
			if (this.attributes.hasOwnProperty(sName) && sName != "id" && sName != "class")				sHtml	+= ' ' + sName + '="' + ample.$encodeXMLCharacters(this.attributes[sName]) + '"';
		sHtml	+= ' class="' + ('svg-' + this.localName + ' ') + (this.prefix ? this.prefix + '-' : '') + this.localName + ("class" in this.attributes ? ' ' + this.attributes["class"] : '') + '"';
		return sHtml + '>';
	};

		cSVGElement.prototype.$getTagClose	= function() {
		return '</' + this.tagName + '>';
	};
};

ample.extend(cSVGElement);


function cSVGPathSeg() {

};

cSVGPathSeg.PATHSEG_UNKNOWN		= 0;
cSVGPathSeg.PATHSEG_CLOSEPATH	= 1;
cSVGPathSeg.PATHSEG_MOVETO_ABS	= 2;
cSVGPathSeg.PATHSEG_MOVETO_REL	= 3;
cSVGPathSeg.PATHSEG_LINETO_ABS			= 4;
cSVGPathSeg.PATHSEG_LINETO_REL			= 5;
cSVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS	= 6;
cSVGPathSeg.PATHSEG_CURVETO_CUBIC_REL	= 7;
cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS	= 8;
cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL	= 9;
cSVGPathSeg.PATHSEG_ARC_ABS					= 10;
cSVGPathSeg.PATHSEG_ARC_REL					= 11;
cSVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS	= 12;
cSVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL	= 13;
cSVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS		= 14;
cSVGPathSeg.PATHSEG_LINETO_VERTICAL_REL		= 15;
cSVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS		= 16;
cSVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL		= 17;
cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS	= 18;
cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL	= 19;

cSVGPathSeg.prototype.pathSegType	= cSVGPathSeg.PATHSEG_UNKNOWN;
cSVGPathSeg.prototype.pathSegTypeAsLetter	= "";




function cSVGPathSegList() {
	this.$items	= [];
};

cSVGPathSegList.prototype.numberOfItems	= 0;

cSVGPathSegList.prototype.$onchange	= new Function;

cSVGPathSegList.prototype.clear	= function() {
	this.$items.length	= 0;
	this.numberOfItems	= 0;
	this.$onchange();	};

cSVGPathSegList.prototype.initialize	= function(oItem) {
	this.$items.length	= 0;
	this.numberOfItems	= this.$items.push(oItem);
	this.$onchange();
	return oItem;
};

cSVGPathSegList.prototype.getItem		= function(nIndex) {
	if (nIndex > this.numberOfItems || nIndex < 0)
		throw new ample.classes.DOMException(DOMException.INDEX_SIZE_ERR);

	return this.$items[nIndex];
};

cSVGPathSegList.prototype.insertItemBefore	= function(oItem, nIndex) {
	if (nIndex > this.numberOfItems || nIndex < 0)
		throw new ample.classes.DOMException(DOMException.INDEX_SIZE_ERR);

	this.numberOfItems	= this.$items.length++;
	for (var n = this.numberOfItems - 1; n > nIndex; n--)
		this.$items[n]	= this.$items[n - 1];
	this.$items[nIndex]	= oItem;
	this.$onchange();
	return oItem;
};

cSVGPathSegList.prototype.replaceItem	= function(oItem, nIndex) {
	if (nIndex > this.numberOfItems || nIndex < 0)
		throw new ample.classes.DOMException(DOMException.INDEX_SIZE_ERR);

	this.$items[nIndex]	= oItem;
	this.$onchange();
	return oItem;
};

cSVGPathSegList.prototype.removeItem	= function(nIndex) {
	if (nIndex > this.numberOfItems || nIndex < 0)
		throw new ample.classes.DOMException(DOMException.INDEX_SIZE_ERR);

	var oItem	= this.$items[nIndex];
	for (var n = nIndex + 1; n < this.numberOfItems; n++)
		this.$items[n - 1]	= this.$items[n];
	this.numberOfItems	= this.$items.length--;
	this.$onchange();
	return oItem;
};

cSVGPathSegList.prototype.appendItem	= function(oItem) {
	this.numberOfItems	= this.$items.push(oItem);
	this.$onchange();
	return oItem;
};
function cSVGRect(nX, nY, nWidth, nHeight) {
	this.x	= nX;
	this.y	= nY;
	this.width	= nWidth;
	this.height	= nHeight;
};

cSVGRect.prototype.x	= 0;
cSVGRect.prototype.y	= 0;
cSVGRect.prototype.width	= 0;
cSVGRect.prototype.height	= 0;

cSVGRect.prototype.toString	= function() {
	return "[object SVGRect]";
};


var cSVGElement_a	= function(){};
cSVGElement_a.prototype	= new cSVGElement("a");

if (cSVGElement.useVML) {
	
		cSVGElement_a.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue	= this.getAttribute("xlink:href");
			if (sValue != "")
				this.$mapAttributesValue(sValue);
		},
		'mouseenter':	function(oEvent) {
			cSVGElement_a.recalcCSS(this);
		},
		'mouseleave':	function(oEvent) {
			cSVGElement_a.recalcCSS(this);
		}
	};

	cSVGElement_a.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "xlink:href")
			cSVGElement_a.setHref(this, sValue);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_a.prototype.$setStyle	= function(sName, sValue) {
		for (var nIndex = 0, oChild; oChild = this.childNodes[nIndex]; nIndex++)
			if (oChild.nodeType == 1 && !oChild.$getStyle(sName))
				oChild.$setStyle(sName, sValue);
	};

		cSVGElement_a.recalcCSS	= function(oElement) {
		for (var nIndex = 0, oChild; oChild = oElement.childNodes[nIndex]; nIndex++)
			if (oChild.nodeType == 1) {
				if (oChild instanceof cSVGElement_g)
					cSVGElement_a.recalcCSS(oChild);
				else
					cSVGElement.applyCSS(oChild);
			}
	};

	cSVGElement_a.setHref	= function(oElement, sValue) {
		for (var nIndex = 0, oChild, oElementDOM; oChild = oElement.childNodes[nIndex]; nIndex++) {
			if (oChild instanceof cSVGElement_g)
				cSVGElement_a.setHref(oChild, sValue);
			else
			if (oChild instanceof cSVGElement_text) {
				oElementDOM	= oChild.$getContainer();
				if (oElementDOM)
					oElementDOM.getElementsByTagName("shape")[0].href	= sValue;
			}
			else
			if (oChild.nodeType == 1) {
				oElementDOM	= oChild.$getContainer();
				if (oElementDOM)
					oElementDOM.href	= sValue;
			}
		}
	};

	cSVGElement_a.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_a.prototype.$getTagOpen	= function() {
		return '<svg2vml:group class="svg-a' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;width:100%;height:100%;left:0;top:0;"\
				>';
	};

	cSVGElement_a.prototype.$getTagClose	= function() {
		return '</svg2vml:group>';
	};
};

ample.extend(cSVGElement_a);


var cSVGElement_circle	= function(){};
cSVGElement_circle.prototype	= new cSVGElement("circle");

if (cSVGElement.useVML) {
	
		cSVGElement_circle.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_circle.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "cx" || sName == "cy" || sName == "r")
			this.$getContainer().path	= cSVGElement_circle.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_circle.toPath	= function(oElement) {
		var nCx	= oElement.getAttribute("cx") * 1,
			nCy	= oElement.getAttribute("cy") * 1,
			nR	= oElement.getAttribute("r") * 1;
		return "at" + [nCx - nR, nCy - nR, nCx + nR, nCy + nR, nCx - nR, nCy - nR, nCx - nR, nCy - nR].map(Math.round) + "x";
	};

		cSVGElement_circle.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-circle' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '" \
			style="position:absolute;top:0;left:0;height:100%;width:100%;"\
			path="' + cSVGElement_circle.toPath(this) + '"\
		>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_circle.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_circle);


var cSVGElement_clipPath	= function(){};
cSVGElement_clipPath.prototype	= new cSVGElement("clipPath");

if (cSVGElement.useVML) {
		cSVGElement_clipPath.prototype.$mapAttribute	= function(sName, sValue) {
			};

	cSVGElement_clipPath.prototype.$getTagOpen	= function() {
		return '<svg2vml:group style="top:0;left:0;width:100%;height:100%;display:none">';
	};

	cSVGElement_clipPath.prototype.$getTagClose	= function() {
		return '</svg2vml:group>';
	};
};

ample.extend(cSVGElement_clipPath);


var cSVGElement_defs	= function(){};
cSVGElement_defs.prototype	= new cSVGElement("defs");

if (cSVGElement.useVML) {
		cSVGElement_defs.prototype.$mapAttribute	= function(sName, sValue) {
			};

	cSVGElement_defs.prototype.$getTagOpen	= function() {
		return '<svg2vml:group style="top:0;left:0;width:100%;height:100%;display:none">';
	};

	cSVGElement_defs.prototype.$getTagClose	= function() {
		return '</svg2vml:group>';
	};
}

ample.extend(cSVGElement_defs);


var cSVGElement_desc	= function(){};
cSVGElement_desc.prototype	= new cSVGElement("desc");

if (cSVGElement.useVML) {
		cSVGElement_desc.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_desc.prototype.$getTag	= function() {
		return '';
	};
};

ample.extend(cSVGElement_desc);


var cSVGElement_ellipse	= function(){};
cSVGElement_ellipse.prototype	= new cSVGElement("ellipse");

if (cSVGElement.useVML) {
	
		cSVGElement_ellipse.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_ellipse.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "cx" || sName == "cy" || sName == "rx" || sName == "ry")
			this.$getContainer().path	= cSVGElement_ellipse.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_ellipse.toPath	= function(oElement) {
		var nCx	= oElement.getAttribute("cx") * 1,
			nCy	= oElement.getAttribute("cy") * 1,
			nRx	= oElement.getAttribute("rx") * 1,
			nRy	= oElement.getAttribute("ry") * 1;
		return (nRx && nRy) ? ("at" + [nCx - nRx, nCy - nRy, nCx + nRx, nCy + nRy, nCx - nRx, nCy - nRy, nCx - nRx, nCy - nRy].map(Math.round) + "x") : "";
	};

		cSVGElement_ellipse.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-ellipse' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '" \
			style="position:absolute;top:0;left:0;height:100%;width:100%;"\
			path="' + cSVGElement_ellipse.toPath(this) + '"\
		>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_ellipse.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_ellipse);


var cSVGElement_foreignObject	= function(){};
cSVGElement_foreignObject.prototype	= new cSVGElement("foreignObject");

if (cSVGElement.useVML) {
	
		cSVGElement_foreignObject.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_foreignObject.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "width" || sName == "height")
			this.$getContainer().style[sName]	= sValue + "px";
		else
		if (sName == "x" || sName == "y")
			oElement.style[sName == "x" ? "left" : "top"]	= sValue + "px";
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

		cSVGElement_foreignObject.prototype.$getTagOpen	= function() {
		var nOpacity= this.$getStyleComputed("opacity") * 1 || 1;
		return '<svg2vml:shape class="svg-foreignObject' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;width:' + this.getAttribute("width") + 'px;height:' + this.getAttribute("height") + 'px;left:' + this.getAttribute("x") + 'px;top:' + this.getAttribute("y") + 'px;filter:progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'clip\',enabled=false) progid:DXImageTransform.Microsoft.Alpha(' + (nOpacity != 1 ? 'opacity:' + nOpacity * 100 : 'enabled=false')+ ');"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_foreignObject.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_foreignObject);


var cSVGElement_g	= function(){};
cSVGElement_g.prototype	= new cSVGElement("g");

if (cSVGElement.useVML) {
		cSVGElement_g.prototype.$setStyle	= function(sName, sValue) {
		for (var nIndex = 0, oChild; oChild = this.childNodes[nIndex]; nIndex++)
			if (oChild.nodeType == 1 && !oChild.$getStyle(sName))
				oChild.$setStyle(sName, sValue);
	};

		cSVGElement_g.prototype.$getTagOpen	= function() {
				return '<svg2vml:group class="svg-g' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="top:0;left:0;width:100%;height:100%;position:absolute;' + (this.hasAttribute("style") ? this.getAttribute("style") : '')+ '"\
				>';
	};

	cSVGElement_g.prototype.$getTagClose	= function() {
		return '</svg2vml:group>';
	};
};

ample.extend(cSVGElement_g);


var cSVGElement_image	= function(){};
cSVGElement_image.prototype	= new cSVGElement("image");

if (cSVGElement.useVML) {
	
		cSVGElement_image.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_image.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "width" || sName == "height") {
			var aValue	= sValue.match(/([\d.]+)([%\w]*)/);
			this.$getContainer().style[sName]	= aValue[1] + (aValue[2] || "px");
		}
		else
		if (sName == "xlink:href")
			this.$getContainer().imagedata.src	= cSVGElement_image.resolveXmlBase(this, sValue);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_image.resolveXmlBase	= function(oElement, sUri) {
		for (var oNode = oElement, sBaseUri = ''; oNode != null && oNode.nodeType != 9; oNode = oNode.parentNode)
			if (sBaseUri = oNode.getAttribute("xml:base"))
				sUri	= ample.resolveUri(sUri, sBaseUri);
		return ample.resolveUri(sUri, String(document.location));
	};

		cSVGElement_image.prototype.$getTagOpen	= function() {
		var aWidth	= this.getAttribute("width").match(/([\d.]+)([%\w]*)/),
			aHeight	= this.getAttribute("height").match(/([\d.]+)([%\w]*)/),
			nOpacity= this.$getStyleComputed("opacity") * 1 || 1;
		return '<svg2vml:shape class="svg-image' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;padding:10cm;width:' + aWidth[1] + (aWidth[2] || 'px') + ';height:' + aHeight[1] + (aHeight[2] || 'px') + ';left:' + this.getAttribute("x") + 'px;top:' + this.getAttribute("y") + 'px;filter:progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'clip\',enabled=false) progid:DXImageTransform.Microsoft.Alpha(' + (nOpacity != 1 ? 'opacity:' + nOpacity * 100 : 'enabled=false')+ ')" stroked="false"\
				>\
					<svg2vml:imagedata src="' + cSVGElement_image.resolveXmlBase(this, this.getAttribute("xlink:href"))+ '"/>';
	};

	cSVGElement_image.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_image);


var cSVGElement_line	= function(){};
cSVGElement_line.prototype	= new cSVGElement("line");

if (cSVGElement.useVML) {
	
		cSVGElement_line.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_line.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "x1" || sName == "y1" || sName == "x2" || sName == "y2")
			this.$getContainer().path	= cSVGElement_line.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_line.toPath	= function(oElement) {
		var nX1	= oElement.getAttribute("x1") * 1,
			nY1	= oElement.getAttribute("y1") * 1,
			nX2	= oElement.getAttribute("x2") * 1,
			nY2	= oElement.getAttribute("y2") * 1;
		return "m" + [nX1, nY1].map(Math.round) + "l" + [nX2, nY2].map(Math.round) + "x";
	};

		cSVGElement_line.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-line' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
						style="position:absolute;top:0;left:0;height:100%;width:100%;"\
						path="' + cSVGElement_line.toPath(this) + '"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_line.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_line);


var cSVGElement_linearGradient	= function(){};
cSVGElement_linearGradient.prototype	= new cSVGElement("linearGradient");

if (cSVGElement.useVML) {
		cSVGElement_linearGradient.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "x1" || sName == "y1" || sName == "x2" || sName == "y2") {
			var sId	= this.getAttribute("id");
			if (sId) {
				var aElements	= this.ownerDocument.querySelectorAll("[fill=url(#" + sId + ")]");
				for (var nIndex = 0; nIndex < aElements.length; nIndex++)
					aElements[nIndex].$setStyle("fill", "url(#" + sId + ")");
			}
		}
	};
};

ample.extend(cSVGElement_linearGradient);


var cSVGElement_marker	= function(){};
cSVGElement_marker.prototype	= new cSVGElement("marker");

if (cSVGElement.useVML) {
		cSVGElement_marker.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_marker.prototype.$getTagOpen	= function() {
		return '';
	};

	cSVGElement_marker.prototype.$getTagClose	= function() {
		return '';
	};
};

ample.extend(cSVGElement_marker);


var cSVGElement_metadata	= function(){};
cSVGElement_metadata.prototype	= new cSVGElement("metadata");

if (cSVGElement.useVML) {
		cSVGElement_metadata.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_metadata.prototype.$getTag	= function() {
		return '';
	};
};

ample.extend(cSVGElement_metadata);


var cSVGElement_path	= function(){
	this.pathSegList			= new cSVGPathSegList;

};
cSVGElement_path.prototype	= new cSVGElement("path");

cSVGElement_path.prototype.pathSegList				= null;

cSVGElement_path.prototype.pathLength	= 0;

cSVGElement_path.prototype.getTotalLength	= function() {
	throw new ample.classes.DOMException(DOMException.NOT_SUPPORTED_ERR);
};

cSVGElement_path.prototype.getPointAtLength	= function(nDistance) {
	throw new ample.classes.DOMException(DOMException.NOT_SUPPORTED_ERR);
};

cSVGElement_path.prototype.getPathSegAtLength	= function(nDistance) {
	throw new ample.classes.DOMException(DOMException.NOT_SUPPORTED_ERR);
};

cSVGElement_path.prototype.createSVGPathSegClosePath	= function() {
	return new cSVGPathSegClosePath;
};

cSVGElement_path.prototype.createSVGPathSegMovetoAbs	= function(nX, nY) {
	return new cSVGPathSegMovetoAbs(nX, nY);
};

cSVGElement_path.prototype.createSVGPathSegMovetoRel	= function(nX, nY) {
	return new cSVGPathSegMovetoRel(nX, nY);
};

cSVGElement_path.prototype.createSVGPathSegLinetoAbs	= function(nX, nY) {
	return new cSVGPathSegLinetoAbs(nX, nY);
};

cSVGElement_path.prototype.createSVGPathSegLinetoRel	= function(nX, nY) {
	return new cSVGPathSegLinetoRel(nX, nY);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoCubicAbs	= function(nX, nY, nX1, nY1, nX2, nY2) {
	return new cSVGPathSegCurvetoCubicAbs(nX, nY, nX1, nY1, nX2, nY2);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoCubicRel	= function(nX, nY, nX1, nY1, nX2, nY2) {
	return new cSVGPathSegCurvetoCubicRel(nX, nY, nX1, nY1, nX2, nY2);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoQuadraticAbs	= function(nX, nY, nX1, nY1) {
	return new cSVGPathSegCurvetoQuadraticAbs(nX, nY, nX1, nY1);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoQuadraticRel	= function(nX, nY, nX1, nY1) {
	return new cSVGPathSegCurvetoQuadraticRel(nX, nY, nX1, nY1);
};

cSVGElement_path.prototype.createSVGPathSegArcAbs	= function(nX, nY, nR1, nR2, nAngle, bLargeArc, bSweep) {
	return new cSVGPathSegArcAbs(nX, nY, nR1, nR2, nAngle, bLargeArc, bSweep);
};

cSVGElement_path.prototype.createSVGPathSegArcRel	= function(nX, nY, nR1, nR2, nAngle, bLargeArc, bSweep) {
	return new cSVGPathSegArcRel(nX, nY, nR1, nR2, nAngle, bLargeArc, bSweep);
};

cSVGElement_path.prototype.createSVGPathSegLinetoHorizontalAbs	= function(nX) {
	return new cSVGPathSegLinetoHorizontalAbs(nX);
};

cSVGElement_path.prototype.createSVGPathSegLinetoHorizontalRel	= function(nX) {
	return new cSVGPathSegLinetoHorizontalRel(nX);
};

cSVGElement_path.prototype.createSVGPathSegLinetoVerticalAbs	= function(nY) {
	return new cSVGPathSegLinetoVerticalAbs(nY);
};

cSVGElement_path.prototype.createSVGPathSegLinetoVerticalRel	= function(nY) {
	return new cSVGPathSegLinetoVerticalRel(nY);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoCubicSmoothAbs	= function(nX, nY, nX2, nY2) {
	return new cSVGPathSegCurvetoCubicSmoothAbs(nX, nY, nX2, nY2);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoCubicSmoothRel	= function(nX, nY, nX2, nY2) {
	return new cSVGPathSegCurvetoCubicSmoothRel(nX, nY, nX2, nY2);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoQuadraticSmoothAbs	= function(nX, nY) {
	return new cSVGPathSegCurvetoQuadraticSmoothAbs(nX, nY);
};

cSVGElement_path.prototype.createSVGPathSegCurvetoQuadraticSmoothRel	= function(nX, nY) {
	return new cSVGPathSegCurvetoQuadraticSmoothRel(nX, nY);
};

cSVGElement_path.d2PathSegList	= function(oInstance) {

};

cSVGElement_path.pathSegList2d	= function(oInstance) {

};

if (cSVGElement.useVML) {
	
		cSVGElement_path.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_path.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "d")
			this.$getContainer().path	= cSVGElement_path.convert(sValue);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_path.pathSegList2Path	= function(oPathSegList) {
		var aPath	= [];
		for (var nIndex = 0; nIndex < this.pathSeqList.numberOfItems; nIndex++) {
			switch (this.pathSeqList[nIndex].pathSegType) {
				case cSVGPathSeg.PATHSEG_CLOSEPATH:
					break;

				case cSVGPathSeg.PATHSEG_MOVETO_ABS:
					break;

				case cSVGPathSeg.PATHSEG_MOVETO_REL:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_ABS:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_REL:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
					break;

				case cSVGPathSeg.PATHSEG_ARC_ABS:
					break;

				case cSVGPathSeg.PATHSEG_ARC_REL:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS:
					break;

				case cSVGPathSeg.PATHSEG_LINETO_VERTICAL_REL:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
					break;

				case cSVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
					break;
			}
		}
	};

	cSVGElement_path.hQuadratic	= {"Q":true, "q":true, "T":true, "t":true};
	cSVGElement_path.hCubic		= {"C":true, "c":true, "S":true, "s":true};

	cSVGElement_path.convert	= function(sValue) {
		var aCommands	= sValue.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig),
			iStartX		= 0,
			iStartY		= 0,
			iCurrentX	= 0,
			iCurrentY	= 0,
			aCubic		= null,
			aQuadratic	= null,
			aPath		= [];

		if (!aCommands)
			return '';

		for (var i = 0, sCommand, aParameters, nParameters, nCommands = aCommands.length; i < nCommands; i++) {
			sCommand	= aCommands[i].substr(0, 1);
			aParameters	= aCommands[i].substr(1).
								replace(/(\d)-/g, '$1,-').
								replace(/^\s+|\s+$/g, '').
								split(/[,\s]/).map(function(nValue) {
									return nValue * 1;
								}),
			nParameters	= aParameters.length;

			switch (sCommand) {
								case "M":
					iCurrentX	= aParameters[0];
					iCurrentY	= aParameters[1];
					iStartX		= iCurrentX;
					iStartY		= iCurrentY;
					aPath.push("m" + aParameters.slice(0, 2).map(Math.round) + " ");

										if (nParameters == 2)
						break;
					else {
						aParameters	= aParameters.slice(2);
						nParameters-= 2;
					}

								case "L":
					iCurrentX	= aParameters[nParameters - 2];
					iCurrentY	= aParameters[nParameters - 1];
					aPath.push("l" + aParameters.map(Math.round) + " ");
					break;

				case "m":
					iCurrentX	+= aParameters[0];
					iCurrentY	+= aParameters[1];
					iStartX		= iCurrentX;
					iStartY		= iCurrentY;
					aPath.push("t" + aParameters.slice(0, 2).map(Math.round) + " ");

										if (nParameters == 2)
						break;
					else {
						aParameters	= aParameters.slice(2);
						nParameters-= 2;
					}

				case "l":
					for (var j = 0; j < nParameters; j+= 2) {
						iCurrentX	+= aParameters[j];
						iCurrentY	+= aParameters[j + 1];
					}
					aPath.push("r" + aParameters.map(Math.round) + " ");
					break;

								case "H":
					for (var j = 0; j < nParameters; j+=1) {
						aPath.push("l" + [aParameters[j], iCurrentY].map(Math.round) + " ");
					}
					iCurrentX	= aParameters[nParameters - 1];
					break;

				case "h":
					for (var j = 0; j < nParameters; j+=1) {
						aPath.push("r" + [aParameters[j], 0].map(Math.round) + " ");
						iCurrentX	+= aParameters[j];
					}
					break;

								case "V":
					for (var j = 0; j < nParameters; j+=1) {
						aPath.push("l" + [iCurrentX, aParameters[j]].map(Math.round) + " ");
					}
					iCurrentY	= aParameters[nParameters - 1];
					break;

				case "v":
					for (var j = 0; j < nParameters; j+=1) {
						aPath.push("r" + [0, aParameters[j]].map(Math.round) + " ");
						iCurrentY	+= aParameters[j];
					}
					break;

								case "C":
					aPath.push("c" + aParameters.map(Math.round) + " ");
					iCurrentX	= aParameters[nParameters - 2];
					iCurrentY	= aParameters[nParameters - 1];
					aCubic	= [aParameters[nParameters - 4], aParameters[nParameters - 3]];
					break;

				case "c":
					aPath.push("v" + aParameters.map(Math.round) + " ");
					iCurrentX	+= aParameters[nParameters - 2];
					iCurrentY	+= aParameters[nParameters - 1];
					aCubic	= [aParameters[nParameters - 4], aParameters[nParameters - 3]];
					break;

								case "S":
					for (var j = 0; j < nParameters; j+=4) {
						aPath.push("c" + [iCurrentX + (aCubic ? iCurrentX - aCubic[0] : 0), iCurrentY + (aCubic ? iCurrentY - aCubic[1] : 0)].map(Math.round) + "," + aParameters.slice(j, j + 4).map(Math.round) + " ");
						aCubic	= [aParameters[j], aParameters[j + 1]];
						iCurrentX	= aParameters[j + 2];
						iCurrentY	= aParameters[j + 3];
					}
					break;

				case "s":
					for (var j = 0; j < nParameters; j+=4) {
						aPath.push("v" + [(aCubic ? aParameters[j + 2] - aCubic[0] : 0), (aCubic ? aParameters[j + 3] - aCubic[1] : 0)].map(Math.round) + "," + aParameters.slice(j, j + 4).map(Math.round) + " ");
						aCubic	= [aParameters[j], aParameters[j + 1]];
						iCurrentX	+= aParameters[j + 2];
						iCurrentY	+= aParameters[j + 3];
					}
					break;

								case "Q":						for (var j = 0; j < nParameters; j+=4) {
						aPath.push("c" + [iCurrentX, iCurrentY].map(Math.round) + "," + aParameters.slice(j, j + 4).map(Math.round) + " ");
						aQuadratic	= [aParameters[j], aParameters[j + 1]];
						iCurrentX	= aParameters[j + 2];
						iCurrentY	= aParameters[j + 3];
					}
					break;

				case "q":						for (var j = 0; j < nParameters; j+=4) {
						aPath.push("v0,0" + "," + aParameters.slice(j, j + 4).map(Math.round) + " ");
						aQuadratic	= [aParameters[j], aParameters[j + 1]];
						iCurrentX	+= aParameters[j + 2];
						iCurrentY	+= aParameters[j + 3];
					}
					break;

								case "T":						for (var j = 0; j < nParameters; j+=2) {
						aPath.push("c" + [iCurrentX, iCurrentY].map(Math.round) + "," + [iCurrentX + (aQuadratic ? iCurrentX - aQuadratic[0] : 0), iCurrentY + (aQuadratic ? iCurrentY - aQuadratic[1] : 0)].map(Math.round) + "," + aParameters.slice(j, j +2).map(Math.round) + " ");
						iCurrentX	= aParameters[j + 2];
						iCurrentY	= aParameters[j + 3];
					}
					break;

				case "t":						for (var j = 0; j < nParameters; j+=2) {
						aPath.push("v0,0" + "," + [(aQuadratic ? aParameters[j] - aQuadratic[0] : 0), (aQuadratic ? aParameters[j + 1] - aQuadratic[1] : 0)].map(Math.round) + "," + aParameters.slice(j, j +2).map(Math.round) + " ");
						iCurrentX	+= aParameters[j];
						iCurrentY	+= aParameters[j + 1];
					}
					break;

								case "A":					case "a":
					var iRadiusX	= aParameters[0],
						iRadiusY	= aParameters[1],
						iRotation	= aParameters[2],
						bLargeArc	= aParameters[3] == "1",
						bSweep		= aParameters[4] == "1",
						iToX		= aParameters[5] + (sCommand == "A" ? 0 : iCurrentX),
						iToY		= aParameters[6] + (sCommand == "A" ? 0 : iCurrentY);

					var a	= (iToX - iCurrentX) / (2 * iRadiusX),
						b	= (iToY - iCurrentY) / (2 * iRadiusY),
						c	= Math.sqrt(Math.abs(1 - 1 / (a * a + b * b))) * (bLargeArc == bSweep ? -1 : 1),
						iCenterX	= iCurrentX + iRadiusX * (a - c * b),
						iCenterY	= iCurrentY + iRadiusY * (b + c * a);
					aPath.push((bSweep ? "wa" : "at") + [iCenterX - iRadiusX, iCenterY - iRadiusY, iCenterX + iRadiusX, iCenterY + iRadiusY, iCurrentX, iCurrentY, iToX, iToY].map(Math.round) + " ");

					if (sCommand == "A") {
						iCurrentX	= aParameters[5];
						iCurrentY	= aParameters[6];
					}
					else {
						iCurrentX	+= aParameters[5];
						iCurrentY	+= aParameters[6];
					}
					break;

								case "Z":
				case "z":
					aPath.push("x");
					iCurrentX	= iStartX;
					iCurrentY	= iStartY;
					break;
			}

						if (!cSVGElement_path.hQuadratic[sCommand])
				aQuadratic	= null;
			else
			if (!cSVGElement_path.hCubic[sCommand])
				aCubic		= null;
		}

		return aPath.join('') + "e";
	};

		cSVGElement_path.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-path' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
						style="position:absolute;top:0;left:0;height:100%;width:100%;"\
						path="' + cSVGElement_path.convert(this.getAttribute("d")) + '"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_path.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
}
else {
	cSVGElement_path.handlers	= {
		"DOMAttrModified":	function(oEvent) {
			if (oEvent.target == this) {
				switch (oEvent.attrName) {
					case "d":
						break;
				}
			}
		},
		"DOMNodeInsertedIntoDocument":	function(oEvent) {
			this.pathSegList	= this.$getContainer().pathSegList;
		}
	};
};

ample.extend(cSVGElement_path);


var cSVGElement_pattern	= function(){};
cSVGElement_pattern.prototype	= new cSVGElement("pattern");

if (cSVGElement.useVML) {
		cSVGElement_pattern.prototype.$mapAttribute	= function(sName, sValue) {
			};
};

ample.extend(cSVGElement_pattern);


var cSVGElement_polygon	= function(){};
cSVGElement_polygon.prototype	= new cSVGElement("polygon");

if (cSVGElement.useVML) {
	
		cSVGElement_polygon.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_polygon.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "points")
			this.$getContainer().path	= cSVGElement_polygon.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_polygon.toPath	= function(oElement) {
		var aPoints	= oElement.getAttribute("points").split(/[ ,]/);
		return "m " + aPoints.slice(0, 2).map(Math.round)+ " l " + aPoints.slice(2).map(Math.round) + " x";
	};

		cSVGElement_polygon.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-polygon' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
						style="position:absolute;top:0;left:0;height:100%;width:100%;"\
						path="' + cSVGElement_polygon.toPath(this) + '"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_polygon.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_polygon);


var cSVGElement_polyline	= function(){};
cSVGElement_polyline.prototype	= new cSVGElement("polyline");

if (cSVGElement.useVML) {
	
		cSVGElement_polyline.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_polyline.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "points")
			this.$getContainer().path	= cSVGElement_polyline.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_polyline.toPath	= function(oElement) {
		var aPoints	= oElement.getAttribute("points").split(/[ ,]/);
		return "m " + aPoints.slice(0, 2).map(Math.round)+ " l " + aPoints.slice(2).map(Math.round) + " e";
	};

		cSVGElement_polyline.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-polyline' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
						style="position:absolute;top:0;left:0;height:100%;width:100%;"\
						path="' + cSVGElement_polyline.toPath(this) + '"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_polyline.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_polyline);


var cSVGElement_radialGradient	= function(){};
cSVGElement_radialGradient.prototype	= new cSVGElement("radialGradient");

if (cSVGElement.useVML) {
		cSVGElement_radialGradient.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "cx" || sName == "cy" || sName == "y") {
			var sId	= this.getAttribute("id");
			if (sId) {
				var aElements	= this.ownerDocument.querySelectorAll("[fill=url(#" + sId + ")]");
				for (var nIndex = 0; nIndex < aElements.length; nIndex++)
					aElements[nIndex].$setStyle("fill", "url(#" + sId + ")");
			}
		}
	};
};

ample.extend(cSVGElement_radialGradient);


var cSVGElement_rect	= function(){};
cSVGElement_rect.prototype	= new cSVGElement("rect");

if (cSVGElement.useVML) {
	
		cSVGElement_rect.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_rect.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "width" || sName == "height" || sName == "x" || sName == "y" || sName == "rx" || sName == "ry")
			this.$getContainer().path	= cSVGElement_rect.toPath(this);
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

	cSVGElement_rect.toPath	= function(oElement) {
		var nX	= oElement.getAttribute("x") * 1,
			nY	= oElement.getAttribute("y") * 1,
			nWidth	= oElement.getAttribute("width") * 1,
			nHeight	= oElement.getAttribute("height") * 1,
			nRx	= oElement.getAttribute("rx") * 1 || 0,
			nRy	= oElement.getAttribute("ry") * 1 || 0;
		if (nWidth && nHeight) {
						if (nRx && !nRy)
				nRy	= nRx;
			else
			if (nRy && !nRx)
				nRx	= nRy;
						if (nRx > nWidth / 2)
				nRx	= nWidth / 2;
			if (nRy > nHeight / 2)
				nRy	= nHeight / 2;

			return ["m", [nX + nRx, nY].map(Math.round),
					"l", [nX + nWidth - nRx, nY].map(Math.round),
					"wa", [nX + nWidth - 2 * nRx, nY, nX + nWidth, nY + 2 * nRy, nX + nWidth - nRx, nY, nX + nWidth, nY + nRy].map(Math.round),
					"l", [nX + nWidth, nY + nHeight - nRy].map(Math.round),
					"wa", [nX + nWidth - 2 * nRx, nY + nHeight - 2 * nRy, nX + nWidth, nY + nHeight, nX + nWidth, nY + nHeight - nRy, nX + nWidth - nRx, nY + nHeight].map(Math.round),
					"l", [nX + nRx, nY + nHeight].map(Math.round),
					"wa", [nX, nY + nHeight - 2 * nRy, nX + 2 * nRx, nY + nHeight, nX + nRx, nY + nHeight, nX, nY + nHeight - nRy].map(Math.round),
					"l", [nX, nY + nRy].map(Math.round),
					"wa", [nX, nY, nX + 2 * nRx, nY + 2 * nRy, nX, nY + nRy, nX + nRx, nY].map(Math.round),
					"x"].join(" ");
		}
		else
			return "";
	};

		cSVGElement_rect.prototype.$getTagOpen	= function() {
		return '<svg2vml:shape class="svg-rect' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '" \
					style="position:absolute;top:0;left:0;height:100%;width:100%;"\
					path="' + cSVGElement_rect.toPath(this) + '"\
				>' + cSVGElement.getTagStyle(this);
	};

	cSVGElement_rect.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_rect);


var cSVGElement_script	= function(){};
cSVGElement_script.prototype	= new cSVGElement("script");

if (cSVGElement.useVML) {
		cSVGElement_script.prototype.$mapAttribute	= function(sName, sValue) {
			};
};

cSVGElement_script.prototype.$getTag	= function() {
	return '';
};

cSVGElement_script.handlers	= {
	"DOMNodeInsertedIntoDocument":	function(oEvent) {
		if (this.firstChild instanceof ample.classes.CharacterData) {
			var oScript	= document.createElement("script");
			document.getElementsByTagName("head")[0].appendChild(oScript);
			oScript.type	= "text/javascript";
			oScript.text	= this.firstChild.data;
		}
	}
};

ample.extend(cSVGElement_script);


var cSVGElement_stop	= function(){};
cSVGElement_stop.prototype	= new cSVGElement("stop");

if (cSVGElement.useVML) {
		cSVGElement_stop.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "offset" || sName == "stop-color" || sName == "stop-opacity") {
			var sId	= this.parentNode.getAttribute("id");
			if (sId) {
				var aElements	= this.ownerDocument.querySelectorAll("[fill=url(#" + sId + ")]");
				for (var nIndex = 0; nIndex < aElements.length; nIndex++)
					aElements[nIndex].$setStyle("fill", "url(#" + sId + ")");
			}
		}
	};
};

ample.extend(cSVGElement_stop);


var cSVGElement_style	= function(){};
cSVGElement_style.prototype	= new cSVGElement("style");

if (cSVGElement.useVML) {
	
	cSVGElement_style.translate	= function(sCSS) {
		var aCSS	= [],
			aRules	= sCSS.match(/[^\{]+\{[^\}]+\}/g);
		if (aRules) {
			for (var nIndex = 0, nLength = aRules.length, aRule; nIndex < nLength; nIndex++) {
				aRule	= aRules[nIndex].match(/([^\{]+)(\{[^\}]+\})/);
				aCSS.push(aRule[1]
								.replace(/\|/g, '-')															.replace(/([\s>+~,])(\w+\|)?([\w])/g, '$1.svg-$3')									,
								aRule[2]);
			}
		}
		return aCSS.join('');
	};

	cSVGElement_style.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_style.prototype.$getTagOpen	= function() {
				if (this.firstChild instanceof ample.classes.Text) {
			this.firstChild.nodeValue	=
			this.firstChild.data	= cSVGElement_style.translate(this.firstChild.data);
			this.firstChild.length	= this.firstChild.data.length;
		}

		return '<style type="text/css">';
	};

	cSVGElement_style.prototype.$getTagClose	= function() {
		return '</style>';
	};
};

ample.extend(cSVGElement_style);


var cSVGElement_svg	= function(){};
cSVGElement_svg.prototype	= new cSVGElement("svg");

if (cSVGElement.useVML) {
	
		cSVGElement_svg.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
						var that	= this;
			setTimeout(function() {
								that.refresh();

								var oEventLoad	= that.ownerDocument.createEvent("Event");
				oEventLoad.initEvent("load", false, false);
				that.dispatchEvent(oEventLoad);
			}, 0);
		},
		'DOMNodeRemovedFromDocument':	function() {
			this.$getContainer().onresize	= null;
		}
	};

	cSVGElement_svg.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "width" || sName == "height" || sName == "viewBox")
			cSVGElement_svg.resize(this);
	};

	cSVGElement_svg.resize	= function(oInstance) {
		var oElement	= oInstance.$getContainer(),
			oElementGroup	= oInstance.$getContainer("gateway"),
			aBox	= cSVGElement_svg.getBox(oInstance);
				oElementGroup.style.display	= "none";
		oElementGroup.style.marginLeft	= aBox[0][0];
		oElementGroup.style.marginTop	= aBox[0][1];
		oElementGroup.style.width	= aBox[1][0];
		oElementGroup.style.height	= aBox[1][1];
		oElement.style.width	= aBox[2][0];
		oElement.style.height	= aBox[2][1];
				oElement.onresize	= null;
				setTimeout(function() {
			var oGroup	= oInstance.$getContainer("gateway");
			if (oGroup)
				oGroup.style.display	= "";
						oElement.onresize	= function() {
				oInstance.resize();
			};
		}, 0);
		};

	cSVGElement_svg.getBox	= function(oInstance) {
		var aViewBox= oInstance.getAttribute("viewBox").split(/[\s,]/),
			aWidth	= oInstance.getAttribute("width").match(/([\d.]+)([%\w]*)/),
			aHeight	= oInstance.getAttribute("height").match(/([\d.]+)([%\w]*)/);

				if (aViewBox.length < 4) {
			if (!aWidth)
				aWidth	= [null, 600, "px"];
			if (!aHeight)
				aHeight	= [null, 600, "px"];
			aViewBox	= [0, 0, aWidth[1], aHeight[1]];
		}
		else {
			if (!aWidth)
				aWidth	= [null, aViewBox[2], "px"];
			if (!aHeight)
				aHeight	= [null, aViewBox[3], "px"];
		}

		var sWidthOuter	= aWidth[1] + (aWidth[2] || "px"),
			sHeightOuter= aHeight[1] + (aHeight[2] || "px"),
			nWidthInner	= aWidth[1],
			nHeightInner= aHeight[1];

		if (aWidth[2] == "%" || aHeight[2] == "%") {
			var oBCRect		= oInstance.getBoundingClientRect();
			if (aWidth[2] == "%") {
				nWidthInner		= oBCRect.right - oBCRect.left;
				nHeightInner	= nWidthInner / (aViewBox[2] / aViewBox[3]);
				sHeightOuter	= nHeightInner + "px";
			}
			else
			if (aHeight[2] == "%") {
				nHeightInner	= oBCRect.bottom - oBCRect.top;
				nWidthInner		= nHeightInner * (aViewBox[2] / aViewBox[3]);
				sWidthOuter		= nWidthInner + "px";
			}
		}

				var nRatio	= (aViewBox[2] / aViewBox[3]) / (nWidthInner / nHeightInner);
		if (nRatio > 1) {
			nTop	= (nHeightInner - (nHeightInner / nRatio)) / 2;
			nHeightInner	/= nRatio;
		}
		else {
			nLeft	= (nWidthInner - (nWidthInner * nRatio)) / 2;
			nWidthInner	*= nRatio;
		}

				var nLeft	= 0,
			nTop	= 0;
		if (aViewBox[0])
			nLeft	-= (aViewBox[0] / aViewBox[2]) * nWidthInner;
		if (aViewBox[1])
			nTop	-= (aViewBox[1] / aViewBox[3]) * nHeightInner;

		var sWidthUnit	= aWidth[2] == "%" || !aWidth[2] ? "px" : aWidth[2],
			sHeightUnit	= aHeight[2] == "%" || !aHeight[2] ? "px" : aHeight[2];

		return [
				[nLeft + sWidthUnit, nTop + sHeightUnit],
				[nWidthInner + sWidthUnit, nHeightInner + sHeightUnit],
				[sWidthOuter, sHeightOuter]
		];
	};

	cSVGElement_svg.prototype.resize	= function() {
				if (this._resize)
			clearTimeout(this._resize);
		var that	= this;
		this._resize	= setTimeout(function() {
			that.refresh();
		}, 100);
	};

		cSVGElement_svg.prototype.$getTagOpen	= function() {
		var aViewBox= this.getAttribute("viewBox").split(/[\s,]/) || [],
			aWidth	= this.getAttribute("width").match(/([\d.]+)([%\w]*)/) || [],
			aHeight	= this.getAttribute("height").match(/([\d.]+)([%\w]*)/) || [];
		return '<div class="svg-svg' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '" style="position:relative;display:block;overflow:hidden;' + (this.hasAttribute("style") ? this.getAttribute("style") : '') + '">\
					<svg2vml:group class="svg-svg--gateway" style="position:absolute;display:none;"\
						coordOrigin="0,0"\
						coordSize="' + (aViewBox[2] || aWidth[1] || 600) + ',' + (aViewBox[3] || aHeight[1] || 600) + '"\
					>';
	};

	cSVGElement_svg.prototype.$getTagClose	= function() {
		return 		'</svg2vml:group>\
				</div>';
	};
}
else {
		cSVGElement_svg.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var that	= this;
			setTimeout(function() {
								var oEventLoad	= that.ownerDocument.createEvent("Event");
				oEventLoad.initEvent("load", false, false);
				that.dispatchEvent(oEventLoad);
			}, 0);
		}
	};
}


ample.extend(cSVGElement_svg);


var cSVGElement_switch	= function(){};
cSVGElement_switch.prototype	= new cSVGElement("switch");

if (cSVGElement.useVML) {
		cSVGElement_switch.prototype.$mapAttribute	= function(sName, sValue) {
			};
};

ample.extend(cSVGElement_switch);


var cSVGElement_symbol	= function(){};
cSVGElement_symbol.prototype	= new cSVGElement("symbol");

if (cSVGElement.useVML) {
		cSVGElement_symbol.prototype.$mapAttribute	= function(sName, sValue) {
			};
};

ample.extend(cSVGElement_symbol);


var cSVGElement_text	= function(){};
cSVGElement_text.prototype	= new cSVGElement("text");

if (cSVGElement.useVML) {
		cSVGElement_text.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
						for (var oElement = this.$getContainer(), i = 0; oElement.childNodes[i]; i++)
				if (oElement.childNodes[i].tagName != "shape")
					oElement.removeChild(oElement.childNodes[i--]);

			if (this.firstChild instanceof ample.classes.CharacterData)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= this.firstChild.data.replace(/^\s+/, '').replace(/\s+$/, '');

			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		},
		'DOMCharacterDataModified':	function(oEvent) {
			if (oEvent.target.parentNode == this)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= oEvent.target.data.replace(/^\s+/, '').replace(/\s+$/, '');
		}
	};

	cSVGElement_text.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "x" || sName == "y" || sName == "dx" || sName == "dy") {
			var nLeft	=(this.getAttribute("x").match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
				nTop	=(this.getAttribute("y").match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0);
			this.$getContainer().getElementsByTagName("shape")[0].path	= 'm ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x';
		}
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

		cSVGElement_text.prototype.$setStyle	= function(sName, sValue) {
		for (var nIndex = 0, oChild; oChild = this.childNodes[nIndex]; nIndex++)
			if (oChild.nodeType == 1 && !oChild.$getStyle(sName))
				oChild.$setStyle(sName, sValue);
				cSVGElement.prototype.$setStyle.call(this, sName, sValue);
	};

		cSVGElement_text.prototype.$getTagOpen	= function() {
		var sFontFamily	= this.$getStyleComputed("font-family") || "Times New Roman",
			sFontWeight	= this.$getStyleComputed("font-weight"),
			sFontSize	= this.$getStyleComputed("font-size"),
			sFontStyle	= this.$getStyleComputed("font-style"),
			sTextAnchor	= this.$getStyleComputed("text-anchor"),
			nLeft	=(this.getAttribute("x").match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
			nTop	=(this.getAttribute("y").match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0),
						aFontSize	= sFontSize.match(/(^[\d.]*)(.*)$/),
			sFontSizeUnit	= aFontSize[2] || "px",
			nFontSizeValue	= aFontSize[1] || 16,
			nFontSize	= Math.round(nFontSizeValue * cSVGElement.getScaleFactor(this)),
			nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

		return '<svg2vml:group class="svg-text' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;top:0;left:0;width:100%;height:100%;">\
					<svg2vml:shape \
						style="position:absolute;width:100%;height:100%;margin-top:' + nMarginTop + 'px;left:0px;top:0px;"\
						path="m ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x" allowoverlap="true"\
					>' + cSVGElement.getTagStyle(this) + '\
						<svg2vml:path textpathok="true" />\
						<svg2vml:textpath on="true" xscale="true"\
							style="v-text-align:' + cSVGElement.textAnchorToVTextAlign(sTextAnchor) + ';font-size:' + nFontSize + sFontSizeUnit + ';' + (sFontFamily ? 'font-family:\'' + sFontFamily + '\';' : '') + (sFontWeight ? 'font-weight:' + sFontWeight + ';' : '') + (sFontStyle ? 'font-style:' + sFontStyle + ';' : '') + '" />\
					</svg2vml:shape>';
	};

	cSVGElement_text.prototype.$getTagClose	= function() {
		return '</svg2vml:group>';
	};
};

ample.extend(cSVGElement_text);


var cSVGElement_textPath	= function(){};
cSVGElement_textPath.prototype	= new cSVGElement("textPath");

if (cSVGElement.useVML) {
			cSVGElement_textPath.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;
						if (sValue = this.getAttribute("xlink:href"))
				this.$mapAttribute("xlink:href", sValue);

						if (this.firstChild instanceof ample.classes.CharacterData)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= this.firstChild.data.replace(/^\s+/, '').replace(/\s+$/, '');

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		},
		'DOMCharacterDataModified':	function(oEvent) {
			if (oEvent.target.parentNode == this)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= oEvent.target.data.replace(/^\s+/, '').replace(/\s+$/, '');
		}
	};

	cSVGElement_textPath.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "xlink:href") {
			var oTextPath	= this.ownerDocument.getElementById(sValue.substr(1));
			if (oTextPath)
				this.$getContainer().path	= cSVGElement_path.convert(oTextPath.getAttribute("d"));
		}
	};

		cSVGElement_textPath.prototype.$getTagOpen	= function() {
		var sFontFamily	= this.$getStyleComputed("font-family") || "Times New Roman",
			sFontWeight	= this.$getStyleComputed("font-weight"),
			sFontSize	= this.$getStyleComputed("font-size"),
			sFontStyle	= this.$getStyleComputed("font-style"),
			sTextAnchor	= this.$getStyleComputed("text-anchor"),
						aFontSize	= sFontSize.match(/(^[\d.]*)(.*)$/),
			sFontSizeUnit	= aFontSize[2] || "px",
			nFontSizeValue	= aFontSize[1] || 16,
			nFontSize	= Math.round(nFontSizeValue * cSVGElement.getScaleFactor(this)),
			nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

		return '<svg2vml:shape class="svg-textPath' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;width:100%;height:100%;margin-top:' + nMarginTop + 'px;left:0px;top:0px;"\
					path="m 0,0 l 1000,0 x" allowoverlap="true"\
				>' + cSVGElement.getTagStyle(this) + '\
					<svg2vml:path textpathok="true" />\
					<svg2vml:textpath on="true"\
						style="v-text-align:' + cSVGElement.textAnchorToVTextAlign(sTextAnchor) + ';font-size:' + nFontSize + sFontSizeUnit + ';' + (sFontFamily ? 'font-family:\'' + sFontFamily + '\';' : '') + (sFontWeight ? 'font-weight:' + sFontWeight + ';' : '') + (sFontStyle ? 'font-style:' + sFontStyle + ';' : '') + '" />\
					<span style="display:none">';
	};

	cSVGElement_textPath.prototype.$getTagClose	= function() {
		return '	</span>\
				</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_textPath);


var cSVGElement_title	= function(){};
cSVGElement_title.prototype	= new cSVGElement("title");

if (cSVGElement.useVML) {
	
	cSVGElement_title.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			if (!(this.parentNode instanceof cSVGElement_svg) && this.firstChild)
				this.parentNode.$getContainer().title	= this.firstChild.data;
		}
	};

	cSVGElement_title.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_title.prototype.$getTag	= function() {
		return '';
	};
};

ample.extend(cSVGElement_title);


var cSVGElement_tref	= function(){};
cSVGElement_tref.prototype	= new cSVGElement("tref");

if (cSVGElement.useVML) {

	cSVGElement_tref.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sValue;
						if (sValue = this.getAttribute("xlink:href"))
				this.$mapAttribute("xlink:href", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		}
	};

	cSVGElement_tref.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "x" || sName == "y" || sName == "dx" || sName == "dy") {
			var nLeft	=((this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
				nTop	=((this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0);
			this.$getContainer().path	= 'm ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x';
		}
		else
		if (sName == "xlink:href") {
			if (sValue) {
				var that	= this;
				setTimeout(function() {
					var oRef	= that.ownerDocument.getElementById(sValue.substr(1));
					if (oRef instanceof cSVGElement_text && oRef.firstChild instanceof ample.classes.CharacterData)
						that.$getContainer().getElementsByTagName("textpath")[0].string	= oRef.firstChild.data.replace(/^\s+/, '').replace(/\s+$/, '');
				}, 0);
			}
		}
	};

		cSVGElement_tref.prototype.$getTagOpen	= function() {
		var sFontFamily	= this.$getStyleComputed("font-family") || "Times New Roman",
			sFontWeight	= this.$getStyleComputed("font-weight"),
			sFontSize	= this.$getStyleComputed("font-size"),
			sTextAnchor	= this.$getStyleComputed("text-anchor"),
			nLeft	=((this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
			nTop	=((this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0),
						aFontSize	= sFontSize.match(/(^[\d.]*)(.*)$/),
			sFontSizeUnit	= aFontSize[2] || "px",
			nFontSizeValue	= aFontSize[1] || 16,
			nFontSize	= Math.round(nFontSizeValue * cSVGElement.getScaleFactor(this)),
			nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

		return '<svg2vml:shape class="svg-tspan' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;width:100%;height:100%;margin-top:' + nMarginTop + 'px;left:' + (this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")) + 'px;top:' + (this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")) + 'px;"\
					path="m ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x" allowoverlap="false"\
				>' + cSVGElement.getTagStyle(this) + '\
					<svg2vml:path textpathok="true" />\
					<svg2vml:textpath on="true"\
						style="v-text-align:' + cSVGElement.textAnchorToVTextAlign(sTextAnchor) + ';font-size:' + nFontSize + sFontSizeUnit + ';' + (sFontFamily ? 'font-family:\'' + sFontFamily + '\';' : '') + (sFontWeight ? 'font-weight:' + sFontWeight + ';' : '') + '" />';
	};

	cSVGElement_tref.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_tref);


var cSVGElement_tspan	= function(){};
cSVGElement_tspan.prototype	= new cSVGElement("tspan");

if (cSVGElement.useVML) {

		cSVGElement_tspan.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			if (this.firstChild instanceof ample.classes.CharacterData)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= this.firstChild.data.replace(/^\s+/, '').replace(/\s+$/, '');

			var sValue;

						if ((sValue = this.$getStyleComputed("fill")) && sValue.substr(0, 3) == "url")
				this.$setStyle("fill", sValue);

						cSVGElement.applyTransform(this);

						cSVGElement.applyCSS(this);
		},
		'DOMCharacterDataModified':	function(oEvent) {
			if (oEvent.target.parentNode == this)
				this.$getContainer().getElementsByTagName("textpath")[0].string	= oEvent.target.data.replace(/^\s+/, '').replace(/\s+$/, '');
		}
	};

	cSVGElement_tspan.prototype.$mapAttribute	= function(sName, sValue) {
		if (sName == "x" || sName == "y" || sName == "dx" || sName == "dy") {
			var nLeft	=((this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
				nTop	=((this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0);
			this.$getContainer().path	= 'm ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x';
		}
		else
		if (sName == "transform") {
					}
		else
			cSVGElement.prototype.$mapAttribute.call(this, sName, sValue);
	};

		cSVGElement_tspan.prototype.$getTagOpen	= function() {
		var sFontFamily	= this.$getStyleComputed("font-family") || "Times New Roman",
			sFontWeight	= this.$getStyleComputed("font-weight"),
			sFontSize	= this.$getStyleComputed("font-size"),
			sFontStyle	= this.$getStyleComputed("font-style"),
			sTextAnchor	= this.$getStyleComputed("text-anchor"),
			nLeft	=((this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dx") * 1 || 0),
			nTop	=((this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")).match(/([0-9\.]+)?/)[1] * 1 || 0) + (this.getAttribute("dy") * 1 || 0),
						aFontSize	= sFontSize.match(/(^[\d.]*)(.*)$/),
			sFontSizeUnit	= aFontSize[2] || "px",
			nFontSizeValue	= aFontSize[1] || 16,
			nFontSize	= Math.round(nFontSizeValue * cSVGElement.getScaleFactor(this)),
			nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

		return '<svg2vml:shape class="svg-tspan' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;width:100%;height:100%;margin-top:' + nMarginTop + 'px;left:0px;top:0px;"\
					path="m ' + [nLeft, nTop].map(Math.round) + ' r 1000,0 x" allowoverlap="false"\
				>' + cSVGElement.getTagStyle(this) + '\
					<svg2vml:path textpathok="true" />\
					<svg2vml:textpath on="true" xscale="true"\
						style="v-text-align:' + cSVGElement.textAnchorToVTextAlign(sTextAnchor) + ';font-size:' + nFontSize + sFontSizeUnit + ';' + (sFontFamily ? 'font-family:\'' + sFontFamily + '\';' : '') + (sFontWeight ? 'font-weight:' + sFontWeight + ';' : '') + (sFontStyle ? 'font-style:' + sFontStyle + ';' : '') + '" />\
					<span style="display:none">';
	};

	cSVGElement_tspan.prototype.$getTagClose	= function() {
		return '	</span>\
				</svg2vml:shape>';
	};
};

ample.extend(cSVGElement_tspan);


var cSVGElement_use	= function(){};
cSVGElement_use.prototype	= new cSVGElement("use");

if (cSVGElement.useVML) {
		cSVGElement_use.handlers	= {
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sHref	= this.getAttribute("xlink:href"),
				that	= this;
			if (sHref) {
					var oRef	= that.ownerDocument.getElementById(sHref.substr(1));
					if (oRef) {
												var oNode	= oRef.cloneNode(true);
						oNode.removeAttribute("id");

												for (var sAttribute in this.attributes)
							if (this.attributes.hasOwnProperty(sAttribute) && sAttribute != "id" && sAttribute != "xlink:href")
								oNode.attributes[sAttribute]	= this.attributes[sAttribute];

						that.parentNode.insertBefore(oNode, that);
					}
			}
		}
	};

	cSVGElement_use.prototype.$mapAttribute	= function(sName, sValue) {
			};

		cSVGElement_use.prototype.$getTag	= function() {
		return '';
	};
};

ample.extend(cSVGElement_use);


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

copyElements("http://www.w3.org/2008/SMIL30/", "http://www.w3.org/2000/svg",
	["set", "animate", "animateColor", "animateMotion", "animateTransform", "par", "seq", "excl"]
);


})()
