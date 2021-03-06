/*
	Trigon.io (client)
	
	� & � iO Ninja
	
	"Just played Trigon.io: survived for 20m 18s and got a score of 705. Can you beat me? http://trigon.io #trigonio #trigon.io via @io_ninja"
*/

//Connect to server
var socket;// = io();//io.connect("http://localhost:443/");
//Width and height of world
var ww = 3000;
var wh = 3000;
var mms = 100;
//Initial player object
var player = {id:0,x:ww/2,y:wh/2,tx:ww/2,ty:wh/2,points:0,score:0};
//Players array
var players = [];
var leader = {x:0,y:0};
//Player permanent information (associative array)
var perm = {};
//Bullets array
var bullets = [];
//Asteroid array
var ast = [];

//Canvas element
var canvas = document.getElementById("canvas");
//Game game
var game = canvas.getContext("2d");

//Screen width and height
var w;
var h;

//Size of grid squares
var gridWidth = 30;
//Ship line thickness
var slw = 10;

//Name
var name;
//Class
var cls = 0;
//Ability
var ability = 0;
//Rotation
var rotation = 0;
//If ready (true after hitting "Play")
var ready = 0;
var shipsDestroyed = 0;
var timeStarted;
var topPosition = 10;

var shaking = 0;
var shakeAmount = 0;
var shakeX = 0;
var shakeY = 0;

var spaceJustDown = 0;

//All the elements (see variable names)
var menuElement = document.getElementById("menu");
var menuContainer = document.getElementById("mcontainer");
var logoElement = document.getElementById("logo");
var profilesElement = document.getElementById("profiles");
var mainContainer = document.getElementById("main");
var connectingStatus = document.getElementById("connecting");
var playButton = document.getElementById("play");
var aliasBox = document.getElementById("alias");
var classBox = document.getElementById("class");
var statsContainer = document.getElementById("stats");
statsContainer.style.display = "none";
var statsHeading = document.getElementById("sheading");
var statElements = document.getElementsByClassName("stat");
var statsTwitter = document.getElementById("sstwitter");
var continueButton = document.getElementById("continue");
var abilityBox = document.getElementById("ability");
var abilityNameElement = document.getElementById("aname");
var abilityFill = document.getElementById("afill");
var myShipHeading = document.getElementById("msheading");
var myShipClass = document.getElementById("msclass");
var myShipAbility = document.getElementById("msability");
var myShipStats = document.getElementById("msstats");
var myShipDescription = document.getElementById("msdescription");
var shareHeading = document.getElementById("siheading");
var shareText = document.getElementById("sitext");
var shareButtons = document.getElementsByClassName("unlocker");
var tipsElement = document.getElementById("tips");
var otherCards = document.getElementsByClassName("other");
var hudElement = document.getElementById("hud");
var pointsBox = document.getElementById("points");
var boardElement = document.getElementById("board");
var upgradesContainer = document.getElementById("upgrades");
var upgradeElements = [];
var minimapElement = document.getElementById("minimap");
var mini = minimapElement.getContext("2d");
minimapElement.width = mms;
minimapElement.height = mms;
var bigNotification = document.getElementById("bnotification");
var bottomAd = document.getElementById("bad");

var cpx = ww/2;
var cpy = wh/2;
var dss = 1500;
var cs = 1;

var upgradeMult = 10;

//Window resize handler
var resize = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	w = canvas.width;
	h = canvas.height;
	
	if (w > h) {
		rr = w/dss;
	} else {
		rr = h/dss;
	};
	cs = rr;
	
	slw = 10*cs;
	
	menuContainer.style.transform = "translateY(-50%) scale("+cs/1.4+")";
	bottomAd.style.transform = "translateX(-50%) scale("+cs/1.4+")";
};

//Set handler and inital check
window.onresize = resize;
resize();

var clientLast = Date.now();
var serverLast = 1;
var serverDelta = 1;

var servers = [
	"localhost"
];

var serverFound = 0;
var csr;

//Relevant class information (for rendering)
var classes = [
	//Fighter
	{
		width: 60,
		height: 80,
		c1: "#1a1aff",
		c2: "#0000e6"
	},
	//Tanky
	{
		width: 70,
		height: 90,
		c1: "#e60000",
		c2: "#b30000"
	},
	//Striker
	{
		width: 60,
		height: 90,
		c1: "#cc00cc",
		c2: "#990099"
	},
	//Speedy
	{
		width: 60,
		height: 80,
		c1: "#00e600",
		c2: "#00b300"
	},
	//Destroyer
	{
		width: 90,
		height: 80,
		c1: "#999999",
		c2: "#737373"
	},
	{
		width: 60,
		height: 90,
		c1: "#e6c300",
		c2: "#b39800"
	}
];

//To be gone
var menuClasses = [
	{
		name: "Fighter",
		stats: [3,3,2,2,3]
	},
	{
		name: "Tanky",
		stats: [5,1,3,4,3]
	},
	{
		name: "Striker",
		stats: [2,2,3,3,4]
	},
	{
		name: "Speedy",
		stats: [1,5,2,1,4]
	},
	{
		name: "Destroyer",
		stats: [3,2,4,5,1]
	},
	{
		name: "Hoarder",
		stats: [2,2,2,4,2]
	}
];

