// Game Variables
var playing = false;
var paused = false;
var score;
var lives;
var step;
var action;
var combo = 0;
var maxCombo = 0;
var difficulty = 'medium';
var currentMultiplier = 1;
var slowMoActive = false;
var shieldActive = false;
var doublePointsActive = false;
var fruitsFrozen = {};
var difficultySettings = {
    easy: { initialSpeed: 1, maxSpeed: 3, lives: 5, spawnRate: 15 },
    medium: { initialSpeed: 2, maxSpeed: 5, lives: 3, spawnRate: 10 },
    hard: { initialSpeed: 4, maxSpeed: 8, lives: 2, spawnRate: 5 }
};

var fruits = [
    { name: 'apple', points: 10 },
    { name: 'cherries', points: 15 },
    { name: 'grapes', points: 12 },
    { name: 'mango', points: 20 },
    { name: 'orange', points: 15 },
    { name: 'peach', points: 18 },
    { name: 'pear', points: 14 },
    { name: 'watermelon', points: 25 }
];

var powerups = [
    { name: 'slowmo', duration: 5000, effect: 'slowMo' },
    { name: 'shield', duration: 8000, effect: 'shield' },
    { name: 'doublepoints', duration: 6000, effect: 'doublePoints' }
];

$(function () {
    // Leaderboard functions
    function loadLeaderboard() {
        var scores = localStorage.getItem('sliceTheFruitScores');
        return scores ? JSON.parse(scores) : [];
    }

    function saveScore(scoreValue, diff) {
        var scores = loadLeaderboard();
        scores.push({
            score: scoreValue,
            difficulty: diff,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10);
        localStorage.setItem('sliceTheFruitScores', JSON.stringify(scores));
    }

    function displayLeaderboard() {
        var scores = loadLeaderboard();
        var tbody = $('#leaderboard-body');
        tbody.empty();
        scores.forEach((s, index) => {
            tbody.append(`<tr>
                <td>${index + 1}</td>
                <td>${s.score}</td>
                <td>${s.difficulty}</td>
                <td>${s.date}</td>
            </tr>`);
        });
    }

    // Event Listeners
    $("#difficulty").change(function () {
        difficulty = $(this).val();
    });

    $("#show-leaderboard").click(function () {
        displayLeaderboard();
        $('#leaderboard-modal').addClass('active');
    });

    $('.close').click(function () {
        $('#leaderboard-modal').removeClass('active');
    });

    $('#clear-scores').click(function () {
        if (confirm('Clear all scores?')) {
            localStorage.removeItem('sliceTheFruitScores');
            displayLeaderboard();
        }
    });

    $("#pauseresume").click(function () {
        if (!playing) return;
        paused = !paused;
        if (paused) {
            $("#pauseresume").text("Resume");
            $("#pause-overlay").addClass('active');
            clearInterval(action);
        } else {
            $("#pauseresume").text("Pause");
            $("#pause-overlay").removeClass('active');
            startAction();
        }
    });

    $("#pause-overlay").click(function () {
        if (paused) {
            paused = false;
            $("#pauseresume").text("Pause");
            $("#pause-overlay").removeClass('active');
            startAction();
        }
    });
    $("#startreset").click(function () {
        if (playing == true) {
            location.reload();
        } else {
            playing = true;
            paused = false;
            score = 0;
            combo = 0;
            currentMultiplier = 1;
            fruitsFrozen = {};
            clearPowerups();
            $("#scorevalue").html(score);
            $("#combovalue").html(combo);
            $("#pauseresume").text("Pause");
            $("#trialsleft").show();
            lives = difficultySettings[difficulty].lives;
            addhearts();
            $("#startreset").html("Reset Game");
            startAction();
        }
    });

    $("#fruit1").on('mouseover', function () {
        if (!playing || paused) return;
        hitFruit();
    });

    // Touch support
    $("#fruit1").on('touchstart', function () {
        if (!playing || paused) return;
        hitFruit();
        return false;
    });

    function hitFruit() {
        var frozenClicks = fruitsFrozen['fruit1'] || 0;
        if (frozenClicks > 0) {
            fruitsFrozen['fruit1'] = frozenClicks - 1;
            if (frozenClicks === 1) {
                sliceFruit();
            }
        } else {
            sliceFruit();
        }
    }

    function sliceFruit() {
        var isBomb = $("#fruit1").hasClass('bomb');

        if (isBomb) {
            playSound('bombsound');
            if (shieldActive) {
                shieldActive = false;
                updatePowerupDisplay();
            } else {
                if (lives > 1) {
                    lives--;
                } else {
                    endGame();
                    return;
                }
            }
        } else {
            var points = 10;
            $("#fruit1").find('.data').each(function () {
                points = parseInt($(this).data('points')) || 10;
            });
            score += Math.floor(points * currentMultiplier);
            combo++;
            maxCombo = Math.max(maxCombo, combo);

            if (combo % 5 === 0) {
                playSound('combosound');
            }

            if (Math.random() < 0.15) {
                applyRandomPowerup();
            }
        }

        playSound('slicingsound');
        clearInterval(action);
        createParticles($("#fruit1").position());
        $("#fruit1").hide("explode", 500);
        updateUI();
        addhearts();
        setTimeout(startAction, 600);
    }

    function applyRandomPowerup() {
        var powerup = powerups[Math.floor(Math.random() * powerups.length)];
        playSound('powerupsound');

        clearPowerups();

        switch (powerup.effect) {
            case 'slowMo':
                slowMoActive = true;
                setTimeout(() => {
                    slowMoActive = false;
                    updatePowerupDisplay();
                }, powerup.duration);
                break;
            case 'shield':
                shieldActive = true;
                setTimeout(() => {
                    shieldActive = false;
                    updatePowerupDisplay();
                }, powerup.duration);
                break;
            case 'doublePoints':
                doublePointsActive = true;
                currentMultiplier = 2;
                setTimeout(() => {
                    doublePointsActive = false;
                    currentMultiplier = 1;
                    updatePowerupDisplay();
                }, powerup.duration);
                break;
        }
        updatePowerupDisplay();
    }

    function clearPowerups() {
        slowMoActive = false;
        shieldActive = false;
        doublePointsActive = false;
        currentMultiplier = 1;
    }

    function updatePowerupDisplay() {
        var active = [];
        if (slowMoActive) active.push('🐢 Slow-Mo');
        if (shieldActive) active.push('🛡️ Shield');
        if (doublePointsActive) active.push('2x Points');
        $("#powerupinfo").html(active.length > 0 ? active.join(' | ') : 'None');
    }

    function createParticles(position) {
        var container = $('#particle-container');
        var particleCount = 8;
        for (var i = 0; i < particleCount; i++) {
            var angle = (Math.PI * 2 * i) / particleCount;
            var tx = Math.cos(angle) * 100;
            var ty = Math.sin(angle) * 100;
            var particle = $('<div class="particle">✨</div>');
            particle.css({
                left: position.left + 40 + 'px',
                top: position.top + 40 + 'px',
                '--tx': tx + 'px',
                '--ty': ty + 'px'
            });
            container.append(particle);
            setTimeout(() => particle.remove(), 600);
        }
    }

    function playSound(soundId) {
        try {
            $("#" + soundId)[0].currentTime = 0;
            $("#" + soundId)[0].play().catch(e => console.log('Sound play failed:', e));
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    function addhearts() {
        $("#trialsleft").empty();
        for (var i = 0; i < lives; i++) {
            $("#trialsleft").append('<img src="images/heart.png" class="life">');
        }
    }

    function updateUI() {
        $("#scorevalue").html(score);
        $("#combovalue").html(combo);
    }

    function startAction() {
        if (paused) return;

        $("#fruit1").show();
        var isBomb = Math.random() < 0.1;
        var isFrozen = Math.random() < 0.08;
        choosefruit(isBomb, isFrozen);

        $("#fruit1").css({
            'left': Math.round(550 * Math.random()),
            'top': -50
        });

        var settings = difficultySettings[difficulty];
        var baseStep = settings.initialSpeed + Math.round(settings.maxSpeed * Math.random());
        step = slowMoActive ? baseStep * 0.5 : baseStep;

        action = setInterval(function () {
            if (paused) return;

            var currentStep = slowMoActive ? step * 0.5 : step;
            $("#fruit1").css('top', $("#fruit1").position().top + currentStep);

            if ($("#fruit1").position().top > $("#fruitscontainer").height()) {
                combo = 0;
                updateUI();

                if (lives > 1) {
                    $("#fruit1").show();
                    choosefruit();
                    $("#fruit1").css({
                        'left': Math.round(550 * Math.random()),
                        'top': -50
                    });
                    lives--;
                    addhearts();
                    $("#gameover").hide();
                } else {
                    endGame();
                }
            }
        }, 10);
    }

    function choosefruit(isBomb, isFrozen) {
        $("#fruit1").removeClass('bomb frozen');
        fruitsFrozen['fruit1'] = 0;

        if (isBomb) {
            $("#fruit1").addClass('bomb');
            $("#fruit1").css('font-size', '60px');
            $("#fruit1").html('💣');
        } else {
            var fruit = fruits[Math.floor(Math.random() * fruits.length)];
            $("#fruit1").attr('src', 'images/' + fruit.name + '.png');
            $("#fruit1").css('font-size', '40px');
            $("#fruit1").removeAttr('data-points');

            if (isFrozen) {
                $("#fruit1").addClass('frozen');
                fruitsFrozen['fruit1'] = 2;
            }
        }
    }

    function endGame() {
        playing = false;
        paused = false;
        saveScore(score, difficulty);
        $("#startreset").html("Start Game");
        $("#pauseresume").text("Pause");
        $("#gameover").show();
        $("#gameover").html(`
            <p>Game Over!</p>
            <p>Score: ${score}</p>
            <p>Max Combo: ${maxCombo}x</p>
            <p>Difficulty: ${difficulty.toUpperCase()}</p>
        `);
        $("#trialsleft").hide();
        stopAction();
    }

    function stopAction() {
        clearInterval(action);
        $("#fruit1").hide();
    }

});