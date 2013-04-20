/* Experiment with on-demand speech synthesis

Gary Bishop January 2012
*/

(function() {
    var audio = null, // the html5 audio node will go here if we use it
        audioQueue = [];
    function initialize () {
        if (audio) return;

        // use html5 audio if it is available and if it supports mp3. I'd rather use ogg but I need mp3 for
        // flash fallback anyway
        // to make it work on the iPad I apparently have to load a legal mp3. Use this one for now.
        if (typeof(Audio) == 'function') {
            audio = new Audio();
            if (audio && audio.canPlayType &&
                ("no" != audio.canPlayType("audio/mpeg")) &&
                ("" !== audio.canPlayType("audio/mpeg"))) {
                $('.flashplayer').remove();
                // we appear to have html5 audio so call load which is required on the iPod.
                audio.load();
                return;
            }
        }
        audio = 'flash';
        AudioPlayer.setup("audio-player/player.swf", { width: 0 });
    }

    function speechUrl(voice, language, text) {
        // voice is child, female, or male
        // language is en, fr, de, etc.
        // text is the text you want it to say
        var key = Crypto.MD5(voice + language + text);
        var mp3 = 'http://tarheelreader.org/speech/' + key + '.mp3?' +
                  'voice=' + voice + '&language=' + language + '&text=' + encodeURIComponent(text);
        return mp3;
    }

    function say(voice, language, text) {
        var mp3 = speechUrl(voice, language, text);
        playAudio(mp3);
    }
    
    function playAudio(mp3) {
        //console.log('play', mp3);
        if (!audio) {
            initialize();
        }
        
        if (audio && audio != 'flash') {
            audio.src = mp3;
            audio.load();
            audio.play();
        } else if (audio == 'flash') {
            AudioPlayer.embed("flashplayer", {soundFile: encodeURIComponent(mp3), autostart: 'yes'});
        }
    }

    function stopAudio() {
        if (audio && audio != 'flash') {
            audio.pause();
        } else {
            AudioPlayer.close('flashplayer'); // this may not work
        }
    }

    window.myAudio = {
        initialize: initialize,
        speechUrl: speechUrl,
        say: say,
        play: playAudio,
        stop: stopAudio
    };
})();
