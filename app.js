var project = {settings:{},elements:[],bonds:[],viewport:{}};
var colorScheme = [
{bg:"#fff",line:"#bbb",coord:"#f88",connections:"#111",actconn:"#8f8",fakeconn:"#f88",selected:"#00f",aconnections:"rgba(17,17,17,0)"},
{bg:"#001",line:"#033",coord:"#600",connections:"#4bb",actconn:"#060",fakeconn:"#600",selected:"#cc0",aconnections:"rgba(68,187,187,0)"}];
var ctx, zoomprop, linePattern;
var doMoving = {};
var currentBrush = {};
var cache = {};

var AuxBonds, AuxBonds2, dAuxBonds;
var AuxMove, tElemX, tElemY;
var NumberOfBonds = 0;
var BondsDrawingArrayFirst = {};
var BondsDrawingArraySecond = {};


function resetProject() {
	project = {settings:{},elements:[],bonds:[],viewport:[]};
	project.settings.strict = true;
	api.changed = false;
	api.forceRedraw = true;
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

function gridCoords(i) {
	return parseInt(Math.round(parseInt(i)/zoomprop)*zoomprop);
}

function appDrawBond(el,b) {
	if ((AuxBonds2 !== undefined) && api.settings.tooltips && api.brush == 99) {
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
	ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].connections;
	for (var i=0; i<b.length; i++) {
		if (b[i] === undefined) continue;
		var x1 = translateCoordsX(el[b[i].first].X), y1 = translateCoordsY(el[b[i].first].Y);
		var x2 = translateCoordsX(el[b[i].second].X), y2 = translateCoordsY(el[b[i].second].Y);
		var grd=ctx.createLinearGradient(x1,y1,x2,y2);
		grd.addColorStop(0,colorScheme[(api.settings.nightMode?1:0)].aconnections);
		grd.addColorStop(0.5,colorScheme[(api.settings.nightMode?1:0)].connections);
		ctx.strokeStyle=grd;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		
		ctx.closePath();
		ctx.stroke();
	}	
}

function appDrawElements(el) {
	var size = api.settings.elemSize;
	if (project.viewport.z>1) size = api.settings.elemSize/2;
	if (project.viewport.z>3) size = api.settings.elemSize/3;
	if (project.viewport.z>6) size = api.settings.elemSize/4;
	if (project.viewport.z>16) size = api.settings.elemSize/7;
	
	for (var i=0; i<el.length; i++) {
		if (el[i] === undefined) continue;
		var x = el[i].X, y = el[i].Y;
		if ((el[i].type == 4) || (el[i].type == 5)) {
			x = translateOnBondCoordsX(el[i].X, el[i].Y);
			y = translateOnBondCoordsY(el[i].X, el[i].Y);
		}
		var isSelected = ((api.activeWindow!==undefined)?(api.activeWindow.startsWith("edit")?((document.getElementById(api.activeWindow).getElementsByClassName("cc_id")[0].value == i)?true:false):false):false) || (api.showElSel == i);
		
		if (el[i].privateColor != "") ctx.fillStyle = el[i].privateColor;
		else ctx.fillStyle = api.settings.color[el[i].type-1];
		
		if ((api.brush == 99) && (AuxBonds == i)) ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].actconn;
		if (isSelected) ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].selected;
		if ((AuxBonds == i) && api.settings.tooltips) {
			if ((api.brush == 99) && !isBondUnique(AuxBonds,AuxBonds2) || AuxBonds==AuxBonds2) {
				ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
				document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
			}
			else if (api.brush == 99) document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].line;
			else document.getElementById("brush0").style.background="";
		}
		ctx.beginPath();
		ctx.arc(translateCoordsX(x),translateCoordsY(y), size*el[i].z, 0,6.28);
		ctx.closePath();
		ctx.fill();
		if ((((api.brush == 99) && (AuxBonds == i)) || isSelected) && api.settings.tooltips) ctx.stroke();
	}
	
	if (((api.brush>0 && api.brush<=5)) && api.settings.tooltips) {
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
	else if ((api.brush == 97) && (project.elements[AuxMove].type > 0) && (project.elements[AuxMove].type<=3)) {
		var x = gridCoords(translateCoordsReverseX(api.mouse.X)), y = gridCoords(translateCoordsReverseY(api.mouse.Y));
		if (((project.elements[AuxMove].X != x) || (project.elements[AuxMove].Y != y)) && !isElementThere(x,y,AuxMove)) {
			project.elements[AuxMove].X = gridCoords(translateCoordsReverseX(api.mouse.X));
			project.elements[AuxMove].Y = gridCoords(translateCoordsReverseY(api.mouse.Y));
			api.forceRedraw = true;
		}
	}
	else if (api.brush == 97) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el !== undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 !== undefined) {
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
        if (el !== undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 !== undefined) {
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
	else if (((api.brush > 0) && (api.brush<=3)) && api.settings.tooltips) {
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
		api.updateEverything();
	}
	if (api.enElSel && (api.elSel != api.showElSel)) {
		api.showElSel = api.elSel;
		api.forceRedraw = true;
	}
	if (!api.enElSel && (api.showElSel !== null)) {
		api.showElSel = null;
		api.forceRedraw = true;
	}
	setTimeout(appMain, api.settings.chInterval);
}

function appInit() {
	doMoving.fact = false;
	api.changed = false;
	resetViewport();
	ctx = document.getElementById("c").getContext('2d');
	setTimeout(appMain, api.settings.chInterval);
    api.mouse.onclick[0] = DrawRemoveSelector;
}


function createAndAddElement(el, isNew) { //createElement already defined >:c
	var e = document.getElementById(el);
	var id = parseInt(e.getElementsByClassName("cc_id")[0].value);
	project.elements[id] = {};
	project.elements[id].X = parseFloat(e.getElementsByClassName("cc_X")[0].value);
	project.elements[id].Y = parseFloat(e.getElementsByClassName("cc_Y")[0].value);
	var type = parseInt(e.getElementsByClassName("cc_type")[0].value);
	project.elements[id].type = type;
	project.elements[id].desc = e.getElementsByClassName("cc_desc")[0].value;
	project.elements[id].name = e.getElementsByClassName("cc_name")[0].value;
	project.elements[id].privateColor = e.getElementsByClassName("cc_color")[0].value;
	if (e.getElementsByClassName("cc_size")[0].value !== "") project.elements[id].z = parseInt(e.getElementsByClassName("cc_size")[0].value)/100; else project.elements[id].z = 1;
	
	if ((type == 1) || (type == 2)) {
		if (e.getElementsByClassName("cc_state")[0].value !== "") project.elements[id].state = parseInt(e.getElementsByClassName("cc_state")[0].value); else project.elements[id].state = 0;
		if (e.getElementsByClassName("cc_limit")[0].value !== "") project.elements[id].lim = parseInt(e.getElementsByClassName("cc_limit")[0].value); else project.elements[id].lim = 0;
	}
	else if (type == 3) {
		if (e.getElementsByClassName("cc_cost")[0].value !== "") project.elements[id].cost = parseInt(e.getElementsByClassName("cc_cost")[0].value); else project.elements[id].cost = 0;
		if (e.getElementsByClassName("cc_value")[0].value !== "") project.elements[id].val = parseInt(e.getElementsByClassName("cc_value")[0].value); else project.elements[id].val = 0;
	}
	else if ((type == 4) || (type == 5)) {
		if (e.getElementsByClassName("cc_cost2")[0].value !== "") project.elements[id].cost = parseInt(e.getElementsByClassName("cc_cost2")[0].value); else project.elements[id].cost = 0;
		if (e.getElementsByClassName("cc_effect")[0].value !== "") project.elements[id].val = parseInt(e.getElementsByClassName("cc_effect")[0].value); else project.elements[id].val = 0;	
	}
	if (!isNew) api.brush = type;
	api.changed = true;
	api.forceRedraw = true;
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
	if (!isNew) api.brush = 0;
	api.changed = true;
	api.forceRedraw = true;
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
	for (var i=0; i<project.elements.length; i++) if ((project.elements[i] !== undefined) && i != ex) if ((project.elements[i].X == x) && (project.elements[i].Y == y)) return true;
	return false;
}

function isBondUnique(a,b) {
	for (var i=0; i<project.bonds.length; i++) if (project.bonds[i] !== undefined) if ((project.bonds[i].first == a) && (project.bonds[i].second == b)) return false;
	return true;
}

function editElement(id) {
	api.callWindow("","edit",id);
	var e = document.getElementById("edit"+id);
	var el = project.elements[id];
	e.getElementsByClassName("cc_id")[0].value = id;
	e.getElementsByClassName("cc_X")[0].value = el.X;
	e.getElementsByClassName("cc_Y")[0].value = el.Y;
	e.getElementsByClassName("cc_type")[0].value = el.type;
	e.getElementsByClassName("cc_color")[0].value = project.elements[id].privateColor;
	e.getElementsByClassName("cc_size")[0].value = project.elements[id].z*100;
	
	e.getElementsByClassName("cc_desc")[0].value = el.desc;
	e.getElementsByClassName("cc_name")[0].value = el.name;
	e.getElementsByClassName("cc_cost")[0].value = el.cost;
	e.getElementsByClassName("cc_cost2")[0].value = el.cost;
	e.getElementsByClassName("cc_state")[0].value = el.state;
	e.getElementsByClassName("cc_limit")[0].value = el.lim;
	e.getElementsByClassName("cc_value")[0].value = el.val;
	e.getElementsByClassName("cc_effect")[0].value = el.val;
	
	e.getElementsByClassName("_cc_initator")[0].style.display = (((el.type == 1) || (el.type == 2))?"block":"none");
	e.getElementsByClassName("_cc_target")[0].style.display = ((el.type == 3)?"block":"none");
	e.getElementsByClassName("_cc_control")[0].style.display = (((el.type == 4) || (el.type == 5))?"block":"none");
}

function editBond(id) {
	api.callWindow("","editb",id);
	var e = document.getElementById("editb"+id);
	var el = project.bonds[id];
	e.getElementsByClassName("cc_id")[0].value = id;
	e.getElementsByClassName("cc_first")[0].value = el.first;
	e.getElementsByClassName("cc_second")[0].value = el.second;
	e.getElementsByClassName("cc_v")[0].value = el.val;
}

function AddElement(MouseX,MouseY,onBond) {
	var i, x=MouseX, y=MouseY;
	if (!onBond) { 
		x=gridCoords(MouseX);
		y=gridCoords(MouseY);
	}
	if (isElementThere(x,y)) return;
	for (i=0;1;i++) if (project.elements[i] === undefined) break;
	api.callWindow('inst');
	var e = document.getElementById("inst");
	e.getElementsByClassName("cc_id")[0].value = i;
	e.getElementsByClassName("cc_X")[0].value = x;
	e.getElementsByClassName("cc_Y")[0].value = y;
	e.getElementsByClassName("cc_type")[0].value = api.brush;
	e.getElementsByClassName("cc_color")[0].value = "";
	e.getElementsByClassName("cc_size")[0].value = "100";
	
	e.getElementsByClassName("cc_desc")[0].value = "";
	e.getElementsByClassName("cc_name")[0].value = "C"+(api.brush == 1?"(U)":(api.brush == 3?"(G)":(api.brush == 4?"(R)":(api.brush == 5?"(A)":""))))+i;
	e.getElementsByClassName("cc_cost")[0].value = "0";
	e.getElementsByClassName("cc_cost2")[0].value = "0";
	e.getElementsByClassName("cc_state")[0].value = "0";
	e.getElementsByClassName("cc_limit")[0].value = "0";
	e.getElementsByClassName("cc_value")[0].value = "0";
	e.getElementsByClassName("cc_effect")[0].value = "0";
	
	e.getElementsByClassName("_cc_initator")[0].style.display = (((api.brush == 1) || (api.brush == 2))?"block":"none");
	e.getElementsByClassName("_cc_target")[0].style.display = ((api.brush == 3)?"block":"none");
	e.getElementsByClassName("_cc_control")[0].style.display = (((api.brush == 4) || (api.brush == 5))?"block":"none");
	api.brush = 100;
}

function MoveElement(ActualElement,NewX,NewY) {
	var x=gridCoords(NewX), y=gridCoords(NewY);
	var i=x, i2=y;
	if ((project.elements[ActualElement].type > 0) && (project.elements[ActualElement].type<=3) && (isElementThere(x,y,ActualElement))) return;
	if ((project.elements[ActualElement].type == 4) || (project.elements[ActualElement].type == 5)) {
		i = FindTheClosestBond(NewX,NewY,api.settings.elemSize);
        if (i !== undefined) i2 = BondPositon(NewX,NewY,i);
	}
	if ((i !== undefined) && (i2 !== undefined)) {
		project.elements[ActualElement].X=i;
		project.elements[ActualElement].Y=i2;
	}
	api.forceRedraw = true;
	api.changed = true;
	api.brush = -2;
}

function RemoveBond(ActualBond) {
	delete project.bonds[ActualBond];
	api.forceRedraw = true;
	api.changed = true;
}

function AddBond(FirstElement,SecondElement) {
	if (FirstElement == SecondElement) return;
	if (!isBondUnique(FirstElement,SecondElement)) return;
	var i=0;
	for (i=0;1;i++) if (project.bonds[i] === undefined) break;
	api.callWindow('instb');
	var e = document.getElementById("instb");
	e.getElementsByClassName("cc_id")[0].value = i;
	e.getElementsByClassName("cc_first")[0].value = FirstElement;
	e.getElementsByClassName("cc_second")[0].value = SecondElement;
	e.getElementsByClassName("cc_v")[0].value = "0.5";
	/*
	project.bonds[i]={};
	project.bonds[i].first=FirstElement;
	project.bonds[i].second=SecondElement;
	api.changed = true;
	api.forceRedraw = true;	*/
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
			if (project.elements[key] === undefined) continue;
			var x = project.elements[key].X, y = project.elements[key].Y;
			if ((project.elements[key].type == 4) || (project.elements[key].type == 5)) {
				x = translateOnBondCoordsX(project.elements[key].X, project.elements[key].Y);
				y = translateOnBondCoordsY(project.elements[key].X, project.elements[key].Y);
			}
			Aux1=(x-MouseX)*(x-MouseX);
			Aux2=(y-MouseY)*(y-MouseY);
			Aux3=Math.sqrt(Aux1+Aux2);
			if (Aux3<Range*project.viewport.z) {
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
		if (project.bonds[key] === undefined) continue; 
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
		if (AuxRange<Range) { 
			Range=AuxRange; 
			TheClosest=key; 
		} 
	} 
	return TheClosest; 
}


function checkOnBondElements() {
	for (var i=0; i<project.elements.length; i++) 
		if (project.elements[i] !== undefined)
			if ((project.elements[i].type == 4) || (project.elements[i].type == 5))
				if (project.bonds[project.elements[i].X] === undefined)
					RemoveElement(i, false);
}

function checkBonds() {
	for (var i=0; i<project.bonds.length; i++) 
		if ((project.elements[project.bonds[i].first] === undefined) || (project.elements[project.bonds[i].second] === undefined))
			RemoveBond(i);
	checkOnBondElements();
}

function RemoveElement(ActualElement, tryCheckBonds) {
	delete project.elements[ActualElement];
	if (tryCheckBonds) checkBonds();
	api.changed = true;
	api.forceRedraw = true;
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
	
function Recalculate() {
	var i,j,k;
	for (i=0; i<project.elements.length;i++) {
	   if (project.elements[i] !== undefined) {
		   project.elements[i].bondsnum = 0;
		   project.elements[i].bonds=[];
		   for (j=0; j<project.bonds.length;j++) {
			   if (project.bonds[j] !== undefined) {
				   if (project.bonds[j].first == i || project.bonds[j].second == i) {
					   project.elements[i].bondsnum++;
					   project.elements[i].bonds[project.elements[i].bondsnum]=j;
				   }
				   
			   }
		   }
	   }
	}
	for (i=0; i<project.bonds.length;i++) {
		if (project.bonds[i] !== undefined) {
			project.bonds[i].elemsnum = 0;
			project.bonds[i].elems=[];
			for (j=0; j<project.elements.length;j++) {
			if (project.elements[j].bondsnum !== undefined) {
				for (k=0;k<project.elements[j].bondsnum;k++) {
					if (project.elements[j].bonds[k+1] == i) {
						project.bonds[i].elemsnum++;
						project.bonds[i].elems[project.bonds[i].elemsnum]=j;
						}
					}
				}
			}
			if (project.bonds[i].elemsnum == 2) project.bonds[i].check = 1;
		}
	}
}

function DrawRemoveSelector() {
	if (api.brush == 0) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
		if (el !== undefined) {
			AuxBonds = el;
			api.brush=99;
			api.forceRedraw = true;
		}
	}
	else if (api.brush == 99) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
		if (el !== undefined) AddBond(AuxBonds,el);
	}
	else if (api.brush == -1) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
		if (el !== undefined) editElement(el);
	}
	else if (api.brush == -2) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
        if (el !== undefined) {
			api.brush = 97;    	
            AuxMove=el;
		}			
		
	}
	else if (api.brush == 4 || api.brush == 5) {
		var el = FindTheClosestBond(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),api.settings.elemSize);
        if (el !== undefined) {
			var el2 = BondPositon(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),el);
		    if (el2 !== undefined) {
				AddElement(el, el2, true);
			}
		}			
		
	}
	else if (api.brush == 97) MoveElement(AuxMove,translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
	else AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y), false);
}