
var OPL_WebODBC = {
    init: function() {
        // The event can be DOMContentLoaded, pageshow, pagehide, load or unload.
        if(gBrowser) gBrowser.addEventListener("DOMContentLoaded", this.onPageLoad, false);
    },

    onPageLoad: function(aEvent) {
        var doc = aEvent.originalTarget; // doc is document that triggered the event
//        var win = doc.defaultView; // win is the window for the doc

	var  plg;
 
	plg = doc.createElement('EMBED');
	plg.type = "application/iodbc";
	plg.width=1;
	plg.height=1;
	doc.body.appendChild(plg);

    },

    about:function() {
	  window.openDialog ('chrome://webodbc/content/about.xul', '', 
		             'chrome, dialog, modal, resizable=yes').focus();
    }
}

window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    OPL_WebODBC.init(); 
},false);
