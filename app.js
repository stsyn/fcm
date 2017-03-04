var project = {settings:{},elements:[],bonds:[]};
var camera = {};
var colorScheme = [{bg:"#fff",line:"#bbb",coord:"#f88",connections:"#000",actconn:"#8f8",fakeconn:"#f88"},
				   {bg:"#001",line:"#033",coord:"#600",connections:"#4bb",actconn:"#060",fakeconn:"#600"}];
var ctx, zoomprop;
var doMoving = {};
var currentBrush = {};

var AuxBonds, AuxBonds2, dAuxBonds;
var AuxMove, tElemX, tElemY;
var NumberOfBonds = 0;
var BondsDrawingArrayFirst = {};
var BondsDrawingArraySecond = {};


function resetProject() {
	project = {settings:{},elements:[],bonds:[]};
	project.settings.strict = true;
	api.forceRedraw = true;
}

function resetViewport() {
	camera.x=0;
	camera.y=0;
	camera.z=0.5;
}

function translateCoordsX(i) {
	return (i-camera.x)/camera.z+ctx.canvas.width/2;
}

function translateCoordsY(i) {
	return (i-camera.y)/camera.z+ctx.canvas.height/2;
}

function translateCoordsReverseX(i) {
	return (i-ctx.canvas.width/2)*camera.z+camera.x;
}

function translateCoordsReverseY(i) {
	return (i-ctx.canvas.height/2)*camera.z+camera.y;
}

function translateCoordsReverseNZX(i) {
	return (i-ctx.canvas.width/2)+camera.x;
}

function translateCoordsReverseNZY(i) {
	return (i-ctx.canvas.height/2)+camera.y;
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
		var x1 = el[b[i].first].X, y1 = el[b[i].first].Y;
		var x2 = el[b[i].second].X, y2 = el[b[i].second].Y;
		if ((b[i].first == AuxMove) && api.brush == 97) {
			x1 = tElemX; y1 = tElemY;
		}
		else if ((b[i].second == AuxMove) && api.brush == 97) {
			x2 = tElemX; y2 = tElemY;
		}
		ctx.beginPath();
		ctx.moveTo(translateCoordsX(x1),translateCoordsY(y1));
		ctx.lineTo(translateCoordsX(x2),translateCoordsY(y2));
		ctx.closePath();
		ctx.stroke();
	}	
}

