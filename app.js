var project = {settings:{},elements:[],bonds:[],viewport:{}};
var colorScheme = [
{bg:"#fff",line:"#ddd",coord:"#f88",connections:"#111",actconn:"#8f8",fakeconn:"#f88",fakeconnt:"#800",
selected:"#00f",aconnections:"rgba(17,17,17,0)",aactconn:"rgba(136,255,136,0)",afakeconn:"rgba(255,136,136,0)",afakeconnt:"rgba(136,0,0,0)",
text:'#000',stext:'#fff',seltext:'#060'},
{bg:"#001",line:"#001828",coord:"#600",connections:"#4bb",actconn:"#060",fakeconn:"#600",fakeconnt:"#f88",
selected:"#880",aconnections:"rgba(68,187,187,0)",aactconn:"rgba(0,102,0,0)",afakeconn:"rgba(102,0,0,0)",afakeconnt:"rgba(255,136,136,0)",    
text:'#ccd',stext:'#111',seltext:'#8f8'}];
var ctx, tcx, zoomprop, linePattern, frame=0;
var doMoving = {};
var currentBrush = {};
var cache = {};
let fixed_point = 4;

var AuxBonds, AuxBonds2, dAuxBonds;
var AuxMove, tElemX, tElemY, tBond, tElem;


function isOnBond(id) {
	return project.elements[id].type == 4 || project.elements[id].type==5;
} 

function cCode(id, type) {
	if (type == 1) return 'C(T)'+id; 	//treat
	if (type == 2) return 'C(R)'+id;	//resource
	if (type == 3) return 'C(A)'+id;	//aim
	if (type == 4) return 'C(p)'+id;	//protector
	if (type == 5) return 'C(c)'+id;	//chaos, lol
	return 'C'+id;
}

function getCode(id) {
	var s='';
	var e = project.elements[id];
	if (e == undefined) return '';
	if (e.alias > -1) {
		for (var i=0; i<cache.elements[e.alias].aliases.length; i++) 
			if (cache.elements[e.alias].aliases == id) {
				s = '['+i+']';
				break;
			}
		id = e.alias;
	}
	return cCode(id, e.type)+s;
}

function getName(id) {
	if (typeof id == 'object') {
		if (api.settings.actualNames) return id.name;
		return getCode(id.id);
	}
	if (project.elements[id] == undefined || id == undefined) return '[ERROR]';
	if (api.settings.actualNames) return project.elements[id].name;
	return getCode(id);
}

function resetProject(crash) {
	var t = new Date();
	project = {meta:{},settings:{},elements:[],bonds:[],viewport:{}};
	project.settings.strict = true;
	project.settings.proportional = false;
	project.meta.timeCreated = t.getTime();
	project.meta.timeSaved = t.getTime();
	project.meta.description = '';
	project.cases = [];
	project.terms = [];
	project.unusedCases = [];
	project.settings.term = -3;
	project.settings.propColor = true;
	project.settings.calcFunc = 0;
	project.settings.actFunc = 1;
	update();
	api.initRTS();
	api.initRTSCases();
	api.changed=false;
	api.settings.lastLoaded = undefined;
	selection.tryAllowStuff();
	Recalculate();
	api.showElSel = undefined;
	api.showBSel = undefined;
	if (crash) {
		resetViewport();
		setTimeout(appMain, api.settings.chInterval);
	}
}

function resetViewport() {
	project.viewport.x=0;
	project.viewport.y=0;
	project.viewport.z=0.5;
}

//холст -> экран
function translateCoordsX(i) {
	return (i-project.viewport.x)/project.viewport.z+ctx.canvas.width/2;
}

function translateCoordsY(i) {
	return (i-project.viewport.y)/project.viewport.z+ctx.canvas.height/2;
}

//экран -> холст
function translateCoordsReverseX(i) {
	return (i-ctx.canvas.width/2-0.5/project.viewport.z)*project.viewport.z+project.viewport.x+(i-ctx.canvas.width/2>0?1:0);
}

function translateCoordsReverseY(i) {
	return (i-ctx.canvas.height/2-0.5/project.viewport.z)*project.viewport.z+project.viewport.y+(i-ctx.canvas.height/2>0?1:0);
}

//то же без учета масштаба
function translateCoordsReverseNZX(i) {
	return (i-ctx.canvas.width/2)+project.viewport.x;
}

function translateCoordsReverseNZY(i) {
	return (i-ctx.canvas.height/2)+project.viewport.y;
}

//на связи -> холст
function translateOnBondCoordsX(b, ac) {
	var x = parseFloat(project.elements[project.bonds[b].first].X);
	if (cache.bonds[b].pair != undefined) {
		x += (parseFloat(project.elements[project.bonds[b].second].X) - parseFloat(project.elements[project.bonds[b].first].X)) / 2;
	}
	return x+((parseFloat(project.elements[project.bonds[b].second].X)-x)*ac);
}

function translateOnBondCoordsY(b, ac) {
	var y = parseFloat(project.elements[project.bonds[b].first].Y);
	if (cache.bonds[b].pair != undefined) {
		y += (parseFloat(project.elements[project.bonds[b].second].Y) - parseFloat(project.elements[project.bonds[b].first].Y)) / 2;
	}
	return y+((parseFloat(project.elements[project.bonds[b].second].Y)-y)*ac);
}

