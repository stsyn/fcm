var tx, ty, t, tid, mX, mY;
var windows = {};
var resetFunctions= ['resetProject();resetViewport();api.closePopup()'];
	
function checkWindowPos(id) {
	var el = document.getElementById(id).getElementsByClassName("w")[0];
	el.style.marginTop = "calc(-50vh + "+(mY-ty)+"px + "+(parseInt(el.offsetHeight)/2)+"px)";
	el.style.marginLeft = "calc(-50vw + "+(mX-tx)+"px + "+(parseInt(el.offsetWidth)/2)+"px)";
	if (t) setTimeout(checkWindowPos,16,id);
}

function exapi() {
	this.updated = false;
	this.settings = {color:[]};
	this.windows = {};
	this.mouse = {};
	this.mouse.onclick = [];
	this.version = {g:"0.0.2", s:"pre-alpha", b:24};
	
	this.styleSwitch = function(id, variable, change, rewrite, reverse) {
		if (change) this.settings[variable] = !this.settings[variable];
		var e = document.getElementsByTagName("body")[0].classList;
		if (e.contains(id) != (this.settings[variable] != reverse)) e.toggle(id);
		if (rewrite) this.saveSettings();
	}
	
	this.topFontSize = function() {
		document.getElementById("top").style.fontSize = this.settings.topFontSize+"em";
	}
	
	this.glFontSize = function() {
		document.getElementsByTagName("body")[0].style.fontSize = this.settings.glFontSize+"%";
	}
	
	this.changeSidePad = function (n) {
		for (var i=0; i<3; i++) {
			document.getElementById("pad"+(i+1)).style.display = "none";
			document.getElementById("side").getElementsByClassName("table")[0].getElementsByClassName("b")[i].classList.remove("sel");
		}
		document.getElementById("pad"+(n+1)).style.display = "block";
		document.getElementById("side").getElementsByClassName("table")[0].getElementsByClassName("b")[n].classList.add("sel");
		if (n == 0) this.actualBrush = this.brush;
		else this.actualBrush = -1;
	}
	
	this.changeBottomPad = function (n) {
		for (var i=0; i<2; i++) {
			document.getElementById("bpad"+(i+1)).style.display = "none";
			document.getElementById("bottom").getElementsByClassName("line")[0].getElementsByClassName("b")[i].classList.remove("sel");
		}
		document.getElementById("bpad"+(n+1)).style.display = "block";
		document.getElementById("bottom").getElementsByClassName("line")[0].getElementsByClassName("b")[n].classList.add("sel");
	}
	
	this.selectBrush = function (n) {
		for (var i=-2; i<6; i++) {
			document.getElementById("brush"+i).classList.remove("sel");
		}
		document.getElementById("brush"+n).classList.add("sel");
		this.brush = n;
		api.forceRedraw = true;
	}
	
	this.colorMode = function (t) {
		if (t)  {
			document.getElementsByTagName("body")[0].classList.add("palette");
			document.getElementsByClassName("colorMode")[0].classList.add("sel");
			document.getElementsByClassName("colorMode")[1].classList.remove("sel");
		}
		else {
			document.getElementsByTagName("body")[0].classList.remove("palette");
			document.getElementsByClassName("colorMode")[1].classList.add("sel");
			document.getElementsByClassName("colorMode")[0].classList.remove("sel");
		}
		this.settings.palette = t;
	}
	
	
	this.getSaves = function () {
		var ote = localStorage["fcm2.saves"];
		if (ote !== undefined) ote = JSON.parse(localStorage["fcm2.saves"]);
		return ote;
	}
	
	this.putSaves = function (s) {
		localStorage["fcm2.saves"] = JSON.stringify(s);
	}
	
	this.includeSaves = function (el, a, addname) {
		el.innerHTML == "";
		if (addname) 
			el.innerHTML = '<div class="line linemenu"><input checked type="radio" name="selection" value="saves_._custom_" id="_custom_"><label for="_custom_"><input type="text" name="selection_name" id="save_custom" value="" class="b i fs" onclick="this.parentNode.parentNode.getElementsByTagName(\'input\')[0].checked = true"></label></div>';
		if (a === undefined) return;
		if (a.length == 0) return;
		for (var i=0; i<a.length; i++) 
			el.innerHTML = el.innerHTML + '<div class="line linemenu"><input type="radio" name="selection" value="'+a[i]+'" id="saves_.'+i+'"><label for="saves_.'+i+'" class="b fs">'+a[i]+'</label></div>';
	}
	
	this.readSelected = function(el) {
		var e = el.querySelectorAll('input[type="radio"]');
		for (var i=0; i<e.length; i++) {
			if (e[i].checked) return e[i].value;
		}
	}
	
	this.save = function(name) {
		var o = this.getSaves();
		if (o === undefined) o = [];
		var check = false;
		for (var i=0; o.length; i++) if (o[i] == name) {
			check = true;
			break;
		}
		if (!check) for (var i=0; 1; i++) if (o[i] === undefined) {
			o[i] = name;
			break;
		}
		this.putSaves(o);
		
		project.id = name;
		localStorage[name] = JSON.stringify(project);
		this.callPopup2(windows.saveDone);
		this.closeWindow("save");
	}
	
	this.load = function(name) {
		project = JSON.parse(localStorage[name]);
		this.closeWindow("load");
		this.closePopup();
		this.forceRedraw = true;
	}
	
	
	this.trySave = function() {
		var v = this.readSelected(document.getElementById("savelist"));
		if (v == "_custom_") {
			v = document.getElementById("save_custom").value;
			if (v == "") {
				windows.error.content = "Введите имя файла сохранения!";
				this.callPopup2(windows.error);
				return;
			}
			else if ((v == "fcm2.saves") || (v == "fcm2.settings") || (v == "hasSettings") || (v == "_custom_")) {
				windows.error.content = "Данное имя использовать запрещено! Попробуйте какое-нибудь другое.";
				this.callPopup2(windows.error);
				return;
			}
			var svs = this.getSaves();
			if (svs !== undefined) {
				if (svs.length != 0) {
					for (var i=0; i<svs.length; i++) {
						if (v == svs[i]) {
							windows.sureSave.buttons[0].functions="api.save('"+v+"')";
							this.callPopup2(windows.sureSave);
							return;
						}
					}
				}
			}
			else {
				this.save(v);
				return;
			}
		}
		else {
			windows.sureSave.buttons[0].functions="api.save('"+v+"')";
			this.callPopup2(windows.sureSave);
			return;
		}
	}
	
	this.tryLoad = function() {
		var v = this.readSelected(document.getElementById("loadlist"));
		windows.warning.buttons[0].functions="api.load('"+v+"')";
		this.callPopup2(windows.warning);
	}
	
	this.callPopup2 = function(arg) {
		this.popUp = "popUp";
		var e = document.getElementById("popUp");
		e.classList.add("d");
		e.getElementsByClassName("header")[0].innerHTML = arg.header;
		e.getElementsByClassName("content")[0].innerHTML = arg.content;
		e.getElementsByClassName("t2")[0].innerHTML = '';
		e.getElementsByClassName("w")[0].className = "w "+arg.windowsize;
		for (var i = 0; i < arg.size; i++) {
			e.getElementsByClassName("t2")[0].innerHTML += "<span class=\"t\"><span class=\"b fs"+(arg.buttons[i].red?" red":"")+"\" onclick=\""+arg.buttons[i].functions+"\">"+arg.buttons[i].name+"</span></span>";
		}
	}
	
	this.closePopup = function() {
		document.getElementById("popUp").classList.remove("d");
	}
	
	this.initWindowMove = function(e) {
		t=this.parentNode.parentNode.id;
		tx = e.clientX-parseInt(document.getElementById(t).getElementsByClassName("h")[0].getBoundingClientRect().left);
		ty = e.clientY-parseInt(document.getElementById(t).getElementsByClassName("h")[0].getBoundingClientRect().top);
		checkWindowPos(t);
	}
	
	this.initWindowMoveTouch = function(e) {
		t=this.parentNode.parentNode.id;
		tx = e.changedTouches[0].pageX-parseInt(document.getElementById(t).getElementsByClassName("h")[0].getBoundingClientRect().left);
		ty = e.changedTouches[0].pageY-parseInt(document.getElementById(t).getElementsByClassName("h")[0].getBoundingClientRect().top);
		checkWindowPos(t);
	}
	
	this.callWindow = function(id,arg1,arg2,arg3) {
		t = false;
		tx = 0;
		ty = 0;
		if (this.windows[id]) 
		{	
			document.getElementById(id).getElementsByClassName("w")[0].style.marginTop = "0";
			document.getElementById(id).getElementsByClassName("w")[0].style.marginLeft = "0";
			
			if (id =="side") {
				document.getElementById("side").getElementsByClassName("w")[0].style.marginLeft = "calc(50vw - 11em)";
				document.getElementById("side").getElementsByClassName("w")[0].style.marginTop = "-20vh";
			}
			return;
		}
		this.windows[id] = true;
		if (id == "settings") {
			document.getElementById("settings_button").classList.add("sel");
			document.getElementById("settings").classList.toggle("d");
			this.loadSettings();
			this.putSettings();
		}
		else if (id == "side") {
			document.getElementById("side_button").classList.add("sel");
			document.getElementById("side").classList.toggle("d");
		}
		else if (id == "save") {
			this.includeSaves(document.getElementById("savelist"),this.getSaves(),true);
			document.getElementById("save_button").classList.add("sel");
			document.getElementById("save").classList.toggle("d");
			
		}
		else if (id == "load") {
			var o = this.getSaves();
			if ((o === undefined) || (o.length == 0)) {
				windows.error.content = "Сохраненные проекты отсутствуют.";
				this.callPopup2(windows.error);
				this.windows[id] = false;
			}
			else {
				this.includeSaves(document.getElementById("loadlist"),this.getSaves(),false);
				document.getElementById("load_button").classList.add("sel");
				document.getElementById("load").classList.toggle("d");
			}
		}
		else {
			this.windows[id] = undefined;
			return;
		}
		tid = id;
		document.getElementById(id).getElementsByClassName("w")[0].style.marginTop = "0";
		document.getElementById(id).getElementsByClassName("w")[0].style.marginLeft = "0";
		if (id =="side") {
			document.getElementById("side").getElementsByClassName("w")[0].style.marginLeft = "calc(50vw - 11em)";
			document.getElementById("side").getElementsByClassName("w")[0].style.marginTop = "-20vh";
		}
		if (document.getElementById(id).getElementsByClassName("h")[0] !== undefined) {
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousedown", this.initWindowMove);
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousemove", function(event) {
				if (t != this.parentNode.parentNode.id) return;
				var el = document.getElementById(id).getElementsByClassName("w")[0];
				
				
				el.style.marginTop = "calc(-50vh + "+(event.clientY-ty)+"px + "+(parseInt(el.offsetHeight)/2)+"px)";
				el.style.marginLeft = "calc(-50vw + "+(event.clientX-tx)+"px + "+(parseInt(el.offsetWidth)/2)+"px)";
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mouseup", function() {
				t=false;
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchstart", this.initWindowMoveTouch);
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchmove", function(event) {
				if (t != this.parentNode.parentNode.id) return;
				var el = document.getElementById(id).getElementsByClassName("w")[0];
				
				el.style.marginTop = "calc(-50vh + "+(event.changedTouches[0].pageY-ty)+"px + "+(parseInt(el.offsetHeight)/2)+"px)";
				el.style.marginLeft = "calc(-50vw + "+(event.changedTouches[0].pageX-tx)+"px + "+(parseInt(el.offsetWidth)/2)+"px)";
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchend", function() {
				t=false;
			});
		}
	}
	
	this.closeWindow = function(id) {
		if (this.windows[id] === undefined) return;
		document.getElementById(id).classList.toggle("d");
		if (id == "settings") document.getElementById("settings_button").classList.remove("sel");
		else if (id == "side") document.getElementById("side_button").classList.remove("sel");
		else if (id == "save") document.getElementById("save_button").classList.remove("sel");
		else if (id == "load") document.getElementById("load_button").classList.remove("sel");
		this.windows[id] = undefined;
	}
	
	this.loadDefault = function() {
		this.settings.showLabel = true;
		this.settings.palette = true;
		this.settings.nightMode = (this.location == "nightly");
		this.settings.debug = (this.location == "nightly");
		this.settings.bottomHidden = false;
		this.settings.topFontSize = 1.4;
		this.settings.glFontSize = 100;
		this.settings.dontShowAlerts = false;
		this.settings.color = new Array('#bb0000','#bbbb00','#00bbbb','#00bb00','#bb00bb');
		this.settings.showGrid = true;
		this.settings.redGrid = true;
		
		this.settings.chInterval = 33;
		this.settings.canvasSize = 100;
		this.settings.elemSize = 20;
		
		if (this.location == "nightly") this.settings.lastVersion = this.version.b;
		else this.settings.lastVersion = this.version.g+'['+this.version.b+'] '+this.version.s;
		
		localStorage["hasSettings"] = true;
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.topFontSize();
		this.glFontSize();
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.styleSwitch('bottomHidden','bottomHidden',false,false,false);
		this.styleSwitch('night','nightMode',false,false,false);
		
		this.forceRedraw = true;
	}
	
	this.fixSettings = function () {
		if (this.settings.chInterval === undefined) this.settings.chInterval = 33;
		if (this.settings.canvasSize === undefined) this.settings.canvasSize = 100;
		if (this.settings.elemSize === undefined) this.settings.elemSize = 20;
		if (this.settings.showGrid === undefined) this.settings.showGrid = true;
		if (this.settings.redGrid === undefined) this.settings.redGrid = true;
		this.saveSettings();
		this.loadSettings();
	}
	
	this.loadSettings = function() {
		this.settings = JSON.parse(localStorage["fcm2.settings"]);
		if (!this.updated) {
			if (this.location == "nightly") this.updated = this.version.b;
			else this.updated = this.version.g+'['+this.version.b+'] '+this.version.s;
			if (this.updated == this.settings.lastVersion) this.updated = false;
		}
	}
	
	this.saveSettings = function() {
		localStorage["fcm2.settings"] = JSON.stringify(this.settings);
	}
	
	this.putSettings = function() {
	
		var size=0;
		var allStrings = '';
		for(var key in window.localStorage){
			if(window.localStorage.hasOwnProperty(key)){
				allStrings += window.localStorage[key];
			}	
		}
		size = parseInt(allStrings ? 3 + ((allStrings.length*16)/(8*1024)) : 0);
		document.getElementById("settings").getElementsByClassName("sizes")[0].innerHTML = size+" KB / 5000 KB";
		document.getElementById("settings").getElementsByClassName("linebar")[0].style.background = 
		this.settings.nightMode ? "linear-gradient(to right, #500 0% , #500 "+size*100/5120+"%, #050 "+size*100/5120+"%, #050 100%)" : "linear-gradient(to right, #faa 0% , #faa "+size*100/5000+"%, #afa "+size*100/5000+"%, #afa 100%)";
		var i;
		for (i=0; i<5; i++) {
			document.getElementById("settings").getElementsByClassName("color")[i].value = this.settings.color[i];
			document.getElementById("settings").getElementsByClassName("color2")[i].value = this.settings.color[i];
		}
		document.getElementById("st_labels").checked = this.settings.showLabel;
		document.getElementById("st_debug").checked = this.settings.debug;
		document.getElementById("st_topfontsize").value = this.settings.topFontSize;
		document.getElementById("st_glfontsize").value = this.settings.glFontSize;
		document.getElementById("st_elemsize").value = this.settings.elemSize;
		document.getElementById("st_grid").checked = this.settings.showGrid;
		document.getElementById("st_redGrid").checked = this.settings.redGrid;
		
		document.getElementById("st_debugInterval").value = this.settings.chInterval;
		document.getElementById("st_debugCanvasSize").value = this.settings.canvasSize;
		
		for (i=0; i<document.getElementsByClassName("ac").length; i++) api.switchElemState(document.getElementsByClassName("ac")[i]);
		this.colorMode(this.settings.palette);
	}
	
	this.getSettings = function() {
		this.settings.showLabel = document.getElementById("st_labels").checked;
		this.settings.debug = document.getElementById("st_debug").checked;
		this.settings.topFontSize = parseFloat(document.getElementById("st_topfontsize").value);
		this.settings.glFontSize = parseInt(document.getElementById("st_glfontsize").value);
		this.settings.elemSize = parseInt(document.getElementById("st_elemsize").value);
		this.settings.showGrid = document.getElementById("st_grid").checked;
		this.settings.redGrid = document.getElementById("st_redGrid").checked;
		
		this.settings.chInterval = parseInt(document.getElementById("st_debugInterval").value);
		this.settings.canvasSize = parseInt(document.getElementById("st_debugCanvasSize").value);
		
		if (this.settings.topFontSize < 0.8) this.settings.topFontSize=0.8;
		if (this.settings.topFontSize > 2.5) this.settings.topFontSize=2.5;
		if (this.settings.glFontSize < 25) this.settings.glFontSize=25;
		if (this.settings.glFontSize > 200) this.settings.glFontSize=200;
		if (this.settings.elemSize < 7) this.settings.elemSize=25;
		if (this.settings.elemSize > 100) this.settings.elemSize=200;
		var i;
		for (i=0; i<5; i++) {
			if (this.settings.palette) this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color")[i].value;
			else this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color2")[i].value;
		}
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.topFontSize();
		this.glFontSize();
		
		this.forceRedraw = true;
	}
	
	this.resetData = function() {
		localStorage.clear();
		this.loadDefault();
		this.saveSettings();
		this.putSettings();
		this.init(false);
	}
	
	this.mouseListener = function(e, ec) {
		var cc = document.getElementById("c").getBoundingClientRect();
		api.mouse.X = parseInt(e.clientX-cc.left);
		api.mouse.Y = parseInt(e.clientY-cc.top);
		if (ec || (e.which == 0)) api.mouse.button = e.buttons;
		document.getElementById("debug_mouseInfo").innerHTML = api.mouse.X+':'+api.mouse.Y+' ['+api.mouse.button+']';
		document.getElementById("debug_viewport").innerHTML = parseInt(camera.x)+':'+parseInt(camera.y)+' '+parseInt(100/camera.z)+'%';
	}
	
	this.mouseWheelListener = function(e) {
		if (e.deltaY > 0 && camera.z<50) camera.z*=1.25;
		if (e.deltaY < 0 && camera.z>0.0125) camera.z/=1.25;
		if (e.deltaY != 0) api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = parseInt(camera.x)+':'+parseInt(camera.y)+' '+parseInt(100/camera.z)+'%';
	}
	
	this.mouseClickListener = function(e) {
		if (doMoving.act) return;
		if (e.which == 2) return;
		for (var i=0; i<api.mouse.onclick.length; i++) api.mouse.onclick[i]();
	}
	
	this.pinchListener = function(e) {
		if (!api.mouse.pinching) {
			api.mouse.stPinch = Math.sqrt(
				(e.changedTouches[0].pageX - e.changedTouches[1].pageX) * (e.changedTouches[0].pageX - e.changedTouches[1].pageX) +
				(e.changedTouches[0].pageY - e.changedTouches[1].pageY) * (e.changedTouches[1].pageY - e.changedTouches[1].pageY));
			api.mouse.stZoom = camera.z;
			api.mouse.pinching = true;
		}
		else {
			var t = Math.sqrt(
				(e.changedTouches[0].pageX - e.changedTouches[1].pageX) * (e.changedTouches[0].pageX - e.changedTouches[1].pageX) +
				(e.changedTouches[0].pageY - e.changedTouches[1].pageY) * (e.changedTouches[1].pageY - e.changedTouches[1].pageY));
			camera.z = api.mouse.stZoom * (api.mouse.stPinch / t);
			if (camera.z>50) camera.z=50;
			if (camera.z<0.0125) camera.z=0.0125;
		}
		api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = parseInt(camera.x)+':'+parseInt(camera.y)+' '+parseInt(100/camera.z)+'%';
	}
	
	this.touchListener = function(e, ec) {
		if (e.targetTouches.length == 2) api.pinchListener(e);
		else {
			api.mouse.pinching = false;
			var cc = document.getElementById("c").getBoundingClientRect();
			api.mouse.X = parseInt(e.changedTouches[0].pageX-cc.left);
			api.mouse.Y = parseInt(e.changedTouches[0].pageY-cc.top);
			api.mouse.button = (ec?0:1);
			document.getElementById("debug_mouseInfo").innerHTML = api.mouse.X+':'+api.mouse.Y+' ['+api.mouse.button+']';
			document.getElementById("debug_viewport").innerHTML = parseInt(camera.x)+':'+parseInt(camera.y)+' '+parseInt(100/camera.z)+'%';
		}
		return false;
	}
	
	this.switchElemState = function(e) {
		if (e.getElementsByTagName("input")[0].checked) e.classList.add("sel");
		else e.classList.remove("sel");
	}
	
	this.init = function(fatal) {
		if (window.location.hostname == "") this.location = "local";
		else if (window.location.hostname == "stsyn.github.io") this.location = "nightly";
		else if (window.location.hostname == "vtizi.ugatu.su") this.location = "stable";
		else this.location = "unknown";
		
		this.mouse.pressed = false;
		this.mouse.click = false;
		
		if (fatal) {
			document.getElementsByTagName("body")[0].addEventListener("mousemove", function(event) {
				mX = event.clientX;
				mY = event.clientY;
				
				api.mouseListener(event, false);
			});
			document.getElementById("c").addEventListener("mousedown", function(event) {
				api.mouseListener(event, true);
			});
			document.getElementById("c").addEventListener("mouseup", function(event) {
				api.mouseListener(event, true);
			});
			
			document.getElementsByTagName("body")[0].addEventListener("touchmove", function(event) {
				mX = event.clientX;
				mY = event.clientY;
				
				api.touchListener(event, false);
			});
			document.getElementById("c").addEventListener("touchstart", function(event) {
				api.touchListener(event, false);
			});
			document.getElementById("c").addEventListener("touchend", function(event) {
				api.touchListener(event, true);
			});
			
			document.getElementsByTagName("body")[0].addEventListener("click", function() {
				t=false;
			});
			document.getElementById("c").addEventListener("wheel", function(event) {
				api.mouseWheelListener(event);
			});
			document.getElementById("c").addEventListener("click", function(event) {
				api.mouseClickListener(event);
			});
			
			window.onresize = function(){api.forceRedraw = true}
		
		
			if (localStorage["hasSettings"] != "true") {
				this.loadDefault();
				this.saveSettings();
			}
			else {
				this.loadSettings();
				this.fixSettings();
			}
			
			var ele = document.getElementsByClassName("ac");
			for (var i=0; i<ele.length; i++) ele[i].addEventListener("click", function() {
				api.switchElemState(this);
			});
		}
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.topFontSize();
		this.glFontSize();
		this.styleSwitch('night','nightMode',false,false,false);
		this.styleSwitch('bottomHidden','bottomHidden',false,false,false);
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.changeSidePad(0);
		this.changeBottomPad(0);
		this.selectBrush(-1);
		this.popUp = "popUp";
		
		this.callWindow('side');
		this.forceRedraw = true;
		this.overDraw = false;
		api.mouse.button = 0;
		appInit();
		
		if (this.location == "stable" || this.settings.dontShowAlerts) setTimeout(this.closePopup,500);
		else {
			var tt = "";
			if (this.location == "unknown") tt = 'Вы используете версию из неизвестного источника! Настоятельно рекомендуется использовать стабильную версию на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			else if (this.location == "local") tt = 'Вы используете сохраненную локальную версию. Актуальную стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			else if (this.location == "nightly") tt = 'Вы используете самую свежую промежуточную бета-версию. В ней могут содержаться ошибки и недоделанные возможности! В случае обнаружения ошибок и предложений убедительная просьба связаться с разрабочиками! Стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			
			this.callPopup2({header:'Внимание!',content:tt,size:2,windowsize:'sm',buttons:[{functions:'api.settings.dontShowAlerts=true;api.closePopup();api.saveSettings()',name:'Больше не показывать'},{functions:'api.closePopup()',name:'Закрыть'}]});
		}
		
		
		windows.changelog = {header:'Список изменений',content:'<iframe src="//stsyn.github.io/fcm/changelog/'+this.location+'.txt"></iframe>',size:0,windowsize:'ifr'};
		windows.about = {header:'FCMBuilder2',content:'Курсовой проект Бельского С.М. и Нафикова Д.И.<br>Версия: '+this.version.g+'['+this.version.b+'] '+this.version.s+' ('+api.location+')',size:(this.location == "local"?0:1),buttons:[{functions:'api.callPopup2(windows.changelog)',red:false,name:'Список изменений'}],windowsize:'sm'};
		windows.warning = {header:'Внимание!',content:'Все несохраненные изменения будут утеряны!',size:2,buttons:[{red:false,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.error = {header:'Ошибка!',size:0,windowsize:'sm'};
		windows.sureSave = {header:'Внимание!',content:'Предыдущие данные будут перезаписаны!',size:2,buttons:[{red:false,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.saveDone = {header:'Успех!',content:'Успешно сохранено!',size:0,windowsize:'sm'};
	}
}

var api = new exapi();

window.onload = function () {
	api.init(true);
}