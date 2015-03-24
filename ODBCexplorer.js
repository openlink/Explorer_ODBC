var DEF_TIMEOUT = 500;
var sXULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
var pixPerCh = 10;
var Connected = false;
var fFAIL = false;
var MESS_OUTDATE = "NOTE: query text has been changed via double click on tree, so query resutls are outdated";

var gFKEY_INIT_COL = 8;

var gFKEY_FTBL_COL = 6;
var gFKEY_FCOL_COL = 7;
var gFKEY_FSEQ_COL = 8;

var gPKEY_INIT_COL = 4;
var gPKEY_SEQ_COL  = 4;


var gQUAD_KEYLIST_START = 6;

var MAX_FETCH = 500;

var c_PKEY = 4;  // onekey primary key
var c_MPKEY = 1; // multi-key primary key
var c_REF_KEY = 8;
var c_FKEY = 2;
var c_VALUE = 0;
// relations  table           8    
// onekey primary key         4
// multi primary key          1
// foreign key                2
// value                      0


var gDB = null;
var q_query_hist = []; // {sql: queryString}
var q_query_has_executed = null; 
var q_fkey_hist = [];
var q_pkey_hist = [];
var q_ref_hist = [];

var gDATA = { execTable:   {fkey_list: null, metaData:null, qdata:null, sql:null},
              fkeyTable: {fkey_list: null, metaData:null, qdata:null, query:null },
              refTable:  {fkey_list: null, metaData:null, qdata:null, query:null },
              idxTable:{fkey_list: null, metaData:null, qdata:null, query:null }
            };

var gPLINK = { v: 1,
               url: null,
               dsn: "virt",
               uid: "dba",
               pwd: "dba",
               path: null,
	       tab: "",
               idx:  null,
               fkey: null,
               ref:  null,
               exec: null
             }

var g_throbber = null;
var query_executing = false;
var g_restoring_state = false;
var g_permalink_view = false;
var g_err_in_ref_sparql = false;



ample.ready(function() {
  if (navigator.userAgent.match(/AppleWebKit/) && !navigator.userAgent.match(/MSIE/)) {
    var emb = document.embeds;
    var found = false;
    for (i=0; i < emb.length; i++) {
      if (emb[i].type == "application/iodbc") {
        found = true;
        break;
      }
    }
    if (!found) {
      var plg = document.createElement('EMBED');
      plg.type = "application/iodbc";
      plg.width=0;
      plg.height=0;
      document.body.appendChild(plg);
    }
  }
  if (navigator.userAgent.match(/Opera/)) {
    var emb = document.embeds;
    var found = false;
    for (i=0; i < emb.length; i++) {
      if (emb[i].type == "application/iodbc-opera") {
        found = true;
        break;
      }
    }
    if (!found) {
      var plg = document.createElement('EMBED');
      plg.type = "application/iodbc-opera";
      plg.width=0;
      plg.height=0;
      document.body.appendChild(plg);
    }
  }

  var params = document.location.search;
  if (params!=null && params.length>2)
    loadPermalink(params);

});



var dsnloaded = false;

function initDSN() {
  if (!dsnloaded) {
    try {
      if (!WorkerUtils)
        fFAIL = true;
    } catch (ex) {
      document.getElementById("uid").focus();
      showBadConf();
      return;
    }

    try {
     var lst = WorkerUtils.getDataSources();
     var box = document.getElementById("dsn");
     box.options.length = 0;

     for(var i=0; i < lst.length; i++) {
       box.options[i] = new Option(lst[i], lst[i]);
       if (lst[i] == "virt")
         box.options.selectedIndex = i;
       else
         box.options.selectedIndex = 0;
     }
     dsnloaded = true;
    } catch (ex) {
      document.getElementById("uid").focus();
      alert(ex);
    }
  }
}


function showBadConf()
{
    ample.query("#badconf")[0].centerWindowOnScreen();
    ample.query("#badconf")[0].showModal();
}





var connH = null;

function Connection() 
{
  if (Connected) {
    window.location = location.protocol+ "//"+location.host+location.pathname;
    return;
  }


  try {
    if (!WorkerUtils)
     fFAIL = true;
  } catch (ex) {
     showBadConf();
     return;
  }

  var bt = document.getElementById("connect");
  bt.value="Connecting...";
  bt.disabled=true;
  startWorking();

  connH = setTimeout(DoConnect, DEF_TIMEOUT);
  return;

}



function DoConnect(path) 
{
  try {

    var dsn = document.getElementById("dsn").value;
    var uid = document.getElementById("uid").value;
    var pwd = document.getElementById("pwd").value;

    gDB = WorkerUtils.openDatabaseSync("DSN="+dsn+";UID="+uid+";PWD="+pwd, "", "", 0);

    gPLINK.url = null;
    gPLINK.dsn = dsn;
    gPLINK.uid = uid;
    gPLINK.pwd = pwd;

    gDB.transaction({
	handleEvent: function(trans)
	{
	  try {

            var rs = trans.getTables("%","%","%","TABLE,VIEW,SYSTEM TABLE,SYSTEM VIEW");
            var md = rs.metaData;
            var rows = rs.rows;
	    var data = new Object();

            for(var i=0; i < rows.length; i++) {
              var tcols = rows.item(i);
              var cat = tcols[md.getColumnName(0)];
              var sch = tcols[md.getColumnName(1)];
              var tbl = tcols[md.getColumnName(2)];

              cat = cat==null ? "":cat;
              sch = sch==null ? "":sch;

              if (typeof(data[cat])==="undefined" || data[cat]===null) {
                data[cat] = new Object();
              }
              if (typeof(data[cat][sch])==="undefined" || data[cat][sch]===null) {
                data[cat][sch] = [];
              }

              data[cat][sch].push(tbl);
            }

            var scat = "";
            var max_len = 0;
            for(var cat in data) {

              var ssch = "";
              for(var schem in data[cat]) {

                var tbls = data[cat][schem];
                var stbl = "";

                for(var j=0; j < tbls.length; j++) {
                  var t_id = escape(cat+"_"+schem+"_"+tbls[j]);
                  stbl += '<xul:treeitem val="tableName" >'+
		            '<xul:treerow>'+
		              '<xul:treecell label="'+tbls[j]+'" val="'+t_id+'"/>'+
		            '</xul:treerow>'+
		          '</xul:treeitem>';
		  max_len = (max_len < tbls[j].length?tbls[j].length:max_len);
		}

		var l_open = "false";
		if (path!=null && path.c===cat && path.s===schem)
		  l_open = "true";
                ssch += 
		  '<xul:treeitem val="schemaName" open="'+l_open+'" container="true" >'+
		    '<xul:treerow>'+
		       '<xul:treecell label="'+schem+'"/>'+
		    '</xul:treerow>'+
		    '<xul:treechildren>'+stbl+'</xul:treechildren>'+
		  '</xul:treeitem>';
		max_len = (max_len < schem.length?schem.length:max_len);
              }

              l_open = "false";
	      if (path!=null && path.c===cat)
		l_open = "true";
              scat += 
		'<xul:treeitem val="dbName" open="'+l_open+'" container="true" >'+
		   '<xul:treerow val="load_'+cat+'">'+
		       '<xul:treecell label="'+cat+'"/>'+
		   '</xul:treerow>'+
		   '<xul:treechildren>'+ssch+'</xul:treechildren>'+
		'</xul:treeitem>';
	      max_len = (max_len < cat.length?cat.length:max_len);

            }

            stopWorking();
            setTimeout(function() {
                var ctree = ample.query("#mydb").empty();
                ctree.append( 
              '<xul:tree flex="1" id="db" xmlns:xul="'+sXULNS+'">'+
                '<xul:treecols>'+
	          '<xul:treecol id="dbcol" label="DbCatalogs" width="'+(max_len*pixPerCh+30)+'" primary="true"/>'+
	        '</xul:treecols>'+
		  '<xul:treebody >'+
		    '<xul:treechildren id="dbList">'+scat+'</xul:treechildren>'+
		  '</xul:treebody>'+
              '</xul:tree>');

                ample.getElementById("dbList").addEventListener("dblclick", dblClickCatch, false);
            }, 800);

	  } catch (e) {
            var bt = document.getElementById("connect");
            bt.value="Connect";
            if (!g_permalink_view)
              bt.disabled=false;
            stopWorking();
            ShowError(e);
            return;
	  }

	}});

    Connected = true;
    var bt = document.getElementById("connect");
    bt.value="Disconnect";
    if (!g_permalink_view)
      bt.disabled=false;
    stopWorking();

  } catch (e) {
     var bt = document.getElementById("connect");
     bt.value="Connect";
     if (!g_permalink_view)
       bt.disabled=false;
     stopWorking();
     ShowError(e);
  }
  connH = null;
}



function prevQuery()
{
  if (q_query_hist.length > 0)
  {
     q_query_has_executed = null;

     var hval = q_query_hist[q_query_hist.length-1]
     q_query_hist = q_query_hist.slice(0, -1);

     if (q_query_hist.length < 1)
       ample.query("#buttonPrev").attr("disabled","true");

     ample.query("#txtSqlStatement").attr("value", hval.sql);
     ample.query("#txtSqlStatement").attr("tooltiptext", MESS_OUTDATE);
     ample.query("#execTable").attr("tooltiptext", MESS_OUTDATE);
     execQuery();
  }

}



var execH = null;

function clickExecQuery()
{
  var sqlQuery = ample.query("#txtSqlStatement").attr("value");
  updatePermalink(null, "exec", {sql: sqlQuery });
  execQuery();
}


function execQuery()
{
    if (!gDB) {
      alert("Connection isn't opened!");
      return;
    }

    if (execH!=null)
      clearTimeout(execH);

    var bt = ample.query("#buttonRun");
    bt.attr("label","Executing...");
    bt.attr("disabled","true");
    startWorking();

    execH = setTimeout(DoExecQuery, DEF_TIMEOUT);

    ample.query("#txtSqlStatement").attr("tooltiptext", "");
    ample.query("#execTable").attr("tooltiptext", "");
    return;
}




function DoExecQuery()
{
    var bt = ample.query("#buttonRun");
    var queryString = ample.query("#txtSqlStatement").attr("value");
    var mess =  ample.query("#sqlLastError");

    try {

      if (queryString.indexOf("!~!",0)==0)
        ExecQuadQuery("execTable", queryString);
      else
        ExecQuery("execTable", queryString);

    } catch(e) {
      mess.attr("value", e);
      ShowError(e);
    } 

    bt.attr("label","RunSQL");
    bt.attr("disabled","false");
    clearTimeout(execH);
    execH = null;
}



function DoPkeyQuery()
{
    var opts = gDATA["idxTable"];
    var queryString = opts.query;

    try {

      if (opts.query.indexOf("!~!",0)==0)
        ExecQuadQuery("idxTable", opts.query);
      else
        ExecQuery("idxTable", opts.query);

    } catch(e) {
      ShowError(e);
    }
}