function getColor(a) {
	var c = a;
	if (c<-1) c=-1; 
	if (c>1) c=1;
	if (c<-0.5) return 'rgb(0, '+parseInt((255-511*(Math.abs(c)-0.5))/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+')';
	if (c<0) return 'rgb(0, '+(api.settings.nightMode?255:170)+','+parseInt(511*Math.abs(c)/(api.settings.nightMode?1:1.5))+')';
	if (c<0.5) return 'rgb('+parseInt(511*c/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+',0)';
	else return 'rgb(255,'+parseInt((255-511*(c-0.5))/(api.settings.nightMode?1:1.5))+',0)';
}

function agetColor(a) {
	var c = a;
	if (c<-1) c=-1; 
	if (c>1) c=1;
	if (c<-0.5) return 'rgb(0, '+parseInt((255-511*(Math.abs(c)-0.5))/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+',0)';
	if (c<0) return 'rgb(0, '+(api.settings.nightMode?255:170)+','+parseInt(511*Math.abs(c)/(api.settings.nightMode?1:1.5))+',0)';
	if (c<0.5) return 'rgba('+parseInt(511*c/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+',0,0)';
	else return 'rgba(255,'+parseInt((255-511*(c-0.5))/(api.settings.nightMode?1:1.5))+',0,0)';
}

function colorToA(a) {
	return a.replace('rgb','rgba').replace(')',',0');
}

function grad(a, b, c) {
	let ac = [], bc = [];
	let s = a.split('(')[1].split(',');
	let sb = b.split('(')[1].split(',');
	for (let i=0; i<3; i++) {
		ac[i] = parseInt(s[i]);
		bc[i] = parseInt(sb[i]);
		
		ac[i] += parseInt((bc[i]-ac[i])*c);
	}
	return 'rgba('+ac[0]+','+ac[1]+','+ac[2]+',1)';
}

function hexToRgb(hex) {
	if (hex.length == 4) hex = '#'+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? ('rgb('+
        parseInt(result[1], 16)+','+
        parseInt(result[2], 16)+','+
        parseInt(result[3], 16)+')')
     : null;
}

function deXSS(s) {
	//по сути, нас только <script> должно пугать
	return s.replace(RegExp('<', 'g'), '&lt;')/*.replace(RegExp('>', 'g'), '&gt;').replace(RegExp('"', 'g'), '&#34;').replace(RegExp("'", 'g'), '&#39;')*/;
}

function gridCoords(i) {
	return parseInt(Math.round(parseInt(i)/zoomprop)*zoomprop);
}

function appDrawBond(el,b) {
	if (project.viewport.z>4) ctx.lineWidth = 1;
	else if (project.viewport.z>1) ctx.lineWidth = 2;
	else ctx.lineWidth = 3;
	
	if ((AuxBonds2 != undefined) && api.settings.tooltips && api.brush == 99) {
		ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
		if (!isBondUnique(AuxBonds,AuxBonds2) || AuxBonds==AuxBonds2) ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
		ctx.setLineDash([3, 5]);
		ctx.beginPath();
		ctx.moveTo(translateCoordsX(el[AuxBonds].X),translateCoordsY(el[AuxBonds].Y));
		ctx.lineTo(translateCoordsX(el[AuxBonds2].X),translateCoordsY(el[AuxBonds2].Y));
		ctx.closePath();
		ctx.stroke();
		ctx.setLineDash([1, 0]);
	}
	for (var i=0; i<b.length; i++) {
		if (b[i] == undefined) continue;
		var tx1 = el[b[i].first].X;
		var ty1 = el[b[i].first].Y;
		if (cache.bonds[i].pair != undefined) {
			tx1 += (el[b[i].second].X - el[b[i].first].X) / 2;
			ty1 += (el[b[i].second].Y - el[b[i].first].Y) / 2;
		}
		var x1 = translateCoordsX(tx1), y1 = translateCoordsY(ty1);
		var x2 = translateCoordsX(el[b[i].second].X), y2 = translateCoordsY(el[b[i].second].Y);
		
		//выбрана ли?
		var isSel = (cache.bonds[i].active != 0);
		var tc = (cache.bonds[i].active==1?'actconn':'fakeconn');
		let color1, color2;

		if (isSel) {
			color1 = colorScheme[(api.settings.nightMode?1:0)][tc];
			color2 = colorScheme[(api.settings.nightMode?1:0)][tc];
		}
		else {
			if (project.settings.propColor) {
				color1 = getColor((getBondVal(i, project.settings.currentCase)));
				color2 = getColor((getBondVal(i, project.settings.currentCase, (project.settings.grayMap?'2':''))));
			}
			else {
				color1 = colorScheme[(api.settings.nightMode?1:0)].connections;
				color2 = colorScheme[(api.settings.nightMode?1:0)].connections;
			}
		}
		
		if (color1.startsWith('#')) color1 = hexToRgb(color1);
		if (color2.startsWith('#')) color2 = hexToRgb(color2);
		
		if (api.settings.transparency || (project.settings.grayMap && project.settings.propColor)) {
			var grd=ctx.createLinearGradient(x1,y1,x2,y2);
			grd.addColorStop(0,api.settings.transparency?colorToA(color1):color1);
			grd.addColorStop(0.3,color1);
			grd.addColorStop(0.7,color2);
			ctx.fillStyle = grd;
			ctx.strokeStyle = grd;
		}
		else {
			ctx.strokeStyle = color1;
			ctx.fillStyle = color1;
			
		}
		
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.closePath();
		ctx.stroke();
		ctx.beginPath();
		var a = -3.14/2-Math.atan2(x1-x2, y1-y2);
		var d = getSize(b[i].second);
		var cx = x2 - d*Math.cos(a);
		var cy = y2 - d*Math.sin(a);
		ctx.moveTo(cx,cy);
		var dx = x2 - d*2*Math.cos(a);
		var dy = y2 - d*2*Math.sin(a);
		
		ctx.lineTo(dx+(getSize(b[i].second)/3*Math.cos(a+3.14/2)),dy+(getSize(b[i].second)/3*Math.sin(a+3.14/2)));
		ctx.lineTo(dx+(getSize(b[i].second)/3*Math.cos(a-3.14/2)),dy+(getSize(b[i].second)/3*Math.sin(a-3.14/2)));
		ctx.lineTo(cx,cy);
		
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}	
}

function getSize(i) {
	var ac;
	if (i == -1) ac = 1;
	else if (project.elements[i] == undefined) return 1;
	else if (project.elements[i].val == undefined) {
		ac = project.elements[i].z;
	}
	else if (project.settings.proportional && (project.elements[i].val>0)) {
		ac = project.elements[i].val;
		if (ac > 1) ac = 3-2/Math.log(ac);
		else ac = (ac+0.1)*3;
		ac/=2;
	}
	else ac = project.elements[i].z;
	if (project.viewport.z>10) return api.settings.elemSize*ac/10;
	if (project.viewport.z>8) return api.settings.elemSize*ac/8;
	if (project.viewport.z>4) return api.settings.elemSize*ac/4;
	if (project.viewport.z>2) return api.settings.elemSize*ac/3;
	if (project.viewport.z>1) return api.settings.elemSize*ac/2;
	if (project.viewport.z>0.5) return api.settings.elemSize*ac/1.5;
	return api.settings.elemSize*ac;
}

function appDrawElements(el) {
	//пора разгребать
	var size;
	for (var i=0; i<el.length; i++) {
		var j;
		//элемент существует
		if (el[i] == undefined) continue;
		
		//получаем размер
		size = getSize(i);
		
		//получаем коорды
		var x = el[i].X, y = el[i].Y;
		
		//выбран ли?
		var isSelected = (cache.elements[i].active != 0 || selection.elements[i]);
		
		//определяем цвет заливки
		if (el[i].privateColor != "" && el[i].privateColor != "0") {
			ctx.fillStyle = el[i].privateColor;
			ctx.strokeStyle = el[i].privateColor;
		}
		else {
			ctx.fillStyle = api.settings.color[el[i].type-1];
			ctx.strokeStyle = api.settings.color[el[i].type-1];
		}
		
		//выбираем обводку
		if ((api.brush == 99) && (AuxBonds == i)) ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].actconn;
		if (isSelected) {
			if (cache.elements[i].active == 1) ctx.strokeStyle = api.settings.color[6];
			else if (selection.elements[i]) ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].text;
			else ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].fakeconn;
		}
		if ((AuxBonds == i) && api.settings.tooltips) {
			if ((api.brush == 99) && !isBondUnique(AuxBonds,AuxBonds2) || AuxBonds==AuxBonds2) {
				ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
				document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
			}
			else if (api.brush == 99) document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].line;
			else document.getElementById("brush0").style.background="";
		}
		
		//рисуем на связи
		if ((el[i].type == 4) || (el[i].type == 5)) {
			var b = project.bonds;
			
			x = translateOnBondCoordsX(el[i].X, el[i].Y);
			y = translateOnBondCoordsY(el[i].X, el[i].Y);
			
			var x1 = el[b[el[i].X].first].X;
			var y1 = el[b[el[i].X].first].Y;
			var x2 = el[b[el[i].X].second].X;
			var y2 = el[b[el[i].X].second].Y;
			var a = 3.14-Math.atan2(x1-x2, y1-y2);
			var tcanvas = document.createElement('canvas');
			tcanvas.width = size*el[i].z*3;
			tcanvas.height = size*el[i].z*3;
			tcx = tcanvas.getContext('2d');
			tcx.fillStyle = ctx.fillStyle;
			tcx.strokeStyle = ctx.strokeStyle;
			tcx.lineWidth = 3;
			tcx.beginPath();
			tcx.arc(size*1.5, size*1.5, size*1.25, a+3.14/10, a+3.14*9/10);
			tcx.closePath();
			tcx.fill();
			if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) tcx.stroke();
			//tcx.beginPath();
			//tcx.arc(size*1.5, size*1.5, size*1.25, a+3.14/5, a+3.14*4/5);
			//tcx.closePath();
			//tcx.fill();
			//if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) tcx.stroke();
			ctx.drawImage(tcanvas,translateCoordsX(x)-size*1.5,translateCoordsY(y)-size*1.5);
			
		}
		
		//рисуем просто так
		else {
			ctx.beginPath();
			ctx.arc(translateCoordsX(x),translateCoordsY(y), size, 0,6.28);
			ctx.closePath();
			ctx.fill();
			if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) ctx.stroke();
		}
		
		
	}
	// подписи
	if (api.settings.elemLabels || (api.hasActiveElems && api.settings.activeElems)) for (var i=0; i<el.length; i++) {
		//существует
		if (el[i] == undefined) continue;
		
		//выбран ли?
		var isSelected = (cache.elements[i].active != 0);
		if (((api.settings.activeElems && api.hasActiveElems) || project.viewport.z>2) && !isSelected) continue; 
		
		//получаем коорды
		var x = el[i].X, y = el[i].Y;
		if ((el[i].type == 4) || (el[i].type == 5)) {
			x = translateOnBondCoordsX(el[i].X, el[i].Y);
			y = translateOnBondCoordsY(el[i].X, el[i].Y);
		}
		
		ctx.font = 300+100*(api.settings.nightMode?0:1)+" "+12*api.settings.glFontSize/100+"pt "+(api.settings.cursor?"'Open Sans'":"'Verdana'");
		if (isSelected) {
			if (cache.elements[i].active == 1) ctx.fillStyle = colorScheme[(api.settings.nightMode?1:0)].seltext;
			else ctx.fillStyle = colorScheme[(api.settings.nightMode?1:0)].fakeconnt;
		}
		else ctx.fillStyle = colorScheme[(api.settings.nightMode?1:0)].text;
		ctx.lineWidth = 5;
		ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].stext;
		ctx.textAlign = 'center';
		if (translateCoordsY(y) < ctx.canvas.height/2) {
			ctx.textBaseline = 'top';
			ctx.strokeText(getName(i), translateCoordsX(x), translateCoordsY(y)+size*1.05);
			ctx.fillText(getName(i), translateCoordsX(x), translateCoordsY(y)+size*1.05);
		}
		else {
			ctx.textBaseline = 'bottom';
			ctx.strokeText(getName(i), translateCoordsX(x), translateCoordsY(y)-size*1.05);
			ctx.fillText(getName(i), translateCoordsX(x), translateCoordsY(y)-size*1.05);
		}
	}
	
	
	size = getSize(-1);
	if (((api.brush>0 && api.brush<=6)) && api.settings.tooltips) {
		ctx.strokeStyle = api.settings.color[api.brush-1];
		ctx.setLineDash([3, 5]);
		ctx.beginPath();
		if ((api.brush == 4) || (api.brush == 5)) {
			if (tElemX != undefined) ctx.arc(translateCoordsX(translateOnBondCoordsX(tElemX,tElemY)),translateCoordsY(translateOnBondCoordsY(tElemX,tElemY)), size, 0,6.28);
		}
		else ctx.arc(translateCoordsX(tElemX),translateCoordsY(tElemY), size, 0,6.28);
		
		ctx.closePath();
		ctx.stroke();
		ctx.setLineDash([1, 0]);
	}
}


