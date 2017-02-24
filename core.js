var tx, ty, t, tid, mX, mY;
var windows = {};
	
function checkWindowPos(id) {
	var el = document.getElementById(id).getElementsByClassName("w")[0];
	el.style.marginTop = "calc(-50vh + "+(mY-ty)+"px + "+(parseInt(el.offsetHeight)/2)+"px)";
	el.style.marginLeft = "calc(-50vw + "+(mX-tx)+"px + "+(parseInt(el.offsetWidth)/2)+"px)";
	if (t) setTimeout(checkWindowPos,16,id);
}

function exapi() {
	this.settings = {color:[]};
	this.windows = {};
	this.mouse = {};
	this.mouse.onclick = [];
	this.version = {g:"0.0.0", s:"pre-alpha", b:5};
	
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
		for (var i=-1; i<6; i++) {
			document.getElementById("brush"+i).classList.remove("sel");
		}
		document.getElementById("brush"+n).classList.add("sel");
		this.brush = n;
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
		console.log(tx,ty);
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
			document.getElementById("settings").classList.toggle("d");
			this.loadSettings();
			this.putSettings();
		}
		else if (id == "side") {
			document.getElementById("side").classList.toggle("d");
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
	}
	
	this.closeWindow = function(id) {
		if (this.windows[id] === undefined) return;
		document.getElementById(id).classList.toggle("d");
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
		
		this.settings.chInterval = 33;
		this.settings.canvasSize = 100;
		
		localStorage["hasSettings"] = true;
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.topFontSize();
		this.styleSwitch('bottomHidden','bottomHidden',false,false,false);
		this.styleSwitch('night','nightMode',false,false,false);
		this.styleSwitch('debugEnabled','debug',false,false,false);
		
		this.forceRedraw = true;
	}
	
	this.fixSettings = function () {
		if (this.settings.chInterval === undefined) this.settings.chInterval = 33;
		if (this.settings.canvasSize === undefined) this.settings.canvasSize = 100;
		this.saveSettings();
		this.loadSettings();
	}
	
	this.loadSettings = function() {
		this.settings = JSON.parse(localStorage["fcm2.settings"]);
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
		
		document.getElementById("st_debugInterval").value = this.settings.chInterval;
		document.getElementById("st_debugCanvasSize").value = this.settings.canvasSize;
		
		this.colorMode(this.settings.palette);
	}
	
	this.getSettings = function() {
		this.settings.showLabel = document.getElementById("st_labels").checked;
		this.settings.debug = document.getElementById("st_debug").checked;
		this.settings.topFontSize = parseFloat(document.getElementById("st_topfontsize").value);
		this.settings.glFontSize = parseInt(document.getElementById("st_glfontsize").value);
		
		this.settings.chInterval = parseInt(document.getElementById("st_debugInterval").value);
		this.settings.canvasSize = parseInt(document.getElementById("st_debugCanvasSize").value);
		
		if (this.settings.topFontSize < 0.8) this.settings.topFontSize=0.8;
		if (this.settings.topFontSize > 1.8) this.settings.topFontSize=1.8;
		if (this.settings.glFontSize < 50) this.settings.glFontSize=50;
		if (this.settings.glFontSize > 200) this.settings.glFontSize=200;
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
		this.putSettings();
		this.init(false);
	}
	
	this.mouseListener = function(e, ec) {
		var cc = document.getElementById("c").getBoundingClientRect();
		api.mouse.X = parseInt(e.clientX-cc.left);
		api.mouse.Y = parseInt(e.clientY-cc.top);
		if (ec || (e.which == 0)) api.mouse.button = e.buttons;
		document.getElementById("debug_mouseInfo").innerHTML = api.mouse.X+':'+api.mouse.Y+' ['+api.mouse.button+']';
		document.getElementById("debug_viewport").innerHTML = camera.x+':'+camera.y+' '+100/camera.z+'%';
	}
	
	this.mouseWheelListener = function(e) {
		if (e.deltaY < 0 && camera.z<256) camera.z*=2;
		if (e.deltaY > 0 && camera.z>0.0625) camera.z/=2;
		if (e.deltaY != 0) api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = camera.x+':'+camera.y+' '+100/camera.z+'%';
	}
	
	this.mouseClickListener = function() {
		for (var i=0; i<api.mouse.onclick.length; i++) api.mouse.onclick[i]();
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
			document.getElementsByTagName("body")[0].addEventListener("click", function() {
				t=false;
			});
			document.getElementById("c").addEventListener("wheel", function(event) {
				api.mouseWheelListener(event);
			});
			document.getElementById("c").addEventListener("click", function() {
				api.mouseClickListener();
			});
		
		
			if (localStorage["hasSettings"] === undefined) this.loadDefault();
			else {
				this.loadSettings();
				this.fixSettings();
			}
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
		windows.about = {header:'FCMBuilder2',content:'Курсовой проект Бельского С.М.<br>Версия: '+this.version.g+'['+this.version.b+'] '+this.version.s+' ('+api.location+')',size:(this.location == "local"?0:1),buttons:[{functions:'api.callPopup2(windows.changelog)',red:false,name:'Список изменений'}],windowsize:'sm'};
	}
}

var api = new exapi();

window.onload = function () {
	api.init(true);
}