//Display stat names
var menuClassesStats = ["Health","Speed","Damage","Weight","Range"];

//Ability names
var abilityNames = ["Repair","Super Boost","Shield","Invisibility"];

//Upgrade information and storage
var upgrades = [
	{
		name: "Maximum Health",
		level: 1
	},
	{
		name: "Health Regeneration",
		level: 1
	},
	{
		name: "Boost Power",
		level: 1
	},
	{
		name: "Reload Speed",
		level: 1
	},
	{
		name: "Bullet Damage",
		level: 1
	},
	{
		name: "Bullet Range",
		level: 1
	},
	{
		name: "Bullet Speed",
		level: 1
	},
	{
		name: "Collision Damage",
		level: 1
	},
	{
		name: "Ability",
		level: 1
	}
];

//Function: angle from points
var afp = function(x1,y1,x2,y2) {
	return Math.atan2(y2-y1,x2-x1);
};

//Function: point from angle
var pfa = function(x,y,a,d) {
	return [Math.cos(a)*d+x,Math.sin(a)*d+y];
};

//Function: distance from points
var dfp = function(x1,y1,x2,y2) {
	return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
};

var lerp = function(a,b,f) {
	return a+f*(b-a);
};

var lerpxy = function(x1,y1,x2,y2,f) {
	return [x1+f*(x2-x1),y1+f*(y2-y1)];
};

//Function: return random number in range
var random = function(r) {
	return Math.floor(Math.random()*r);
};

//Function: return value compensating for player position (x)
var cx = function(n) {
	return (n-cpx)*cs+w/2-classes[cls].width/2*cs+shakeX;
};

//Function: return value compensating for player position (y)
var cy = function(n) {
	return (n-cpy)*cs+h/2-classes[cls].height/2*cs+shakeY;
};

var shake = function(t,a) {
	shaking = 1;
	shakeAmount = a;
	setTimeout(stopShake,t);
};

var stopShake = function() {
	shaking = 0;
};

var updateShake = function() {
	shakeX = lerp(shakeX,random(shakeAmount*2)-shakeAmount,0.5);
	shakeY = lerp(shakeY,random(shakeAmount*2)-shakeAmount,0.5);
};

var updateCamera = function(csr) {
	li = lerpxy(cpx,cpy,player.x,player.y,csr);
	cpx = li[0];
	cpy = li[1];
};

var tsc = function(s) {
	return s.charAt(0).toUpperCase()+s.slice(1);
};

//Function: check collision between two objects
var checkCollision = function(x1,y1,r1,x2,y2,r2) {
	return (dfp(x1,y1,x2,y2) < r1+r2);
};

var unlockClass = function(fromButton) {
	shareHeading.innerHTML = "Class unlocked";
	shareText.innerHTML = "Hoarder unlocked: get 20% off upgrades!";
	classBox.innerHTML += "<option value=\"5\">Hoarder</option>";
	classBox.value = String(cls);
	if (fromButton) {
		localStorage.unlocked = "1";
		classBox.value = "5";
		cls = 5;
	};
};

