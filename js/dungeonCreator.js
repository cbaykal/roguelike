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
    this.game = game;
    this.randDungeon = randDungeon;
    this.x = x;
    this.y = y;
}

Goal.prototype.isPathClear = function(x, y) {
    var x = Math.floor(x/this.game.dungeon.tileSize),
        y = Math.floor(y/this.game.dungeon.tileSize);
    
    if (this.randDungeon.isValidVertex(x, y) && this.randDungeon.map[x][y].type === 'F') {
        return true;
    }
    
    console.log('returning false');
    return false;
}

// arguments: width and height of the grid-style map
function RandomizeDungeon(game, width, height) {
    this.game = game;
    this.width = width;
    this.height = height;
    this.map = [[]]; // multi-dimensional array to keep track of map
    this.numFreeSpace = 0; // keep track of the number of free space in the map
    this.NEIGHBORS_VISITED_THRESHOLD = 1; // so that we avoid too many empty spaces with no walls
    this.visitedGoal = false; // we have not yet visited the goal vertex
    this.TOTAL_TILES = width*height;
    this.THRESHOLD_NEIGHBORS_EMPTY = 3; // used for simplifying the map 
    this.MIN_WALL_NUM = Math.round(this.TOTAL_TILES*(1/2));
    this.MAX_WALL_NUM = Math.round(this.TOTAL_TILES*(3/4));
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

// simplify map and make it aesthetically pleasing: 
// remove any 'lonely' pieces of wall and connect any possible corridors
RandomizeDungeon.prototype.simplifyMap = function(map) {
    // first remove walls with 3 neighbors empty
    this.removeAllLonelyWalls(3);
    // then remove any remaining completely lonely walls (4 neighbors empty)
    this.removeAllLonelyWalls(4);
    
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
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map[i].length; ++j) {
            if (this.map[i][j].type === 'W') {
                this.removeLonelyWall(i, j, threshold);
            } else {
                ++this.numFreeSpace;
            }
        }
    }
}

// remove lonely wall if appropriate
RandomizeDungeon.prototype.removeLonelyWall = function(x, y, threshold) {
    var vertex = this.map[x][y],
        neighbors = ['N', 'S', 'W', 'E'],
        numEmpty = 0; // number of free space around the wall
                
    for (var k = 0; k < neighbors.length; ++k) {
        var nCoords = this.getNeighborCoords(neighbors[k], vertex);
        
        // is the neighbor a free space?
        if (this.isValidVertex(nCoords.x, nCoords.y) && this.map[nCoords.x][nCoords.y].type === 'F') {
            ++numEmpty;
        }
    }
    
    // finally, if the number of spaces was above threshold, remove the wall
    if (numEmpty >= threshold) {
        // make it free space instead of a wall
        this.map[x][y].type = 'F';
        ++this.numFreeSpace;
    }
}

RandomizeDungeon.prototype.connectCorridor = function(x, y) {
    var vertex = this.map[x][y],
        neighbors = ['N', 'S', 'W', 'E'];
        
    for (var k = 0; k < neighbors.length; ++k) {
        // get the coordinates of the neighbors 2 tiles away
        var nCoords = this.getNeighborCoords(neighbors[k], vertex, 1),
            nnCoords = this.getNeighborCoords(neighbors[k], vertex, 2); // neighbor of neighbor
            
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
    
    // simplify the map
    this.simplifyMap(this.map);
    
    // clear the hero's path to the goal to ensure that it is reachable
    if (path) {
        this.clearPath(path);
    }

    // if the map and path are good to go, then return the map, else repeat the process all over
    if (this.isMapGood() && path) {
        return this.map;
    }

    return this.generateDungeon(exitX, exitY, goalX, goalY);
}

// returns whether the given coordinates is within bounds
RandomizeDungeon.prototype.isValidVertex = function(x, y) {
    return x >= 1 && x <= this.width - 2 &&
           y >= 1 && y <= this.height - 3;
}

// clear the hero's path
RandomizeDungeon.prototype.clearPath = function(path) {
    // consider each of the path
    path.forEach(function(node, index) {
        var vertex = this.map[node.x][node.y];
        vertex.type = 'F';
        
        // widen north and south if necessary
        this.widenPath(vertex, 'N', 'S');
        // widen west and east if necessary
        this.widenPath(vertex, 'W', 'E');
       
    }, this);
}

RandomizeDungeon.prototype.widenPath = function(vertex, dOne, dTwo) {
    var nOne = null,
        nTwo = null,
        vOne = null,
        vTwo = null;
        
    // now compare west and east
    nOne = this.getNeighborCoords(dOne, vertex);
    nTwo = this.getNeighborCoords(dTwo, vertex);
    
    // boundary cases: what if the wall is valid but
    // it is right next to the game boundary?
    if (this.isValidVertex(nOne.x, nOne.y) && this.isValidVertex(nTwo.x, nTwo.y)) {
        vOne = this.map[nOne.x][nOne.y];
        vTwo = this.map[nTwo.x][nOne.y];
        console.log('here');
        // if they are both walls, change that
        if (vOne.type === 'W' && vTwo.type === 'W') {
            console.log('widening path');
            // make them both empty spaces
            vOne.type = 'F';
            vTwo.type = 'F';
            this.numFreeSpace += 2;
        }
    }
}

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