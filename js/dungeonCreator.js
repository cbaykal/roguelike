/*
 * Cenk Baykal - UNC Computer Science under Dr. Gary Bishop
 * Dungeon creation algorithm using randomized Depth First Search (DFS) aka
 * "Recursive Backtracker"
 */

// 'helper' class for our algorithm
function Vertex(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.visited = false;
    this.visitedNeighbors = 0;
}

// goal object used for path finding and clearing the area
function Goal(randDungeon, game, x, y) {
    this.randDungeon = randDungeon;
    this.game = game;
    this.x = x;
    this.y = y;
}

Goal.prototype.isPathClear = function(x, y) {
    var x = Math.floor(x/this.game.dungeon.tileSize),
        y = Math.floor(y/this.game.dungeon.tileSize);
    
    if (this.randDungeon.isValidVertex(x, y) && this.randDungeon.map[x][y].type === 'F') {
        return true;
    }

    return false;
}
/*
// arguments: width and height of the grid-style map
function RandomizeDungeon(game, numTilesX, numTilesY) {
    this.game = game;
    this.width = numTilesX;
    this.height = numTilesY;
    this.map = [[]]; // multi-dimensional array to keep track of map
    this.numFreeSpace = 0; // keep track of the number of free space in the map
    this.NEIGHBORS_VISITED_THRESHOLD = 1; // so that we avoid too many empty spaces with no walls
    this.visitedGoal = false; // we have not yet visited the goal vertex
    this.TOTAL_TILES = numTilesX*numTilesY;
    this.THRESHOLD_NEIGHBORS_EMPTY = 3; // used for simplifying the map 
    this.MIN_WALL_NUM = Math.round(this.TOTAL_TILES*(4/5)); // was 4/5
    this.MAX_WALL_NUM = Math.round(this.TOTAL_TILES*(19/20)); // was 9/10
}

// initialize the map with walls
RandomizeDungeon.prototype.initMap = function() {
    this.map = [[]];
    this.visitedGoal = false;
    
    for (var i = 0; i < this.width; ++i) {
        this.map[i] = [];
        for (var j = 0; j < this.height; ++j) {
            // make it a wall
            this.map[i][j] = new Vertex(i, j, 'W');
        }
    }
    
    // the free space now is 0
    this.numFreeSpace = 0;
}

// make the map more connected
RandomizeDungeon.prototype.simplifyMap = function(map) {  
    // now connect any paths
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map[i].length; ++j) {
            if (this.map[i][j].type === 'W') {
                this.connectCorridor(i, j);
            }
        }
    }
    
    return this.map;
}

RandomizeDungeon.prototype.removeAllLonelyWalls = function(threshold) {
    this.numFreeSpace = 0;
    var failure = false,
        result = false;
    
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map[i].length; ++j) {
            if (this.map[i][j].type === 'W') {
                var result = this.removeLonelyWall(i, j, threshold);
                failure = !failure ? result: failure;
            } else {
                ++this.numFreeSpace;
            }
        }
    }
    
    // to make sure we remove all lonely walls, recursively call function
    if (failure) {
        return this.removeAllLonelyWalls(threshold);
    }
}

// remove lonely wall if appropriate
RandomizeDungeon.prototype.removeLonelyWall = function(x, y, threshold) {
    var vertex = this.map[x][y],
        neighbors = ['N', 'S', 'W', 'E'],
        numEmpty = 0, // number of free space around the wall
        foundLonelyWall = false;
                
    for (var k = 0; k < neighbors.length; ++k) {
        var nCoords = this.getNeighborCoords(neighbors[k], vertex);
        
        // is the neighbor a free space?
        if (this.isValidVertex(nCoords.x, nCoords.y) && this.map[nCoords.x][nCoords.y].type === 'F') {
            ++numEmpty;
        }
    }
    
    // finally, if the number of spaces was above threshold, remove the wall
    if (numEmpty >= threshold) {
        foundLonelyWall = true;
        // make it free space instead of a wall
        this.map[x][y].type = 'F';
        ++this.numFreeSpace;
    }
    
    // return whether a lonely wall was found (sign of a defective map)
    return foundLonelyWall;
}

RandomizeDungeon.prototype.connectCorridor = function(x, y) {
    var vertex = this.map[x][y],
        neighbors = ['N', 'S', 'W', 'E'];
        
    for (var k = 0; k < neighbors.length; ++k) {
        // get the coordinates of the neighbors 2 tiles away
        var nCoords = this.getNeighborCoords(neighbors[k], vertex, 1),
            nnCoords = this.getNeighborCoords(neighbors[k], vertex, 2); // neighbor of neighbor
        
        // if it is a valid vertex OR if it is not considered to be valid because it is a boundary, then proceed
        if (this.isValidVertex(nCoords.x, nCoords.y) && this.isValidVertex(nnCoords.x, nnCoords.y) &&
            this.map[nCoords.x][nCoords.y].type === 'F' && this.map[nnCoords.x][nnCoords.y].type === 'W') {

            // make the free space in between the two walls a wall to connect them
            this.map[nCoords.x][nCoords.y].type = 'W';
            --this.numFreeSpace;
        }
    }
}

// function to see whether the map is reasonable
RandomizeDungeon.prototype.isMapGood = function() {
    var numWalls = this.TOTAL_TILES - this.numFreeSpace;
    
    if (numWalls > this.MAX_WALL_NUM || numWalls < this.MIN_WALL_NUM) {
     //   console.log('min: ' + this.MIN_WALL_NUM + ', max: ' + this.MAX_WALL_NUM + '\n NUMWALLS: ' + numWalls);
        return false;
    }
    
    return true;
}

// returns a randomly created map
RandomizeDungeon.prototype.generateDungeon = function(exitX, exitY, goalX, goalY) {
    // set the goal x and y
    this.goalX = goalX;
    this.goalY = goalY;
    
    // initialize the map with all walls
    this.initMap();
    // run our randomized depth first algorithm to create the map
    this.depthFirst(this.map[exitX][exitY]);
    
    var pathFinder = new PathFinder(this.game, 
                                    new Goal(this, this.game, goalX*this.game.dungeon.tileSize, goalY*this.game.dungeon.tileSize),
                                    new Goal(this, this.game, exitX*this.game.dungeon.tileSize, exitY*this.game.dungeon.tileSize)),
    path = pathFinder.findPath();
    
    // connect any 'close' points
   // this.simplifyMap(this.map);
    
    // clear the hero's path to the goal to ensure that it is reachable
    if (path) {
        this.clearPath(path);
        // recursively remove all lonely walls to make the map more aesthetically pleasing
        this.removeAllLonelyWalls(3);
    }

    // if the map and path are good to go, then return the map, else repeat the process all over
    if (this.isMapGood() && path) {
        return this.map;
    }

    return this.generateDungeon(exitX, exitY, goalX, goalY);
}


// clear the hero's path
RandomizeDungeon.prototype.clearPath = function(path) {
    // consider each of the path
    path.forEach(function(node, index) {
        var vertex = this.map[node.x][node.y];
        vertex.type = 'F';
        // make the vertices around the original vertex empty space if applicable
        this.clearSurroundings(vertex);
       
    }, this);
}

/*RandomizeDungeon.prototype.widenPath = function(vertex, dOne, dTwo) {
    var nOne = null,
        nTwo = null,
        vOne = null,
        vTwo = null;
        
    // now compare west and east
    nOne = this.getNeighborCoords(dOne, vertex);
    nTwo = this.getNeighborCoords(dTwo, vertex);
    
    // boundary cases: what if the wall is valid but
    // it is right next to the game boundary?
    if ((this.isValidVertex(nOne.x, nOne.y) || this.isGameBoundary(nOne.x, nOne.y)) &&
        (this.isValidVertex(nTwo.x, nTwo.y) || this.isGameBoundary(nTwo.x, nTwo.y))) {
            
        vOne = this.map[nOne.x][nOne.y];
        vTwo = this.map[nTwo.x][nTwo.y];

        // if they are both walls, change that
        if (vOne.type === 'W' && vTwo.type === 'W') {
            // if it is a game boundary, don't make it a wall
            vOne.type = this.isGameBoundary(nOne.x, nOne.y) ? 'W' : 'F';
            vTwo.type = this.isGameBoundary(nTwo.x, nTwo.y) ? 'W' : 'F';
            this.numFreeSpace += 2; // *CHANGE*
       }
    }
}*/

