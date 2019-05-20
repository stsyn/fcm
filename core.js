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

function cloneObj(obj, ignore) {
	var n = {};
	if (Array.isArray(obj)) {
		n = [];
		for (var i=0; i<obj.length; i++) {
			if (typeof obj[i] == 'object') n[i] = cloneObj(obj[i]);
			else n[i] = obj[i];
		}
	}
	else for (var i in obj) {
		if (ignore !== undefined && ignore[i]) continue;
		if (typeof obj[i] == 'object') n[i] = cloneObj(obj[i]);
		else n[i] = obj[i];
	}
	return n;
}

function InfernoAddElem(tag, values, childs) {
	var t;
	if (values != undefined && values.id != undefined && document.getElementById(values.id) != undefined) {
		if (document.querySelectorAll(tag+'#'+values.id).length == 0) {
			t = document.getElementById(values.id);
			t.parentNode.removeChild(t);
			t = document.createElement(tag);
		}
		else {
			t = document.getElementById(values.id);
			while (t.firstChild) {t.removeChild(t.firstChild);}
		}
	}
	else t = document.createElement(tag);

	for (var i in values) if (i!='events' && i!='dataset' && i!='innerHTML' && i!='checked' && i!='disabled' && i!='value' && i!='selected' && i!='className' && !(i=='style' && typeof values.style=='object')) t.setAttribute(i,values[i]);
	if (values.dataset != undefined) for (var i in values.dataset) t.dataset[i] = values.dataset[i];
	if (values.className != undefined) t.className = values.className;
	if (values.innerHTML != undefined) t.innerHTML = values.innerHTML;
	if (values.value != undefined) t.value = values.value;
	if (values.checked != undefined) t.checked = values.checked;
	if (values.selected != undefined) t.selected = values.selected;
	if (values.disabled != undefined) t.disabled = values.disabled;
	if (values.events != undefined) values.events.forEach(function(v,i,a) {t.addEventListener(v.t, v.f);});
	if (typeof values.style=='object') for (var i in values.style) t.style[i] = values.style[i];

	if (childs != undefined && childs.length != undefined) childs.forEach(function(c,i,a) {t.appendChild(c);});
	return t;
}

