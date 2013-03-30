/*
 * Handle code for player's inventory
 */

function Inventory(game) {
    // initialize dialog
    this.init(); 
    this.game = game;
    this.numItems = 0;
}

// add item to the inventory
Inventory.prototype.addItem = function() {
    
}

Inventory.prototype.displayInventory = function() {
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
        
        if($dialog.dialog('isOpen')) {
            $dialog.dialog('close');
        } else {
            $dialog.dialog('open');
        }
    });
}
