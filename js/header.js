// polyfill for requestAnimationFrame
window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame || 
           window.oRequestAnimationFrame || 
           window.msRequestAnimationFrame ||
    function(callback, element) {
        window.setTimeout(callback, 1000 / 60);
        // 60 fps
    };
})();

// helpful for debugging with the console
function debug(object) {
    for (var prop in object) {
        console.log(prop + ': ' + object[prop]);
    }
}

// Utilize an Asset Manager to deal with image/sprite and sound loading (*New: cache update)
function AssetManager() {
    this.downloadQueue = [];
    this.soundsQueue = [];
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = {};
    this.sounds = {};
}

AssetManager.prototype.queueDownload = function(path) {
    this.downloadQueue.push(path);
}

AssetManager.prototype.queueSound = function(path) {
    this.soundsQueue.push(path);
}

AssetManager.prototype.downloadAll = function(callback) {
    if (this.downloadQueue.length === 0 && this.soundsQueue.length === 0) {
        calllback();
    }

    this.loadAllSounds(callback);

    this.downloadQueue.forEach(function(path) {
        var image = new Image(), that = this;
        // inside the callback function called from addEventListener, this refers to the image object
        image.addEventListener('load', function() {++that.successCount;
            if (that.isDone()) {
                callback();
            }
        }, false);
        image.addEventListener('error', function() {++that.errorCount;
            if (that.isDone()) {
                callback();
            }
        }, false);
        image.src = path;
        this.cache[path] = image;
    }, this);
}

AssetManager.prototype.loadAllSounds = function(callback) {
    this.soundsQueue.forEach(function(path) {
        var sound = new Audio(path), that = this;
        sound.preload = 'auto';
        // not sure whether this is necessary, but just in case...
        sound.addEventListener('canplay', function() {++that.successCount;
            if (that.isDone()) {
                callback();
            }
        }, false);
        sound.addEventListener('error', function() {++that.errorCount;
            if (that.isDone()) {
                callback();
            }
        }, false);
        this.sounds[path] = sound;
    }, this);
}

AssetManager.prototype.getAsset = function(path) {
    return this.cache[path];
}

AssetManager.prototype.getSound = function(path) {
    return this.sounds[path];
}

AssetManager.prototype.isDone = function() {
    return (this.successCount + this.errorCount === this.downloadQueue.length + this.soundsQueue.length);
}
// is there a new version of the manifest file available? If so, swap and refresh
AssetManager.prototype.updateAppCache = function() {
    var appCache = window.applicationCache;
    appCache.addEventListener('updateready', function() {
        appCache.swapCache();
        if (confirm('Manifest file has been modified. To fully update the cache for this page, a page refresh is required. Would you like to proceed?')) {
            window.location.reload();
        }
    }, false);

    appCache.addEventListener('error', function() {
        console.log('There was an error in updating the cache.');
    }, false);
}
function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.alive = true;
}

Entity.prototype.draw = function() {
    game.ctx.drawImage(this.image, this.x, this.y);
}

Entity.prototype.update = function() {
}
// AnimatedEntity class for ogres, skeletons, etc
function AnimatedEntity(game, x, y, width, height) {
    Entity.call(this, game, x, y);
    this.image = null;
    this.animation = null;
    this.width = width;
    this.height = height;
    // default values for the scaling
    this.scaleToX = 32;
    this.scaleToY = 32;
    
    this.lastUpdateTime = null;
    this.VELOCITY = 0; // in pixels per second (if applicable)
}

AnimatedEntity.prototype = new Entity();
AnimatedEntity.prototype.constructor = AnimatedEntity;

AnimatedEntity.prototype.draw = function(offsetX, offsetY) {
    if (this.animation) {
        this.animation.animate(this.game.ctx, this.game.now, this.x, this.y, this.scaleToX, this.scaleToY);
    } else {
        offsetX = typeof offsetX === 'undefined' ? 0 : offsetX;
        offsetY = typeof offsetY === 'undefined' ? 0 : offsetY;
        this.game.ctx.drawImage(this.image, offsetX, offsetY, this.width, this.height, this.x, this.y, this.scaleToX, this.scaleToY);
    }
}

AnimatedEntity.prototype.update = function() {
}