function appRedraw() {
	var f_activeRoadmap = function(roadMap) {
		if (roadMap != undefined) {
			for (var j=0; j<roadMap.length; j++) {
				if ((roadMap[j] == undefined) || (roadMap[j].length==0)) continue;
				for (var k=0; k<roadMap[j][project.settings.currentCase+2].length; k++) {
					var ue = roadMap[j][project.settings.currentCase+2][k];
					cache.elements[ue].active = 2;
					
					//активация связей
					if (k+1<roadMap[j][project.settings.currentCase+2].length) for (var y=0; y<cache.elements[ue].outbonds.length; y++) {
						if (project.bonds[cache.elements[ue].outbonds[y]].second == roadMap[j][project.settings.currentCase+2][k+1]) {
							cache.bonds[cache.elements[ue].outbonds[y]].active = 2;
							break;
						}
					}
				}
			}
		}
	}
	
	// обнуление активных связей
	for (var i=0; i<cache.bonds.length; i++) cache.bonds[i].active = 0;
	
	// активные элементы
	api.hasActiveElems = false;
	for (var i=0; i<cache.elements.length; i++) cache.elements[i].active = 0;
	if (tElem != undefined) {
		var roadMap = cache.elements[tElem].calcRoadMap;
		f_activeRoadmap(roadMap);
		cache.elements[tElem].active = 1;
		api.hasActiveElems = true;
	}
	if (cache.elements[api.showElSel] == undefined) 
		api.showElSel = undefined;
	if (api.showElSel != undefined) {
		cache.elements[api.showElSel].active = 1;
		api.hasActiveElems = true;
	}
	if (api.activeWindow!=undefined && api.activeWindow.startsWith("edite")) {
		var u = document.getElementById(api.activeWindow).getElementsByClassName("cc_id")[0].value;
		var roadMap = cache.elements[u].calcRoadMap;
		cache.elements[u].active = 1;
		f_activeRoadmap(roadMap);
		api.hasActiveElems = true;
	}
	
	// активные связи
	if (cache.bonds[api.showBSel] == undefined) 
		api.showBSel = undefined;
	if (tBond != undefined) {
		cache.bonds[tBond].active = 1;
	}
	if (api.showBSel != undefined) {
		cache.bonds[api.showBSel].active = 1;
	}
	if (api.activeWindow!=undefined && api.activeWindow.startsWith("editb")) {
		var u = document.getElementById(api.activeWindow).getElementsByClassName("cc_id")[0].value;
		cache.bonds[u].active = 1;
	}

	//
	ctx.canvas.width  = window.innerWidth * api.settings.canvasSize / 100;
	ctx.canvas.height = window.innerHeight * api.settings.canvasSize / 100;
	
	var mode = (api.settings.nightMode?1:0);
	var xmax = ctx.canvas.width;
	var ymax = ctx.canvas.height;
	
	ctx.fillStyle = colorScheme[mode].bg;
	ctx.fillRect(0, 0, xmax, ymax);
	
	ctx.strokeStyle = colorScheme[mode].line;
	ctx.lineWidth = 1;

	var x = xmax/2 - project.viewport.x/project.viewport.z;
	var y = ymax/2 - project.viewport.y/project.viewport.z;
	
	var d = 1/project.viewport.z;
	for (zoomprop=1; d<api.settings.elemSize; zoomprop*=3) d = zoomprop/project.viewport.z;
	zoomprop/=3;
	if (zoomprop>20) zoomprop=(zoomprop/2);
	if (!api.settings.showGrid) zoomprop = 1;
	
	if (api.settings.showGrid) {
		ctx.beginPath();
		for (var tx=x; tx>0; tx-=d) {
			ctx.moveTo (parseInt(tx)+0.5,0);
			ctx.lineTo (parseInt(tx)+0.5,ymax);
		}
		for (var tx=x; tx<xmax; tx+=d) {
			ctx.moveTo (parseInt(tx)+0.5,0);
			ctx.lineTo (parseInt(tx)+0.5,ymax);
		}
		for (var ty=y; ty>0; ty-=d) {
			ctx.moveTo (0,parseInt(ty)+0.5);
			ctx.lineTo (xmax,parseInt(ty)+0.5);
		}
		for (var ty=y; ty<ymax; ty+=d) {
			ctx.moveTo (0,parseInt(ty)+0.5);
			ctx.lineTo (xmax,parseInt(ty)+0.5);
		}
		ctx.stroke();
	}
	
	ctx.strokeStyle = colorScheme[mode].coord;
	ctx.lineWidth = 3;
	
	if (x < 20) x = 20;
	if (x > xmax-20) x = xmax-20;
	if (y < 60) y = 60;
	if (y > ymax-60) y = ymax-60;
	
	if (api.settings.redGrid) {
		ctx.beginPath();
		ctx.moveTo (parseInt(x)+0.5,0);
		ctx.lineTo (parseInt(x)+0.5,ymax);
		ctx.moveTo (0,parseInt(y)+0.5);
		ctx.lineTo (xmax,parseInt(y)+0.5);
		ctx.stroke();
	}
	
	appDrawBond(project.elements, project.bonds);
	appDrawElements(project.elements);
	
	if (selection.processing || selection.keep) selection.draw();
	
	api.forceRedraw = false;
}

function appMain() {
	frame++;
	var s = '', s2=20;
	if (frame%s2<s2/2) {
		for (var i=0; i<frame%s2; i++) s+='\u2588';
		for (i; i<s2/2; i++) s+= '\u2591';
	}
	else {
		for (var i=0; i<frame%s2-s2/2; i++) s+='\u2591';
		for (i; i<s2/2; i++) s+= '\u2588';
	}
	document.getElementById('debug_idle').innerHTML = s;
	
	document.getElementById('is_not_saved').style.display = (api.changed?'inline':'none');
	document.getElementById('is_not_compiled').style.display = (!api.compiled?'inline':'none');
	document.getElementById('save_timeout').innerHTML = api.autosaveInterval;
	

	if (api.mouse.button == 1 || api.mouse.button == 4) {
		if (!doMoving.fact) {
			doMoving.fact = true;
			doMoving.act = false;
			doMoving.selectionMove = false;
			doMoving.elem = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
			doMoving.moveElem = (doMoving.elem != undefined && (api.brush == -2 || api.brush == -4) && api.mouse.button == 1);
			if (api.brush <= -10 && api.brush >= -20 && api.mouse.button == 1) selection.new();
			if (doMoving.moveElem) {
				AuxMove = doMoving.elem;
				doMoving.selectionMove = selection.elements[AuxMove];
				tElemX = parseFloat(project.elements[AuxMove].X);
				tElemY = parseFloat(project.elements[AuxMove].Y);
				
				if (doMoving.selectionMove) {
					for (var i=0; i<project.elements.length; i++) {
						if (project.elements == undefined || isOnBond(i) || !selection.elements[i] || i == AuxMove) continue;
						
						cache.elements[i].oldX = parseFloat(project.elements[i].X);
						cache.elements[i].oldY = parseFloat(project.elements[i].Y);
					}
				}
				
			}
			doMoving.stX = api.mouse.X;
			doMoving.stY = api.mouse.Y;
			doMoving.cStX = project.viewport.x;
			doMoving.cStY = project.viewport.y;
		}
		else if ((Math.abs(doMoving.stX - api.mouse.X) > 10) || (Math.abs(doMoving.stY - api.mouse.Y) > 10)) doMoving.act = true;
		if (doMoving.act) {
			if (doMoving.moveElem) {
				if (!isOnBond(doMoving.elem)) {
					var x = gridCoords(translateCoordsReverseX(api.mouse.X)), y = gridCoords(translateCoordsReverseY(api.mouse.Y));
					if (((project.elements[AuxMove].X != x) || (project.elements[doMoving.elem].Y != y)) && !isElementThere(x,y,AuxMove)) {
						project.elements[AuxMove].X = gridCoords(translateCoordsReverseX(api.mouse.X));
						project.elements[AuxMove].Y = gridCoords(translateCoordsReverseY(api.mouse.Y));
						api.forceRedraw = true;
					}
					if (doMoving.selectionMove) {
						for (var i=0; i<project.elements.length; i++) {
							if (project.elements == undefined || isOnBond(i) || !selection.elements[i] || i == AuxMove) continue;
							x = gridCoords(cache.elements[i].oldX + (translateCoordsReverseX(api.mouse.X) - tElemX));
							y = gridCoords(cache.elements[i].oldY + (translateCoordsReverseY(api.mouse.Y) - tElemY));
							if (isElementThere(x,y,i)) continue;
							
							project.elements[i].X = x;
							project.elements[i].Y = y;
						}
					}
				}
				else {
					var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize*2);
					if (el != undefined) {
						var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
						if (el2 != undefined) {
							project.elements[AuxMove].X  = el; 
							project.elements[AuxMove].Y = el2;
							if (project.elements[AuxMove].Y < 0.05) project.elements[AuxMove].Y = 0.05;
							if (project.elements[AuxMove].Y > 0.95) project.elements[AuxMove].Y = 0.95;
							api.forceRedraw = true;
						}
					}
				}
			}
			else if (selection.processing) {
				selection.update(); 
				api.forceRedraw = true;
			}
			else {
				project.viewport.x = doMoving.cStX - (api.mouse.X - doMoving.stX)*project.viewport.z;
				project.viewport.y = doMoving.cStY - (api.mouse.Y - doMoving.stY)*project.viewport.z;
				api.forceRedraw = true;
			}
			
		}
	}
	else {
		if (doMoving.moveElem && doMoving.act) {
			MoveElement(AuxMove,translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
			doMoving.moveElem = false;
		}
		if (selection.processing) selection.complete();
		doMoving.fact = false;
		doMoving.act = false;
	}
	
	if (api.brush == 99 && api.settings.tooltips) {
		AuxBonds2 = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize); 
		if (AuxBonds2 != dAuxBonds) {
			dAuxBonds = AuxBonds2;
			api.forceRedraw = true;
		}
	}
	if ((api.brush == 97) && !isOnBond(AuxMove)) {
		var x = gridCoords(translateCoordsReverseX(api.mouse.X)), y = gridCoords(translateCoordsReverseY(api.mouse.Y));
		if (((project.elements[AuxMove].X != x) || (project.elements[AuxMove].Y != y)) && !isElementThere(x,y,AuxMove)) {
			project.elements[AuxMove].X = gridCoords(translateCoordsReverseX(api.mouse.X));
			project.elements[AuxMove].Y = gridCoords(translateCoordsReverseY(api.mouse.Y));
			api.forceRedraw = true;
		}
	}
	if (api.brush == 97) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el != undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 != undefined) {
				project.elements[AuxMove].X  = el; 
				project.elements[AuxMove].Y = el2;
				if (project.elements[AuxMove].Y < 0.05) project.elements[AuxMove].Y = 0.05;
				if (project.elements[AuxMove].Y > 0.95) project.elements[AuxMove].Y = 0.95;
				api.forceRedraw = true;
			}
		}
	}
	if ((api.brush == -1 || api.brush == -4) && api.settings.tooltips) {
		el = api.mouse.onCanvas?FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize):undefined;
        if (el != undefined && api.mouse.onCanvas) {
			if (tElem != el) {
				tElem = el;
				tBond = undefined;
				api.forceRedraw = true;
			}
		}	
		else {
			if (tElem != el) {
				tElem = el;
				tBond = undefined;
				api.forceRedraw = true;
			}
		}
	}
	if ((api.brush == -3 || api.brush == -4) && api.settings.tooltips && tElem == undefined) {
		var el = api.mouse.onCanvas?FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize):undefined;
        if (el != undefined && api.mouse.onCanvas) {
			if (tBond != el) {
				tBond = el;
				tElem = undefined;
				api.forceRedraw = true;
			}
		}	
		else {
			if (tBond != el) {
				tBond = el;
				tElem = undefined;
				api.forceRedraw = true;
			}
		}
	}
	if (((api.brush == 4) || (api.brush == 5)) && api.settings.tooltips) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el != undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 != undefined) {
				tElemX = el; 
				tElemY = el2;
				if (tElemY < 0.05) tElemY = 0.05;
				if (tElemY > 0.95) tElemY = 0.95;
				api.forceRedraw = true;
			}
		}	
		else {
			tElemX = undefined;
			api.forceRedraw = true;
		}
	}
	else if (((api.brush > 0) && (api.brush<=6)) && api.settings.tooltips) {
		if ((tElemX != gridCoords(translateCoordsReverseX(api.mouse.X))) || (tElemY != gridCoords(translateCoordsReverseY(api.mouse.Y)))) {
			tElemX = gridCoords(translateCoordsReverseX(api.mouse.X));
			tElemY = gridCoords(translateCoordsReverseY(api.mouse.Y));
			api.forceRedraw = true;
		}
	}
	
	if (api.brush != 97) document.getElementById("brush-2").style.background="";
	else {
		if (isElementThere(x,y,AuxMove)) document.getElementById("brush-2").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
		else document.getElementById("brush-2").style.background=colorScheme[(api.settings.nightMode?1:0)].line;
	}
	if (api.settings.debug) {
		if (api.forceRedraw || api.overDraw) document.getElementById("debug_idle").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
		else document.getElementById("debug_idle").style.background="";
	}
	if (api.forceRedraw || api.overDraw) {
		appRedraw();
	}
	if (api.enBSel == undefined) api.enBSel = false;
	if (api.enElSel && (api.elSel != api.showElSel)) {
		api.showElSel = api.elSel;
		api.forceRedraw = true;
	}
	
	if (!api.enElSel && (api.showElSel != null)) {
		api.showElSel = null;
		api.forceRedraw = true;
	}
	if (api.enBSel && (api.bSel != api.showBSel)) {
		api.showBSel = api.bSel;
		api.forceRedraw = true;
	}
	if (!api.enBSel && (api.showBSel != null)) {
		api.showBSel = null;
		api.forceRedraw = true;
	}
	
	if (api.messageTimeout > 0) {
		api.messageTimeout-=api.settings.chInterval;
		if (document.getElementById("messages").childNodes.length == 0) api.messageTimeout = 0;
		if (api.messageTimeout <= 0) {
			if (document.getElementById("messages").childNodes.length > 0) document.getElementById("messages").removeChild(document.getElementById("messages").childNodes[0]);
			if (document.getElementById("messages").childNodes.length > 0) api.messageTimeout += 10000;
			else api.messageTimeout = 0;
		}
	}
	
	if (api.settings.autosave != 0) {
		if (api.autosaveInterval > 0) {
			api.autosaveInterval -= api.settings.chInterval;
			if (api.autosaveInterval <= 0) {
				if (project.id == undefined) project.id = '_temp_save';
				try {
					api.save(project.id, true);
					api.autosaveInterval += api.settings.autosave*1000*60;
				}
				catch(ex) {
					if (api.settings.debug) throw ex;
				}
			}
		}
	}
	api.handleZoom();
	setTimeout(appMain, api.settings.chInterval);
}

