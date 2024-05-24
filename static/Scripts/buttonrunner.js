// This script runs the misc buttons on the home menu, doesn't operate game logic
// This exists to clean up the ./Scripts/gamelogic.js a bit
// Bit overcomplicated 
const btns = [
    "startBtns",
    "instructions",
    "leaderboardFrame",
    "choosedifficulty",
    "gameplay",
    "gameover"
];

// Function that changes the page
function setPage(divId){
    for (var x in btns){
        if (btns[x] == divId){
            document.getElementById(btns[x]).style = "display:block;"
        } else {
            document.getElementById(btns[x]).style = "display:none;"
        }
    };
};