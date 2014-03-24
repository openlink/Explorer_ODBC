/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */
(function () {


var cXSConstants	= function() {

};

cXSConstants.ATTRIBUTE_DECLARATION	= 1;
cXSConstants.ELEMENT_DECLARATION	= 2;
cXSConstants.TYPE_DEFINITION		= 3;
cXSConstants.ATTRIBUTE_USE			= 4;
cXSConstants.ATTRIBUTE_GROUP		= 5;
cXSConstants.MODEL_GROUP_DEFINITION	= 6;
cXSConstants.MODEL_GROUP			= 7;
cXSConstants.PARTICLE				= 8;
cXSConstants.WILDCARD				= 9;
cXSConstants.IDENTITY_CONSTRAINT	= 10;
cXSConstants.NOTATION_DECLARATION	= 11;
cXSConstants.ANNOTATION				= 12;
cXSConstants.FACET					= 13;
cXSConstants.MULTIVALUE_FACET		= 14;

cXSConstants.DERIVATION_NONE		= 0;
cXSConstants.DERIVATION_EXTENSION	= 1;
cXSConstants.DERIVATION_RESTRICTION	= 2;
cXSConstants.DERIVATION_SUBSTITUTION= 3;
cXSConstants.DERIVATION_UNION		= 4;
cXSConstants.DERIVATION_LIST		= 5;

cXSConstants.SCOPE_ABSENT			= 0;
cXSConstants.SCOPE_GLOBAL			= 1;
cXSConstants.SCOPE_LOCAL			= 2;

cXSConstants.VC_NONE				= 0;
cXSConstants.VC_DEFAULT				= 1;
cXSConstants.VC_FIXED				= 2;

cXSConstants.ANYSIMPLETYPE_DT		= 1;
cXSConstants.STRING_DT				= 2;
cXSConstants.BOOLEAN_DT				= 3;
cXSConstants.DECIMAL_DT				= 4;
cXSConstants.FLOAT_DT				= 5;
cXSConstants.DOUBLE_DT				= 6;
cXSConstants.DURATION_DT			= 7;
cXSConstants.DATETIME_DT			= 8;
cXSConstants.TIME_DT				= 9;
cXSConstants.DATE_DT				= 10;
cXSConstants.GYEARMONTH_DT			= 11;
cXSConstants.GYEAR_DT				= 12;
cXSConstants.GMONTHDAY_DT			= 13;
cXSConstants.GDAY_DT				= 14;
cXSConstants.GMONTH_DT				= 15;
cXSConstants.HEXBINARY_DT			= 16;
cXSConstants.BASE64BINARY_DT		= 17;
cXSConstants.ANYURI_DT				= 18;
cXSConstants.QNAME_DT				= 19;
cXSConstants.NOTATION_DT			= 20;
cXSConstants.NORMALIZEDSTRING_DT	= 21;
cXSConstants.TOKEN_DT				= 22;
cXSConstants.LANGUAGE_DT			= 23;
cXSConstants.NMTOKEN_DT				= 24;
cXSConstants.NAME_DT				= 25;
cXSConstants.NCNAME_DT				= 26;
cXSConstants.ID_DT					= 27;
cXSConstants.IDREF_DT				= 28;
cXSConstants.ENTITY_DT				= 29;
cXSConstants.INTEGER_DT				= 30;
cXSConstants.NONPOSITIVEINTEGER_DT	= 31;
cXSConstants.NEGATIVEINTEGER_DT		= 32;
cXSConstants.LONG_DT				= 33;
cXSConstants.INT_DT					= 34;
cXSConstants.SHORT_DT				= 35;
cXSConstants.BYTE_DT				= 36;
cXSConstants.NONNEGATIVEINTEGER_DT	= 37;
cXSConstants.UNSIGNEDLONG_DT		= 38;
cXSConstants.UNSIGNEDINT_DT			= 39;
cXSConstants.UNSIGNEDSHORT_DT		= 40;
cXSConstants.UNSIGNEDBYTE_DT		= 41;
cXSConstants.POSITIVEINTEGER_DT		= 42;
cXSConstants.LISTOFUNION_DT			= 43;
cXSConstants.LIST_DT				= 44;
cXSConstants.UNAVAILABLE_DT			= 45;

cXSConstants.DATETIMESTAMP_DT		= 46;
cXSConstants.DAYMONTHDURATION_DT	= 47;
cXSConstants.DAYTIMEDURATION_DT		= 48;
cXSConstants.PRECISIONDECIMAL_DT	= 49;
cXSConstants.ANYATOMICTYPE_DT		= 50;
cXSConstants.ANYTYPE_DT				= 51;




var cXSElement	= function(sLocalName) {
	this.localName	= sLocalName;
};

cXSElement.prototype	= new ample.classes.Element;
cXSElement.prototype.namespaceURI	= "http://www.w3.org/2001/XMLSchema";
cXSElement.prototype.localName		= "#element";

ample.extend(cXSElement);


var cXSException	= function() {

};

cXSException.prototype.code	= null;

cXSException.NOT_SUPPORTED_ERR	= 1;
cXSException.INDEX_SIZE_ERR		= 2;


var cXSModel	= function() {
	this.namespaces		= new ample.classes.DOMStringList;
	this.namespaceItems	= new cXSNamespaceItemList;
};

cXSModel.prototype.namespaces		= null;	cXSModel.prototype.namespaceItems	= null;	cXSModel.prototype.annotations		= null;	
cXSModel.prototype.getComponents	= function(nObjectType) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getComponentsByNamespace	= function(nObjectType, sNameSpaceURI) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getElementDeclaration	= function(sNameSpaceURI, sLocalName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getAttributeDeclaration	= function(sNameSpaceURI, sLocalName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getTypeDefinition	= function(sNameSpaceURI, sLocalName) {
		ample.guard(arguments, [
		["namespaceURI",	String],
		["name",			String]
	]);

	for (var nIndex = 0; nIndex < this.namespaceItems.length; nIndex++)
		if (this.namespaceItems[nIndex].schemaNamespace == sNameSpaceURI)
			return this.namespaceItems[nIndex].getTypeDefinition(sLocalName);
	return null;
};

cXSModel.prototype.getAttributeGroup	= function(sNameSpaceURI, sLocalName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getModelGroupDefinition	= function(sNameSpaceURI, sLocalName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSModel.prototype.getNotationDeclaration	= function(sNameSpaceURI, sLocalName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};





var cXSNamedMap	= function() {

};

cXSNamedMap.prototype.length	= 0;

cXSNamedMap.prototype.item	= function(nIndex) {

};

cXSNamedMap.prototype.itemByName	= function(sNameSpaceURI, sLocalName) {

};


var cXSNamespaceItem	= function() {
	this.$elements			= {};
	this.$attributes		= {};
	this.$attributeGroups	= {};
	this.$modelGroups		= {};
	this.$types				= {};
};

cXSNamespaceItem.prototype.schemaNamespace	= null;	cXSNamespaceItem.prototype.annotations		= null;	cXSNamespaceItem.prototype.documentLocations= null; 
cXSNamespaceItem.prototype.$elements		= null;
cXSNamespaceItem.prototype.$attributes		= null;
cXSNamespaceItem.prototype.$attributeGroups	= null;
cXSNamespaceItem.prototype.$modelGroups		= null;
cXSNamespaceItem.prototype.$types			= null;

cXSNamespaceItem.prototype.getComponents	= function(nObjectType) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSNamespaceItem.prototype.getElementDeclaration	= function(sName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSNamespaceItem.prototype.getAttributeDeclaration	= function(sName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSNamespaceItem.prototype.getTypeDefinition	= function(sName) {
		ample.guard(arguments, [
		["name",		String]
	]);

	return this.$types[sName] || null;
};

cXSNamespaceItem.prototype.getAttributeGroup	= function(sName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSNamespaceItem.prototype.getModelGroupDefinition	= function(sName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};

cXSNamespaceItem.prototype.getNotationDeclaration	= function(sName) {
	throw new cDOMException(cDOMException.NOT_SUPPORTED_ERR);
};



var cXSNamespaceItemList	= function() {

};

cXSNamespaceItemList.prototype.length	= 0;

cXSNamespaceItemList.prototype.item	= function(nIndex) {
		ample.guard(arguments, [
		["index",	Number]
	]);

	return nIndex < this.length ? this[nIndex] : null;
};

cXSNamespaceItemList.prototype.$add	= function(oValue) {
	this[this.length++]	= oValue;
};


var cXSObject	= function() {

};

cXSObject.prototype.type	= null;	cXSObject.prototype.name	= null;	cXSObject.prototype.namespace		= null;	cXSObject.prototype.namespaceItem	= null;	

var cXSObjectList	= function() {

};
cXSObjectList.prototype.length	= 0;

cXSObjectList.prototype.item	= function(nIndex) {
		ample.guard(arguments, [
		["node",	Number]
	]);

	return nIndex < this.length ? this[nIndex] : null;
};

cXSObjectList.prototype.$add	= function(oValue) {
	this[this.length++]	= oValue;
};


var cXSTypeDefinition	= function() {

};

cXSTypeDefinition.prototype	= new cXSObject;

cXSTypeDefinition.COMPLEX_TYPE	= 15;
cXSTypeDefinition.SIMPLE_TYPE	= 16;

cXSTypeDefinition.prototype.typeCategory	= null;	cXSTypeDefinition.prototype.baseType		= null;	cXSTypeDefinition.prototype["final"]		= null;	cXSTypeDefinition.prototype.anonymous		= null;	
cXSTypeDefinition.prototype.isFinal	= function(nRestriction) {

};

cXSTypeDefinition.prototype.derivedFromType	= function( oAncestorType,  nDerivationMethod) {

};

cXSTypeDefinition.prototype.derivedFrom	= function( sNameSpaceURI,  sLocalName,  nDerivationName) {

};


var cXSFacet	= function() {

};

cXSFacet.prototype	= new cXSObject;

cXSFacet.prototype.facetKind			= null;	cXSFacet.prototype.lexicalFacetValue	= null; cXSFacet.prototype.fixed				= null; cXSFacet.prototype.annotation			= null; 

var cXSMultiValueFacet	= function() {
	this.lexicalFacetValues	= new ample.classes.DOMStringList;
};

cXSMultiValueFacet.prototype	= new cXSObject;

cXSMultiValueFacet.prototype.facetKind			= null;	cXSMultiValueFacet.prototype.lexicalFacetValues	= null; cXSMultiValueFacet.prototype.annotations		= null; 

var cXSSimpleTypeDefinition	= function() {
	this.memberTypes		= new cXSObjectList;
	this.lexicalEnumeration	= new ample.classes.DOMStringList;
	this.lexicalPattern		= new ample.classes.DOMStringList;
	this.facets				= new cXSObjectList;
	this.multiValueFacets	= new cXSObjectList;
};

cXSSimpleTypeDefinition.prototype	= new cXSTypeDefinition;

cXSSimpleTypeDefinition.VARIETY_ABSENT	= 0;
cXSSimpleTypeDefinition.VARIETY_ATOMIC	= 1;
cXSSimpleTypeDefinition.VARIETY_LIST	= 2;
cXSSimpleTypeDefinition.VARIETY_UNION	= 3;

cXSSimpleTypeDefinition.FACET_NONE		= 0;
cXSSimpleTypeDefinition.FACET_LENGTH	= 1;
cXSSimpleTypeDefinition.FACET_MINLENGTH	= 2;
cXSSimpleTypeDefinition.FACET_MAXLENGTH	= 4;
cXSSimpleTypeDefinition.FACET_PATTERN	= 8;
cXSSimpleTypeDefinition.FACET_WHITESPACE	= 16;
cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE	= 32;
cXSSimpleTypeDefinition.FACET_MAXEXCLUSIVE	= 64;
cXSSimpleTypeDefinition.FACET_MINEXCLUSIVE	= 128;
cXSSimpleTypeDefinition.FACET_MININCLUSIVE	= 256;
cXSSimpleTypeDefinition.FACET_TOTALDIGITS	= 512;
cXSSimpleTypeDefinition.FACET_FRACTIONDIGITS= 1024;
cXSSimpleTypeDefinition.FACET_ENUMERATION	= 2048;
cXSSimpleTypeDefinition.FACET_ASSERTION		= 4096;
cXSSimpleTypeDefinition.FACET_MINSCALE		= 8192;
cXSSimpleTypeDefinition.FACET_MAXSCALE		= 16384;



cXSSimpleTypeDefinition.ORDERED_FALSE	= 0;
cXSSimpleTypeDefinition.ORDERED_PARTIAL	= 1;
cXSSimpleTypeDefinition.ORDERED_TOTAL	= 2;

cXSSimpleTypeDefinition.CARDINALITY_FINITE				= 0;
cXSSimpleTypeDefinition.CARDINALITY_COUNTABLY_INFINITE	= 1;

cXSSimpleTypeDefinition.prototype.variety			= null;	cXSSimpleTypeDefinition.prototype.primitiveType		= null;	cXSSimpleTypeDefinition.prototype.builtInKind		= null;	cXSSimpleTypeDefinition.prototype.itemType			= null;	cXSSimpleTypeDefinition.prototype.memberTypes		= null;	cXSSimpleTypeDefinition.prototype.definedFacets		= null;	cXSSimpleTypeDefinition.prototype.fixedFacets		= null;	cXSSimpleTypeDefinition.prototype.lexicalEnumeration= null;	cXSSimpleTypeDefinition.prototype.lexicalPattern	= null;	cXSSimpleTypeDefinition.prototype.ordered			= null;	cXSSimpleTypeDefinition.prototype.finite			= null;	cXSSimpleTypeDefinition.prototype.bounded			= null;	cXSSimpleTypeDefinition.prototype.numeric			= null;	cXSSimpleTypeDefinition.prototype.facets			= null;	cXSSimpleTypeDefinition.prototype.multiValueFacets	= null;	cXSSimpleTypeDefinition.prototype.annotations		= null;	cXSSimpleTypeDefinition.prototype.cardinality		= null;	


cXSSimpleTypeDefinition.prototype.isDefinedFacet	= function(nFacetName) {

};


cXSSimpleTypeDefinition.prototype.isFixedFacet	= function(nFacetName) {

};


cXSSimpleTypeDefinition.prototype.getLexicalFacetValue	= function(nFacetName) {

};

cXSSimpleTypeDefinition.prototype.$validate	= function(vValue) {
		ample.guard(arguments, [
		["value",		String]
	]);

	return fXSSimpleTypeDefinition_validate(this, vValue);
};


var oXSPrimitives	= {};
oXSPrimitives[cXSConstants.BOOLEAN_DT]		= /^(true|false|1|0)$/;
oXSPrimitives[cXSConstants.DECIMAL_DT]		= /^[+\-]?((\d+(\.\d*)?)|(\.\d+))$/;
oXSPrimitives[cXSConstants.DOUBLE_DT]		=
oXSPrimitives[cXSConstants.FLOAT_DT]		= /^([+\-]?((\d+(\.\d*)?)|(\.\d+))([eE][+\-]?\d+)?|-?INF|NaN)$/;
oXSPrimitives[cXSConstants.DURATION_DT]		= /^(-)?P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:((?:(?:[0-9]+(?:.[0-9]*)?)|(?:.[0-9]+)))S)?)?$/;
oXSPrimitives[cXSConstants.DATETIME_DT]		= /^-?([1-9]\d\d\d+|0\d\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T(([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?|24:00:00(\.0+)?)(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.DATE_DT]			= /^-?([1-9]\d\d\d+|0\d\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.TIME_DT]			= /^(([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?|24:00:00(\.0+)?)(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.GYEARMONTH_DT]	= /^-?([1-9]\d\d\d+|0\d\d\d)-(0[1-9]|1[0-2])(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.GYEAR_DT]		= /^-?([1-9]\d\d\d+|0\d\d\d)(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.GMONTHDAY_DT]	= /^--(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.GDAY_DT]			= /^---(0[1-9]|[12]\d|3[01])(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.GMONTH_DT]		= /^--(0[1-9]|1[0-2])(Z|[+\-](0\d|1[0-4]):[0-5]\d)?$/;
oXSPrimitives[cXSConstants.HEXBINARY_DT]	= /^([0-9a-fA-F]{2})*$/;
oXSPrimitives[cXSConstants.BASE64BINARY_DT]	= /^((([A-Za-z0-9+\/]\s*){4})*(([A-Za-z0-9+\/]\s*){3}[A-Za-z0-9+\/]|([A-Za-z0-9+\/]\s*){2}[AEIMQUYcgkosw048]\s*=|[A-Za-z0-9+\/]\s*[AQgw]\s*=\s*=))?$/;

function fXSSimpleTypeDefinition_schemaRegExpToJSRegExp(sValue) {
	var d1	= '\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF',
		d2	= '\u0370-\u037D\u037F-\u1FFF\u200C-\u200D',
		d3	= '\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD',
		c	= 'A-Z_a-z\\-.0-9\u00B7' + d1 + '\u0300-\u036F' + d2 + '\u203F-\u2040' + d3,
		i	= 'A-Z_a-z' + d1 + d2 + d3;
	return sValue
				.replace(/\[\\i-\[:\]\]/g, '[' + i + ']')
				.replace(/\[\\c-\[:\]\]/g, '[' + c + ']')
				.replace(/\\i/g, '[:' + i + ']')
				.replace(/\\I/g, '[^:' + i + ']')
				.replace(/\\c/g, '[:' + c + ']')
				.replace(/\\C/g, '[^:' + c + ']');
};

function fXSSimpleTypeDefinition_validate(oType, sValue) {
	switch (oType.variety) {
		case cXSSimpleTypeDefinition.VARIETY_ATOMIC:
						if (oType.builtInKind in oXSPrimitives && !oXSPrimitives[oType.builtInKind].test(sValue))
				return false;

						switch (oType.builtInKind) {
				case cXSConstants.DATETIME_DT:
				case cXSConstants.DATE_DT:
				case cXSConstants.GMONTHDAY_DT:
					var aValue	= sValue.match(/^(-|-?\d{4,})-(\d\d)-(\d\d)/),
						nYear	= aValue[1] != '-' ? Number(aValue[1]) : 0,
						nMonth	= Number(aValue[2]),
						nDay	= Number(aValue[3]);
					if (!(nDay == 29 && nMonth == 2 && (nYear % 400 == 0 || nYear % 100 != 0 && nYear % 4 == 0)))
						if (nDay > [31,28,31,30,31,30,31,31,30,31,30,31][nMonth - 1])
							return false;

				case cXSConstants.DURATION_DT:
					if (sValue.charAt(sValue.length - 1) == 'T')
						return false;
					if (sValue.length <= 2)
						return false;

				case cXSConstants.QNAME_DT:
								}

						for (var nFacet = 0, oFacet; oFacet = oType.facets[nFacet]; nFacet++) {
				switch (oFacet.facetKind) {

					case cXSSimpleTypeDefinition.FACET_LENGTH:
						var nLength	= fXSSimpleTypeDefinition_getLength(oType, sValue);
						if (nLength === false || nLength != Number(oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MINLENGTH:
						var nLength	= fXSSimpleTypeDefinition_getLength(oType, sValue);
						if (nLength === false || nLength < Number(oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MAXLENGTH:
						var nLength	= fXSSimpleTypeDefinition_getLength(oType, sValue);
						if (nLength === false || nLength > Number(oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_WHITESPACE:
												break;

					case cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE:
						if (fXSSimpleTypeDefinition_getValue(oType, sValue) > fXSSimpleTypeDefinition_getValue(oType, oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MAXEXCLUSIVE:
						if (fXSSimpleTypeDefinition_getValue(oType, sValue) >= fXSSimpleTypeDefinition_getValue(oType, oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MINEXCLUSIVE:
						if (fXSSimpleTypeDefinition_getValue(oType, sValue) <= fXSSimpleTypeDefinition_getValue(oType, oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MININCLUSIVE:
						if (fXSSimpleTypeDefinition_getValue(oType, sValue) < fXSSimpleTypeDefinition_getValue(oType, oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_TOTALDIGITS:
						if (Number(sValue).toString().replace(/[^\d]/g, '').length > Number(oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_FRACTIONDIGITS:
						if (Number(sValue).toString().match(/\.(\d+)/) && RegExp.$1.length > Number(oFacet.lexicalFacetValue))
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_MINSCALE:
												break;

					case cXSSimpleTypeDefinition.FACET_MAXSCALE:
												break;
				}
			}

						for (var nFacet = 0, oFacet; oFacet = oType.multiValueFacets[nFacet]; nFacet++) {
				switch (oFacet.facetKind) {
					case cXSSimpleTypeDefinition.FACET_PATTERN:
						for (var nIndex = 0; nIndex < oFacet.lexicalFacetValues.length; nIndex++)
							if (!(new RegExp('^' + fXSSimpleTypeDefinition_schemaRegExpToJSRegExp(oFacet.lexicalFacetValues[nIndex]) + '$')).test(sValue))
								return false;
						break;

					case cXSSimpleTypeDefinition.FACET_ENUMERATION:
						for (var nIndex = 0, bFound = false; nIndex < oFacet.lexicalFacetValues.length && !bFound; nIndex++)
							if (oFacet.lexicalFacetValues[nIndex] == sValue)
								bFound	= true;
						if (!bFound)
							return false;
						break;

					case cXSSimpleTypeDefinition.FACET_ASSERTION:
												break;
				}
			}

						if (oType.baseType)
				return fXSSimpleTypeDefinition_validate(oType.baseType, sValue);
			return true;

		case cXSSimpleTypeDefinition.VARIETY_LIST:
						if (sValue)
				for (var nIndex = 0, aValue = fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue).split(' '); nIndex < aValue.length; nIndex++)
					if (oType.itemType && !fXSSimpleTypeDefinition_validate(oType.itemType, aValue[nIndex]))
						return false;
			return true;

		case cXSSimpleTypeDefinition.VARIETY_UNION:
						for (var nIndex = 0; nIndex < oType.memberTypes.length; nIndex++)
				if (fXSSimpleTypeDefinition_validate(oType.memberTypes[nIndex], sValue))
					return true;
			return false;

		default:
			return true;
	}
};

function fXSSimpleTypeDefinition_getValue(oType, sValue) {
	if (oType.variety == cXSSimpleTypeDefinition.VARIETY_ATOMIC) {
		switch (fXSSimpleTypeDefinition_getPrimitiveType(oType).builtInKind) {
			case cXSConstants.BOOLEAN_DT:
				return sValue == "true" || sValue == '1';

			case cXSConstants.FLOAT_DT:
			case cXSConstants.DOUBLE_DT:
				return sValue == "INF" ? Infinity : sValue == '-' + "INF" ? -Infinity : sValue == "NaN" ? nNaN : parseFloat(sValue);

			case cXSConstants.DECIMAL_DT:
				return Number(sValue);

			case cXSConstants.DURATION_DT:
				var aDate	= oXSPrimitives[cXSConstants.DURATION_DT].exec(sValue),
					nMonths		= parseInt(aDate[2], 10) * 12 + parseInt(aDate[3], 10),
					nSeconds	= ((parseInt(aDate[4], 10) * 24 + parseInt(aDate[5], 10)) * 60 + parseInt(aDate[6], 10)) * 60 + parseFloat(aDate[7]);
				return String(aDate[1] == '-' ? [-nMonths, -nSeconds] : [nMonths, nSeconds]);

						
			case cXSConstants.HEXBINARY_DT:
				return sValue.toUpperCase();

			case cXSConstants.BASE64BINARY_DT:
				return sValue.replace(/[^a-zA-Z0-9+\/]/g, '');

			case cXSConstants.QNAME_DT:
						}
	}
	return sValue;
};

function fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue) {
	var sWhiteSpace	= null;
	if (oType.variety == cXSSimpleTypeDefinition.VARIETY_ATOMIC) {
				for (var oBaseType = oType, bFound = false; oBaseType && sWhiteSpace == null; oBaseType = oBaseType.baseType)
			for (var nIndex = 0, oFacet; oFacet = oBaseType.facets[nIndex] && sWhiteSpace == null; nIndex++)
				if (oFacet.facetKind == cXSSimpleTypeDefinition.FACET_WHITESPACE)
					sWhiteSpace	= oFacet.lexicalFacetValue;
	} else
		sWhiteSpace	= "collapse";

		switch (sWhiteSpace) {
		case "replace":
			return sValue.replace(/[\t\n\r]/g, ' ');
		case "collapse":
			return sValue.replace(/[\t\n\r ]+/g, ' ').replace(/^[\t\n\r ]|[\t\n\r ]$/g, '');
		case "preserve":
			return sValue;
		default:
			return sValue;
	}
};

function fXSSimpleTypeDefinition_getLength(oType, sValue) {
	switch (oType.variety) {
		case cXSSimpleTypeDefinition.VARIETY_ATOMIC:
			switch (fXSSimpleTypeDefinition_getPrimitiveType(oType).builtInKind) {
				case cXSConstants.STRING_DT:
				case cXSConstants.ANYURI_DT:
					return fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue).length;

				case cXSConstants.HEXBINARY_DT:
					return fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue).length / 2;

				case cXSConstants.BASE64BINARY_DT:
					return Math.floor(fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue).replace(/[^a-zA-Z0-9+\/]/g,'').length * 3 / 4);

				case cXSConstants.QNAME_DT:
				case cXSConstants.NOTATION_DT:
					return true;

				default:
					return false;
			}
			break;

		case cXSSimpleTypeDefinition.VARIETY_LIST:
			var sLexicalValue	= fXSSimpleTypeDefinition_getWhiteSpace(oType, sValue);
			return sLexicalValue == '' ? 0 : sLexicalValue.split(' ').length;
	}
	return false;
};

function fXSSimpleTypeDefinition_getPrimitiveType(oType) {
	for (; oType; oType = oType.baseType)
		if (oXSBuiltin_primitiveDataTypes[oType.builtInKind])
			return oType;
};


var oXSModel	= new cXSModel;

ample.extend(ample, {
	schema:	oXSModel
});


var oXSBuiltin_namespaceItem	= new cXSNamespaceItem,
	oXSBuiltin_types	= oXSBuiltin_namespaceItem.$types,
	oXSBuiltin_primitiveDataTypes	= {};
oXSBuiltin_namespaceItem.schemaNamespace	= "http://www.w3.org/2001/XMLSchema";
oXSModel.namespaces.$add(oXSBuiltin_namespaceItem.schemaNamespace);
oXSModel.namespaceItems.$add(oXSBuiltin_namespaceItem);


function fXSBuiltin_createSimpleType(nType, nBaseType, aFacets, aMultiValueFacets) {
	var oType	= new cXSSimpleTypeDefinition;
		oType.typeCategory	= cXSTypeDefinition.SIMPLE_TYPE;
	oType.baseType		= oXSBuiltin_types[nBaseType];
	oType.anonymous		= false;
		if (nType == cXSConstants.ANYTYPE_DT || nType == cXSConstants.ANYSIMPLETYPE_DT)
		oType.variety	= cXSSimpleTypeDefinition.VARIETY_ABSENT;
	else
		oType.variety	= cXSSimpleTypeDefinition.VARIETY_ATOMIC;
	oType.builtInKind	= nType;

	if (aFacets)
		for (var nIndex = 0; nIndex < aFacets.length; nIndex++)
			oType.facets.$add(aFacets[nIndex]);
	if (aMultiValueFacets)
		for (var nIndex = 0; nIndex < aMultiValueFacets.length; nIndex++)
			oType.multiValueFacets.$add(aMultiValueFacets[nIndex]);

	return oType;
};

function fXSBuiltin_createListType(nType, nItemType, aFacets, aMultiValueFacets) {
	var oType	= new cXSSimpleTypeDefinition;
		oType.typeCategory	= cXSTypeDefinition.SIMPLE_TYPE;
	oType.baseType		= oXSBuiltin_types[cXSConstants.ANYSIMPLETYPE_DT];
	oType.anonymous		= false;
		oType.variety		= cXSSimpleTypeDefinition.VARIETY_LIST;
	oType.itemType		= oXSBuiltin_types[nItemType];
	oType.builtInKind	= nType;

	if (aFacets)
		for (var nIndex = 0; nIndex < aFacets.length; nIndex++)
			oType.facets.$add(aFacets[nIndex]);
	if (aMultiValueFacets)
		for (var nIndex = 0; nIndex < aMultiValueFacets.length; nIndex++)
			oType.multiValueFacets.$add(aMultiValueFacets[nIndex]);

	return oType;
};

function fXSBuiltin_createFacet(nFacet, sValue, bFixed) {
	var oFacet	= new cXSFacet;
	oFacet.lexicalFacetValue	= sValue;
	oFacet.fixed		= !!bFixed;
	oFacet.facetKind	= nFacet;

	return oFacet;
};

function fXSBuiltin_createMultiValueFacet(nFacet, aValues, bFixed) {
	var oFacet	= new cXSMultiValueFacet;
	oFacet.fixed		= !!bFixed;
	oFacet.facetKind	= nFacet;
	for (var nIndex = 0; nIndex < aValues.length; nIndex++)
		oFacet.lexicalFacetValues.$add(aValues[nIndex]);

	return oFacet;
};

oXSBuiltin_types["anyType"]	= fXSBuiltin_createSimpleType(cXSConstants.ANYTYPE_DT, 0);
	oXSBuiltin_types["anySimpleType"]	= fXSBuiltin_createSimpleType(cXSConstants.ANYSIMPLETYPE_DT, cXSConstants.ANYTYPE_DT);
		oXSBuiltin_types["anyAtomicType"]	= fXSBuiltin_createSimpleType(cXSConstants.ANYATOMICTYPE_DT, cXSConstants.ANYSIMPLETYPE_DT);
						oXSBuiltin_primitiveDataTypes[cXSConstants.ANYURI_DT]	=
			oXSBuiltin_types["anyURI"]			= fXSBuiltin_createSimpleType(cXSConstants.ANYURI_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.BASE64BINARY_DT]	=
			oXSBuiltin_types["base64Binary"]	= fXSBuiltin_createSimpleType(cXSConstants.BASE64BINARY_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.BOOLEAN_DT]	=
			oXSBuiltin_types["boolean"]			= fXSBuiltin_createSimpleType(cXSConstants.BOOLEAN_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.DATE_DT]	=
			oXSBuiltin_types["date"]			= fXSBuiltin_createSimpleType(cXSConstants.DATE_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.DATETIME_DT]	=
			oXSBuiltin_types["dateTime"]		= fXSBuiltin_createSimpleType(cXSConstants.DATETIME_DT, cXSConstants.ANYATOMICTYPE_DT);
								oXSBuiltin_types["dateTimeStamp"]	= fXSBuiltin_createSimpleType(cXSConstants.DATETIMESTAMP_DT, cXSConstants.DATETIME_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.DECIMAL_DT]	=
			oXSBuiltin_types["decimal"]			= fXSBuiltin_createSimpleType(cXSConstants.DECIMAL_DT, cXSConstants.ANYATOMICTYPE_DT);
								oXSBuiltin_types["integer"]			= fXSBuiltin_createSimpleType(cXSConstants.INTEGER_DT, cXSConstants.DECIMAL_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_FRACTIONDIGITS, '0', true)], [fXSBuiltin_createMultiValueFacet(cXSSimpleTypeDefinition.FACET_PATTERN, ['[\\-+]?[0-9]+'])]);
					oXSBuiltin_types["long"]				= fXSBuiltin_createSimpleType(cXSConstants.LONG_DT, cXSConstants.INTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '-9223372036854775808'), fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '9223372036854775807')]);
						oXSBuiltin_types["int"]					= fXSBuiltin_createSimpleType(cXSConstants.INT_DT, cXSConstants.LONG_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '-2147483648'), fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '2147483647')]);
							oXSBuiltin_types["short"]				= fXSBuiltin_createSimpleType(cXSConstants.SHORT_DT, cXSConstants.INT_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '-32768'), fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '32767')]);
								oXSBuiltin_types["byte"]				= fXSBuiltin_createSimpleType(cXSConstants.BYTE_DT, cXSConstants.SHORT_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '-128'), fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '127')]);
					oXSBuiltin_types["nonNegativeInteger"]	= fXSBuiltin_createSimpleType(cXSConstants.NONNEGATIVEINTEGER_DT, cXSConstants.INTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '0')]);
						oXSBuiltin_types["positiveInteger"]		= fXSBuiltin_createSimpleType(cXSConstants.POSITIVEINTEGER_DT, cXSConstants.NONNEGATIVEINTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MININCLUSIVE, '1')]);
						oXSBuiltin_types["unsignedLong"]		= fXSBuiltin_createSimpleType(cXSConstants.UNSIGNEDLONG_DT, cXSConstants.NONNEGATIVEINTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '18446744073709551615')]);
							oXSBuiltin_types["unsignedInt"]			= fXSBuiltin_createSimpleType(cXSConstants.UNSIGNEDINT_DT, cXSConstants.UNSIGNEDLONG_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '4294967295')]);
								oXSBuiltin_types["unsignedShort"]		= fXSBuiltin_createSimpleType(cXSConstants.UNSIGNEDSHORT_DT, cXSConstants.UNSIGNEDINT_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '65535')]);
									oXSBuiltin_types["unsignedByte"]		= fXSBuiltin_createSimpleType(cXSConstants.UNSIGNEDBYTE_DT, cXSConstants.UNSIGNEDSHORT_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '255')]);
					oXSBuiltin_types["nonPositiveInteger"]	= fXSBuiltin_createSimpleType(cXSConstants.NONPOSITIVEINTEGER_DT, cXSConstants.INTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '0')]);
						oXSBuiltin_types["negativeInteger"]		= fXSBuiltin_createSimpleType(cXSConstants.NEGATIVEINTEGER_DT, cXSConstants.NONPOSITIVEINTEGER_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_MAXINCLUSIVE, '-1')]);
			oXSBuiltin_primitiveDataTypes[cXSConstants.DOUBLE_DT]	=
			oXSBuiltin_types["double"]			= fXSBuiltin_createSimpleType(cXSConstants.DOUBLE_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.DURATION_DT]	=
			oXSBuiltin_types["duration"]		= fXSBuiltin_createSimpleType(cXSConstants.DURATION_DT, cXSConstants.ANYATOMICTYPE_DT);
				oXSBuiltin_types["dayTimeDuration"]	= fXSBuiltin_createSimpleType(cXSConstants.DAYTIMEDURATION_DT, cXSConstants.DURATION_DT);
				oXSBuiltin_types["dayMonthDuration"]= fXSBuiltin_createSimpleType(cXSConstants.DAYMONTHDURATION_DT, cXSConstants.DURATION_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.FLOAT_DT]	=
			oXSBuiltin_types["float"]			= fXSBuiltin_createSimpleType(cXSConstants.FLOAT_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.GDAY_DT]	=
			oXSBuiltin_types["gDay"]			= fXSBuiltin_createSimpleType(cXSConstants.GDAY_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.GMONTH_DT]	=
			oXSBuiltin_types["gMonth"]			= fXSBuiltin_createSimpleType(cXSConstants.GMONTH_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.GMONTHDAY_DT]	=
			oXSBuiltin_types["gMonthDay"]		= fXSBuiltin_createSimpleType(cXSConstants.GMONTHDAY_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.GYEAR_DT]	=
			oXSBuiltin_types["gYear"]			= fXSBuiltin_createSimpleType(cXSConstants.GYEAR_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.GYEARMONTH_DT]	=
			oXSBuiltin_types["gYearMonth"]		= fXSBuiltin_createSimpleType(cXSConstants.GYEARMONTH_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.HEXBINARY_DT]	=
			oXSBuiltin_types["hexBinary"]		= fXSBuiltin_createSimpleType(cXSConstants.HEXBINARY_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.NOTATION_DT]	=
			oXSBuiltin_types["NOTATION"]		= fXSBuiltin_createSimpleType(cXSConstants.NOTATION_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.PRECISIONDECIMAL_DT]	=
			oXSBuiltin_types["precisionDecimal"]= fXSBuiltin_createSimpleType(cXSConstants.PRECISIONDECIMAL_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.QNAME_DT]	=
			oXSBuiltin_types["QName"]			= fXSBuiltin_createSimpleType(cXSConstants.QNAME_DT, cXSConstants.ANYATOMICTYPE_DT);
			oXSBuiltin_primitiveDataTypes[cXSConstants.STRING_DT]	=
			oXSBuiltin_types["string"]			= fXSBuiltin_createSimpleType(cXSConstants.STRING_DT, cXSConstants.ANYATOMICTYPE_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "preserve")]);
								oXSBuiltin_types["normalizedString"]= fXSBuiltin_createSimpleType(cXSConstants.NORMALIZEDSTRING_DT, cXSConstants.STRING_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "replace")]);
					oXSBuiltin_types["token"]			= fXSBuiltin_createSimpleType(cXSConstants.TOKEN_DT, cXSConstants.NORMALIZEDSTRING_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")]);
						oXSBuiltin_types["language"]		= fXSBuiltin_createSimpleType(cXSConstants.LANGUAGE_DT, cXSConstants.TOKEN_DT, [], [fXSBuiltin_createMultiValueFacet(cXSSimpleTypeDefinition.FACET_PATTERN, ['[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*'])]);
						oXSBuiltin_types["Name"]			= fXSBuiltin_createSimpleType(cXSConstants.NAME_DT, cXSConstants.TOKEN_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")], [fXSBuiltin_createMultiValueFacet(cXSSimpleTypeDefinition.FACET_PATTERN, ['\\i\\c*'])]);
							oXSBuiltin_types["NCName"]			= fXSBuiltin_createSimpleType(cXSConstants.NCNAME_DT, cXSConstants.NAME_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")], [fXSBuiltin_createMultiValueFacet(cXSSimpleTypeDefinition.FACET_PATTERN, ['[\\i-[:]][\\c-[:]]*'])]);
								oXSBuiltin_types["ENTITY"]			= fXSBuiltin_createSimpleType(cXSConstants.ENITITY_DT, cXSConstants.NCNAME_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")]);
								oXSBuiltin_types["ID"]				= fXSBuiltin_createSimpleType(cXSConstants.ID_DT, cXSConstants.NCNAME_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")]);
								oXSBuiltin_types["IDREF"]			= fXSBuiltin_createSimpleType(cXSConstants.IDREF_DT, cXSConstants.NCNAME_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")]);
						oXSBuiltin_types["NMTOKEN"]			= fXSBuiltin_createSimpleType(cXSConstants.NMTOKEN_DT, cXSConstants.TOKEN_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse")], [fXSBuiltin_createMultiValueFacet(cXSSimpleTypeDefinition.FACET_PATTERN, ["\\c"])]);
			oXSBuiltin_primitiveDataTypes[cXSConstants.TIME_DT]	=
			oXSBuiltin_types["time"]			= fXSBuiltin_createSimpleType(cXSConstants.TIME_DT, cXSConstants.ANYATOMICTYPE_DT);
				oXSBuiltin_types["ENTITIES"]		= fXSBuiltin_createListType(cXSConstants.LIST_DT, cXSConstants.ENITITY_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse"), fXSBuiltin_createFacet("minLength", '1')]);
		oXSBuiltin_types["IDREFS"]			= fXSBuiltin_createListType(cXSConstants.LIST_DT, cXSConstants.IDREF_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse"), fXSBuiltin_createFacet("minLength", '1')]);
		oXSBuiltin_types["NMTOKENS"]		= fXSBuiltin_createListType(cXSConstants.LIST_DT, cXSConstants.NMTOKEN_DT, [fXSBuiltin_createFacet(cXSSimpleTypeDefinition.FACET_WHITESPACE, "collapse"), fXSBuiltin_createFacet("minLength", '1')]);




var cXSElement_assertion	= function(){};
cXSElement_assertion.prototype	= new cXSElement("assertion");

cXSElement_assertion.handlers	= {};
cXSElement_assertion.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"],
		nFacet	= cXSSimpleTypeDefinition.FACET_ASSERTION;
	if (sValue) {
				for (var nIndex = 0, oFacet; oFacet = oType.multiValueFacets[nIndex]; nIndex++)
			if (oFacet.facetKind == nFacet)
				break;

				if (!oFacet) {
			oFacet	= new cXSMultiValueFacet;
						oFacet.fixed	= this.attributes["fixed"] == "true";
			oFacet.facetKind= nFacet;

						oType.multiValueFacets.$add(oFacet);
		}
		oFacet.lexicalFacetValues.$add(sValue);

				}
};

ample.extend(cXSElement_assertion);


var cXSElement_enumeration	= function(){};
cXSElement_enumeration.prototype	= new cXSElement("enumeration");

cXSElement_enumeration.handlers	= {};
cXSElement_enumeration.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"],
		nFacet	= cXSSimpleTypeDefinition.FACET_ENUMERATION;
	if (sValue) {
				for (var nIndex = 0, oFacet; oFacet = oType.multiValueFacets[nIndex]; nIndex++)
			if (oFacet.facetKind == nFacet)
				break;

				if (!oFacet) {
			oFacet	= new cXSMultiValueFacet;
						oFacet.fixed	= this.attributes["fixed"] == "true";
			oFacet.facetKind= nFacet;

						oType.multiValueFacets.$add(oFacet);
		}
		oFacet.lexicalFacetValues.$add(sValue);

				}
};

ample.extend(cXSElement_enumeration);


var cXSElement_fractionDigits	= function(){};
cXSElement_fractionDigits.prototype	= new cXSElement("fractionDigits");

cXSElement_fractionDigits.handlers	= {};
cXSElement_fractionDigits.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_FRACTIONDIGITS;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_fractionDigits);


var cXSElement_length	= function(){};
cXSElement_length.prototype	= new cXSElement("length");

cXSElement_length.handlers	= {};
cXSElement_length.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_LENGTH;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_length);


var cXSElement_maxExclusive	= function(){};
cXSElement_maxExclusive.prototype	= new cXSElement("maxExclusive");

cXSElement_maxExclusive.handlers	= {};
cXSElement_maxExclusive.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MAXEXCLUSIVE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_maxExclusive);


var cXSElement_maxInclusive	= function(){};
cXSElement_maxInclusive.prototype	= new cXSElement("maxInclusive");

cXSElement_maxInclusive.handlers	= {};
cXSElement_maxInclusive.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MAXINCLSUIVE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_maxInclusive);


var cXSElement_maxLength	= function(){};
cXSElement_maxLength.prototype	= new cXSElement("maxLength");

cXSElement_maxLength.handlers	= {};
cXSElement_maxLength.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MAXLENGTH;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_maxLength);


var cXSElement_minScale	= function(){};
cXSElement_minScale.prototype	= new cXSElement("minScale");

cXSElement_minScale.handlers	= {};
cXSElement_minScale.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MAXSCALE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_minScale);


var cXSElement_minExclusive	= function(){};
cXSElement_minExclusive.prototype	= new cXSElement("minExclusive");

cXSElement_minExclusive.handlers	= {};
cXSElement_minExclusive.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MINEXCLUSIVE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_minExclusive);