function appInit() {
	doMoving.fact = false;
	api.changed = false;
	cache.elements = [];
	cache.bonds = [];
	resetProject();
	resetViewport();
	ctx = document.getElementById("c").getContext('2d');
	setTimeout(appMain, api.settings.chInterval);
    api.mouse.onclick[0] = DrawRemoveSelector;
}


function update() {
	Recalculate();
	api.includeElements(document.getElementById("bpad1").getElementsByTagName("table")[0],-1);
	api.includeBonds(document.getElementById("bpad2").getElementsByTagName("table")[0],-1);
	api.changed = true;
	api.forceRedraw = true;
}

function weightsValidate(input, index) {
	if (input[index] < -1) input[index] = -1;
	if (input[index] > 1) input[index] = 1;
	if (input[index+'2'] > 1) input[index+'2'] = 1;
	if (Math.sign(input[index]) != Math.sign(input[index+'2'])) input[index+'2'] *= -1;
	if (Math.abs(input[index+'2']) < Math.abs(input[index])) {
		let t = input[index+'2'];
		input[index+'2'] = input[index];
		input[index] = t;
	}
}

function createAndAddElement(el, isNew) { //createElement already defined >:c
	var e = document.getElementById(el);
	var id = parseInt(e.querySelector('[data-val="id"]').value);
	project.elements[id] = {};
	var elem = project.elements[id];
	readFromEditWindows(e, elem);

	if (cache.elements[id] == undefined) cache.elements[id] = {aliases:[], inbonds:[]};
	if ((elem.type == 4) || (elem.type == 5)) {
		elem.alias = parseInt(e.getElementsByClassName("cc_alias")[0].value);
		var u = elem.alias;
		if (u != -1) {
			var a;
			for (a = 0; a<cache.elements[u].aliases.length; a++) if (cache.elements[u].aliases[a] == id) break;
			var x = project.elements[u];
			if (a == cache.elements[u].aliases.length) cache.elements[u].aliases.push(id);
			for (var i=0; i<cache.elements[id].aliases.length; i++) {
				cache.elements[u].aliases.push(cache.elements[id].aliases[i]);
				project.elements[cache.elements[id].aliases[i]].cost = x.cost;
				project.elements[cache.elements[id].aliases[i]].val = x.val;
				project.elements[cache.elements[id].aliases[i]].privateColor = x.privateColor;
				project.elements[cache.elements[id].aliases[i]].name = x.name+' ['+(a+i+2)+']';
			}
			elem.cost = x.cost;
			elem.val = x.val;
			elem.val2 = x.val2;
			elem.privateColor = x.privateColor;
			elem.name = x.name+' ['+(a+1)+']';
		}
	}
	if (!isNew) api.brush = elem.type;
	
	weightsValidate(elem, 'val');
	weightsValidate(elem, 'fval');
	weightsValidate(elem, 'state');
	
	if (elem.forced) {
		for (var i=0; i<cache.elements[id].inbonds.length; i++) {
			
			if (project.bonds[cache.elements[id].inbonds[i]].forced) continue;
			project.bonds[cache.elements[id].inbonds[i]].val = elem.fval;
			project.bonds[cache.elements[id].inbonds[i]].tval = elem.ftval;
		}
	}
		
	var tx = project.elements[id].alias, ax = id;
	while (tx > -1) {
		ax = tx;
		tx = project.elements[ax].alias;
	}
	var x = project.elements[ax];

	if (isNew && !(tx<0 && ax==id)) {
		for (var i=0; i<cache.elements[ax].aliases.length; i++) {
			var ux = project.elements[cache.elements[ax].aliases[i]];
			ux.cost = x.cost;
			ux.val = x.val;
			ux.privateColor = x.privateColor;
			ux.name = x.name+' ['+(i+1)+']';
			ux.desc = x.desc;
			ux.z = x.z;
			ux.alias = ax;
		}
	}
	update();
}

function createAndAddBond(el, isNew) {
	var e = document.getElementById(el);
	var id = parseInt(e.getElementsByClassName("cc_id")[0].value);
	project.bonds[id] = {};
	var elem = project.bonds[id];
	readFromEditWindows(e, elem);
	weightsValidate(elem, 'val');
	
	if (!elem.forced) {
		if (project.elements[elem.second].forced) {
			elem.val = project.elements[elem.second].fval;
			elem.val2 = project.elements[elem.second].fval2;
			elem.tval = project.elements[elem.second].ftval;
			
		}
	}
	
	if (!isNew) api.brush = 0;
	update();
}

function cancelCreation() {
	api.brush = parseInt(document.getElementById("inst").querySelector('[data-val="type"]').value);
	api.forceRedraw = true;
}

function cancelCreationBond() {
	api.brush = 0;
	api.forceRedraw = true;
}

function isElementThere(x,y, ex) {
	for (var i=0; i<project.elements.length; i++) if ((project.elements[i] != undefined) && i != ex) if ((project.elements[i].X == x) && (project.elements[i].Y == y)) return true;
	return false;
}

function isBondUnique(a,b) {
	for (var i=0; i<project.bonds.length; i++) if (project.bonds[i] != undefined) if ((project.bonds[i].first == a) && (project.bonds[i].second == b)) return false;
	return true;
}