//Rendering functions
var shapes = [
	function(width,height,c2) {
		game.moveTo(0,-height/2);
		game.lineTo(-width/2,height/2);
		game.lineTo(width/2,height/2);
		game.lineTo(0,-height/2);
		game.fill();
		drawLine(0,-height/2,-width/2,height/2,c2,slw,"round");
		drawLine(-width/2,height/2,width/2,height/2,c2,slw,"round");
		drawLine(width/2,height/2,0,-height/2,c2,slw,"round");
	},
	function(width,height,c2) {
		game.moveTo(-width/4,-height/2);
		game.lineTo(-width/2,height/2);
		game.lineTo(width/2,height/2);
		game.lineTo(width/4,-height/2);
		game.fill();
		drawLine(-width/4,-height/2,-width/2,height/2,c2,slw,"round");
		drawLine(-width/2,height/2,width/2,height/2,c2,slw,"round");
		drawLine(width/2,height/2,width/4,-height/2,c2,slw,"round");
		drawLine(-width/4,-height/2,width/4,-height/2,c2,slw,"round");
	},
	function(width,height,c2) {
		game.moveTo(0,-height/2);
		game.lineTo(width/2,0);
		game.lineTo(width/2,height/2);
		game.quadraticCurveTo(0,0,-width/2,height/2);
		game.lineTo(-width/2,0);
		game.fill();
		drawLine(0,-height/2,width/2,0,c2,slw,"round");
		drawLine(0,-height/2,-width/2,0,c2,slw,"round");
		drawLine(width/2,0,width/2,height/2,c2,slw,"round");
		drawLine(-width/2,0,-width/2,height/2,c2,slw,"round");
		drawCurve(-width/2,height/2,width/2,height/2,0,0,c2,slw,"round");
	},
	function(width,height,c2) {
		game.moveTo(0,-height/2);
		game.lineTo(width/2,height/2);
		game.lineTo(0,height/4);
		game.lineTo(-width/2,height/2);
		game.lineTo(0,-height/2);
		game.fill();
		drawLine(0,-height/2,width/2,height/2,c2,slw,"round");
		drawLine(width/2,height/2,0,height/4,c2,slw,"round");
		drawLine(0,height/4,-width/2,height/2,c2,slw,"round");
		drawLine(-width/2,height/2,0,-height/2,c2,slw,"round");
	},
	function(width,height,c2) {
		game.moveTo(width/4,-height/2);
		game.lineTo(width/2,height/2);
		game.quadraticCurveTo(width/4,height/4,0,height/2);
		game.quadraticCurveTo(-width/4,height/4,-width/2,height/2);
		game.lineTo(-width/4,-height/2);
		game.quadraticCurveTo(0,-height/1.5,width/4,-height/2);
		game.fill();
		drawLine(width/4,-height/2,width/2,height/2,c2,slw,"round");
		drawCurve(width/2,height/2,0,height/2,width/4,height/4,c2,slw,"round");
		drawCurve(0,height/2,-width/2,height/2,-width/4,height/4,c2,slw,"round");
		drawLine(-width/2,height/2,-width/4,-height/2,c2,slw,"round");
		drawCurve(-width/4,-height/2,width/4,-height/2,0,-height/1.5,c2,slw,"round");
	},
	function(width,height,c2) {
		game.moveTo(0,-height/2);
		game.lineTo(width/2,0);
		game.lineTo(width/2,height/2);
		game.lineTo(-width/2,height/2);
		game.lineTo(-width/2,0);
		game.fill();
		drawLine(0,-height/2,width/2,0,c2,slw,"round");
		drawLine(0,-height/2,-width/2,0,c2,slw,"round");
		drawLine(width/2,0,width/2,height/2,c2,slw,"round");
		drawLine(-width/2,0,-width/2,height/2,c2,slw,"round");
		drawLine(-width/2,height/2,width/2,height/2,c2,slw,"round");
	}
];

//Function: draw ship (s = shape)
var drawShip = function(x,y,width,height,r,s,c1,c2) {
	game.fillStyle = c1;
	game.save();
	game.beginPath();
	game.translate(x+width/2*cs,y+height/2*cs);
	game.rotate(r+Math.PI*1.5);
	shapes[s](width*cs,height*cs,c2);
	//game.fill();
	game.restore();
};

//Function: draw circle
var drawCircle = function(x,y,r,c1,c2,lw) {
	if (c2 && lw) {
		game.lineWidth = lw;
		game.strokeStyle = c2;
	};
	game.fillStyle = c1;
	game.beginPath();
	game.arc(x,y,r,0,2*Math.PI);
	game.closePath();
	game.fill();
	if (c2 && lw) {
		game.stroke();
	};
};

//Function: draw line
var drawLine = function(x1,y1,x2,y2,c,lw,b) {
	game.lineWidth = lw;
	game.lineCap = b;
	game.strokeStyle = c;
	game.beginPath();
	game.moveTo(x1,y1);
	game.lineTo(x2,y2);
	game.stroke();
	game.closePath();
};

//Function: draw curve
var drawCurve = function(x1,y1,x2,y2,xc,yc,c,lw,b) {
	game.lineWidth = lw;
	game.lineCap = b;
	game.strokeStyle = c;
	game.beginPath();
	game.moveTo(x1,y1);
	game.quadraticCurveTo(xc,yc,x2,y2);
	game.stroke();
	game.closePath();
};

//Function: draw rectangle
var drawRect = function(x,y,width,height,c,a) {
	game.fillStyle = c;
	game.globalAlpha = a;
	game.fillRect(x,y,width,height);
	game.globalAlpha = 1;
};

//Function: draw text
var drawText = function(t,s,a,x,y,c) {
	game.fillStyle = c;
	game.textAlign = a;
	game.font = s;
	game.fillText(t,x,y);
};

var drawHealthBar = function(x,y,p,width,height) {
	//Health bar
	p *= 70;
	color = "#00FF00";
	if (p < 30) {
		color = "#FF0000";
	};
	//drawLine(cx(o.x)+p*0.5,cy(o.y)+classes[c].height+30,cx(o.x)+classes[c].width-p*0.5,cy(o.y)+classes[c].height+30,color,12,"round");
	//drawLine(cx(o.x)+classes[c].width/2-70,cy(o.y)+classes[c].height+30,cx(o.x)+classes[c].width/2+70,cy(o.y)+classes[c].height+30,"#CCCCCC",12,"round");
	drawLine(cx(x)+width/2*cs-p*cs,cy(y)+height*cs+30*cs,cx(x)+width/2*cs+p*cs,cy(y)+height*cs+30*cs,color,slw*1.2,"round");
};

//Function: render asteroid
var renderAst = function(o) {
	//The actual shape
	drawCircle(cx(o.x),cy(o.y),o.r*cs-slw/2,"#999999","#888888",slw);
	//Calculate hp bar and color
	drawHealthBar(o.x-o.r/2,o.y,o.hp,o.r,o.r);
};