var cXSElement_minInclusive	= function(){};
cXSElement_minInclusive.prototype	= new cXSElement("minInclusive");

cXSElement_minInclusive.handlers	= {};
cXSElement_minInclusive.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MININCLUSIVE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_minInclusive);


var cXSElement_minScale	= function(){};
cXSElement_minScale.prototype	= new cXSElement("minScale");

cXSElement_minScale.handlers	= {};
cXSElement_minScale.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MINLENGTH;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_minScale);


var cXSElement_minScale	= function(){};
cXSElement_minScale.prototype	= new cXSElement("minScale");

cXSElement_minScale.handlers	= {};
cXSElement_minScale.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_MINSCALE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_minScale);


var cXSElement_pattern	= function(){};
cXSElement_pattern.prototype	= new cXSElement("pattern");

cXSElement_pattern.handlers	= {};
cXSElement_pattern.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"],
		nFacet	= cXSSimpleTypeDefinition.FACET_PATTERN;
	if (sValue) {
				for (var nIndex = 0, oFacet; oFacet = oType.multiValueFacets[nIndex]; nIndex++)
			if (oFacet.facetKind == nFacet)
				break;

				if (!oFacet) {
			oFacet	= new cXSMultiValueFacet;
						oFacet.fixed	= this.attributes["fixed"] == "true";
			oFacet.facetKind= nFacet;

						oType.multiValueFacets.$add(oFacet);
		}
		oFacet.lexicalFacetValues.$add(sValue);

				}
};

