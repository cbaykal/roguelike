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

AnimatedEntity.prototype.getDeltaPosition = function() {
    var elapsedTime = (this.game.now - this.lastUpdateTime);
    
    return elapsedTime > 30 ? 0 : Math.round(elapsedTime / 1000 * this.VELOCITY); // to avoid wormholes
}

// check the proposed x and y bounds and see whether we can move there
AnimatedEntity.prototype.isPathClear = function(newX, newY, useAdjustedCoords, compareEntities, considerHero) {
    
    var compareEntities = typeof compareEntities === 'undefined' ? true : compareEntities,
        considerHero = typeof considerHero === 'undefined' ? true : considerHero;
        
    // let's check the map array to see whether the new location is free or not
    var adjustedCoords = typeof useAdjustedCoords === "undefined" || useAdjustedCoords ? this.getAdjustedCoords(newX, newY) : {x:newX, y:newY};
    // gets the corresponding tile number (i and j) for use in retrieval in map
    
    var tileX = Math.floor(adjustedCoords.x/this.game.dungeon.tileSize),
        tileY = Math.floor(adjustedCoords.y/this.game.dungeon.tileSize);
        
    var i =  tileX < 0 ? 1 : tileX, 
        j = tileY < 0 ? 1 : tileY; 

    if(this.game.dungeon.map[i][j] === 'W') {
        return false; // there's a wall, so obviously can't move there
    }
    
    if(!compareEntities) {
        return true;
    }
    // going to be using a rectangle algorithm to detect collisions
    var heroRect = null, 
        entityRect = null;
        
    // for most accurate collision detecting (and natural looking), I am going to iterate over the Entities
    for (var i = 0; i < this.game.entities.length; ++i) {
        var entity = this.game.entities[i];
        // obviously don't check to see whether the entity is colliding with itself 
        // also, for path planning, I need to make sure it doesn't see the hero as an obstacle
        if (this === entity || (!considerHero && entity.constructor.name === 'Hero')) { 
            continue; 
        }
        
        // rectangle for the entity
        // Note: we define the retangle's top left corner as y + height/2 or y + height*1/5 because we want to represent the blocking point
        // as the feet of the skeleton to make the collisions look more natural
        entityRect = new Rectangle(entity.x, entity.x + entity.scaleToX, entity.y + entity.scaleToY*(1/5), entity.y + entity.scaleToY);
        heroRect = new Rectangle(newX, newX + this.scaleToX*3/4, newY + this.scaleToY/2, newY + this.scaleToY);
        
        if (heroRect.isIntersecting(entityRect)) {
            return false;
        }
    }
    
    return true;
}

AnimatedEntity.prototype.attackEnemy = function() {
    var rectX1 = this.x, // top left edge
        rectX2 = this.x + this.scaleToX, // top right edge
        rectY1 = this.y, // bottom left edge
        rectY2 = this.y + this.scaleToY; // bottom right edge
        
    // adjust the rectangle used for checking intersection with the enemy so that
    // it is more lenient depending on its ATTACKING_RANGE
    switch(this.attackingDirection) {
        case 'up':
            rectY1 -= this.ATTACKING_RANGE;
            break;
        case 'down':
            rectY2 += this.ATTACKING_RANGE;
            break;
        case 'right':
            rectX2 += this.ATTACKING_RANGE;
            break;
        case 'left':
            rectX1 -= this.ATTACKING_RANGE;
            break;
    }
    
    var heroRect = new Rectangle(rectX1, rectX2, rectY1, rectY2),
        entityRect = null;
    
    // let's check for collision and damage the opponent(s) if it/they is within range
    for (var i = 0; i < this.game.entities.length; ++i) {
        var entity = this.game.entities[i];
        
        // obviously we don't want to attack ourself, also attacking a misc. object doesn't make much sense
        if(entity === this || entity.constructor.name === 'Fire') {
            continue;
        }
        entityRect = new Rectangle(entity.x, entity.x + entity.scaleToX, entity.y, entity.y + entity.scaleToY);
 
        if (heroRect.isIntersecting(entityRect)) {
            // the enemy is within range, decrement their health based on the attacker's strength
            entity.health -= this.strength; 
            console.log(entity.health);
        }
    }
}