function includeNeighbours(id, e) {
	var i, t = true, ec;
	e.innerHTML = "";
	for (i=0; i<cache.elements[id].inbonds.length;i++) {
		if (t) {
			e.innerHTML = '<div class="line">Предыдущие элементы:<br>';
			t = false;
		}
		ec = project.bonds[cache.elements[id].inbonds[i]].first;
		e.innerHTML += '<div class="b ilb" onclick="editElement('+ec+')">'+getName(ec)+'<br>';
	}
	if ((project.elements[id].type == 4) || (project.elements[id].type == 5)) {
		e.innerHTML = '<div class="line">Предыдущий элемент:<br>';
		ec = project.bonds[project.elements[id].X].first;
		e.innerHTML += '<div class="b ilb" onclick="editElement('+ec+')">'+getName(ec)+'<br>';
		t = false;
	}
	if (!t) e.innerHTML += '</div>';
	t = true;
	for (i=0; i<cache.elements[id].outbonds.length;i++) {
		if (t) {
			e.innerHTML += '<div class="line">Следующие элементы:<br>';
			t = false;
		}
		ec = project.bonds[cache.elements[id].outbonds[i]].second;
		e.innerHTML += '<div class="b ilb" onclick="editElement('+ec+')">'+getName(ec)+'<br>';
	}
	if ((project.elements[id].type == 4) || (project.elements[id].type == 5)) {
		e.innerHTML += '<div class="line">Следующий элемент:<br>';
		ec = project.bonds[project.elements[id].X].second;
		e.innerHTML += '<div class="b ilb" onclick="editElement('+ec+')">'+getName(ec)+'<br>';
		t = false;
	}
	if (!t) e.innerHTML += '</div>';
}

function includeAliases(id, e) {
	e.innerHTML = "";
	if (project.elements[id].alias > -1) {
		e.innerHTML += '<div class="b ilb" onclick="editElement('+project.elements[id].alias+')">'+getName(project.elements[id].alias)+'<br>';
	}
	for (i=0; i<cache.elements[id].aliases.length;i++) {
		var ec = cache.elements[id].aliases[i];
		e.innerHTML += '<div class="b ilb" onclick="editElement('+ec+')">'+getName(ec)+'<br>';
	}
}

function getTermInterval(val, x) {
	var t, i;
	if (typeof x == 'object') t = x;
	else t = api.getTermsPattern(x == undefined?project.settings.term:x);
	
	for (var i=0; i<t.terms.length; i++) if (parseFloat(val) <= t.terms[i].lim) return i;
}

function getValueOfTerm(val, x) {
	var t;
	if (typeof x == 'object') t = x;
	else t = api.getTermsPattern(x == undefined?project.settings.term:x);
	
	if (val == 0) return t.terms[0].lim/2;
	else return (t.terms[val].lim-t.terms[val-1].lim)/2+t.terms[val-1].lim;
}

function getUpValueOfTerm(val, x) {
	var t;
	if (typeof x == 'object') t = x;
	else t = api.getTermsPattern(x == undefined?project.settings.term:x);
	
	return t.terms[val].lim;
}

function getDownValueOfTerm(val, x) {
	var t;
	if (typeof x == 'object') t = x;
	else t = api.getTermsPattern(x == undefined?project.settings.term:x);
	
	if (val == 0) return 0;
	return t.terms[val-1].lim;
}

function getTermName(val) {
	var t;
	t = api.getTermsPattern(project.settings.term);
	
	return t.terms[val].term;
}

function fulfillTerms(cc, el) {
	for (var i=0; i<cc.getElementsByClassName('termsrender').length; i++) {
		var u = cc.getElementsByClassName('termsrender')[i];
		//if (u.classList.contains('rendered')) continue;
		
		e = u.parentNode;
		u.innerHTML = '';
		var t = api.getTermsPattern(project.settings.term);
		for (var j=0; j<t.terms.length; j++) {
			u.appendChild(InfernoAddElem('option',{selected:(j == el[u.dataset.val]), innerHTML:t.terms[j].term, value:j},[]));
		}
		
		if (project.settings.term == -3) {
			u.classList.add('hd');
			e.querySelectorAll('input[type="text"]').forEach(function (v) {v.classList.remove('hd');});
		}
		else {
			u.classList.remove('hd');
			e.querySelectorAll('input[type="text"]').forEach(function (v) {v.classList.add('hd');});
		}
		//u.classList.add('rendered');
		
	}
}

function setVisibility(cc, el) {
	var elements = ['input','textarea','select'];
	for (var i=0; i<cc.querySelectorAll('[data-display-types]').length; i++) {
		var e = cc.querySelectorAll('[data-display-types]')[i];
		var a = JSON.parse(e.dataset.displayTypes);
		e.style.display = (a.indexOf(el.type) != -1)?'block':'none';
		for (var j=0; j<elements.length; j++) {
			for (var k=0; k<e.querySelectorAll(elements[j]).length; k++) {
				e.querySelectorAll(elements[j])[k].dataset.active = (a.indexOf(el.type) != -1)?'true':'false';
			}
		}
	}
}

function prepareEditWindows(cc, el) {
	for (var i=0; i<cc.querySelectorAll('[data-val]').length; i++) {
		var e = cc.querySelectorAll('[data-val]')[i];
		
		if (el[e.dataset.val] != undefined || !e.dataset.specialInput != undefined) {
			e[e.type=="checkbox"?'checked':'value'] = el[e.dataset.val];
			var thisValue = el[e.dataset.val];
			if (e.dataset.specialInput != undefined) e[e.type=="checkbox"?'checked':(e.tagName=="SELECT"?'selectedIndex':'value')] = eval(e.dataset.specialInput);
			if (e[e.type=="checkbox"?'checked':(e.tagName=="SELECT"?'selectedIndex':'value')] == undefined || ((e.dataset.parse == 'int' || e.dataset.parse == 'float') && isNaN(e.value))) e[e.type=="checkbox"?'checked':(e.tagName=="SELECT"?'selectedIndex':'value')] = e.dataset.default;
		}
	}
	for (var i=0; i<cc.querySelectorAll('[data-gray]').length; i++) 
		cc.querySelectorAll('[data-gray]')[i].style.display = (project.settings.grayMap?'inline':'none');
}

function readFromEditWindows(cc, el) {
	for (var i=0; i<cc.querySelectorAll('[data-val]').length; i++) {
		var e = cc.querySelectorAll('[data-val]')[i];
		
		if (e.dataset.writeOnly == "true") continue;
		if (e.dataset.active == "false") continue;
		
		if (e.dataset.readCondition != undefined) {
			if (eval(e.dataset.readCondition)) continue;
		}
		
		el[e.dataset.val] = e[e.type=="checkbox"?'checked':'value'];
		if (el[e.dataset.val] == '' && e.dataset.parse != "string") {
			if (e.dataset.default != undefined) el[e.dataset.val] = e.dataset.default;
			else el[e.dataset.val] = 0;
		}
		
		if (e.type != "checkbox") {
			if (e.dataset.parse == "string") el[e.dataset.val] = deXSS(el[e.dataset.val]);
			else if (e.dataset.parse == "int") el[e.dataset.val] = parseInt(el[e.dataset.val]);
			else if (e.dataset.parse == "float") el[e.dataset.val] = parseFloat(el[e.dataset.val].replace(',','.'));
			
			if (isNaN(el[e.dataset.val])) {
				if (e.dataset.parse == "int") el[e.dataset.val] = parseInt(e.dataset.default);
				else if (e.dataset.parse == "float") el[e.dataset.val] = parseFloat(e.dataset.default.replace(',','.'));
			}
		}
		var thisValue = el[e.dataset.val];
		
		if (e.dataset.specialOutput != undefined) el[e.dataset.val] = eval(e.dataset.specialOutput);
		
	}
}

function editElement(id) {
	api.callWindow("","edit",id);
	var e = document.getElementById("edite"+id);
	var el = project.elements[id];
	e.getElementsByClassName("h")[0].innerHTML = '<i>'+getName(id)+'</i>';
	e.getElementsByClassName("hc")[0].innerHTML = '<i>'+getName(id)+'</i>';
	
	fulfillTerms(e, el);
	prepareEditWindows(e, el);
	
	var u = e.getElementsByClassName("cc_alias")[0];
	u.innerHTML = '';
	var c = document.createElement('option');
	c.selected = (-1 == el.alias);
	c.innerHTML = '[Не выбрано]';
	c.value = -1;
	u.appendChild(c);
	for (var i=0; i<cache.types[el.type-1].length; i++) {
		var un = cache.types[el.type-1][i];
		if (un == id) continue;
		if (project.elements[un].alias > -1) continue;
		c = document.createElement('option');
		c.selected = (un == el.alias);
		c.innerHTML = getName(un);
		c.value = un;
		u.appendChild(c);
	}
	
	if (!(el.alias>=0)) {
		for (var i=0; i<e.querySelectorAll('[data-val]').length; i++) {
			if (!e.querySelectorAll('[data-val]')[i].hasAttribute('data-no-edit')) {
			e.querySelectorAll('[data-val]')[i].classList.remove('na');
			e.querySelectorAll('[data-val]')[i].disabled = false;
			}
		}
	}
	else if ((el.type == 4) || (el.type == 5)) {
		for (var i=0; i<e.querySelectorAll('[data-val]').length; i++) {
			if (e.querySelectorAll('[data-val]')[i].dataset.val == 'alias') continue;
			if (e.querySelectorAll('[data-val]')[i].dataset.val == 'z') continue;
			if (e.querySelectorAll('[data-val]')[i].dataset.val == 'desc') continue;
			e.querySelectorAll('[data-val]')[i].classList.add('na');
			e.querySelectorAll('[data-val]')[i].disabled = true;
		}
	}
	
	setVisibility(e, el);
	
	e.getElementsByClassName("cc_color_check").checked = false;
	
	api.includeBonds(e.getElementsByClassName("blist")[0].getElementsByTagName("table")[0],id);
	includeNeighbours(id, e.getElementsByClassName("ellist")[0]);
	includeAliases(id, e.getElementsByClassName("coplist")[0]);
}

