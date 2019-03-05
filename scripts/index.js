let my_game = null;

/**
 * Anonymous function that runs when the page loads and starts the game.
 */
(function () {
    my_game = new Game();
    add_listeners(0);
    add_listeners(1);
})();

/**
 * Adds listeners to all the buttons.
 * @param player_index  The index number of the player who's buttons you want to add listeners to
 */
function add_listeners(player_index) {
    let methods = ["fold","call","raise","bet","check"];
    for (const name of methods)
    {
        document.getElementById(name + "_" + player_index).addEventListener('click', () => window[name](player_index));
    }
}

/**
 * sets a timer that runs out after a specific time.
 * @param ms    number of milliseconds to count
 * @returns {Promise}  a Promise that can be used check if this action was completed properly
 */
function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Plays a sound in the browser. Can be used to play multiple sounds at the same time.
 * @param sound   Audio object that you want to play
 */
function play_sound(sound)
{
    let new_sound = sound.cloneNode();
    new_sound.play();
}

/**
 * Method called by a button listener to perform the 'fold' player action
 * @param player_index  the index number of the player you want to perform this action
 */
function fold(player_index) {
    my_game.players_array[player_index].fold()
}

/**
 * Method called by a button listener to perform the 'call' player action
 * @param player_index  the index number of the player you want to perform this action
 */
function call(player_index) {
    my_game.players_array[player_index].call()
}

/**
 * Method called by a button listener to perform the 'raise' player action
 * @param player_index  the index number of the player you want to perform this action
 */
function raise(player_index) {
    my_game.players_array[player_index].raise()
}

/**
 * Method called by a button listener to perform the 'bet' player action
 * @param player_index  the index number of the player you want to perform this action
 */
function bet(player_index) {
    my_game.players_array[player_index].bet()
}

/**
 * Method called by a button listener to perform the 'check' player action
 * @param player_index  the index number of the player you want to perform this action
 */
function check(player_index) {
    my_game.players_array[player_index].check()
}

/**
 * Used while play-testing to skip to the end of the round
 * @returns {Promise<void>} a Promise that can be used check if this action was completed properly
 */
async function endGame()
{
    call(0);
    await sleep(500);
    check(1);
    await sleep(500);
    check(1);
    await sleep(500);
    check(0);
    await sleep(500);
    check(1);
    await sleep(500);
    check(0);
    await sleep(500);
    check(1);
    await sleep(500);
    check(0);
    await sleep(500);
    check(1);
    await sleep(500);
    check(0);
}