// check the proposed x and y bounds and see whether we can move there
AnimatedEntity.prototype.isPathClear = function(newX, newY) {
    // let's check the map array to see if it is free or not
    // switch statement in case I want to add more cases in the future
    debug({
        x: newX,
        y: newY,
        obj: this.getObjectAtPoint(newX, newY)
    });
    if (this.getObjectAtPoint(newX, newY) === 'F') {
        return true;
    } else {
        return false;
    }
     /*   case 'F': // free
            return true;
        default: 
            return false;
    }*/
    
}

AnimatedEntity.prototype.getObjectAtPoint = function(x, y) {
    // gets the corresponding tile number (i and j) for use in retrieval in map
    var i = Math.floor(x/this.game.dungeon.tileSize), 
        j = Math.floor(y/this.game.dungeon.tileSize); 
   /* debug({
        game: this.game,
        dungeon: this.game.dungeon,
        map: this.game.dungeon.map
    });*/
    return this.game.dungeon.map[i][j];
}

// Class for our game's hero!
function Hero(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/hero.png');
    // the offsets (offsetX and offsetY) are for image retrieval from the sprite, NOT the coordinates of the hero
    this.offsetX = 13 + width; // this is a constant, it won't be changed regardless of the direction
    this.offsetY = 518; // this will change depending on the direction; 518 is for the sprite in going in the upward direction (default)
    this.scaleToX = 38
    this.scaleToY = 42;
    this.VELOCITY = 100;
}

Hero.prototype = new AnimatedEntity();
Hero.prototype.constructor = Hero;

Hero.prototype.draw = function() {
    // slightly alter the offset and call the parent class' instance method
    AnimatedEntity.prototype.draw.call(this, this.offsetX - this.width, this.offsetY);
}

Hero.prototype.update = function() {
    // && (!this.game.previousKey || this.game.previousKey === this.game.key) 
    var delta = this.game.now ? this.getDeltaPosition() : 0,
        baseOffsetY = 518;
        
    switch(this.game.key) {
        case 38: // up
            this.y -= this.isPathClear(this.x, this.y - delta) ? delta : 0;
            console.log(this.isPathClear(this.x, this.y - delta));
            this.offsetY = baseOffsetY;
            break;
        case 40: // down
            this.y += this.isPathClear(this.x, this.y + delta + this.scaleToY) ? delta : 0;
            this.offsetY = baseOffsetY + this.height * 2;
            break;
        case 37: // left
            this.x -= this.isPathClear(this.x - delta, this.y) ? delta : 0;
            this.offsetY = baseOffsetY + this.height;
            break;
        case 39: // right
            this.x += this.isPathClear(this.x + delta + this.scaleToX*3/4, this.y) ? delta : 0;
            this.offsetY = baseOffsetY + this.height*3;
            break;         
        default:
            this.game.key = null;
            this.game.previousKey = null;
    }
    
    if(!this.game.key && this.animation) { // hero is currently animated, but no key is pressed => end animation
        this.animation = null;
    } else if((this.game.key && !this.animation) || (this.animation && this.game.key !== this.animation.key)) { // key is pressed, but no animation is present => start animation
        this.animation = new Animation(this.image, this.width, this.height, 8, 0.5, this.game.now, this.offsetX, this.offsetY);
        this.animation.key = this.game.key;
    } /*else if() { // key is pressed, and an animation is going on => TRICKY
        // Normally, we don't have to do anything here, as the animation instance takes care of the animating
        // but, what if the user was pressing one arrow key to go one direction, and then *concurrently* pressed
        // another key? Well, the direction changes accordingly, since that's the last button pressed, but we have
        // to make sure that the animation swaps accordingly too
        // override current animation
        console.log('overriding current animation');
        this.animation = new Animation(ASSET_MANAGER.getAsset('images/hero.png'), this.width, this.height, 8, 0.5, this.game.now, this.offsetX, this.offsetY);
    }*/
   
    this.lastUpdateTime = this.game.now;
}

Hero.prototype.getDeltaPosition = function() {
    var elapsedTime = (this.game.now - this.lastUpdateTime);
    return elapsedTime > 30 ? 0 : Math.round(elapsedTime / 1000 * this.VELOCITY); // to avoid wormholes
}

function Ogre(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/monsters.png');
    // width: 32, height: 48, frames: 3, timePerAnimation: 0.75 seconds, offsetX: 0, offsetY: 23
    this.offsetX = 0;
    this.offsetY = 23;
    this.scaleToX = 32;
    this.scaleToY = 38;
    this.VELOCITY = 20;
}

