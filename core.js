var tx, ty, t, tid, mX, mY;
var windows = {};
	
function checkWindowPos(id) {
	var el = document.getElementById(id).getElementsByClassName("w")[0];
	el.style.top = (mY-ty)+"px";
	el.style.left = (mX-tx)+"px";
	if (mY-ty < 0) el.style.top = '0px';
	if (mX-tx < 0) el.style.left = '0px';
	if (mX-tx > document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))) el.style.left = document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))+'px';
	if (mY-ty > document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))) el.style.top = document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))+'px';
	if (t) setTimeout(checkWindowPos,16,id);
}

function exapi() {
	this.updated = false;
	this.error = false;
	this.settings = {color:[]};
	this.windows = {};
	this.mouse = {};
	this.mouse.onclick = [];
	this.version = {g:"0.9.2", s:"RC2", b:63};
	this.defTerms = [{name:"<i>Без термов</i>",terms:[]},{name:"Краткий",terms:[{term:'Слабо',lim:0.33},{term:'Средне',lim:0.67},{term:'Сильно',lim:1}]},{name:"Подробный",terms:[{term:'Очень слабо',lim:0.2},{term:'Слабо',lim:0.4},{term:'Средне',lim:0.6},{term:'Сильно',lim:0.8},{term:'Очень сильно',lim:1}]}];
	this.zindex = [];
	
	this.styleSwitch = function(id, variable, change, rewrite, reverse) {
		if (change) this.settings[variable] = !this.settings[variable];
		var e = document.getElementsByTagName("body")[0].classList;
		if (e.contains(id) != (this.settings[variable] != reverse)) e.toggle(id);
		if (rewrite) this.saveSettings();
	}
	
	this.fontSwitch = function() {
		var c = document.getElementById('font');
		if ((c != undefined) && this.settings.cursor) return;
		else if ((c != undefined) && !this.settings.cursor) c.parentNode.removeChild(c);
		else if ((c == undefined) && !this.settings.cursor) return;
		else {
			c = document.createElement('link');
			c.href = 'https://fonts.googleapis.com/css?family=Open+Sans:300,400,600&amp;subset=cyrillic';
			c.id = 'font';
			c.rel = 'stylesheet';
			document.head.appendChild(c);
		}
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
		for (var i=-3; i<7; i++) {
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
	
	
	this.putMetaData = function (proj, el) {
		el.innerHTML = '';
		
		if (proj != "null") {
			var p;
			try {
				p = JSON.parse(proj);
			}
			catch (ex) {
				el.innerHTML = 'Ошибка в проекте: '+ex;
				return true;
			}
			if (p.meta != undefined) {
				if (p.meta.description != undefined && p.meta.description != '' && p.meta.description != 'undefined') el.innerHTML += p.meta.description+'<br>';
				var d = new Date(p.meta.timeCreated);
				el.innerHTML += 'Создан: '+d.getDate()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+'<br>';
				d = new Date(p.meta.timeSaved);
				el.innerHTML += 'Сохранен: '+d.getDate()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+'<br><br>';
				el.innerHTML += 'Сжатие: '+(p.meta.compress?'да':'нет')+'<br>';
				el.innerHTML += 'Шифрование: '+(p.meta.encrypt?'да':'нет')+'<br>';
				return false;
			}
			else {
				el.innerHTML += 'В проекте нет метаданных!';
				return false;
			}
		}
	}
	
	this.getSaves = function () {
		var ote = localStorage["fcm2.saves"];
		if (ote != undefined) ote = JSON.parse(localStorage["fcm2.saves"]);
		return ote;
	}
	
	this.putSaves = function (s) {
		localStorage["fcm2.saves"] = JSON.stringify(s);
	}
	
	this.includeElementsTLine = function (el, i) {
		var u = el[i].val;
		if ((project.settings.term != -3) && (u != undefined) && (u <= 1) && (u >= 0)) u = getTermName(u);
		return '<tr class="b fs linemenu" onclick="editElement('+i+')" onmouseover="api.elSel='+i+'"><td>'+i+'</td><td>'+el[i].type+'</td><td>'+getName(i)+'</td><td>'+((el[i].state===undefined)?"—":el[i].state)+'</td><td>'+((el[i].lim===undefined)?"—":el[i].lim)+'</td><td>'+((el[i].cost===undefined)?"—":el[i].cost)+'</td><td>'+((el[i].val===undefined)?"—":u)+'</td></tr>';
	}
	
	this.includeElements = function (e,filter) {
		var el = project.elements;
		var s = '';
		var ax = ((filter == -1)?"":" na")
		if (el.length == 0) {
			s = '<tr class="headline b fs na"><td class="b fs na">Нет элементов</td></tr>';
			e.innerHTML = s;
			return;
		}
		s = '<tr class="headline"><td class="b fs na sort0'+ax+'">ID</td><td class="b fs na sort1'+ax+'">Тип</td><td class="b fs na sort2">Имя</td><td class="b fs na sort3">Состояние</td><td class="b fs na sort4">Предельное</td><td class="b fs na sort5">Стоимость</td><td class="b fs na sort6">Эффективность</td></tr>';
		var i, j;
		if (filter != -1) {
			s += this.includeElementsTLine(el, project.bonds[filter].first);
			for (i=0; i<cache.bonds[filter].elems.length; i++) s += this.includeElementsTLine (el, cache.bonds[filter].elems[i]);
			s += this.includeElementsTLine (el, project.bonds[filter].second);
		}
		
		else for (i=0; i<el.length; i++) {
			if (el[i] == undefined) continue;
			s += this.includeElementsTLine (el, i);
		}
		e.innerHTML = s;
	}
	
	this.includeBondsTLine = function (b, el, i) {
		var u = b[i].val;
		if (project.settings.term != -3 && u != undefined) u = getTermName(u);
		return '<tr class="b fs linemenu" onclick="editBond('+i+')" onmouseover="api.bSel='+i+'"><td>'+i+'</td><td>'+b[i].first+' — '+b[i].second+'</td><td>'+u+'</td><td>'+getName(b[i].first)+'</td><td>'+getName(b[i].second)+'</td></tr>';
	}

	this.includeBonds = function (e, filter) {
		var s = '';
		var el = project.elements;
		var b = project.bonds;
		
		if (b.length == 0) {
			s = '<tr class="headline b fs na"><td class="b fs na">Нет связей</td></tr>';
			e.innerHTML = s;
			return;
		}
		if ((filter != -1) && (cache.elements[filter].inbonds.length == 0) && (cache.elements[filter].outbonds.length == 0) && (el[filter].type != 4) && (el[filter].type != 5)) {
			s = '<tr class="headline b fs na"><td class="b fs na">Нет связей</td></tr>';
			e.innerHTML = s;
			return;
		}
		s = '<tr class="headline"><td class="b fs na">ID</td><td class="b fs na">Путь</div><td class="b fs na">Сила</td><td class="b fs na">Начало</td><td class="b fs na">Конец</td></tr>';
		var i, j;
		if (filter != -1) {
			if ((el[filter].type == 4) || (el[filter].type == 5)) {
				s += '<tr class="headline b fs na"><td colspan="5">Родительская связь</td></tr>';
				s += this.includeBondsTLine (b, el, el[filter].X);
				e.innerHTML = s;
				return;
			}
			var t = true;
			for (i=0; i<cache.elements[filter].inbonds.length; i++) {
				if (t) {
					t = false;
					s += '<tr class="headline b fs na"><td colspan="5">Входящие связи</td></tr>';
				}
				s += this.includeBondsTLine (b, el, cache.elements[filter].inbonds[i]);
			}
			var t = true;
			for (i=0; i<cache.elements[filter].outbonds.length; i++) {
				if (t) {
					t = false;
					s += '<tr class="headline b fs na"><td colspan="5">Исходящие связи</td></tr>';
				}
				s += this.includeBondsTLine (b, el, cache.elements[filter].outbonds[i]);
			}
		}
		
		else for (i=0; i<b.length; i++) {
			if (b[i] == undefined) continue;
			s += this.includeBondsTLine (b, el, i);
		}
		e.innerHTML = s;
	}
	
	this.includeSaves = function (el, a, addname, el2, nn) {
		el.innerHTML = "";
		if (addname) 
			el.innerHTML = '<div class="line linemenu"><input checked type="radio" name="selection" value="'+nn+'._custom_" id="_custom_"><label for="_custom_" onclick="api.putMetaData(null,document.getElementById(\''+el2+'\'))"><input type="text" name="selection_name" id="save_custom" value="" class="b i fs" onclick="this.parentNode.parentNode.getElementsByTagName(\'input\')[0].checked = true"></label></div>';
		if (a == undefined) return;
		if (a.length == 0) return;
		var i, ec = -1;
		for (i=0; i<a.length; i++) if (a[i] == project.id) ec = i;
		for (i=0; i<a.length; i++) {
			if (addname && a[i] == "_temp_save") continue;
			el.innerHTML = el.innerHTML + '<div class="line linemenu"><input type="radio" name="selection" value="'+a[i]+'" id="'+nn+'.'+i+'" '+(((!addname && (i==0)) || (ec == i))?"checked":"")+'><label for="'+nn+'.'+i+'" class="b fs" onclick="api.putMetaData(localStorage[\''+a[i]+'\'],document.getElementById(\''+el2+'\'))">'+a[i]+'</label></div>';
			if ((!addname && (i==0)) || (ec == i)) this.putMetaData(localStorage[a[i]],document.getElementById(el2));
		}
	}
	
	this.readSelected = function (el) {
		var e = el.querySelectorAll('input[type="radio"]');
		for (var i=0; i<e.length; i++) {
			if (e[i].checked) return deXSS(e[i].value);
		}
	}
	
	this.exportProject = function () {
		var blob = new Blob([JSON.stringify(project)], {type: "application/json"});
		var url = URL.createObjectURL(blob);
		var c = document.querySelector('#export .exportlink');
		c.innerHTML = '';
		var a = document.createElement('a');
		a.download = project.id+'.fcm';
		a.href = url;
		a.target = "_blank";
		a.innerHTML = "Если загрузка не началась, нажмите сюда";
		c.appendChild(a);
		a.click();
	}
	
	this.importProject = function () {
		var c = document.getElementById("import").getElementsByClassName("im_c")[0].value;
		if (this.putMetaData(c,document.getElementById("importpad"))) {
			this.addMessage('Проект не может быть импортирован','red');
		}
		project = JSON.parse(c);
		if (project.settings.term == undefined) project.settings.term = -3;
		update();
		this.changed = false;
		this.closeWindow('import');
	}
	
	this.save = function (name, silent) {
		try {
			var o = this.getSaves();
			if (o == undefined) o = [];
			var check = false;
			for (var i=0; i<o.length; i++) if (o[i] == name) {
				check = true;
				break;
			}
			if (!check) for (var i=0; 1; i++) if (o[i] == undefined) {
				o[i] = name;
				break;
			}
			this.putSaves(o);
			
			if (project.id == "_temp_save" && name != "_temp_save") this.deleteSave(project.id, true);
			project.id = name;
			this.settings.lastLoaded = name;
			this.saveSettings();
			localStorage[name] = JSON.stringify(project);
			if (!silent) {
				this.callPopup2(windows.saveDone);
				this.closeWindow("save");
				document.getElementById("savelist").innerHTML = "";
			}
			this.changed = false;
			
			if (project.meta == undefined) project.meta = {};
			var t = new Date();
			if (isNaN(project.meta.timeCreated)) project.meta.timeCreated = t.getTime();
			project.meta.timeSaved = t.getTime();
			if (silent) api.addMessage('Сохранено!','green');
			
			Recalculate();
		}
		catch (ex) {
			if (!silent) {
				windows.saveError.content = 'Не удалось сохранить проект. Скорее всего, в локальном хранилище недостаточно места. Попробуйте удалить ненужные проекты, или выполните экспорт текущего проекта и сохраните его на жестком диске.<br><br>Описание ошибки:<br>'+ex;
				this.callPopup2(windows.saveError);
			}
			else api.addMessage('Не удалось сохранить проект!','red');
			if (api.settings.debug) throw ex;
		}
	}
	
	this.saveCurrent = function () {
		if ((project.id == undefined) || (project.id == '_temp_save')) this.callWindow('save');
		else this.save(project.id, true);
	}
	
	this.load = function (name, silent) {
		try {
			if (api.settings.debug) console.log("Loading... ", name);
			project = JSON.parse(localStorage[name]);
			if (project.settings.term == undefined) project.settings.term = -3;
			if (project.settings.currentCase == undefined) project.settings.currentCase = -2;
			if (project.settings.calcFunc == undefined) project.settings.calcFunc = 0;
			if (!silent) {
				this.closeWindow("load");
				this.closePopup();
				document.getElementById("loadlist").innerHTML = "";
			}
			api.settings.lastLoaded = name;
			api.initRTSCases();
			api.initRTS();
			this.saveSettings();
			update();
			this.changed = false;
			return false;
		}
		catch (ex) {
			windows.loadError.content = 'Не удалось загрузить проект "'+name+'". Попробуйте перезапустить программу. Также вероятно, что вы пытаетесь загрузить несуществующий проект.<br><br>Описание ошибки:<br>'+ex;
			this.callPopup2(windows.loadError);
			if (api.settings.debug) throw ex;
			return true;
		}
	}
	
	this.deleteSave = function (name, silent) {
		var v = this.readSelected(document.getElementById("loadlist")); 
		if (name != undefined) v = name;
		var o = this.getSaves();
		for (var i=0; i<o.length; i++) if (o[i] == v) {
			o.splice(i,1);
			break;
		}
		this.putSaves(o);
		localStorage.removeItem(v);
		if (!silent) {
			this.closePopup();
			this.closeWindow("load");
			this.callWindow("load");
		}
	}
	
	this.addMessage = function (txt, color) {
		var ac = document.createElement('span');
		ac.innerHTML = txt;
		ac.className = color;
		ac.addEventListener("click", function(event) {
			this.parentNode.removeChild(this);
		});
		document.getElementById('messages').appendChild(ac);
		if (api.messageTimeout == 0 || api.messageTimeout == undefined) api.messageTimeout = 10000;
	}
	
	this.windowOnTop = function (id) {
		var i;
			
		for (i=0; i<this.zindex.length; i++) if (this.zindex[i] == id) break;
		this.zindex.splice(i, 1);
		this.zindex.push(id);
		
		this.activeWindow = id;
		document.getElementById(id).style.zIndex = this.zindex.length-1;
		
		for (i=0; i<this.zindex.length; i++) if (this.zindex[i] != undefined) document.getElementById(this.zindex[i]).getElementsByClassName("w")[0].classList.remove("a");
		document.getElementById(id).getElementsByClassName("w")[0].classList.add("a");
		
		if (this.settings.tooltips) this.forceRedraw = true;
		this.rearrangeWindows();
	}
	
	this.trySave = function() {
		var v = this.readSelected(document.getElementById("savelist"));
		if (v == "saves_._custom_") {
			v = deXSS(document.getElementById("save_custom").value);
			if (v == "") {
				windows.error.content = "Введите имя файла сохранения!";
				this.callPopup2(windows.error);
				return;
			}
			else if ((v == "fcm2.saves") || (v == "fcm2.settings") || (v == "undefined") || (v == "_temp_save") || (v == "hasSettings") || (v == "saves_._custom_") || (v == "null")) {
				windows.error.content = "Данное имя использовать запрещено! Попробуйте какое-нибудь другое.";
				this.callPopup2(windows.error);
				return;
			}
			var svs = this.getSaves();
			if (svs != undefined) {
				if (svs.length != 0) {
					for (var i=0; i<svs.length; i++) {
						if (v == svs[i]) {
							this.callPopup2(windows.sureSave);
							document.getElementById('popUp').getElementsByClassName('b')[0].addEventListener("click", function() {api.save(v, false)});
							return;
						}
					}
					this.save(v, false);
					return;
				}
				else {
					this.save(v, false);
					return;
				}
			}
			else {
				this.save(v, false);
				return;
			}
		}
		else {
			this.callPopup2(windows.sureSave);
			document.getElementById('popUp').getElementsByClassName('b')[0].addEventListener("click", function() {api.save(v, false)});
			return;
		}
	}
	
	this.tryLoad = function() {
		var v = this.readSelected(document.getElementById("loadlist"));
		if (this.changed) {
			windows.warning.buttons[0].functions="api.load('"+v+"')";
			this.callPopup2(windows.warning);
		}
		else this.load(v);
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
		if (api.zindex.length > 0) api.windowOnTop(api.zindex.pop());
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
	
	this.requestReset = function() {
		if (this.changed) {
			windows.warning.buttons[0].functions='resetProject();resetViewport();api.closePopup();delete api.settings.lastLoaded;api.saveSettings();';
			this.callPopup2(windows.warning);
		}
		else {
			resetProject();
			resetViewport();
			delete this.settings.lastLoaded;
			this.saveSettings();
		}
	}
	
	this.requestDeletion = function(id) {
		windows.sureDelete.buttons[0].functions = "RemoveElement("+id+",true);api.closeWindow('edite"+id+"');api.closePopup()";
		this.callPopup2(windows.sureDelete);
	}
	
	this.requestDeletionBond = function(id) {
		windows.sureDelete.buttons[0].functions = "RemoveBond("+id+",true);api.closeWindow('editb"+id+"');api.closePopup()";
		this.callPopup2(windows.sureDelete);
	}
	
	this.renderCaseElem = function (caseid, elem, u) {
		if (caseid>0 && elem>0) if (project.cases[caseid].enabled[elem] == undefined) project.cases[caseid].enabled[elem] = true;
		var e = document.createElement('div');
		var isEnabled = (elem == -1 ? false : (caseid == -2 ? false : (caseid == -1 ? true : project.cases[caseid].enabled[elem])));
		e.classList = 't2 b fs'+(isEnabled ? (caseid>=0 ? ' sel stillsel' : ' sel') : (caseid>=0 ? '' : ' na'))+(elem == -1 ? ' na' : '');
		e.value = caseid;
		e.style = (elem == -1 ?'':'text-align:left');
		e.elemId = elem;
		
		var c = document.createElement('div');
		c.className = 't';
		c.innerHTML = (elem == -1 ? 'Имя':getName(elem));
		e.appendChild(c);
		
		c = document.createElement('div');
		c.className = 't';
		c.innerHTML = (elem == -1 ? 'Значение':project.elements[elem].val);
		e.appendChild(c);
		
		c = document.createElement('div');
		c.className = 't';
		c.innerHTML = (elem == -1 ? 'Стоимость':project.elements[elem].cost);
		e.appendChild(c);
		
		if (elem >= 0 && caseid >= 0) e.addEventListener("click", function() {
			project.cases[this.value].enabled[this.elemId] = !project.cases[this.value].enabled[this.elemId];
			api.renderCase(this.value);
		});
		
		u.appendChild(e);
	}
	
	this.requestDeletionCase = function() {
		windows.deleteCase.buttons[0].functions = 'project.cases.splice('+api.selectedCase+',1);api.closePopup();api.drawCases()';
		api.callPopup2(windows.deleteCase);
	}
	
	this.requestDeletionTerm = function() {
		windows.deleteTerm.buttons[0].functions = 'project.terms.splice('+api.selectedTerm+',1);api.closePopup();api.drawTerms()';
		api.callPopup2(windows.deleteTerm);
	}

	this.calcSum = function(val) {
		var sum=0;
		for (i=0; i<cache.types[3].length; i++) {
			sum += (val >= 0? (project.cases[val].enabled[cache.types[3][i]]? project.elements[cache.types[3][i]].cost :0) : 
				   (val == -1? project.elements[cache.types[3][i]].cost :0));
		}
		for (i=0; i<cache.types[4].length; i++) {
			sum += (val >= 0? (project.cases[val].enabled[cache.types[4][i]]? project.elements[cache.types[4][i]].cost :0) : 
				   (val == -1? project.elements[cache.types[4][i]].cost :0));
		}
		return sum;
	}
	
	this.calcCSum = function(val) {
		var sum = 0;
		for (var c=0; c<cache.types[2].length; c++) sum+=cache.elements[cache.types[2][c]].costs[val+2];
		return sum;
	}
	
	this.calcTSum = function(val) {
		console.log(this.calcSum(val),this.calcCSum(val));
		return this.calcSum(val) + this.calcCSum(val);
	}
	
	this.renderCase = function(val) {
		api.selectedCase = val;
		document.getElementById('caseoptions').innerHTML = '<div class="table r"><div class="t3"></div></div>';
		var i;
		for (i=0; i<document.getElementById('caselist').getElementsByClassName('b').length; i++) 
			document.getElementById('caselist').getElementsByClassName('b')[i].classList.remove('sel');
		document.getElementById('caselist').getElementsByClassName('b')[val+2].classList.add('sel');
		var u = document.getElementById('caseoptions').getElementsByClassName('t3')[0];
		api.renderCaseElem(val, -1, u);
		for (i=0; i<cache.types[3].length; i++) {
			if (project.elements[cache.types[3][i]].alias > -1) continue;
			api.renderCaseElem(val, cache.types[3][i], u);
		}
		for (i=0; i<cache.types[4].length; i++) {
			if (project.elements[cache.types[4][i]].alias > -1) continue;
			api.renderCaseElem(val, cache.types[4][i], u);
		}
		
		document.getElementById('cs_name').value = (val >= 0?project.cases[val].name : (val == -1 ? 'Все включено' : 'Все отключено'));
		document.getElementById('cs_name').disabled = !(val>=0);
		if (val >= 0) {
			document.getElementById('cs_name').classList.remove('na');
			document.getElementById('cs_del').classList.remove('na');
			document.getElementById('cs_del').addEventListener('click', api.requestDeletionCase);
		}
		else {
			document.getElementById('cs_name').classList.add('na');
			document.getElementById('cs_del').classList.add('na');
			document.getElementById('cs_del').removeEventListener('click', api.requestDeletionCase);
		}
		document.getElementById('cs_cost').value = api.calcSum(val);
	}
	
	this.drawCases = function(norefocus) {
		if (project.cases == undefined) project.cases = [];
		document.getElementById('caselist').innerHTML = '';
		for (var i = -2; i<project.cases.length+1; i++) {
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else if (i == project.cases.length) s = '<i>Добавить</i>';
			else s = project.cases[i].name;
			
			var el = document.createElement('div');
			el.classList = 'b fs';
			el.innerHTML = s;
			el.value = i;
			if (i != project.cases.length) el.addEventListener("click",function() {
				api.renderCase(this.value)});
			else el.addEventListener("click",function() {
				var c, j;
				for (c=0; project.cases[c] != undefined; c++) 0;
				project.cases[c] = {};
				project.cases[c].name = 'Новый кейс '+c;
				project.cases[c].enabled = [];
				if (api.selectedCase >=0) {
					for (j=0; j<cache.types[3].length; j++) project.cases[c].enabled[cache.types[3][j]] = project.cases[api.selectedCase].enabled[cache.types[3][j]];
					for (j=0; j<cache.types[4].length; j++) project.cases[c].enabled[cache.types[4][j]] = project.cases[api.selectedCase].enabled[cache.types[3][j]];
				}
				else {
					for (j=0; j<cache.types[3].length; j++) project.cases[c].enabled[cache.types[3][j]] = api.selectedCase == -1;
					for (j=0; j<cache.types[4].length; j++) project.cases[c].enabled[cache.types[4][j]] = api.selectedCase == -1;
				}
				api.renderCase(c);
				api.drawCases();
			});
			document.getElementById('caselist').appendChild(el);
		}
		if (!norefocus) this.renderCase(-2); 
		else document.getElementById('caselist').getElementsByClassName('b')[api.selectedCase+2].classList.add('sel');
		api.initRTSCases();
		api.initRTS();
	}
	
	
	this.getTermsPattern = function(val) {
		if (val < 0) return this.defTerms[val+3];
		return project.terms[val];
	}
	
	this.renderTermElem = function (caseid, elem, x) {
		var e = document.createElement('div');
		e.classList = 't2 ';
		e.value = caseid;
		e.style = (elem == -1 ?'':'text-align:left');
		e.elemId = elem;
		var et = (caseid == -1?'div':'input');
		var t = (elem>=0?(caseid<0?api.defTerms[caseid+3]:project.terms[caseid]):api.defTerms[0]);
		var cl = ((caseid < 0 || elem == t.terms.length-1)?' na':'');
		
		var u;
		var c = document.createElement('div');
		c.className = 't';
		if (elem == t.terms.length) {
			if (caseid >= 0) {
				u = document.createElement('div');
				u.className = 'b fs';
				u.innerHTML = '<i>Добавить</i>';
				u.addEventListener('click', function() {
					var uc = project.terms[api.selectedTerm].terms.length-1;
					project.terms[api.selectedTerm].terms.push({term:'Терм '+(uc+1),lim:1});
					api.renderTerm(api.selectedTerm);
				});
				c.appendChild(u);
				e.appendChild(c);
			}
		}
		else {
			if (elem == -1) c.innerHTML = 'Имя';
			else {
				u = document.createElement('input');
				u.className = 'b i fs'+(caseid < 0?' na':'');
				if (caseid < 0) u.disabled = true;
				u.value = t.terms[elem].term;
				u.addEventListener("input",function() {
					project.terms[api.selectedTerm].terms[this.parentNode.parentNode.elemId].term = this.value;
				});
				c.appendChild(u);
			}
			e.appendChild(c);
			
			c = document.createElement('div');
			c.className = 't';
			if (elem == -1) c.innerHTML = 'Нижний предел';
			else {
				u = document.createElement('input');
				u.className = 'b i fs na';
				u.disabled = true;
				u.value = (elem >0?t.terms[elem-1].lim:0);
				c.appendChild(u);
			}
			e.appendChild(c);
			
			c = document.createElement('div');
			c.className = 't';
			if (elem == -1) c.innerHTML = 'Верхний предел';
			else {
				u = document.createElement('input');
				u.className = 'b i fs'+cl;
				if (caseid < 0 || elem == t.terms.length-1) u.disabled = true;
				u.value = t.terms[elem].lim;
				u.addEventListener("change",function() {
					this.value = this.value.replace(",",".");
					this.value = parseFloat(this.value);
					var min = (this.parentNode.parentNode.elemId == 0? 0 : project.terms[this.parentNode.parentNode.value].terms[this.parentNode.parentNode.elemId-1].lim);
					if (isNaN(this.value)) this.value = 0;
					if (this.value>1) this.value = 1;
					if (this.value<min) this.value = min;
					project.terms[this.parentNode.parentNode.value].terms[this.parentNode.parentNode.elemId].lim = this.value;
					this.parentNode.parentNode.nextElementSibling.getElementsByClassName('b')[1].value = this.value;
				});
				c.appendChild(u);
			}
			e.appendChild(c);
			
			c = document.createElement('div');
			c.className = 't';
			if (elem == -1) c.innerHTML = ' ';
			else {
				u = document.createElement('div');
				u.className = 'b red fs'+cl;
				if (caseid < 0 || elem == t.terms.length-1) u.disabled = true;
				else {
					u.addEventListener("click",function() {
						var v = this.parentNode.parentNode.value;
						var e = this.parentNode.parentNode.elemId;
						var n = (e == 0? 0: project.terms[v].terms[e-1].lim);
						this.parentNode.parentNode.nextElementSibling.getElementsByClassName('b')[1].value = n;
						project.terms[v].terms.splice(e, 1);
						api.renderTerm(v);
					});
				}
				u.innerHTML = 'Удалить';
				c.appendChild(u);
			}
			e.appendChild(c);
		}
		
		x.appendChild(e);
	}
	
	this.renderTerm = function(val) {
		api.selectedTerm = val;
		document.getElementById('termoptions').innerHTML = '<div class="table r"><div class="t3"></div></div>';
		var i;
		for (i=0; i<document.getElementById('termlist').getElementsByClassName('b').length; i++) 
			document.getElementById('termlist').getElementsByClassName('b')[i].classList.remove('sel');
		document.getElementById('termlist').getElementsByClassName('b')[val+3].classList.add('sel');
		var u = document.getElementById('termoptions').getElementsByClassName('t3')[0];
		var p = document.createElement('div');
		p.className = 'pad';
		p.style = 'display:block';
		p.innerHTML = '';
		if (val == -3) {
			p.innerHTML = 'В данном режиме отствует возможность выбрать или создать терм. Вместо этого используется явное цифровое обозначение.<br><br>';
		}
		else {
			api.renderTermElem(val, -1, u);
			if (val >= 0 && project.terms[val].terms.length == 0) {
				project.terms[val].terms[0] = {};
				project.terms[val].terms[0].name = 'Терм';
				project.terms[val].terms[0].lim = 'Терм';
			}
			var t = (val<0?api.defTerms[val+3]:project.terms[val]);
			for (i=0; i<=t.terms.length; i++) {
				api.renderTermElem(val, i, u);
			}
		}
		
		p.innerHTML += 'Изменения сохраняются автоматически. Используется терм, который был открыт последним. <b>Все значения элементов и связей корректируются после закрытия редактирования исходя из используемого терма!</b>';
		document.getElementById('termoptions').appendChild(p);
		document.getElementById('t_name').value = (val >= 0?project.terms[val].name : (val == -1 ? api.defTerms[2].name : (val == -2 ?api.defTerms[1].name: api.defTerms[0].name)));
		document.getElementById('t_name').disabled = !(val>=0);
		if (val >= 0) {
			document.getElementById('t_name').classList.remove('na');
			document.getElementById('t_del').classList.remove('na');
			document.getElementById('t_del').addEventListener('click', api.requestDeletionTerm);
		}
		else {
			document.getElementById('t_name').classList.add('na');
			document.getElementById('t_del').classList.add('na');
			document.getElementById('t_del').removeEventListener('click', api.requestDeletionTerm);
		}
	}
	
	this.drawTerms = function(norefocus) {
		if (project.terms == undefined) project.terms = [];
		
		if (api.selectedTerm == undefined) api.selectedTerm = -3;
		document.getElementById('termlist').innerHTML = '';
		for (var i = -3; i<project.terms.length+1; i++) {
			var u, t;
			if (i < 0) {
				u = i+3;
				t = api.defTerms;
			}
			else {
				u = i;
				t = project.terms;
			}
			
			var el = document.createElement('div');
			el.classList = 'b fs';
			if (i !=project.terms.length) el.innerHTML = t[u].name;
			else el.innerHTML = '<i>Новый набор</i>';
			el.value = i;
			if (i != project.terms.length) el.addEventListener("click",function() {
				api.renderTerm(this.value)});
			else el.addEventListener("click",function() {
				var c, j;
				for (c=0; project.terms[c] != undefined; c++) 0;
				project.terms[c] = {};
				var x = project.terms[c];
				x.name = 'Новый набор '+c;
				x.terms = [];
				if (api.selectedTerm == -3) {
					x.terms[0] = {};
					x.terms[0].term = 'Терм 0';
					x.terms[0].lim = 1;
				}
				else {
					var u;
					if (api.selectedTerm < 0) u = api.defTerms[api.selectedTerm+3];
					else u = project.terms[api.selectedTerm];
					for (j=0; j<u.terms.length; j++) {
						x.terms.push({term:u.terms[j].term, lim:u.terms[j].lim});
					}
				}
				api.drawTerms();
				api.renderTerm(c)
			});
			document.getElementById('termlist').appendChild(el);
		}
		if (!norefocus) this.renderTerm(project.settings.term); 
		else document.getElementById('termlist').getElementsByClassName('b')[api.selectedTerm+3].classList.add('sel');
	}
	
	this.renderEffect= function(val, target) {
		var i;
		for (i=-2; i<project.cases.length; i++)
			document.getElementById('effectbutt'+target).getElementsByClassName('b')[i+2].classList.remove('sel');
		document.getElementById('effectbutt'+target).getElementsByClassName('b')[val+2].classList.add('sel');
		var u = document.getElementById('effectpad'+target);
		u.innerHTML = '';
		for (i=0; i<cache.types[2].length; i++) {
			var c = document.createElement('div');
			c.classList = 'line';
			c.style = 'font-weight:700;font-size:120%;margin:8px 0';
			c.innerHTML = getName(cache.types[2][i]);
			u.appendChild(c);
			for (var j=0; j<cache.types[0].length; j++) {
				c = document.createElement('div');
				c.classList = 'line';
				c.innerHTML = cache.elements[cache.types[2][i]].calcChance[cache.types[0][j]][val+2];
				if (project.settings.term != -3) c.innerHTML = getTermName(c.innerHTML);
				u.appendChild(c);
			}
			c = document.createElement('div');
			c.classList = 'line';
			c.innerHTML = cache.elements[cache.types[2][i]].finCalcChance[val+2];
			if (project.settings.term != -3) c.innerHTML = getTermName(c.innerHTML);
			u.appendChild(c);
		}
	}
	
	this.drawEffect = function() {
		for (var j=1; j<3; j++) {
			document.getElementById('effectbutt'+j).innerHTML = '<div class="table r"><div class="t3"><div class="t2"></div></div></div>';
			document.getElementById('effectbutt'+j).getElementsByClassName('t2')[0].innerHTML = '';
			for (var i = -2; i<project.cases.length; i++) {
				var s = '';
				if (i == -2) s = 'Все отключено';
				else if (i == -1) s = 'Все включено';
				else s = project.cases[i].name;
				
				var el2 = document.createElement('span');
				el2.classList = 't';
				
				var el = document.createElement('span');
				el.classList = 'b fs';
				el.innerHTML = s;
				el.value = i;
				el.target = j;
				el.addEventListener("click",function() {
					api.renderEffect(this.value, this.target)});
				el2.appendChild(el);
				document.getElementById('effectbutt'+j).getElementsByClassName('t2')[0].appendChild(el2);
			}
		}
		var l = document.getElementById('effectlist');
		l.innerHTML = '';
		for (i=0; i<cache.types[2].length; i++) {
			var c = document.createElement('div');
			c.classList = 'line';
			c.style = 'font-weight:700;font-size:120%;margin:8px 0';
			c.innerHTML = '&nbsp;';
			l.appendChild(c);
			for (j=0; j<cache.types[0].length; j++) {
				c = document.createElement('div');
				c.classList = 'line';
				c.innerHTML = getName(cache.types[0][j]);
				l.appendChild(c);
			}
			c = document.createElement('div');
			c.classList = 'line';
			c.innerHTML = '<i>Полный эффект</i>';
			l.appendChild(c);
		}
		api.renderEffect(-2, 1);
		api.renderEffect(-1, 2);
	}
	
	this.drawGraphs = function() {
		var el2 = document.getElementById('graphlist');
		var gel = document.getElementById('graphpad');
		el2.innerHTML = '';
		gel.innerHTML = '';
		var maxsum = 0;
		
		var el3 = document.createElement('div');
		el3.classList = 'line scale ax';
		el3.innerHTML = 'Общий риск';
		gel.appendChild(el3);
		for (var j=0; j<=4; j++) {
			el = document.createElement('div');
			el.innerHTML = '&nbsp';
			el.style.right = (4-j)*25+'%'; 
			el3.appendChild(el);
		}
		
		var el = document.createElement('div');
		el.classList = 'line ax';
		el.innerHTML = '&nbsp';
		el2.appendChild(el);
		
		for (var i = -2; i<project.cases.length; i++) {
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else s = project.cases[i].name;
			
			el = document.createElement('div');
			el.classList = 'line';
			el.innerHTML = s;
			el2.appendChild(el);
			
			if (maxsum < api.calcTSum(i)) maxsum = api.calcTSum(i);
		}
		var el4 = document.getElementById('graphscale');
		el4.innerHTML = '';
		for (i = 0; i<=4; i++) {
			el = document.createElement('div');
			el.innerHTML = parseInt(maxsum*i/4);
			el.style.right = (4-i)*25+'%'; 
			el4.appendChild(el);
		}
		for (i = -2; i<project.cases.length; i++) {
			el3 = document.createElement('div');
			el3.classList = 'line scale';
			gel.appendChild(el3);
			
			for (var j=0; j<=4; j++) {
				el = document.createElement('div');
				el.innerHTML = '&nbsp';
				el.style.right = (4-j)*25+'%'; 
				el3.appendChild(el);
			}
			
			el = document.createElement('span');
			el.className = 'c_b';
			el.innerHTML = api.calcCSum(i);
			el.style.width = 100*(api.calcCSum(i)/maxsum)+'%';
			el3.appendChild(el);
			
			el = document.createElement('span');
			el.className = 'c_c';
			el.innerHTML = api.calcTSum(i);
			el.style.width = 100*(api.calcSum(i)/maxsum)+'%';
			el3.appendChild(el);
		}
		
		for (var k=0; k<cache.types[2].length; k++) {
			var n = cache.types[2][k];
			el3 = document.createElement('div');
			el3.classList = 'line scale ax';
			el3.innerHTML = getName(n);
			gel.appendChild(el3);
			for (var j=0; j<=4; j++) {
				el = document.createElement('div');
				el.innerHTML = '&nbsp';
				el.style.right = (4-j)*25+'%'; 
				el3.appendChild(el);
			}
			
			el = document.createElement('div');
			el.classList = 'line ax';
			el.innerHTML = '&nbsp';
			el2.appendChild(el);
			for (var i = -2; i<project.cases.length; i++) {
				var s = '';
				if (i == -2) s = 'Все отключено';
				else if (i == -1) s = 'Все включено';
				else s = project.cases[i].name;
				el = document.createElement('div');
				el.classList = 'line';
				el.innerHTML = s;
				el2.appendChild(el);
			
				el3 = document.createElement('div');
				el3.classList = 'line scale';
				gel.appendChild(el3);
				for (var j=0; j<=4; j++) {
					el = document.createElement('div');
					el.innerHTML = '&nbsp';
					el.style.right = (4-j)*25+'%'; 
					el3.appendChild(el);
				}
				
				el = document.createElement('span');
				el.className = 'c_b';
				el.innerHTML = (cache.elements[n].costs[i+2]);
				el.style.width = 100*((cache.elements[n].costs[i+2])/maxsum)+'%';
				el3.appendChild(el);
			}
		}
	}
	
	this.renderMatrix= function(val) {
		var i;
		for (i=-2; i<project.cases.length; i++)
			document.getElementById('matrixbutt').getElementsByClassName('b')[i+2].classList.remove('sel');
		document.getElementById('matrixbutt').getElementsByClassName('b')[val+2].classList.add('sel');
		
		var u = document.getElementById('matrixpad');
		u.innerHTML = '<div class="table r"><div class="t3"></div></div>';
		
		var ut3 = u.getElementsByClassName('t3')[0];
		for (i=-1; i<project.elements.length; i++) {
			if ((i>-1) && (project.elements[i] == undefined)) continue;
			var ut2 = document.createElement('div');
			ut2.className = 't2';
			if ((i != -1) && ((project.elements[i].type == 4) || (project.elements[i].type == 5))) ut2.classList.add('hd');
			for (var j=-1; j<project.elements.length; j++) {
				if ((j>-1) && (project.elements[j] == undefined)) continue;
				var ut = document.createElement('div');
				ut.className = 't';
				if ((j != -1) && ((project.elements[j].type == 4) || (project.elements[j].type == 5))) ut.classList.add('hd');
				if ((i == -1) && (j!= -1)) {
					ut.innerHTML = getCode(j);
					ut.title = getName(j);
				}
				else if ((i != -1) && (j == -1)) {
					ut.innerHTML = getCode(i);
					ut.title = getName(i);
				}
				else ut.innerHTML = '—';
				ut.row = i;
				ut.column = j;
				ut.addEventListener('mouseover',api.matrixRefreshHighLight);
				ut2.appendChild(ut);
			}
			ut3.appendChild(ut2);
		}
		
		for (i = 0; i<project.bonds.length; i++) {
			if (project.bonds[i] == undefined) continue;
			var x = ut3.getElementsByClassName('t2')[project.bonds[i].first+1].getElementsByClassName('t')[project.bonds[i].second+1];
			if (project.settings.term == -3) x.innerHTML = getBondVal(i, val);
			else x.innerHTML = getTermName(getBondVal(i, val));
		}
	}
	
	this.matrixRefreshHighLight = function() {
		for (var i=0; i<=project.elements.length; i++) {
			document.getElementById('matrixpad').getElementsByClassName('t2')[0].getElementsByClassName('t')[i].classList.remove('lit');
			document.getElementById('matrixpad').getElementsByClassName('t2')[i].getElementsByClassName('t')[0].classList.remove('lit');
		}
		document.getElementById('matrixpad').getElementsByClassName('t2')[0].getElementsByClassName('t')[this.column+1].classList.add('lit');
		document.getElementById('matrixpad').getElementsByClassName('t2')[this.row+1].getElementsByClassName('t')[0].classList.add('lit');
	}
	
	this.drawMatrix = function() {
		api.hoveredMatrixColumn = -1;
		api.hoveredMatrixRow = -1;
		document.getElementById('matrixbutt').innerHTML = '<div class="table r"><div class="t3"><div class="t2"></div></div></div>';
		document.getElementById('matrixbutt').getElementsByClassName('t2')[0].innerHTML = '';
		if (project.cases == undefined) project.cases = [];
		for (var i = -2; i<project.cases.length; i++) {
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else s = project.cases[i].name;
			
			var el2 = document.createElement('span');
			el2.classList = 't';
			
			var el = document.createElement('span');
			el.classList = 'b fs';
			el.innerHTML = s;
			el.value = i;
			el.addEventListener("click",function() {
				api.renderMatrix(this.value)});
			el2.appendChild(el);
			document.getElementById('matrixbutt').getElementsByClassName('t2')[0].appendChild(el2);
		}
		api.renderMatrix(-2);
	}
	
	this.callWindow = function(id,arg1,arg2,arg3) {
		t = false;
		tx = 0;
		ty = 0;
		if (arg1 == "edit") {
			id = arg1+"e"+arg2;
		}
		else if (arg1 == "editb") {
			id = arg1+arg2;
		}
		if (this.windows[id]) 
		{	
			var e = document.getElementById(id).getElementsByClassName("w")[0];
			/*e.style.top = '';
			e.style.left = '';
			e.style.top = getComputedStyle(e).getPropertyValue("top");
			e.style.left = getComputedStyle(e).getPropertyValue("left");
			
			if (id =="side") {
				e.style.left = document.body.clientWidth-parseInt(getComputedStyle(e).getPropertyValue("width")) + 'px';
				e.style.top = getComputedStyle(document.getElementById('top')).getPropertyValue("height");
			}*/
			this.windowOnTop(id);
			return;
		}
		this.windows[id] = true;
		if (id == "settings") {
			document.getElementById("settings_button").classList.add("sel");
			document.getElementById("settings").classList.toggle("d");
			//this.loadSettings();
			this.putSettings();
		}
		else if (id == "side") {
			document.getElementById("side_button").classList.add("sel");
			document.getElementById("side").classList.toggle("d");
		}
		else if (id == "project") {
			this.putMetas();
			document.getElementById("project_button").classList.add("del");
			document.getElementById("project").classList.toggle("d");
		}
		else if (id == "cases") {
			this.drawCases();
			document.getElementById("cases").classList.toggle("d");
		}
		else if (id == "terms") {
			this.drawTerms();
			document.getElementById("terms").classList.toggle("d");
		}
		else if (id == "matrix") {
			this.drawMatrix();
			document.getElementById("matrix").classList.toggle("d");
		}
		else if (id == "effect") {
			Recompile();
			this.drawEffect();
			document.getElementById("effect").classList.toggle("d");
		}
		else if (id == "graphs") {
			Recompile();
			this.drawGraphs();
			document.getElementById("graphs").classList.toggle("d");
		}
		else if (id == "inst") {
			document.getElementById("inst").classList.toggle("d");
		}
		else if (id == "instb") {
			document.getElementById("instb").classList.toggle("d");
		}
		else if (id == "save") {
			this.includeSaves(document.getElementById("savelist"),this.getSaves(),true,"savepad", 'saves');
			document.getElementById("save_button").classList.add("sel");
			document.getElementById("save").classList.toggle("d");
			
		}
		else if (id == "load") {
			var o = this.getSaves();
			if ((o == undefined) || (o.length == 0)) {
				windows.error.content = "Сохраненные проекты отсутствуют! Если вы не можете найти уже сохраненный проект, запустите программу с того же самого места, где вы ее запускали в прошлый раз.";
				this.callPopup2(windows.error);
				this.windows[id] = false;
				return;
			}
			else {
				this.includeSaves(document.getElementById("loadlist"),o,false,"loadpad", 'loads');
				document.getElementById("load_button").classList.add("sel");
				document.getElementById("load").classList.toggle("d");
			}
		}
		else if (id == "export") {
			document.getElementById("save_button").classList.add("sel");
			document.getElementById("export").classList.toggle("d");
			document.getElementsByClassName("ex_c")[0].value = JSON.stringify(project);
			document.querySelector('#export .exportlink').innerHTML = '';
		}
		else if (id == "import") {
			document.getElementById("load_button").classList.add("sel");
			document.getElementById("import").classList.toggle("d");
		}
		else if (arg1 == "edit") {
			var ec, exists = (document.getElementById(id) !== null);
			if (exists) ec = document.getElementById(id);
			else {
				ec = document.createElement("div");
				ec.innerHTML = document.getElementById("_edit_template_").innerHTML;
				ec.id = id;
			}
			ec.classList.toggle("d");
			
			if (!exists) {
				ec.getElementsByClassName("_сс_close2")[0].addEventListener("click", function() {api.closeWindow(id)});
				ec.getElementsByClassName("_сс_apply")[0].addEventListener("click", function() {createAndAddElement(id,true);api.closeWindow(id)});
				ec.getElementsByClassName("_сс_delete")[0].addEventListener("click", function() {api.requestDeletion(arg2)});
				document.getElementById("windows").appendChild(ec);
			}
		}
		else if (arg1 == "editb") {
			var ec, exists = (document.getElementById(id) !== null);
			if (exists) ec = document.getElementById(id);
			else {
				ec = document.createElement("div");
				ec.innerHTML = document.getElementById("_editb_template_").innerHTML;
				ec.id = id;
			}
			ec.classList.toggle("d");
			
			if (!exists) {
				ec.getElementsByClassName("_сс_close2")[0].addEventListener("click", function() {api.closeWindow(id)});
				ec.getElementsByClassName("_сс_apply")[0].addEventListener("click", function() {createAndAddBond(id,true);api.closeWindow(id)});
				ec.getElementsByClassName("_сс_delete")[0].addEventListener("click", function() {api.requestDeletionBond(arg2)});
				document.getElementById("windows").appendChild(ec);
			}
		}
		else {
			this.windows[id] = undefined;
			return;
		}
		tid = id;
		this.windowOnTop(id);
		var e = document.getElementById(id).getElementsByClassName("w")[0];
		e.style.top = '';
		e.style.left = '';
		e.style.top = getComputedStyle(e).getPropertyValue("top");
		e.style.left = getComputedStyle(e).getPropertyValue("left");
		if (id =="side") {
			e.style.left = document.body.clientWidth-parseInt(getComputedStyle(e).getPropertyValue("width")) + 'px';
			e.style.top = getComputedStyle(document.getElementById('top')).getPropertyValue("height");
		}
		
		
		document.getElementById(id).getElementsByClassName("w")[0].addEventListener("mousedown", function() {
			api.windowOnTop(this.parentNode.id);
		});
		
		if (document.getElementById(id).getElementsByClassName("h")[0] != undefined) {
			if (arg1 == "editb") {
				document.getElementById(id).getElementsByClassName("elist")[0].getElementsByTagName("table")[0].addEventListener("mouseover", function() {
					api.enElSel = true;
				});
				document.getElementById(id).getElementsByClassName("elist")[0].getElementsByTagName("table")[0].addEventListener("mouseout", function(event) {
					api.enElSel = false;
				});
			}
			if (arg1 == "edit") {
				document.getElementById(id).getElementsByClassName("blist")[0].getElementsByTagName("table")[0].addEventListener("mouseover", function() {
					api.enBSel = true;
				});
				document.getElementById(id).getElementsByClassName("blist")[0].getElementsByTagName("table")[0].addEventListener("mouseout", function(event) {
					api.enBSel = false;
				});
			}
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousedown", this.initWindowMove);
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mousemove", function(event) {
				if (t != this.parentNode.parentNode.id) return;
				var el = document.getElementById(id).getElementsByClassName("w")[0];
				
				el.style.top = (event.clientY-ty)+'px';
				el.style.left = (event.clientX-tx)+'px';
				if (event.clientY-ty < 0) el.style.top = '0px';
				if (event.clientX-tx < 0) el.style.left = '0px';
				if (event.clientX-tx > document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))) el.style.left = document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))+'px';
				if (event.clientY-ty > document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))) el.style.top = document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))+'px';
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("mouseup", function() {
				t=false;
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchstart", this.initWindowMoveTouch);
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchmove", function(event) {
				if (t != this.parentNode.parentNode.id) return;
				var el = document.getElementById(id).getElementsByClassName("w")[0];
				
				el.style.top = (event.clientY-ty)+'px';
				el.style.left = (event.clientX-tx)+'px';
				if (event.clientY-ty < 0) el.style.top = '0px';
				if (event.clientX-tx < 0) el.style.left = '0px';
				if (event.clientX-tx > document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))) el.style.left = document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width'))+'px';
				if (event.clientY-ty > document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))) el.style.top = document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height'))+'px';
			});
			
			document.getElementById(id).getElementsByClassName("h")[0].addEventListener("touchend", function() {
				t=false;
			});
		}
	}
	
	this.recalcWindows = function() {
		for (var i=0; i<api.zindex.length; i++) {
			if (document.getElementById(api.zindex[i]) != undefined) {
				var el = document.getElementById(api.zindex[i]).getElementsByClassName('w')[0];
				if (api.zindex[i] != 'side') {
					el.style.top = parseInt(el.style.top)*document.body.clientHeight/api.windowHeight+'px';
					el.style.left = parseInt(el.style.left)*document.body.clientWidth/api.windowWidth+'px';
				}
				else {el.style.left = '99999px'}
				if (parseInt(el.style.top)+parseInt(getComputedStyle(el).getPropertyValue('height'))>document.body.clientHeight) 
					el.style.top = document.body.clientHeight-parseInt(getComputedStyle(el).getPropertyValue('height')) + 'px';
				if (parseInt(el.style.left)+parseInt(getComputedStyle(el).getPropertyValue('width'))>document.body.clientWidth) 
					el.style.left = document.body.clientWidth-parseInt(getComputedStyle(el).getPropertyValue('width')) + 'px';
			}
		}
		api.windowHeight = document.body.clientHeight;
		api.windowWidth = document.body.clientWidth;
	}
	
	this.switchWindowState = function(id) {
		var e = document.getElementById(id).getElementsByClassName('w')[0];
		e.classList.toggle('hidd');
		if (id != 'xsm') e.classList.toggle('xsm');
		if (document.getElementById(id).getElementsByClassName('back') != null && e.classList.contains('huge')) document.getElementById(id).getElementsByClassName('back')[0].classList.toggle('hd');
		if (e.classList.contains('huge')) {
			e.style.top = '';
			e.style.left = '';
			e.style.top = getComputedStyle(e).getPropertyValue("top");
			e.style.left = getComputedStyle(e).getPropertyValue("left");
		}
	}
	
	this.switchWindowSize = function(id) {
		var e = document.getElementById(id).getElementsByClassName('w')[0];
		e.classList.toggle('huge');
		if (id !== 'popUp') {
			e.style.top = '';
			e.style.left = '';
			e.style.top = getComputedStyle(e).getPropertyValue("top");
			e.style.left = getComputedStyle(e).getPropertyValue("left");
			document.getElementById(id).getElementsByClassName('back')[0].classList.toggle('hd');
		}
	}
	
	this.rearrangeWindows = function() {
		for (var i=0; i<this.zindex.length; i++) {
			if (document.getElementById(this.zindex[i]) != undefined) document.getElementById(this.zindex[i]).style.zIndex = i;
		}
	}
	
	this.unvokeTermUpdate = function() {
		for (var i=0; i<api.zindex.length; i++) {
			if (api.zindex[i].startsWith('editb') || api.zindex[i].startsWith('edite')) {
				var e = document.getElementById(api.zindex[i]);
				var uz = (api.zindex[i].startsWith('editb')?"cc_v":"cc_effect");
				var us = e.getElementsByClassName(uz)[0];
				us.value = parseFloat(us.value);
				if (us.value < 0) us.value = 0;
				if (us.value > 1) us.value = 1;
				if (project.settings.term == -3) {
					e.getElementsByClassName("cc_vsel")[0].classList.add('hd');
					us.classList.remove('hd');
					us.value = getValueOfTerm(e.getElementsByClassName("cc_vsel")[0].selectedIndex);
				}
				else {
					us.classList.add('hd');
					var u = e.getElementsByClassName("cc_vsel")[0];
					u.classList.remove('hd');
					u.innerHTML = '';
					
					var t = api.getTermsPattern(project.settings.term);
					for (var j=0; j<t.terms.length; j++) {
						var c = document.createElement('option');
						c.selected = (j == getTermInterval(parseFloat(us.value)));
						c.innerHTML = t.terms[j].term;
						c.value = j;
						u.appendChild(c);
					}
				}
				var id = e.getElementsByClassName('cc_id')[0].value;
				if (api.zindex[i].startsWith('edite')) api.includeBonds(e.getElementsByClassName("blist")[0].getElementsByTagName("table")[0],id);
				else api.includeElements(e.getElementsByClassName("elist")[0].getElementsByTagName("table")[0], id);
			}
		}
		update();
		api.closePopup();
	}
	
	this.closeWindow = function(id) {
		if (this.windows[id] == undefined) return;
		document.getElementById(id).classList.toggle("d");
		if (id == "settings") document.getElementById("settings_button").classList.remove("sel");
		else if (id == "terms") {
			setTimeout(api.unvokeTermUpdate, 10);
			this.callPopup2(windows.loader);
			project.settings.term = api.selectedTerm;
		}
		else if (id == "side") document.getElementById("side_button").classList.remove("sel");
		else if ((id == "save") || (id == "export")) document.getElementById("save_button").classList.remove("sel");
		else if ((id == "load") || (id == "import")) document.getElementById("load_button").classList.remove("sel");
		var i;
		for (i=0; this.zindex[i]!=id; i++) {0;}
		this.zindex.splice(i, 1);
		if (this.zindex.length>0) this.windowOnTop(this.zindex[this.zindex.length-1])
		
		if (this.activeWindow == id) this.activeWindow = undefined;
		this.windows[id] = undefined;
		if (api.settings.tooltips) api.forceRedraw = true;
		api.rearrangeWindows();
	}
	
	this.loadDefault = function() {
		this.settings.showLabel = true;
		this.settings.palette = true;
		this.settings.nightMode = (this.locationName == "nightly");
		this.settings.debug = (this.locationName == "nightly");
		this.settings.bottomHidden = false;
		this.settings.topFontSize = 1.4;
		this.settings.glFontSize = 100;
		this.settings.dontShowAlerts = false;
		this.settings.transparency = false;
		this.settings.cursor = true;
		this.settings.color = new Array('#bb0000','#bbbb00','#0000bb','#00bb00','#8000bb','#00bbbb','#006600');
		this.settings.showGrid = true;
		this.settings.redGrid = true;
		this.settings.autosave = 5;
		this.settings.autoload = true;
		this.settings.elemLabels = true;
		this.settings.actualNames = true;
		
		this.settings.chInterval = 33;
		this.settings.canvasSize = 100;
		this.settings.elemSize = 20;
		this.settings.tooltips = true;
		
		if (this.locationName == "nightly") this.settings.lastVersion = this.version.b;
		else this.settings.lastVersion = this.version.g+'['+this.version.b+'] '+this.version.s;
		
		localStorage["hasSettings"] = true;
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.topFontSize();
		this.glFontSize();
		this.fontSwitch();
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.styleSwitch('bottomHidden','bottomHidden',false,false,false);
		this.styleSwitch('night','nightMode',false,false,false);
		this.styleSwitch('transparentActive','transparency',false,false,false);
		
		this.forceRedraw = true;
	}
	
	this.fixSettings = function () {
		if (this.settings.chInterval == undefined) this.settings.chInterval = 33;
		if (this.settings.canvasSize == undefined) this.settings.canvasSize = 100;
		if (this.settings.elemSize == undefined) this.settings.elemSize = 20;
		if (this.settings.showGrid == undefined) this.settings.showGrid = true;
		if (this.settings.redGrid == undefined) this.settings.redGrid = true;
		if (this.settings.autosave == undefined) this.settings.autosave = 0;
		if (this.settings.autoload == undefined) this.settings.autoload = false;
		if (this.settings.activeElems == undefined) this.settings.activeElems = false;
		this.saveSettings();
		this.loadSettings();
	}
	
	this.loadSettings = function() {
		try {
			this.settings = JSON.parse(localStorage["fcm2.settings"]);
			if (!this.updated) {
				if (this.locationName == "nightly") this.updated = this.version.b;
				else this.updated = this.version.g+'['+this.version.b+'] '+this.version.s;
				if (this.updated == this.settings.lastVersion) this.updated = false;
			}
		}
		catch (ex) {
			windows.loadError.content = 'Не удалось загрузить настройки программы. После нажатия кнопки, настройки будут сброшены в значение по умолчанию, все сохраненные ранее проекты останутся без изменений. Если ошибка будет повторяться, свяжитесь с разработчиками.<br><br>Описание ошибки:<br>'+ex;
			this.callPopup2(windows.startupError);
			api.error = true;
			if (api.settings.debug) throw ex;
		}
	}
	
	this.saveSettings = function() {
		localStorage["fcm2.settings"] = JSON.stringify(this.settings);
		api.initRTS();
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
		this.settings.nightMode ? "linear-gradient(to right, #500 0% , #500 "+size*100/5000+"%, #050 "+size*100/5000+"%, #050 100%)" : "linear-gradient(to right, #faa 0% , #faa "+size*100/5000+"%, #afa "+size*100/5000+"%, #afa 100%)";
		var i;
		for (i=0; i<7; i++) {
			document.getElementById("settings").getElementsByClassName("color")[i].value = this.settings.color[i];
			document.getElementById("settings").getElementsByClassName("color2")[i].value = this.settings.color[i];
		}
		document.getElementById("st_labels").checked = this.settings.showLabel;
		document.getElementById("st_debug").checked = this.settings.debug;
		document.getElementById("st_tooltips").checked = this.settings.tooltips;
		document.getElementById("st_topfontsize").value = this.settings.topFontSize;
		document.getElementById("st_glfontsize").value = this.settings.glFontSize;
		document.getElementById("st_elemsize").value = this.settings.elemSize;
		document.getElementById("st_grid").checked = this.settings.showGrid;
		document.getElementById("st_redGrid").checked = this.settings.redGrid;
		document.getElementById("st_cursor").checked = this.settings.cursor;
		document.getElementById("st_transparency").checked = this.settings.transparency;
		document.getElementById("st_autosave").value = this.settings.autosave;
		document.getElementById("st_autoload").checked = this.settings.autoload;
		document.getElementById("st_elemLabels").checked = this.settings.elemLabels;
		document.getElementById("st_actualNames").checked = this.settings.actualNames;
		
		document.getElementById("st_debugInterval").value = this.settings.chInterval;
		document.getElementById("st_debugCanvasSize").value = this.settings.canvasSize;
		
		for (i=0; i<document.getElementById('settings').getElementsByClassName("ac").length; i++) api.switchElemState(document.getElementById('settings').getElementsByClassName("ac")[i]);
	}
	
	this.getSettings = function() {
		this.settings.showLabel = document.getElementById("st_labels").checked;
		this.settings.debug = document.getElementById("st_debug").checked;
		this.settings.tooltips = document.getElementById("st_tooltips").checked;
		this.settings.topFontSize = parseFloat(document.getElementById("st_topfontsize").value);
		this.settings.glFontSize = parseInt(document.getElementById("st_glfontsize").value);
		this.settings.elemSize = parseInt(document.getElementById("st_elemsize").value);
		this.settings.showGrid = document.getElementById("st_grid").checked;
		this.settings.redGrid = document.getElementById("st_redGrid").checked;
		this.settings.cursor = document.getElementById("st_cursor").checked;
		this.settings.transparency = document.getElementById("st_transparency").checked;
		this.settings.autosave = parseInt(document.getElementById("st_autosave").value);
		this.settings.autoload = document.getElementById("st_autoload").checked;
		this.settings.elemLabels = document.getElementById("st_elemLabels").checked;
		this.settings.actualNames = document.getElementById("st_actualNames").checked;
		
		this.settings.chInterval = parseInt(document.getElementById("st_debugInterval").value);
		this.settings.canvasSize = parseInt(document.getElementById("st_debugCanvasSize").value);
		
		if (this.settings.topFontSize < 0.8) this.settings.topFontSize=0.8;
		if (this.settings.topFontSize > 2.5) this.settings.topFontSize=2.5;
		if (this.settings.glFontSize < 25) this.settings.glFontSize=25;
		if (this.settings.glFontSize > 200) this.settings.glFontSize=200;
		if (this.settings.elemSize < 7) this.settings.elemSize=25;
		if (this.settings.elemSize > 100) this.settings.elemSize=200;
		if (this.settings.autosave < 0) this.settings.autosave=0;
		if (this.settings.autosave > 0 && this.autosaveInterval == 0) this.autosaveInterval = this.settings.autosave*1000*60;
		if (this.settings.autosave == 0) this.autosaveInterval = 0;
		var i;
		for (i=0; i<7; i++) {
			if (this.settings.palette) this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color")[i].value;
			else this.settings.color[i] = document.getElementById("settings").getElementsByClassName("color2")[i].value;
		}
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.styleSwitch('transparentActive','transparency',false,false,false);
		this.styleSwitch('customCursor','cursor',false,false,false);
		this.topFontSize();
		this.glFontSize();
		this.fontSwitch();
			
		this.forceRedraw = true;
		update();
	}
	
	this.putMetas = function() {
		document.getElementById('m_id').value = project.id;
		if (project.meta != undefined) {
			document.getElementById('m_descript').value = project.meta.description;
			document.getElementById('m_ts_created').value = project.meta.timeCreated;
			document.getElementById('m_ts_saved').value = project.meta.timeSaved;
			document.getElementById('m_compress').checked = project.meta.compress;
			document.getElementById('m_encrypt').checked = project.meta.encrypt;
			if (project.meta.encrypt) {
				document.getElementById('m_pass1').value = project.meta.password;
				document.getElementById('m_pass2').value = project.meta.password;
			}
			
		}
		if (project.settings != undefined) {
			document.getElementById('m_strict').checked = project.settings.strict;
			document.getElementById('m_propsize').checked = project.settings.proportional;
			document.getElementById('m_propcolor').checked = project.settings.propColor;
		}
		
		var ec = document.getElementById('m_calcfunc');
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (i == project.settings.calcFunc) {
				ec.querySelectorAll('.acr input')[i].checked = true;
				api.switchRadioElemState(ec.querySelectorAll('.acr')[i]);
			}
			else {
				ec.querySelectorAll('.acr')[i].checked = false;
			}
		}
		
		for (i=0; i<document.getElementById('project').getElementsByClassName("ac").length; i++) api.switchElemState(document.getElementById('project').getElementsByClassName("ac")[i]);
	}
	
	this.getMetas = function() {
		if (document.getElementById('m_encrypt').checked) {
			if (document.getElementById('m_pass1').value != document.getElementById('m_pass2').value) {
				api.addMessage('Пароли не совпадают','red');
				return;
			}
			if (document.getElementById('m_pass1').value.length < 4) {
				api.addMessage('Пароль слишком короткий','red');
				return;
			}
		}
		project.id = document.getElementById('m_id').value;
		var t = new Date();
		project.meta  = {};
		project.meta.description = document.getElementById('m_descript').value;
		project.meta.timeCreated = parseInt(document.getElementById('m_ts_created').value);
		if (isNaN(project.meta.timeCreated)) project.meta.timeCreated = t.getTime();
		project.meta.timeSaved = parseInt(document.getElementById('m_ts_saved').value);
		if (isNaN(project.meta.timeSaved)) project.meta.timeSaved = t.getTime();
		project.meta.compress = document.getElementById('m_compress').checked;
		project.meta.encrypt = document.getElementById('m_encrypt').checked;
		if (project.meta.encrypt) project.meta.password = document.getElementById('m_pass1').value;
		project.settings = {term:project.settings.term};
		project.settings.strict = document.getElementById('m_strict').checked;
		project.settings.proportional = document.getElementById('m_propsize').checked;
		project.settings.propColor = document.getElementById('m_propcolor').checked;
		var ec = document.getElementById('m_calcfunc'), t=0;
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (ec.querySelectorAll('.acr input')[i].checked) {
				t=i;
				break;
			}
		}
		project.settings.calcFunc = t;
		api.compiled = false;
		api.initRTS();
		this.closeWindow('project');
		
	}
	
	this.resetData = function() {
		delete this.settings;
		this.settings = {};
		localStorage.clear();
		this.loadDefault();
		this.saveSettings();
		location.reload();
	}
	
	this.mouseListener = function(e, ec) {
		var cc = document.getElementById("c").getBoundingClientRect();
		api.mouse.X = parseInt(e.clientX-cc.left);
		api.mouse.Y = parseInt(e.clientY-cc.top);
		if (ec || (e.which == 0)) api.mouse.button = e.buttons;
		document.getElementById("debug_mouseInfo").innerHTML = api.mouse.X+':'+api.mouse.Y+' ['+api.mouse.button+']';
		document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
	}
	
	this.keyListener = function(e, ev) {
		if (((ev.target.nodeName == 'INPUT') || (ev.target.nodeName == 'TEXTAREA')) && e!=13 && e!=27) return;
		document.getElementById("debug_keyInfo").innerHTML = e;
		var t, i;
		t = document.getElementById('top');
		if (document.querySelectorAll('#windows .d .back').length == 0) {
			switch (e) {
				case 79: if (ev.ctrlKey) {ev.preventDefault(); t.getElementsByClassName('b')[3].click()}; break;
				case 83: if (ev.ctrlKey) {ev.preventDefault(); t.getElementsByClassName('b')[5].click(); t.getElementsByClassName('b')[7].click(); document.querySelectorAll('#export .table .b')[1].click(); document.querySelectorAll('#export .table .b')[0].click();} break;
				case 112: ev.preventDefault(); t.getElementsByClassName('b')[11].click(); break;
				case 113: ev.preventDefault(); t.getElementsByClassName('b')[2].click(); break;
				case 114: ev.preventDefault(); t.getElementsByClassName('b')[5].click(); break;
				case 115: ev.preventDefault(); t.getElementsByClassName('b')[9].click(); document.querySelectorAll('.table.ps .b')[0].click(); break;
				case 117: ev.preventDefault(); t.getElementsByClassName('b')[10].click(); break;
				case 118: ev.preventDefault(); t.getElementsByClassName('b')[9].click(); document.querySelectorAll('.table.ps .b')[2].click(); break;
			}
		}
		if (api.zindex == 'side' && document.querySelectorAll('#popUp.d').length == 0) {
			if (document.getElementById('pad1').style.display == 'block') {
				t = document.getElementById('pad1');
				switch (e) {
					case 27: {
						if (api.brush == 99) api.brush = 0;
						else if (api.brush == 97) api.brush = -2;
						else document.getElementById('brush-1').click(); 
						api.forceRedraw = true;
						break;
					}
					case 192: document.getElementById('brush-3').click(); break;
					case 48: document.getElementById('brush0').click(); break;
					case 49: document.getElementById('brush1').click(); break;
					case 50: document.getElementById('brush2').click(); break;
					case 51: document.getElementById('brush6').click(); break;
					case 52: document.getElementById('brush3').click(); break;
					case 53: document.getElementById('brush4').click(); break;
					case 54: document.getElementById('brush5').click(); break;
				}
			}
		}
		else {
			t = document.getElementById(api.zindex[api.zindex.length-1]);
			if (document.querySelectorAll('#popUp.d').length > 0) t = document.getElementById('popUp');
			switch (e) {
				case 27: 
					for (i=0; i<t.querySelectorAll('.table .b').length; i++) {
						if (t.querySelectorAll('.table .b')[i].innerHTML == 'Отмена') {
							t.querySelectorAll('.table .b')[i].click();
							break;
						}
					} 
					break;	
				case 13: 
					for (i=0; i<t.querySelectorAll('.table .b').length; i++) {
						var t2 = t.querySelectorAll('.table .b')[i].innerHTML;
						if (t2 == 'ОК' || t2 == 'Открыть' || t2 == 'Сохранить' || t2 == 'Продолжить') {
							t.querySelectorAll('.table .b')[i].click();
							break;
						}
					} 
					for (i=0; i<t.querySelectorAll('.table .b').length; i++) {
						if (t.querySelectorAll('.table .b')[i].innerHTML == 'Применить') {
							t.querySelectorAll('.table .b')[i].click();
							break;
						}
					}
					break;
					
				case 46: 
					for (i=0; i<t.querySelectorAll('.table .b').length; i++) {
						if (t.querySelectorAll('.table .b')[i].innerHTML == 'Удалить') {
							t.querySelectorAll('.table .b')[i].click();
							break;
						}
					} 
					break;
			}
		}
	}
	
	this.mouseWheelListener = function(e) {
		if (e.deltaY > 0 && project.viewport.z<50) project.viewport.z*=1.25;
		if (e.deltaY < 0 && project.viewport.z>0.0125) project.viewport.z/=1.25;
		if (e.deltaY != 0) api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
	}
	
	this.mouseClickListener = function(e) {
		if (doMoving.act) return;
		if (e.which == 3) {
			rClickListener(e);
			return;
		}
		for (var i=0; i<api.mouse.onclick.length; i++) api.mouse.onclick[i]();
	}
	
	this.pinchListener = function(e) {
		if (!api.mouse.pinching) {
			api.mouse.stPinch = Math.sqrt(
				(e.changedTouches[0].pageX - e.changedTouches[1].pageX) * (e.changedTouches[0].pageX - e.changedTouches[1].pageX) +
				(e.changedTouches[0].pageY - e.changedTouches[1].pageY) * (e.changedTouches[1].pageY - e.changedTouches[1].pageY));
			api.mouse.stZoom = project.viewport.z;
			api.mouse.pinching = true;
		}
		else {
			var t = Math.sqrt(
				(e.changedTouches[0].pageX - e.changedTouches[1].pageX) * (e.changedTouches[0].pageX - e.changedTouches[1].pageX) +
				(e.changedTouches[0].pageY - e.changedTouches[1].pageY) * (e.changedTouches[1].pageY - e.changedTouches[1].pageY));
			project.viewport.z = api.mouse.stZoom * (api.mouse.stPinch / t);
			if (project.viewport.z>50) project.viewport.z=50;
			if (project.viewport.z<0.0125) project.viewport.z=0.0125;
		}
		api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
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
			document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
		}
		return false;
	}
	
	this.switchElemState = function(e) {
		if (!e.classList.contains('ac')) e = e.parentNode;
		if (e.getElementsByTagName("input")[0].checked) e.classList.add("sel");
		else e.classList.remove("sel");
	}
	
	this.switchRadioElemState = function(e) {
		if (!e.classList.contains('acr')) e = e.parentNode;
		for (var i=0; i<e.parentNode.childNodes.length; i++) {
			if (e.parentNode.childNodes[i].classList != undefined)
				if (e.parentNode.childNodes[i].classList.contains('acr')) e.parentNode.childNodes[i].classList.remove('sel');
		}
		e.classList.add("sel");
	}
	
	this.initRTSCases = function() {
		var c = document.getElementById('RTS_cases');
		c.innerHTML = '';
		for (var i=-2; i<project.cases.length; i++) {
			var n;
			if (i==-2) n = 'Все отключено';
			else if (i==-1) n = 'Все включено';
			else n = project.cases[i].name;
			
			c.innerHTML += '<label class="b ilb stillsel acr fs rtm project" name="currentCase" style="font-weight:normal"><input type="radio" name="m_cv" value="'+i+'"> '+n+'</label>';
		}
		
		var ele = c.getElementsByClassName("acr");
		for (var i=0; i<ele.length; i++) ele[i].addEventListener("click", function(e) {
			api.switchRadioElemState(e.target);
			api.runTimeSettings(e.target);
		});
	}
	
	this.initRTS = function() {
		var ele = document.getElementsByClassName("rtm");
		for (var i=0; i<ele.length; i++) {
			var c, e=ele[i].getElementsByTagName('input')[0];
			if (ele[i].classList.contains('api')) c = api;
			else if (ele[i].classList.contains('project')) c = project;
			
			if (ele[i].classList.contains('ac')) {
				if (e.checked != c.settings[ele[i].getAttribute('name')]) {
					e.checked = c.settings[ele[i].getAttribute('name')];
					api.switchElemState(ele[i]);
				}
			}
			else if (ele[i].classList.contains('acr')) {
				if ((e.value==c.settings[ele[i].getAttribute('name')]) && !e.checked) {
					e.checked = true;
					api.switchRadioElemState(ele[i]);
				}
			}
		}
	}
	
	this.runTimeSettings = function (e) {
		if (!e.classList.contains('rtm')) e = e.parentNode;
		
		var c;
		if (e.classList.contains('api')) c = api;
		else if (e.classList.contains('project')) c = project;
		
		if (e.classList.contains('ac')) c.settings[e.getAttribute('name')] = e.getElementsByTagName('input')[0].checked;
		else if (e.classList.contains('acr')) c.settings[e.getAttribute('name')] = parseFloat(e.getElementsByTagName('input')[0].value);
		
		api.forceRedraw = true;
	}
	
	this.init = function(fatal) {
		windows.startupError = {header:'Ошибка!',size:1,buttons:[{functions:'api.loadDefault();api.saveSettings();api.closePopup();',red:true,name:'Установить умолчания'}],windowsize:'sm'};
		if (window.location.hostname == "") this.locationName = "local";
		else if (window.location.hostname == "stsyn.github.io") this.locationName = "nightly";
		else if (window.location.hostname == "vtizi.ugatu.su") this.locationName = "stable";
		else this.locationName = "unknown";
		
		this.mouse.pressed = false;
		this.mouse.click = false;
		this.sort = 0;
		appInit();
		
		if (fatal) {
			document.getElementsByTagName("body")[0].addEventListener("keydown", function(event) {
				api.keyListener(event.keyCode, event);
			});
			
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
			document.getElementById("c").addEventListener("contextmenu", function(event) {
				api.mouseClickListener(event);
			});
			
			
			document.getElementById("cs_name").addEventListener("input", function(event) {
				project.cases[api.selectedCase].name = this.value;
				api.drawCases(true);
			});
			
			document.getElementById("t_name").addEventListener("input", function(event) {
				project.terms[api.selectedTerm].name = this.value;
				api.drawTerms(true);
			});
			
			document.getElementById("bpad1").getElementsByTagName("table")[0].addEventListener("mouseover", function() {
				api.enElSel = true;
			});
			document.getElementById("bpad1").getElementsByTagName("table")[0].addEventListener("mouseout", function(event) {
				api.enElSel = false;
			});
				
			document.getElementById("bpad2").getElementsByTagName("table")[0].addEventListener("mouseover", function() {
				api.enBSel = true;
			});
			document.getElementById("bpad2").getElementsByTagName("table")[0].addEventListener("mouseout", function(event) {
				api.enBSel = false;
			});
			
			
			document.getElementById("import").getElementsByClassName("im_c")[0].addEventListener("input", function(event) {
				api.putMetaData(document.getElementById("import").getElementsByClassName("im_c")[0].value,document.getElementById("importpad"));
			});
			if('ondrop' in document.createElement('div')) {
				document.getElementById("import").getElementsByClassName("im_c")[0].addEventListener('dragover', function (e) {
					e.stopPropagation();
					e.preventDefault();
					e.dataTransfer.dropEffect = 'copy';
				});
				
				document.getElementById("import").getElementsByClassName("im_c")[0].addEventListener('drop', function (e) {
					e.stopPropagation();
					e.preventDefault();

					var file = e.dataTransfer.files[0];
					var reader = new FileReader();
					reader.onload = function() {
						document.getElementById("import").getElementsByClassName("im_c")[0].value=reader.result;
						api.putMetaData(document.getElementById("import").getElementsByClassName("im_c")[0].value,document.getElementById("importpad"))
					}
					reader.readAsText(file);
				});
			}
			
			api.windowHeight = document.body.clientHeight;
			api.windowWidth = document.body.clientWidth;
			window.onresize = function(){
				api.recalcWindows();
				api.forceRedraw = true;
			}
		
		
			if (localStorage["hasSettings"] != "true") {
				this.loadDefault();
				this.saveSettings();
			}
			else {
				this.loadSettings();
				this.fixSettings();
			}
			
			var ele = document.getElementsByClassName("ac");
			for (var i=0; i<ele.length; i++) ele[i].addEventListener("click", function(e) {
				api.switchElemState(e.target);
			});
			
			ele = document.getElementsByClassName("acr");
			for (var i=0; i<ele.length; i++) ele[i].addEventListener("click", function(e) {
				api.switchRadioElemState(e.target);
			});
			
			ele = document.getElementsByClassName("rtm");
			for (var i=0; i<ele.length; i++) {
				ele[i].addEventListener("click", function(e) {
					api.runTimeSettings(e.target);
				});
			}
			api.initRTS();
		}
		
		this.styleSwitch('labelHidden','showLabel',false,false,true);
		this.topFontSize();
		this.glFontSize();
		this.fontSwitch();
		this.styleSwitch('night','nightMode',false,false,false);
		this.styleSwitch('bottomHidden','bottomHidden',false,false,false);
		this.styleSwitch('debugEnabled','debug',false,false,false);
		this.styleSwitch('transparentActive','transparency',false,false,false);
		this.styleSwitch('customCursor','cursor',false,false,false);
		this.changeSidePad(0);
		this.changeBottomPad(0);
		this.selectBrush(-1);
		this.popUp = "popUp";
		this.colorMode(this.settings.palette);
		
		this.forceRedraw = true;
		this.overDraw = false;
		this.mouse.button = 0;
		this.autosaveInterval = this.settings.autosave*1000*60;
		
		windows.changelog = {header:'Список изменений',content:(this.locationName!='local'?('<iframe src="//stsyn.github.io/fcm/changelog/'+this.locationName+'.txt"></iframe>'):'<iframe src="changelog/stable.txt"></iframe>'),size:2,windowsize:'ifr',buttons:[{red:false,name:'Закрыть',functions:'api.callPopup2(windows.about)'},{red:false,name:'Развернуть',functions:'api.switchWindowSize(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id)'}]};
		windows.legal = {header:' ',content:'<iframe src="legal.txt"></iframe>',size:2,windowsize:'ifr',buttons:[{red:false,name:'Закрыть',functions:'api.callPopup2(windows.about)'},{red:false,name:'Развернуть',functions:'api.switchWindowSize(this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id)'}]};
		windows.about = {header:'Cognitive Map Constructor',content:'<div class="b fs" onclick="api.callPopup2(windows.legal)">Дипломная работа Бельского С.М.</div><div class="b fs" onclick="api.callPopup2(windows.changelog)">Версия: '+this.version.g+'['+this.version.b+'] '+this.version.s+' ('+this.locationName+')</div>',size:2,buttons:[{functions:'api.closePopup();',red:false,name:'Закрыть'},{functions:'location.reload(true)',red:true,name:'Принудительный перезапуск'}],windowsize:'sm'};
		windows.warning = {header:'Внимание!',content:'Все несохраненные изменения будут утеряны!',size:2,buttons:[{red:false,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.error = {header:'Ошибка!',size:0,windowsize:'sm'};
		windows.sureSave = {header:'Внимание!',content:'Предыдущие данные будут перезаписаны!',size:2,buttons:[{red:false,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.saveDone = {header:'Успех!',content:'Успешно сохранено!',size:1,buttons:[{red:false,functions:'api.closePopup();',name:'Продолжить'}],windowsize:'sm'};
		windows.sureDelete = {header:'Внимание!',content:'Вы удалите этот элемент и все, что на нем находится. Вы не сможете все это вернуть!',size:2,buttons:[{red:true,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.deleteSave = {header:'Внимание!',content:'Подтвердите удаление этого слота.',size:2,buttons:[{red:true,functions:'api.deleteSave(undefined, false)',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.deleteCase = {header:'Внимание!',content:'Подтвердите удаление этого кейса.',size:2,buttons:[{red:true,functions:'',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.deleteTerm = {header:'Внимание!',content:'Подтвердите удаление этого терма.',size:2,buttons:[{red:true,functions:'',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.loader = {header:'Загружается...',content:'<div id="squaresWaveG" style="margin-bottom:24px"><div id="squaresWaveG_1" class="squaresWaveG"></div><div id="squaresWaveG_2" class="squaresWaveG"></div><div id="squaresWaveG_3" class="squaresWaveG"></div><div id="squaresWaveG_4" class="squaresWaveG"></div><div id="squaresWaveG_5" class="squaresWaveG"></div><div id="squaresWaveG_6" class="squaresWaveG"></div><div id="squaresWaveG_7" class="squaresWaveG"></div><div id="squaresWaveG_8" class="squaresWaveG"></div></div><div id="loadstring" style="font-size:150%"></div></div>',size:0,windowsize:'sm'};
		windows.update = {header:'Обновление!',content:'Программа была обновлена до версии <b>'+this.updated+'</b>! Рекомендуется перезапустить программу, чтобы загрузились все обновленные файлы.',size:3,buttons:[{functions:'api.closePopup();',red:false,name:'Закрыть'},{functions:'api.callPopup2(windows.changelog);',red:false,name:'Список изменений'},{functions:'location.reload(true);',red:true,name:'Перезапустить'}],windowsize:'sm'};
		
		
		windows.saveError = {header:'Ошибка!',size:2,buttons:[{functions:'api.closePopup();',red:false,name:'Выполнить экспорт'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.loadError = {header:'Ошибка!',size:3,buttons:[{functions:'api.closePopup();',red:false,name:'Выполнить экспорт'},{functions:'location.reload();',red:false,name:'Перезагрузить программу'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		
		if (this.settings.autoload && this.settings.lastLoaded != undefined) this.error = this.error || this.load(this.settings.lastLoaded,true);
		
		if (this.error) return;
		this.includeElements(document.getElementById("bpad1").getElementsByTagName("table")[0],-1);
		this.includeBonds(document.getElementById("bpad2").getElementsByTagName("table")[0],-1);
		setTimeout(function() {
			api.closePopup();
			if (api.updated) {
				api.callPopup2(windows.update);
				api.settings.lastVersion = api.updated;
				api.saveSettings();
			}
			else if (api.locationName != "stable" && !api.settings.dontShowAlerts) {
				var tt = "";
				if (api.locationName == "unknown") tt = 'Вы используете версию из неизвестного источника! Настоятельно рекомендуется использовать стабильную версию на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su/applications/cmc">vtizi.ugatu.su</a>';
				else if (api.locationName == "local") tt = 'Вы используете сохраненную локальную версию. Актуальную стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="http://vtizi.ugatu.su/applications/cmc">vtizi.ugatu.su</a>';
				else if (api.locationName == "nightly") tt = 'Вы используете самую свежую промежуточную бета-версию. В ней могут содержаться ошибки и недоделанные возможности! В случае обнаружения ошибок и предложений убедительная просьба связаться с разрабочиками! Стабильную версию всегда можно найти на сайте кафедры ВТиЗИ УГАТУ <a href="//vtizi.ugatu.su/applications/cmc">vtizi.ugatu.su</a>';
				
				api.callPopup2({header:'Внимание!',content:tt,size:2,windowsize:'sm',buttons:[{functions:'api.settings.dontShowAlerts=true;api.closePopup();api.saveSettings()',name:'Больше не показывать'},{functions:'api.closePopup()',name:'Закрыть'}]});
			}
		},(api.settings.debug?100:777));
		setTimeout(function() {api.callWindow('side');},(api.settings.debug?80:666));
		
	}
}

var api = new exapi();

window.onload = function () {
	if (document.getElementById("loadstring") != undefined) document.getElementById("loadstring").innerHTML = returnRandomLoadingLine();
	setTimeout(function() {api.init(true)},200);
}

window.onbeforeunload = function (evt) {
	if (!api.changed) return;
	var message = "В проект были внесены изменения, которые будут потеряны при закрытии вкладки. Вы точно хотите закрыть вкладку?";
	if (typeof evt == "undefined") {
		evt = window.event;
	}
	if (evt) {
		evt.returnValue = message;
	}
	return message;
}