ample.extend(cXSElement_pattern);


var cXSElement_totalDigits	= function(){};
cXSElement_totalDigits.prototype	= new cXSElement("totalDigits");

cXSElement_totalDigits.handlers	= {};
cXSElement_totalDigits.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_TOTALDIGITS;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_totalDigits);


var cXSElement_whiteSpace	= function(){};
cXSElement_whiteSpace.prototype	= new cXSElement("whiteSpace");

cXSElement_whiteSpace.handlers	= {};
cXSElement_whiteSpace.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sValue	= this.attributes["value"];
	if (sValue) {
		var oFacet	= new cXSFacet;
				oFacet.lexicalFacetValue	= sValue;
		oFacet.fixed	= this.attributes["fixed"] == "true";
		oFacet.facetKind= cXSSimpleTypeDefinition.FACET_WHITESPACE;

				oType.facets.$add(oFacet);
	}
};

ample.extend(cXSElement_whiteSpace);


var cXSElement_list	= function(){};
cXSElement_list.prototype	= new cXSElement("list");

cXSElement_list.handlers	= {};
cXSElement_list.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sItemType	= this.attributes["itemType"];
	if (sItemType) {
		var aQName	= sItemType.split(':'),
			sLocalName		= aQName[1],
			sNameSpaceURI	= this.lookupNamespaceURI(aQName[0]),
			oItemType		= oXSModel.getTypeDefinition(sNameSpaceURI, sLocalName);
		if (oItemType)
			oType.itemType	= oItemType;
	}
		oType.variety	= cXSSimpleTypeDefinition.VARIETY_LIST;
};

