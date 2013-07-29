/*
 * Written by Cenk Baykal - UNC CS
 * Under Dr. Bishop
 * 3/15/2013
 */

// Rectangle class for collision detection
function Rectangle(x1, x2, y1, y2) {
    this.x1 = x1; // left-most side
    this.x2 = x2; // right-most side
    this.y1 = y1; // top-most
    this.y2 = y2; // bottom-most
}

// returns whether the rectangle intersects with another one
Rectangle.prototype.isIntersecting = function(rect) {
    
    // Consider the cases of intersection
    var xOverlap = this.x1 <= rect.x2 && this.x2 >= rect.x1 ||
                   rect.x1 <= this.x2 && rect.x2 >= this.x1;
    
    var yOverlap = this.y1 <= rect.y2 && this.y2 >= rect.y1 ||
                   rect.y1 <= this.y2 && rect.y2 >= this.y1;
    
    return xOverlap && yOverlap;
}

/*
 * A* path finder implementation by Cenk Baykal
 * I'm going to implement my own simplified variation of A* given the 
 * size of the game. Can improve later on if performance is an issue
 * 
 */

// node class to store the tiles in the game
function Node(x, y, parent, g) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.g = g;
    this.h = 0;
    this.f = 0;
}

Node.prototype.setHAndUpdateF = function(h) {
    this.h = h;
    this.f = this.g + h;
}

function PathFinder(game, start, goal) {
    this.game = game;
    this.start = start;
    this.goal = goal;
    this.goalNode = null;
    this.open = [];
    this.closed = [];
    this.path = [];
    this.nodesConsidered = 0;
    this.MOVEMENT_COST = 10;
    this.HEURISTIC_MULTIPLIER = 10;
}

PathFinder.prototype.getTile = function(x, y) {
    return {
        i: Math.floor(x/this.game.dungeon.tileSize),
        j: Math.floor(y/this.game.dungeon.tileSize)
    }
}

// returns the Manhattan distance between two nodes
PathFinder.prototype.manhattanDistance = function(nodeOne, nodeTwo) {
    return Math.abs(nodeOne.x - nodeTwo.x) + Math.abs(nodeOne.y - nodeTwo.y);
}

PathFinder.prototype.getH = function(node) {
    return this.HEURISTIC_MULTIPLIER*this.manhattanDistance(node, this.goalNode);
}

// returns the node with the lowest f value where f = g + h
// since I'm not using a priority queue, I have to find the minimum
// the old fashioned way which runs in O(n)...
// Why do we return the index as well? I need the index to remove it from
// the open array with splice
// TODO: Use a priority queue instead
PathFinder.prototype.getBestNode = function() {
    var bestNode = this.open[0],
        index = 0;
    
    this.open.forEach(function(node, i) {
        if(node.f <= bestNode.f) {
            bestNode = node;
            index = i;
        }
    }, this);

    return {
        node: bestNode,
        index: index
    }
}

// function for determining whether two nodes are equal
PathFinder.prototype.areNodesEqual = function(nodeOne, nodeTwo) {
    return nodeOne.x === nodeTwo.x && nodeOne.y === nodeTwo.y;
}

// returns whether the node in question is the goal node
PathFinder.prototype.isGoalNode = function(nodeObject) {
    if(!nodeObject.node) {
        return false;
    }
    return nodeObject.node.x === this.goalNode.x && nodeObject.node.y === this.goalNode.y;
}


PathFinder.prototype.isNearGoal = function(x, y) {
    if (this.areNodesEqual(this.goalNode, new Node(x, y)) ||
        this.areNodesEqual(this.goalNode, new Node(x - 1, y)) ||
        this.areNodesEqual(this.goalNode, new Node(x + 1, y)) ||
        this.areNodesEqual(this.goalNode, new Node(x, y - 1)) ||
        this.areNodesEqual(this.goalNode, new Node(x, y + 1))) {
        return true;
    }
    
    return false;
}

