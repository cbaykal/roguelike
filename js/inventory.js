/*
 * Handle code for player's inventory
 */

// item class
function Item(game, type, effect) {
    this.game = game;
    this.type = type;
    this.effect = effect;
    this.quantity = 1;
}

function Inventory(game) {
    // initialize dialog
    this.init(); 
    this.game = game;
    this.items = []; // an array of items (as objects)
    this.numDistinctItems = 0; // items of the same kind do not count twice toward the item count
    this.maxNumItems = 10; // maximum number of *distinct* items
}

// add item to the inventory
Inventory.prototype.addItem = function(item) {
    var inBag = this.contains(item); // is the item already in the bag?
    
    if (inBag) {
        var index = this.getItemIndex(item);
        // increase item quantity and update its display
        this.updateQuantityDisplay(index, ++this.items[index].quantity); // update the display of inventory
    } else {
        // we have already done a check for whether the inventory is full upon picking the item up,
        // so just create a new slot for the item
        this.items.push(item);
        this.addSlot(item.type); // add an actual slot for display item in the inventory
        ++this.numDistinctItems;
    }
}

// add actual slot for the item to the dialog
Inventory.prototype.addSlot = function(type) {
    this.$dialog.append('<div id="item' + this.numDistinctItems + 
                          '"><span class="quantity">1</span></div>');
    this.setBackgroundImage(type, this.numDistinctItems);
}

Inventory.prototype.contains = function(item) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].type === item.type) {
            return true;
        }
    }
    
    return false;
}

Inventory.prototype.setBackgroundImage = function(type, itemNum) {
    var src = 'url(images/';
    switch (type) {
        case 'blue_gem':
            src += 'blue_crystal32.png';
            break;
        case 'green_gem':
            src += 'green_crystal32.png';
            break;
            
    }
    
    // set the background to the correct item image
    $('#inventoryDialog > div#item' + itemNum).css("background", src + ') no-repeat');
}

Inventory.prototype.getItemIndex = function(item) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].type === item.type) {
            return i;
        }
    }
    
    return -1; // to indicate not found
}

Inventory.prototype.isFull = function() {
    return (this.numDistinctItems >= this.maxNumItems);
}

Inventory.prototype.updateQuantityDisplay = function(itemIndex, quantity) {
    // update the quantity displayed
    $('#inventoryDialog > div#item' + itemIndex + ' > .quantity').text(quantity);
}

Inventory.prototype.useItem = function(item) {
    
}

Inventory.prototype.init = function() {   
    // initialize dialog
    $('#inventoryDialog').dialog({
        autoOpen: false,
        position: {
            my: 'right top',
            at: 'right top',
            of: $('#canvas')
        },
        show: {
            effect: 'blind',
            duration: 200
        }
    });
    
    // display on click
    $('#inventory').button().click(function() {
        var $dialog = $('#inventoryDialog');
        
        if ($dialog.dialog('isOpen')) {
            $dialog.dialog('close');
        } else {
            $dialog.dialog('open');
        }
    });
    
    // for future reference
    this.$dialog = $('#inventoryDialog');
}
