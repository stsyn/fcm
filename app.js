var project = {settings:{},elements:[],bonds:[],viewport:{}};
var colorScheme = [
{bg:"#fff",line:"#bbb",coord:"#f88",connections:"#111",actconn:"#8f8",fakeconn:"#f88",
selected:"#00f",aconnections:"rgba(17,17,17,0)",  aactconn:"rgba(136,255,136,0)",
text:'#000',stext:'#fff',seltext:'#060'},
{bg:"#001",line:"#033",coord:"#600",connections:"#4bb",actconn:"#060",fakeconn:"#600",
selected:"#880",aconnections:"rgba(68,187,187,0)",aactconn:"rgba(0,102,0,0)",    
text:'#eee',stext:'#111',seltext:'#8f8'}];
var ctx, tcx, zoomprop, linePattern;
var doMoving = {};
var currentBrush = {};
var cache = {};

var AuxBonds, AuxBonds2, dAuxBonds;
var AuxMove, tElemX, tElemY, tBond, tElem;


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
	if (project.elements[id] == undefined) return '[ERROR]';
	if (api.settings.actualNames) return project.elements[id].name;
	return getCode(id);
}

function resetProject() {
	var t = new Date();
	project = {meta:{},settings:{},elements:[],bonds:[],viewport:{}};
	project.settings.strict = true;
	project.settings.proportional = false;
	project.meta.timeCreated = t.getTime();
	project.meta.timeSaved = t.getTime();
	project.meta.description = '';
	project.cases = [];
	project.terms = [];
	project.settings.term = -3;
	update();
	api.changed=false;
	api.settings.lastLoaded = undefined;
}

function resetViewport() {
	project.viewport.x=0;
	project.viewport.y=0;
	project.viewport.z=0.5;
}

function translateCoordsX(i) {
	return (i-project.viewport.x)/project.viewport.z+ctx.canvas.width/2;
}

function translateCoordsY(i) {
	return (i-project.viewport.y)/project.viewport.z+ctx.canvas.height/2;
}

function translateCoordsReverseX(i) {
	return (i-ctx.canvas.width/2)*project.viewport.z+project.viewport.x;
}

function translateCoordsReverseY(i) {
	return (i-ctx.canvas.height/2)*project.viewport.z+project.viewport.y;
}

function translateCoordsReverseNZX(i) {
	return (i-ctx.canvas.width/2)+project.viewport.x;
}

function translateCoordsReverseNZY(i) {
	return (i-ctx.canvas.height/2)+project.viewport.y;
}

function translateOnBondCoordsX(b, ac) {
	return project.elements[project.bonds[b].first].X+((project.elements[project.bonds[b].second].X-project.elements[project.bonds[b].first].X)*ac);
}

function translateOnBondCoordsY(b, ac) {
	return project.elements[project.bonds[b].first].Y+((project.elements[project.bonds[b].second].Y-project.elements[project.bonds[b].first].Y)*ac);
}

function getColor(a) {
	var c = a;
	if (c<0) c=0; if (c>1) c=1;
	if (c<0.5) return 'rgb('+parseInt(511*c/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+',0)';
	else return 'rgb(255,'+parseInt((255-511*(c-0.5))/(api.settings.nightMode?1:1.5))+',0)';
}

function agetColor(a) {
	var c = a;
	if (c<0) c=0; if (c>1) c=1;
	if (c<0.5) return 'rgba('+parseInt(511*c/(api.settings.nightMode?1:1.5))+','+(api.settings.nightMode?255:170)+',0,0)';
	else return 'rgba(255,'+parseInt((255-511*(c-0.5))/(api.settings.nightMode?1:1.5))+',0,0)';
}

function deXSS(s) {
	return s.replace(RegExp('<', 'g'), '&lt;').replace(RegExp('>', 'g'), '&gt;').replace(RegExp('"', 'g'), '&#34;').replace(RegExp("'", 'g'), '&#39;');
}

function gridCoords(i) {
	return parseInt(Math.round(parseInt(i)/zoomprop)*zoomprop);
}

function appDrawBond(el,b) {
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
		var x1 = translateCoordsX(el[b[i].first].X), y1 = translateCoordsY(el[b[i].first].Y);
		var x2 = translateCoordsX(el[b[i].second].X), y2 = translateCoordsY(el[b[i].second].Y);
		
		var isSel = (tBond == i) || (api.showBSel == i) || ((api.activeWindow!==undefined)?(api.activeWindow.startsWith("editb")?((document.getElementById(api.activeWindow).getElementsByClassName("cc_id")[0].value == i)?true:false):false):false);
		if (project.settings.propColor) {
			if (api.settings.transparency) {
				var grd=ctx.createLinearGradient(x1,y1,x2,y2);
				if (isSel) {	
					grd.addColorStop(0,colorScheme[(api.settings.nightMode?1:0)].aactconn);
					grd.addColorStop(0.3,colorScheme[(api.settings.nightMode?1:0)].actconn);
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
				}
				else {
					grd.addColorStop(0,agetColor(b[i].val));
					grd.addColorStop(0.3,getColor(b[i].val));
					ctx.fillStyle=getColor(b[i].val);
				}
				ctx.strokeStyle=grd;
			}
			else {
				if (isSel) {
					ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
				}
				else {
					ctx.strokeStyle=getColor(b[i].val);
					ctx.fillStyle=getColor(b[i].val);
				}
			}
		}
		else {
			if (api.settings.transparency) {
				var grd=ctx.createLinearGradient(x1,y1,x2,y2);
				if (isSel) {
					grd.addColorStop(0,colorScheme[(api.settings.nightMode?1:0)].aactconn);
					grd.addColorStop(0.3,colorScheme[(api.settings.nightMode?1:0)].actconn);
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;	
				}
				else {
					grd.addColorStop(0,colorScheme[(api.settings.nightMode?1:0)].aconnections);
					grd.addColorStop(0.3,colorScheme[(api.settings.nightMode?1:0)].connections);
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].connections;
				}
				ctx.strokeStyle=grd;
			}
			else {
				if (isSel) {
					ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].actconn;
				}
				else {
					ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].connections;
					ctx.fillStyle=colorScheme[(api.settings.nightMode?1:0)].connections;
				}
			}
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
	if (project.viewport.z>1) return api.settings.elemSize*ac/2;
	if (project.viewport.z>3) return api.settings.elemSize*ac/3;
	if (project.viewport.z>6) return api.settings.elemSize*ac/4;
	if (project.viewport.z>16) return api.settings.elemSize*ac/7;
	return api.settings.elemSize*ac;
}