lerpTrue = true;
var updateLerp = function(o,r) {
	li = lerpxy(o.x,o.y,o.tx,o.ty,r);
	if (lerpTrue) {
		o.x = li[0];
		o.y = li[1];
	} else {
		o.x = o.tx;
		o.y = o.ty;
	};
};

//Function: render player
var renderPlayer = function(o,s) {
	//If self...
	if (s) {
		c = cls;
		r = rotation;
		n = name;
	} else {
		//Else...
		c = perm[o.id].cls;
		r = o.a;
		n = perm[o.id].name;
	};
	//If not invisible, draw ship
	if (!o.invis) {
		drawShip(cx(o.x),cy(o.y),classes[c].width,classes[c].height,r,c,classes[c].c1,classes[c].c2);
	};
	//If shield, draw shield
	if (o.shield) {
		game.globalAlpha = 0.2;
		drawCircle(cx(o.x+classes[c].width/2),cy(o.y+classes[c].height/2),classes[c].height+slw,"#000000");
		game.globalAlpha = 1;
	};
	//Health bar
	/*p = o.hp*70;
	color = "#00FF00";
	if (p < 30) {
		color = "#FF0000";
	};
	//drawLine(cx(o.x)+p*0.5,cy(o.y)+classes[c].height+30,cx(o.x)+classes[c].width-p*0.5,cy(o.y)+classes[c].height+30,color,12,"round");
	//drawLine(cx(o.x)+classes[c].width/2-70,cy(o.y)+classes[c].height+30,cx(o.x)+classes[c].width/2+70,cy(o.y)+classes[c].height+30,"#CCCCCC",12,"round");
	drawLine(cx(o.x)+classes[c].width/2*cs-p*cs,cy(o.y)+classes[c].height*cs+30*cs,cx(o.x)+classes[c].width/2*cs+p*cs,cy(o.y)+classes[c].height*cs+30*cs,color,slw*1.2,"round");*/
	drawHealthBar(o.x,o.y,o.hp,classes[c].width,classes[c].height);
	//Alias (name)
	drawText(n,"bold "+20*cs+"px Arial","center",cx(o.x)+classes[c].width/2*cs,cy(o.y)+classes[c].height*cs+60*cs,"#000000");
};

//Function: find in array by ID
var findById = function(a,id) {
	return a.indexOf(a.find(function(o){return o.id == id;}));
};

var notify = function(t) {
	bigNotification.innerHTML = t;
	bigNotification.style.bottom = "0px";
	setTimeout(function() {
		bigNotification.style.bottom = "-"+200*cs+"px";
	},2000);
};

var dev = function(m) {
	hudElement.innerHTML += "<input type=\"text\" id=\"dev\" style=\"position:fixed;top:100px;\">";
	devElement = document.getElementById("dev");
	devElement.onkeyup = function(e) {
		if (e.keyCode == 13) {
			socket.emit("dev",devElement.value);
			devElement.value = "";
		};
	};
};

//Function: render bullet
var renderBullet = function(o) {
	game.globalAlpha = o.alpha;
	drawCircle(cx(o.x),cy(o.y),o.r*cs,classes[o.cls].c1,classes[o.cls].c2,slw);
	game.globalAlpha = 1;
};

//Function update position of bullet (o)
var updateBullet = function(o) {
	m = (Date.now()-o.lastUpdate)/5;
	if (dfp(o.ox,o.oy,o.x,o.y) > o.range) {
		//bullets.splice(bullets.indexOf(o),1);
		o.dying = 1;
	};
	//Calculate new position
	point = pfa(o.x,o.y,o.angle,o.speed*m);
	o.x = point[0];
	o.y = point[1];
	//Wall bounce
	f = 0;
	if (o.x < 0) {
		o.x = 0;
		f = 1;
	};
	if (o.x > ww) {
		o.x = ww;
		f = 1;
	};
	if (o.y < 0) {
		o.y = 0;
		f = 2;
	};
	if (o.y > wh) {
		o.y = wh;
		f = 2;
	};
	if (f > 0) {
		if (f == 1) {
			o.angle = Math.PI-o.angle;
		} else {
			o.angle = 0-o.angle;
		};
	};
	if (o.dying) {
		o.alpha -= 0.2;
		if (o.alpha < 0) {
			bullets.splice(bullets.indexOf(o),1);
		};
	};
	o.lastUpdate = Date.now();
};