function editBond(id) {
	api.callWindow("","editb",id);
	var e = document.getElementById("editb"+id);
	var el = project.bonds[id];
	e.getElementsByClassName("h")[0].innerHTML = '<i>'+getName(el.first)+' — '+getName(el.second)+'</i>';
	e.getElementsByClassName("hc")[0].innerHTML = '<i>'+getName(el.first)+' — '+getName(el.second)+'</i>';
	fulfillTerms(e, el);
	
	prepareEditWindows(e, el);
	
	
	if (project.elements[el.second].forced && !el.forced) {
		e.querySelector('[data-val="val"]').classList.add('na');
		e.querySelector('[data-val="val2"]').classList.add('na');
		e.querySelector('[data-val="val"]').disabled = true;
		e.querySelector('[data-val="val2"]').disabled = true;
		e.querySelector('[data-val="val"]').value = project.elements[el.second].fval;
		e.querySelector('[data-val="val2"]').value = project.elements[el.second].fval2;
		
		e.querySelector('[data-val="tval"]').classList.add('na');
		e.querySelector('[data-val="tval"]').disabled = true;
		e.querySelector('[data-val="tval"]').selectedIndex = project.elements[el.second].ftval;
	}
	else {
		e.querySelector('[data-val="val"]').classList.remove('na');
		e.querySelector('[data-val="val2"]').classList.remove('na');
		e.querySelector('[data-val="val"]').disabled = false;
		e.querySelector('[data-val="val2"]').disabled = false;
		
		e.querySelector('[data-val="tval"]').classList.remove('na');
		e.querySelector('[data-val="tval"]').disabled = false;
	}
	
	api.includeElements(e.getElementsByClassName("elist")[0].getElementsByTagName("table")[0], id);
}

function AddElement(MouseX,MouseY,onBond) {
	var i, x=MouseX, y=MouseY;
	if (!onBond) { 
		x=gridCoords(MouseX);
		y=gridCoords(MouseY);
	}
	if (isElementThere(x,y)) return;
	for (i=0;1;i++) if (project.elements[i] == undefined) break;
	api.callWindow('inst');
	var e = document.getElementById("inst");
	
	var u = e.getElementsByClassName("cc_alias")[0];
	u.innerHTML = '';
	var c = document.createElement('option');
	c.selected = true;
	c.innerHTML = '[Не выбрано]';
	c.value = -1;
	u.appendChild(c);
	for (var j=0; j<cache.types[api.brush-1].length; j++) {
		var un = cache.types[api.brush-1][j];
		if (project.elements[un].alias > -1) continue;
		c = document.createElement('option');
		c.innerHTML = getName(un);
		c.value = un;
		u.appendChild(c);
	}
	
	prepareEditWindows(e, {id:i, X:x, Y:y, type:api.brush, privateColor:api.settings.color[api.brush-1], name:cCode(i, api.brush), code:cCode(i, api.brush), desc:'', size:1, alias:-1, cost:0});
	
	fulfillTerms(e, {tval:'1',ftval:'1'});
	
	setVisibility(e, {type:api.brush});
	
	e.getElementsByClassName("cc_color_check").checked = false;
	
	api.brush = 100;
}

function MoveElement(ActualElement,NewX,NewY,rec) {
	var x=(rec?NewX:gridCoords(NewX)), y=(rec?NewY:gridCoords(NewY));
	var i=x, i2=y;
	if (!isOnBond(ActualElement) && (isElementThere(x,y,ActualElement))) return;
	if (isOnBond(ActualElement) && !rec) {
		i = FindTheClosestBond(NewX,NewY,api.settings.elemSize);
        if (i != undefined) i2 = BondPositon(NewX,NewY,i);
	}
	if ((i != undefined) && (i2 != undefined)) {
		project.elements[ActualElement].X=i;
		project.elements[ActualElement].Y=i2;
	}
	api.forceRedraw = true;
	if (api.brush != -4) api.brush = -2;
	if (!rec) {
		api.changed = true;
		Recalculate();
	}
}

function RemoveBond(ActualBond, afterElem) {
	delete project.bonds[ActualBond];
	checkOnBondElements();
	if (!afterElem) update();
}

function AddBond(FirstElement,SecondElement) {
	if (FirstElement == SecondElement) return;
	if (!isBondUnique(FirstElement,SecondElement)) return;
	var i=0;
	for (i=0;1;i++) if (project.bonds[i] == undefined) break;
	api.callWindow('instb');
	var e = document.getElementById("instb");
	e.getElementsByClassName("cc_id")[0].value = i;
	
	fulfillTerms(e, {tval:'1'});
	prepareEditWindows(e, {id:i, first:FirstElement, second:SecondElement});
	
	if (project.elements[SecondElement].forced) {
		e.querySelector('[data-val="val"]').classList.add('na');
		e.querySelector('[data-val="val"]').disabled = true;
		e.querySelector('[data-val="val"]').value = project.elements[SecondElement].fval;
		e.querySelector('[data-val="val2"]').classList.add('na');
		e.querySelector('[data-val="val2"]').disabled = true;
		e.querySelector('[data-val="val2"]').value = project.elements[SecondElement].fval2;
		
		e.querySelector('[data-val="tval"]').classList.add('na');
		e.querySelector('[data-val="tval"]').disabled = true;
		e.querySelector('[data-val="tval"]').selectedIndex = project.elements[SecondElement].ftval;
	}
	else {
		e.querySelector('[data-val="val"]').classList.remove('na');
		e.querySelector('[data-val="val"]').disabled = false;
		e.querySelector('[data-val="val2"]').classList.remove('na');
		e.querySelector('[data-val="val2"]').disabled = false;
		
		e.querySelector('[data-val="tval"]').classList.remove('na');
		e.querySelector('[data-val="tval"]').disabled = false;
	}

	api.brush = 100;
}

function FindTheClosest(MouseX,MouseY,Type,Max) {
	var Range = Max;
	var TheClosest;
	var Aux1=1.0;
	var Aux2=1.0;
	var Aux3=1.0;
	if (Type == "Element") {
		for (var key=0; key<project.elements.length;key++) {
			if (project.elements[key] == undefined) continue;
			var x = project.elements[key].X, y = project.elements[key].Y;
			if ((project.elements[key].type == 4) || (project.elements[key].type == 5)) {
				x = translateOnBondCoordsX(project.elements[key].X, project.elements[key].Y);
				y = translateOnBondCoordsY(project.elements[key].X, project.elements[key].Y);
			}
			Aux1=(x-MouseX)*(x-MouseX);
			Aux2=(y-MouseY)*(y-MouseY);
			Aux3=Math.sqrt(Aux1+Aux2);
			if ((Aux3<Range*project.viewport.z) && (Aux3<=getSize(key)*project.viewport.z)) {
				Range=Aux3;
				TheClosest=key;
			}
		}
	}
	return TheClosest;
	
}

function FindTheClosestBond(MouseX,MouseY,Max) { 
	var Range = Max; 
	var TheClosest; 
	var AuxY1,AuxY2,AuxX1,AuxX2; 
	var AuxA,AuxB,AuxC; 
	var AuxRange; 
	var E,R,T; 

	for (var key=0; key<project.bonds.length;key++) { 
		if (project.bonds[key] == undefined) continue; 
		
		AuxX1=project.elements[project.bonds[key].first].X; 
		AuxY1=project.elements[project.bonds[key].first].Y; 
		if (cache.bonds[key].pair != undefined) {
			AuxX1 += (project.elements[project.bonds[key].second].X - project.elements[project.bonds[key].first].X) / 2;
			AuxY1 += (project.elements[project.bonds[key].second].Y - project.elements[project.bonds[key].first].Y) / 2;
		}
		
		AuxX2=project.elements[project.bonds[key].second].X; 
		AuxY2=project.elements[project.bonds[key].second].Y; 
		AuxA=AuxY1-AuxY2; 
		AuxB=AuxX2-AuxX1; 
		AuxC=(AuxX1*AuxY2-AuxX2*AuxY1); 
		E=Math.sqrt((AuxX1-MouseX)*(AuxX1-MouseX)+(AuxY1-MouseY)*(AuxY1-MouseY)); 
		R=Math.sqrt((AuxX2-MouseX)*(AuxX2-MouseX)+(AuxY2-MouseY)*(AuxY2-MouseY)); 
		T=Math.sqrt((AuxX2-AuxX1)*(AuxX2-AuxX1)+(AuxY2-AuxY1)*(AuxY2-AuxY1)); 
		AuxRange=(Math.abs(AuxA*MouseX+AuxB*MouseY+AuxC))/(Math.sqrt(AuxA*AuxA+AuxB*AuxB)); 
		if (E>T || R>T) AuxRange=Range+1; 
		if (AuxRange<Range/**project.viewport.z*/) { 
			Range=AuxRange; 
			TheClosest=key; 
		} 
	} 
	return TheClosest; 
}


function checkOnBondElements() {
	for (var i=0; i<project.elements.length; i++) 
		if (project.elements[i] != undefined)
			if ((project.elements[i].type == 4) || (project.elements[i].type == 5))
				if (project.bonds[project.elements[i].X] == undefined)
					RemoveElement(i, false);
}

function checkBonds(afterElem) {
	for (var i=0; i<project.bonds.length; i++) 
		if (project.bonds[i] != undefined)
			if ((project.elements[project.bonds[i].first] == undefined) || (project.elements[project.bonds[i].second] == undefined))
				RemoveBond(i, afterElem);
	checkOnBondElements();
}

function RemoveElement(ActualElement, inital) {
	if (cache.elements[ActualElement].aliases.length > 0) {
		var n = cache.elements[ActualElement].aliases[0];
		project.elements[n].alias = -1;
		project.elements[n].name = project.elements[ActualElement].name;
		for (var i=1; i<cache.elements[ActualElement].aliases.length; i++) {
			project.elements[cache.elements[ActualElement].aliases[i]].name = project.elements[n].name+' ['+i+']';
			project.elements[cache.elements[ActualElement].aliases[i]].alias = n;
		}
	}
	delete project.elements[ActualElement];
	if (inital) {
		checkBonds(true);
		update();
	}
}