/*RandomizeDungeon.prototype.clearSurroundings = function(vertex) {
    var neighbors = ['N', 'S', 'W', 'E'],
        nCoords = null,
        neighbor = null;
        
    for (var i = 0; i < neighbors.length; ++i) {
        // get the neighbor coordinates
        nCoords = this.getNeighborCoords(neighbors[i], vertex);
        
        // if it is a valid vertex and not a game coordinate
        if (this.isValidVertex(nCoords.x, nCoords.y) && !this.isGameBoundary(nCoords.x, nCoords.y)) {
            // make it free space
            this.map[nCoords.x][nCoords.y].type = 'F';
            ++this.numFreeSpace;
        }
    }
}*/

RandomizeDungeon.prototype.shuffleNeighbors = function(array) {
    for (var i = 0; i < array.length - 1; ++i) {
        var k = i + Math.floor(Math.random()*(array.length - i)),
            temp = array[k];
            
        // swap
        array[k] = array[i];
        array[i] = temp;
    }
    
    return array;
}

// returns the x and y coordinates of the neighbor at the given direction;
// optional argument: distance (default is 1)
RandomizeDungeon.prototype.getNeighborCoords = function(direction, vertex, distance) {
    // set the default value of the argument
    distance = typeof distance === 'undefined' ? 1 : distance;
    
    var x = vertex.x,
        y = vertex.y;
        
    switch (direction) {
        case 'N':
            y += -distance;
            break;
        case 'S':
            y += distance;
            break;
        case 'W':
            x += -distance;
            break;
        case 'E':
            x += distance;
            break;
    }
    
    return {
        x: x,
        y: y
    };
}