var background = function() {
	//Draw grid stuff
	tx = (cpx/gridWidth-Math.floor(cpx/gridWidth))*gridWidth*cs;
	ty = (cpy/gridWidth-Math.floor(cpy/gridWidth))*gridWidth*cs;
	/*for (i=0;i<(w/gridWidth)+1;i++) {
		ttx = (i*gridWidth)-tx;
		drawLine(ttx+shakeX,0,ttx+shakeX,h,"#A3A3A3",1,"butt");
	};
	for (i=0;i<(h/gridWidth)+1;i++) {
		tty = (i*gridWidth)-ty;
		drawLine(0,tty+shakeY,w,tty+shakeY,"#A3A3A3",1,"butt");
	};*/
	ox = cpx;
	oy = cpy;
	for (i=0;i<(w/gridWidth/cs)+2;i++) {
		drawLine(cx(i*gridWidth+ox)-tx-w/2,0,cx(i*gridWidth+ox)-tx-w/2,h,"#d9d9d9",1*cs,"butt");
		//drawLine(cx(i*gridWidth+ox)-tx,0,cx(i*gridWidth+ox)-tx,h,"#A3A3A3",1,"butt");
	};
	for (i=0;i<(h/gridWidth/cs)+2;i++) {
		drawLine(0,cy(i*gridWidth+oy)-ty-h/2,w,cy(i*gridWidth+oy)-ty-h/2,"#d9d9d9",1*cs,"butt");
	};
	drawRect(cx(-w),cy(0),w*cs,wh*cs,"#000000",0.2);
	drawRect(cx(ww),cy(0),w*cs,wh*cs,"#000000",0.2);
	drawRect(cx(-w),cy(-h),(ww+w*2)*cs,h*cs,"#000000",0.2);
	drawRect(cx(-w),cy(wh),(ww+w*2)*cs,h*cs,"#000000",0.2);
};

var updateMyShip = function() {
	name = aliasBox.value;
	if (classBox.value == "-1") {
		cls = 0;
	} else {
		cls = Number(classBox.value);
	};
	if (abilityBox.value == "-1") {
		ability = 0;
	} else {
		ability = Number(abilityBox.value);
	};
	if (name == "") {
		myShipHeading.innerHTML = "My Ship";
	} else {
		myShipHeading.innerHTML = tsc(name)+"'s Ship";
	};
	myShipClass.innerHTML = menuClasses[cls].name;
	html = "<table>";
	for (i=0;i<menuClasses[cls].stats.length;i++) {
		html += "<tr><td style=\"width:1%\"><b>"+menuClassesStats[i]+"</b></td><td><div class=\"msbar\" style=\"width:"+(menuClasses[cls].stats[i]*20)+"%\"></div></td></tr>";
		//if (i<menuClasses[cls].stats.length) myShipStats.innerHTML += "<br>";
	};
	html += "</table>";
	myShipStats.innerHTML = html;
	myShipAbility.innerHTML = abilityNames[ability];
};

//Set points and score display to current
var updatePoints = function() {
	pointsBox.innerHTML = /*"Points: "+player.points+"<br>*/"Score: "+player.score;
	noun = "points";
	if (player.points == 1) noun = "point";
	document.getElementById("upoints").innerHTML = player.points+" <span style=\"font-weight:500\">"+noun+"</span>";
};

//Set the color of each upgrade cost element (red for can't afford)
var updateUpgrades = function() {
	for (j=0;j<upgrades.length;j++) {
		p = upgrades[j].level*upgradeMult-upgradeMult;
		document.getElementById("ub"+j).style.width = p+"%";
		if (upgrades[j].level*upgradeMult > player.points && upgrades[j].level < 11) {
			document.getElementById("uc"+j).style.color = "#FF0000";
		} else {
			document.getElementById("uc"+j).style.color = "#FFFFFF";
		};
	};
};

//On clicking an upgrade, change storage stuff, update stuff and emit stuff
var upgradeClick = function(e) {
	id = e.target.parentNode.getAttribute("id");
	if (id && id.length == 2) {
		id = Number(id.substr(1,1));
		if (upgrades[id].level*upgradeMult <= player.points && upgrades[id].level < 11) {
			socket.emit("upgrade",id);
			player.points -= upgrades[id].level*upgradeMult;
			upgrades[id].level++;
			if (upgrades[id].level > 10) {
				document.getElementById("uc"+id).innerHTML = "max";
			} else {
				document.getElementById("uc"+id).innerHTML = upgrades[id].level*upgradeMult;
			};
			updateUpgrades();
			updatePoints();
		};
	};
};

//Create upgrade elements
var setupUpgrades = function() {
	upgradesContainer.innerHTML = "<div class=\"upgrade round\" style=\"height:39px;cursor:default;\"><div id=\"uheading\" class=\"baloo\">Upgrades</div><div id=\"upoints\">10</div></div>";
	for (i=0;i<upgrades.length;i++) {
		upgradesContainer.innerHTML += "<div class=\"upgrade round\" id=\"u"+i+"\"><div class=\"uinner\">"+upgrades[i].name+"</div><div id=\"uc"+i+"\"class=\"ucost\">"+upgradeMult+"</div><div class=\"ubar round\" id=\"ub"+i+"\"></div></div>";//<div class=\"ubar round\"></div>
		upgradeElements.push(document.getElementById("u"+i));
		upgradesContainer.onclick = upgradeClick;
	};
	updateUpgrades();
};

