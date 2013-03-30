/*
 * To display the player's statistics
 */

function Stats(game) {
    this.init();
    this.game = game;
    this.dialog = null;
}

Stats.prototype.init = function() {
    // initialize dialog
    $('#statsDialog').dialog({
        autoOpen: false,
        position: {
            my: 'left top',
            at: 'left top',
            of: $('#canvas'),
            collision: "flipfit"
        },
        show: {
            effect: 'blind',
            duration: 200
        }
    });
    
    $('#stats').button().click(function() {
        var $dialog = $('#statsDialog');
        if($dialog.dialog('isOpen')) {
            $dialog.dialog('close');
        } else {
            $dialog.dialog('open');
        }
    });
    
    // for future reference
    this.$dialog = $('#statsDialog');
    this.$health = this.$dialog.find('#health');
    this.$experience = this.$dialog.find('#experience');
    this.$level = this.$dialog.find('#level');
    this.$strength = this.$dialog.find('#strength');
    //this.$defense = this.$dialog.find('#defense');
    this.$enemiesSlain = this.$dialog.find('#enemiesSlain');
}

// update the statistics
Stats.prototype.update = function() {
    var hero = this.game.hero;
    
    // update the statistics
    this.$health.text(Math.round(hero.health) + '/100'); // make sure it is an integer value
    this.$experience.text(hero.experience + '/' + hero.neededExperienceToLevel);
    this.$level.text(hero.level);
    this.$strength.text(hero.strength);
    //this.$defense.text(hero.defense);
    this.$enemiesSlain.text(hero.enemiesSlain);
}
