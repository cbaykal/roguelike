/*
 * To display events
 */

function MessageLog(voice, language) {
    this.init();
    this.dialog = null;
    this.voice = voice;
    this.language = language;
    console.log('Initializing MessageLog with: ' + voice + ', ' + language);
}

MessageLog.prototype.init = function() {
        // initialize dialog
    $('#messagesDialog').dialog({
        autoOpen: false,
        position: {
            my: 'center top',
            at: 'center top',
            of: $('#canvas'),
            collision: "flipfit"
        },
        show: {
            effect: 'blind',
            duration: 200
        }
    });
    
    $('#messages').button().click(function() {
        var $dialog = $('#messagesDialog');
        if($dialog.dialog('isOpen')) {
            $dialog.dialog('close');
        } else {
            $dialog.dialog('open');
        }
    });
    
    this.$dialog = $('#messagesDialog');
}

// returns the current time in the format hh:mm:ss
MessageLog.prototype.getCurrentTime = function() {
    var date = new Date(),
        hours = date.getHours() > 9 ? date.getHours() : '0' + date.getHours(),
        minutes = date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes(),
        seconds = date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds();
        
    return '<span class="time">' + hours + ':' + minutes + ':' + seconds + '</span>';
}

MessageLog.prototype.log = function(msg) {
    myAudio.say(this.voice, this.language, msg);
    this.$dialog.prepend('<p>' + this.getCurrentTime() + ' ' + msg + '</p>');
}