// need to pay careful attention here because we don't want 
// nodes that are walls/entities, etc
PathFinder.prototype.getNeighboringNodes = function(node, isPathClearFunction) {   
    var neighbors = [], // array to keep track of the neighboring nodes
        directions = [[-1,0], [0, -1], [1, 0], [0, 1]];
    
    
    
    directions.forEach(function(direction) {
        var newX = node.x + direction[0],
            newY = node.y + direction[1];
        
        // check to see whether the path is clear
       if ((typeof isPathClearFunction !== 'undefined' && isPathClearFunction(newX, newY)) || this.goal.isPathClear(newX*this.game.dungeon.tileSize, newY*this.game.dungeon.tileSize, true, false, false) ||
            this.isNearGoal(newX, newY)){
            
            var newNode = new Node(newX, newY, node, node.g + this.MOVEMENT_COST);
            newNode.setHAndUpdateF(this.getH(newNode));
            // add it to the neighbors array
            neighbors.push(newNode);
       }
    }, this);
    
    return neighbors;
}

// check to see whether a node is in the given array
PathFinder.prototype.inArray = function(array, searchNode) {
    for (var i = 0; i < array.length; ++i) {
        var node = array[i];
        if (this.areNodesEqual(node, searchNode)) {
            return i;
        }
    }
    
    return -1;
}

// recursive algorithm to print the path
PathFinder.prototype.getPath = function(node) {
    if(node) {
        this.getPath(node.parent);
        // ignore start node
        if(!this.areNodesEqual(this.startNode, node)) { 
            this.path.unshift(node);
        } 
        //console.log(node);
    }
}

PathFinder.prototype.findPath = function(pathClearFunction) {
    // declare the goal node
    var tile = this.getTile(this.start.x, this.start.y);

    this.goalNode = new Node(tile.i, tile.j, null, 0);
    
    console.log("goal x: ", this.goalNode.x, " goal y: ", this.goalNode.y);
    
    tile = this.getTile(this.goal.x, this.goal.y);

    var startNode = new Node(tile.i, tile.j, null, 0),
        bestNode = {},
        numNodesConsidered = 0,
        success = true;
        
    this.startNode = startNode;
    // make sure we have the correct h, g, and f values
    startNode.setHAndUpdateF(this.getH(startNode));
    this.open.push(startNode);
   
    // get the node with the lowest f value and check to see
    // whether it is the goal node, if it is then we are done
    while (!this.isGoalNode( (bestNode = this.getBestNode()))) {
        //console.log(this.open);
        if (typeof bestNode.node === 'undefined') {
            // there was an error...
           //success = false;
            console.log('undefined');
            break;
        }

        // remove the node in question from the open array
        this.open.splice(bestNode.index, 1); // this is where using the node's index comes into play
        // add it to the closed array
        this.closed.push(bestNode.node);
        
        var neighbors = this.getNeighboringNodes(bestNode.node, pathClearFunction);

        for (var i = 0; i < neighbors.length; ++i) {
            var node = neighbors[i];
            var currentCost = bestNode.node.g + this.MOVEMENT_COST,
                closedIndex = this.inArray(this.closed, node),
                openIndex = this.inArray(this.open, node);
            
            // if the node is in the closed array, continue on...
            if (closedIndex !== -1) {
                continue;
            }
            
            // if the node is in the open array, but its g value is larger than current, remove it from the open array
            if (openIndex !== -1 && this.open[openIndex].g >= currentCost) {
                this.open.splice(openIndex, 1); // remove it from the open array
                
            }
            
            // if the node is now neither in open nor closed, add it to open
            if (this.inArray(this.open, node) === -1) {
                // I don't have to re-adjust g, h, or f since it was already updated in getNeighboringNodes function
                node.parent = bestNode.node;
                this.open.push(node);
            } 
        }
    } // end while
    
    if (success) {
        // get the path and return it
        this.getPath(bestNode.node);
        return this.path;
    }

    // return false to signify that there was an error
    return false;
}
