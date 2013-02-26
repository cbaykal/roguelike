/*
 * Globals
 */
var GAME = {
    bait: {
        eaten: true
    },
    board:{},
    constants : {
        BAIT_BOX_COLOR: "white",
        BAIT_STRIPE_COLOR: "#56a0d3",
        BAIT_WIDTH: 10,
        GAME_TIMER : 50,
        SNAKE_BOX_COLOR : "white",
        SNAKE_LENGTH : 5,
        SNAKE_STRIPE_COLOR : "#56a0d3",
        SNAKE_WIDTH : 10
    },
    direc : "right",
    gameOver: false,
    score: 0,
    snakeArray : [],
    timer : undefined,
    uncImg : undefined,
};

/*
* Functions
*/
function checkCollisions(x, y) {
    // need to check whether the new position of the head node bumps into any other "snake node"
    if(GAME.snakeArray.length === 0) { return; }
    var width = GAME.constants.SNAKE_WIDTH;
    for(var i = 1; i < GAME.snakeArray.length; i++) {
        if(GAME.snakeArray[i].x === x && GAME.snakeArray[i].y === y) {
            GAME.gameOver = true;
            initGame(); // restart the game
            return;
        }
    }
    
    // check whether the frontNode will exceed game board bounds
    if(x*width > GAME.board.w || y*width > GAME.board.h ||
        x < 0 || y < 0) {
            GAME.gameOver = true;
            initGame();
    }
}

// displays score
function displayScore() {
    GAME.board.ctx.fillStyle = "white";
    GAME.board.ctx.font = "italic 14px Arial";
    GAME.board.ctx.fillText("Score: " + GAME.score, 40, GAME.board.h - 20);
}
// draws bait randomly
function drawBait() {
    var xBounds = GAME.board.w - GAME.constants.BAIT_WIDTH,
        yBounds = GAME.board.h - GAME.constants.BAIT_WIDTH,
        bait = GAME.bait,
        ctx = GAME.board.ctx;
    if(bait.eaten) {
        // Round down to the nearest 10
        bait.x = Math.floor((Math.random()*(xBounds+1))/10)*10;
        bait.y = Math.floor((Math.random()*(yBounds+1))/10)*10;
        bait.eaten = false;
    }
    ctx.fillStyle = GAME.constants.BAIT_BOX_COLOR;
    ctx.fillRect(bait.x, bait.y, GAME.constants.BAIT_WIDTH, GAME.constants.BAIT_WIDTH);
    ctx.strokeStyle = GAME.constants.BAIT_STRIPE_COLOR;
    ctx.strokeRect(bait.x, bait.y, GAME.constants.BAIT_WIDTH, GAME.constants.BAIT_WIDTH);
}

// draws game board
function drawGameBoard(callback) {
    // set up the game board
    GAME.board.ctx.clearRect(0, 0, GAME.board.w, GAME.board.h);
    GAME.board.ctx.rect(0, 0, GAME.board.w, GAME.board.h);
    GAME.board.ctx.fillStyle = GAME.board.grd;
    GAME.board.ctx.fill();
    // draw image
    GAME.board.ctx.drawImage(GAME.uncImg, (GAME.board.w - GAME.uncImg.width) / 2, (GAME.board.h - GAME.uncImg.height) / 2);
    if(callback) {
        callback();
    }
}

// actually draws the snake
function drawSnake() {
    var board = GAME.board, ctx = board.ctx, snake = GAME.snakeArray, width = GAME.constants.SNAKE_WIDTH;
    for (var i = 0; i < snake.length; i++) {
        ctx.fillStyle = GAME.constants.SNAKE_BOX_COLOR;
        ctx.fillRect(snake[i].x * width, snake[i].y * width, width, width);
        ctx.strokeStyle = GAME.constants.SNAKE_STRIPE_COLOR;
        ctx.strokeRect(snake[i].x * width, snake[i].y * width, width, width);
    }
}

// displays "Loading..."
function displayLoadingText() {
    GAME.board.ctx.fillStyle = "blue";
    GAME.board.ctx.textAlign = "center";
    GAME.board.ctx.fillText("Loading...", GAME.board.w / 2, GAME.board.w / 2);
}