// set AnimatedEntity as parent class
Ogre.prototype = new AnimatedEntity();
Ogre.prototype.constructor = Ogre;

// override instance method of the parent class
Ogre.prototype.draw = function() {
    AnimatedEntity.prototype.draw.call(this, this.offsetX, this.offsetY);
}

Ogre.prototype.update = function() {
    // HACK: skip over the standing sprite during the walk
    /*  var index = this.animation.getFrameIndex();
     if(isNaN(index)) {
     this.animation.offsetX = 0;
     } else {
     this.animation.offsetX = index !== this.animation.frames - 1 ? this.animation.width: -this.animation.width;
     }*/
    if(!this.animation && this.canAttackHero() && this.game.now) {
        this.animation = new Animation(this.image, this.width, 
                                       this.height, 3, 0.75, this.game.now, this.offsetX, this.offsetY);
    } else {
       // console.log(this);
    }

    AnimatedEntity.prototype.update.call(this);
}

Ogre.prototype.canAttackHero = function() {
    return true;
}

function Skeleton(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/monsters.png');
    // width: 32, height: 48, frames: 3, timePerAnimation: 0.75 seconds, offsetX: 0, offsetY: 23
    this.offsetX = 98;
    this.offsetY = 13;
    this.scaleToX = 32;
    this.scaleToY = 38;
    this.VELOCITY = 20;
}

// set AnimatedEntity as parent class
Skeleton.prototype = new AnimatedEntity();
Skeleton.prototype.constructor = Skeleton;

// override instance method of the parent class
Skeleton.prototype.draw = function() {
    AnimatedEntity.prototype.draw.call(this, this.offsetX, this.offsetY);
}

Skeleton.prototype.update = function() {
    // HACK: skip over the standing sprite during the walk
    /*  var index = this.animation.getFrameIndex();
     if(isNaN(index)) {
     this.animation.offsetX = 0;
     } else {
     this.animation.offsetX = index !== this.animation.frames - 1 ? this.animation.width: -this.animation.width;
     }*/
    if(!this.animation && this.canAttackHero() && this.game.now) {
        this.animation = new Animation(this.image, this.width, 
                                       this.height, 3, 0.75, this.game.now, this.offsetX, this.offsetY);
    } else {
       // console.log(this);
    }

    AnimatedEntity.prototype.update.call(this);
}

Skeleton.prototype.canAttackHero = function() {
    return true;
}

// Miscellaneous objects such as fire, or a rock...
function Fire(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y);
    this.image = ASSET_MANAGER.getAsset('images/fire.png');
    this.animation = new Animation(this.image, width, height, 5, 1, game.now);
    // optional animation argument
    this.scaleToX = 32;
    this.scaleToY = 32;
}

Fire.prototype = new AnimatedEntity();
Fire.prototype.constructor = Fire;

function Animation(sprite, width, height, frames, timePerAnimation, startTime, offsetX, offsetY) {
    this.sprite = sprite;
    this.width = width;
    this.height = height;
    this.frames = frames;
    this.timePerAnimation = timePerAnimation * 1000; // to convert it to ms
    this.startTime = startTime; // get the time in which it started
    this.elapsedTime = 0;
    // optional arguments
    this.offsetX = ( typeof offsetX === 'undefined') ? 0 : offsetX;
    this.offsetY = ( typeof offsetY === 'undefined') ? 0 : offsetY;
}

Animation.prototype.animate = function(ctx, currentTime, x, y, scaleToX, scaleToY) {
    this.elapsedTime = currentTime - this.startTime;
    if (this.isDone()) {
        this.reanimate(ctx); // let's play it again
    }
    var index = this.getFrameIndex(); // get the current index = elapsedTime/timePerFrame
    ctx.drawImage(this.sprite, index * this.width + this.offsetX, this.offsetY, this.width, this.height, x, y, scaleToX, scaleToY);
}

Animation.prototype.isDone = function() {
    return this.elapsedTime >= this.timePerAnimation;
}

Animation.prototype.getFrameIndex = function() {
    return Math.floor(this.elapsedTime / (this.timePerAnimation / this.frames));
}

Animation.prototype.reanimate = function(ctx) {
    this.elapsedTime = 0;
    this.startTime = window.performance.now();
}