var setupNetwork = function() {
	//Socket.socket on "ready" (spawned in)
	socket.on("ready",function(n,p) {
		//Ready is true
		ready = 1;
		//Set name
		name = n;
		player.points = p;
		//Hide menu (with fancy transition)
		menuElement.style.opacity = "0";
		menuElement.style.transform = "scale(1.5)";
		setTimeout(function(){menuElement.style.visibility = "hidden";},250);
		//Show HUD (heads up display)
		hudElement.style.opacity = "1";
		//Set name of own ability
		abilityNameElement.innerHTML = abilityNames[ability];
		//Update and setup stuff
		setupUpgrades();
		updatePoints();
	});

	//Socket.socket on "die" (player destroyed)
	var die = function(d) {
		//Basically reverse of "ready"
		ready = 0;
		for (i=0;i<otherCards.length;i++) {
			otherCards[i].style.display = "none";
		};
		menuElement.style.visibility = "visible";
		menuElement.style.opacity = "1";
		menuElement.style.transform = "scale(1)";
		hudElement.style.opacity = "0";
		mainContainer.style.display = "none";
		if (d) {
			statsHeading.innerHTML = "Disconnected";
		} else {
			statsHeading.innerHTML = "Game over";
		};
		statsContainer.style.display = "block";
		statElements[0].innerHTML = player.score;
		statElements[1].innerHTML = shipsDestroyed;
		d = new Date(Date.now()-timeStarted);
		statElements[2].innerHTML = d.getMinutes()+":"+d.getSeconds();
		statElements[3].innerHTML = topPosition;
		statsTwitter.setAttribute("href","https://twitter.com/intent/tweet?text=Just%20played%20Trigon.io%3A%20survived%20for%20"+d.getMinutes()+"m%20"+d.getSeconds()+"s%20and%20got%20a%20score%20of%20"+player.score+".%20Can%20you%20beat%20me%3F%20http%3A%2F%2Ftrigon.io%20%23trigonio%20%23trigon.io&20%23iONINJA&via=io_ninja");
		//upgradesContainer.style.visibility = "hidden";
		//pointsBox.style.visibility = "hidden";
		player.score = 0;
		for (i=0;i<upgrades.length;i++) {
			upgrades[i].level = 1;
		};
		updateMyShip();
	};

	//Set handler
	socket.on("die",die);

	//Socket.socket on "self" (spawning of self)
	socket.on("self",function(object) {
		player = {id:object.id,x:object.x,y:object.y,tx:object.x,ty:object.y,points:0,score:0};
	});

	//Socket.socket on "player" (a new player being spawned in)
	socket.on("player",function(object) {
		perm[object.id] = {name:object.name,cls:object.cls};
	});

	//Socket.socket on "deleteAsteroid" (asteroid destroyed)
	socket.on("deleteAsteroid",function(id) {
		//shake(800,15);
	});

	//Socket.socket on "death" (death of another player)
	socket.on("notify",function(t) {
		notify(t);
	});

	//Socket.socket on "fire" (spawn bullet)
	socket.on("fire",function(owner,id,x,y,a,s,range,r,c) {
		bullets.push({id:id,owner:owner,x:x,y:y,ox:x,oy:y,angle:a,speed:s,range:range,lastUpdate:Date.now(),r:r,cls:c,dying:0,alpha:1});
	});

	//Socket.socket on "deleteBullet" (bullet removed)
	socket.on("deleteBullet",function(id) {
		for (i in bullets) {
			if (bullets[i].id == id) {
				//bullets.splice(i,1);
				bullets[i].dying = 1;
			};
		};
	});

	//Socket.socket on "points" (update own points and score)
	socket.on("points",function(p,s,w) {
		d = p-player.points;
		if (d == 1) {
			notify("+"+d+" point");
		} else {
			notify("+"+d+" points");
		};
		player.points = p;
		player.score = s;
		if (w) shipsDestroyed++;
		updatePoints();
		updateUpgrades();
	});

	//Socket.socket on "board" (update leaderboard)
	socket.on("board",function(a) {
		html = "";
		for (i=0;i<a.length;i+=3) {
			bold = "";
			pos = Math.floor(i/3)+1;
			if (a[i] == player.id) {
				if (topPosition > pos) topPosition = pos;
				bold = " style=\"font-weight:bold;\"";
			};
			html += "<tr"+bold+"><td class=\"bname\">"+pos+". "+a[i+1]+"</td><td class=\"bscore\">"+a[i+2]+"</td></tr>";
		};
		boardElement.innerHTML = html;
	});

	//Socket.socket on "use" (own ability used)
	socket.on("use",function(t) {
		//Cooldown animation based on t (time)
		abilityFill.style.opacity = "1";
		abilityFill.style.transition = "height "+t+"ms, opacity 1s";
		abilityFill.style.height = "120px";
		setTimeout(function() {
			abilityFill.style.transition = "height 0ms, opacity 1s";
			abilityFill.style.opacity = "0";
			abilityFill.style.height = "0px";
		},t);
	});

	socket.on("shake",function() {
		//shake(500,10);
	});

	//Socket.socket on "update" (objects updated)
	socket.on("update",function(ps,pa,aa,pl) {
		serverDelta = Date.now()-serverLast;
		serverLast = Date.now();
		if (serverDelta < 40) serverDelta = 40;
		//player = {id:ps[0],x:ps[1],y:ps[2],a:ps[3],hp:ps[4],points:player.points,score:player.score,shield:ps[5],invis:ps[6]};
		player.tx = ps[0];
		player.ty = ps[1];
		if (ps.length > 2) {
			player.hp = ps[2];
			player.shield = ps[3];
			player.invis = ps[4];
		};
		//Wipe players array
		//players = [];
		//ast = [];
		//If own player, set player variable
		//Else, add to players array
		pids = [];
		for (i=0;i<pa.length;i+=7) {
			pid = findById(players,pa[i]);
			pids.push(pa[i]);
			if (pid > -1) {
				players[pid].tx = pa[i+1];
				players[pid].ty = pa[i+2];
				players[pid].a = pa[i+3];
				players[pid].hp = pa[i+4];
				players[pid].shield = pa[i+5];
				players[pid].invis = pa[i+6];
			} else {
				players.push({id:pa[i],x:pa[i+1],tx:pa[i+1],y:pa[i+2],ty:pa[i+2],a:pa[i+3],hp:pa[i+4],shield:pa[i+5],invis:pa[i+6]});
			};
		};
		for (i=0;i<players.length;i++) {
			if (pids.indexOf(players[i].id) < 0) {
				players.splice(i,1);
			};
		};
		//Update current asteroid in ast array
		//for (i=0;i<aa.length;i+=5) {
		//	ast.push({id:aa[i],x:aa[i+1],y:aa[i+2],r:aa[i+3],hp:aa[i+4]});
		//};
		aids = [];
		for (i=0;i<aa.length;i+=5) {
			aid = findById(ast,aa[i]);
			aids.push(aa[i]);
			if (aid > -1) {
				ast[aid].tx = aa[i+1];
				ast[aid].ty = aa[i+2];
				ast[aid].r = aa[i+3];
				ast[aid].hp = aa[i+4];
			} else {
				ast.push({id:aa[i],x:aa[i+1],tx:aa[i+1],y:aa[i+2],ty:aa[i+2],r:aa[i+3],hp:aa[i+4]});
			};
		};
		for (i=0;i<ast.length;i++) {
			if (aids.indexOf(ast[i].id) < 0) {
				ast.splice(i,1);
			};
		};
		if (pl) {
			leader.x = pl[0];
			leader.y = pl[1];
		} else {
			leader.x = null;
			leader.y = null;
		};
	});

	//Socket.socket on "connect" (wipe players and asteroids)
	socket.on("connect",function() {
		players = [];
		ast = [];
		connectingStatus.innerHTML = "";
		connectingStatus.style["margin-bottom"] = "0px";
		serverFound = 1;
		console.log("Connected!");
		console.log("Network transport type: "+socket.io.engine.transport.name);
	});

	//Socket.socket on "disconnect" (die - 1 meaning disconnected)
	socket.on("disconnect",function() {
		connectingStatus.innerHTML = "Connecting...";
		connectingStatus.style["margin-bottom"] = "10px";
		if (ready) die(1);
		serverFound = 0;
		console.log("Disconnected!");
	});
};