ample.extend(cXSElement_list);


var cXSElement_restriction	= function(){};
cXSElement_restriction.prototype	= new cXSElement("restriction");

cXSElement_restriction.handlers	= {};
cXSElement_restriction.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oType	= this.parentNode.$type;
		var sBase	= this.attributes["base"];
	if (sBase) {
		var aQName	= sBase.split(':'),
			sLocalName		= aQName[1],
			sNameSpaceURI	= this.lookupNamespaceURI(aQName[0]),
			oBaseType		= oXSModel.getTypeDefinition(sNameSpaceURI, sLocalName);

		if (oBaseType)
			oType.baseType		= oBaseType;

		oType.variety		= cXSSimpleTypeDefinition.VARIETY_ATOMIC;

				this.$type	= oType;
	}
};

ample.extend(cXSElement_restriction);


var cXSElement_simpleType	= function(){};
cXSElement_simpleType.prototype	= new cXSElement("simpleType");

cXSElement_simpleType.handlers	= {};
cXSElement_simpleType.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	if (this.parentNode instanceof cXSElement_schema) {
		var oNamespaceItem	= this.parentNode.$namespaceItem;
				var sName	= this.attributes["name"];
		if (sName) {
			var oType	= new cXSSimpleTypeDefinition;
							oType.name		= sName;
			oType.namespace	= oNamespaceItem.schemaNamespace;
			oType.namespaceItem	= oNamespaceItem;
						oType.typeCategory	= cXSTypeDefinition.SIMPLE_TYPE;
			oType.anonymous		= false;
						oType.variety		= cXSSimpleTypeDefinition.VARIETY_ABSENT;

						oNamespaceItem.$types[sName]	= oType;

						this.$type	= oType;
		}
	}
	else
	if (this.parentNode instanceof cXSElement_list) {
		var oType	= this.parentNode.$type;

		var oItemType	= new cXSSimpleTypeDefinition;
						oItemType.typeCategory	= cXSTypeDefinition.SIMPLE_TYPE;
		oItemType.anonymous		= true;
				oItemType.variety		= cXSSimpleTypeDefinition.VARIETY_ATOMIC;

				oType.itemType	= oItemType;

				this.$type	= oItemType;
	}
	else
	if (this.parentNode instanceof cXSElement_union) {
		var oType	= this.parentNode.$type;

		var oMemberType	= new cXSSimpleTypeDefinition;
				oMemberType.typeCategory	= cXSTypeDefinition.SIMPLE_TYPE;
		oMemberType.anonymous		= true;
				oMemberType.variety		= cXSSimpleTypeDefinition.VARIETY_ATOMIC;

				oType.memberTypes.$add(oMemberType);

				this.$type	= oMemberType;
	}
};