function exapi() {
	this.updated = false;
	this.error = false;
	this.settings = {color:[]};
	this.windows = {};
	this.mouse = {};
	this.mouse.onclick = [];
	this.version = {g:"0.9.6", s:"RC3", b:92};
	this.defTerms = [
		{name:"<i>Без термов</i>",terms:[]},
		{name:"Краткий",autoTerms:true,terms:[{term:'Слабо',lim:0.33},{term:'Средне',lim:0.67},{term:'Сильно',lim:1}], rules:[
		[0,0,0],
		[1,0,0],
		[2,1,0],
		]},
		{name:"Подробный",autoTerms:true,terms:[{term:'Очень слабо',lim:0.2},{term:'Слабо',lim:0.4},{term:'Средне',lim:0.6},{term:'Сильно',lim:0.8},{term:'Очень сильно',lim:1}], rules:[
		[0,0,0,0,0],
		[1,1,0,0,0],
		[2,1,1,0,0],
		[3,2,1,1,0],
		[4,3,2,1,0],
		]}];
	this.defCases = {
		'-2':{name:'Без контрмер', disabledAll:true, noStates:true},
		'-1':{name:'Все контрмеры', enabledAll:true, noStates:true}
	};
	this.casesCache = [];
	this.structData = {
		elements:{
			fieldsName:['ID','Тип','Код','Имя','Стоимость','Значимость'],
			fields:['id','type','code','name','cost','val'],
			types:['','Угроза','Ресурс','Цель','Контрмера','Дестабилизатор','Посредник'],
			typesName:[]
		},
		bonds:{
			fieldsName:['ID','Путь','Сила','Текущая','Начало','Конец'],
			fields:['id','way','val','curval','first','second']
		}
	};
	this.zindex = [];
	this.esort = 0;
	this.esortdir = 1;
	this.bsort = 0;
	this.bsortdir = 1;
	this.updateMode = 0;
	
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

	this.selectBrush = function (n) {
		for (var i=-20; i<10; i++) {
			if (document.getElementById("brush"+i) == undefined) continue
			document.getElementById("brush"+i).classList.remove("sel");
		}
		if (n > -1) selection.reset();
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
	
	this.putMetaData = function (proj, el, l, test) {
		
		if (proj != "null") {
			var p;
			try {
				p = JSON.parse(proj);
				if (test) return false;
			}
			catch (ex) {
				el.innerHTML = 'Ошибка в проекте: '+ex;
				return true;
			}
			el.innerHTML = '';
			if (p.meta != undefined) {
				if (p.meta.description != undefined && p.meta.description != '' && p.meta.description != 'undefined') el.innerHTML += p.meta.description+'<br>';
				var d = new Date(p.meta.timeCreated);
				el.innerHTML += 'Создан: '+d.getDate()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+'<br>';
				d = new Date(p.meta.timeSaved);
				el.innerHTML += 'Сохранен: '+d.getDate()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+'<br><br>';
				el.innerHTML += 'Сжатие: '+(p.meta.compress?'да':'нет')+'<br>';
				el.innerHTML += 'Шифрование: '+(p.meta.encrypt?'да':'нет')+'<br>';
				if (p.meta.encrypt && l) el.innerHTML += 'Пароль: <input type="password" class="b i pass">';
				return false;
			}
			else {
				el.innerHTML += 'В проекте нет метаданных!';
				return false;
			}
		}
	}
	
	this.updateCases = function() {
		api.casesCache = [];
		api.casesCache[-2] = api.defCases[-2];
		api.casesCache[-1] = api.defCases[-1];
		project.cases.forEach((v, i) => api.casesCache[i] = v);
	};
	
	this.getSaves = function () {
		var ote = localStorage["fcm2.saves"];
		if (ote != undefined) ote = JSON.parse(localStorage["fcm2.saves"]);
		return ote;
	}
	
	this.putSaves = function (s) {
		localStorage["fcm2.saves"] = JSON.stringify(s);
	}
	
	this.getElemField = function (el, i, field, strictNumeric) {
		if (typeof el == 'undefined') return -1;
		switch (field) {
			case 'id': return i;
			case 'type': return el.type;
			case 'name': return getName(el);
			case 'state': return ((el.state==undefined)?(strictNumeric?-1:"—"):el.state);
			case 'lim': return ((el.lim==undefined)?(strictNumeric?-1:"—"):el.lim);
			case 'cost': return ((el.cost==undefined)?(strictNumeric?-1:"—"):el.cost);
			case 'val': return ((el.val==undefined)?(strictNumeric?-1:"—"):el.val);
		} 
	}
	
	this.getBondField = function (b, i, field, strictNumeric) {
		if (typeof b == 'undefined') return -1;
		var u = b.val;
		if (project.settings.term != -3 && u != undefined && !strictNumeric) u = getTermName(u);
		var u2 = getBondVal(b, project.settings.currentCase);
		if (project.settings.term != -3 && u2 != undefined && !strictNumeric) u2 = getTermName(u2);
		switch (field) {
			case 'id': return b.id;
			case 'way': return b.first+' — '+b.second;
			case 'val': return u;
			case 'curval': return u2;
			case 'first': return getName(b.first);
			case 'second': return getName(b.second);
		} 
	}
	
	this.includeElementsTLine = function (el, i) {
		var u = el[i].val;
		if ((project.settings.term != -3) && (el[i].tval != undefined)) u = getTermName(el[i].tval);
		return InfernoAddElem('tr', {className:'b fs linemenu', events:[{t:'click',f:function(){editElement(i)}}, {t:'mouseover', f:function(){api.elSel=i;}}]},[
			InfernoAddElem('td',{innerHTML:i},[]),
			InfernoAddElem('td',{innerHTML:api.structData.elements.types[el[i].type]},[]),
			InfernoAddElem('td',{innerHTML:getCode(i)},[]),
			InfernoAddElem('td',{innerHTML:el[i].name},[]),
			//InfernoAddElem('td',{innerHTML:((el[i].state===undefined)?"—":el[i].state)},[]),
			//InfernoAddElem('td',{innerHTML:((el[i].lim===undefined)?"—":el[i].lim)},[]),
			InfernoAddElem('td',{innerHTML:((el[i].cost===undefined)?"—":el[i].cost)},[]),
			InfernoAddElem('td',{innerHTML:((el[i].val===undefined)?"—":(u+(project.settings.grayMap?(' — '+el[i].val2):'')))},[])
		]);
	}
	
	this.includeElements = function (e,filter) {
		var el = project.elements;
		e.innerHTML = '';
		var heads = api.structData.elements.fieldsName;
		var fields = api.structData.elements.fields;
		var s = '';
		if (el.length == 0) {
			e.appendChild(InfernoAddElem('tr', {className:'b fs headline na'},[
				InfernoAddElem('td',{className:'b fs na', innerHTML:'Нет элементов'},[])
			]))
			return;
		}
		var elem = InfernoAddElem('tr', {className:'headline'},[]);
		for (var i=0; i<heads.length; i++) {
			elem.appendChild(InfernoAddElem('td',{dataset:{id:i},className:'b fs'+(filter==-1?(i == api.esort?' sel stillsel':''):' na'),events:(filter==-1?[{t:'click',f:function(e) {
				if (this.dataset.id == api.esort) api.esortdir = -api.esortdir;
				else {
					api.esort = this.dataset.id;
					api.esortdir = 1;
				}
				api.includeElements(document.getElementById("bpad1").getElementsByTagName("table")[0],-1);
			}}]:[])},[
				InfernoAddElem('i',{className:'fa fa-arrow-up',style:'opacity:0;'+(filter==-1?'':'display:none')},[]),
				InfernoAddElem('span',{innerHTML:heads[i]+' '},[]),
				InfernoAddElem('i',{className:'fa fa-arrow-'+(api.esortdir==1?'down':'up'),style:(i == api.esort?'':'opacity:0;')+(filter==-1?'':'display:none')},[])
			]));
		}
		e.appendChild(elem);
		
		var order = [];
		for (var i=0; i<el.length; i++) order[i] = i;
		
		if (api.esort != 0 && filter == -1) order.sort(function(a,b) {
			if (api.getElemField(project.elements[a],a,fields[api.esort],true) < api.getElemField(project.elements[b],b,fields[api.esort],true)) return -1;
			if (api.getElemField(project.elements[a],a,fields[api.esort],true) > api.getElemField(project.elements[b],b,fields[api.esort],true)) return 1;
			return 0;
		});
		
		
		var i, j;
		var start = (api.esortdir == 1?0:el.length-1);
		if (filter != -1) {
			e.appendChild(this.includeElementsTLine(el, project.bonds[filter].first));
			for (i=0; i<cache.bonds[filter].elems.length; i++) e.appendChild(this.includeElementsTLine (el, cache.bonds[filter].elems[i]));
			e.appendChild(this.includeElementsTLine(el, project.bonds[filter].second));
		}
		else for (i=start; i<el.length && i>=0; i+=api.esortdir) {
			if (el[order[i]] == undefined) continue;
			e.appendChild(this.includeElementsTLine(el, order[i]));
		}
	}
	
	this.includeBondsTLine = function (b, el, i) {
		var u = b[i].val;
		var ug = b[i].val2;
		if (project.settings.term != -3 && b[i].tval != undefined) u = getTermName(b[i].tval);
		var u2 = getBondVal(b[i], project.settings.currentCase);
		var ug2 = getBondVal(b[i], project.settings.currentCase, '2');
		if (project.settings.term != -3 && u2 != undefined) u2 = getTermName(getTermInterval(u2));
		return InfernoAddElem('tr', {className:'b fs linemenu', events:[{t:'click',f:function(){editBond(i)}}, {t:'mouseover', f:function(){api.bSel=i;}}]},[
			InfernoAddElem('td',{innerHTML:i},[]),
			InfernoAddElem('td',{innerHTML:b[i].first+' — '+b[i].second},[]),
			InfernoAddElem('td',{innerHTML:(u+(project.settings.grayMap?(' — '+ug):''))},[]),
			InfernoAddElem('td',{innerHTML:(u2+(project.settings.grayMap?(' — '+ug2):''))}),
			InfernoAddElem('td',{innerHTML:getName(b[i].first)},[]),
			InfernoAddElem('td',{innerHTML:getName(b[i].second)},[])
		]);
	}

	this.includeBonds = function (e, filter) {
		e.innerHTML = '';
		var ax = ((filter == -1)?"":" na");
		var el = project.elements;
		var b = project.bonds;
		var heads = api.structData.bonds.fieldsName;
		var fields = api.structData.bonds.fields;
		
		if (b.length == 0) {
			e.appendChild(InfernoAddElem('tr', {className:'b fs headline na'},[
				InfernoAddElem('td',{className:'b fs na', innerHTML:'Нет связей'},[])
			]));
			return;
		}
		if ((filter != -1) && (cache.elements[filter].inbonds.length == 0) && (cache.elements[filter].outbonds.length == 0) && (el[filter].type != 4) && (el[filter].type != 5)) {
			e.appendChild(InfernoAddElem('tr', {className:'b fs headline na'},[
				InfernoAddElem('td',{className:'b fs na', innerHTML:'Нет связей'},[])
			]));
			return;
		}
		var elem = InfernoAddElem('tr', {className:'headline'},[]);
		for (var i=0; i<heads.length; i++) {
			elem.appendChild(InfernoAddElem('td',{dataset:{id:i},className:'b fs'+(filter==-1?(i == api.bsort?' sel stillsel':''):' na'),events:(filter==-1?[{t:'click',f:function(e) {
				if (this.dataset.id == api.bsort) api.bsortdir = -api.bsortdir;
				else {
					api.bsort = this.dataset.id;
					api.bsortdir = 1;
				}
				api.includeBonds(document.getElementById("bpad2").getElementsByTagName("table")[0],-1);
			}}]:[])},[
				InfernoAddElem('i',{className:'fa fa-arrow-up',style:'opacity:0;'+(filter==-1?'':'display:none')},[]),
				InfernoAddElem('span',{innerHTML:heads[i]+' '},[]),
				InfernoAddElem('i',{className:'fa fa-arrow-'+(api.bsortdir==1?'down':'up'),style:(i == api.bsort?'':'opacity:0;')+(filter==-1?'':'display:none')},[])
			]));
		}
		e.appendChild(elem);
		
		var order = [];
		for (var i=0; i<b.length; i++) order[i] = i;
		
		if (api.bsort != 0 && filter == -1) order.sort(function(a,x) {
			if (api.getBondField(project.bonds[a],a,fields[api.bsort],true) < api.getBondField(project.bonds[x],x,fields[api.bsort],true)) return -1;
			if (api.getBondField(project.bonds[a],a,fields[api.bsort],true) > api.getBondField(project.bonds[x],x,fields[api.bsort],true)) return 1;
			return 0;
		});
		var start = (api.bsortdir == 1?0:b.length-1);
		
		var i, j;
		if (filter != -1) {
			if ((el[filter].type == 4) || (el[filter].type == 5)) {
				e.appendChild(InfernoAddElem('tr', {className:'b fs na'},[
					InfernoAddElem('td',{className:'b fs na',colspan:'6', innerHTML:'Родительская связь'},[])
				]));
				e.appendChild(this.includeBondsTLine (b, el, el[filter].X));
				return;
			}
			var t = true;
			for (i=0; i<cache.elements[filter].inbonds.length; i++) {
				if (t) {
					t = false;
					e.appendChild(InfernoAddElem('tr', {className:'b fs na'},[
						InfernoAddElem('td',{className:'b fs na',colspan:'6', innerHTML:'Входящие связи'},[])
					]));
				}
				e.appendChild(this.includeBondsTLine (b, el, cache.elements[filter].inbonds[i]));
			}
			t = true;
			for (i=0; i<cache.elements[filter].outbonds.length; i++) {
				if (t) {
					t = false;
					e.appendChild(InfernoAddElem('tr', {className:'b fs na'},[
						InfernoAddElem('td',{className:'b fs na',colspan:'6', innerHTML:'Исходящие связи'},[])
					]));
				}
				e.appendChild(this.includeBondsTLine (b, el, cache.elements[filter].outbonds[i]));
			}
		}
		else for (i=start; i<b.length && i>=0; i+=api.bsortdir) {
			if (b[order[i]] == undefined) continue;
			e.appendChild(this.includeBondsTLine(b, el, order[i]));
		}
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
			el.innerHTML = el.innerHTML + '<div class="line linemenu"><input type="radio" name="selection" value="'+a[i]+'" id="'+nn+'.'+i+'" '+(((!addname && (i==0)) || (ec == i))?"checked":"")+'><label for="'+nn+'.'+i+'" class="b fs" onclick="api.putMetaData(localStorage[\''+a[i]+'\'],document.getElementById(\''+el2+'\'),'+(nn=="loads")+')">'+a[i]+'</label></div>';
			if ((!addname && (i==0)) || (ec == i)) this.putMetaData(localStorage[a[i]],document.getElementById(el2),(nn=="loads"));
		}
	}
	
	this.readSelected = function (el) {
		var e = el.querySelectorAll('input[type="radio"]');
		for (var i=0; i<e.length; i++) {
			if (e[i].checked) return deXSS(e[i].value);
		}
	}
	
	this.exportProject = function () {
		var tproject = (project.meta.compress?api.compressProject(project):project);
		var blob = new Blob([JSON.stringify(tproject)], {type: "application/json"});
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
		if (this.putMetaData(c,document.getElementById("importpad"), true, true)) {
			this.addMessage('Проект не может быть импортирован','red');
		}
		try {
			project = JSON.parse(deXSS(c));
			this.handleProject();
			update();
			api.initRTSCases();
			api.initRTS();
			this.changed = false;
			this.closeWindow('import');
		}
		catch (ex) {
			if (project.settings == undefined) {
				if (project.meta.encrypt) {
					windows.loadError.content = 'Не удалось загрузить проект "'+name+'". Проект поврежден или пароль неверный.<br><br>Описание ошибки:<br>'+ex;
				}
				else {
					windows.loadError.content = 'Проект поврежден.<br><br>Описание ошибки:<br>'+ex;
				}
			}
			else windows.loadError.content = 'Не удалось загрузить проект "'+name+'". Попробуйте перезапустить программу. Также вероятно, что вы пытаетесь загрузить несуществующий проект.<br><br>Описание ошибки:<br>'+ex;
			this.callPopup2(windows.loadError);
			setTimeout(function() {resetProject(true)}, 500);
			if (api.settings.debug) throw ex;
			return true;
		}
	}
	
	this.encryptProject = function(data, proj, key) {
		var xkey = forge_sha256(proj.settings.password+proj.meta.timeSaved+proj.id);
		var key = aesjs.utils.hex.toBytes(xkey);
		var aesCbc = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(10));
		var encryptedBytes = aesCbc.encrypt(data);
		return encryptedBytes;
	}
	
	this.decryptProject = function(data, proj, key) {
		var xkey = forge_sha256(key+proj.meta.timeSaved+proj.id);
		var key = aesjs.utils.hex.toBytes(xkey);
		var aesCbc = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(10));
		var decryptedBytes = aesCbc.encrypt(data);
		return decryptedBytes;
	}

	this.compressProject = function(proj) {
		var n = cloneObj(proj, {meta:true, id:true});
		var n2 = LZMA.compress(JSON.stringify(n),9);
		var r = '';
		for (var i=0; i<n2.length; i++) if (n2[i] < 0) n2[i] = 256+n2[i];
		if (proj.meta.encrypt) n2 = api.encryptProject(n2, proj);
		for (var i=0; i<n2.length; i++) r+=String.fromCharCode(n2[i]);
		var x = {id:proj.id,meta:proj.meta,data:btoa(r)};
		return x;
	}
	
	this.unpackProject = function(proj, key) {
		var x = atob(proj.data);
		var r = [];
		for (var j=0; j<x.length; j++) r[j] = x.charCodeAt(j);
		if (proj.meta.encrypt) r = api.decryptProject(r, proj, key);
		for (var j=0; j<r.length; j++) if (r[j]>127) r[j]-=256;
		var s;
		s = JSON.parse(LZMA.decompress(r));
		s.id = proj.id;
		s.meta = proj.meta;
		return s;
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
			
			if (project.meta == undefined) project.meta = {};
			var t = new Date();
			if (isNaN(project.meta.timeCreated)) project.meta.timeCreated = t.getTime();
			project.meta.timeSaved = t.getTime();
			////////
			var tproject = (project.meta.compress?api.compressProject(project):project);
			
			////////
			localStorage[name] = JSON.stringify(tproject);
			if (!silent) {
				this.callPopup2(windows.saveDone);
				this.closeWindow("save");
				document.getElementById("savelist").innerHTML = "";
			}
			this.changed = false;
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
	
	this.handleProject = function () {
		var key;
		if (project.meta.encrypt) key = document.querySelector('#load input.pass').value;
		if (project.meta.compress && project.data != undefined) project = api.unpackProject(project, key);
		if (project.settings.term == undefined) project.settings.term = -3;
		if (project.settings.currentCase == undefined) project.settings.currentCase = -2;
		if (project.settings.calcFunc == undefined) project.settings.calcFunc = 0;
		if (project.settings.actFunc == undefined) project.settings.actFunc = 0;
		if (project.unusedCases == undefined) project.unusedCases = [];
		if (project.terms != undefined) {
			for (var i=0; i<project.terms.length; i++) {
				project.terms.autoTerms = true;
				autocalcTermRules(project.terms[i]);
			}
		}
		for (var i=0; i<project.elements.length; i++) if (project.elements[i] != undefined && project.elements[i].tval == undefined) {
			if (project.settings.term != -3) project.elements[i].tval = getTermInterval(project.elements[i].val);
			project.elements[i].id = i;
		}
		for (var i=0; i<project.bonds.length; i++) if (project.bonds[i] != undefined && project.bonds[i].tval == undefined) {
			if (project.settings.term != -3) project.bonds[i].tval = getTermInterval(project.bonds[i].val);
			project.bonds[i].id = i;
		}
		for (var i=0; i<project.cases.length; i++) if (project.cases[i] != undefined && project.cases[i].states == undefined) {
			project.cases[i].states = {};
		}
		api.updateUniqMenus();
		selection.tryAllowStuff();
	}
	
	this.load = function (name, silent) {
		try {
			if (api.settings.debug) console.log("Loading... ", name);
			project = JSON.parse(deXSS(localStorage[name]));
			this.handleProject();
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
			api.prepareErrorExport(JSON.stringify(project));
			if (project.settings == undefined) {
				if (project.meta.encrypt) {
					windows.loadError.content = 'Не удалось загрузить проект "'+name+'". Проект поврежден или пароль неверный.<br><br>Описание ошибки:<br>'+ex;
				}
				else {
					windows.loadError.content = 'Проект поврежден.<br><br>Описание ошибки:<br>'+ex;
				}
			}
			else windows.loadError.content = 'Не удалось загрузить проект "'+name+'". Попробуйте перезапустить программу. Также вероятно, что вы пытаетесь загрузить несуществующий проект.<br><br>Описание ошибки (см. браузерные логи для подробностей):<br>'+ex;
			this.callPopup2(windows.loadError);
			console.log(ex);
			setTimeout(function() {resetProject(true)}, 500);
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
		if (v == "saves._custom_") {
			v = deXSS(document.getElementById("save_custom").value);
			if (v == "") {
				windows.error.content = "Введите имя файла сохранения!";
				this.callPopup2(windows.error);
				return;
			}
			else if ((v == "fcm2.saves") || (v == "fcm2.settings") || (v == "undefined") || (v == "_temp_save") || (v == "hasSettings") || (v == "saves._custom_") || (v == "null")) {
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
	
	this.requestReset = function(trueReset) {
		if (this.changed && !trueReset) {
			windows.warning.buttons[0].functions='api.requestReset(true);';
			this.callPopup2(windows.warning);
		}
		else {
			resetProject();
			resetViewport();
			api.callWindow("project");
			api.callWindow("terms");
			api.callPopup2(windows.newProject);
			delete this.settings.lastLoaded;
			this.saveSettings();
		}
	}
	
	this.requestDeletion = function(id) {
		windows.sureDelete.buttons[0].functions = "RemoveElement("+id+",true);api.closeWindow('edite"+id+"');api.closePopup()";
		this.callPopup2(windows.sureDelete);
	}
	
	this.requestDeletionBond = function(id) {
		windows.sureDelete.buttons[0].functions = "RemoveBond("+id+",false);api.closeWindow('editb"+id+"');api.closePopup()";
		this.callPopup2(windows.sureDelete);
	}
	
	this.renderCaseElem = function (caseid, elem, u) {
		if (caseid>=0 && elem>0) if (project.cases[caseid].enabled[elem] == undefined) project.cases[caseid].enabled[elem] = true;
		var e = document.createElement('div');
		var isEnabled = (elem == -1 ? false : (caseid == -2 ? false : (caseid == -1 ? true : project.cases[caseid].enabled[elem])));
		e.className = 't2 b fs'+(isEnabled ? (caseid>=0 ? ' sel stillsel' : ' sel') : (caseid>=0 ? '' : ' na'))+(elem == -1 ? ' na' : '');
		e.value = caseid;
		e.style = (elem == -1 ?'':'text-align:left');
		e.elemId = elem;
		
		var c = document.createElement('div');
		c.className = 't';
		c.innerHTML = (elem == -1 ? 'Имя':getName(elem));
		e.appendChild(c);
		
		c = document.createElement('div');
		c.className = 't';
		if (elem != -1) {
			if (project.settings.term == -3) c.innerHTML = project.elements[elem].val+(project.settings.grayMap?' — '+project.elements[elem].val2:'');
			else c.innerHTML = getTermName(project.elements[elem].tval);
		}
		else c.innerHTML = 'Значение';
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
	
	this.renderCaseElemState = function (caseid, elem, u) {
		
		if (caseid>=0 && elem>0) if (project.cases[caseid].enabled[elem] == undefined) project.cases[caseid].enabled[elem] = true;
		var isEnabled = (elem == -1 ? false : (caseid<0 ? false : project.cases[caseid].enabled[elem] === true));
				
		let cc;
		if (elem == -1) {
			cc = [
				InfernoAddElem('div', {innerHTML:'Имя', className:'t'}, []),
				InfernoAddElem('div', {innerHTML:'Состояние', className:'t'}, []),
				InfernoAddElem('div', {innerHTML:'Переписывать', className:'t'}, [])
			];
		} else {
			let c;
			if (caseid>=0) c = project.cases[caseid].states[elem];
			if (c == undefined) {
				c = {};
				c.state = 0;
				c.tstate = 0;
				c.state2 = 0;
				if (caseid>=0) project.cases[caseid].states[elem] = c;
			};
			cc = [
				InfernoAddElem('div', {innerHTML:getName(elem), className:'t'}, []),
				InfernoAddElem('div', {className:'t'}, [
					InfernoAddElem('input', {className:'b i'+(isEnabled?'':' na'), value:c.state, disabled:!isEnabled, type:'text', name:'state', style:'width:4em;height:1.7em'}, []),
					InfernoAddElem('select', {className:'b ilb termsrender'+(isEnabled?'':' na'), disabled:!isEnabled, size:'1', name:'tstate', style:''}, []),
					(project.settings.grayMap?
					InfernoAddElem('span', {dataset:{gray:true}}, [
						InfernoAddElem('span', {innerHTML:' — '}, []),
						InfernoAddElem('input', {className:'b i'+(isEnabled?'':' na'), value:c.state2, disabled:!isEnabled, type:'text', name:'state2', style:'width:4em;height:1.7em'}, [])
					]):InfernoAddElem('span', {innerHTML:''}, []))
					
				]),
				InfernoAddElem('div', {className:'t'}, [
					InfernoAddElem('label', {className:'b ilb ac de'+(caseid>=0?'':' na')+(isEnabled?' sel stillsel':'')}, [
						InfernoAddElem('input', {type:'checkbox',checked:isEnabled, name:'enabled', disabled:caseid<0}, [])
					])
				])
			];
		}
		
		let e = InfernoAddElem('div', {value:caseid, dataset:{elemId:elem}, style:'cursor:default;text-align:left'}, cc);
		e.className = 't2 b fs'+(isEnabled ? ' sel' : (caseid>=0 ? '' : ' na'))+(elem == -1 ? ' na' : '');
		
		if (elem >= 0 && caseid >= 0) {
			for (let i=0; i<e.getElementsByTagName('input').length; i++) {
				e.getElementsByTagName('input')[i].addEventListener("change", function(e) {
					let elem = e.target;
					let ex = elem.parentNode;
					while (!ex.classList.contains('t2')) ex = ex.parentNode;
					if (elem.name == 'enabled') {
						project.cases[ex.value].enabled[ex.dataset.elemId] = elem.checked;
						api.renderCase(ex.value);
					}
					else {
						let x = parseFloat(elem.value.replace(',','.'));
						if (isNaN(x)) x = 0;
						if (x<-1) x = -1;
						if (x>1) x = 1;
						if (project.cases[ex.value].states[ex.dataset.elemId] == undefined) project.cases[ex.value].states[ex.dataset.elemId] = {state:0,cstate:0,state2:0};
						project.cases[ex.value].states[ex.dataset.elemId][elem.name] = x;
						elem.value = x;
					}
				});
			}
		}
		
		fulfillTerms(e, elem);
		u.appendChild(e);
	}
	
	this.requestDeletionCase = function() {
		windows.deleteCase.buttons[0].functions = 'project.cases.splice('+api.selectedCase+',1);api.setCaseEnabled(false);api.closePopup();api.drawCases()';
		api.selectedCase--;
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
	
	this.calcCSum = function(val, subname) {
		if (subname == undefined) subname = '';
		var sum = 0;
		for (var c=0; c<cache.types[2].length; c++) sum+=parseInt(cache.elements[cache.types[2][c]]['costs'+subname][val+2]*project.elements[cache.types[2][c]].val);
		return sum;
	}
	
	this.calcTSum = function(val, subname) {
		return this.calcSum(val) + this.calcCSum(val, subname);
	}
	
	this.setCaseEnabled = function (v, x) {
		if (x == undefined) x = api.selectedCase;
		if (v) project.unusedCases.push(api.selectedCase);
		else {
			if (project.unusedCases.indexOf(api.selectedCase) >-1) 
				project.unusedCases.splice(project.unusedCases.indexOf(api.selectedCase), 1);
		}
	}
	
	this.isCaseEnabled = function (v) {
		return project.unusedCases.indexOf(v) == -1;
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
		
		u.appendChild(InfernoAddElem('br',{},[]));
		u.appendChild(InfernoAddElem('br',{},[]));
		
		for (i=-1; i<project.elements.length; i++) {
			if ((project.elements[i] == undefined || isOnBond(i)) && i!=-1) continue;
			api.renderCaseElemState(val, i, u);
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
		document.getElementById('cs_dont_use').checked = project.unusedCases.indexOf(val) >-1;
		api.switchElemState(document.getElementById('cs_dont_use'));
		api.initRTS();
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
			el.className = 'b fs';
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
				project.cases[c].states = [];
				if (api.selectedCase >=0) {
					for (j=0; j<cache.types[3].length; j++) project.cases[c].enabled[cache.types[3][j]] = project.cases[api.selectedCase].enabled[cache.types[3][j]];
					for (j=0; j<cache.types[4].length; j++) project.cases[c].enabled[cache.types[4][j]] = project.cases[api.selectedCase].enabled[cache.types[3][j]];
					for (j=0; j<project.elements.length; j++) {
						if (project.elements[j] == undefined || isOnBond(j)) continue;
						project.cases[c].enabled[j] = project.cases[api.selectedCase].enabled[j];
						project.cases[c].states[j] = project.cases[api.selectedCase].states[j];
					}
				}
				else {
					for (j=0; j<cache.types[3].length; j++) project.cases[c].enabled[cache.types[3][j]] = api.selectedCase == -1;
					for (j=0; j<cache.types[4].length; j++) project.cases[c].enabled[cache.types[4][j]] = api.selectedCase == -1;
					for (j=0; j<project.elements.length; j++) {
						if (project.elements[j] == undefined || isOnBond(j)) continue;
						project.cases[c].enabled[j] = false;
					}
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
		e.className = 't2 ';
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
					project.terms[this.parentNode.parentNode.value].terms[this.parentNode.parentNode.elemId].lim = parseFloat(this.value);
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
	
	this.renderTermRules = function () {
		var val = api.selectedTerm;
		var inner = [];
		if (val == -3) {
			inner[0] = InfernoAddElem('span',{innerHTML:'В режиме без термов база правил отсутствует.'},[]);
		}
		else {
			var onChange = function (e) {
				var elem = e.target.parentNode;
				t[u].rules[elem.dataset.bondId][elem.dataset.controllerId] = e.target.value;
			};
			var lines = [];
			var cells = [];
			cells[1] = InfernoAddElem('td',{innerHTML:'<b>Вес связей \\ Вес контрмер</b>'},[]);
			
			var u, t;
			if (val < 0) {
				u = val+3;
				t = api.defTerms;
			}
			else {
				u = val;
				t = project.terms;
			}
			var editable = !t[u].autoTerms && val >= 0;
			if (!editable) autocalcTermRules(t[u]);
			
			for (var i=0; i<t[u].terms.length; i++) cells.push(InfernoAddElem('td',{innerHTML:t[u].terms[i].term},[]));
			lines[0] = InfernoAddElem('tr',{className:'headline'},cells);
			var termsOptions = [];
			for (var i=0; i<t[u].terms.length; i++) termsOptions.push(InfernoAddElem('option',{innerHTML:t[u].terms[i].term,value:i},[]));
			var termsSelection = InfernoAddElem('select',{size:1,className:'b fs ilb '+(editable?'':'na'),disabled:!editable},termsOptions);
			
			for (var i=0; i<t[u].terms.length; i++) {
				cells = [];
				cells.push(InfernoAddElem('td',{innerHTML:t[u].terms[i].term},[]));
				for (var j=0; j<t[u].terms.length; j++) {
					var x = termsSelection.cloneNode(true);
					x.childNodes[t[u].rules[i][j]].selected = true;
					x.addEventListener('change',onChange);
					cells.push(InfernoAddElem('td',{dataset:{bondId:i,controllerId:j}},[x]));
				}
				lines.push(InfernoAddElem('tr',{className:'linemenu'},cells));
			}
			inner[0] = InfernoAddElem('table',{className:"r",cellspacing:0,rules:'all'},lines);
			inner[1] = InfernoAddElem('div',{},[
				InfernoAddElem('br',{},[]),
				InfernoAddElem('label',{className:'b ac '+(val >= 0?'stillsel ':'')+(editable?'sel':''), style:'float:none;display:inline-block'},[
					InfernoAddElem('input',{type:'checkbox',disabled:(val < 0),checked:t[u].autoTerms, events:[{t:'click',f:
						function(e) {
							if (val < 0) return;
							var elem = e.target;
							t[u].autoTerms = elem.checked;
							setTimeout(api.renderTermRules, 10);
						}
					}]},[]),
					InfernoAddElem('span',{innerHTML:' Автоматически'},[])
				]),
				InfernoAddElem('div',{innerHTML:'По горизонтали задаются веса связей, по вертикали задаются веса контрмер, в пересечениях — вес связи под влияением данной контрмеры. В автоматическом режиме пересечения рассчитываются через произведение средних значений двух термов.'},[])
			]);
			api.switchElemState(inner[1].querySelector('label'));
			if (val<0) {
				inner[3] = InfernoAddElem('strong',{innerHTML:'Нельзя изменять базу правил для встроенных наборов термов. Создайте новый набор на основе сущетсвующего.'},[]);
			}
		}
		var container = document.getElementById('termrules');
		container.removeChild(container.childNodes[0]);
		container.appendChild(InfernoAddElem('div',{className:'pad',style:'display:block'},inner));
	}
	
	this.renderTerm = function(val) {
		api.selectedTerm = val;
		api.renderTermRules();
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
			p.innerHTML = 'В данном режиме отствует возможность выбрать или создать терм. Вместо этого используется явное цифровое обозначение.<br>';
			p.appendChild(InfernoAddElem('label',{style:'float:none;display:inline-block',className:'b ac stillsel'+(project.settings.grayMap?' sel':'')},[
				InfernoAddElem('input',{type:'checkbox', id:'prj_gray', checked:project.settings.grayMap},[]),
				InfernoAddElem('span',{innerHTML:' Использовать серые карты'},[])
			]));
			p.appendChild(InfernoAddElem('br',{},[]));
			p.appendChild(InfernoAddElem('br',{},[]));
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
		
		p.appendChild(InfernoAddElem('span',{innerHTML:'Изменения сохраняются автоматически. Используется терм, который был открыт последним. <b>Все значения элементов и связей корректируются после закрытия редактирования!</b><hr><ul><li>В случае перехода к режиму <i>Без термов</i>, вычисляется среднее значение;<li>В случае перехода из режима <i>Без термов</i>, выбираетс терм, на интервале которого лежит значение;<li>В случае изменения набора индексы выбранных термов не изменяются. При необходимости сменить набор с примерным сохранением заданных значений выберите режим <i>Без термов</i> и сохраните изменения, после чего выберите желаемый набор.</ul>'},[]));
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
			el.className = 'b fs';
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
				x.autoTerms = true;
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
			c.className = 'line';
			c.style = 'font-weight:700;font-size:120%;margin:8px 0';
			c.innerHTML = '&nbsp;';
			u.appendChild(c);
			for (var j=0; j<cache.types[0].length; j++) {
				c = document.createElement('div');
				c.className = 'line';
				c.innerHTML = cache.elements[cache.types[2][i]].calcChance[cache.types[0][j]][val+2]+(project.settings.grayMap?
					' — '+cache.elements[cache.types[2][i]].calcChance2[cache.types[0][j]][val+2]
				:'');
				if (project.settings.term != -3) c.innerHTML = getTermName(getTermInterval(c.innerHTML));
				u.appendChild(c);
			}
			c = document.createElement('div');
			c.className = 'line';
			c.style = 'font-weight:700';
			c.innerHTML = cache.elements[cache.types[2][i]].finCalcChance[val+2]+(project.settings.grayMap?
				' — '+cache.elements[cache.types[2][i]].finCalcChance2[val+2]
			:'');
			if (project.settings.term != -3) c.innerHTML = getTermName(getTermInterval(c.innerHTML));
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
				el2.className = 't';
				
				var el = document.createElement('span');
				el.className = 'b fs';
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
			c.className = 'line';
			c.style = 'font-weight:700;font-size:120%;margin:8px 0';
			c.innerHTML = getName(cache.types[2][i]);
			l.appendChild(c);
			for (j=0; j<cache.types[0].length; j++) {
				c = document.createElement('div');
				c.className = 'line';
				c.innerHTML = getName(cache.types[0][j]);
				l.appendChild(c);
			}
			c = document.createElement('div');
			c.className = 'line';
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
		var maxsum = 4;
		
		var els = [];
		for (var j=0; j<=4; j++) {
			els.push(InfernoAddElem('div',{innerHTML:'&nbsp',style:{right:(4-j)*25+'%'}},[]));
		}
		gel.appendChild(InfernoAddElem('div',{className:'line scale ax',innerHTML:'Общий риск'},els));
		
		el2.appendChild(InfernoAddElem('div',{className:'line ax',innerHTML:'&nbsp'},[]));
		for (var i = -2; i<project.cases.length; i++) {
			if (!api.isCaseEnabled(i)) continue;
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else s = project.cases[i].name;
			
			el2.appendChild(InfernoAddElem('div',{innerHTML:s,className:'line'},[]));
			
			
			if (maxsum < api.calcTSum(i)) maxsum = api.calcTSum(i);
			if (project.settings.grayMap) {
				el2.appendChild(InfernoAddElem('div',{innerHTML:'&nbsp;',className:'line'},[]));
				if (maxsum < api.calcTSum(i, '2')) maxsum = api.calcTSum(i, '2');
			}
		}
		
		var el4 = document.getElementById('graphscale');
		el4.innerHTML = '';
		
		for (i = 0; i<=4; i++) {
			el4.appendChild(InfernoAddElem('div',{innerHTML:parseInt(maxsum*i/4),style:{right:(4-i)*25+'%'}},[]));
		}
		for (i = -2; i<project.cases.length; i++) {
			if (!api.isCaseEnabled(i)) continue;
			for (let ix=(project.settings.grayMap?1:0); ix>=0; ix--) {
				let sname = (ix == 0?'':'2');
				
				els = [];
				for (var j=0; j<=4; j++) {
					els.push(InfernoAddElem('div',{innerHTML:'&nbsp',style:{right:(4-j)*25+'%'}},[]));
				}
							
				els.push(InfernoAddElem('span',{className:'c_b',innerHTML:api.calcCSum(i, sname),style:{width:100*(api.calcCSum(i, sname)/maxsum)+'%'}},[]));
				
				els.push(InfernoAddElem('span',{className:'c_c',innerHTML:api.calcTSum(i),style:{width:100*(api.calcSum(i)/maxsum)+'%'}},[]));
				
				gel.appendChild(InfernoAddElem('div',{className:'line scale'},els));
			}
		}
		
		for (var k=0; k<cache.types[2].length; k++) {
			var n = cache.types[2][k];			
			els = [];
			for (var j=0; j<=4; j++) {
				els.push(InfernoAddElem('div',{innerHTML:'&nbsp',style:{right:(4-j)*25+'%'}},[]));
			}
			gel.appendChild(InfernoAddElem('div',{innerHTML:getName(n),className:'line scale ax'},els));
			
			el2.appendChild(InfernoAddElem('div',{innerHTML:'&nbsp',className:'line ax'},[]));
			for (var i = -2; i<project.cases.length; i++) {
				if (!api.isCaseEnabled(i)) continue;
				var s = '';
				if (i == -2) s = 'Все отключено';
				else if (i == -1) s = 'Все включено';
				else s = project.cases[i].name;
				el2.appendChild(InfernoAddElem('div',{innerHTML:s,className:'line'},[]));
				if (project.settings.grayMap) el2.appendChild(InfernoAddElem('div',{innerHTML:'&nbsp;',className:'line'},[]));
			
				for (let ix=(project.settings.grayMap?1:0); ix>=0; ix--) {
					let sname = (ix == 0?'':'2');
					els = [];
					for (var j=0; j<=4; j++) {
						els.push(InfernoAddElem('div',{innerHTML:'&nbsp',style:{right:(4-j)*25+'%'}},[]));
					}
					
					els.push(InfernoAddElem('span',{className:'c_b',innerHTML:(cache.elements[n]['costs'+sname][i+2]),style:{width:100*((cache.elements[n]['costs'+sname][i+2])/maxsum)+'%'}},[]));
					
					gel.appendChild(InfernoAddElem('div',{className:'line scale'},els));
				}
			}
		}
	}
	
	this.renderMatrix= function(val) {
		var i;
		for (i=0; i<document.getElementById('matrixbutt').getElementsByClassName('b').length; i++) {
			document.getElementById('matrixbutt').getElementsByClassName('b')[i].classList.remove('sel');
		}
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
					ut.innerHTML = getName(j);
					ut.title = getName(j);
				}
				else if ((i != -1) && (j == -1)) {
					ut.innerHTML = getName(i);
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
			var x = ut3.getElementsByClassName('t2')[parseInt(project.bonds[i].first)+1].getElementsByClassName('t')[parseInt(project.bonds[i].second)+1];
			if (project.settings.term == -3) x.innerHTML = getBondVal(i, val)+(project.settings.grayMap?' — '+getBondVal(i, val, '2'):'');
			else x.innerHTML = getTermName(project.bonds[i].tval);
		}
	}
	
	this.matrixRefreshHighLight = function() {
		for (var i=0; i<=project.elements.length; i++) {
			for (var j=0; j<=project.elements.length; j++) {
				document.getElementById('matrixpad').getElementsByClassName('t2')[i].getElementsByClassName('t')[j].classList.remove('lit');
			}
		}
		for (var i=0; i<=project.elements.length; i++) {
			document.getElementById('matrixpad').getElementsByClassName('t2')[i].getElementsByClassName('t')[this.column+1].classList.add('lit');
			document.getElementById('matrixpad').getElementsByClassName('t2')[this.row+1].getElementsByClassName('t')[i].classList.add('lit');
		}
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
			el2.className = 't';
			if (!api.isCaseEnabled(i)) el2.className += ' hd';
			
			var el = document.createElement('span');
			el.className = 'b fs';
			el.innerHTML = s;
			el.value = i;
			el.addEventListener("click",function() {
				api.renderMatrix(this.value)});
			el2.appendChild(el);
			document.getElementById('matrixbutt').getElementsByClassName('t2')[0].appendChild(el2);
		}
		api.renderMatrix(-2);
	}
	
	this.renderStates= function(val) {
		var i;
		for (i=0; i<document.getElementById('statebutt').getElementsByClassName('b').length; i++) {
			document.getElementById('statebutt').getElementsByClassName('b')[i].classList.remove('sel');
		}
		document.getElementById('statebutt').getElementsByClassName('b')[val+2].classList.add('sel');
		
		var u = document.getElementById('statepad');
		u.innerHTML = '<div class="table r"><div class="t3"></div></div>';
		
		var ut3 = u.getElementsByClassName('t3')[0];
		for (i=-1; i<project.elements.length; i++) {
			if ((i>-1) && (project.elements[i] == undefined)) continue;
			let elem = cache.elements[i];
			var ut2 = document.createElement('div');
			ut2.className = 't2';
			if ((i != -1) && ((project.elements[i].type == 4) || (project.elements[i].type == 5))) ut2.classList.add('hd');
			for (var j=-1; j<cache.epochsPerCase[val]; j++) {
				if ((i != -1) && ((project.elements[i].type == 4) || (project.elements[i].type == 5))) continue;
				var ut = document.createElement('div');
				ut.className = 't';
				if ((j != -1) && (i == -1)) {
					ut.innerHTML = j;
				}
				else if ((j == -1) && (i == -1)) {
					ut.innerHTML = '&nbsp;';
				}
				else if (j == -1) {
					ut.innerHTML = getName(i);
					ut.title = getName(i);
				}
				else {
					let ix = elem.stateHistory[val][j];
					if (j == elem.stateHistory[val].length) ix = elem.cstate;
					if (project.settings.term != -3) ut.innerHTML = getTermName(getTermInterval(ix));
					else {
						ut.innerHTML = ix;
						if (project.settings.grayMap) {
							ix = elem.stateHistory2[val][j];
							if (j == elem.stateHistory2[val].length) ix = elem.cstate2;
							ut.innerHTML += ' — '+ix;
						}
					}
				}
				ut.row = i;
				ut.column = j;
				ut.addEventListener('mouseover',api.statesRefreshHighLight);
				ut2.appendChild(ut);
			}
			ut3.appendChild(ut2);
		}
	}
	
	this.statesRefreshHighLight = function() {
		for (var i=0; i<=project.elements.length; i++) {
			for (var j=0; j<document.getElementById('statepad').getElementsByClassName('t2')[i].getElementsByClassName('t').length; j++) {
				document.getElementById('statepad').getElementsByClassName('t2')[i].getElementsByClassName('t')[j].classList.remove('lit');
			}
		}
		for (var i=0; i<document.getElementById('statepad').getElementsByClassName('t2')[this.row+1].getElementsByClassName('t').length; i++) {
			document.getElementById('statepad').getElementsByClassName('t2')[this.row+1].getElementsByClassName('t')[i].classList.add('lit');
		}
		for (var i=0; i<=project.elements.length; i++) {
			document.getElementById('statepad').getElementsByClassName('t2')[i].getElementsByClassName('t')[this.column+1].classList.add('lit');
		}
	}
	
	this.drawStates = function() {
		api.hoveredStateColumn = -1;
		api.hoveredStateRow = -1;
		document.getElementById('statebutt').innerHTML = '<div class="table r"><div class="t3"><div class="t2"></div></div></div>';
		document.getElementById('statebutt').getElementsByClassName('t2')[0].innerHTML = '';
		if (project.cases == undefined) project.cases = [];
		for (var i = -2; i<project.cases.length; i++) {
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else s = project.cases[i].name;
			
			var el2 = document.createElement('span');
			el2.className = 't';
			if (!api.isCaseEnabled(i)) el2.className += ' hd';
			
			var el = document.createElement('span');
			el.className = 'b fs';
			el.innerHTML = s;
			el.value = i;
			el.addEventListener("click",function() {
				api.renderStates(this.value)});
			el2.appendChild(el);
			document.getElementById('statebutt').getElementsByClassName('t2')[0].appendChild(el2);
		}
		api.renderStates(-2);
	}
	
	this.drawLogs = function() {
		if (cache.logs == undefined) cache.logs = [];
		if (cache.logs2 == undefined) cache.logs2 = [];
		if (api.logsDisplay == undefined) api.logsDisplay = -2;
		if (project.settings.grayMap) {
			document.querySelector('#logs pre').style.width = '48%';
			document.querySelectorAll('#logs pre')[1].style.width = '48%';
			document.querySelectorAll('#logs pre')[0].innerHTML = 'Нижняя граница\n\n'+cache.logs[api.logsDisplay];
			document.querySelectorAll('#logs pre')[1].innerHTML = 'Верхняя граница\n\n'+cache.logs2[api.logsDisplay];
		}
		else {
			document.querySelector('#logs pre').style.width = '98%';
			document.querySelectorAll('#logs pre')[1].style.width = '0';
			document.querySelectorAll('#logs pre')[0].innerHTML = cache.logs[api.logsDisplay];
			
		}
		document.getElementById('logscases').innerHTML = '<div class="table r"><div class="t3"><div class="t2"></div></div></div>';
		document.getElementById('logscases').getElementsByClassName('t2')[0].innerHTML = '';
		if (project.cases == undefined) project.cases = [];
		for (var i = -2; i<project.cases.length; i++) {
			if (!api.isCaseEnabled(i)) continue;
			var s = '';
			if (i == -2) s = 'Все отключено';
			else if (i == -1) s = 'Все включено';
			else s = project.cases[i].name;
			
			var el2 = document.createElement('span');
			el2.className = 't';
			
			var el = document.createElement('span');
			el.className = 'b fs';
			el.innerHTML = s;
			el.value = i;
			if (i == api.logsDisplay) el.classList.add('sel');
			el.addEventListener("click",function() {
				api.logsDisplay = this.value;
				api.drawLogs();
			});
			el2.appendChild(el);
			document.getElementById('logscases').getElementsByClassName('t2')[0].appendChild(el2);
		}
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
		if (this.windows[id]) {	
			var e = document.getElementById(id).getElementsByClassName("w")[0];
			this.windowOnTop(id);
			return;
		}
		this.windows[id] = true;
		if (id == "settings") {
			document.getElementById("settings_button").classList.add("sel");
			document.getElementById("settings").classList.toggle("d");
			this.putSettings();
		}
		else if (id == "side") {
			document.getElementById("side_button").classList.add("sel");
			document.getElementById("side").classList.toggle("d");
		}
		else if (id == "project") {
			this.putMetas();
			document.getElementById("project_button").classList.add("sel");
			document.getElementById("project").classList.toggle("d");
		}
		else if (id == "cases") {
			this.drawCases();
			document.getElementById("cases").classList.toggle("d");
		}
		else if (id == "logs") {
			this.drawLogs();
			document.getElementById("logs").classList.toggle("d");
		}
		else if (id == "terms") {
			this.drawTerms();
			document.getElementById("terms").classList.toggle("d");
		}
		else if (id == "matrix") {
			this.drawMatrix();
			document.getElementById("matrix").classList.toggle("d");
		}
		else if (id == "states") {
			Recompile();
			this.drawStates();
			document.getElementById("states").classList.toggle("d");
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
			var tproject = (project.meta.compress?api.compressProject(project):project);
			if (arg1 != false) document.getElementsByClassName("ex_c")[0].value = JSON.stringify(tproject);
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
	
	this.invokeTermUpdate = function() {
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
					//us.value = getValueOfTerm(e.getElementsByClassName("cc_vsel")[0].selectedIndex);
				}
				else {
					us.classList.add('hd');
					var u = e.getElementsByClassName("cc_vsel")[0];
					u.classList.remove('hd');
					u.innerHTML = '';
					
					var t = api.getTermsPattern(project.settings.term);
					for (var j=0; j<t.terms.length; j++) {
						var c = document.createElement('option');
						//c.selected = (j == getTermInterval(parseFloat(us.value)));
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
		let updateElem = function(el, suff, pre) {
			if (pre == undefined) pre = '';
			if (api.selectedTerm != -3 && project.settings.term == -3) {
				if (el[pre+suff] != undefined) 
					el[pre+'t'+suff] = getTermInterval(project.settings.grayMap?(el[pre+suff+'2']-el[pre+suff])/2+el[pre+suff]:el[pre+suff], api.selectedTerm);
			}
			else if (api.selectedTerm == -3 && project.settings.term != -3) {
				if (el[pre+'t'+suff] != undefined) {
					el[pre+suff] = project.settings.grayMap?getDownValueOfTerm(el[pre+'t'+suff]):getValueOfTerm(el[pre+'t'+suff]);
					el[pre+suff+'2'] = project.settings.grayMap?getUpValueOfTerm(el[pre+'t'+suff]):getValueOfTerm(el[pre+'t'+suff]);
				}
			}
			else if (api.selectedTerm != -3 && project.settings.term != -3) {
				if (el[pre+'t'+suff] != undefined) 
					el[pre+'t'+suff] = el[pre+'t'+suff]>=api.getTermsPattern(api.selectedTerm).terms.length?api.getTermsPattern(api.selectedTerm).terms.length-1:el[pre+'t'+suff];
			}
			else if (api.selectedTerm == -3 && project.settings.term == -3) {
				if (project.settings.grayMap && el[pre+suff] != undefined && el[pre+suff+'2'] == undefined)
					el[pre+suff+'2'] = el[pre+suff];
			}
		};
		for (var i=0; i<project.elements.length; i++) if (project.elements[i] != undefined) {
			updateElem(project.elements[i], 'val');
			updateElem(project.elements[i], 'val', 'f');
			updateElem(project.elements[i], 'state');
			for (let j=0; j<project.cases.length; j++) if (project.cases[j] != undefined && project.cases[j].states != undefined && project.cases[j].states[i] != undefined) 
				updateElem(project.cases[j].states[i], 'state');
		}
		for (var i=0; i<project.bonds.length; i++) if (project.bonds[i] != undefined) {
			updateElem(project.bonds[i], 'val');
		}
		project.settings.term = api.selectedTerm;
		update();
		api.closePopup();
	}
	
	this.closeWindow = function(id) {
		if (this.windows[id] == undefined) return;
		document.getElementById(id).classList.toggle("d");
		if (id == "settings") document.getElementById("settings_button").classList.remove("sel");
		else if (id == "project") {
			document.getElementById("project_button").classList.remove("sel");
			Recalculate();
		}
		else if (id == 'cases') {
			Recalculate();
		}
		else if (id == "terms") {
			if (document.getElementById('prj_gray') != undefined && document.getElementById('prj_gray').checked) project.settings.grayMap = true;
			else project.settings.grayMap = false;
			setTimeout(api.invokeTermUpdate, 1);
			this.callPopup2(windows.loader);
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
		
		this.settings.chInterval = 16;
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
		if (this.settings.noMultitool == undefined) this.settings.noMultitool = false;
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
		document.getElementById("st_noMultitool").checked = this.settings.noMultitool;
		document.getElementById("st_night").checked = this.settings.nightMode;
		
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
		this.settings.noMultitool = document.getElementById("st_noMultitool").checked;
		this.settings.nightMode = document.getElementById("st_night").checked;
		
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
		this.styleSwitch('noMultitool','noMultitool',false,false,false);
		this.styleSwitch('night','nightMode',false,false,false);
		if (api.brush<0) this.selectBrush(api.settings.noMultitool?-1:-4);
		this.topFontSize();
		this.glFontSize();
		this.fontSwitch();
			
		this.forceRedraw = true;
		//update();
	}
	
	this.updateUniqMenus = function() {
		if (project.settings.calcFunc == -1) 
			for (let i=0; i<document.getElementsByClassName('only_ways').length; i++)
				document.getElementsByClassName('only_ways')[i].classList.add('hd');
		else
			for (let i=0; i<document.getElementsByClassName('only_ways').length; i++)
				document.getElementsByClassName('only_ways')[i].classList.remove('hd');
		if (project.settings.actFunc == -1) 
			for (let i=0; i<document.getElementsByClassName('only_states').length; i++)
				document.getElementsByClassName('only_states')[i].classList.add('hd');
		else
			for (let i=0; i<document.getElementsByClassName('only_states').length; i++)
				document.getElementsByClassName('only_states')[i].classList.remove('hd');
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
				document.getElementById('m_pass1').value = project.settings.password;
				document.getElementById('m_pass2').value = project.settings.password;
			}
			
		}
		if (project.settings != undefined) {
			document.getElementById('m_strict').checked = project.settings.strict;
			document.getElementById('m_propsize').checked = project.settings.proportional;
			document.getElementById('m_propcolor').checked = project.settings.propColor;
		}
		
		var ec = document.getElementById('m_calcfunc');
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (parseInt(ec.querySelectorAll('.acr input')[i].value) == project.settings.calcFunc) {
				ec.querySelectorAll('.acr input')[i].checked = true;
				api.switchRadioElemState(ec.querySelectorAll('.acr')[i]);
			}
			else {
				ec.querySelectorAll('.acr')[i].checked = false;
			}
		}
		
		ec = document.getElementById('m_actfunc');
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (parseInt(ec.querySelectorAll('.acr input')[i].value) == project.settings.actFunc) {
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
		if (document.getElementById('m_encrypt').checked && !document.getElementById('m_compress').checked) {
			api.addMessage('Шифровать можно только сжатый проект','red');
			return;
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
		//project.settings = {term:project.settings.term, currentCase:project.settings.currentCase};
		project.settings.strict = document.getElementById('m_strict').checked;
		project.settings.proportional = document.getElementById('m_propsize').checked;
		project.settings.propColor = document.getElementById('m_propcolor').checked;
		if (project.meta.encrypt) project.settings.password = document.getElementById('m_pass1').value;
		var ec = document.getElementById('m_calcfunc'), t=0;
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (ec.querySelectorAll('.acr input')[i].checked) {
				t=parseInt(ec.querySelectorAll('.acr input')[i].value);
				break;
			}
		}
		project.settings.calcFunc = t;
		
		ec = document.getElementById('m_actfunc'), t=0;
		for (var i=0; i<ec.querySelectorAll('.acr').length; i++) {
			if (ec.querySelectorAll('.acr input')[i].checked) {
				t=parseInt(ec.querySelectorAll('.acr input')[i].value);
				break;
			}
		}
		
		project.settings.actFunc = t;
		
		api.updateUniqMenus();
		
		api.compiled = false;
		api.initRTS();
		Recalculate();
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
		api.mouse.onCanvas = e.target.tagName == "CANVAS";
		api.mouse.X = parseInt(e.clientX-cc.left);
		api.mouse.Y = parseInt(e.clientY-cc.top);
		if (ec || (e.which == 0)) api.mouse.button = e.buttons;
		document.getElementById("debug_mouseInfo").innerHTML = api.mouse.X+':'+api.mouse.Y+' ['+api.mouse.button+']';
		document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
	}
	
	this.keyListener = function(e, ev) {
		if ((ev.target.nodeName == 'INPUT') && e!=13 && e!=27) return;
		if (ev.target.nodeName == 'TEXTAREA' && e!=27) return;
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
			if (document.querySelector('#side .pad[data-tab="1"]').style.display == 'block') {
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
	
	this.handleZoom = function() {
		if (api.smoothZoom == 0 || api.smoothZoom == undefined) return;
		
		if (api.smoothZoom > 0 && project.viewport.z<50) project.viewport.z*=(1+(api.smoothZoom/6000));
		if (api.smoothZoom < 0 && project.viewport.z>0.0125) project.viewport.z*=(1+(api.smoothZoom/6000));
		
		if (api.smoothZoom > 0) {
			api.smoothZoom -= api.settings.chInterval;
			if (api.smoothZoom<0) api.smoothZoom = 0;
		} else {
			api.smoothZoom += api.settings.chInterval;
			if (api.smoothZoom>0) api.smoothZoom = 0;
		}
		
		api.forceRedraw = true;
		document.getElementById("debug_viewport").innerHTML = parseInt(project.viewport.x)+':'+parseInt(project.viewport.y)+' '+parseInt(100/project.viewport.z)+'%';
	}
	
	this.mouseWheelListener = function(e) {
		if (api.smoothZoom == undefined) api.smoothZoom = 0;
		if (api.settings.transparency) {
			if (e.deltaY > 0 && project.viewport.z<50) {
				if (api.smoothZoom > 0) api.smoothZoom += (20000/(api.smoothZoom<150?150:api.smoothZoom));
				else api.smoothZoom += 200;
			}
			if (e.deltaY < 0 && project.viewport.z>0.0125) {
				if (api.smoothZoom < 0) api.smoothZoom += (20000/(api.smoothZoom>-150?-150:api.smoothZoom));
				else api.smoothZoom -= 200;
			}
		}
		else {
			if (e.deltaY > 0 && project.viewport.z<50) project.viewport.z*=1.25;
			if (e.deltaY < 0 && project.viewport.z>0.0125) project.viewport.z/=1.25;
		}
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
			if (!api.isCaseEnabled(i)) continue;
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
			update();
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
	
	this.prepareErrorExport = function (pr) {
		document.getElementsByClassName('ex_c')[0].value = pr;
	}
	
	this.init = function(fatal) {
		!localStorage && (l = location, p = l.pathname.replace(/(^..)(:)/, "$1$$"), (l.href = l.protocol + "//127.0.0.1" + p));
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
				selection.keep = false;
				api.forceRedraw = true;
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
				api.putMetaData(document.getElementById("import").getElementsByClassName("im_c")[0].value,document.getElementById("importpad"), true);
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
						api.putMetaData(document.getElementById("import").getElementsByClassName("im_c")[0].value,document.getElementById("importpad"), true)
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
		
		
			if (localStorage == undefined || localStorage["hasSettings"] != "true") {
				this.loadDefault();
				this.saveSettings();
			}
			else {
				this.loadSettings();
				this.fixSettings();
			}
			
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
		this.styleSwitch('noMultitool','noMultitool',false,false,false);
		//this.changeSidePad(0);
		//this.changeBottomPad(0);
		this.selectBrush(api.settings.noMultitool?-1:-4);
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
		windows.limitReached = {header:'Достигнут предел!',content:'Достигнут предел эпох для симуляции! Вероятно, у системы нет устойчивого состояния.',size:1,buttons:[{red:false,functions:'api.closePopup();',name:'Ок'}],windowsize:'sm'};
		windows.sureSave = {header:'Внимание!',content:'Предыдущие данные будут перезаписаны!',size:2,buttons:[{red:false,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.saveDone = {header:'Успех!',content:'Успешно сохранено!',size:1,buttons:[{red:false,functions:'api.closePopup();',name:'Продолжить'}],windowsize:'sm'};
		windows.newProject = {header:'Новый проект',content:'Перед непосредственным началом проектирования рекомендуется сразу задать такие настройки, как "Тип когнитивной карты", "Набор лингвистических термов" и "Функция активации". Вы можете изменить эти настройки в дальнейшем, но возможна потеря уже введеных значений.',size:1,buttons:[{red:false,functions:'api.closePopup();',name:'Продолжить'}],windowsize:'sm'};
		windows.sureDelete = {header:'Внимание!',content:'Вы удалите этот элемент и все, что на нем находится. Вы не сможете все это вернуть!',size:2,buttons:[{red:true,name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		
		windows.sureDeleteSelection = {header:'Внимание!',content:'Вы удалите все выбранные элементы, все относящиеся к ним связи и элементы на этих связях! Вы не сможете все это вернуть!',size:2,buttons:[{red:true,name:'Продолжить',functions:'selection.deleteSelection();api.closePopup();'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		
		windows.deleteSave = {header:'Внимание!',content:'Подтвердите удаление этого слота.',size:2,buttons:[{red:true,functions:'api.deleteSave(undefined, false)',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.deleteCase = {header:'Внимание!',content:'Подтвердите удаление этого кейса.',size:2,buttons:[{red:true,functions:'',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.deleteTerm = {header:'Внимание!',content:'Подтвердите удаление этого терма.',size:2,buttons:[{red:true,functions:'',name:'Продолжить'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.loader = {header:'Загружается...',content:'<div id="squaresWaveG" style="margin-bottom:24px"><div id="squaresWaveG_1" class="squaresWaveG"></div><div id="squaresWaveG_2" class="squaresWaveG"></div><div id="squaresWaveG_3" class="squaresWaveG"></div><div id="squaresWaveG_4" class="squaresWaveG"></div><div id="squaresWaveG_5" class="squaresWaveG"></div><div id="squaresWaveG_6" class="squaresWaveG"></div><div id="squaresWaveG_7" class="squaresWaveG"></div><div id="squaresWaveG_8" class="squaresWaveG"></div></div><div id="loadstring" style="font-size:150%"></div></div>',size:0,windowsize:'sm'};
		windows.update = {header:'Обновление!',content:'Программа была обновлена до версии <b>'+this.updated+'</b>! Рекомендуется перезапустить программу, чтобы загрузились все обновленные файлы.',size:3,buttons:[{functions:'api.closePopup();',red:false,name:'Закрыть'},{functions:'api.callPopup2(windows.changelog);',red:false,name:'Список изменений'},{functions:'location.reload(true);',red:true,name:'Перезапустить'}],windowsize:'sm'};
		
		
		windows.saveError = {header:'Ошибка!',size:2,buttons:[{functions:'api.callWindow("export",false);api.closePopup();',red:false,name:'Выполнить экспорт'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		windows.loadError = {header:'Ошибка!',size:3,buttons:[{functions:'api.callWindow("export",false);api.closePopup();',red:false,name:'Выполнить экспорт'},{functions:'location.reload();',red:false,name:'Перезагрузить программу'},{functions:'api.closePopup();',red:false,name:'Отмена'}],windowsize:'sm'};
		
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

	this.parseEvent = function (elem, cat) {
		if (elem == undefined) return;
		if (elem.dataset != undefined) {
			if (cat == 'click') {
				if (elem.dataset.tabSelect != undefined) {
					var tabContainer = elem.parentNode;
					while (tabContainer.dataset == undefined || tabContainer.dataset.tabId == undefined) 
						tabContainer = tabContainer.parentNode;
					var tabs = tabContainer.querySelectorAll('[data-tab][data-tab-id="'+tabContainer.dataset.tabId+'"]');
					var tabHeaders = tabContainer.querySelectorAll('[data-tab-select][data-tab-id="'+tabContainer.dataset.tabId+'"]');
					for (var i=0; i<tabs.length; i++) {
						tabs[i].style.display = (tabs[i].dataset.tab == elem.dataset.tabSelect?'block':'none');
					}
					for (var i=0; i<tabHeaders.length; i++) {
						tabHeaders[i].classList.remove('sel');
					}
					elem.classList.add('sel');
				}
			}
			else if (cat == 'change') {
				if (elem.dataset.mark != undefined) {
					for (var i=0; i<elem.parentNode.querySelectorAll(elem.dataset.mark).length; i++) {
						elem.parentNode.querySelectorAll(elem.dataset.mark)[i].checked = true;
					}
				}
				if (elem.classList.contains('ac')) {
					api.switchElemState(elem);
				}
				if (elem.classList.contains('acr')) {
					api.switchRadioElemState(elem);
				}
			}
		}
		if (elem.tagName != 'BODY') api.parseEvent(elem.parentNode, cat);
	}
	
	this.handleClickEvents = function (e) {
		api.parseEvent(e.target, 'click');
	}
	
	this.handleChangeEvents = function (e) {
		api.parseEvent(e.target, 'change');
	}
}

var api = new exapi();

window.onload = function () {
	if (document.getElementById("loadstring") != undefined) document.getElementById("loadstring").innerHTML = returnRandomLoadingLine();
	setTimeout(function() {api.init(true)},200);
	document.body.addEventListener('click', api.handleClickEvents);
	document.body.addEventListener('scroll', api.handleScrollEvents);
	document.body.addEventListener('change', api.handleChangeEvents);
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