function DoFkeyQuery()
{
    var opts = gDATA["fkeyTable"];
    var queryString = opts.query;

    try {

      if (opts.query.indexOf("!~!",0)==0)
        ExecQuadQuery("fkeyTable", opts.query);
      else
        ExecQuery("fkeyTable", opts.query);

    } catch(e) {
      ShowError(e);
    }
}

function DoRefQuery()
{
    var opts = gDATA["refTable"];

    try {
      if (opts.query.indexOf("!~!",0)==0)
        ExecQuadQuery("refTable", opts.query);
      else
        ExecQuery("refTable", opts.query);

    } catch(e) {
      ShowError(e);
    }
}


function ExecQuery(lstbox, queryString)
{
    var opts = gDATA[lstbox];
    var retVal = null;
    var query = queryString;
    var lst = null;
    var isSparql = false;

    try {

     if (gDB)
       gDB.transaction({
	 handleEvent: function(trans)
	 {
           var fixResultSet = startWith(queryString, "~");

           if (fixResultSet)
             query = queryString.substr(1);

	   try {
	     if (lstbox == "execTable") {
	       query = checkSPARQL(query);
               ample.query("#txtSqlStatement").attr("value", queryString);
               if (q_query_has_executed!=null) {
                 q_query_hist.push({sql: q_query_has_executed });
                 q_query_has_executed = null;
                 if (q_query_hist.length > 0)
                   ample.query("#buttonPrev").attr("disabled","false");
               }
	     }

             query = fixSELECT_TOP(query);
             lst = parseSQL(query);
             isSparql = isSPARQL(query);

             var rs = trans.executeSql(query);

             opts.fkey_list = null;
             opts.metaData = null;
             opts.qdata = null;

             if (lst != null && lst.length==1) {
               opts.fkey_list = getFkeyList(trans, lst[0], true);
               opts.metaData = [];

               var md = rs.metaData;

               for (var i = 0; i < md.columnCount; i++) {
                 var col_name = md.getColumnName(i);

                 if (opts.fkey_list!=null) {
                   var ind=0;
                   for(var x=0; x < opts.fkey_list.length; x++)
                     if (col_name == opts.fkey_list[x].pcol)
                       {
                         ind |= (opts.fkey_list[x].ind=="p")?c_MPKEY:c_FKEY;
                       }
                   opts.metaData.push({name:col_name, key_type:ind});
                 } else {
                   opts.metaData.push({name:col_name, key_type:0});
                 }
               }
             }

             stopWorking();
             setTimeout(function()
             {
               FillListBox(lstbox, rs, opts.fkey_list, isSparql, fixResultSet);

               if (lstbox == "execTable") {
                 q_query_has_executed = queryString;
               } else if (lstbox == "fkeyTable") {
                 q_fkey_hist.push({sql: queryString });
                 ample.query("#buttonFBack").attr("disabled","false");
               } else if (lstbox == "refTable") {
                 q_ref_hist.push({sql: queryString });
                 ample.query("#buttonRBack").attr("disabled","false");
               } else if (lstbox == "idxTable") {
                 q_pkey_hist.push({sql: queryString });
                 ample.query("#buttonPBack").attr("disabled","false");
               }

               if (lstbox=="execTable" && rs!=null) {
                 var mess = ample.query("#sqlLastError");
                 var md = rs.metaData;
                 if (md.columnCount < 1)
                   mess.attr("value", "Query affected to :"+rs.rowsAffected+" rows");
                 else
                   mess.attr("value", "Query returns :"+rs.rows.length+" rows");
               }
             }, DEF_TIMEOUT);

             retVal = {state:"OK"};

	   } catch (e) {
	     retVal = {state:"ERR", message:e};
	   }
	 }});

    } catch (e) {
       retVal = {state:"ERR", message:e};
    }

    if (retVal!=null && retVal.state != "OK")
      throw retVal.message;

    return retVal;
}



function ExecQuadQuery(lstbox, queryString)
{
    var opts = gDATA[lstbox];
    var retVal = null;

    try {

     if (gDB)
       gDB.transaction({
	 handleEvent: function(trans)
	 {
	   try {
             if (lstbox == "execTable") {
               if (q_query_has_executed!=null) {
                 q_query_hist.push({sql: q_query_has_executed });
                 q_query_has_executed = null;
                 if (q_query_hist.length > 0)
                   ample.query("#buttonPrev").attr("disabled","false");
               }
             }
             var query = fixSELECT_TOP(queryString.substr(3));
             var rs = trans.executeSql(query);

             opts.fkey_list = null;
             opts.metaData = null;
             opts.qdata = null;

             if (lstbox == "execTable") {
               q_query_has_executed = queryString;

             } else if (lstbox == "fkeyTable") {
               q_fkey_hist.push({sql: queryString });
               ample.query("#buttonFBack").attr("disabled","false");

             } else if (lstbox == "refTable") {
               q_ref_hist.push({sql: queryString });
               ample.query("#buttonRBack").attr("disabled","false");

             } else if (lstbox == "idxTable") {
               q_pkey_hist.push({sql: queryString });
               ample.query("#buttonPBack").attr("disabled","false");
             }

             stopWorking();
             setTimeout(function()
             {
               var qdata = {};
               if (rs) 
               {
                 var qdata = {};
                 var md = rs.metaData;
                 var mess = ample.query("#sqlLastError");
                 if (lstbox=="execTable") {
                   if (md.columnCount < 1)
                     mess.attr("value", "Query affected to :"+rs.rowsAffected+" rows");
                   else
                     mess.attr("value", "Query returns :"+rs.rows.length+" rows");
                 }

                 var max_id_len = (""+rs.rows.length).length;
                 var id_pref = "0000000000";

                 for(var i=0; i < rs.rows.length; i++) {
                   var q = {};
                   var row = rs.rows.item(i);

//--- resultSet columns
                   // 0 - cat:schem:tbl
                   // 1 - col name
                   // 2 - col value
                   // 3 - key type
                   // 4 - ref table
                   // 5 - key size
                   // n   - key_col1 name
                   // n+1 - key_col2 name
                   // m   - key_col1 val
                   // m+1 - key_col2 val

                   /// key_types
		   // relations  table           8    
		   // onekey primary key         4
		   // multi primary key          1
		   // foreign key                2
		   // value                      0

                   var obj_id = row[md.getColumnName(0)].split("#");
                   q.obj_id_tbl = obj_id[0];
                   q.obj_id_key = obj_id[1];
                   q.tbl = obj_id[0];
                   q.cname = row[md.getColumnName(1)];
                   q.cval = row[md.getColumnName(2)];
                   q.k_type = row[md.getColumnName(3)];
                   q.rel_tbl = row[md.getColumnName(4)];
                   q.k_size = row[md.getColumnName(5)];

                   var j = gQUAD_KEYLIST_START;
                   q.key = [];
                   q.k_val = [];
                   for ( ; j < gQUAD_KEYLIST_START + q.k_size; j++)
                     q.key.push(row[md.getColumnName(j)]);

                    q.obj_id_key = "";
                   
                    for (var k=0; j < gQUAD_KEYLIST_START + q.k_size + q.k_size; j++,k++)
                    {
                      var s = row[md.getColumnName(j)];
                      q.k_val. push(s);
                      if (k>0)
                        q.obj_id_key += "&";
                      q.obj_id_key += s;
                    }

                   var val = ""+i;
                   val = (id_pref+val).substr(id_pref.length - max_id_len+val.length);
                   qdata["r"+val] = q;
                 }
                 gDATA[lstbox].qdata = qdata;
               }

               FillQuadBox(lstbox, qdata);

             }, DEF_TIMEOUT);

             retVal = {state:"OK"};


	   } catch (e) {
	     retVal = {state:"ERR", message:e};
	   }
	 }});

    } catch (e) {
       retVal = {state:"ERR", message:e};
    }

    if (retVal.state != "OK")
      throw retVal.message;

    return retVal;
}



function FillListBox(list, rs, fkeys_lst, isSparqlQuery, fixResultSet) {
  try {
    var opts = gDATA[list];
    var str = "";
    var md = rs.metaData;
    var cw = [2];

    ample.query("#"+list).empty();

    str += '<xul:listheader minwidth="20" fixed="false" width="20" label="#"/>';

    for (var i = 0; i < md.columnCount; i++) {
      var col_id = i;

      var val = md.getColumnName(col_id);
      if (fixResultSet && isSparqlQuery) {
        if (val === 's' || val === 'S')
          val = "Subject";
        else if (val === 'p' || val === 'P')
          val = "Predicate";
        else if (val === 'o' || val === 'O')
          val = "Object";
      }

      str += '<xul:listheader minwidth="80" fixed="false" width="'+
               val.length*pixPerCh+'" label="'+val+'"/>';
      cw[i+1] = val.length;
    }

    ample.query("#"+list).append(
	    '<xul:listhead xmlns:xul="'+sXULNS+'">'+str+'</xul:listhead>');

    var rows = rs.rows;
    var nBody = ample.createElementNS(sXULNS, "xul:listbody");

    var max_id_len = (""+rows.length).length;
    var id_pref = "0000000000";

    for(var i=0; i < rows.length; i++) {
      var val = "";
      var row = rows.item(i);
      var nItem = ample.createElementNS(sXULNS, "xul:listitem");
      nBody.appendChild(nItem);

      val += i;
      var nData = ample.createElementNS(sXULNS, "xul:listcell");
      val = (id_pref+val).substr(id_pref.length - max_id_len+val.length)
      nData.setAttribute("label", val);
      nItem.appendChild(nData);
      cw[0] = val.length;

      for (var j=0; j < md.columnCount; j++) {
        var col_id = j;

        var nData = ample.createElementNS(sXULNS, "xul:listcell");
        var r_val = row[md.getColumnName(col_id)];
        var val = r_val!=null?r_val.toString():"";
        cw[j+1] = (cw[j+1]<val.length?val.length:cw[j+1]);

        if (typeof(opts)!=="undefined" && 
            opts.metaData != null && 
            opts.metaData[j].key_type!=0)
        {
          nData.setAttribute("label", val);
          nData.setAttribute("id", list+"#"+i+"#"+j);
          nData.setAttribute("class","linkInt");
          nData.addEventListener("click", fkeyClickCatch, false);
        }
        else
        {
          if (typeof(val)=="string" && (val.indexOf("http://")==0 || val.indexOf("https://")==0 || val.indexOf("file://")==0))
          {
            var anc = ample.createElement("a");
            anc.setAttribute("target", "_blank");
            anc.setAttribute("href", val);
            anc.appendChild(ample.createTextNode(val));
            if (isSparqlQuery)
              anc.addEventListener("click", extSparqlLinkClick, false);
            nData.appendChild(anc);
            nData.setAttribute("id", list+"#"+i+"#"+j);
          }
          else
            nData.setAttribute("label", val);
        }
        nItem.appendChild(nData);
      }
    }

    ample.getElementById(list).appendChild(nBody);

    var lst = ample.query("#"+list)[0].head.childNodes;
    for(var i = 0; i < lst.length; i++)
      lst[i].setAttribute("width", cw[i] * pixPerCh);

  } catch (e) {
    ShowError(e);
  }
}