ample.extend(cXSElement_simpleType);


var cXSElement_union	= function(){};
cXSElement_union.prototype	= new cXSElement("union");

cXSElement_union.handlers	= {};
cXSElement_union.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var oSimpleType	= this.parentNode.$simpleType;
		var sMemberTypes	= oElementDOM.getAttribute("memberTypes");
	if (sMemberTypes) {
		for (var nIndex = 0, aMemberTypes = sMemberTypes.split(' '); nIndex < aMemberTypes.length; nIndex++) {
			var aQName	= aMemberTypes[nIndex].split(':'),
				sLocalName		= aQName[1],
				sNameSpaceURI	= this.lookupNamespaceURI(aQName[0]),
				oMemberType		= oXSModel.getTypeDefinition(sNameSpaceURI, sLocalName);
			if (oMemberType)
				oSimpleType.memberTypes.$add(oMemberType);
		}
	}
	oSimpleType.variety	= cXSSimpleTypeDefinition.VARIETY_UNION;
};

ample.extend(cXSElement_union);





var cXSElement_schema	= function(){};
cXSElement_schema.prototype	= new cXSElement("schema");

cXSElement_schema.handlers	= {};
cXSElement_schema.handlers.DOMNodeInsertedIntoDocument	= function(oEvent) {
	var sNameSpaceURI	= this.attributes["targetNamespace"];
	if (sNameSpaceURI) {
				var oNamespaceItem	= new cXSNamespaceItem;
		oNamespaceItem.schemaNamespace	= sNameSpaceURI;
				oXSModel.namespaces.$add(sNameSpaceURI);
		oXSModel.namespaceItems.$add(oNamespaceItem);

				this.$namespaceItem	= oNamespaceItem;
	}
};

ample.extend(cXSElement_schema);

})()
