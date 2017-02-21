var tx, ty, t, tid, mX, mY;

	
function checkWindowPos(id) {
	var el = document.getElementById(id).getElementsByClassName("w")[0];
	el.style.marginTop = "calc(-50vh + "+(mY-ty)+"px + "+(parseInt(el.offsetHeight)/2)+"px)";
	el.style.marginLeft = "calc(-50vw + "+(mX-tx)+"px + "+(parseInt(el.offsetWidth)/2)+"px)";
	if (t) setTimeout(checkWindowPos,16,id);
}

function exapi() {
	this.settings = {color:[]},
	this.windows = {},
	this.changeNight = function(ch) {
		if (ch) this.settings.nightMode = !this.settings.nightMode;
		var e = document.getElementsByTagName("body")[0].classList;
		if (e.contains("night") != this.settings.nightMode) e.toggle("night");
		this.saveSettings();
	}
	
	this.changeFullscreen = function(ch) {
		if (ch) this.settings.fullscreenMode = !this.settings.fullscreenMode;
		var e = document.getElementsByTagName("body")[0].classList;
		if (e.contains("fullscreen") != this.settings.fullscreenMode) e.toggle("fullscreen");
		this.saveSettings();
	}
	
	this.changeLabels = function() {
		var e = document.getElementsByTagName("body")[0].classList;
		if (e.contains("labelHidden") == this.settings.showLabel) e.toggle("labelHidden");
	}
	
	this.showHideBottom = function(ac) {
		if (ac === undefined) document.getElementsByTagName("body")[0].classList.toggle("bottomHidden");
		else if (!ac) document.getElementsByTagName("body")[0].classList.add("bottomHidden");
		else document.getElementsByTagName("body")[0].classList.remove("bottomHidden");
	}
	
	this.topFontSize = function() {
		document.getElementById("top").style.fontSize = this.settings.topFontSize+"em";
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
	
	this.initWindowMove = function() {
		t=true;
		tx = event.clientX-parseInt(document.getElementById(tid).getElementsByClassName("h")[0].getBoundingClientRect().left);
		ty = event.clientY-parseInt(document.getElementById(tid).getElementsByClassName("h")[0].getBoundingClientRect().top);
		checkWindowPos(tid);
	}
	
	this.callWindow = function(id,arg1,arg2,arg3) {
		if (this.windows[id]) return;
		this.windows[id] = true;
		if (id == "settings") {
			document.getElementById("settings").classList.toggle("d");
			this.loadSettings();
			this.putSettings();
		}
		else {
			this.windows[id] = undefined;
			return;
		}
		tx = 0;
		ty = 0;
		tid = id;
		document.getElementById(id).getElementsByClassName("w")[0].style.marginTop = "0";
		document.getElementById(id).getElementsByClassName("w")[0].style.marginLeft = "0";
		document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousedown", this.initWindowMove);
		
		document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousemove", function() {
			if (!t) return;
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
		this.settings.nightMode = false;
		this.settings.fullscreenMode = false;
		this.settings.topFontSize = 1.4;
		this.settings.dontShowAlerts = false;
		this.settings.color = new Array('#bb0000','#bbbb00','#00bbbb','#00bb00','#bb00bb');
		localStorage["hasSettings"] = true;
		
		this.changeLabels();
		this.topFontSize();
		this.changeNight(false);
		this.changeFullscreen(false);
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
		document.getElementById("st_topfontsize").value = this.settings.topFontSize;
		
		this.colorMode(this.settings.palette);
	}
	
	this.getSettings = function() {
		this.settings.showLabel = document.getElementById("st_labels").checked;
		this.settings.topFontSize = parseFloat(document.getElementById("st_topfontsize").value);
		if (this.settings.topFontSize < 0.8) this.settings.topFontSize=0.8;
		if (this.settings.topFontSize > 1.8) this.settings.topFontSize=1.8;
		var i;
		for (i=0; i<5; i++) {
			if (this.settings.palette) this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color")[i].value;
			else this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color2")[i].value;
		}
		this.changeLabels();
		this.topFontSize();
	}
	
	this.resetData = function() {
		localStorage.clear();
		this.loadDefault();
		this.putSettings();
		this.init(false);
	}
	
	this.init = function(fatal) {
		if (fatal) {
			document.getElementsByTagName("body")[0].addEventListener("mousemove", function() {
				mX = event.clientX;
				mY = event.clientY;
			});
		
			if (localStorage["hasSettings"] === undefined) this.loadDefault();
			else this.loadSettings();
		}
		
		this.changeLabels();
		this.topFontSize();
		this.changeNight(false);
		this.changeFullscreen(false);
		this.changeSidePad(0);
		this.changeBottomPad(0);
		this.selectBrush(-1);
		this.popUp = "popUp";
		
		if (window.location.hostname == "") this.location = "local";
		else if (window.location.hostname == "stsyn.github.io") this.location = "nightly";
		else if (window.location.hostname == "vtizi.ugatu.su") this.location = "stable";
		else this.location = "unknown";
		
		if (this.location == "stable" || this.settings.dontShowAlerts) setTimeout(this.closePopup,500);
		else {
			var tt = "";
			if (this.location == "unknown") tt = 'Вы используете версию из неизвестного источника! Настоятельно рекомендуется использовать стабильную версию на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			else if (this.location == "local") tt = 'Вы используете сохраненную локальную версию. Актуальную стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			else if (this.location == "nightly") tt = 'Вы используете самую свежую промежуточную бета-версию. В ней могут содержаться ошибки и недоделанные возможности! В случае обнаружения ошибок и предложений убедительная просьба связаться с разрабочиками! Стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su">vtizi.ugatu.su</a>';
			
			this.callPopup2({header:'Внимание!',content:tt,size:2,windowsize:'sm',buttons:[{functions:'api.settings.dontShowAlerts=true;api.closePopup();api.saveSettings()',name:'Больше не показывать'},{functions:'api.closePopup()',name:'Закрыть'}]});
		}
	}
}

var api = new exapi();

window.onload = function () {
	api.init(true);
}