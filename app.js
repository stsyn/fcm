var project = {};
var camera = {};
var colorScheme = [{bg:"#fff",line:"#ccc",coord:"#f88"},{bg:"#001",line:"#033",coord:"#600"}];
var ctx;
var doMoving = {};

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
	if (api.mouse.button == 1) {
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
	camera.x = 0;
	camera.y = 0;
	camera.z = 0.5;
	ctx = document.getElementById("c").getContext('2d');
	setTimeout(appMain, api.settings.chInterval);
}