function appDrawElements(el) {
	var size = api.settings.elemSize;
	if (camera.z>1) size = api.settings.elemSize/2;
	if (camera.z>3) size = api.settings.elemSize/3;
	if (camera.z>6) size = api.settings.elemSize/4;
	if (camera.z>16) size = api.settings.elemSize/7;
	for (var i=0; i<el.length; i++) {
		if (el[i] === undefined) continue;
		var x = el[i].X, y = el[i].Y;
		if ((i == AuxMove) && (api.brush==97) && api.settings.tooltips) {
			x = tElemX;
			y = tElemY;
			if (isElementThere(x,y)) document.getElementById("brush-2").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
			else document.getElementById("brush-2").style.background=colorScheme[(api.settings.nightMode?1:0)].line;
		}
		if (api.brush != 97) document.getElementById("brush-2").style.background="";
		
		ctx.fillStyle = api.settings.color[el[i].type-1];
		ctx.strokeStyle = colorScheme[(api.settings.nightMode?1:0)].actconn;
		if ((AuxBonds == i) && api.settings.tooltips) {
			if ((api.brush == 99) && !isBondUnique(AuxBonds,AuxBonds2) || AuxBonds==AuxBonds2) {
				ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
				document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].fakeconn;
			}
			else if (api.brush == 99) document.getElementById("brush0").style.background=colorScheme[(api.settings.nightMode?1:0)].line;
			else document.getElementById("brush0").style.background="";
		}
		ctx.beginPath();
		ctx.arc(translateCoordsX(x),translateCoordsY(y), size, 0,6.28);
		ctx.closePath();
		ctx.fill();
		if ((api.brush == 99) && (AuxBonds == i) && api.settings.tooltips) ctx.stroke();
	}
	
	if (((api.brush>0 && api.brush<=5)) && api.settings.tooltips) {
		ctx.strokeStyle = api.settings.color[api.brush-1];
		ctx.setLineDash([3, 5]);
		ctx.beginPath();
		ctx.arc(translateCoordsX(tElemX),translateCoordsY(tElemY), size, 0,6.28);
		
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

	var x = xmax/2 - camera.x/camera.z;
	var y = ymax/2 - camera.y/camera.z;
	
	var d = 1/camera.z;
	for (zoomprop=1; d<api.settings.elemSize; zoomprop*=3) d = zoomprop/camera.z;
	zoomprop/=3;
	if (zoomprop>20) zoomprop=(zoomprop/2);
	if (!api.settings.showGrid) zoomprop = 1;
	
	if (api.settings.showGrid) {
		ctx.beginPath();
		for (var tx=x; tx>0; tx-=d) {
			ctx.moveTo (tx,0);
			ctx.lineTo (tx,ymax);
		}
		for (var tx=x; tx<xmax; tx+=d) {
			ctx.moveTo (tx,0);
			ctx.lineTo (tx,ymax);
		}
		for (var ty=y; ty>0; ty-=d) {
			ctx.moveTo (0,ty);
			ctx.lineTo (xmax,ty);
		}
		for (var ty=y; ty<ymax; ty+=d) {
			ctx.moveTo (0,ty);
			ctx.lineTo (xmax,ty);
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
		ctx.moveTo (x,0);
		ctx.lineTo (x,ymax);
		ctx.moveTo (0,y);
		ctx.lineTo (xmax,y);
		ctx.stroke();
	}
	
	appDrawBond(project.elements, project.bonds);
	appDrawElements(project.elements);
	
	api.forceRedraw = false;
}

function appMain() {
	api.settings.tooltips = true;
	if (api.mouse.button == 1 || api.mouse.button == 4) {
		if (!doMoving.fact) {
			doMoving.fact = true;
			doMoving.act = false;
			doMoving.stX = api.mouse.X;
			doMoving.stY = api.mouse.Y;
			doMoving.cStX = camera.x;
			doMoving.cStY = camera.y;
		}
		else if ((Math.abs(doMoving.stX - api.mouse.X) > 10) || (Math.abs(doMoving.stY - api.mouse.Y) > 10)) doMoving.act = true;
		if (doMoving.act) {
			camera.x = doMoving.cStX - (api.mouse.X - doMoving.stX)*camera.z;
			camera.y = doMoving.cStY - (api.mouse.Y - doMoving.stY)*camera.z;
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
	else if (((api.brush > 0) && (api.brush<=5)) || (api.brush == 97)) {
		if ((tElemX != gridCoords(translateCoordsReverseX(api.mouse.X))) || (tElemY != gridCoords(translateCoordsReverseY(api.mouse.Y)))) {
			tElemX = gridCoords(translateCoordsReverseX(api.mouse.X));
			tElemY = gridCoords(translateCoordsReverseY(api.mouse.Y));
			api.forceRedraw = true;
		}
	}
	
	if (api.forceRedraw || api.overDraw) appRedraw();
	setTimeout(appMain, api.settings.chInterval);
}

function appInit() {
	doMoving.fact = false;
	resetViewport();
	ctx = document.getElementById("c").getContext('2d');
	setTimeout(appMain, api.settings.chInterval);
    api.mouse.onclick[0] = DrawRemoveSelector;
}


function isElementThere(x,y) {
	for (var i=0; i<project.elements.length; i++) if (project.elements[i] !== undefined) if ((project.elements[i].X == x) && (project.elements[i].Y == y)) return true;
	return false;
}

function isBondUnique(a,b) {
	for (var i=0; i<project.bonds.length; i++) if (project.bonds[i] !== undefined) if ((project.bonds[i].first == a) && (project.bonds[i].second == b)) return false;
	return true;
}

function AddElement(MouseX,MouseY) {
	var i, x=gridCoords(MouseX), y=gridCoords(MouseY);
	if (isElementThere(x,y)) return;
	for (i=0;1;i++) if (project.elements[i] === undefined) break;
	project.elements[i] = {};
	project.elements[i].X = x;
	project.elements[i].Y = y;
	project.elements[i].type = api.brush;
	api.forceRedraw = true;
}

function MoveElement(ActualElement,NewX,NewY) {
	var i, x=gridCoords(NewX), y=gridCoords(NewY);
	if (isElementThere(x,y)) return;
	project.elements[ActualElement].X=x;
	project.elements[ActualElement].Y=y;
	api.forceRedraw = true;
	api.brush = -2;
}

function RemoveBond(ActualBond) {
	delete project.bonds[ActualBond];
	api.forceRedraw = true;
}

function AddBond(FirstElement,SecondElement) {
	if (FirstElement == SecondElement) return;
	if (!isBondUnique(FirstElement,SecondElement)) return;
	var i=0;
	for (i=0;1;i++) if (project.bonds[i] === undefined) break;
	project.bonds[i]={};
	project.bonds[i].first=FirstElement;
	project.bonds[i].second=SecondElement;
	api.forceRedraw = true;	
	api.brush = 0;
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
			Aux1=(project.elements[key].X-MouseX)*(project.elements[key].X-MouseX);
			Aux2=(project.elements[key].Y-MouseY)*(project.elements[key].Y-MouseY);
			Aux3=Math.sqrt(Aux1+Aux2);
			if (Aux3<Range*camera.z) {
				Range=Aux3;
				TheClosest=key;
			}
		}
	}
	return TheClosest;
	
}

function checkBonds() {
	for (var i=0; i<project.bonds.length; i++) 
		if ((project.elements[project.bonds[i].first] === undefined) || (project.elements[project.bonds[i].second] === undefined))
			RemoveBond(i);
}

function RemoveElement(ActualElement) {
	delete project.elements[ActualElement];
	checkBonds();
	api.forceRedraw = true;
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
	else if (api.brush < 0 && api.brush != -2)	{
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
		if (el !== undefined) RemoveElement(el);
	}
	else if (api.brush == -2) {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element",api.settings.elemSize);
        if (el !== undefined) {
			api.brush = 97;    	
            AuxMove=el;
		}			
		
	}
	else if (api.brush == 97) MoveElement(AuxMove,translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
	else AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
}