function FillQuadBox(list, qdata) {
  try {
    var str = "";
    var cw = [2,8,9,5,9];
    var c_vis = [false, false, false, false, true];
    var c_label = ["#", "EntityID", "Attribute", "Value", "TableName"];

    var lhead = ample.query("#"+list)[0].head;
    if (typeof(lhead)!=='undefined' && lhead!=null && lhead.items.length==c_vis.length) {
      for(var i=0; i < lhead.items.length; i++)
        if (lhead.items[i].getAttribute("label")===c_label[i])
          c_vis[i] = lhead.items[i].getAttribute("hidden") === "true" ?true:false;
    }

    ample.query("#"+list).empty();
    ample.query("#"+list).append(
      '<xul:listhead xmlns:xul="'+sXULNS+'">'+
        '<xul:listheader minwidth="20" fixed="false" hidden="'+c_vis[0]+'" width="20" label="'+c_label[0]+'"/>'+
        '<xul:listheader minwidth="80" fixed="false" hidden="'+c_vis[1]+'" width="50" label="'+c_label[1]+'"/>'+
        '<xul:listheader minwidth="80" fixed="false" hidden="'+c_vis[2]+'" width="50" label="'+c_label[2]+'"/>'+
        '<xul:listheader minwidth="80" fixed="false" hidden="'+c_vis[3]+'" width="50" label="'+c_label[3]+'"/>'+
        '<xul:listheader minwidth="80" fixed="false" hidden="'+c_vis[4]+'" width="60" label="'+c_label[4]+'"/>'+
      '</xul:listhead>');

    var nBody = ample.createElementNS(sXULNS, "xul:listbody");

    for (var row in qdata) {
      var q = qdata[row];
      var id = row.substr(1);

      var nItem = ample.createElementNS(sXULNS, "xul:listitem");
      nBody.appendChild(nItem);

      var key_id = "";
      var key_val = "";
      for(var i=0; i < q.k_size; i++) {
        if (i>0) {key_id += "&"; key_val += "&"; }
        key_id += q.key[i];
        key_val += q.k_val[i];
      }

      //#
      var col_val = id;
      var nData = ample.createElementNS(sXULNS, "xul:listcell");
        nData.setAttribute("label", col_val);
        nData.setAttribute("hidden",c_vis[0]);
        nItem.appendChild(nData);
        cw[0] = (cw[0]<col_val.length?col_val.length:cw[0]);

      //EntityID
        col_val = q.obj_id_tbl+":record"+":"+q.obj_id_key;
        nData = ample.createElementNS(sXULNS, "xul:listcell");
        nData.setAttribute("label", "urn:"+col_val);
        nData.setAttribute("hidden",c_vis[1]);
        nData.setAttribute("class","linkInt");
        nData.setAttribute("id", list+"#"+escape(id)+"#0");
        nData.addEventListener("click", valClick, false);

        nItem.appendChild(nData);
        cw[1] = (cw[1]<col_val.length?col_val.length:cw[1]);
        
      //Attribute
        if (q.k_type &c_REF_KEY){
          col_val = "rel_from:"+q.cname;
        }
        else
        if (q.k_type &c_FKEY) {
          col_val = "rel_to:"+q.cname;
        }
        else
        if (q.k_type &c_MPKEY || q.k_type &c_PKEY) {
          col_val = "instanceOf";
        }
        else{
          col_val = q.cname!=null?q.cname:"";
        }

        nData = ample.createElementNS(sXULNS, "xul:listcell");
        nData.setAttribute("hidden",c_vis[2]);
        if (q.k_type != 0) 
        {
          nData.setAttribute("label", "urn:"+col_val);
          nData.setAttribute("class","linkInt");
          nData.setAttribute("id", list+"#"+escape(id)+"#1");
          nData.addEventListener("click", valClick, false);
        } else {
          nData.setAttribute("label", col_val);
        }
        nItem.appendChild(nData);
        cw[2] = (cw[2]<col_val.length?col_val.length:cw[2]);

      //Value
        nData = ample.createElementNS(sXULNS, "xul:listcell");
        nData.setAttribute("hidden",c_vis[3]);
        if (q.k_type != 0) 
        {
          if (q.k_type &c_REF_KEY) {
            var rel = q.rel_tbl.split("#");
            col_val = rel[0]+":"+rel[1]+":"+q.cval;
          }
          else if (q.k_type &c_FKEY) {
            var rel = q.rel_tbl.split("#");
            col_val = rel[0]+":"+rel[1]+":"+q.cval;
          }
          else if (q.k_type &c_PKEY || q.k_type &c_MPKEY){
            col_val = q.tbl;
          }
          else {
            col_val = q.tbl+":"+q.cname+":"+q.cval;
          }
          
          nData.setAttribute("label", "urn:"+col_val);
          nData.setAttribute("class","linkInt");
          nData.setAttribute("id", list+"#"+escape(id)+"#2");
          nData.addEventListener("click", valClick, false);
        } 
        else
        {
          col_val = q.cval!=null?q.cval:"";
          if ((col_val.indexOf("http://")==0 || col_val.indexOf("https://")==0 || col_val.indexOf("file://")==0))
          {
            var anc = ample.createElement("a");
            anc.setAttribute("target", "_blank");
            anc.setAttribute("href", col_val);
            anc.appendChild(ample.createTextNode(col_val));
            nData.appendChild(anc);
          }
          else
            nData.setAttribute("label", col_val);
        }
        nItem.appendChild(nData);
        cw[3] = (cw[3]<col_val.length?col_val.length:cw[3]);

      //TableName
        if (q.k_type &c_REF_KEY)
          col_val = q.rel_tbl.split("#")[0];
        else 
          col_val = q.tbl!=null?q.tbl:"";

        col_val = (col_val.length>0)?"urn:"+col_val : col_val;

        nData = ample.createElementNS(sXULNS, "xul:listcell");
        nData.setAttribute("label", col_val);
        nData.setAttribute("hidden",c_vis[4]);
        nData.setAttribute("class","linkInt");
        nData.setAttribute("id", list+"#"+escape(id)+"#3");
        nData.addEventListener("click", valClick, false);

        nItem.appendChild(nData);
        cw[4] = (cw[4]<col_val.length?col_val.length:cw[4]);
    }

    ample.getElementById(list).appendChild(nBody);

    var lst = ample.query("#"+list)[0].head.childNodes;
    for(var i = 0; i < lst.length; i++)
      lst[i].setAttribute("width", cw[i] * pixPerCh);


  } catch (e) {
    ShowError(e);
  }
}


function Fill_PKeyList(list, rs, fkeys_lst) {
  try {
    var str = "";
    var md = rs.metaData;
    var cw = [2];

    ample.query("#"+list).empty();

    str += '<xul:listheader minwidth="20" fixed="false" width="20" label="#"/>';
    str += '<xul:listheader minwidth="80" fixed="false" width="80" label="PKey"/>';

    for (var i = gPKEY_INIT_COL; i < md.columnCount; i++) {
      var val = md.getColumnName(i);
      str += '<xul:listheader minwidth="80" fixed="false" width="'+
               val.length*pixPerCh+'" label="'+val+'"/>';

      cw[i+2-gPKEY_INIT_COL] = val.length;
    }

    ample.query("#"+list).append(
	    '<xul:listhead xmlns:xul="'+sXULNS+'">'+str+'</xul:listhead>');

    var rows = rs.rows;
    var nBody = ample.createElementNS(sXULNS, "xul:listbody");

    var max_id_len = (""+rows.length).length;
    var id_pref = "0000000000";

    for(var i=0; i < rows.length; i++) {
      var val = "";
      var row = rows.item(i);
      var nItem = ample.createElementNS(sXULNS, "xul:listitem");
      nBody.appendChild(nItem);

      val += i;
      var nData = ample.createElementNS(sXULNS, "xul:listcell");
      val = (id_pref+val).substr(id_pref.length - max_id_len+val.length)
      nData.setAttribute("label", val);
      nItem.appendChild(nData);
      cw[0] = val.length;


      nData = ample.createElementNS(sXULNS, "xul:listcell");
//      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
//            fkeys_lst[i].ptbl+":"+fkeys_lst[i].pcol+":record";
      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
            fkeys_lst[i].ptbl+":record"+":"+fkeys_lst[i].pcol;
      var _id = list+"#"+escape(fkeys_lst[i].cat)+":"+escape(fkeys_lst[i].sch)+"#"+
                 escape(fkeys_lst[i].ptbl)+":"+escape(fkeys_lst[i].pcol)+"#"+
                 escape(fkeys_lst[i].ftbl)+":"+escape(fkeys_lst[i].fcol);
      nData.setAttribute("label", "urn:"+val);
      nData.setAttribute("id", _id);
      nData.setAttribute("class","linkInt");
      nData.addEventListener("click", refLinkClickCatch, false);

      nItem.appendChild(nData);
      cw[1] = val.length;


      for (var j=gPKEY_INIT_COL; j < md.columnCount; j++) {

        var nData = ample.createElementNS(sXULNS, "xul:listcell");
        var r_val = row[md.getColumnName(j)];
        var val = r_val!=null?r_val:"";
        cw[j+2-gPKEY_INIT_COL] = (cw[j+2-gPKEY_INIT_COL]<val.length?val.length:cw[j+2-gPKEY_INIT_COL]);

        nData.setAttribute("label", val);
        nItem.appendChild(nData);
      }
    }

    ample.getElementById(list).appendChild(nBody);

    var lst = ample.query("#"+list)[0].head.childNodes;
    for(var i = 0; i < lst.length; i++)
      lst[i].setAttribute("width", cw[i] * pixPerCh);

  } catch (e) {
    ShowError(e);
  }
}



function Fill_PkeysListBox(trans, TblPath)
{
  var tbl = TblPath.split(".");
  var fkey_list = null;

  rs = trans.getPrimaryKeys(tbl[0], tbl[1], tbl[2]);
  var rows = rs.rows;
  var md = rs.metaData;
  if (rows.length > 0) {
     var id = [];
     for(var i=0; i < rows.length; i++) {
       var row = rows.item(i);
       id[i] = {
         ind: "p",
       	 cat: row[md.getColumnName(0)],
       	 sch: row[md.getColumnName(1)],
       	ptbl: row[md.getColumnName(2)],
       	pcol: row[md.getColumnName(3)],
       	ftbl: "",
       	fcol: "",
       	fseq: row[md.getColumnName(gPKEY_SEQ_COL)]};
     }
     fkey_list = id;
  }

  Fill_PKeyList("idxTable", rs, fkey_list);
  q_pkey_hist = [];
  q_pkey_hist.push({sql: "#idxTable#"+TblPath });

  ample.query("#buttonPBack").attr("disabled","true");
}