var findServer = function() {
	console.log("Finding a server...");
	serverFound = 0;
	for (i=0;i<servers.length;i++) {
		x = new XMLHttpRequest();
		x.onreadystatechange = function() {
			if (!serverFound && this.readyState == 4 && this.status == 200) {
				if (x.responseText != "0") {	
					u = x.responseURL.split("/")[2].split(":")[0];
					serverFound = 1;
					socket = io.connect("http://"+u+":"+x.responseText+"/",{transports: ["websocket"], upgrade: false});
					setupNetwork();
					serverLast = Date.now();
					console.log("Connecting to http://"+u+":"+x.responseText+"/...");
				};
			};
		};
		x.open("GET","http://"+servers[i]+":3000/ping",true);
		x.send();
	};
	setTimeout(serverTimeout,2000);
};

var serverTimeout = function() {
	if (!serverFound) findServer();
};

//On mousedown, emit
var mouseDown = function() {
	if (ready) {
		//setTimeout(function(){socket.emit("mousedown",1);},200);
		socket.emit("mousedown",1);
	};
};

//On mouseup, emit
var mouseUp = function() {
	if (ready) {
		//setTimeout(function(){socket.emit("mousedown",0);},200);
		socket.emit("mousedown",0);
	};
};

//On mousemove, emit
var mouseMove = function(e) {
	if (e.touches) {
		x = e.touches[0].pageX;
		y = e.touches[0].pageY;
	} else {
		x = e.pageX;
		y = e.pageY;
	};
	rotation = afp(player.x-cpx+w/2,player.y-cpy+h/2,x,y);
	if (ready) {
		//setTimeout(function(){socket.emit("mousemove",rotation);},200);
		socket.emit("mousemove",rotation);
	};
};
//Handlers
canvas.onmousedown = mouseDown;
canvas.onmouseup = mouseUp;
document.onmousemove = mouseMove;
window.addEventListener("touchstart",mouseDown,false);
window.addEventListener("touchend",mouseUp,false);
window.addEventListener("touchcancel",mouseUp,false);
window.addEventListener("touchmove",mouseMove,false);