function Dungeon(game, enemyProbability, miscProbability) {
    this.game = game;
   // this.percentWalls = percentWalls;
    this.enemyProbability = enemyProbability; // enemy probability per free space
    this.miscProbability = miscProbability;
    this.map = [[]]; // two-dimensional array (x,y coordinates)
    this.tileSize = 48;
    this.tile = ASSET_MANAGER.getAsset('images/caveTiles.png');
}

/*
 * TODO: An idea here would be to even add the entities in the dungeon's map,
 * and then constantly update their positions so that we can use only the map in
 * collision detection.
 */

// use a two dimensional array to keep track of the initial objects and entities in the dungeon
Dungeon.prototype.generateDungeon = function() {
    var numTilesX = Math.ceil(this.game.frameWidth/this.tileSize),
        numTilesY = Math.ceil(this.game.frameHeight/this.tileSize);
        
    for (var i = 0; i < numTilesX; ++i) {
        this.map[i] = [];
        for (var j = 0; j < numTilesY; ++j) {
           // F for free space, W for Wall
           this.map[i][j] = i == 0 || i == numTilesX - 1 || j == 0 || j == numTilesY - 1 ? 'W' : 'F';
           if(i === numTilesX - 2 && j === 0) {
                this.map[i][j] = 'E'; // E for exit
           }
           
        }
    }
    
    // as soon as we are done, let's generate the necessary entities (i.e. enemies, fire, etc.)
    this.generateEntities();
}

// generate the entities based on the map array generated previously
Dungeon.prototype.generateEntities = function() {
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map.length; ++j) {
            if (i === 0 && j === 0 || this.map[i][j] !== 'F') { continue; } // that is where we are placing our hero
            
            var rand = Math.random()*101, // random number from 0 to 100
                xPos = i*this.tileSize >= this.game.frameWidth - 64 ? this.game.frameWidth : i*this.tileSize,
                yPos = j*this.tileSize >= this.game.frameHeight - 64 ? this.game.frameHeight : j*this.tileSize;
                
            // generate an entity based on the random number
            if (rand <= this.enemyProbability) {
                this.game.addEntity(new Fire(this.game, xPos, yPos, 64, 64));
            } else if (rand >= 100 - this.miscProbability) {
                this.game.addEntity(new Ogre(this.game, xPos, yPos, 32, 48));
            } else if(rand >= 50 && rand <= 55) {
                this.game.addEntity(new Skeleton(this.game, xPos, yPos, 31, 48));
            }
         }
     }
}

Dungeon.prototype.drawExit = function(x, y) {
    this.game.ctx.clearRect(x, y, this.tileSize, this.tileSize);
}

Dungeon.prototype.drawTile = function(x, y) {
     this.game.ctx.drawImage(this.tile, 0, this.tileSize, this.tileSize, this.tileSize, x, y, this.tileSize, this.tileSize);
}

Dungeon.prototype.drawWall = function(x, y) {
    this.game.ctx.drawImage(this.tile, 0, 0, this.tileSize, this.tileSize, x, y, this.tileSize, this.tileSize);
}

// draw walls and free space for the dungeon; the entities will be drawn in their own respective draw functions
Dungeon.prototype.drawDungeon = function() {
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map.length; ++j) {
            switch (this.map[i][j]) {
                case 'F': // free space
                    this.drawTile(i*this.tileSize, j*this.tileSize);
                    break;
                case 'W': // need to draw a wall
                    this.drawWall(i*this.tileSize, j*this.tileSize);
                    break;
                case 'E': // need to draw the exit
                    this.drawExit(i*this.tileSize, j*this.tileSize);
            }
        }
    }
}

// code for the game engine which will handle the heavy lifting
function GameEngine(ctx) {
    this.ctx = ctx;
    this.frameWidth = ctx.canvas.width;
    this.frameHeight = ctx.canvas.height;
    this.entities = [];
    this.now = window.performance.now(); // keep track of time
    this.key = null; // will keep track of direction of our hero (via key events)
    this.previousKey = null; // keep track of previously pressed key to avoid "sticky" keys
    this.dungeon = null;
}