function Fill_FKeyList(list, rs, fkeys_lst) {
  try {
    var str = "";
    var md = rs.metaData;
    var cw = [2];

    ample.query("#"+list).empty();

    str += '<xul:listheader minwidth="20" fixed="false" width="20" label="#"/>';
    str += '<xul:listheader minwidth="80" fixed="false" width="80" label="PK"/>';
    str += '<xul:listheader minwidth="80" fixed="false" width="80" label="FK"/>';

    for (var i = gFKEY_INIT_COL; i < md.columnCount; i++) {
      var val = md.getColumnName(i);
      str += '<xul:listheader minwidth="80" fixed="false" width="'+
               val.length*pixPerCh+'" label="'+val+'"/>';

      cw[i+3-gFKEY_INIT_COL] = val.length;
    }

    ample.query("#"+list).append(
	    '<xul:listhead xmlns:xul="'+sXULNS+'">'+str+'</xul:listhead>');

    var rows = rs.rows;
    var nBody = ample.createElementNS(sXULNS, "xul:listbody");

    var max_id_len = (""+rows.length).length;
    var id_pref = "0000000000";

    for(var i=0; i < rows.length; i++) {
      var val = "";
      var row = rows.item(i);
      var nItem = ample.createElementNS(sXULNS, "xul:listitem");
      nBody.appendChild(nItem);

      val += i;
      var nData = ample.createElementNS(sXULNS, "xul:listcell");
      val = (id_pref+val).substr(id_pref.length - max_id_len+val.length)
      nData.setAttribute("label", val);
      nItem.appendChild(nData);
      cw[0] = val.length;


      nData = ample.createElementNS(sXULNS, "xul:listcell");
//      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
//            fkeys_lst[i].ptbl+":"+fkeys_lst[i].pcol+":record";
      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
            fkeys_lst[i].ptbl+":record"+":"+fkeys_lst[i].pcol;
      var _id = list+"#"+escape(fkeys_lst[i].cat)+":"+escape(fkeys_lst[i].sch)+"#"+
                 escape(fkeys_lst[i].ftbl)+":"+escape(fkeys_lst[i].fcol)+"#"+
                 escape(fkeys_lst[i].ptbl)+":"+escape(fkeys_lst[i].pcol);
      nData.setAttribute("label", "urn:"+val);
      nData.setAttribute("id", _id);
      nData.setAttribute("class","linkInt");
      nData.addEventListener("click", refLinkClickCatch, false);

      nItem.appendChild(nData);
      cw[1] = val.length;


      nData = ample.createElementNS(sXULNS, "xul:listcell");
//      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
//            fkeys_lst[i].ftbl+":"+fkeys_lst[i].fcol+":record";
      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
            fkeys_lst[i].ftbl+":record"+":"+fkeys_lst[i].fcol;
      var _id = list+"#"+escape(fkeys_lst[i].cat)+":"+escape(fkeys_lst[i].sch)+"#"+
                 escape(fkeys_lst[i].ptbl)+":"+escape(fkeys_lst[i].pcol)+"#"+
                 escape(fkeys_lst[i].ftbl)+":"+escape(fkeys_lst[i].fcol);
      nData.setAttribute("label", "urn:"+val);
      nData.setAttribute("id", _id);
      nData.setAttribute("class","linkInt");
      nData.addEventListener("click", refLinkClickCatch, false);

      nItem.appendChild(nData);
      cw[2] = val.length;


      for (var j=gFKEY_INIT_COL; j < md.columnCount; j++) {

        var nData = ample.createElementNS(sXULNS, "xul:listcell");
        var r_val = row[md.getColumnName(j)];
        var val = r_val!=null?r_val:"";
        cw[j+3-gFKEY_INIT_COL] = (cw[j+3-gFKEY_INIT_COL]<val.length?val.length:cw[j+3-gFKEY_INIT_COL]);

        nData.setAttribute("label", val);
        nItem.appendChild(nData);
      }
    }

    ample.getElementById(list).appendChild(nBody);

    var lst = ample.query("#"+list)[0].head.childNodes;
    for(var i = 0; i < lst.length; i++)
      lst[i].setAttribute("width", cw[i] * pixPerCh);

  } catch (e) {
    ShowError(e);
  }
}



function Fill_FkeysListBox(trans, TblPath)
{
  var tbl = TblPath.split(".");

  var fkey_list = null;

  rs = trans.getForeignKeys(tbl[0], tbl[1], tbl[2], tbl[0], null, null);
  var rows = rs.rows;
  var md = rs.metaData;
  if (rows.length > 0) {
     var id = [];
     for(var i=0; i < rows.length; i++) {
       var row = rows.item(i);
       id[i] = {
         ind: "f",
       	 cat: row[md.getColumnName(0)],
       	 sch: row[md.getColumnName(1)],
       	ptbl: row[md.getColumnName(2)],
       	pcol: row[md.getColumnName(3)],
       	ftbl: row[md.getColumnName(gFKEY_FTBL_COL)],
       	fcol: row[md.getColumnName(gFKEY_FCOL_COL)],
       	fseq: row[md.getColumnName(gFKEY_FSEQ_COL)]};
     }
     fkey_list = id;
  }

  Fill_FKeyList("fkeyTable", rs, fkey_list);
  q_fkey_hist = [];
  q_fkey_hist.push({sql: "#fkeyTable#"+TblPath });

  ample.query("#buttonFBack").attr("disabled","true");
}



function Fill_RefsList(list, rs, fkeys_lst) {
  try {
    var str = "";
    var md = rs.metaData;
    var cw = [2];

    ample.query("#"+list).empty();

    str += '<xul:listheader minwidth="20" fixed="false" width="20" label="#"/>';
    str += '<xul:listheader minwidth="80" fixed="false" width="80" label="PK"/>';
    str += '<xul:listheader minwidth="80" fixed="false" width="80" label="FK"/>';

    for (var i = gFKEY_INIT_COL; i < md.columnCount; i++) {
      var val = md.getColumnName(i);
      str += '<xul:listheader minwidth="80" fixed="false" width="'+
               val.length*pixPerCh+'" label="'+val+'"/>';

      cw[i+3-gFKEY_INIT_COL] = val.length;
    }

    ample.query("#"+list).append(
	    '<xul:listhead xmlns:xul="'+sXULNS+'">'+str+'</xul:listhead>');

    var rows = rs.rows;
    var nBody = ample.createElementNS(sXULNS, "xul:listbody");

    var max_id_len = (""+rows.length).length;
    var id_pref = "0000000000";

    for(var i=0; i < rows.length; i++) {
      var val = "";
      var row = rows.item(i);
      var nItem = ample.createElementNS(sXULNS, "xul:listitem");
      nBody.appendChild(nItem);

      val += i;
      var nData = ample.createElementNS(sXULNS, "xul:listcell");
      val = (id_pref+val).substr(id_pref.length - max_id_len+val.length)
      nData.setAttribute("label", val);
      nItem.appendChild(nData);
      cw[0] = val.length;


      nData = ample.createElementNS(sXULNS, "xul:listcell");
//      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
//            fkeys_lst[i].ftbl+":"+fkeys_lst[i].fcol+":record";
      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
            fkeys_lst[i].ftbl+":record"+":"+fkeys_lst[i].fcol;
      var _id = list+"#"+escape(fkeys_lst[i].cat)+":"+escape(fkeys_lst[i].sch)+"#"+
                 escape(fkeys_lst[i].ptbl)+":"+escape(fkeys_lst[i].pcol)+"#"+
                 escape(fkeys_lst[i].ftbl)+":"+escape(fkeys_lst[i].fcol);
      nData.setAttribute("label", "urn:"+val);
      nData.setAttribute("id", _id);
      nData.setAttribute("class","linkInt");
      nData.addEventListener("click", refLinkClickCatch, false);

      nItem.appendChild(nData);
      cw[1] = val.length;


      nData = ample.createElementNS(sXULNS, "xul:listcell");
//      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
//            fkeys_lst[i].ptbl+":"+fkeys_lst[i].pcol+":record";
      val = fkeys_lst[i].cat+":"+fkeys_lst[i].sch+":"+
            fkeys_lst[i].ptbl+":record"+":"+fkeys_lst[i].pcol;
      var _id = list+"#"+escape(fkeys_lst[i].cat)+":"+escape(fkeys_lst[i].sch)+"#"+
                 escape(fkeys_lst[i].ftbl)+":"+escape(fkeys_lst[i].fcol)+"#"+
                 escape(fkeys_lst[i].ptbl)+":"+escape(fkeys_lst[i].pcol);
      nData.setAttribute("label", "urn:"+val);
      nData.setAttribute("id", _id);
      nData.setAttribute("class","linkInt");
      nData.addEventListener("click", refLinkClickCatch, false);

      nItem.appendChild(nData);
      cw[2] = val.length;


      for (var j=gFKEY_INIT_COL; j < md.columnCount; j++) {

        var nData = ample.createElementNS(sXULNS, "xul:listcell");
        var r_val = row[md.getColumnName(j)];
        var val = r_val!=null?r_val:"";
        cw[j+3-gFKEY_INIT_COL] = (cw[j+3-gFKEY_INIT_COL]<val.length?val.length:cw[j+3-gFKEY_INIT_COL]);

        nData.setAttribute("label", val);
        nItem.appendChild(nData);
      }
    }

    ample.getElementById(list).appendChild(nBody);

    var lst = ample.query("#"+list)[0].head.childNodes;
    for(var i = 0; i < lst.length; i++)
      lst[i].setAttribute("width", cw[i] * pixPerCh);

  } catch (e) {
    ShowError(e);
  }
}



function Fill_RefsListBox(trans, TblPath)
{
  try{
    var tbl = TblPath.split(".");
  
    var fkey_list = null;
    var rs = null;
    var sqltext = "sparql select distinct ?Classes"+
  	" where {?s virtrdf:qmTableName '\""+tbl[0]+"\".\""+tbl[1]+"\".\""+tbl[2]+"\"'; "+
        " virtrdf:qmPredicateRange-rvrFixedValue ?ref. "+
        " ?ref <http://www.w3.org/2000/01/rdf-schema#domain> ?Classes . }  LIMIT 100";

    if (!g_err_in_ref_sparql)
    	try {
      	   rs = trans.executeSql(sqltext);
    	} catch(e) {
      	   rs = null;
      	   g_err_in_ref_sparql = true;
    	}


    if (rs != null && rs.rows.length > 0) {

      ample.query("#reftab").attr("label","Super Keys");
      FillListBox("refTable", rs, null, true);
      q_ref_hist = [];
      q_ref_hist.push({sql: sqltext });

    } else {
      
      ample.query("#reftab").attr("label","References");
      rs = trans.getForeignKeys(tbl[0], null, null, tbl[0], tbl[1], tbl[2]);

      var rows = rs.rows;
      var md = rs.metaData;
      if (rows.length > 0) {
        var id = [];
        for(var i=0; i < rows.length; i++) {
          var row = rows.item(i);
          id[i] = {
             ind: "r",
       	     cat: row[md.getColumnName(0)],
       	     sch: row[md.getColumnName(1)],
       	    ptbl: row[md.getColumnName(gFKEY_FTBL_COL)],
       	    pcol: row[md.getColumnName(gFKEY_FCOL_COL)],
       	    ftbl: row[md.getColumnName(2)],
       	    fcol: row[md.getColumnName(3)],
       	    fseq: row[md.getColumnName(gFKEY_FSEQ_COL)]};
        }
        fkey_list = id;
      }

      Fill_RefsList("refTable", rs, fkey_list);
      q_ref_hist = [];
      q_ref_hist.push({sql: "#refTable#"+TblPath });
    }

  } finally {
     ample.query("#buttonRBack").attr("disabled","true");
  }
}