aliasBox.onchange = updateMyShip;
classBox.onchange = updateMyShip;
abilityBox.onchange = updateMyShip;

//On keydown...
document.onkeydown = function(e) {
	if (ready) {
		//If spacebar, emit
		if (e.keyCode == 32) {
			if (!spaceJustDown) {
				socket.emit("spacedown",1);
				spaceJustDown = 1;
			};
		};
	};
};

//On keyup...
document.onkeyup = function(e) {
	if (ready) {
		//If spacebar, emit
		if (e.keyCode == 32) {
			socket.emit("spacedown",0);
			spaceJustDown = 0;
		};
	};
};

//On play button being clicked...
var play = function() {
	if (socket) {
		//Set class and ability based on dropdown vlaues
		if (classBox.value == "-1") {
			cls = 0;
		} else {
			cls = Number(classBox.value);
		};
		if (abilityBox.value == "-1") {
			ability = 0;
		} else {
			ability = Number(abilityBox.value);
		};
		//Store new values
		localStorage.alias = aliasBox.value;
		localStorage.cls = classBox.value;
		localStorage.ability = ability;
		timeStarted = Date.now();
		shipsDestroyed = 0;
		topPosition = 10;
		if (cls == 5) {
			upgradeMult = 8;
		};
		//Emit!
		socket.emit("ready",aliasBox.value,cls,ability);
	};
};

playButton.onclick = play;
aliasBox.onkeyup = function(e) {
	if (e.keyCode == 13) {
		play();
	};
};

logoElement.onclick = function() {
	profilesElement.style["pointer-events"] = profilesElement.style["pointer-events"] == "none" ? "auto" : "none";
	profilesElement.style["margin-top"] = profilesElement.style["margin-top"] == "-80px" ? "-40px" : "-80px";
	profilesElement.style["margin-bottom"] = profilesElement.style["margin-bottom"] == "0px" ? "30px" : "0px";
	profilesElement.style.opacity = profilesElement.style.opacity == "0" ? "1" : "0";
};

continueButton.onclick = function() {
	statsContainer.style.display = "none";
	mainContainer.style.display = "block";
	for (i=0;i<otherCards.length;i++) {
		otherCards[i].style.display = "block";
	};
};

//Render and update frame
var update = function() {
	//Clear window
	//game.clearRect(0,0,w,h);
	game.fillStyle = "#FFFFFF";
	game.fillRect(0,0,w,h);
	//if (csr) {
	//	csr = lerp(csr,(Date.now()-clientLast)/serverDelta,0.5);
	//} else {
	cd = Date.now()-clientLast;
	if (cd > 15) cd = 15;
		csr = cd/serverDelta;
	//};
	updateCamera(0.2);
	//updateCamera();
	if (shaking) {
		updateShake();
	};
	//Draw background
	//Render asteroids
	background();
	for (i=0;i<ast.length;i++) {
		updateLerp(ast[i],csr);
		renderAst(ast[i]);
	};
	//Update bullets
	for (i=0;i<bullets.length;i++) {
		updateBullet(bullets[i]);
	};
	//Render bullets
	for (i=0;i<bullets.length;i++) {
		renderBullet(bullets[i]);
	};
	//Render players (if visible)
	for (i=0;i<players.length;i++) {
		updateLerp(players[i],csr);
		if (!players[i].invis) {
			renderPlayer(players[i],0);
		};
	};
	//If ready, render player
	if (ready) {
		updateLerp(player,csr);
		rotation = afp(player.x-cpx+w/2,player.y-cpy+h/2,x,y);
		renderPlayer(player,1);
	};
	clientLast = Date.now();
	//hud();
	//Set to call update on next frame
	mini.clearRect(0,0,100,100);
	mini.fillStyle = "#FFFFFF";
	mini.beginPath();
	mini.arc(player.x/ww*(mms-6)+3,player.y/wh*(mms-6)+3,3,0,2*Math.PI);
	mini.closePath();
	mini.fill();
	if (leader.x) {
		mini.fillStyle = "#FF0000";
		mini.beginPath();
		mini.arc(leader.x/ww*(mms-6)+3,leader.y/wh*(mms-6)+3,3,0,2*Math.PI);
		mini.closePath();
		mini.fill();
	};
	frame(update);
};

//Set animation frame caller
var frame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame;
//First update
update();

findServer();

//Get storage values
if (localStorage.alias) {
	name = localStorage.alias;
	cls = localStorage.cls;
	ability = localStorage.ability;
	aliasBox.value = name;
	classBox.value = cls;
	abilityBox.value = ability;
	if (localStorage.unlocked == "1") {
		unlockClass(0);
	};
} else {
	name = "";
	cls = 0;
	ability = 0;
	localStorage.alias = "";
	localStorage.cls = "0";
	localStorage.ability = "0";
	localStorage.unlocked = "0";
};
updateMyShip();

for (i=0;i<shareButtons.length;i++) {
	shareButtons[i].onclick = function() {
		unlockClass(1);
	};
};

//Focus alias (name) box
aliasBox.focus();