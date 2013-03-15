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
 * A* Code (path planning) by Cenk Baykal
 * Figured it would be good review of data structures and algorithms
 * I'm going to implement a variation of A*. Since the number of grids in
 * the game is not high (namely it is frameWidth/tileSize*frameHeight/tileSize) I am
 * going to utilize counting sort (obviously with an array) instead of a priority queue to 
 * sort the nodes and index the minimum
 * 
 */