function dblClickCatch(e)
{
  var dblElem = e.target;
  var ti = dblElem.parentNode.parentNode;

  if (e.currentTarget.attributes.id == "dbList" && ti.attributes.val == "tableName") {
    // Current item is table
     var  curTab = dblElem.attributes.label;

     var t_sch = e.target.parentNode.parentNode.parentNode.parentNode;
     var Sch = t_sch.firstChild.firstChild.attributes.label;

     var t_cat = t_sch.parentNode.parentNode;
     var Cat = t_cat.firstChild.firstChild.attributes.label;

     startWorking();
     setTimeout(function()
     {
       execDblClick({c:Cat, s:Sch, t:curTab});
     }, DEF_TIMEOUT);
  }
}


function execDblClick(path)
{
     var tblQuoted = (path.c!=null&&path.c.length>0?"\""+path.c+"\".":"");
      tblQuoted += (path.s!=null&&path.s.length>0?"\""+path.s+"\".":".");
      tblQuoted += "\""+path.t+"\"";

     updatePermalink({c:path.c, s:path.s, t: path.t}, null, null);

     try {

         var tblPath = path.c+"."+path.s+"."+path.t;

         ample.query("#txtSqlStatement").attr("value", "select * from "+tblQuoted);
         ample.query("#txtSqlStatement").attr("tooltiptext", MESS_OUTDATE);
         ample.query("#execTable").attr("tooltiptext", MESS_OUTDATE);

         if (gDB)
           gDB.transaction({
	     handleEvent: function(trans)
	     {
	       try {
	         var fkey_list = null;
                 var rs = trans.getColumns(path.c, path.s, path.t, null);
                 FillListBox("structTable", rs, null, false, false);

                 Fill_PkeysListBox(trans, tblPath);
                 Fill_FkeysListBox(trans, tblPath);
                 Fill_RefsListBox(trans, tblPath);
	       } catch (e) {
                 ShowError(e);
	       }
	     }});
     } finally {
         stopWorking();
     }
}



function fkeyClickCatch(e)
{
  var id = e.target.attributes.id;
  var col_val = e.target.attributes.label;

  startWorking();
  
  setTimeout(function()
  {
     id = id.split("#");
     var lstbox = unescape(id[0]);
     var opts = gDATA[lstbox];

     var metaData = opts.metaData[id[2]];
     var col_name = metaData.name;
     var key_type = metaData.key_type;

     if (opts.fkey_list.length > 0) {
       var fkey = opts.fkey_list[0]
       var tbl_id = { cat: (fkey.cat!=null?fkey.cat:""),
                      sch: (fkey.sch!=null?fkey.sch:""),
                      tbl:null};

       if (key_type&c_MPKEY) { //Pkey column
         //load pkey, fkey info 
         tbl_id.tbl = fkey.ptbl;
         loadIntLinks(lstbox, tbl_id, col_name, col_val, opts.fkey_list, true, null, null, null);

       } else {  // Fkey column

         // load only fkeys, that are linked via col_name with the table
         tbl_id.tbl = fkey.ptbl;
         loadIntLinks(lstbox, tbl_id, col_name, col_val, null, false, null, null, null);
       }
     }
  }, DEF_TIMEOUT);
}



function refLinkClickCatch(e)
{
  var id = e.target.attributes.id;

  startWorking();

  setTimeout(function()
  {
    id = id.split("#");

    var lstbox = id[0];
    var path = id[1].split(":");
    var ptbll = id[2].split(":");
    var ftbll = id[3].split(":");

    var ptbl = {cat:unescape(path[0]), sch:unescape(path[1]), tbl:unescape(ptbll[0])};
    var pcol = unescape(ptbll[1]);

    var ftbl = {cat:unescape(path[0]), sch:unescape(path[1]), tbl:unescape(ftbll[0])};
    var fcol = unescape(ftbll[1]);

    var relation = {
       	   cat: unescape(path[0]),
       	   sch: unescape(path[1]),
         r_tbl: unescape(ptbll[0]),
         r_col: unescape(ptbll[1]),
         p_col: unescape(ftbll[1]) };
    
    if (fcol.length==0 && ftbll[0].length==0)
      loadIntLinks(lstbox, ptbl, pcol, "", null,  true, null, null, null);
     else
      loadIntLinks(lstbox, ftbl, fcol, "", null, true, null, null, relation);


  }, DEF_TIMEOUT);
}



function valClick(e)
{
  var id = e.target.attributes.id;

  startWorking();

  setTimeout(function()
  {
    id = id.split("#");
  
    var lstbox = id[0];
    var mode = id[2];
    var opts = gDATA[lstbox];
    var q = opts.qdata["r"+unescape(id[1])];

    var path = q.tbl.split(":");
    var tbl_id = {cat:path[0], sch:path[1], tbl:path[2]};

    var add_pkey = ((q.k_type&c_PKEY)||(q.k_type&c_MPKEY)?true:false);

    if (mode == 0) //EntityID
      loadIntLinks(lstbox, tbl_id,      "",     "", null, true,     q.key, q.k_val, null);

    else if (mode == 1) //Attribute
    {
      if (q.k_type&c_REF_KEY) {
        loadIntLinks(lstbox, tbl_id, "",     "", null, false, null, null, null);
      }
      else if (q.k_type&c_FKEY) {

        var rel = q.rel_tbl.split("#");
        var rpath = rel[0].split(":");

        var relation = {
       	   cat: path[0],
       	   sch: path[1],

         r_tbl: rpath[2],
         r_col: rel[1],
         p_col: q.cname,
         
         rel_types: 2};
    
        loadIntLinks(lstbox, tbl_id, "",     "", null, false, null, null, relation);
      }
      else
        loadIntLinks(lstbox, tbl_id, "",     "", null, true, q.key, q.k_val, null);
    }
    else if (mode == 2) //Value
    {
      if (q.k_type&c_PKEY) {
        loadIntLinks(lstbox, tbl_id,      "",     "", null, true, null, null, null);

      } else if (q.k_type&c_REF_KEY) {
        var rel = q.rel_tbl.split("#");

        path = rel[0].split(":");
        rel_id = {cat:path[0], sch:path[1], tbl:path[2]};

        loadIntLinks(lstbox, rel_id, rel[1], q.cval, null, true, null, null, null);

      } else if (q.k_type&c_FKEY) {
        var rel = q.rel_tbl.split("#");
 
        path = rel[0].split(":");
        rel_id = {cat:path[0], sch:path[1], tbl:path[2]};

        loadIntLinks(lstbox, rel_id, rel[1], q.cval, null, true, null, null, null);

      } else {
        loadIntLinks(lstbox, tbl_id, q.cname, q.cval, null, add_pkey, q.key, q.k_val, null);
      }
    }
    else if (mode == 3) //TableName
    {
      if (q.k_type&c_REF_KEY) {
        var rel = q.rel_tbl.split("#");

        path = rel[0].split(":");
        rel_id = {cat:path[0], sch:path[1], tbl:path[2]};

        loadIntLinks(lstbox, rel_id,     "",     "", null, true, null, null, null);
      } else
        loadIntLinks(lstbox, tbl_id,      "",     "", null, true, null, null, null);
    }

  }, DEF_TIMEOUT);
}



