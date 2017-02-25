var project = {settings:{}};
var camera = {};
var colorScheme = [{bg:"#fff",line:"#bbb",coord:"#f88"},{bg:"#001",line:"#033",coord:"#600"}];
var ctx;
var doMoving = {};
//
//
// Моя часть переменных
var NumberOfElements = 0;
var MainDrawingArrayPositionX = {};
var MainDrawingArrayPositionY = {};
var NumberOfBonds = 0;
var BondsDrawingArrayFirst = {};
var BondsDrawingArraySecond = {};
var ActiveElement;
var MousePositionX=100;
var MousePositionY=100;


//Конец моей части переменных
//
//

function resetProject() {
	project.factors = [];
	project.connections = [];
	project.cfactors = [];
	project.settings.strict = true;
	project.settings.terms = [];
	api.forceRedraw = true;
}

function resetViewport() {
	camera.x=0;
	camera.y=0;
	camera.z=0.5;
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
	
	ctx.beginPath();
	var d = 1/camera.z;
	for (var i=1; d<40; i*=5) d = i/camera.z;
	
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
	
	ctx.strokeStyle = colorScheme[mode].coord;
	ctx.lineWidth = 3;
	
	if (x < 20) x = 20;
	if (x > xmax-20) x = xmax-20;
	if (y < 60) y = 60;
	if (y > ymax-60) y = ymax-60;
	
	
	ctx.beginPath();
	ctx.moveTo (x,0);
	ctx.lineTo (x,ymax);
	ctx.moveTo (0,y);
	ctx.lineTo (xmax,y);
	ctx.stroke();
	
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


//
//
// Моя часть программы
function InitilazeDrawing()
{
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,example.width, example.height);
}

function DrawElement(ActualElement)
 {
	ctx.fillStyle= "orange";
    ctx.fillRect(MainDrawingArrayPositionX[ActualElement], MainDrawingArrayPositionY[ActualElement], 50, 50);	
}
function AddElement(MouseX,MouseY)
{
	NumberOfElements=NumberOfElements+1;
	MainDrawingArrayPositionX[NumberOfElements] = MouseX;
	MainDrawingArrayPositionY[NumberOfElements] = MouseY;
}
function AddAndDraw(MouseX,MouseY)
{
	AddElement(MouseX,MouseY);
	DrawElement(NumberOfElements);
}
function ReDrawAll()
{
    var key=0;
	InitilazeDrawing();
	for (key=1; key<=NumberOfBonds;key++)
        DrawBond(BondsDrawingArrayFirst[key],BondsDrawingArraySecond[key]);	
	for (key=1; key<=NumberOfElements;key++)
		DrawElement(key);

}
function MoveElement(ActualElement,NewX,NewY)
{
	MainDrawingArrayPositionX[ActualElement]=NewX;
	MainDrawingArrayPositionY[ActualElement]=NewY;
}
function DrawBond(ActualBond)
{
    var Adj1=0;
	var Adj2=0;
	if (MainDrawingArrayPositionX[BondsDrawingArrayFirst[ActualBond]]!=MainDrawingArrayPositionX[BondsDrawingArraySecond[ActualBond]]) Adj2=3
	 else Adj1=3;	
	ctx.beginPath();
	ctx.fillStyle="blue";
	ctx.moveTo(MainDrawingArrayPositionX[BondsDrawingArrayFirst[ActualBond]],MainDrawingArrayPositionY[BondsDrawingArrayFirst[ActualBond]]);
	ctx.lineTo(MainDrawingArrayPositionX[BondsDrawingArrayFirst[ActualBond]]+Adj1,MainDrawingArrayPositionY[BondsDrawingArrayFirst[ActualBond]]+Adj2);
	ctx.lineTo(MainDrawingArrayPositionX[BondsDrawingArraySecond[ActualBond]]+Adj1,MainDrawingArrayPositionY[BondsDrawingArraySecond[ActualBond]]+Adj2);
	ctx.lineTo(MainDrawingArrayPositionX[BondsDrawingArraySecond[ActualBond]],MainDrawingArrayPositionY[BondsDrawingArraySecond[ActualBond]]);
	ctx.closePath();
	ctx.fill();
}
function AddBond(FirstElement,SecondElement)
{
	NumberOfBonds=NumberOfBonds+1;
	BondsDrawingArrayFirst[NumberOfBonds]=FirstElement;
	BondsDrawingArraySecond[NumberOfBonds]=SecondElement;
}
function AddAndDrawBond(FirstElement,SecondElement)
{
	AddBond(FirstElement,SecondElement);
	DrawBond(NumberOfBonds);
}	
function FindTheClosest(MouseX,MouseY,Type)
{
	var Range = 99999999;
	var TheClosest = 1;
	var Aux1=1.0;
	var Aux2=1.0;
	var Aux3=1.0;
	if (Type=="Element")
	{
		for (var key=1; key<=NumberOfElements;key++)
		{
			Aux1=(MainDrawingArrayPositionX[key]-MouseX)*(MainDrawingArrayPositionX[key]-MouseX);
			Aux2=(MainDrawingArrayPositionY[key]-MouseY)*(MainDrawingArrayPositionY[key]-MouseY);
			Aux3=Math.sqrt(Aux1+Aux2);
			Aux3=Math.sqrt(Aux1+Aux2);
			if (Aux3<Range)
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
  var Aux1=0;
  var key;
  Aux1=MainDrawingArrayPositionX[NumberOfElements];
  MainDrawingArrayPositionX[NumberOfElements]=MainDrawingArrayPositionX[ActualElement];
  MainDrawingArrayPositionX[ActualElement]=Aux1;
  Aux1=MainDrawingArrayPositionY[NumberOfElements];
  MainDrawingArrayPositionY[NumberOfElements]=MainDrawingArrayPositionY[ActualElement];
  MainDrawingArrayPositionY[ActualElement]=Aux1;
   for (key=1; key<=NumberOfBonds; key++)
  {
    if (BondsDrawingArrayFirst[key]==NumberOfElements) BondsDrawingArrayFirst[key]=ActualElement;
	if (BondsDrawingArraySecond[key]==NumberOfElements) BondsDrawingArraySecond[key]=ActualElement;
	//if (BondsDrawingArrayFirst[key]==ActualElement) RemoveBond();
	//if (BondsDrawingArraySecond[key]==ActualElement) RemoveBond();
	
  }
  NumberOfElements=NumberOfElements-1;
}

function DrawRemoveSelector()
{
  if (api.brush<=-1) AddAndDraw(api.mouse.X,api.mouse.Y);
  else RemoveElement(FindTheClosest(api.mouse.X,api.mouse.Y,"Element"));
}


// Конец моей части программы
//
//