function BondPositon(MouseX,MouseY,key) {
	var AuxY1,AuxY2,AuxX1,AuxX2,AuxRange,Range;
	AuxX1=project.elements[project.bonds[key].first].X;
    AuxX2=project.elements[project.bonds[key].second].X;
	AuxY1=project.elements[project.bonds[key].first].Y;
	AuxY2=project.elements[project.bonds[key].second].Y;
	
	if (cache.bonds[key].pair != undefined) {
		AuxX1 += (project.elements[project.bonds[key].second].X - project.elements[project.bonds[key].first].X) / 2;
		AuxY1 += (project.elements[project.bonds[key].second].Y - project.elements[project.bonds[key].first].Y) / 2;
	}
	
	AuxRange=Math.sqrt((AuxX1-MouseX)*(AuxX1-MouseX)+(AuxY1-MouseY)*(AuxY1-MouseY));
	Range=Math.sqrt((AuxX1-AuxX2)*(AuxX1-AuxX2)+(AuxY1-AuxY2)*(AuxY1-AuxY2));
	Range=AuxRange/Range; 
	return Range;
}

function applyCombination(term1, term2) {
	var t = api.getTermsPattern(project.settings.term);
	
	return t.rules[term1][term2];
}

function autocalcTermRules(term) {
	term.rules = [];
	for (var i=0; i<term.terms.length; i++) {
		term.rules[i] = [];
		for (var j=0; j<term.terms.length; j++) {
			var a = getValueOfTerm(i, term);
			var b = getValueOfTerm(j, term);
			var x = a * (1 - b);
			term.rules[i][j] = getTermInterval(x,term);
		}
	}
}

function getBondVal(el, caseid, subname) {
	if (subname == undefined) subname = '';
	if (subname == '2' && !project.settings.grayMap) return undefined;
	var c;
	if (el == undefined) return 0;
	if (typeof el == 'object') el = el.id;
	c = project.bonds[el]['val'+subname];
	var i;
	if (project.settings.term != -3) {
		//c = getValueOfTerm(getTermInterval(c));
		c = project.bonds[el].tval;
	}
	for (i=0; i<cache.bonds[el].elems.length; i++) {
		var u = cache.bonds[el].elems[i];
		if (project.elements[u].alias > -1) u = project.elements[u].alias;
		
		if (caseid >=0) if (project.cases[caseid].enabled[u] == undefined) project.cases[caseid].enabled[u] = true;
		var t = (project.elements[u].type == 4);
		if (caseid == -2 && t) continue;		//не учитываем защитные меры, если все выключено
		if (caseid == -1 && !t) continue;       //не учитываем дестабилизаторы, если все включено
		if (caseid >= 0 && (project.cases[caseid].enabled[u] ^ t)) continue;
		var uv = project.elements[u]['val'+subname];
		if (project.settings.term != -3) {
			//uv = getValueOfTerm(getTermInterval(uv));
			uv = project.elements[u].tval;
			
			if (t) c = applyCombination(c,uv);
		}
		else {
			if (t) c *= (1 - uv);
			else c = (1 - (1 - c) * (1 - uv));
		}
	}
	if (project.settings.term != -3) {
		c = getValueOfTerm(c);
	}
	return +c.toFixed(fixed_point);
}

function getElemState(el, caseid, subname) {
	if (subname == undefined) subname = '';
	if (subname == '2' && !project.settings.grayMap) return undefined;
	var c;
	if (el == undefined) return 0;
	if (typeof el == 'object') el = el.id;
	c = cache.elements[el]['cstate'+subname][caseid];
	return +c.toFixed(fixed_point);
}


function calcLog(value, caseId, subname) {
	if (cache['logs'+subname] == undefined) cache['logs'+subname] = [];
	if (cache['logs'+subname][caseId] == undefined) cache['logs'+subname][caseId] = '';
	cache['logs'+subname][caseId] += value + '\n';
}

function calcLogAll(value, subname) {
	for (let c=-2; c<project.cases.length; c++) calcLog(value, c, subname);
}

function iteration(i, cur, val, roadmap, options) {
	let subname = options.subname;
	
	let calcFunctions = [
		function(a, b) {
			if (a<b) return a;
			else return b;
		},
		function (a, b) {
			return a*b;
		}
	];
	
	var c;
	if (project.elements[cur].type == 3) {
		//roadmap.push(cur);
		calcLogAll('! Итер. '+i+': '+cur+' — '+val+' @ '+roadmap.concat(cur), subname);
		calcLogAll('---------------------------------------', subname);
		if (cache.elements[cur]['calcChance'+subname][roadmap[0]] == undefined) {
			cache.elements[cur]['calcChance'+subname][roadmap[0]] = [];
			for (var j=0; j<val.length; j++) cache.elements[cur]['calcChance'+subname][roadmap[0]][j] = val[j];
		}
		else for (var j=0; j<val.length; j++) 		//досчитали
			if (cache.elements[cur]['calcChance'+subname][roadmap[0]][j] < val[j]) {
				cache.elements[cur]['calcChance'+subname][roadmap[0]][j] = val[j];	
				
				cache.elements[cur]['calcRoadMap'+subname][roadmap[0]][j] = [];
				cache.elements[roadmap[0]]['calcRoadMap'+subname][cur][j] = [];
				
				for (var k=0; k<roadmap.length; k++) {
					cache.elements[cur]['calcRoadMap'+subname][roadmap[0]][j][k] = roadmap[k];
					cache.elements[roadmap[0]]['calcRoadMap'+subname][cur][j][k] = roadmap[k];
				}
				cache.elements[cur]['calcRoadMap'+subname][roadmap[0]][j].push(cur);
				cache.elements[roadmap[0]]['calcRoadMap'+subname][cur][j].push(cur);
			}
		// return; пытаемся продолжать вычисления
	}
	else for (var u=0; u<roadmap.length; u++) if (roadmap[u] == cur) {
		calcLogAll('# Цикл. '+i+': '+cur+' @ '+roadmap, subname);
		calcLogAll('---------------------------------------', subname);
		return;	//не зацикливаемся
	}
		
	for (c=0; c<cache.elements[cur].outbonds.length; c++) {
		calcLogAll('. Итер. '+i+': '+cur+' — '+val, subname);
		
		var axval = [];
		for (let ix = 0; ix<val.length; ix++) axval.push(val[ix]);
		
		var j=0;
		for (j = -2; j<project.cases.length; j++) {
			axval[j+2] = +calcFunctions[options.calcFunction](axval[j+2], getBondVal(cache.elements[cur].outbonds[c], j, subname)).toFixed(fixed_point);
		}
		
		iteration(i+1, 
			project.bonds[cache.elements[cur].outbonds[c]].second, 				//следующий элемент
			axval,	//меньшую силу передаем
			roadmap.concat(cur), options);
	}
}

function Recompile_States(options) {
	let temp = [];
	const subname = '';
	let subnames = ['', '2'];
	if (!project.settings.grayMap) subnames = [''];
	let j;
	cache.limitEpochs = 100;
	cache.maxEpochs = 10;
	cache.epochsPerCase = [];
	for (j = -2; j<project.cases.length; j++) 
		cache.epochsPerCase[j] = 10;
	
	let getValue = (p, s, j) => {
		let v = [];
		v.push(p[s+subnames[0]][j]);
		if (project.settings.grayMap) v.push(p[s+subnames[1]][j]);
		return v;
	};
	
	let writeValue = (p, s, j, v) => {
		p[s+subnames[0]][j] = v[0];
		if (project.settings.grayMap) p[s+subnames[1]][j] = v[1];
	}
	
	let stringify = v => {
		return v.map(vx => {return vx.toFixed(fixed_point)}).toString()
	}
	
	let actFunctions = [
		function(x) {
			if (Math.abs(x) <= 1) return x;
			return Math.sign(x);
		},
		function (x) {
			return Math.tanh(x/2);
		}
	];
	
	for (let x=0; x<cache.maxEpochs; x++) {
		calcLogAll(' ', subname);
		calcLogAll('-----===== Эпоха '+x+' =====-----', subname);
		for (let c=0; c<project.elements.length; c++) {
			temp[c] = [];
			if (isOnBond(c)) continue;
			let elemCache = cache.elements[c];
			
			for (j = -2; j<project.cases.length; j++) {
				temp[c][j] = [];
				if (x >= cache.epochsPerCase[j]) continue;
				//сохраняем состояния
				subnames.forEach(s => { elemCache['stateHistory'+s][j].push(getElemState(c, j, s)); });
				//входов нет, дропаем
				if (elemCache.inbonds.length == 0) {
					subnames.forEach(s => { temp[c][j].push(getElemState(c, j, s)) });
					continue;
				}
				
				//получаем состояние
				let val = getValue(elemCache, 'cstate', j);
				calcLog('', j, subname);
				calcLog('# '+getName(c)+' — ['+stringify(val)+']');
				for (let x=0; x<elemCache.inbonds.length; x++) {
					let pelem = project.bonds[elemCache.inbonds[x]].first;
					let bondVal = subnames.map(s => {return getBondVal(elemCache.inbonds[x], j, s)});
					let elemVal = subnames.map(s => {return getElemState(pelem, j, s)});
					
					val = grayMath.add(val, grayMath.multiply(bondVal, elemVal));
					
					calcLog('+ от '+getName(pelem).substring(0,10)+' ['+stringify(bondVal)+'] * '+stringify(elemVal)+' = '+stringify(val));
				}
				//накидываем функцию активации
				val.forEach((v, i) => { temp[c][j][i] = actFunctions[options.actFunction](v)});
			}
		}
		let upped = false;
		let delta = [];
		for (j = -2; j<project.cases.length; j++) 
			delta[j] = 0;
		for (let c=0; c<project.elements.length; c++) {
			if (isOnBond(c)) continue;
			for (j = -2; j<project.cases.length; j++) {
				if (x+1 > cache.epochsPerCase[j]) continue;
				delta[j] += Math.abs(cache.elements[c]['cstate'+subname][j]-temp[c][j][0]);
				writeValue(cache.elements[c], 'cstate', j, temp[c][j]);
				
			}
		}
		if (x+1 == cache.maxEpochs) for (j = -2; j<project.cases.length; j++) {
			if (delta[j] > (cache.types[2].length+cache.types[1].length+cache.types[0].length+cache.types[5].length)/1000) {
				if (x == cache.limitEpochs) {
					api.stateLimitReached = true;
					break;
				}
				if (!upped) {
					upped = true;
					cache.maxEpochs++;
				}
				cache.epochsPerCase[j]++;
			}
		}
	}
}