GameEngine.prototype.addEntity = function(entity) {
    this.entities.push(entity);
}
// the ACTUAL game loop
GameEngine.prototype.loop = function() {
    // really all we need to do here... call update and then draw the updated states
    this.update();
    this.draw();
}
/*
 * TODO: Currently, the draw function does well performance wise, but how about employing web workers
 * to do the updating, and then drawing that updated element right afterward? Obviously I can't draw on the
 * canvas from the web worker, but if I run the update, and then call draw on that single entity, it would be a
 * performance boost.
 */
GameEngine.prototype.draw = function() {
    // we need to clear the canvas first
    this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.dungeon.drawDungeon();
    // ultimately we would redraw all the entities...
    this.entities.forEach(function(entity) {
        entity.draw(this.ctx);
    }, this);
}

GameEngine.prototype.update = function() {
    // this will become a reality later on
    this.entities.forEach(function(entity, index) {
        if (entity.alive) {
            entity.update();
        } else {
            entities.splice(index, 1);
            // remove the entity from the entities array
        }
    }, this);
}

GameEngine.prototype.init = function() {
    this.dungeon = new Dungeon(this, 2, 1); // new dungeon with enemy probability of 10% per free space
    this.dungeon.generateDungeon();
    // (x, y) = (0, 0), width = 64, height = 64
    this.addEntity(new Hero(this, 60, this.frameHeight - 90, 64, 64));

    // let's start tracking input
    this.trackEvents();
}

GameEngine.prototype.start = function() {
    console.log('and here... we... go!');
    var that = this;
    // let's create an anonymous function for handling requestAnimationFrame and the game loop
    (function gameLoop(time) {
        if (time - that.now > 160) {// time delta is too high, problematic for animations...
            // need to update the startTime for each animation to avoid wormholes
            that.entities.forEach(function(entity) {
                if (entity.animation) {
                    // "normalize" the startTime
                    entity.animation.startTime = time - entity.animation.elapsedTime;
                }
            }, that);
        }
        that.now = time;
        //console.log(that.entities);
        that.loop();
        requestAnimationFrame(gameLoop, that.ctx); // ctx as 2nd argument so that we don't reanimate while ctx is out of view
    })();
    // let's make it call itself and get the ball rolling...
}

GameEngine.prototype.trackEvents = function() {
    var that = this;
    window.addEventListener('keydown', function(e) {
        that.previousKey = that.key;
        that.key = e.keyCode || e.which;
        e.preventDefault();
    }, false);
    
    window.addEventListener('keyup', function(e) {
        var keyCode = e.keyCode || e.which;
        // the released key is the previous key, so obviously don't make it the current key
        if(!(keyCode === that.previousKey) || that.previousKey === that.key) { 
            that.key = that.previousKey === that.key ? null : that.previousKey;
        }
        that.previousKey = null;
    }, false);
}

GameEngine.prototype.getLoadingScreen = function() {
    // let's render in an off-screen canvas to improve performance
    game.ctx.save();
    var canv = document.createElement('canvas'), ctx = canv.getContext('2d');
    // make it compact to improve performance
    canv.width = 200;
    canv.height = 100;
    ctx.font = 'italic 12px Arial';
    ctx.fillStyle = 'blue';
    ctx.fillText('Loading assets... Please wait', 0, 50);
    return canv; // return the canvas
}

var ASSET_MANAGER = new AssetManager(), 
    canvas,
    game;
    
window.addEventListener('load', function() {
    // set canvas width to occupy the whole page
    canvas =  document.getElementById('canvas');
    /*canvas.width = document.width;
    canvas.height = document.height;*/
    
    game = new GameEngine(canvas.getContext('2d'));
    var lCanv = game.getLoadingScreen();
    // display the loading screen while we load assets
    game.ctx.drawImage(lCanv, (game.frameWidth - lCanv.width) / 2, (game.frameHeight - lCanv.height) / 2);
    ASSET_MANAGER.updateAppCache();
    ASSET_MANAGER.queueDownload('images/fire.png');
    ASSET_MANAGER.queueDownload('images/monsters.png');
    ASSET_MANAGER.queueDownload('images/hero.png');
    ASSET_MANAGER.queueDownload('images/caveTiles.png');
    ASSET_MANAGER.queueSound('song.mp3');
    // TODO: Also preload all of the sounds that we will use in the game
    ASSET_MANAGER.downloadAll(function() {
        console.log('All assets have been loaded succesfully.');
        // these two should be the only two statements here
        game.init();
        game.start();
       // ASSET_MANAGER.getSound('song.mp3').play();
    });
}, false);
