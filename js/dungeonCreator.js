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

// arguments: width and height of the grid-style map
function RandomizeDungeon(width, height) {
    this.width = width;
    this.height = height;
    this.map = [[]]; // multi-dimensional array to keep track of map
    this.numFreeSpace = 0; // keep track of the number of free space in the map
    this.NEIGHBORS_VISITED_THRESHOLD = 1; // so that we avoid too many empty spaces with no walls
    this.visitedGoal = false; // we have not yet visited the goal vertex
    this.TOTAL_TILES = width*height;
    this.THRESHOLD_NEIGHBORS_EMPTY = 4; // used for simplifying the map 
    this.MIN_WALL_NUM = Math.round(this.TOTAL_TILES*(1/5));
    this.MAX_WALL_NUM = Math.round(this.TOTAL_TILES*(1/3));
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
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map[i].length; ++j) {
            if (this.map[i][j].type === 'W') {
                this.removeLonelyWall(i, j);
            } else {
                ++this.numFreeSpace;
            }
        }
    }
    
    // now connect any paths
    for (var i = 0; i < this.map.length; ++i) {
        for (var j = 0; j < this.map[i].length; ++j) {
            
        }
    }
    
    return this.map;
}

// remove lonely wall if appropriate
RandomizeDungeon.prototype.removeLonelyWall = function(x, y) {
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
    if (numEmpty >= this.THRESHOLD_NEIGHBORS_EMPTY) {
        // make it free space instead of a wall
        this.map[x][y].type = 'F';
        ++this.numFreeSpace;
    }
}


RandomizeDungeon.prototype.connectCorridor = function(x, y) {
    
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
    // simplify the map
    this.simplifyMap(this.map);
    
    // if the map is good, then return it, else repeat the process all over
    if (this.isMapGood()) {
        return this.map;
    }

    return this.generateDungeon(exitX, exitY, goalX, goalY);
}

// returns whether the given coordinates is within bounds
RandomizeDungeon.prototype.isValidVertex = function(x, y) {
    return x >= 1 && x <= this.width - 2 &&
           y >= 1 && y <= this.height - 3;
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
            y += -1;
            break;
        case 'S':
            y += 1;
            break;
        case 'W':
            x += -1;
            break;
        case 'E':
            x += 1;
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
