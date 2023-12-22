/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 700;
const collisionCanvas = document.getElementById('collision-canvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = canvas.width;
collisionCanvas.height = canvas.height;

const canvasPosition = canvas.getBoundingClientRect();

let ravens = [];
let explosions = [];
let particles = [];
let score = 0;

/* Timing */
let timeBtwSpawns = 0;
let timeSinceSpawn = 0;
let lastFrameTime = 0;

class Raven {
    constructor() {
        /* Assets */
        this.image = new Image();
        this.image.src = 'raven.png';
        this.spriteWidth = 271;
        this.spriteHeight = 194;
        this.spriteScale = Math.random() * 0.3 + 0.4;
        this.width = this.spriteWidth * this.spriteScale;
        this.height = this.spriteHeight * this.spriteScale;

        /* Movement */
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = Math.random() * 3 + 2;

        /* Timing */
        this.timeSinceLastFrame = 0;
        this.frameRate = this.speed*2;
        this.period = 1000/this.frameRate;
        this.frame = 0;
        this.exists = true;

        /* Color collision */
        this.colorArray = [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)];
        this.color = 'rgb(' + this.colorArray[0] + ',' + this.colorArray[1] + ',' + this.colorArray[2] + ')';
    }

    update(deltaTime) {
        this.x -= this.speed;
        this.timeSinceLastFrame += deltaTime;

        if (this.timeSinceLastFrame > this.period) {
            this.frame++;
            this.timeSinceLastFrame = 0;
            if (this.speed > 3) {
                particles.push(new Particle(this.x+this.width*0.5, this.y+this.height*0.6, this.height*0.05))
            }
            if (this.frame > 5) {
                this.frame = 0;
            };
        };

        if (this.x < -this.width) {
            this.exists = false;
        };

        
    }

    draw() {
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.frame*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

class Explosion {
    constructor(x, y, size) {
        this.image = new Image();
        this.image.src = 'boom.png';
        this.sfx = new Audio();
        this.sfx.src = 'Ice attack 2.wav';
        this.sfx.play();
        this.spriteWidth = 200;
        this.spriteHeight = 179;

        this.x = x;
        this.y = y;
        this.size = size;

        this.frameInterval = 150;
        this.frame = 0;
        this.timeSinceLastFrame = 0;
        this.exists = true;
    }

    update(deltaTime) {
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame++;
            this.timeSinceLastFrame = 0;
        }

        if (this.frame > 5) {
            this.exists = false;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.size, this.size);
    }
}

class Particle {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.radius = size;

        this.alpha = 1;

        this.frameInterval = 150;
        this.timeSinceLastFrame = 0;
        this.exists = true;
    }

    update(deltaTime) {
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.radius += 2;
            this.alpha -= 0.1;
            this.timeSinceLastFrame = 0;
        }

        if (this.alpha < 0.02) {
            this.exists = false;
        }
        
    }
    
    draw() {
        ctx.fillStyle = 'rgba(50,50,50,'+this.alpha +')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

window.addEventListener('click', (e) => {
    const clickedPixel = collisionCtx.getImageData(e.x-canvasPosition.left, e.y-canvasPosition.top, 1, 1);
    const pixelColor = clickedPixel.data;
    ravens.forEach((e) => {
        if (e.colorArray[0] == pixelColor[0] && e.colorArray[1] == pixelColor[1] && e.colorArray[2] == pixelColor[2]) {
            e.exists = false;
            explosions.push(new Explosion(e.x, e.y, e.height));
            score++;
        }
    });
});

function drawScore() {
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText('Score: ' + score, 25, 40);
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 28, 43);
}

function updateGame(deltaTime) {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    collisionCtx.clearRect(0,0, canvas.width, canvas.height);
    [...particles, ...ravens, ...explosions].forEach((e) => {
        e.update(deltaTime);
        e.draw();
    });

    drawScore();

    timeSinceSpawn += deltaTime;

    if (timeSinceSpawn > timeBtwSpawns) {
        ravens.push(new Raven());
        timeBtwSpawns = Math.random() * 3000 + 500;
        timeSinceSpawn = 0;
        ravens.sort((a, b) => {
            return a.width - b.width;
        });
    }

    ravens = ravens.filter((e) => e.exists);
    explosions = explosions.filter((e) => e.exists);
    particles = particles.filter((e) => e.exists);
}

function animate(timestamp) {
    updateGame(timestamp - lastFrameTime);
    lastFrameTime = timestamp;
    requestAnimationFrame(animate);
}

animate(0);