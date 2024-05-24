var difficulty = 1; //under 100 = easy, under 200 = medium, under 300 = hard
var stringDifficulty = "easy"; //Formatted string for the difficulty
var trailEnabled = false;
var inGame = false;
var currentFruit = []; //DLS: 10.2.7.67:5000
var endpoint = "http://10.2.7.67:5000/backend"; //The http endpoint used for fetching/saving global leaderboards
var scoreData = { //General score data for the round
    misses: 0,
    hits:0,
    totalPoints: 0,
    timeLeft: 0,
    requiredScore: 0,
    score: 0,
}
var fruitColor = {
    Apple: '#fff',
    Banana: '#fff',
    Watermelon: '#fff',
}

//Set most major variables that are used more than twice
var difficultySlider, difficultyPreview, cuttingBoard, fruitContainer, scoreKeeper1, timer, misses1, finalscore, finalmisses, newhighscore, currentLeaderboardMode; //Empty variables to fill in when the DOM loads

    // GUI functions \\

// Adds a little scrolling text below the score
function scoreChange(changeamt){
    var textelement = document.createElement("p");
    if (changeamt <0){
        textelement.style.color = '#ff0000';
    } else {
        changeamt = `+${changeamt}`;
        textelement.style.color = '#00ff00';
    }
    textelement.innerHTML = changeamt;
    document.getElementById("scoremodificationlist").appendChild(textelement);
    window.setTimeout(function(){
        textelement.style.opacity = '0%';
        textelement.style.height = '0px';
        textelement.style.fontSize = '0px';
        window.setTimeout(function(){
            textelement.remove();
        }, 1000);
    }, 1000);

}
// Creates a giant bubbl-y text over the playfield
function bubbleText(text, color){
    var element = document.createElement("p");
    element.className = "bubbletext";
    element.innerHTML = text;
    element.style.color = color;
    document.getElementById("scoreitems").appendChild(element);
    window.setTimeout(function(){
        element.style.rotate = '50deg';
        element.style.opacity = '0%';
        window.setTimeout(function(){
            element.style.fontSize = '0px';
            window.setTimeout(function(){
                document.getElementById("scoreitems").removeChild(element);
            }, 200)
        }, 300)
    }, 5)
}
// Updates the preview above the difficulty picker
function updateDifficultyPreview(value){
    if (value >= 250){
        difficultyPreview.innerHTML="<b>Difficulty: Hard</b><br>A fruit onslaught berates you while bombs are thrown your way in under 60 seconds";
    } else if (value > 100 && value < 250){
        difficultyPreview.innerHTML="<b>Difficulty: Medium</b><br>More fruit is thrown with the occasional bomb with a shorter time limit";
    } else {
        difficultyPreview.innerHTML="<b>Difficulty: Easy</b><br>A lax time limit and not too much fruit";
    }
}

// Updates the score, timer, and misses counters above the play field
function updateScoreGui(){
    scoreKeeper1.innerHTML = `Score: ${scoreData.score}/${scoreData.requiredScore}`;
    misses1.innerHTML = `Misses: ${scoreData.misses}`;
    timer.innerHTML = scoreData.timeLeft;
};



    // Random Functions \\
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}
// Returns a random string
function randomizeString(list){
    var limit = list.length;
    var numb = randomNumber(0, limit);
    return list[numb];
}

                // Backend stuff  \\
// Cookie functions, used for saving leaderboard data \\

function updateLeaderboard(mode){
    const leaderboardContainer = document.getElementById("leaderboardlist");
    document.getElementById(`modebtn_easy`).style.border='none';
    document.getElementById(`modebtn_medium`).style.border='none';
    document.getElementById(`modebtn_hard`).style.border='none';
    document.getElementById(`modebtn_${mode}`).style.border='1px solid #00ff00';
    currentLeaderboardMode = mode;
    leaderboardContainer.innerHTML = ""; //Clear old html
    const http = new XMLHttpRequest();
    http.open("GET", `${endpoint}/fetchleaderboard?limit=999&mode=${mode.toLowerCase()}`);
    http.send();
    http.responseType = "json";
    http.onload = () => {
        if (http.readyState == 4 && (http.status == 200 || http.status == 201)) {
            //Added score, continue
            for(let i = 0; i <http.response['data'].length; i++) {
                var node = document.createElement('li');
                node.className = 'leaderboardItem';
                node.innerHTML = `${http.response['data'][i]['user']} - ${String(http.response['data'][i]['score'])}`;
                leaderboardContainer.appendChild(node);
            };
        } else {
            alert("Unable to fetch leaderboards");
        }
    }
}