function Recompile_Preparing(subname) {
	let c;
	//инициализация
	cache['logs'+subname] = [];
	for (c=-2; c<project.cases.length; c++);
		cache['logs'+subname][c] = '';
	for (c=0; c<cache.types[2].length; c++) {
		let elemCache = cache.elements[cache.types[2][c]];
		elemCache['calcChance'+subname] = [];
		elemCache['calcRoadMap'+subname] = [];
		elemCache['finCalcChance'+subname] = [];
		for (let k=0; k<cache.types[0].length; k++)  {
			elemCache['calcChance'+subname][cache.types[0][k]] = [];
			elemCache['calcRoadMap'+subname][cache.types[0][k]] = [];
			for (let j=-2; j<project.cases.length; j++)
				elemCache['calcChance'+subname][cache.types[0][k]].push(0);
		}
		for (let j=-2; j<project.cases.length; j++)
			elemCache['finCalcChance'+subname].push(0);
		elemCache['costs'+subname] = [];
	}
	
	for (c=0; c<cache.types[0].length; c++) {
		let elemCache = cache.elements[cache.types[0][c]];
		elemCache['calcRoadMap'+subname] = [];
		for (let k=0; k<cache.types[2].length; k++)  {
			elemCache['calcRoadMap'+subname][cache.types[2][k]] = [];
		}
	}
	
	for (c=0; c<cache.elements.length; c++) {
		if (!project.elements[c]) continue;
		if (isOnBond(c)) continue;
		let elemCache = cache.elements[c];
		elemCache['stateHistory'+subname] = [];
		elemCache['cstate'+subname] = [];
		for (let j=-2; j<project.cases.length; j++) {
			elemCache['stateHistory'+subname][j] = [];
			if (project.elements[c]['state'+subname] == undefined) project.elements[c]['state'+subname] = 0;
			if (project.settings.term != -3) {
				let d = getValueOfTerm(project.elements[c].tstate);
				if (j>=0 && project.cases[j].enabled[c] === true) {
					if (project.cases[j].states[c] != undefined && project.cases[j].states[c].tstate != undefined) d = getValueOfTerm(project.cases[j].states[c].tstate);
					else d = getValueOfTerm(0);
				}
				elemCache['cstate'+subname][j] = d;
			}
			else {
				let d = project.elements[c]['state'+subname];
				if (j>=0 && project.cases[j].enabled[c] === true) {
					if (project.cases[j].states[c] != undefined && project.cases[j].states[c].tstate != undefined) d = project.cases[j].states[c]['state'+subname];
					else d = 0;
				}
				elemCache['cstate'+subname][j] = d;
			}
		}
	}
}

function Recompile_Finish(subname) {
	//выбор путей
	if (project.settings.calcFunc > -1) for (c=0; c<cache.types[2].length; c++) {
		let elemCache = cache.elements[cache.types[2][c]];
		if (elemCache['calcChance'+subname].length > 0) {
			elemCache['finCalcChance'+subname] = [];
			for (let j=-2; j<project.cases.length; j++) {
				elemCache['finCalcChance'+subname][j+2] = 0;
				for (let k=0; k<cache.types[0].length; k++) {
					let i = cache.types[0][k];
					if (elemCache['calcChance'+subname][i] != undefined) {
						if (elemCache['finCalcChance'+subname][j+2] < elemCache['calcChance'+subname][i][j+2]) 
							elemCache['finCalcChance'+subname][j+2] = elemCache['calcChance'+subname][i][j+2];
					}
				}
			}
		}
	}
	
	//собираем стоимость
	if (project.settings.calcFunc > -1) for (c=0; c<cache.types[2].length; c++) {
		for (let j=-2; j<project.cases.length; j++) {
			cache.elements[cache.types[2][c]]['costs'+subname][j+2] = cache.elements[cache.types[2][c]]['finCalcChance'+subname][j+2]*project.elements[cache.types[2][c]].cost;
		}
	}
	
	if (project.settings.actFunc > -1) for (c=0; c<cache.types[2].length; c++) {
		for (let j=-2; j<project.cases.length; j++) {
			cache.elements[cache.types[2][c]]['costs'+subname][j+2] = cache.elements[cache.types[2][c]]['cstate'+subname][j]*project.elements[cache.types[2][c]].cost;
		}
	}
}

function Recompile_Process(subname) {
	let inital = [999, 1];
	if (project.settings.calcFunc == undefined) project.settings.calcFunc = 0;
	if (project.settings.actFunc != -1) project.settings.calcFunc = -1;
	let uv = [];
	if (project.cases == undefined) project.cases = [];
	let c = project.cases.length+2;
	while (c--) uv.push(inital[project.settings.calcFunc]);
	
	Recompile_Preparing(subname);
	
	//поиск путей
	if (project.settings.calcFunc > -1) for (c=0; c<cache.types[0].length; c++)
		iteration(0, cache.types[0][c], uv, [], {subname:subname, calcFunction:project.settings.calcFunc});
		
	//пересчет состояний
	if (project.settings.actFunc > -1) {
		if (subname == '2' || !project.settings.grayMap)
			Recompile_States({actFunction:project.settings.actFunc});
	}
	
	if (project.settings.calcFunc > -1 || !project.settings.grayMap || subname == '2') {
		if (project.settings.grayMap) Recompile_Finish('');
		Recompile_Finish(subname);
	}
}

function Recompile() {
	api.callPopup2(windows.loader);
	if (api.compiled) {
		api.closePopup();
		return;
	}
	Recompile_Process('');
	if (project.settings.grayMap) Recompile_Process('2');
	api.compiled = true;
	api.closePopup();
	if (api.stateLimitReached) {
		api.callPopup2(windows.limitReached);
		api.stateLimitReached = false;
	}
}
	
function Recalculate() {
	var i,j,k;
	cache.bonds = [];
	cache.elements = [];
	cache.types = [];
	for (i=0; i<6; i++) cache.types[i] = [];
	for (i=0; i<project.bonds.length; i++) {
		cache.bonds[i] = {};
		cache.bonds[i].elems = [];
		cache.bonds[i].pair = undefined;
	}
	for (i=0; i<project.bonds.length-1; i++) {
		if (cache.bonds[i].pair == undefined && project.bonds[i] != undefined) {
			for (j=i+1; j<project.bonds.length; j++) {
				if (project.bonds[j] != undefined && (project.bonds[i].first == project.bonds[j].second) && (project.bonds[j].first == project.bonds[i].second)) {
					cache.bonds[i].pair = j;
					cache.bonds[j].pair = i;
				}
			}
		}
	}
	for (i=0; i<project.elements.length;i++) {
		cache.elements[i] = {};
		cache.elements[i].aliases=[];
	}
	for (i=0; i<project.elements.length;i++) { //входящие и исходящие связи
		if (project.elements[i] != undefined) {
			cache.elements[i].outbonds=[];
			cache.elements[i].inbonds=[];
			for (j=0; j<project.bonds.length;j++) {
				if (project.bonds[j] != undefined) {
					if (project.bonds[j].first == i) cache.elements[i].outbonds.push(j);
					if (project.bonds[j].second == i) cache.elements[i].inbonds.push(j);
				}
			}
		   
			if ((project.elements[i].type == 4) || (project.elements[i].type == 5)) {  //элементы на связях
				cache.bonds[project.elements[i].X].elems.push(i);
			}
		   
			var x = project.elements[i].alias, ax = i;
			while (x > -1) {
				ax = x;
				x = project.elements[ax].alias;
			}
			if (project.elements[i].alias > -1) cache.elements[ax].aliases.push(i);
		   
			cache.types[project.elements[i].type-1].push(i);		//типы элементов
		}
	}
	api.compiled = false;
}

function DrawRemoveSelector() {
	tElem = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
	if (api.brush < 0 && api.brush >-10) tBond = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
	if (api.brush == 0) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
		if (el != undefined) {
			AuxBonds = el;
			api.brush=99;
			api.forceRedraw = true;
		}
	}
	else if (api.brush == 99) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
		if (el != undefined) AddBond(AuxBonds,el);
	}
	else if (((api.brush == -1) || (api.brush == -4)) && tElem != undefined) {
		editElement(tElem);
	}
	else if (((api.brush == -3) || (api.brush == -4)) && tBond != undefined) {
		editBond(tBond);
	}
	else if (api.brush == -2) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
        if (el != undefined) {
			tElemX = project.elements[el].X;
			tElemY = project.elements[el].Y;
			api.brush = 97;    	
            AuxMove=el;
		}			
		
	}
	else if (api.brush == 4 || api.brush == 5) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el != undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 != undefined) {
				AddElement(el, el2, true);
			}
		}			
		
	}
	else if (api.brush == 97) MoveElement(AuxMove,translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
	else if (api.brush > 0) AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y), false);
}

function rClickListener(e) {
	if (api.brush == 99) {
		api.brush = 0;
		api.forceRedraw = true;
		e.preventDefault();
	}
	else if (api.brush == 97) {
		api.brush = -2;
		MoveElement(AuxMove,tElemX,tElemY,true);
		if (doMoving.selectionMove) {
			for (var i=0; i<project.elements.length; i++) {
				if (project.elements == undefined || isOnBond(i) || !selection.elements[i] || i == AuxMove) continue;
				
				project.elements[i].X = cache.elements[i].oldX;
				project.elements[i].Y = cache.elements[i].oldY;
			}
		}
		api.forceRedraw = true;
		e.preventDefault();
	}
}