// core of our algorithm
RandomizeDungeon.prototype.depthFirst = function(vertex) {
    // create an array of neighbors of the vertex with their x and y
    var neighbors = ['N', 'S', 'W', 'E'],
        neighbor = null; // will hold the neighboring vertex

    // shuffle the neighbors to prevent any bias toward one direction
    neighbors = this.shuffleNeighbors(neighbors);

    // iterate over the shuffled neighbors
    for (var i = 0; i < neighbors.length; ++i) {
        // coordinates of the neighbor currently being considered
        var neighborCoords = this.getNeighborCoords(neighbors[i], vertex),
            x = neighborCoords.x,
            y = neighborCoords.y;

        // if the coordinates are valid and the neighbor has not been visited...
        if (this.isValidVertex(x, y) && !(neighbor = this.map[x][y]).visited) {
            // finally, modify the vertex that we started with
            vertex.visited = true;
            vertex.type = 'F';

            if (x === this.goalX && y === this.goalY) {
                this.visitedGoal = true;
            }
            
            // the map is too 'open' if we consider all ways, so stop recursing after we have considered one
            // random neighbor; but at the same time, make sure we can get the to the goal
            if (++vertex.visitedNeighbors <= this.NEIGHBORS_VISITED_THRESHOLD || !this.visitedGoal) {
                // recursive call with the neighbor as argument
                this.depthFirst(neighbor);
            }
        }
    }
}

/*
 * Alternative Dungeon Building Algorithm
 * Generates a map with rooms connected by corridors
 * rather than a cave-like map as done above
*/

