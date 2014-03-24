/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


function fAmple_transform(vXml, vXsl, fCallback, aParameters) {
	var oXSLTProcessor	= new XSLTProcessor,
		fOnXmlReady	= function(oXml) {
			var fOnXslReady	= function(oXsl) {
								oXSLTProcessor.importStylesheet(oXsl);
				var oDocument	= oXSLTProcessor.transformToDocument(oXml);
				if (fCallback)
					fCallback.call(ample, oDocument);
			};
						if (vXsl.nodeType)
				fOnXslReady(vXsl);
			else {
				vXsl	= String(vXsl);
				if (vXsl.substr(0,1) == '<')
					fOnXslReady(new DOMParser().parseFromString(vXsl));
				else
					ample.ajax({url:vXsl,success:fOnXslReady});
			}
		};

		if (aParameters)
		for (var nIndex = 0, nLength = aParameters.length; nIndex < nLength; nIndex++)
			oXSLTProcessor.setParameter(aParameters[nIndex][0], aParameters[nIndex][1], aParameters[nIndex][2]);

		if (vXml.nodeType)
		fOnXmlReady(vXml);
	else {
		vXml	= String(vXml);
		if (vXml.substr(0,1) == '<')
			fOnXmlReady(new DOMParser().parseFromString(vXml));
		else
			ample.ajax({url:vXml,success:fOnXmlReady});
	}

	return oXSLTProcessor;
};

ample.extend({
	xslt:	function(vXml, vXsl, fCallback, aParameters) {
				ample.guard(arguments, [
			["xml",			Object],
			["xsl",			Object],
			["callback",	Function,	true],
			["parameters",	Array,		true,	true]
		]);

				return fAmple_transform(vXml, vXsl, fCallback, aParameters);
	}
});

ample.extend(ample.classes.Query.prototype, {
	xslt:	function(vXml, vXsl, fCallback, aParameters) {
				ample.guard(arguments, [
			["xml",			Object],
			["xsl",			Object],
			["callback",	Function,	true],
			["parameters",	Array,		true,	true]
		]);

				var oQuery	= this;
		fAmple_transform(vXml, vXsl, function(oDocument) {
			var oElement	= ample.importNode(oDocument.documentElement, true);
			oQuery.each(function() {
								while (this.lastChild)
					this.removeChild(this.lastChild);
								this.appendChild(oElement.cloneNode(true));
								if (fCallback)
					fCallback.call(this, oDocument);
			});
		}, aParameters);
				return this;
	}
});

})()
