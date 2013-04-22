/*
 * To display the player's statistics
 */

function Stats(game) {
    this.init();
    this.game = game;
    this.dialog = null;
}

Stats.prototype.init = function() {
    var $statsButton = $('#stats'),
        that = this,
        closing = false;
    
    // initialize dialog
    $('#statsDialog').dialog({
        autoOpen: false,
        close: function(event, ui) {
            // stop the audio right after close to prevent 'double speech' bug
            myAudio.stop();
        },
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
        var $dialog = $('#statsDialog'),
            command = "";
        
        command = $dialog.dialog('isOpen') ? 'close' : 'open';
        $dialog.dialog(command);
        
        // enumerate the player's characteristics
        if (command === 'open') {
            myAudio.say(that.game.voice, that.game.language, that.getSpeechString());
        }
    });
    
    // text to speech for the text on the button
    $statsButton.focus(function() {
        myAudio.say(that.game.voice, that.game.language, $(this).text());
    });
    
    // for future reference
    this.$dialog = $('#statsDialog');
    this.$health = this.$dialog.find('#health');
    this.$experience = this.$dialog.find('#experience');
    this.$level = this.$dialog.find('#level');
    this.$strength = this.$dialog.find('#strength');
    this.$dungeonLevel = this.$dialog.find('#dungeonLevel');
    //this.$defense = this.$dialog.find('#defense');
    this.$enemiesSlain = this.$dialog.find('#enemiesSlain');
}

// returns the current 
Stats.prototype.getSpeechString = function() {
    var string = 'Health: ' + this.$health.text() + ', ' + 
                 'Experience: ' + this.$experience.text() + ', ' +
                 'Level: ' + this.$level.text() + ', ' +
                 'Strength: ' + this.$strength.text() + ', ' +
                 'Dungeon Level: ' + this.$dungeonLevel.text() + ', ' + 
                 'Enemies slain: ' + this.$enemiesSlain.text() + '.';
                 
    return this.parseString(string);
}

// parse string and replaces '/' with 'out of' to make it sound better during audio 
Stats.prototype.parseString = function(string) {
    // array of replacements
    var dictionary = [
        {oldStr: '\/', newStr: ' out of '}
    ];
    
    // iterate through the dictionary and replace the old strings with new ones
    dictionary.forEach(function(value, index) {
        // run a global regular expression
        var regExp = new RegExp(value.oldStr, 'g');
        string = string.replace(regExp, value.newStr);
        
    }, this);
    
    return string;
}

// update the statistics
Stats.prototype.update = function() {
    var hero = this.game.hero;
    
    // update the statistics
    this.$health.text(Math.round(hero.health) + '/100'); // make sure it is an integer value
    this.$experience.text(hero.experience + '/' + Math.round(hero.neededExperienceToLevel));
    this.$level.text(hero.level);
    this.$strength.text(hero.strength);
    this.$dungeonLevel.text(hero.game.dungeonLevel);
    //this.$defense.text(hero.defense);
    this.$enemiesSlain.text(hero.enemiesSlain);
}