// calls callback function with the image as argument
function loadImage(imgSrc, callback) {
    // if the img exists, just return
    if(GAME.uncImg) { 
        callback(GAME.uncImg);
        return;
    }
    var img = new Image();
    img.onload = function() {
        callback(img);
    }; // end onload
    img.src = imgSrc;
}

function initGame() {
    GAME.score = 0; // reset score
    GAME.direc = "right";
    displayLoadingText();
    // setTimeout just for fun... so the user can see the Loading... message
    loadImage("unc.png", function(img) {
        GAME.uncImg = img;
        initSnake();
        drawGameBoard(null);
        if(typeof GAME.timer !== "undefined") {
            clearInterval(GAME.timer);
        }
        GAME.timer = setInterval(paint, GAME.constants.GAME_TIMER);
        GAME.gameOver = false;
    }); // end loadImage
}

function initSnake() {
    GAME.snakeArray.splice(0, GAME.snakeArray.length);
    for (var i = 0; i < GAME.constants.SNAKE_LENGTH; i++) {
        GAME.snakeArray.unshift({
            x : i,
            y : 0
        });
    }
}
// check to see whether the bait is eaten
function isBaitEaten() {
    // get the head of the snake array
    var headNode = GAME.snakeArray[0],
        bait = GAME.bait,
        width = GAME.constants.SNAKE_WIDTH,
        lastNode = GAME.snakeArray[GAME.snakeArray.length - 1];
        
    if((headNode.x*width === bait.x) &&
       (headNode.y*width === bait.y)) {
        GAME.score+=10; // increment score
        bait.eaten = true;
        // add one more node to the snake (same x and y positions as last node)
        
        GAME.snakeArray.push({x: lastNode.x, y:lastNode.y});
    }
}

function paint() {
    if(GAME.gameOver) { return;}
    var headNode = GAME.snakeArray[0], tailNode = GAME.snakeArray.pop();
    // assign the correct coordinate positions for the tailNode (soon to be headNode)
    switch(GAME.direc) {
        case "left":
            tailNode.x = headNode.x - 1;
            tailNode.y = headNode.y;
            break;
        case "right":
            tailNode.x = headNode.x + 1;
            tailNode.y = headNode.y;
            break;
        case "up":
            tailNode.y = headNode.y - 1;
            tailNode.x = headNode.x;
            break;
        case "down":
            tailNode.y = headNode.y + 1;
            tailNode.x = headNode.x;
            break;
    }
    // put the last node in the front (enqueue in a way) to make it the headNode
    GAME.snakeArray.unshift(tailNode);
    checkCollisions(tailNode.x, tailNode.y);
    // check if bait is eaten
    isBaitEaten();
    // draw the game board
    drawGameBoard(function() {
        drawSnake();
        drawBait();
        displayScore();
    });
}

$(document).ready(function() {
    var board = GAME.board, canvas = document.getElementById('canvas'), 
        keyCode,
        returnVal;
        
    // init needed variables
    board.ctx = canvas.getContext('2d'), board.w = canvas.width, board.h = canvas.height;
    board.grd = board.ctx.createLinearGradient(board.w / 2, 0, board.w / 2, board.h);
    board.grd.addColorStop(0, "#56a0d3");
    board.grd.addColorStop(1, "#286da3");

    // initialize the game
    initGame();

    // init keybinds
    $(document).keydown(function(e) {
        keyCode = e.key || e.which;
        returnVal = keyCode >= 37 && keyCode <= 40 ? false : true;
        
        if (keyCode === 37 && GAME.direc !== "right") {// Left
            GAME.direc = "left";
        } else if (keyCode === 39 && GAME.direc !== "left") {// Right
            GAME.direc = "right";
        } else if (keyCode === 38 && GAME.direc !== "down") {// Up
            GAME.direc = "up";
        } else if (keyCode === 40 && GAME.direc !== "up") {// Down
            GAME.direc = "down";
        }
        return returnVal;
    }); // end keydown

});
// end ready
