var io = require("socket.io").listen(3000);

var players = {};
var bullets = [];

var w = 3000;
var h = 3000;

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

//Function: return random number in range
var random = function(r) {
	return Math.floor(Math.random()*r);
};

var collision = function(x1,y1,w1,h1,x2,y2,w2,h2) {
	return !(x2 > x1+w1 || x2+w2 < x1 || y2 > y1+h1 || y2+h2 < y1);
};

var getVisible = function(x,y,d) {
	a = [];
	for (pid in players) {
		if (dfp(x,y,players[pid].x,players[pid].y) < d) {
			a.push(pid);
		};
	};
	return a;
};

var wallBounce = function(o) {
	if (o.x < 0) {
		o.x = 0;
		o.vx *= -0.5;
	};
	if (o.x > w) {
		o.x = w;
		o.vx *= -0.5;
	};
	if (o.y < 0) {
		o.y = 0;
		o.vy *= -0.5;
	};
	if (o.y > h) {
		o.y = h;
		o.vy *= -0.5;
	};
};

var Player = function(id,client) {
	this.io = client;
	this.id = id;
	this.name = "Anonymous";
	this.alive = false;
	this.stats = {
		reloadTime: 200,
		bulletSpeed: 2,
		bulletLife: 5000,
		boostPower: 2,
		friction: 0.02,
		maxHealth: 100,
		width: 60,
		height: 80
	};
	this.x = w/2;
	this.y = h/2;
	this.visible = [];
	this.cls = 0;
	setInterval((this.checkVisible).bind(this),1000);
	this.io.on("mousemove",(this.mouseMoveEvent).bind(this));
	this.io.on("mousedown",(this.mouseDownEvent).bind(this));
	this.io.on("ready",(this.ready).bind(this));
	this.io.emit("self",{id:this.id,x:this.x,y:this.y});
};

Player.prototype.ready = function(n) {
	this.alive = true;
	this.name = n;
	this.reset();
	this.io.emit("ready",this.name);
};

Player.prototype.reset = function() {	
	this.x = random(w);
	this.y = random(h);
	this.mouseDown = 0;
	this.rotation = 0;
	this.lastFired = 0;
	this.vx = 0;
	this.vy = 0;
	this.cls = 0;
	this.visible = [];
	this.hp = this.stats.maxHealth;
	this.checkVisible();
};

Player.prototype.emit = function() {
	pa = [];
	for (i in this.visible) {
		id = this.visible[i];
		if (players[id].alive) {
			pa.push({id:id,x:players[id].x,y:players[id].y,a:players[id].rotation,hp:players[id].hp});
		};
	};
	this.io.emit("update",pa);
};

Player.prototype.checkVisible = function() {
	for (id in players) {
		if (dfp(this.x,this.y,players[id].x,players[id].y) < 1000/* && id != this.id*/) {
			if (this.visible.indexOf(id) < 0) {
				this.visible.push(id);
				if (id != this.id) {
					this.io.emit("player",{id:id,x:players[id].x,y:players[id].y,name:players[id].name,hp:players[id].hp,cls:players[id].cls});
				};
			};
		};
	};
};

Player.prototype.fire = function() {
	bid = Date.now();
	bullets.push(new Bullet(this.id,bid,this.x+this.stats.width/2,this.y+this.stats.height/2,this.rotation,this.stats.bulletSpeed,this.stats.bulletLife));
	velocity = pfa(0,0,this.rotation+Math.PI,this.stats.boostPower);
	this.vx += velocity[0];
	this.vy += velocity[1];
	a = getVisible(this.x+this.stats.width/2,this.y+this.stats.height/2,1000);
	for (j in a) {
		players[a[j]].io.emit("fire",this.id,bid,this.x+this.stats.width/2,this.y+this.stats.height/2,this.rotation,this.stats.bulletSpeed,this.stats.bulletLife);
	};
};

Player.prototype.die = function() {
	this.alive = false;
	this.reset();
	this.io.broadcast.emit("death",this.id);
	this.io.emit("die");
};

Player.prototype.update = function() {
	if (this.mouseDown) {
		if ((Date.now()-this.lastFired) > this.stats.reloadTime) {
			this.lastFired = Date.now();
			this.fire();
		};
	};
	if (this.vx < 0) {
		this.vx += this.stats.friction;
		if (this.vx > 0) this.vx = 0;
	} else {
		this.vx -= this.stats.friction;
		if (this.vx < 0) this.vx = 0;
	};
	if (this.vy < 0) {
		this.vy += this.stats.friction;
		if (this.vy > 0) this.vy = 0;
	} else {
		this.vy -= this.stats.friction;
		if (this.vy < 0) this.vy = 0;
	};
	this.x += this.vx;
	this.y += this.vy;
	for (i in bullets) {
		if (this.id != bullets[i].owner || (Date.now()-bullets[i].created) > 500) {
			if (collision(this.x,this.y,this.stats.width,this.stats.height,bullets[i].x-5,bullets[i].y-5,10,10)) {
				a = getVisible(bullets[i].x,bullets[i].y,100);
				for (j in a) {
					io.emit("deleteBullet",bullets[i].id);
				};
				vector = pfa(0,0,bullets[i].angle,bullets[i].speed*0.4);
				this.vx += vector[0];
				this.vy += vector[1];
				bullets.splice(i,1);
				this.hp -= 5;
				if (this.hp < 0) {
					this.die();
				};
			};
		};
	};
	wallBounce(this);
};

Player.prototype.mouseMoveEvent = function(a) {
	this.rotation = a;
};

Player.prototype.mouseDownEvent = function(v) {
	this.mouseDown = v;
};

var Bullet = function(owner,id,x,y,a,s,l) {
	this.id = id;
	this.owner = owner;
	this.x = x;
	this.y = y;
	this.angle = a;
	this.speed = s;
	this.created = Date.now();
	this.life = l;
	this.lastUpdate = this.created;
};

Bullet.prototype.update = function() {
	m = (Date.now()-this.lastUpdate)/5;
	if ((Date.now()-this.created) > this.life) {
		bullets.splice(bullets.indexOf(this),1);
	};
	point = pfa(this.x,this.y,this.angle,this.speed*m);
	this.x = point[0];
	this.y = point[1];
	f = 0;
	if (this.x < 0) {
		this.x = 0;
		f = 1;
	};
	if (this.x > w) {
		this.x = w;
		f = 1;
	};
	if (this.y < 0) {
		this.y = 0;
		f = 2;
	};
	if (this.y > h) {
		this.y = h;
		f = 2;
	};
	if (f > 0) {
		if (f == 1) {
			this.angle = Math.PI-this.angle;
		} else {
			this.angle = 0-this.angle;
		};
	};
	this.lastUpdate = Date.now();
};

var update = function() {
	for (id in players) {
		if (players[id].alive) {
			players[id].update();
		};
	};
	for (id in players) {
		players[id].emit();
	};
	for (i in bullets) {
		bullets[i].update();
	};
};

setInterval(update,5);

io.on("connection", function(client) {
	id = Date.now();
	players[id] = new Player(Date.now(),client);
});