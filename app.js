var project = {settings:{},elements:[],bonds:[]};
var camera = {};
var colorScheme = [{bg:"#fff",line:"#bbb",coord:"#f88",connections:"#000"},{bg:"#001",line:"#033",coord:"#600",connections:"#4bb"}];
var ctx, zoomprop;
var doMoving = {};

var FlagBonds = 0;
var AuxBonds = 0;
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

function appDrawBond(el)
 {
	for (var i=0; i<el.length; i++)
	{
	if (el[i] === undefined) continue;
	ctx.strokeStyle=colorScheme[(api.settings.nightMode?1:0)].connections;
	ctx.beginPath();
	ctx.moveTo(translateCoordsX(el[i].first.X),translateCoordsY(el[i].first.Y));
	ctx.lineTo(translateCoordsX(el[i].second.X),translateCoordsY(el[i].second.Y));
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
		ctx.fillStyle = api.settings.color[el[i].type-1];
		ctx.beginPath();
		ctx.arc(translateCoordsX(el[i].X),translateCoordsY(el[i].Y), size, 0,6.28);
		ctx.closePath();
		ctx.fill();
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
	
	appDrawBond(project.bonds);
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
	if (api.forceRedraw) appRedraw();
	setTimeout(appMain, api.settings.chInterval);
}

function appInit() {
	doMoving.fact = false;
	resetViewport();
	ctx = document.getElementById("c").getContext('2d');
	setTimeout(appMain, api.settings.chInterval);
    api.mouse.onclick[0] = DrawRemoveSelector;
}


function AddElement(MouseX,MouseY) {
	var i, x=parseInt(Math.round(parseInt(MouseX)/zoomprop)*zoomprop), y=parseInt(Math.round(parseInt(MouseY)/zoomprop)*zoomprop);
	
	for (i=0; i<project.elements.length; i++) {
		if (project.elements[i] === undefined) continue;
		if (x == project.elements[i].X && y == project.elements[i].Y) return;
	}
	for (i=0;1;i++) if (project.elements[i] === undefined) break;
	project.elements[i] = {};
	project.elements[i].X = x;
	project.elements[i].Y = y;
	project.elements[i].type = api.brush;
	api.forceRedraw = true;
}

function MoveElement(ActualElement,NewX,NewY) {
	project.elements[ActualElement].X=NewX;
	project.elements[ActualElement].Y=NewY;
}

function RemoveBond(ActualBond)
{
	delete project.bonds[ActualBond];
	api.forceRedraw = true;
}


function AddAndDrawBond(FirstElement,SecondElement) {
	var i=0;
	for (i=0;1;i++) if (project.bonds[i] === undefined) break;
	project.bonds[i]={};
	project.bonds[i].first=project.elements[FirstElement];
	project.bonds[i].second=project.elements[SecondElement];
	api.forceRedraw = true;	


}

/*function AddAndDrawBond(FirstElement,SecondElement) {
	AddBond(FirstElement,SecondElement);
	DrawBond(NumberOfBonds);
}*/	

function FindTheClosest(MouseX,MouseY,Type) {
	var Range = 20;
	var TheClosest;
	var Aux1=1.0;
	var Aux2=1.0;
	var Aux3=1.0;
	if (Type=="Element")
	{
		for (var key=0; key<project.elements.length;key++)
		{
			if (project.elements[key] === undefined) continue;
			Aux1=(project.elements[key].X-MouseX)*(project.elements[key].X-MouseX);
			Aux2=(project.elements[key].Y-MouseY)*(project.elements[key].Y-MouseY);
			Aux3=Math.sqrt(Aux1+Aux2);
			if (Aux3<Range*camera.z)
			{
				Range=Aux3;
				TheClosest=key;
			}
		}
	}
	return TheClosest;
	
}
function RemoveElement(ActualElement)
{
	delete project.elements[ActualElement];
	/*
	var Aux1=0;
	var key;
	Aux1=project.elements[project.elements.length-1].X;
	project.elements[project.elements.length-1].X=project.elements[ActualElement].X;
	project.elements[ActualElement].X=Aux1;
	Aux1=project.elements[project.elements.length-1].Y;
	project.elements[project.elements.length-1].Y=project.elements[ActualElement].Y;
	project.elements[ActualElement].Y=Aux1;
	for (key=1; key<=NumberOfBonds; key++) {
		if (BondsDrawingArrayFirst[key]==project.elements.length-1) BondsDrawingArrayFirst[key]=ActualElement;
		if (BondsDrawingArraySecond[key]==project.elements.length-1) BondsDrawingArraySecond[key]=ActualElement;
		//if (BondsDrawingArrayFirst[key]==ActualElement) RemoveBond();
		//if (BondsDrawingArraySecond[key]==ActualElement) RemoveBond();
		
	}
	project.elements.length=project.elements.length-1;
	*/
	api.forceRedraw = true;
}

function DrawRemoveSelector()
{
	/*if (api.brush>0) AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
	else {
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element");
		if (el !== undefined) RemoveElement(el);
	}*/
	if (api.brush > 0 )  AddElement(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y));
	if (api.brush == 0)
	{
		if (FlagBonds === 0)
		{
			var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element");
		    if (el !== undefined) AuxBonds = el;
			FlagBonds=1;
		}
		else
		{
			FlagBonds=0;
			var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element");
		    if (el !== undefined) AddAndDrawBond(AuxBonds,el);
		}
	}
	if (api.brush < 0  )
	{
		var el = FindTheClosest(translateCoordsReverseX(api.mouse.X),translateCoordsReverseY(api.mouse.Y),"Element");
		if (el !== undefined) RemoveElement(el);
	}
	
}
