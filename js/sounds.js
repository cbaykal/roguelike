/*
 * Testing out webkitAudioContext
 * DON'T INCLUDE IN PROJECT
 */

var context;

window.addEventListener('load', function() {
    try {
        context = new webkitAudioContext();
        console.log('New Version');
    } catch(e) {
        alert('Your browser does not support the Web Audio API');
    }
    
    loadSound('sounds/monster.wav', function(buffer) {
        console.log('playing monster sound');
        var source = context.createBufferSource(),
            panner = context.createPanner();
        
        panner.coneOuterGain = 1;
        panner.coneOuterAngle = 180;
        panner.coneInnerAngle = 0;
        panner.connect(context.destination);
        
        source.buffer = buffer;
        source.loop = true;
        source.connect(panner);
        source.noteOn(0);
        panner.setPosition(0, 0, 0);
    });
}, false);

function decodeData(audioData, callback) {
    context.decodeAudioData(audioData, function(buffer) {
        callback(buffer);
    });
}

function loadSound(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    
    request.addEventListener('load', function() {
        // decode the ArrayBuffer
        decodeData(this.response, callback);
    }, false);
    
    // send the request
    request.send();
}
