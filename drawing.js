var NumberOfElements = 0;
var MainDrawingArrayPositionX = {};
var MainDrawingArrayPositionY = {};
var NumberOfBonds = 0;
var BondsDrawingArrayFirst = {};
var BondsDrawingArraySecond = {};
var ActiveElement;
var MousePositionX=100;
var MousePositionY=100;
var example = document.getElementById("example"),
			   ctx     = example.getContext('2d');
 
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
function AddElement()
{
	NumberOfElements=NumberOfElements+1;
	MainDrawingArrayPositionX[NumberOfElements] = MousePositionX;
	MainDrawingArrayPositionY[NumberOfElements] = MousePositionY;
}
function AddAndDraw()
{
	AddElement();
	DrawElement(NumberOfElements);
}
function ReDrawAll()
{
	InitilazeDrawing();
	for (var key in MainDrawingArrayPositionX)
		DrawElement(key);
}
function MoveElement(ActualElement,NewX,NewY);
{
	MainDrawingArrayPositionX[ActualElement]=NewX;
	MainDrawingArrayPositionY[ActualElement]=NewY;
}
function DrawBond(ActualBond);
{
	ctx.beginPath();
	ctx.fillStyle="blue";
	ctx.moveTo(MainDrawingArrayPositionX[BondsDrawingArrayFirst[ActualBond]],MainDrawingArrayPositionY[BondsDrawingArrayFirst[ActualBond]]);
	ctx.lineTo(MainDrawingArrayPositionX[BondsDrawingArraySecond[ActualBond]],MainDrawingArrayPositionY[BondsDrawingArraySecond[ActualBond]]);
	ctx.closePath();
}
function AddBond(FirstElement,SecondElement);
{
	NumberOfBonds=NumberOfBonds+1;
	BondsDrawingArrayFirst=FirstElement;
	BondsDrawingArraySecond=SecondElement;
}
function AddAndDrawBond(FirstElement,SecondElement);
{
	AddBond(FirstElement,SecondElement);
	DrawBond(NumberOfBonds);
}	





