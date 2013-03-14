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
    var delta = this.game.now && !isNaN(this.game.now) ? this.getDeltaPosition() : 0,
        baseOffsetY = 518;

    switch(this.game.key) {
        case 38: // up
            this.y -= delta;
            this.offsetY = baseOffsetY;
            break;
        case 40: // down
            this.y += delta;
            this.offsetY = baseOffsetY + this.height * 2;
            break;
        case 37: // left
            this.x -= delta;
            this.offsetY = baseOffsetY + this.height;
            break;
        case 39: // right
            this.x += delta;
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

// I think this way is not the way to go...
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

// set Entity as parent class
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
// code for the game engine which will handle the heavy lifting
function GameEngine(ctx) {
    this.ctx = ctx;
    this.frameWidth = ctx.canvas.width;
    this.frameHeight = ctx.canvas.height;
    this.entities = [];
    this.now = window.performance.now(); // keep track of time
    this.key = null; // will keep track of direction of our hero (via key events)
    this.previousKey = null; // keep track of previously pressed key to avoid "sticky" keys
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
    this.ctx.fillStyle = 'blue';
    this.ctx.fillRect(0, 0, game.frameWidth, game.frameHeight);
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
    // initialize main characters...
    for (var i = 0; i < 2; i++) {
        this.addEntity(new Fire(this, Math.floor(Math.random() * (game.frameWidth - 32)), Math.floor(Math.random() * (game.frameHeight - 32)), 64, 64));
        this.addEntity(new Ogre(this, Math.floor(Math.random() * (game.frameWidth - 32)), Math.floor(Math.random() * (game.frameHeight - 48)), 32, 48, 0, Math.floor(Math.random() * 300)));
    }

    // TODO: Add our hero here
    // (x, y) = (0, 0), width = 64, height = 64
    this.addEntity(new Hero(this, 0, 0, 64, 64));

    // let's start tracking input
    this.trackEvents();
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
var ASSET_MANAGER = new AssetManager(), game;

window.addEventListener('load', function() {
    game = new GameEngine(document.getElementById('canvas').getContext('2d'));
    var lCanv = game.getLoadingScreen();
    // display the loading screen while we load assets
    game.ctx.drawImage(lCanv, (game.frameWidth - lCanv.width) / 2, (game.frameHeight - lCanv.height) / 2);
    ASSET_MANAGER.updateAppCache();
    ASSET_MANAGER.queueDownload('images/fire.png');
    ASSET_MANAGER.queueDownload('images/monsters.png');
    ASSET_MANAGER.queueDownload('images/hero.png');
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