// in most cases, we have to adjust the coordinates accordingly 
// for the collision detection to look more natural
AnimatedEntity.prototype.getAdjustedCoords = function(newX, newY) {
    var x = null,
        y = null;
        
    switch(this.direction) {
        case 'up': // most natural way to do is to take the character's center
            x = newX + this.scaleToX/2;
            y = newY + this.scaleToY/2;
            break;
        case 'down': // consider the midpoint of the feet
            x = newX + this.scaleToX/2;
            y = newY + this.scaleToY;
            break;
        case 'right':
            x = newX + this.scaleToX/2;
            y = newY + this.scaleToY;
            break;
        case 'left':
            x = newX + this.scaleToX/2;
            y = newY + this.scaleToY;
            break;
            
        case 'punch':
            x = newX;
            y = newY;
            break;
    }
    
    return {
        x: x,
        y: y
    };
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
    this.direction = "up";
    this.health = 100;
    this.strength = 1; // how much the hero damages the opponent
    this.VELOCITY = 100;
    this.ATTACKING_RANGE = 10;
}

Hero.prototype = new AnimatedEntity();
Hero.prototype.constructor = Hero;

Hero.prototype.draw = function() {
    // pre-render and then draw the health bar
    var offCanvas = document.createElement('canvas'),
        ctx = offCanvas.getContext('2d'),
        picWidth = 255;
        picHeight = 30;
        
    offCanvas.width = picWidth;
    offCanvas.height = picHeight;
    
    /*ctx.save();
    ctx.fillStyle = 'red';
    ctx.textBaseline = 'top';
    ctx.font = 'italic 18px Arial';
    ctx.fillText('Health:', 0, 0);
    ctx.restore();*/
    
    // draw the health bar and its frame; the width of the red health bar depends on the current health
    ctx.drawImage(ASSET_MANAGER.getAsset('images/health_frame.png'), 0, 0);
    ctx.drawImage(ASSET_MANAGER.getAsset('images/health.png'), 0, 0, 
                                          Math.floor(picWidth*this.health/100), picHeight, 0, 0, Math.floor(picWidth*this.health/100), picHeight);
    
    this.game.ctx.drawImage(offCanvas, 48, this.game.frameHeight - 40);
    
    // slightly alter the offset and call the parent class' instance method
    AnimatedEntity.prototype.draw.call(this, this.offsetX - this.width, this.offsetY);
}