function appDrawElements(el) {
	//пора разгребать
	var size;
	for (var i=0; i<el.length; i++) {
		//элемент существует
		if (el[i] == undefined) continue;
		
		//получаем размер
		size = getSize(i);
		
		//получаем коорды
		var x = el[i].X, y = el[i].Y;
		if ((el[i].type == 4) || (el[i].type == 5)) {
			x = translateOnBondCoordsX(el[i].X, el[i].Y);
			y = translateOnBondCoordsY(el[i].X, el[i].Y);
		}
		
		//выбран ли?
		var isSelected = (tElem == i) || ((api.activeWindow!==undefined)?(api.activeWindow.startsWith("edite")?((document.getElementById(api.activeWindow).getElementsByClassName("cc_id")[0].value == i)?true:false):false):false) || (api.showElSel == i);
		
		//определяем цвет заливки
		if (el[i].privateColor != "") ctx.fillStyle = el[i].privateColor;
		else ctx.fillStyle = api.settings.color[el[i].type-1];
		
		//выбираем обводку
		if ((api.brush == 99) && (AuxBonds == i)) ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].actconn;
		if (isSelected) ctx.strokeStyle = api.settings.color[6];
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
			var x1 = el[b[el[i].X].first].X;
			var x2 = el[b[el[i].X].second].X;
			var y1 = el[b[el[i].X].first].Y;
			var y2 = el[b[el[i].X].second].Y;
			var a = 3.14-Math.atan2(x1-x2, y1-y2);
			var tcanvas = document.createElement('canvas');
			tcanvas.width = size*el[i].z*2+10;
			tcanvas.height = size*el[i].z*2+10;
			tcx = tcanvas.getContext('2d');
			tcx.fillStyle = ctx.fillStyle;
			tcx.strokeStyle = ctx.strokeStyle;
			tcx.lineWidth = 3;
			tcx.beginPath();
			tcx.arc(size+5,size+5, size, a-3.14/4, a+3.14*1.25);
			tcx.closePath();
			tcx.fill();
			if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) tcx.stroke();
			tcx.globalCompositeOperation = 'destination-out';
			tcx.beginPath();
			tcx.arc(size+5+size*0.65*Math.cos(a-3.14/2), size+5+size*0.65*Math.sin(a-3.14/2), size*0.85, 0, 6.28);
			tcx.closePath();
			tcx.fill();
			ctx.drawImage(tcanvas,translateCoordsX(x)-size-5,translateCoordsY(y)-size-5);
			
		}
		
		//рисуем просто так
		else {
			ctx.beginPath();
			ctx.arc(translateCoordsX(x),translateCoordsY(y), size, 0,6.28);
			ctx.closePath();
			ctx.fill();
			if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) ctx.stroke();
		}
		
		//подписи
		if (api.settings.elemLabels) {
			ctx.font = 300+100*(api.settings.nightMode?0:1)+" "+12*api.settings.glFontSize/100+"pt "+(api.settings.cursor?"'Open Sans'":"'Verdana'");
			if (isSelected) ctx.fillStyle = colorScheme[(api.settings.nightMode?1:0)].seltext;
			else ctx.fillStyle = colorScheme[(api.settings.nightMode?1:0)].text;
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
		
	}
	
	size = getSize(-1);
	if (((api.brush>0 && api.brush<=6)) && api.settings.tooltips) {
		ctx.strokeStyle = api.settings.color[api.brush-1];
		ctx.setLineDash([3, 5]);
		ctx.beginPath();
		if ((api.brush == 4) || (api.brush == 5)) {
			if (tElemX != -1) ctx.arc(translateCoordsX(translateOnBondCoordsX(tElemX,tElemY)),translateCoordsY(translateOnBondCoordsY(tElemX,tElemY)), size, 0,6.28);
		}
		else ctx.arc(translateCoordsX(tElemX),translateCoordsY(tElemY), size, 0,6.28);
		
		ctx.closePath();
		ctx.stroke();
		ctx.setLineDash([1, 0]);
	}
}


