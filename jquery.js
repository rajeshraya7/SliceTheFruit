var playing = false;

var score;

var lives;

var step;

var action;

var fruits = ['apple', 'banana', 'cherries', 'grapes', 'mango', 'orange', 'peach', 'pear'];

$(function () {
    $("#startreset").click(function () {
        if (playing == true) {
            location.reload();
        } else {
            playing = true;
            score = 0;
            $("#scorevalue").html(score);
            $("#trialsleft").show();
            lives = 3;
            addhearts();
            $("#startreset").html("Reset Game");
            startAction();
        }
    });

    $("#fruit1").mouseover(function () {

        score++;

        $("#scorevalue").html(score);

        $("#slicingsound")[0].play();

        clearInterval(action);

        $("#fruit1").hide("explode", 500);

        setTimeout(startAction, 600);

    });

    function addhearts() {
        $("#trialsleft").empty();
        for (i = 0; i < lives; i++) {
            $("#trialsleft").append('<img src="images/heart.png" class="life">');
        }
    }

    function startAction() {
        $("#fruit1").show();
        choosefruit();
        $("#fruit1").css({
            'left': Math.round(550 * Math.random()),
            'top': -50
        })
        step = 1 + Math.round(5 * Math.random());
        action = setInterval(function () {
            $("#fruit1").css('top', $("#fruit1").position().top + step);
            if ($("#fruit1").position().top > $("#fruitscontainer").height()) {
                if (lives > 1) {
                    $("#fruit1").show();
                    choosefruit();
                    $("#fruit1").css({
                        'left': Math.round(550 * Math.random()),
                        'top': -50
                    });
                    step = 1 + Math.round(5 * Math.random());
                    lives--;
                    addhearts();
                    //hide game over box
                    $("#gameover").hide();
                } else {
                    playing = false;
                    $("#startreset").html("Start Game");
                    $("#gameover").show();
                    $("#gameover").html('<p>Game Over!</p><p>Your score is ' + score + '</p>');
                    $("#trialsleft").hide();
                    stopAction();
                }
            }
        }, 10);
    }

    function choosefruit() {
        $("#fruit1").attr('src', 'images/' + fruits[Math.round(Math.random() * 8)] + '.png');
    }

    function stopAction() {
        clearInterval(action);
        $("#fruit1").hide();
    }

});