/*
 * Handle code for player's inventory
 */

// item class
function Item(game, type, activateEffect) {
    this.game = game;
    this.type = type;
    this.activateEffect = activateEffect;
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
        var index = this.getItemIndexByType(item.type);
        // increase item quantity and update its display
        this.updateQuantityDisplay(item.type, ++this.items[index].quantity); // update the display of inventory
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
    this.$dialog.append('<div id="' + type + '"><span class="quantity">1</span></div>');
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

Inventory.prototype.setBackgroundImage = function(type) {
    var src = 'url(images/',
        tooltip = "";
        
    switch (type) {
        case 'blue_gem':
            src += 'blue_gem.png';
            tooltip = 'increases experience by 10';
            break;
        case 'green_gem':
            src += 'green_gem.png';
            tooltip = 'increases strength by 1';
            break;
        case 'pink_gem':
            src += 'pink_gem.png';
            tooltip = 'increase strength by 1';
            break;
        case 'red_gem':
            src += 'red_gem.png';
            tooltip = 'increases health by 10';
            break;
        case 'yellow_gem':
            src += 'yellow_gem.png';
            tooltip = 'increase strength by 1';
            break;
    }
    
    // set the background to the correct item image and the tooltip
    $('#inventoryDialog > div#' + type).css("background", src + ') no-repeat')
                                       .attr("title", tooltip);
    
    $(document).tooltip();
}

Inventory.prototype.getItemIndexByType = function(type) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].type === type) {
            return i;
        }
    }
    
    return -1; // to indicate not found
}

Inventory.prototype.isFull = function() {
    return (this.numDistinctItems >= this.maxNumItems);
}

Inventory.prototype.updateQuantityDisplay = function(type, quantity) {
    // update the quantity displayed
    $('#inventoryDialog > div#' + type + ' > .quantity').text(quantity);
}

// uses the item with the given ID
Inventory.prototype.useItem = function(itemID) {
    var item = this.items[itemID];
    
    // use the items's effect
    item.activateEffect(this.game.hero);
    
    // remove the item
    if (item.quantity === 1) {
        // need to remove it from the array and from the inventory dialog
        $('#inventoryDialog div').eq(itemID)
                                 .remove();
                                 
        this.items.splice(itemID, 1); // remove it from the array as well
        --this.numDistinctItems;
    } else {
       this.updateQuantityDisplay(this.items[itemID].type, --item.quantity);
    }
}

Inventory.prototype.init = function() {   
    var $inventoryButton = $('#inventory'),
        that = this;
        
    // initialize dialog
    $('#inventoryDialog').dialog({
        autoOpen: false,
        close: function(event, ui) {
            // stop the audio right after close to prevent 'double speech' bug
            myAudio.stop();
        },
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
    $inventoryButton.button().click(function() {
        var $dialog = $('#inventoryDialog'),
            command = "";
            
        command = $dialog.dialog('isOpen') ? 'close' : 'open';
        $dialog.dialog(command);
    });
    
    // for future reference
    this.$dialog = $('#inventoryDialog');
    
    // allow the user to use the item on click
    this.$dialog.on('click', 'div', function(e) {
        var index = that.getItemIndexByType($(this).attr('id'));
        that.useItem(index);
        e.preventDefault();
    });
    
    // text to speech for the text on the button
    $inventoryButton.focus(function() {
        myAudio.say(that.game.voice, that.game.language, $(this).text());
    });
}