function appRedraw() {
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
	
	api.forceRedraw = false;
}

function appMain() {
	if (api.mouse.button == 1 || api.mouse.button == 4) {
		if (!doMoving.fact) {
			doMoving.fact = true;
			doMoving.act = false;
			doMoving.stX = api.mouse.X;
			doMoving.stY = api.mouse.Y;
			doMoving.cStX = project.viewport.x;
			doMoving.cStY = project.viewport.y;
		}
		else if ((Math.abs(doMoving.stX - api.mouse.X) > 10) || (Math.abs(doMoving.stY - api.mouse.Y) > 10)) doMoving.act = true;
		if (doMoving.act) {
			project.viewport.x = doMoving.cStX - (api.mouse.X - doMoving.stX)*project.viewport.z;
			project.viewport.y = doMoving.cStY - (api.mouse.Y - doMoving.stY)*project.viewport.z;
			api.forceRedraw = true;
		}
	}
	else doMoving.fact = false;
	
	if (api.brush == 99 && api.settings.tooltips) {
		AuxBonds2 = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize); 
		if (AuxBonds2 != dAuxBonds) {
			dAuxBonds = AuxBonds2;
			api.forceRedraw = true;
		}
	}
	else if ((api.brush == 97) && (project.elements[AuxMove].type > 0) && ((project.elements[AuxMove].type<=3) || (project.elements[AuxMove].type==6))) {
		var x = gridCoords(translateCoordsReverseX(api.mouse.X)), y = gridCoords(translateCoordsReverseY(api.mouse.Y));
		if (((project.elements[AuxMove].X != x) || (project.elements[AuxMove].Y != y)) && !isElementThere(x,y,AuxMove)) {
			project.elements[AuxMove].X = gridCoords(translateCoordsReverseX(api.mouse.X));
			project.elements[AuxMove].Y = gridCoords(translateCoordsReverseY(api.mouse.Y));
			api.forceRedraw = true;
		}
	}
	else if (api.brush == 97) {
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
	else if (((api.brush == 4) || (api.brush == 5)) && api.settings.tooltips) {
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
			tElemX = -1;
			api.forceRedraw = true;
		}
	}
	else if ((api.brush == -3) && api.settings.tooltips) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el != undefined) {
			if (tBond != el) {
				tBond = el;
				api.forceRedraw = true;
			}
		}	
		else {
			if (tBond != el) {
				tBond = el;
				api.forceRedraw = true;
			}
		}
	}
	else if ((api.brush == -1) && api.settings.tooltips) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
        if (el != undefined) {
			if (tElem != el) {
				tElem = el;
				api.forceRedraw = true;
			}
		}	
		else {
			if (tElem != el) {
				tElem = el;
				api.forceRedraw = true;
			}
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
		if (api.forceRedraw || api.overDraw) document.getElementById("debug_mouseInfo").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
		else document.getElementById("debug_mouseInfo").style.background="";
	}
	if (api.forceRedraw || api.overDraw) {
		appRedraw();
	}
	if (api.enElSel && (api.elSel != api.showElSel)) {
		api.showElSel = api.elSel;
		api.forceRedraw = true;
	}
	if (!api.enElSel && (api.showElSel !== null)) {
		api.showElSel = null;
		api.forceRedraw = true;
	}
	if (api.enBSel && (api.bSel != api.showBSel)) {
		api.showBSel = api.bSel;
		api.forceRedraw = true;
	}
	if (!api.enBSel && (api.showBSel !== null)) {
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

function createAndAddElement(el, isNew) { //createElement already defined >:c
	var e = document.getElementById(el);
	var id = parseInt(e.getElementsByClassName("cc_id")[0].value);
	project.elements[id] = {};
	var elem = project.elements[id];
	elem.X = parseFloat(e.getElementsByClassName("cc_X")[0].value);
	elem.Y = parseFloat(e.getElementsByClassName("cc_Y")[0].value);
	var type = parseInt(e.getElementsByClassName("cc_type")[0].value);
	elem.type = type;
	elem.desc = deXSS(e.getElementsByClassName("cc_desc")[0].value);
	elem.name = deXSS(e.getElementsByClassName("cc_name")[0].value);
	if (api.settings.palette) {
		if (e.getElementsByClassName("cc_color_check")[0].checked) 
			elem.privateColor = deXSS(e.getElementsByClassName("cc_color")[0].value);
		else elem.privateColor = 0;
	}
	else elem.privateColor = deXSS(e.getElementsByClassName("cc_color2")[0].value);
	if (e.getElementsByClassName("cc_size")[0].value !== "") elem.z = parseInt(e.getElementsByClassName("cc_size")[0].value)/100; 
	else elem.z = 1;
	if (elem.z > 3) elem.z = 3;
	if (elem.z < 0.6) elem.z = 0.6;
	
	if ((type == 1) || (type == 2)) {
		if (e.getElementsByClassName("cc_state")[0].value !== "") elem.state = parseFloat(e.getElementsByClassName("cc_state")[0].value); else elem.state = 0;
		if (e.getElementsByClassName("cc_limit")[0].value !== "") elem.lim = parseFloat(e.getElementsByClassName("cc_limit")[0].value); else elem.lim = 0;
	}
	else if (type == 3) {
		if (e.getElementsByClassName("cc_cost")[0].value !== "") elem.cost = parseFloat(e.getElementsByClassName("cc_cost")[0].value); else elem.cost = 0;
		if (e.getElementsByClassName("cc_value")[0].value !== "") elem.val = parseFloat(e.getElementsByClassName("cc_value")[0].value); else elem.val = 0;
	}
	else if ((type == 4) || (type == 5)) {
		if (e.getElementsByClassName("cc_cost2")[0].value !== "") elem.cost = parseFloat(e.getElementsByClassName("cc_cost2")[0].value); else elem.cost = 0;
		if (e.getElementsByClassName("cc_effect")[0].value !== "") elem.val = parseFloat(e.getElementsByClassName("cc_effect")[0].value); else elem.val = 0;	
		
		
		if (project.settings.term != -3) elem.val = getValueOfTerm(e.getElementsByClassName("cc_vsel")[0].selectedIndex);
		
		if (project.settings.strict) {
			if (elem.val < 0) elem.val = 0;
			if (elem.val > 1) elem.val = 1;
		}
		
		elem.alias = parseInt(e.getElementsByClassName("cc_alias")[0].value);
		var u = elem.alias;
		if (u != -1) {
			var a;
			for (a = 0; a<cache.elements[u].aliases.length; a++) if (cache.elements[u].aliases[a] == id) break;
			var x = project.elements[u];
			if (a == cache.elements[u].aliases.length) cache.elements[u].aliases.push(id);
			for (var i=0; i<cache.elements[id].aliases.length; i++) cache.elements[u].aliases.push(cache.elements[id].aliases[i]);
			elem.cost = x.cost;
			elem.val = x.val;
			elem.privateColor = x.privateColor;
			elem.name = x.name+' ['+(a+1)+']';
			elem.desc = x.desc;
			elem.z = x.z;
		}
		
	}
	if (!isNew) api.brush = type;
	
	
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
	project.bonds[id].first = parseInt(e.getElementsByClassName("cc_first")[0].value);
	project.bonds[id].second = parseInt(e.getElementsByClassName("cc_second")[0].value);
	project.bonds[id].val = parseFloat(e.getElementsByClassName("cc_v")[0].value);
	if (project.bonds[id].val < 0) project.bonds[id].val = 0;
	if (project.bonds[id].val > 1) project.bonds[id].val = 1;
	
	
	if (project.settings.term != -3) project.elements[id].val = getValueOfTerm(e.getElementsByClassName("cc_vsel")[0].selectedIndex);
		
	if (!isNew) api.brush = 0;
	update();
}

function cancelCreation() {
	api.brush = parseInt(document.getElementById("inst").getElementsByClassName("cc_type")[0].value);
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

function getTermInterval(val) {
	var t, i;
	t = api.getTermsPattern(project.settings.term);
	
	for (var i=0; i<t.terms.length; i++) if (val <= t.terms[i].lim) return i;
}

function getValueOfTerm(val) {
	var t = api.getTermsPattern(project.settings.term);
	if (val == 0) return t.terms[0].lim/2;
	else return (t.terms[val].lim-t.terms[val-1].lim)/2+t.terms[val-1].lim;
}

function getTermName(val) {
	var t;
	t = api.getTermsPattern(project.settings.term);
	
	return t.terms[getTermInterval(val)].term;
}

function editElement(id) {
	api.callWindow("","edit",id);
	var e = document.getElementById("edite"+id);
	var el = project.elements[id];
	e.getElementsByClassName("h")[0].innerHTML = '<i>'+getName(id)+'</i>';
	e.getElementsByClassName("hc")[0].innerHTML = '<i>'+getName(id)+'</i>';
	e.getElementsByClassName("cc_id")[0].value = id;
	e.getElementsByClassName("cc_X")[0].value = el.X;
	e.getElementsByClassName("cc_Y")[0].value = el.Y;
	e.getElementsByClassName("cc_type")[0].value = el.type;
	e.getElementsByClassName("cc_color")[0].value = (project.elements[id].privateColor?project.elements[id].privateColor:api.settings.color[el.type-1]);
	e.getElementsByClassName("cc_color2")[0].value = project.elements[id].privateColor;
	e.getElementsByClassName("cc_color_check")[0].checked = project.elements[id].privateColor;
	e.getElementsByClassName("cc_size")[0].value = project.elements[id].z*100;
	
	e.getElementsByClassName("cc_desc")[0].value = el.desc;
	e.getElementsByClassName("cc_name")[0].value = el.name;
	e.getElementsByClassName("cc_cost")[0].value = el.cost;
	e.getElementsByClassName("cc_cost2")[0].value = el.cost;
	e.getElementsByClassName("cc_state")[0].value = el.state;
	e.getElementsByClassName("cc_limit")[0].value = el.lim;
	e.getElementsByClassName("cc_value")[0].value = el.val;
	e.getElementsByClassName("cc_effect")[0].value = el.val;
	e.getElementsByClassName("cc_code")[0].value = getCode(id);
	
	if (project.settings.term == -3) {
		e.getElementsByClassName("cc_vsel")[0].classList.add('hd');
		e.getElementsByClassName("cc_effect")[0].classList.remove('hd');
	}
	else {
		e.getElementsByClassName("cc_effect")[0].classList.add('hd');
		var u = e.getElementsByClassName("cc_vsel")[0];
		u.classList.remove('hd');
		u.innerHTML = '';
		
		var t = api.getTermsPattern(project.settings.term);
		for (var i=0; i<t.terms.length; i++) {
			var c = document.createElement('option');
			c.selected = (i == getTermInterval(el.val));
			c.innerHTML = t.terms[i].term;
			c.value = i;
			u.appendChild(c);
		}
	}
	
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
		e.getElementsByClassName("cc_color")[0].classList.remove('na');
		e.getElementsByClassName("cc_color")[0].disabled = false;
		e.getElementsByClassName("cc_color2")[0].classList.remove('na');
		e.getElementsByClassName("cc_color2")[0].disabled = false;
		e.getElementsByClassName("cc_color_check")[0].classList.remove('na');
		e.getElementsByClassName("cc_color_check")[0].disabled = false;
		e.getElementsByClassName("cc_desc")[0].classList.remove('na');
		e.getElementsByClassName("cc_desc")[0].disabled = false;
		e.getElementsByClassName("cc_name")[0].classList.remove('na');
		e.getElementsByClassName("cc_name")[0].disabled = false;
		e.getElementsByClassName("cc_effect")[0].classList.remove('na');
		e.getElementsByClassName("cc_effect")[0].disabled = false;
		e.getElementsByClassName("cc_cost2")[0].classList.remove('na');
		e.getElementsByClassName("cc_cost2")[0].disabled = false;
		e.getElementsByClassName("cc_vsel")[0].classList.remove('na');
		e.getElementsByClassName("cc_vsel")[0].disabled = false;
		e.getElementsByClassName("cc_size")[0].classList.remove('na');
		e.getElementsByClassName("cc_size")[0].disabled = false;
	}
	else if ((el.type == 4) || (el.type == 5)) {
		e.getElementsByClassName("cc_color")[0].classList.add('na');
		e.getElementsByClassName("cc_color")[0].disabled = true;
		e.getElementsByClassName("cc_color2")[0].classList.add('na');
		e.getElementsByClassName("cc_color2")[0].disabled = true;
		e.getElementsByClassName("cc_color_check")[0].classList.add('na');
		e.getElementsByClassName("cc_color_check")[0].disabled = true;
		e.getElementsByClassName("cc_desc")[0].classList.add('na');
		e.getElementsByClassName("cc_desc")[0].disabled = true;
		e.getElementsByClassName("cc_name")[0].classList.add('na');
		e.getElementsByClassName("cc_name")[0].disabled = true;
		e.getElementsByClassName("cc_effect")[0].classList.add('na');
		e.getElementsByClassName("cc_effect")[0].disabled = true;
		e.getElementsByClassName("cc_cost2")[0].classList.add('na');
		e.getElementsByClassName("cc_cost2")[0].disabled = true;
		e.getElementsByClassName("cc_vsel")[0].classList.add('na');
		e.getElementsByClassName("cc_vsel")[0].disabled = true;
		e.getElementsByClassName("cc_size")[0].classList.add('na');
		e.getElementsByClassName("cc_size")[0].disabled = true;
	}
	
	e.getElementsByClassName("_cc_initator")[0].style.display = (((el.type == 1) || (el.type == 2))?"block":"none");
	e.getElementsByClassName("_cc_target")[0].style.display = ((el.type == 3)?"block":"none");
	e.getElementsByClassName("_cc_control")[0].style.display = (((el.type == 4) || (el.type == 5))?"block":"none");
	
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
	e.getElementsByClassName("cc_id")[0].value = id;
	e.getElementsByClassName("cc_first")[0].value = el.first;
	e.getElementsByClassName("cc_second")[0].value = el.second;
	e.getElementsByClassName("cc_v")[0].value = el.val;
	
	if (project.settings.term == -3) {
		e.getElementsByClassName("cc_vsel")[0].classList.add('hd');
		e.getElementsByClassName("cc_v")[0].classList.remove('hd');
	}
	else {
		e.getElementsByClassName("cc_v")[0].classList.add('hd');
		var u = e.getElementsByClassName("cc_vsel")[0];
		u.classList.remove('hd');
		u.innerHTML = '';
		
		var t = api.getTermsPattern(project.settings.term);
		for (var i=0; i<t.terms.length; i++) {
			var c = document.createElement('option');
			c.selected = (i == getTermInterval(el.val));
			c.innerHTML = t.terms[i].term;
			c.value = i;
			u.appendChild(c);
		}
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
	e.getElementsByClassName("cc_id")[0].value = i;
	e.getElementsByClassName("cc_X")[0].value = x;
	e.getElementsByClassName("cc_Y")[0].value = y;
	e.getElementsByClassName("cc_type")[0].value = api.brush;
	e.getElementsByClassName("cc_color_check")[0].checked = false;
	e.getElementsByClassName("cc_color")[0].value = api.settings.color[api.brush-1];
	e.getElementsByClassName("cc_color2")[0].value = "";
	e.getElementsByClassName("cc_size")[0].value = "100";
	
	e.getElementsByClassName("cc_desc")[0].value = "";
	e.getElementsByClassName("cc_name")[0].value = cCode(i, api.brush);
	e.getElementsByClassName("cc_cost")[0].value = "0";
	e.getElementsByClassName("cc_cost2")[0].value = "0";
	e.getElementsByClassName("cc_state")[0].value = "0";
	e.getElementsByClassName("cc_limit")[0].value = "0";
	e.getElementsByClassName("cc_value")[0].value = "0";
	e.getElementsByClassName("cc_effect")[0].value = "0.5";
	e.getElementsByClassName("cc_code")[0].value = cCode(i, api.brush);
	
	if (project.settings.term == -3) {
		e.getElementsByClassName("cc_vsel")[0].classList.add('hd');
		e.getElementsByClassName("cc_effect")[0].classList.remove('hd');
	}
	else {
		e.getElementsByClassName("cc_effect")[0].classList.add('hd');
		var u = e.getElementsByClassName("cc_vsel")[0];
		u.classList.remove('hd');
		u.innerHTML = '';
		
		var t = api.getTermsPattern(project.settings.term);
		for (var i=0; i<t.terms.length; i++) {
			var c = document.createElement('option');
			c.innerHTML = t.terms[i].term;
			c.value = i;
			u.appendChild(c);
		}
	}
	
	var u = e.getElementsByClassName("cc_alias")[0];
	u.innerHTML = '';
	var c = document.createElement('option');
	c.selected = true;
	c.innerHTML = '[Не выбрано]';
	c.value = -1;
	u.appendChild(c);
	for (var i=0; i<cache.types[api.brush-1].length; i++) {
		var un = cache.types[api.brush-1][i];
		if (project.elements[un].alias > -1) continue;
		c = document.createElement('option');
		c.innerHTML = getName(un);
		c.value = un;
		u.appendChild(c);
	}
	
	e.getElementsByClassName("_cc_initator")[0].style.display = (((api.brush == 1) || (api.brush == 2))?"block":"none");
	e.getElementsByClassName("_cc_target")[0].style.display = ((api.brush == 3)?"block":"none");
	e.getElementsByClassName("_cc_control")[0].style.display = (((api.brush == 4) || (api.brush == 5))?"block":"none");
	api.brush = 100;
}

function MoveElement(ActualElement,NewX,NewY,rec) {
	var x=(rec?NewX:gridCoords(NewX)), y=(rec?NewY:gridCoords(NewY));
	var i=x, i2=y;
	if ((project.elements[ActualElement].type > 0) && (project.elements[ActualElement].type<=3) && (isElementThere(x,y,ActualElement))) return;
	if ((project.elements[ActualElement].type == 4) || (project.elements[ActualElement].type == 5) && !rec) {
		i = FindTheClosestBond(NewX,NewY,api.settings.elemSize);
        if (i != undefined) i2 = BondPositon(NewX,NewY,i);
	}
	if ((i != undefined) && (i2 != undefined)) {
		project.elements[ActualElement].X=i;
		project.elements[ActualElement].Y=i2;
	}
	api.forceRedraw = true;
	api.changed = true;
	api.brush = -2;
	Recalculate();
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
	e.getElementsByClassName("cc_first")[0].value = FirstElement;
	e.getElementsByClassName("cc_second")[0].value = SecondElement;
	e.getElementsByClassName("cc_v")[0].value = "0.5";
	
	if (project.settings.term == -3) {
		e.getElementsByClassName("cc_vsel")[0].classList.add('hd');
		e.getElementsByClassName("cc_v")[0].classList.remove('hd');
	}
	else {
		e.getElementsByClassName("cc_v")[0].classList.add('hd');
		var u = e.getElementsByClassName("cc_vsel")[0];
		u.classList.remove('hd');
		u.innerHTML = '';
		
		var t = api.getTermsPattern(project.settings.term);
		for (var i=0; i<t.terms.length; i++) {
			var c = document.createElement('option');
			c.innerHTML = t.terms[i].term;
			c.value = i;
			u.appendChild(c);
		}
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
		AuxX2=project.elements[project.bonds[key].second].X; 
		AuxY1=project.elements[project.bonds[key].first].Y; 
		AuxY2=project.elements[project.bonds[key].second].Y; 
		AuxA=AuxY1-AuxY2; 
		AuxB=AuxX2-AuxX1; 
		AuxC=(AuxX1*AuxY2-AuxX2*AuxY1); 
		E=Math.sqrt((AuxX1-MouseX)*(AuxX1-MouseX)+(AuxY1-MouseY)*(AuxY1-MouseY)); 
		R=Math.sqrt((AuxX2-MouseX)*(AuxX2-MouseX)+(AuxY2-MouseY)*(AuxY2-MouseY)); 
		T=Math.sqrt((AuxX2-AuxX1)*(AuxX2-AuxX1)+(AuxY2-AuxY1)*(AuxY2-AuxY1)); 
		AuxRange=(Math.abs(AuxA*MouseX+AuxB*MouseY+AuxC))/(Math.sqrt(AuxA*AuxA+AuxB*AuxB)); 
		if (E>T || R>T) AuxRange=Range+1; 
		if (AuxRange<Range*project.viewport.z) { 
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
	AuxRange=Math.sqrt((AuxX1-MouseX)*(AuxX1-MouseX)+(AuxY1-MouseY)*(AuxY1-MouseY));
	Range=Math.sqrt((AuxX1-AuxX2)*(AuxX1-AuxX2)+(AuxY1-AuxY2)*(AuxY1-AuxY2));
	Range=AuxRange/Range; 
	return Range;
}

function getBondVal(el, caseid) {
	var i, c = project.bonds[el].val;
	if (project.settings.term != -3) c = getValueOfTerm(getTermInterval(c));
	for (i=0; i<cache.bonds[el].elems.length; i++) {
		var u = cache.bonds[el].elems[i];
		if (project.elements[u].alias > -1) u = project.elements[u].alias;
		
		if (caseid >=0) if (project.cases[caseid].enabled[u] == undefined) project.cases[caseid].enabled[u] = true;
		var t = (project.elements[u].type == 4);
		if (caseid == -2 && t) continue;		//не учитываем защитные меры, если все выключено
		if (caseid == -1 && !t) continue;       //не учитываем дестабилизаторы, если все включено
		if (caseid >= 0 && (project.cases[caseid].enabled[u] ^ t)) continue;
		var uv = project.elements[u].val;
		if (project.settings.term != -3) uv = getValueOfTerm(getTermInterval(uv));
		if (t) c *= (1 - uv);
		else c = (1 - (1 - c) * (1 - uv));
	}
	return +c.toFixed(4);
}

function iteration(i, cur, val, roadmap) {
	var c;
	if (project.elements[cur].type == 3) {
		if (api.settings.debug) console.log('Закончили вычисления на итерации '+i+'. Последний элемент №'+cur+', получилось '+val+'. Путь: '+roadmap.concat(cur)+'.');
		if (cache.elements[cur].calcChance[roadmap[0]] == undefined) {
			cache.elements[cur].calcChance[roadmap[0]] = [];
			for (var j=0; j<val.length; j++) cache.elements[cur].calcChance[roadmap[0]][j] = val[j];
		}
		else for (var j=0; j<val.length; j++) 		//досчитали
			if (cache.elements[cur].calcChance[roadmap[0]][j]<val[j]) cache.elements[cur].calcChance[roadmap[0]][j] = val[j];	
		return;
	}
	for (var u=0; u<roadmap.length; u++) if (roadmap[u] == cur) {
		if (api.settings.debug) console.log('Вошли в цикл на итерации '+i+'. Текущий элемент №'+cur+', путь '+roadmap+'.');
		return;	//не зацикливаемся
	}
		
	for (c=0; c<cache.elements[cur].outbonds.length; c++) {
		if (api.settings.debug) console.log('Находимся на итерации '+i+'. Текущий элемент №'+cur+', пока что '+val+'.');
		
		var axval = [];
		for (i = 0; i<val.length; i++) axval.push(val[i]);
		
		var j=0;
		for (j = -2; j<project.cases.length; j++) {
			axval[j+2] = (axval[j+2]<getBondVal(cache.elements[cur].outbonds[c], j)?axval[j+2]:getBondVal(cache.elements[cur].outbonds[c], j));
		}
		
		iteration(i+1, 
			project.bonds[cache.elements[cur].outbonds[c]].second, 				//следующий элемент
			axval,	//меньшую силу передаем
			roadmap.concat(cur));
	}
}

function iteration2(i, cur, val, roadmap) {
	//версия с умножением
	var c;
	if (project.elements[cur].type == 3) {
		if (api.settings.debug) console.log('Закончили вычисления на итерации '+i+'. Последний элемент №'+cur+', получилось '+val+'. Путь: '+roadmap.concat(cur)+'.');
		if (cache.elements[cur].calcChance[roadmap[0]] == undefined) {
			cache.elements[cur].calcChance[roadmap[0]] = [];
			for (var j=0; j<val.length; j++) cache.elements[cur].calcChance[roadmap[0]][j] = val[j];
		}
		else for (var j=0; j<val.length; j++) 		//досчитали
			if (cache.elements[cur].calcChance[roadmap[0]][j]<val[j]) cache.elements[cur].calcChance[roadmap[0]][j] = val[j];	
		return;
	}
	
	for (var u=0; u<roadmap.length; u++) if (roadmap[u] == cur) {
		if (api.settings.debug) console.log('Вошли в цикл на итерации '+i+'. Текущий элемент №'+cur+', путь '+roadmap+'.');
		return;	//не зацикливаемся
	}
	
	for (c=0; c<cache.elements[cur].outbonds.length; c++) {
		if (api.settings.debug) console.log('Находимся на итерации '+i+'. Текущий элемент №'+cur+', пока что '+val+'.');
		
		var axval = [];
		for (i = 0; i<val.length; i++) axval.push(val[i]);
		
		var j=0;
		for (j = -2; j<project.cases.length; j++) {
			axval[j+2] *= getBondVal(cache.elements[cur].outbonds[c], j);
		}
		
		iteration2(i+1, 
			project.bonds[cache.elements[cur].outbonds[c]].second, 				//следующий элемент
			axval,	
			roadmap.concat(cur));
	}
}
	
function Recompile() {
	var calcFuncs = [iteration, iteration2];
	var inital = [999, 1];
	if (project.settings.calcFunc == undefined) project.settings.calcFunc = 0;
	if (api.compiled) {
		api.closePopup();
		return;
	}
	var uv = [];
	if (project.cases == undefined) project.cases = [];
	var c = project.cases.length+2;
	while (c--) uv.push(inital[project.settings.calcFunc]);
	for (c=0; c<cache.types[2].length; c++) {
		cache.elements[cache.types[2][c]].calcChance = [];
		project.elements[cache.types[2][c]].calcChance = [];
		for (var k=0; k<cache.types[0].length; k++)  {
			cache.elements[cache.types[2][c]].calcChance[cache.types[0][k]] = [];
			for (var j=-2; j<project.cases.length; j++)
				cache.elements[cache.types[2][c]].calcChance[cache.types[0][k]].push(0);
		}
		for (var j=-2; j<project.cases.length; j++)
			project.elements[cache.types[2][c]].calcChance.push(0);
		cache.elements[cache.types[2][c]].costs = [];
	}
	
	for (c=0; c<cache.types[0].length; c++)
		calcFuncs[project.settings.calcFunc](0, cache.types[0][c], uv, []);
		
	for (c=0; c<cache.types[2].length; c++) {
		var e = cache.types[2][c];
		if (cache.elements[e].calcChance.length > 0) {
			project.elements[e].calcChance = [];
			for (var j=-2; j<project.cases.length; j++) {
				project.elements[e].calcChance[j+2] = 0;
				for (var k=0; k<cache.types[0].length; k++) 
					var i = cache.types[0][k];
					if (cache.elements[e].calcChance[i] != undefined)
						if (project.elements[e].calcChance[j+2]<cache.elements[e].calcChance[i][j+2]) project.elements[e].calcChance[j+2] = cache.elements[e].calcChance[i][j+2];
			}
		}
	}
	for (c=0; c<cache.types[2].length; c++) {
		for (var j=-2; j<project.cases.length; j++) {
			cache.elements[cache.types[2][c]].costs[j+2] = project.elements[cache.types[2][c]].calcChance[j+2]*project.elements[cache.types[2][c]].cost;
		}
	}
	api.compiled = true;
	api.closePopup();
}
	
function Recalculate() {
	var i,j,k;
	cache.bonds = [];
	cache.types = [];
	for (i=0; i<6; i++) cache.types[i] = [];
	for (i=0; i<project.bonds.length;i++) {
		cache.bonds[i] = {};
		cache.bonds[i].elems = [];
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
	else if (api.brush == -3) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
		if (el != undefined) editBond(el);
	}
	else if (api.brush == -1) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize*3);
		if (el != undefined) editElement(el);
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
	else AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y), false);
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
		api.forceRedraw = true;
		e.preventDefault();
	}
}