/**
 tbl_id  Demo.demo.Customers
 col  CustomerId
 col_val  ALFKI
 tkey_list - table indexes
 add_pkey -

 rel_types =
  0 - any
  1 - to
  2 - from

**/
function loadIntLinks(lstbox, tbl_id, col, col_val, tkey_list, add_pkey, 
		id_keys, id_vals, relation)
{
  var sql = "";
  var sql_txt = "";
  var err = false;

  col = col==null?"":col;
  col_val = col_val==null?"":col_val;

  var cmd = { sql: null,
                    tbl: tbl_id.cat+"."+tbl_id.sch+"."+tbl_id.tbl,   
                    col: col,
                col_val: col_val,
              tkey_list: tkey_list,
               add_pkey: add_pkey,
                id_keys: id_keys,
                id_vals: id_vals,
               relation: relation
  	    };
  updatePermalink(null, lstbox, cmd);

/****
  tbl, col_name, col_val, key_type, key_size, key1, key2, key_val1, key_val2
****/

  if (gDB)
    gDB.transaction({
      handleEvent: function(trans)
      {
	try {

	  var r_from = null;
	  var r_where = null;
   	  var rel_types = 0;
   	  var rel_col = null;
   	  var r_order_by = " order by 1";

	  if (relation != null) {
	    var r_path = ""
            if (relation.cat!=null && relation.cat.length>0)
              r_path = r_path + "\""+relation.cat+"\".";
            if (relation.sch!=null && relation.sch.length>0)
              r_path = r_path + "\""+relation.sch+"\".";

	    r_from = ", "+r_path+"\""+relation.r_tbl+"\" r ";
	    r_where = " AND p.\""+col+"\"=r.\""+relation.r_col+"\" ";
	    if (typeof(relation.rel_types)==="undefined") {
	      rel_types = 0;
	      rel_col = null;
	    } else {
	      rel_types = relation.rel_types;
	      rel_col = relation.r_col;
	    }
	  }

	  var col_type = 0;
	  if (col.length > 0 && col_val.length >0)
	    col_type = getColType(trans, tbl_id.cat, tbl_id.sch, tbl_id.tbl, col);

	  if (id_keys != null)
	    id_keys = fixPkeys(trans, tbl_id.cat, tbl_id.sch, tbl_id.tbl, id_keys);
	  
	  if (tkey_list == null)
            tkey_list = getFkeyList(trans, tbl_id, add_pkey);
	  
	  var query_data=[];
	  var q_data = null;

	  var p_col_lst = getTblColsKeys(trans, tbl_id.cat, tbl_id.sch, tbl_id.tbl);
          var obj_id_key = "";
	  var pkey_id = ""
	  var pkval_id = "";
	  var pkey_size = p_col_lst.pkey.length;
	  
	  // Create LIST of PKEY_COL_NAMES and PKEY_COL_VALUES
	  var c_id = gQUAD_KEYLIST_START;
	  for(var i=0; i < p_col_lst.pkey.length; i++, c_id++) {
	    var id = c_id;
            pkey_id += ", '"+p_col_lst.pkey[i].name+"' as c"+id;

            id += p_col_lst.pkey.length;
	    pkval_id += ", p.\""+p_col_lst.pkey[i].name+"\" as c"+id;

	    r_order_by += ","+(id+1);
	  }

	  // create EntityID value prefix
	  var obj_id = "'"+tbl_id.cat+":"+tbl_id.sch+":"+tbl_id.tbl+"#'";
	  
	  // create table path prefix cat+schema
	  var qu_path = "";
          if (tbl_id.cat!=null && tbl_id.cat.length>0)
             qu_path = qu_path + "\""+tbl_id.cat+"\".";
          if (tbl_id.sch!=null && tbl_id.sch.length>0)
             qu_path = qu_path + "\""+tbl_id.sch+"\".";

	  // SCAN table indexes
	  for(var x = 0; x < tkey_list.length; x++)
	  {
            var tkey = tkey_list[x];

            if (rel_types == 1 && tkey.ind == "r")  //rel to
                continue;
            else
            if (rel_types == 2 && tkey.ind == "f")  //rel from
                continue;
            else
            if (rel_types == 0 && tkey.ind == "r")  //for avoid rel_from item, when rel_to exists
                continue;
            else
            if (rel_types == 0 && tkey.ind == "p" && tkey.seq>1)  //for avoid genertion of query duplicates
                continue;
            
            var qu_ftbl = qu_path+"\""+tkey.ftbl+"\"";
            var qu_ptbl = qu_path+"\""+tkey.ptbl+"\"";

	    var rel_tbl;
	    var col_lst;

            if (tkey.ind == "p") {
	      col_lst = p_col_lst;
	      rel_tbl = "";
            } else {
	      col_lst = getTblColsKeys(trans, tbl_id.cat, tbl_id.sch, tkey.ftbl);
	      rel_tbl = tbl_id.cat+":"+tbl_id.sch+":"+tkey.ftbl;
	    }


	    for(var i=0; i < col_lst.col.length; i++) 
	    {
              var icol = col_lst.col[i];

	      if (icol.isLong)
	        continue;

	      if (tkey.ind != "p" && icol.name!=tkey.fcol)  //add only rows with foreign relations
	        continue;

	      if (rel_types == 2 && icol.name!=rel_col)  // rel from
	        continue;

	      if (icol.key==c_REF_KEY && tkey.ind=="p")   //mark col as simply value, if it uses only for foreigns
	        icol.key=0;
 
	      var  attr_col = (tkey.ind == "p") ? icol.name : tkey.pcol;

// relations  table           8    
// onekey primary key         4
// multi primary key          1
// foreign key                2
// value                      0

              if (icol.key!=0 && tkey.ind == "f" && tkey.fcol == icol.name) 
                icol.key = (icol.key&(~c_FKEY))|c_REF_KEY;  //ref from foreign to main object

              if (rel_types==2) {
                if (icol.key!=0 && tkey.ind == "r" && tkey.fcol == icol.name) 
                  icol.key |= c_FKEY;     //ref from foreign to main object
              } else {
                if (col_lst.pkey.length == 1 && col_lst.pkey[0].name==icol.name && icol.key&c_MPKEY)
                  icol.key = (icol.key&(~c_MPKEY))|c_PKEY;
              }

              q_data = {};
              q_data.c0 = obj_id;  

              if ((icol.key&c_PKEY)!=0 || (icol.key&c_MPKEY)!=0) {
                q_data.c1 = "''";  
                q_data.c2="''";
              } else {
                q_data.c1 = "'"+attr_col+"'";  
                q_data.c2="''||{fn CONVERT(p.\""+attr_col+"\", SQL_VARCHAR)}";
              }

              if (tkey.ind == "p") {
                var _rel_tbl = rel_tbl;
                if (icol.key&c_FKEY) {  // col foreign key
                  for(var j=0; j < tkey_list.length; j++) {
                    if (tkey_list[j].ind==="r" && tkey_list[j].pcol == icol.name) {
                      _rel_tbl = tkey_list[j].cat+":"
                               +tkey_list[j].sch+":"
                               +tkey_list[j].ftbl+"#"
                               +tkey_list[j].fcol;
                      break;
                    }
                  }
                }
                q_data.c3 ="'"+icol.key+"'";
                q_data.c4 ="'"+_rel_tbl+"'";
                q_data.c5 = pkey_size;
              } else {
                q_data.c3="'"+icol.key+"'";
                q_data.c4="'"+rel_tbl+"#"+tkey.fcol+"'";
                q_data.c5 = pkey_size;
              }

              q_data.pkey_id = pkey_id;
              q_data.pkval_id = pkval_id;

              if (tkey.ind == "p") {
                q_data.from = " from "+qu_ptbl+" p";
                q_data.where =" where 1=1 " ;
              } else {
                q_data.from  = " from "+qu_ftbl+" f, "+qu_ptbl+" p ";
                q_data.where = " where f.\""+tkey.fcol+"\"=p.\""+tkey.pcol+"\"" ;
              }

              if (id_keys != null && id_vals != null) {
                for(var j=0; j < id_keys.length; j++) {
                  if (id_vals[j]==null) {
                    q_data.where += " AND p.\""+id_keys[j].name+"\" is NULL";
                  } else {
                    q_data.where += " AND p.\""+id_keys[j].name+"\"="+escapeODBCval(id_vals[j], id_keys[j].col_type);
                  }
                }
              }

              if (col.length >0){
                if (col_val==null) {
                  q_data.where += " AND p.\""+col+"\" is NULL";
                } else if (col_val.length > 0) {
                  q_data.where += " AND p.\""+col+"\"="+escapeODBCval(col_val, col_type);
                }
              } 

              query_data.push(q_data);
            }
          }

          for(var i=0; i < query_data.length; i++) {
            var q = query_data[i];
            if (sql_txt.length > 0)
              sql_txt += "\n UNION \n ";

            sql_txt += "select distinct "+q.c0+" as c0,"+
                                       q.c1+" as c1,"+
                                       q.c2+" as c2,"+
                                       q.c3+" as c3,"+
                                       q.c4+" as c4,"+
                                       q.c5+" as c5"+
                                       q.pkey_id+
                                       q.pkval_id+
                                       q.from;
            if (relation)
              sql_txt += r_from;

            sql_txt += q.where;

            if (relation)
              sql_txt += r_where;
          }

          if (sql_txt.length > 0)
            sql_txt += r_order_by;
          else
            ShowError("Error: query text is empty");

	} catch (e) {
          ShowError(e);
          err = true;
	}
      }});

  if (err)
    return;

  
  if (sql_txt.length > 0) 
  {
    if (lstbox == "execTable") { 
      ample.query("#txtSqlStatement").attr("value", "!~!\n"+sql_txt);
      execQuery();

    } else {

      var opts = gDATA[lstbox];
      opts.query = "!~!\n"+sql_txt;

      if (lstbox == "fkeyTable")
        DoFkeyQuery();
      else if (lstbox == "refTable")
        DoRefQuery();
      else if (lstbox == "idxTable")
        DoPkeyQuery();

    }
  }
}



function getFkeyList(trans, tbl_id, add_pkey)
{
    var id = [];
    var _cat = tbl_id.cat;
    var _sch = tbl_id.sch;
    var _tbl = tbl_id.tbl;

    var rs = trans.getForeignKeys(_cat, _sch, _tbl, (_cat!=null?_cat:""),"","");
    var rows = rs.rows;
    var md = rs.metaData;
    var id_pos=0;

    if (rows.length > 0) {
      for(var i=0; i < rows.length; i++) {
        var row = rows.item(i);
        id[id_pos++] = {
                 ind: "f",
                 cat: row[md.getColumnName(0)],
                 sch: row[md.getColumnName(1)],
             	ptbl: row[md.getColumnName(2)],
             	pcol: row[md.getColumnName(3)],
               	ftbl: row[md.getColumnName(gFKEY_FTBL_COL)],
               	fcol: row[md.getColumnName(gFKEY_FCOL_COL)],
               	fseq: row[md.getColumnName(gFKEY_FSEQ_COL)]};
      }
    }

    rs = trans.getForeignKeys((_cat!=null?_cat:""),"","", _cat, _sch, _tbl);
    rows = rs.rows;
    md = rs.metaData;
    if (rows.length > 0) {
      for(var i=0; i < rows.length; i++) {
        var row = rows.item(i);
        id[id_pos++] = {
                 ind: "r",
                 cat: row[md.getColumnName(0)],
                 sch: row[md.getColumnName(1)],
             	ptbl: row[md.getColumnName(gFKEY_FTBL_COL)],
             	pcol: row[md.getColumnName(gFKEY_FCOL_COL)],
               	ftbl: row[md.getColumnName(2)],
               	fcol: row[md.getColumnName(3)],
               	fseq: row[md.getColumnName(gFKEY_FSEQ_COL)]};
      }
    }

    if (add_pkey == true) {
      rs = trans.getPrimaryKeys(_cat, _sch, _tbl);
      rows = rs.rows;
      md = rs.metaData;

      if (rows.length > 0) {
        for(var i=0; i < rows.length; i++) {
          var row = rows.item(i);
          id.push({
                 ind: "p",
                 cat: row[md.getColumnName(0)],
                 sch: row[md.getColumnName(1)],
               	ptbl: row[md.getColumnName(2)],
               	pcol: row[md.getColumnName(3)],
             	ftbl: "",
             	fcol: "",
               	fseq: row[md.getColumnName(gPKEY_SEQ_COL)]});
        }
      }
    }
    return id;

}



