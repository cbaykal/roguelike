function HighScores() {
    this.score = 0;
    this.init();
}

HighScores.prototype.init = function() {
    var that = this;
    $('#highScores').click(function() {
        that.addScore('Cenk', 5000); 
    }); 
}

HighScores.prototype.addScore = function(name, score) {
    this.ajaxRequest({printScores: false, name: name, score: score }, function(data) {
       alert(data);
    });
}

HighScores.prototype.getScores = function() {
    this.ajaxRequest({printScores:true}, function(data) {
        // print this data nicely
    });
}

// takes in a data object as an argument to make the AJAX request
// and a callback function to call with the data when the request returns
HighScores.prototype.ajaxRequest = function(data, callback) {
    $.ajax({
        type: 'POST',
        url: 'php/high_scores.php',
        data: data
    }).done(function(data) {
       callback(data);
    });
}