function refreshLeaderboard(){
    updateLeaderboard(currentLeaderboardMode);
}

function setCookie(cname, cvalue, minutes) {
    const d = new Date();
    d.setTime(d.getTime() + (minutes*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function submitScoreStage2(){
    var uname = document.getElementById("unameinput").value;
    document.getElementById("submit2").style.display = 'none';
    document.getElementById("unameinput").style.display ='none';
    const url = `${endpoint}/addscore?user=${uname}&score=${String(scoreData.score)}&mode=${stringDifficulty.toLowerCase()}`;
    const http = new XMLHttpRequest();
    http.open("POST", url);
    http.send();
    http.responseType = "json";
    http.onload = () => {
        if (http.readyState == 4 && (http.status == 200 || http.status == 201)) {
            //Added score, continue
            alert("Your score was submitted");
        } else {
            alert("Unable to submit your score.");
        }
    }
};

//Checks with the backend if the user exists
function statSumbitScore(){
    var username = document.getElementById("unameinput");
    username.style.display = 'block';
    document.getElementById("submit1").style.display = 'none';
    document.getElementById("submit2").style.display = 'block';
};

    // Fruit movement and hitreg \\

// This computes the path the fruit should go on to get to the end pos
// Positions are the x coords it should end up at
function computeMovement(startpos, endpos, velocity, direction){
    var movementPath = []; // Make an array for holding the instructions
    var skipDistance = velocity;
    var currentx = startpos;
    var currenty = 0;
    if (direction == "right"){
        for (var i = 0; i < velocity*10; i++){
            skipDistance-=0.07;
            currentx+=skipDistance/2;
            currenty+=skipDistance;
            movementPath.push({x:currentx, y:currenty});
        };
        //Done with moving up, now go down
        for (var i = 0; i < velocity*10; i++){
            skipDistance+=0.07;
            currentx+=skipDistance/2;
            currenty-=skipDistance;
            movementPath.push({x:currentx, y:currenty});
        };
    } else {
        for (var i = 0; i < velocity*10; i++){
            skipDistance-=0.07;
            currentx-=skipDistance/2;
            currenty+=skipDistance;
            movementPath.push({x:currentx, y:currenty});
        };
        //Done with moving up, now go down
        for (var i = 0; i < velocity*10; i++){
            skipDistance+=0.07;
            currentx-=skipDistance/2;
            currenty-=skipDistance;
            movementPath.push({x:currentx, y:currenty});
        };
    }
    return movementPath;
};
function hitSuccess(fruit){
    if (fruit.getAttribute('hit') != "HIT"){
        scoreData.hits+=1;
        scoreData.score += Math.floor(difficulty);
        scoreChange(difficulty);
        updateScoreGui();

        fruit.setAttribute("hit", "HIT");
        fruit.src = `/static/Assets/Fruit/Cut_${fruit.getAttribute('ftype')}.svg`;
        // Splat effect code
        var div = document.createElement("div");
        div.className = `splat-${fruit.getAttribute("ftype")}`;
        setFruitPosition(div, fruit.getAttribute('x'), fruit.getAttribute('y'));
        fruitContainer.appendChild(div);
        window.setTimeout(function(){
            div.style.opacity = '0%';
            window.setTimeout(function(){
                div.remove();
            }, 300)
        }, 2500)
    }
};
// This sets a fruit's position to a given x/y coord + an offset
function setFruitPosition(element, x, y){
    element.style.left = (`calc(10.6% + ${x/10}em)`);
    element.style.bottom = (`calc(9.1em + ${y/10}em)`);
    element.setAttribute('x', x);
    element.setAttribute('y', y);
};
// This creates new fruit and "throws" it
function throwFruit(fruitType){
    // Special fruittype for a bomb
    var fruit = document.createElement("img");
    fruit.className = "fruit";
    fruit.left = "0px";
    fruit.setAttribute('ftype', fruitType);
    fruit.setAttribute('x', 0);
    fruit.setAttribute('y', 0);
    fruit.setAttribute("hit", "NO"); //It kept detecting misses after the fruit was cut, this prevents that
        
    if (fruitType == 'bomb'){
        fruit.src=`/static/Assets/bomb.svg`;
        fruit.onmouseenter = function(){
            //Kabloey!
            scoreData.misses+=1;
            scoreData.score-=Math.floor(difficulty*2);
            scoreChange(-difficulty*2); //Reduce the amount in points that the difficulty is
            bubbleText("KABOOM!", '#ff0000');
            updateScoreGui();
            fruit.remove();
            var expframe = document.getElementById('demomantf2');
            expframe.style.display = 'block';
            document.body.className = 'shakeitup';
            window.setTimeout(function(){
                expframe.style.opacity = '100%';
                window.setTimeout(function(){
                    expframe.style.opacity = '0%';
                    window.setTimeout(function(){
                        expframe.style.display = 'none';
                        window.setTimeout(function(){
                            document.body.className = ''; //Really jenk, I hate this. 
                            //This is like5 nested delays that trigger bomb effects
                        }, 1500)
                    }, 300)
                }, 600)
            }, 5)

        };
    } else {
        fruit.src=`/static/Assets/Fruit/${fruitType}.svg`;
        fruit.onmouseenter = function(){
            hitSuccess(fruit);
        };
    }
    currentFruit.push(fruit);
    var direction = randomizeString(["left", "right"]);
    var startpos, endpos; //Placeholder variables for where the fruit spawns
    if (direction == "left"){
        startpos = randomNumber(300, 500);
        endpos = randomNumber(25, 250);
    } else {
        startpos = randomNumber(25, 250);
        endpos = randomNumber(300, 500);
    }

    const movement = computeMovement(startpos, endpos, randomNumber(3, 7), direction);
    let i = 0;
    setFruitPosition(fruit, startpos, 1);
    fruitContainer.appendChild(fruit);
    var intervalid = window.setInterval(function(){
        i++;
        if (i < movement.length){
            setFruitPosition(fruit, movement[i].x, movement[i].y);
            if (fruit.getAttribute("y") <=0 && fruit.getAttribute("hit") == "NO" && inGame == true && fruit.getAttribute("ftype") != 'bomb'){
                scoreData.misses+=1;
                scoreData.score-=Math.floor(difficulty/10);
                scoreChange(Math.floor(-difficulty/10));
                bubbleText("Miss!", '#ff0000');
                updateScoreGui();

                fruit.remove();
            } else if (fruit.getAttribute('y') <=0){ //This has to be here to except fruits that have been hit
                fruit.remove();
            }
        } else {
            window.clearInterval(intervalid);
        }
    }, 20)
};



    // Game start/ end logic \\

//Ends the game and cleans up
function endGame(){
    document.getElementById("submit1").style.display = 'block';
    document.getElementById("submit2").style.display = 'none';
    document.getElementById("unameinput").style.display ='none';
    
    trailEnabled = false;
    inGame = false;
    let i = 0;
    while (i < currentFruit.length) {
        i++;
        try{
            fruitContainer.removeChild(currentFruit[i]);
        } catch {};
    }
    currentFruit = []; //Reset the fruit currently in play
    setPage("gameover");
    // Fill in your stats from the round
    finalscore.innerHTML = `Score: ${scoreData.score}/${scoreData.requiredScore}`;
    finalmisses.innerHTML = `Misses: ${scoreData.misses}`;

    var oldHighscore = getCookie(`highscore_${stringDifficulty}`);
    if (oldHighscore == ""){
        oldHighscore = "0"; //Has to be a string so it can be converted to an int down the line
    } 
    oldHighscore = Number(oldHighscore);
    if (oldHighscore < scoreData.score){
        // New high score, save it and congradulate user
        newhighscore.innerHTML = `New high score for ${stringDifficulty} mode! <br>${scoreData.score}`;
        setCookie(`highscore_${stringDifficulty}`, String(scoreData.score), 1000);
    } else {
        // Didn't beat their high score
        newhighscore.innerHTML = `High score to beat: <br>${oldHighscore}`;
    }
    

    //Once all of this is done, unblock their screen
    //window.setTimeout(function(){
     //   document.getElementById('whiteout').style.opacity = '0%';
    //}, 2000)
};

//This ACTUALLY starts the game logic
// Confusing function names, the other one just opens the difficulty slider
function startGameFrThisTime(){
    difficulty = Number(difficultySlider.value);
    setPage("gameplay");
    var intervaltosend = 1000;
    if (difficulty >= 250){
       scoreData.timeLeft = 30;
       scoreData.requiredScore = 15000;
       stringDifficulty = "Hard";
       intervaltosend = 400;
    } else if (difficulty > 100 && difficulty < 250){
        scoreData.timeLeft = 60;
        scoreData.requiredScore = 12000;
        stringDifficulty = "Medium";
        intervaltosend = 600;
    } else {
        scoreData.timeLeft = 80;
        stringDifficulty = "Easy";
        scoreData.requiredScore = 6000;
    } 
    trailEnabled = true;
    inGame = true;
    updateScoreGui();

    // I love this variable name
    var fruitloop = window.setInterval(function(){
        if (randomNumber(1,10) >= 2 && scoreData.timeLeft >0){
            throwFruit(randomizeString(['Watermelon', 'Apple', 'Banana']));
            //Calculate chance for a bomb
            var radInt = randomNumber(1, 20);
            if (difficulty > 100 && difficulty < 250) {
                if (radInt >19){
                    throwFruit('bomb');
                }
            } else if (difficulty >=250){
                if (radInt >16){
                    throwFruit('bomb');
                }
            }
        } else if (scoreData.timeLeft <= 0 || inGame == false){
            window.clearInterval(fruitloop);
        }
    }, intervaltosend);
    var interval;
    // This operates the game timer and also makes sure the scoregui gets refreshed
    interval = window.setInterval(function(){
        scoreData.timeLeft-=1;
        updateScoreGui();
        if (scoreData.timeLeft <= 5){
            bubbleText(String(scoreData.timeLeft), '#00ff00');
        }
        if (scoreData.timeLeft <= 0 || inGame == false ){
            window.clearInterval(interval);
            endGame();
        }
    }, 1000);
}

// This resets scores and prompts the user to choose a difficulty
function startGame(){
    scoreData = {
        misses: 0,
        hits:0,
        totalPoints: 0,
        timeLeft: 0,
        requiredScore:0,
        score: 0,
    } //Reset score data
    setPage("choosedifficulty");
    document.getElementById("diffSlider").value = 99;
    updateDifficultyPreview(99);
};



    // Misc event listeners \\

// for debugging, when the key esc is pressed exit the game
window.onkeyup = function(key){
    if (key.keyCode == 27 && inGame == true){
        scoreData.timeLeft = 0;
    }
}
// Wait for the DOM to load in-order to set element variables and do other misc stuff
document.addEventListener("DOMContentLoaded", function(){
    setPage("startBtns"); //Wait for the DOM to load
    difficultySlider = document.getElementById("diffSlider");
    difficultyPreview = document.getElementById("difficultypreview");
    cuttingBoard = document.getElementById("cuttingboard");
    fruitContainer = document.getElementById("fruitspace");
    scoreKeeper1 = document.getElementById("scorekeeper1");
    misses1 = document.getElementById("misses1");
    timer = document.getElementById("timer");
    finalscore = document.getElementById("finalscore");
    finalmisses = document.getElementById("finalmisses");
    newhighscore = document.getElementById("newhighscore");
    difficultySlider.oninput = function(){
        updateDifficultyPreview(Number(difficultySlider.value));
    };
    updateLeaderboard('hard'); //Update the leaderboard
})



    // Misc functions/other code \\

// Mouse trail code from https://stackoverflow.com/questions/64159804/creating-a-disney-dust-style-cursor-trail
// Modified by me to fit the game. (I know how this code works, I dug through it before puting it in)
let trailArr = [1, .9, .8];
function trailAnimation(e, i, callbackFn) {
    var elem = document.createElement('div');
    elem = styleSparkle(elem, e, i);
    if (typeof callbackFn == 'function') {
        elem = callbackFn(elem);    
    }
    elem.classList.add("sparkle");
    cuttingBoard.appendChild(elem);
    window.setTimeout(function () {
        cuttingBoard.removeChild(elem);
    }, Math.round(Math.random() * i *200));//lifetime of the particles/how fast they spawn
}
function stopSparkles(){
    trailEnabled = false;
}
function startSparkles(){
    if (inGame == true){ //This is so the trail doesn't start when it's not supposed to
        trailEnabled = true;
    }
}
function styleSparkle(elem, e, i) {
  let j = (1 - i) * 50;
  elem.style.top = e.pageY - window.scrollY + Math.round(j - j) + 'px';
  elem.style.left = e.pageX + Math.round(j - j) + 'px';
  elem.style.width = '10px';
  elem.style.height = '10px';
  elem.style.opacity = "20%";

  return elem;
}
window.addEventListener('mousemove', function (e) {
    if (trailEnabled == true){
        trailArr.forEach((i) => {trailAnimation(e, i)});

        trailArr.forEach((i) => {trailAnimation(e, i, (elem) => {
          elem.style.animation = "fallingsparkles 1s";
          
          return elem;
        })});
    }
}, false);
// End mouse trail code \\