function escapeODBCval(col_val, col_type)
{
  switch(col_type)
  {
    case 1: //SQL_CHAR
       return "{fn CONVERT('"+col_val+"', SQL_CHAR)}";
    case 2: //SQL_NUMERIC
       return "{fn CONVERT('"+col_val+"', SQL_NUMERIC)}";
    case 3: //SQL_DECIMAL
       return "{fn CONVERT('"+col_val+"', SQL_DECIMAL)}";
    case 4: //SQL_INTEGER
       return "{fn CONVERT('"+col_val+"', SQL_INTEGER)}";
    case 5: //SQL_SMALLINT
       return "{fn CONVERT('"+col_val+"', SQL_SMALLINT)}";
    case 6: //SQL_FLOAT
       return "{fn CONVERT('"+col_val+"', SQL_FLOAT)}";
    case 7: //SQL_REAL
       return "{fn CONVERT('"+col_val+"', SQL_REAL)}";
    case 8: //SQL_DOUBLE
       return "{fn CONVERT('"+col_val+"', SQL_DOUBLE)}";
    case 9: //SQL_DATETYPE
       return "{fn CONVERT('"+col_val+"', SQL_DATE)}";
    case 12: //SQL_VARCHAR
       return "{fn CONVERT('"+col_val+"', SQL_VARCHAR)}";
    case 91: //SQL_TYPE_DATE
       return "{fn CONVERT('"+col_val+"', SQL_DATE)}";
    case 92: //SQL_TYPE_TIME
       return "{fn CONVERT('"+col_val+"', SQL_TIME)}";
    case 93: //SQL_TYPE_TIMESTAMP
       return "{fn CONVERT('"+col_val+"', SQL_TIMESTAMP)}";

    case 10: //SQL_TIME
       return "{fn CONVERT('"+col_val+"', SQL_TIME)}";
    case 11: //SQL_TIMESTAMP
       return "{fn CONVERT('"+col_val+"', SQL_TIMESTAMP)}";
    case -1: //SQL_LONGVARCHAR
       return "{fn CONVERT('"+col_val+"', SQL_LONGVARCHAR)}";
    case -2: //SQL_BINARY
       return "{fn CONVERT('"+col_val+"', SQL_BINARY)}";
    case -3: //SQL_VARBINARY
       return "{fn CONVERT('"+col_val+"', SQL_VARBINARY)}";
    case -4: //SQL_LONGVARBINARY
       return "{fn CONVERT('"+col_val+"', SQL_LONGVARBINARY)}";
    case -5: //SQL_BIGINT
       return "{fn CONVERT('"+col_val+"', SQL_BIGINT)}";
    case -6: //SQL_TINYINT
       return "{fn CONVERT('"+col_val+"', SQL_TINYINT)}";
    case -7: //SQL_BIT
       return "{fn CONVERT('"+col_val+"', SQL_BIT)}";
    case -11: //SQL_GUID
       return "{fn CONVERT('"+col_val+"', SQL_GUID)}";

    case -8: //SQL_WCHAR
       return "{fn CONVERT('"+col_val+"', SQL_WCHAR)}";
    case -9: //SQL_WVARCHAR
       return "{fn CONVERT('"+col_val+"', SQL_WVARCHAR)}";
    case -10: //SQL_WLONGVARCHAR
       return "{fn CONVERT('"+col_val+"', SQL_WLONGVARCHAR)}";

    default:
       return "{fn CONVERT('"+col_val+"', SQL_VARCHAR)}";
  }
}



function fixPkeys(trans, cat, sch, tbl, pcols)
{
//??todo optimizeme
  var pkeys = [];
  for(var i=0; i < pcols.length; i++)
   pkeys[i] = { name: pcols[i], col_type: getColType(trans, cat, sch, tbl, pcols[i])}; 
  return pkeys;
}



function getColType(trans, cat, sch, tbl, col)
{
    var rs = trans.getColumns(cat, sch, tbl, col);
    var rows = rs.rows;
    var md = rs.metaData;
    if (rows.length > 0) {
      var row = rows.item(0);
      var col_type = row[md.getColumnName(4)];

      if (col_type == 9 && md.columnCount >=13)
        col_type = row[md.getColumnName(13)]

      return col_type;
    }
    return 1; //SQL_CHAR
}



function getTblColsKeys(trans, cat, sch, tbl)
{
    var pkey = []
    var tcol = [];

    var rs = trans.getColumns(cat, sch, tbl, null);
    var rows = rs.rows;
    var md = rs.metaData;

    if (rows.length > 0) {
      for(var i=0; i < rows.length; i++) {
        var row = rows.item(i);
        var col_type = row[md.getColumnName(4)];
        var is_long = (col_type==-1||col_type==-4)?true:false;
        tcol[i] = {
              col_type: col_type,
                isLong: is_long,
             	name: row[md.getColumnName(3)],
             	 key: 0
             	 };
      }
    }

    var fkeys = getFkeyList(trans, {cat:cat, sch:sch, tbl:tbl});

    rs = trans.getPrimaryKeys(cat, sch, tbl);
    rows = rs.rows;
    md = rs.metaData;
            
    if (rows.length > 0) {
      for(var i=0; i < rows.length; i++) {
        pkey[i] = { name: rows.item(i)[md.getColumnName(3)], col_type: 0 };
        for(var j = 0; j < tcol.length; j++) {
          if (pkey[i].name == tcol[j].name) {
            tcol[j].key = c_MPKEY;
            pkey[i].col_type = tcol[j].col_type;
          }
        }
      }
    }

    for(var i=0; i < fkeys.length; i++) {
      for(var j=0; j < tcol.length; j++) {
        if (tcol[j].name == fkeys[i].pcol && tcol[j].key==0) {
          tcol[j].key |= (fkeys[i].ind=="r")?c_FKEY:c_REF_KEY;
        }
      }
    }

    return { pkey: pkey, col: tcol };
}




function clickBack(lstbox) {
  startWorking();

  setTimeout(function()
  {
    var hval = null;
    if (lstbox == "fkeyTable") {
      if (q_fkey_hist.length > 1)
      {
        hval = q_fkey_hist[q_fkey_hist.length-2]
        q_fkey_hist = q_fkey_hist.slice(0, -2);
      }
      if (q_fkey_hist.length < 1)
        ample.query("#buttonFBack").attr("disabled","true");

    } else if (lstbox == "refTable") {
      if (q_ref_hist.length > 1)
      {
        hval = q_ref_hist[q_ref_hist.length-2]
        q_ref_hist = q_ref_hist.slice(0, -2);
      }
      if (q_fkey_hist.length < 1)
        ample.query("#buttonRBack").attr("disabled","true");

    } else if (lstbox == "idxTable") {
      if (q_pkey_hist.length > 1)
      {
        hval = q_pkey_hist[q_pkey_hist.length-2]
        q_pkey_hist = q_pkey_hist.slice(0, -2);
      }
      if (q_pkey_hist.length < 1)
        ample.query("#buttonPBack").attr("disabled","true");
    }

    if (hval != null)
    {
      if (hval.sql.length>0 && hval.sql[0]=="#") {
        var query = hval.sql.split("#");

        if (gDB)
          gDB.transaction({
	   handleEvent: function(trans)
	   {
	     try {

               updatePermalink(null, query[1], null);

               if (query[1] == "fkeyTable")
                 Fill_FkeysListBox(trans, query[2]);
               else if (query[1] == "refTable")
                 Fill_RefsListBox(trans, query[2]);
               else if (query[1] == "idxTable")
                 Fill_PkeysListBox(trans, query[2]);
	     
	     } catch (e) {
               ShowError(e);
	     } finally {
	       stopWorking();
	     }
	   }});
       }
       else if (hval.sql.indexOf("!~!",0)==0)
       {
         try {
           ExecQuadQuery(lstbox, hval.sql);
         } catch(e) {
           ShowError(e);
         }
       }
       else
       {
         try {
           ExecQuery(lstbox, hval.sql);
         } catch(e) {
           ShowError(e);
         }
       }
    }
  
  }, DEF_TIMEOUT);
}



function startWorking()
{
  if (g_restoring_state)
    return;

   try {
    var w = ample.query("#wthrobber")[0];
    var welm = w.$getContainer();
    var oPos = w.getBoundingClientRect();
    welm.style.left =(document.body.clientWidth - oPos.right + oPos.left) / 2;
    welm.style.top  =(document.body.clientHeight - oPos.bottom + oPos.top) / 2;
    w.show();

    if (g_throbber == null) 
      g_throbber = new Throbber({fallback:"throbber.gif", rotationspeed:4, fade:300});

    g_throbber.start();
    query_executing = true;

  } catch(ex) {
    alert(ex);
  }
}

function stopWorking()
{
  if (g_restoring_state)
    return;

   if (g_throbber != null)
     g_throbber.stop();
   ample.query("#wthrobber")[0].hide();
   query_executing = false;
}


function checkSPARQL(query)
{
   var sQuery = query.replace(/\n/g, ' ').replace(/\r/g, '');

   if (! startWith(ltrim(sQuery).toUpperCase(), 'SPARQL'))
     return query;

   var limitData = sQuery.substring(7).split(new RegExp(" LIMIT ","i"));
   if (limitData.length != 2)
      return query + " LIMIT 100";
   else
      return query;
}


function isSPARQL(query)
{
   var sQuery = query.replace(/\n/g, ' ').replace(/\r/g, '');

   return startWith(ltrim(sQuery).toUpperCase(), 'SPARQL');
}


function fixSELECT_TOP(query)
{
   var qSTART = "\nSELECT ";
   var sQuery = ltrim(query.replace(/\n/g, ' ').replace(/\r/g, ''));

   if (! startWith(sQuery.toUpperCase(), 'SELECT'))
     return query;

   sQuery = sQuery.substring(7);
   sQuery = ltrim(sQuery);

   var bDISTINCT = startWith(sQuery.toUpperCase(),"DISTINCT");
   if (bDISTINCT) {
     qSTART += "DISTINCT ";
     sQuery = sQuery.substring(9);
   }

   var topData = sQuery.split(new RegExp(" TOP ","i"));
   if (topData.length == 2)
      return query;
   else
      return qSTART+"TOP "+MAX_FETCH+" "+topData[0];
}