// Helper Room class 
function Room(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

// returns whether the room passed in as an argument is intersecting with this room
Room.prototype.isIntersecting = function(room) {
    // take advantage of our helper Rectangle class as defined in algorithms.js
    var rect1 = new Rectangle(this.x, this.x + this.width, this.y, this.y + this.height),
        rect2 = new Rectangle(room.x, room.x + room.width, room.y, room.y + room.height);
    
    return rect1.isIntersecting(rect2);
}

// returns whether the given x and y coordinates are on the boundary of the room
Room.prototype.isBoundary = function(x, y) {
    if ((x >= this.x && x <= this.x + this.width - 1 && (y === this.y || y === this.y + this.height - 1)) ||
        (y >= this.y && y <= this.y + this.height - 1 && (x === this.x || x === this.x + this.width - 1))) {
            return true;
    }
    
    return false;
}

function RandomizeDungeon(game, numTilesX, numTilesY) {
    this.game = game;
    this.numTilesX = numTilesX;
    this.numTilesY = numTilesY;
    this.rooms = [] // list containing the rooms in the map (Room objects)
    this.map = [[]] // multi-dimensional array to keep track of the map's contents
    this.roomCount = 6; // number of rooms in the map
    this.minRoomWidth = 10;
    this.maxRoomWidth = 14;
    this.minRoomHeight = 10;
    this.maxRoomHeight = 14;
    this.numGenTries = 0;
    this.maxGenTries = 1e3;
    this.roomCorridorOffset = 3;
    this.doorSize = 1;
    this.corridorSpace = 2;
    
    // initialize the map
    this.initMap();
}

// initialize the map with walls
// returns nothing
RandomizeDungeon.prototype.initMap = function() {
    this.map = [[]];
    
    for (var i = 0; i < this.numTilesX; ++i) {
        this.map[i] = [];
        for (var j = 0; j < this.numTilesX; ++j) {
            // make it a wall
            this.map[i][j] = new Vertex(i, j, 'W');
        }
    }
}

// returns whether the given x and y is located in a room
RandomizeDungeon.prototype.isNotInsideRoom = function(r, x, y) {
  //  for (var i = 0; i < this.rooms.length; ++i) {
    //    var r = this.rooms[i];
        
        if (r.x >= x && x <= r.x + r.width && 
            r.y >= y && y <= r.y + r.height) {
 
            return false;
        }
    
    return true;
}

// returns whether the points are on the game's boundary
RandomizeDungeon.prototype.isGameBoundary = function(x, y) {
    return ((x === 0 || x === this.width - 1)  && (0 <= y && y < this.height)) || // left and right sides
           ((0 <= x && x < this.width) && (y === 0 || (this.height - 3 <= y && y <= this.height - 1))); // top and bottom
               
}

// returns whether the given coordinates is within bounds
RandomizeDungeon.prototype.isValidVertex = function(x, y) {
    return x >= 1 && x <= this.width - 2 &&
           y >= 1 && y <= this.height - 3;
}

// Principal function responsible for generating rooms
RandomizeDungeon.prototype.generateRooms = function() {
    var numTries = 0; // keep track of how many times we are trying to place a room
    
    while (this.rooms.length < this.roomCount && ++numTries < 1e3) {
        // randomly generate the room's specifications
        var x = Math.ceil(Math.random()*(this.numTilesX - this.maxRoomWidth)),
            y = Math.ceil(Math.random()*(this.numTilesY - this.maxRoomHeight)),
            roomWidth = Math.floor(Math.random()*(this.maxRoomWidth - this.minRoomWidth + 1) + this.minRoomWidth),
            roomHeight = Math.floor(Math.random()*(this.maxRoomHeight - this.minRoomHeight + 1) + this.minRoomHeight);
            
        var room = new Room(x, y, roomWidth, roomHeight);
                
        // check to see whether this proposed slot is free
        if (this.isSlotFree(room)) {
            // if it is free, then modify the map object to reflect the room's existence
            this.placeRoom(room);
            
            // add this room to the list of rooms
            this.rooms.push(room);
            
            // now connect the room to the previous room
            // OR.... maybe generate all the rooms, and THEN connect them (this is a better idea)
            
            // since we have succeeded in finding a position for a room, reset the number of tries
            numTries = 0;              
        }
    }
    
    // if the number of rooms generated is not sufficient, then regenerate the rooms 
    if (this.rooms.length < this.roomCount && ++this.numGenTries < this.maxGenTries) {
        this.rooms = [];
        this.initMap();
        return this.generateRooms();
    }
    
    // now connect the rooms with corridors
    this.connectRooms();
    
    return this.map;
}

RandomizeDungeon.prototype.isSlotFree = function(room) {
    if (this.rooms.length > 0) {
        for (var i = 0; i < this.rooms.length; ++i) {
           if (this.rooms[i].isIntersecting(room)) {
               // there is overlap with one of the already existing rooms => return false
               return false;
           }
        }
    }
    
    return true;
}

RandomizeDungeon.prototype.placeRoom = function(room) {
    for (var x = room.x; x < room.x + room.width; ++x) {
        for (var y = room.y; y < room.y + room.height; ++y) { 
            // the walls of the room should be made up of walls (obviously...)
            // inside of the room should be free space
            var type = room.isBoundary(x, y) ? 'W' : 'F';
            this.map[x][y] = new Vertex(x, y, type);
        }
    }
}

// returns a random position (object pos with x, y properties) on the roomSide specified
RandomizeDungeon.prototype.getRandomDoorLocation = function(room, roomSide) {
    
    var pos = {
        x: 0,
        y: 0
    };
    
    switch (roomSide) {
        case 'top':
            pos.x = room.x + Math.ceil(Math.random()*(room.width - this.roomCorridorOffset));
            pos.y = room.y + 1;
            break;
        case 'bottom':
            pos.x = room.x + Math.ceil(Math.random()*(room.width - this.roomCorridorOffset));
            pos.y = room.y + room.height - 2;
            break;
        case 'left':
            pos.x = room.x + 1;
            pos.y = room.y + Math.ceil(Math.random()*(room.height - this.roomCorridorOffset));
            break;
        case 'right':
            pos.x = room.x + room.width - 2;
            pos.y = room.y + Math.ceil(Math.random()*(room.height - this.roomCorridorOffset));
            break;
    }
    
    return pos;
}

// pseudo-distance without the sqrt for performance
RandomizeDungeon.prototype.getPseudoDistance = function(xOne, yOne, xTwo, yTwo) {
    // sqrt() is really expensive...
    return Math.pow(xOne - xTwo, 2) + Math.pow(yOne - yTwo, 2);
}

RandomizeDungeon.prototype.getDistanceToOrigin = function(room) {
    return this.getPseudoDistance(room.x, 0, room.y, 0);
}


// args: room object
// returns: a string dictating the random side of the room
RandomizeDungeon.prototype.pickRandomSide = function(room) {
    var options = [];
    
    var breathingRoomTiles = 3;
    
    // enough space at the top of the room?
    if (room.y >= breathingRoomTiles) {
        options.push('top');
    }
    
    // enough space at the bottom of the room?
    if (room.y + room.height >= this.numTilesY - breathingRoomTiles) {
        options.push('bottom');
    }
    
    // enough space to the left?
    if (room.x >= breathingRoomTiles) {
        options.push('left');
    }
    
    if (room.x + room.width <= this.numTilesX - breathingRoomTiles) {
        options.push('right');
    }
    
    return options[Math.floor(Math.random()*options.length)];
}

RandomizeDungeon.prototype.connectRooms = function(room) {
    // the idea here is simple: we want all the rooms to be strongly connected
    // i.e. there should be a path from any room A, to any room B so that they are reachable
    // we should also connect the rooms that are closest to each other...
    // so let's take the distance of each room from (0, 0), and then sort them
    
    // implement sorted rooms functionality
    var distances = [];
     
    for (var i = 0; i < this.rooms.length; ++i) {
       this.rooms[i].distance = this.getDistanceToOrigin(this.rooms[i]);
       distances.push(this.rooms[i].distance);
    }
    
    // sort the array
    distances.sort(function (a, b) { return a-b; });
    
    // will contain a list of rooms in sorted order with respect to their distances from the origin
    var sortedRooms = [];
    
    for (var i = 0; i < distances.length; ++i) {
        for (var j = 0; j < this.rooms.length; ++j) {
            if (this.rooms[j].distance === distances[i]) {
                sortedRooms.push(this.rooms[j]);
            }
        }
    }
    
    // now let's go through the sorted rooms and connect them
    for (var i = 1; i < this.rooms.length; ++i) {
        var previousRoom = sortedRooms[i - 1],
            currentRoom = sortedRooms[i];
        
        var startSide = this.pickRandomSide(previousRoom),
            endSide = this.pickRandomSide(currentRoom);
        
        console.log(startSide);
        console.log(endSide);
            
        var startPos = this.getRandomDoorLocation(previousRoom, startSide),
            endingPos = this.getRandomDoorLocation(currentRoom, endSide);
        // now generate the corridor
        this.generateCorridor(previousRoom, startSide, startPos.x, startPos.y, endSide, endingPos.x, endingPos.y);
           
    }
    
    // finally we need to connect the hero's start position with the nearest room 
    this.game.START_HEROX
}

// function that generates the door on the side of the room specified
// returns: none
RandomizeDungeon.prototype.generateDoor = function(side, xPos, yPos) {
    // carve out the starting position
    switch (side) {
        case 'top':
        case 'bottom':
            for (var x = xPos; x < xPos + this.doorSize; ++x) {
                this.map[x][yPos].type = 'F';
            }
        break;
        
        case 'left':
        case 'right':
            for (var y = yPos; y < yPos + this.doorSize; ++y) {
                this.map[xPos][y].type = 'F';
            }
        break;
    } 
}

RandomizeDungeon.prototype.generateCorridor = function(startRoom, startSide, startX, startY, endSide, endX, endY) {
    this.generateDoor(endSide, startX, startY);
    this.generateDoor(startSide, endX, endY);
    

    var pathFinder = new PathFinder(this.game, 
                                     new Goal(this, this.game, endX*this.game.dungeon.tileSize, endY*this.game.dungeon.tileSize),
                                     new Goal(this, this.game, startX*this.game.dungeon.tileSize, startY*this.game.dungeon.tileSize));
    
    this.startRoom = startRoom;
    
    var path = pathFinder.findPath(function(x, y) {
           //return this.game.dungeon.randDungeonGen.isNotInsideRoom(this.game.dungeon.randDungeonGen.startRoom, x, y);
           return true;
    });
    
    console.log(path);
  
    for (var i = 0; i < path.length; ++i) {
       var node = path[i];
           
       this.map[node.x][node.y].type = 'F';
       
    }
}
