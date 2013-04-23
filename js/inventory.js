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
    this.$dialog.append('<a class="item" tabindex = "1" id="' + type + '"><span class="quantity">1</span></a>');
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
    $('#inventoryDialog > a#' + type).css("background", src + ') no-repeat')
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
    $('#inventoryDialog > a#' + type + ' > .quantity').text(quantity);
}

// uses the item with the given ID
Inventory.prototype.useItem = function(itemID) {
    // use item and make a sound
    //ASSET_MANAGER.playSound('sounds/use_item.mp3', false);
    var item = this.items[itemID];
    
    // use the items's effect
    item.activateEffect(this.game.hero);
    
    // remove the item
    if (item.quantity === 1) {
        // need to remove it from the array and from the inventory dialog
        $('#inventoryDialog a').eq(itemID)
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
    this.$dialog.on('click', 'a', function(e) {
        var index = that.getItemIndexByType($(this).attr('id'));
        that.useItem(index);
        e.preventDefault();
    });
    
    // or alternatively, allow the user to press enter to use the item
    this.$dialog.on('keydown', 'a', function(e) {
        var keyCode = e.keyCode || e.which;
        // if enter is pressed, treat it as a click
        if (keyCode === 13) {
            $(this).click();
            e.preventDefault();
        }
    });
    
    // text to speech for items: tell the user what the item is and its effect
    this.$dialog.on('focus', 'a', function(e) {
        var $this = $(this);
        
        // title bug: for some very weird reason, the title returns undefined sometimes
        if (typeof $this.attr('title') === 'undefined') {
            $this.focus();
        }
        
        if ($this.attr('class') === 'item') {
            myAudio.say(that.game.voice, that.game.language, $this.attr('id').replace('_', ' ') + ' ' + $this.attr('title') + 
                        ', Quantity: ' + that.items[that.getItemIndexByType($this.attr('id'))].quantity);
        } 
    });
    
    // text to speech for the text on the button
    $inventoryButton.focus(function() {
        myAudio.say(that.game.voice, that.game.language, $(this).text());
    });
}