//SELECT Invoice.*, Customer.* FROM Invoice, Customer
//SELECT * FROM Invoice, Customer
//SELECT * FROM relationships LEFT OUTER JOIN users ON relationships.created_by = users.id AND relationships.updated_by = users.id LEFT OUTER JOIN things ON things.relatedrelationship_id = relationships.id  ORDER BY relationships.updated_at DESC LIMIT 0, 20
function parseSQL(query)
{
   var sqlQuery = query.replace(/\n/g, ' ').replace(/\r/g, '');

//   var query_type = sqlQuery.split(/\s+/)[0];
//   if (query_type.toUpperCase() != 'SELECT')
   if (!startWith(ltrim(sqlQuery).toUpperCase(), 'SELECT'))
     return null;

   var strip_quotes = function(str) {
      return str.replace(/\"/g, '').replace(/\'/g, '').replace(/\[/g, '').replace(/\]/g, '');
   }

   var strip_whitespace = function(str) {
      return str.replace(/\s+/g, '');
   }

   var findClause = function(str, regexp) {
      var clauseEnd = str.search(regexp);
      if (clauseEnd < 0)
          clauseEnd = str.length;
      return str.substring(0, clauseEnd);
   }

   var fromSplit = sqlQuery.substring(7).split(new RegExp(" FROM ","i"));
   if (fromSplit.length != 2)
      return null;
            
   var columnsClause = fromSplit[0];
   var remaining     = fromSplit[1];

   var fromClause    = findClause(remaining, /\sWHERE\s|\sGROUP BY\s|\sHAVING\s|\sORDER BY\s|\sLIMIT/i);
   var fromTableClause = findClause(fromClause, /\sLEFT OUTER JOIN\s/i);

   var fromTables = strip_whitespace(fromTableClause).split(',');
   remaining = remaining.substring(fromClause.length);
            
   var fromClauseSplit = fromClause.split(new RegExp(" LEFT OUTER JOIN ","i"));
   var fromClauseParts = [fromClauseSplit[0]];
   
   var leftJoinComponents;
   for (var i = 1; i < fromClauseSplit.length; i++) {
      leftJoinComponents = /(\w+)\sON\s(.+)/i.exec(fromClauseSplit[i]);
      fromTables.push(leftJoinComponents[1]);
   }

//   if(strip_whitespace(columnsClause) == '*') {
//       var new_columns = [];
//       for(var i=0; i<fromTables.length; i++) {
//          new_columns.push(fromTables[i]+'.ALL')
//       }
//       columnsClause = columnsClause.replace(/\*/, new_columns.join(', '))
//   }
   for(var i=0; i < fromTables.length; i++) {
     fromTables[i] = strip_quotes(fromTables[i]);
     var lst = strip_quotes(fromTables[i]).split(".");
     var _cat = (lst.length>2?lst[lst.length-3]:null); 
     var _sch = (lst.length>1?lst[lst.length-2]:null); 
     var _tbl = lst[lst.length-1];
     fromTables[i] = {cat:_cat, sch:_sch, tbl:_tbl};
   }

   return fromTables;
}




function ShowError(e) {
  stopWorking();
  alert(e);
}


function extSparqlLinkClick(e) {
  var anc = e.target;
  e.preventDefault();

  var lstbox = anc.parentNode.attributes.id.split("#")[0];
  var uri = anc.attributes.href;

  startWorking();

  setTimeout(function()
  {
    execSparqlLinkClick(lstbox, uri);
  }, DEF_TIMEOUT);
}


function execSparqlLinkClick(lstbox, uri) {

  updatePermalink(null, lstbox, {sql: "#"+uri});

  if (lstbox == "execTable") { 
      var sql = "~sparql define sql:describe-mode \"CBD\" describe <"+uri+"> LIMIT 100";
      ample.query("#txtSqlStatement").attr("value", sql);
      clickExecQuery();

  } else {
      var sql = "";
      var uri_test = rtrim(uri).toUpperCase();
      if (endWith(uri_test, '#THIS') || endWith(uri_test, '#RECORD'))
        sql = "~sparql define sql:describe-mode \"SCBD\" describe <"+uri+"> LIMIT 100";
      else
        sql = "sparql select distinct ?Class_Instances where {?Class_Instances ?p <"+uri+">. FILTER (!regex(?Class_Instances,\"^sys:\",\"i\" )) } LIMIT 100";

      var opts = gDATA[lstbox];
      opts.query = sql;

      if (lstbox == "fkeyTable")
        DoFkeyQuery();
      else if (lstbox == "refTable")
        DoRefQuery();
      else if (lstbox == "idxTable")
        DoPkeyQuery();
  }
}


function loadPermalink(params)
{
  if (!(params.substr(0,9)==="permlink_"))
    return;

  params = params.substr(9);

  var cur_tab = params.substr(0,1);

  params = params.substr(2);

  var plink = null;
  try {
    plink = JSON.parse(unescape(params));
  } catch (e) {
    return;
  }

//  document.getElementById("url").value =  plink.url;
  document.getElementById("dsn").value =  plink.dsn;
  document.getElementById("uid").value =  plink.uid;
  document.getElementById("pwd").value =  plink.pwd;

  try {
    if (!WorkerUtils)
     fFAIL = true;
  } catch (ex) {
     showBadConf();
     return;
  }
  var bt = document.getElementById("connect");
  bt.value="Connecting...";
  bt.disabled=true;

  g_permalink_view = true;

  var w = ample.query("#wrestore")[0];
  var welm = w.$getContainer();
  var oPos = w.getBoundingClientRect();
  welm.style.left =(document.body.clientWidth - oPos.right + oPos.left) / 2;
  welm.style.top  =(document.body.clientHeight - oPos.bottom + oPos.top) / 2;
  w.show();

  g_restoring_state = true;

  setTimeout(function()
  {

    try{
    
      DoConnect(plink.path);

      if (plink.path!=null) {
        execDblClick(plink.path);
        try {
          var id = "#"+plink.path.c+"_"+plink.path.s+"_"+plink.path.t;
          var tbl = ample.query(id);
          if (typeof(tbl)!="undefined" && tbl.length > 0)
            tbl[0].parentNode.parentNode.setAttribute("selected", "true");
        } catch (e) {}
      }

      var tabs = ample.query("#tabs")[0];

      if (plink.idx!= null) {
        var cmd = plink.idx;
        if (cmd.sql==null || cmd.sql==="") {
          var path = cmd.tbl.split(".");
          var tbl_id = {cat:path[0], sch:path[1], tbl:path[2]};
          loadIntLinks("idxTable", tbl_id, cmd.col, cmd.col_val, cmd.tkey_list, cmd.add_pkey, cmd.id_keys, cmd.id_vals, cmd.relation);
        } else if (startWith(cmd.sql,"#")) {
          execSparqlLinkClick("idxTable", cmd.sql.substr(1));
        }
      }
      if (plink.fkey!=null) {
        var cmd = plink.fkey;
        if (cmd.sql==null || cmd.sql==="") {
          var path = cmd.tbl.split(".");
          var tbl_id = {cat:path[0], sch:path[1], tbl:path[2]};
          loadIntLinks("fkeyTable", tbl_id, cmd.col, cmd.col_val, cmd.tkey_list, cmd.add_pkey, cmd.id_keys, cmd.id_vals, cmd.relation);
        } else if (startWith(cmd.sql,"#")) {
          execSparqlLinkClick("fkeyTable", cmd.sql.substr(1));
        }
      }
      if (plink.ref!=null) {
        var cmd = plink.ref;
        if (cmd.sql==null || cmd.sql==="") {
          var path = cmd.tbl.split(".");
          var tbl_id = {cat:path[0], sch:path[1], tbl:path[2]};
          loadIntLinks("refTable", tbl_id, cmd.col, cmd.col_val, cmd.tkey_list, cmd.add_pkey, cmd.id_keys, cmd.id_vals, cmd.relation);
        } else if (startWith(cmd.sql,"#")) {
          execSparqlLinkClick("refTable", cmd.sql.substr(1));
        }
      }
      if (plink.exec!=null) {
        var cmd = plink.exec;
        if (cmd.sql==null || cmd.sql==="") {
          var path = cmd.tbl.split(".");
          var tbl_id = {cat:path[0], sch:path[1], tbl:path[2]};
          loadIntLinks("execTable", tbl_id, cmd.col, cmd.col_val, cmd.tkey_list, cmd.add_pkey, cmd.id_keys, cmd.id_vals, cmd.relation);
        } else if (startWith(cmd.sql,"#")) {
          execSparqlLinkClick("execTable", cmd.sql.substr(1));
        } else {
          ample.query("#txtSqlStatement").attr("value", cmd.sql);
          clickExecQuery();
        }
      }
      tabs.advanceSelectedTab(1);
      if (cur_tab==="i")
        return;
      tabs.advanceSelectedTab(1);
      if (cur_tab==="f")
        return;
      tabs.advanceSelectedTab(1);
      if (cur_tab==="r")
        return;
      tabs.advanceSelectedTab(1);

      setTimeout(function()
        {
          if (plink.path!=null) {
            try {
              var id = "#"+plink.path.c+"_"+plink.path.s+"_"+plink.path.t;
              var tbl = ample.query(id);
              if (typeof(tbl)!="undefined" && tbl.length > 0) 
                ample.query("#db")[0].selectItem(tbl[0].parentNode.parentNode);
            } catch (e) {}
          }
        }, DEF_TIMEOUT*2);
    
    } finally {
      g_restoring_state = false;
      ample.query("#wrestore")[0].hide();
    }
  }, DEF_TIMEOUT);
}


function updatePermalink(tbl, tab, cmd)
{
  if (tbl != null) {
    gPLINK.path = tbl;
    gPLINK.tab = null;
    gPLINK.idx = null;
    gPLINK.fkey = null;
    gPLINK.ref = null;
    gPLINK.exec = null;
  }

  if (tab!=null) {
    if (tab==="idx" || tab==="idxTable") {
      gPLINK.tab = "idx";
      gPLINK.idx = cmd;
    }
    else if (tab==="fkey" || tab==="fkeyTable") {
      gPLINK.tab = "fkey";
      gPLINK.fkey = cmd;
    }
    else if (tab ==="ref" || tab==="refTable") {
      gPLINK.tab = "ref";
      gPLINK.ref = cmd;
    }
    else if (tab ==="exec" || tab==="execTable") {
      gPLINK.tab = "exec";
      gPLINK.exec = cmd;
    }

  }
  var href;
  var cur_tab = gPLINK.tab;
  var loc_path = location.protocol+ "//"+location.host+location.pathname;

  gPLINK.tab = "exec";
  href = loc_path+"?permlink_e="+escape(JSON.stringify(gPLINK));
  ample.query("#exec_plink").attr("href", href);
  
  gPLINK.tab = "idx";
  href = loc_path+"?permlink_i="+escape(JSON.stringify(gPLINK));
  ample.query("#idx_plink").attr("href", href);

  gPLINK.tab = "fkey";
  href = loc_path+"?permlink_f="+escape(JSON.stringify(gPLINK));
  ample.query("#fkey_plink").attr("href", href);

  gPLINK.tab = "ref";
  href = loc_path+"?permlink_r="+escape(JSON.stringify(gPLINK));
  ample.query("#ref_plink").attr("href", href);
  gPLINK.tab = cur_tab;
}



function onKeyUp(id, e)
{
  if (e.keyCode != 9)
    return;

  if (id=='dsn') {
    if (!e.shiftKey)
      document.getElementById("uid").focus();
  } else if (id=='uid') {
    if (e.shiftKey)
      document.getElementById("dsn").focus();
    else
      document.getElementById("pwd").focus();
  } else if (id=='pwd') {
    if (e.shiftKey)
      document.getElementById("uid").focus();
    else
      document.getElementById("connect").focus();
  } else if (id=='connect') {
    if (e.shiftKey)
      document.getElementById("pwd").focus();
  }
}

function ltrim(str) { return str.replace(/^\s+/,"");
}
function rtrim(str) { return str.replace(/\s+$/,"");
}
function trim(str) { return str.replace(/^\s+|\s+$/g,"");
}
function startWith(str, findStr) {return (str.match("^"+findStr)==findStr);
}
function endWith(str, findStr) {return (str.match(findStr+"$")==findStr);
}

function xmlencode(val) {

    if (typeof(val)=="string" && val != null)
          val = val.replace(/\&/g,'&'+'amp;').replace(/</g,'&'+'lt;')
                   .replace(/>/g,'&'+'gt;').replace(/\'/g,'&'+'apos;')
                   .replace(/\"/g,'&'+'quot;');
    return val!=null?val:"";
}