Hero.prototype.update = function() {
    if(this.health <= 0) {
        this.alive = false;
        return;
    }
    
    var delta = this.game.now ? this.getDeltaPosition() : 0,
        baseOffsetY = 518,
        punchOffset = 514;
        
    switch(this.game.key) {
        case 38: // up
            this.y -= this.isPathClear(this.x, this.y - delta, true) ? delta : 0;
            this.offsetY = baseOffsetY;
            this.direction = 'up';
            break;
        case 40: // down
            this.y += this.isPathClear(this.x, this.y + delta, true) ? delta : 0;
            this.offsetY = baseOffsetY + this.height * 2;
            this.direction = 'down';
            break;
        case 37: // left
            this.x -= this.isPathClear(this.x - delta, this.y, true) ? delta : 0;
            this.offsetY = baseOffsetY + this.height;
            this.direction = 'left';
            break;
        case 39: // right
            this.x += this.isPathClear(this.x + delta, this.y, true) ? delta : 0;
            this.offsetY = baseOffsetY + this.height*3;
            this.direction = 'right';
            break;         
        case 32: // space (to punch)
            // prevent a bug where pressing the space bar triggers a tremendous offset (since it gets invoked twice)
            // realign the offset of the sprite
            this.offsetY = punchOffset + this.offsetY > baseOffsetY + punchOffset + this.height*3 ? this.offsetY : punchOffset + this.offsetY;
            this.attackingDirection = this.direction === 'punch' ? this.attackingDirection : this.direction;
            this.direction = 'punch';
            break;
        default:
            this.game.key = null;
            this.game.previousKey = null;
    }
    
    if(!this.game.key && this.animation && this.direction !== 'punch') { // hero is currently animated, but no key is pressed => end animation
        this.animation = null;
    } else if((this.game.key && !this.animation) || (this.animation && this.direction !== this.animation.direction)) { // key is pressed, but no animation is present => start animation
        this.animation = this.direction === 'punch' ? 
                        new Animation(this.image, this.width, this.height, 11, 2/3, this.game.now, this.offsetX, this.offsetY, false) :
                        new Animation(this.image, this.width, this.height, 8, 0.5, this.game.now, this.offsetX, this.offsetY);
                        
        this.animation.direction = this.direction;
    } else if(this.direction === 'punch' && this.animation && this.animation.isDone()) {
        this.animation = null;
        this.direction = this.attackingDirection; // this.direction should no longer be 'punch'
        //this.offsetY -= 514;
    }
    
    if(this.direction === 'punch') {
        this.attackEnemy();
    }
  
    /*else if() { // key is pressed, and an animation is going on => TRICKY
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


function Enemy(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y, width, height);
    this.image = null;
    this.animation = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scaleToX = 0;
    this.scaleToY = 0;
    this.baseOffsetY = 0; // for sprite positioning
    this.direction = "left";
    this.path = []; // will hold the path determined by the path planner
    this.pathLastUpdated = null;
    this.health = 75;
    this.strength = 1e-1;
    this.wandering = false;
    this.wanderingDelta = 0; // keep track of how much it has wandered
    this.VELOCITY = 400;
    this.DISTANCE_THRESHOLD = 0; // if the hero is within this distance, attack him
    this.WANDER_PROBABILITY = 5e-3; // 5e-3
    this.ATTACKING_RANGE = 10;
    this.TIMER_DELTA_CONSTANT = 10; // for determining the interval to update the path planner
}

Enemy.prototype = new AnimatedEntity();
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function() {
    if(this.health <= 0) {
        this.alive = false; // no longer alive, so the master update thread should take care of removing it
        this.explode(); // replace this entity with an explosion animation
        return;
    }
    
    var delta,
        skipY = 64;
        
    if (this.game.now && this.game.dungeon.map) {
        delta = this.getDeltaPosition();
        this.wanderAround(delta);
    } else {
        return;
    }

    if (this.canAttackHero() || this.wandering) {
        this.direction = this.wandering ? this.direction : this.getDirection();
 
        switch (this.direction) {
            case 'up':
                if ((this.wandering && this.isPathClear(this.x, this.y - delta)) || this.canAttackHero()) {
                    this.y -= delta;
                } else {
                    this.wandering = false;
                }
                this.offsetY = this.baseOffsetY + skipY*3;
                break;
                
            case 'down':
               if ((this.wandering && this.isPathClear(this.x, this.y + delta)) || this.canAttackHero()) {
                    this.y += delta;
                } else {
                    this.wandering = false;
                }
                this.offsetY = this.baseOffsetY;
                break;
                
            case 'right':
                if ((this.wandering && this.isPathClear(this.x + delta, this.y)) || this.canAttackHero()) {
                    this.x += delta;
                } else {
                    this.wandering = false;
                }
                this.offsetY = this.baseOffsetY + skipY*2;
                break;
                
            case 'left':
                if ((this.wandering && this.isPathClear(this.x - delta, this.y)) || this.canAttackHero()) {
                    this.x -= delta;
                } else {
                    this.wandering = false;
                }
                this.offsetY = this.baseOffsetY + skipY;
                break;
                
             case 'punch':
                this.attackEnemy();
                this.attackingDirection = this.direction === 'punch' ? this.attackingDirection : this.direction;
                break;
        }
        
        if (this.game.now) {
            this.animation = this.animation && this.direction === this.animation.direction ? this.animation :
                        new Animation(this.image, this.width, this.height, 3, 1.0, this.game.now, this.offsetX, this.offsetY);
            this.animation.direction = this.direction;
        }
        
        if (this.wandering) {
            this.wanderingDelta += delta;
        }
        
    } else {
        this.animation = null;
    }
    
    this.lastUpdateTime = this.game.now;
}


Enemy.prototype.distanceToHero = function() {
    return Math.round(Math.sqrt(Math.pow(this.x - game.hero.x, 2) + Math.pow(this.y - game.hero.y, 2)));
}

// get the direction to move based on A* path planning
Enemy.prototype.getDirection = function() {
    var direction = this.direction;
    
    // I found that the most robust implementation of reconstructing the path
    // is by considering how long it has been since the last path was updated, and 
    // determining the timer delta by a function that takes into account distance
    var timerDelta = this.TIMER_DELTA_CONSTANT*this.distanceToHero();
    
    if (!this.path || !this.pathLastUpdated || (this.game.now - this.pathLastUpdated) >= timerDelta) {
        var planner = new PathFinder(this.game, this.game.hero, this),
            foundPath = planner.findPath();
         // update the path if there were no errors in finding it
        this.path = (foundPath || !this.path) ? foundPath : this.path;
        
        this.pathLastUpdated = this.game.now; // record the last updated time
    }

    // if we are not at the goal position, we need to find the next step on our path to hero
    if (!this.goalX && !this.goalY || this.isAtGoalPosition()) {
        var tile = this.path.pop();
        // pop the tile that we need to go to
        if (typeof tile === 'undefined' || this.path.length === 0) { // out of path tiles, start attacking
            this.attackingDirection = this.direction === 'punch' ? this.attackingDirection : this.direction;
            return 'punch';
        }
        
        this.goalX = tile.x * this.game.dungeon.tileSize;
        this.goalY = tile.y * this.game.dungeon.tileSize;
    }
    
    var distThreshold = 5;
    // decide on the direction based on the current position relative to the goal position
    if (this.goalX !== this.x) {
        if (this.goalX < this.x) {// goal lies to the left
            direction = 'left';
        } else {
            direction = 'right';
        }
    } else {
        if (this.goalY < this.y) {
            direction = 'up';
        } else {
            direction = 'down';
        }
    }
    return direction;
}

// are we at the goal position determined by the path planner?
Enemy.prototype.isAtGoalPosition = function() {
    var enemyRect = new Rectangle(this.x, this.x + this.scaleToX, this.y, this.y + this.scaleToY),
        heroRect = new Rectangle(this.game.hero.x, this.game.hero.x + this.game.hero.scaleToX, 
                                this.game.hero.y, this.game.hero.y + this.game.hero.scaleToY);
                                
    if (enemyRect.isIntersecting(heroRect)) {
        return true;
    } else if ((this.x <= this.goalX && this.x + this.scaleToX >= this.goalX) && 
       (this.y <= this.goalY && this.y + this.scaleToY >= this.goalY)) {
       //if(this.x === this.goalX && this.y === this.goalY) {
           return true;
    }
    return false;
}

// have the enemy move around to make it look more alive
Enemy.prototype.wanderAround = function() {
    var rand = Math.random(),
        walkDist = Math.ceil(Math.random()*50) + 30;
        
    if(this.canAttackHero()) {
        this.wandering = false;
        return;
    } else if(this.wandering && this.wanderingDelta >= walkDist) { // don't really need an else-if here, but it looks more structured this way
        this.wandering = false;
    }
        
    if(rand <= this.WANDER_PROBABILITY) {
        var r = Math.random();
        if(r >= 0 && r < 0.25) {
            this.direction = 'right';
        } else if(r >= 0.25 && r < 0.5) {
            this.direction = 'left';
        } else if(r >= 0.5 && r < 0.75) {
            this.direction = 'down';
        } else {
            this.direction = 'up';
        }
        
        this.wandering = true;
        this.wanderingDelta = 0;
    }
}

Enemy.prototype.canAttackHero = function() {
     return this.distanceToHero() <= this.DISTANCE_THRESHOLD;
}

Enemy.prototype.explode = function() {
    this.game.addEntity(new Explosion(this.game, this.x, this.y, 33.8, 32));
}

function Ogre(game, x, y, width, height) {
    Enemy.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/monsters.png');
    this.offsetX = 0;
    this.offsetY = 13;
    this.baseOffsetY = 13;
    this.scaleToX = 24; // 32
    this.scaleToY = 24; // 38
    this.VELOCITY = 100;
    this.DISTANCE_THRESHOLD = 100; // if the hero is within this distance, attack him
}

// set AnimatedEntity as parent class
Ogre.prototype = new Enemy();
Ogre.prototype.constructor = Ogre;

// override instance method of the parent class
Ogre.prototype.draw = function() {
    Enemy.prototype.draw.call(this, this.offsetX, this.offsetY);
}

function Skeleton(game, x, y, width, height) {
    Enemy.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/monsters.png');
    // width: 32, height: 48, frames: 3, timePerAnimation: 0.75 seconds, offsetX: 0, offsetY: 23
    this.offsetX = 98;
    this.offsetY = 13;
    this.baseOffsetY = 13;
    this.scaleToX = 24;
    this.scaleToY = 24;
    this.VELOCITY = 40
    this.DISTANCE_THRESHOLD = 100;
}

// set AnimatedEntity as parent class
Skeleton.prototype = new Enemy();
Skeleton.prototype.constructor = Skeleton;

// override instance method of the parent class
Skeleton.prototype.draw = function() {
    Enemy.prototype.draw.call(this, this.offsetX, this.offsetY);
}

// Miscellaneous objects such as fire, or a rock...
function Fire(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y);
    this.image = ASSET_MANAGER.getAsset('images/fire.png');
    this.animation = new Animation(this.image, width, height, 5, 1, game.now);
    // optional animation argument
    this.scaleToX = 24; // 32
    this.scaleToY = 24; // 32
}

Fire.prototype = new AnimatedEntity();
Fire.prototype.constructor = Fire;

function Animation(sprite, width, height, frames, timePerAnimation, startTime, offsetX, offsetY, repeat) {
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
    this.repeat = typeof repeat === 'undefined' ? true : repeat;
}

Animation.prototype.animate = function(ctx, currentTime, x, y, scaleToX, scaleToY) {
    this.elapsedTime = currentTime - this.startTime;
    if (this.isDone() && this.repeat) {
        this.reanimate(ctx); // let's play it again
    }
    var index = this.getFrameIndex();  // get the current index = elapsedTime/timePerFrame
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

function Explosion(game, x, y, width, height) {
    AnimatedEntity.call(this, game, x, y, width, height);
    this.image = ASSET_MANAGER.getAsset('images/explosion.png');
    this.animation = new Animation(this.image, this.width, this.height, 5, 0.5, game.now, 0, 0, false);
    this.scaleToX = 32;
    this.scaleToY = 32;
}

Explosion.prototype = new AnimatedEntity();
Explosion.prototype.constructor = Explosion;

Explosion.prototype.update = function() {
    if(this.animation.isDone()) {
        this.alive = false;
    }
}

function Dungeon(game, enemyProbability, miscProbability) {
    this.game = game;
   // this.percentWalls = percentWalls;
    this.enemyProbability = enemyProbability; // enemy probability per free space
    this.miscProbability = miscProbability;
    this.map = [[]]; // two-dimensional array (x,y coordinates)
    this.tileSize = 24;
    this.offsetY = 48;
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
            // generate the object to place at this location in the map
            this.map[i][j] = this.generateObject(i, j, numTilesX, numTilesY);
        }
    }
}

// return wall based on a sample dungeon
Dungeon.prototype.isWall = function(i, j, numTilesX, numTilesY) {
    // enclosing rectangular walls for the cave
    if ((i === 0 || i === numTilesX - 1 || j === 0 || j >= numTilesY - 2) || 
        (i === 5 && j > 8) ||
        (i >= 5 && i <= 15 && j === 8) ||
        (i === 15 && j >= 8 && j <= 20) ||
        (i >= 15 && i <= 20 && j === 20) ||
        (i === 20 && j >= 2 && j <= 20) || 
        (i > 20 && i < 35 && j === 2) ||
        (i === 35 && j >= 2 && j <= 9) ||
        (i === 40 && j > 0 && j <= 12) ||
        (i >= 23 && i <= 40 && j === 12) ||
        (i === 23 && j >= 12 && j <= 16) ||
        (i >= 23 && i <= 44 && j === 16) ||
        (i === 44 && j > 10 && j <= 16)) 
    { 
            
        return true;
    } 
        
}
// generate the entities based on the map array generated previously
Dungeon.prototype.generateObject = function(i, j, numTilesX, numTilesY) {
    
    if (this.isWall(i, j, numTilesX, numTilesY)) {
        return 'W'; // 'W' for Wall
    }
    
    if (i <= 1 && j == numTilesY - 2) { // this is where we are placing our hero, so make sure it is free (no other entity there)
        return 'F'; 
    } else if (i === numTilesX - 2 && j === 0) { // place the exit at the top right of the screen
        return 'O'; // 'O' for 'Out'; I wanted to save 'E' for Enemy
    } else { // here, we can generate enemies and miscellaneous objects
        
        var rand = Math.random(), // random number from 0.00 to 1 (not including 1)
            xPos = i*this.tileSize,
            yPos = j*this.tileSize;
                
        // generate an entity based on the random number
        if (rand <= this.miscProbability) {
            this.game.addEntity(new Fire(this.game, xPos, yPos, 64, 64));
            return 'M'; // 'M' for Misc.
        } else if (rand >= 1 - this.enemyProbability) {
            var enemy = null;
            
            // further subdivide the enemy based on the random number
            switch(this.getEnemyChoice(2)) {
                case 1:
                    enemy = new Ogre(this.game, xPos, yPos, 32, 48);
                    break;
                case 2:
                    enemy = new Skeleton(this.game, xPos, yPos, 31, 48);
                    break;
            }

            this.game.addEntity(enemy); // add the enemy to the game
            return 'E'; // 'E' for Enemy
        } else {
            return 'F'; // just free space
        }
    }
}

// return the winner number out of the number of choices (from 1 to numChoices)
Dungeon.prototype.getEnemyChoice = function(numChoices) {
    var rand = Math.ceil(Math.random() * 100), 
        div = 100/numChoices;
        
    for (var i = 0; i < numChoices; ++i) {
        if (i*div <= rand && rand <= (i+1)*div) {
            return (i+1);
        }
    }
}

Dungeon.prototype.drawExit = function(x, y) {
    this.game.ctx.clearRect(x, y, this.tileSize, this.tileSize);
}

Dungeon.prototype.drawTile = function(x, y) {
     this.game.ctx.drawImage(this.tile, 0, this.offsetY, this.tileSize, this.tileSize, x, y, this.tileSize, this.tileSize);
}

Dungeon.prototype.drawWall = function(x, y) {
    this.game.ctx.drawImage(this.tile, 0, 0, this.offsetY, this.tileSize, x, y, this.tileSize, this.tileSize);
}

// draw walls and free space for the dungeon; the entities will be drawn in their own respective draw functions
Dungeon.prototype.drawDungeon = function() {
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map.length; ++j) {
            switch (this.map[i][j]) {
                case 'F': // free space.
                case 'E': // enemies and 
                case 'M': // miscellaneous objects also get drawn a tile
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

// updates this.map in case entities have moved
Dungeon.prototype.updateMap = function(entity, oldPosition) {
    
    // get the corresponding slots in this.map
    var i = Math.floor(oldPosition.x/this.tileSize),
        j = Math.floor(oldPosition.y/this.tileSize);
    
    // since the entity moved, it is no longer in the old position so declare it free
    this.map[i][j] = 'F';
    
    i = Math.floor(entity.x/this.tileSize);
    j = Math.floor(entity.y/this.tileSize);
   
    // what do we replace with in the new position?
    switch(entity.constructor.name) {
        case 'Hero':
            this.map[i][j] = 'F'; // 'H' for hero
            break;
            
        case 'Ogre':
        case 'Skeleton':
            this.map[i][j] = 'E'; // 'E' for enemy
            break;
            
        case 'Fire':
            this.map[i][j] = 'M'; // 'M' for miscellaneous
            break;
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
    this.hero = null; // keep track of the hero for path planning purposes
    this.ENEMY_PROBABILITY = 3e-2; // 3e-2
    this.MISC_PROBABILITY = 5e-3; // 5e-3
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
        // keep track of the entity's position so that we can update the dungeon map
       var oldPosition = {
                x: null,
                y: null
            };
            
        if (entity.alive) {
            // store previous position
            oldPosition.x = entity.x;
            oldPosition.y = entity.y;
            
            entity.update(); // update the entity
        }
        
        // update the dungeon map to store the entity's new position in the map array
        // this.dungeon.updateMap(entity, oldPosition);
        /*
         * Note: updating the map really seems to be more trouble than its worth...
         */
    }, this);
    
    // now we have to loop backwards and update the entities array
    // why backwards? Indexing forward and deleting as we go would 
    // cause an indexOutOfBounds exception since the array no longer 
    // contains the initial length of items
    
    for(var i = this.entities.length - 1; i >= 0; --i) {
        if(!this.entities[i].alive) {
            // if the entity is no longer alive remove it from the entities array
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.init = function() {
    
    // enemy probability : 0.1%;
    // miscellanous probability: 0.01%
    this.dungeon = new Dungeon(this, this.ENEMY_PROBABILITY, this.MISC_PROBABILITY);
    this.dungeon.generateDungeon();
    // (x, y) = (0, 0), width = 64, height = 64
    var hero = new Hero(this, 50, this.frameHeight - 96, 64, 64);
    this.addEntity(hero);
    this.hero = hero;

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
    
    // update appCache if appropriate
    ASSET_MANAGER.updateAppCache();
    
    // Download images
    ASSET_MANAGER.queueDownload('images/fire.png');
    ASSET_MANAGER.queueDownload('images/monsters.png');
    ASSET_MANAGER.queueDownload('images/hero.png');
    ASSET_MANAGER.queueDownload('images/caveTiles.png');
    ASSET_MANAGER.queueDownload('images/health.png');
    ASSET_MANAGER.queueDownload('images/health_frame.png');
    ASSET_MANAGER.queueDownload('images/explosion.png');
    
    // Download sounds
    ASSET_MANAGER.queueSound('song.mp3');
    
    ASSET_MANAGER.downloadAll(function() {
        console.log('All assets have been loaded succesfully.');
        // these two should be the only two statements here
        game.init();
        game.start();
       // ASSET_MANAGER.getSound('song.mp3').play();
    });
}, false);
