/**
 * Player object that makes actions to progress the game.
 * @param name  name of the player
 * @param game  the Game object that instantiated this player object
 * @constructor
 */
function Player(name,game)
{
    this.name_text = name;
    this.hand_array = [];
    this.chips_number = 200;
    this.wager_number = 0;
    this.my_game = game;
    this.madeAction_bool = false;
    this.folded_bool = false;
    this.click_audio = new Audio('sounds/click.wav');
}

/**
 * Checks the Game object to see if this Player object is currently the player up.
 * @returns {boolean}   true if it's this player's turn and false if not
 */
Player.prototype.check_if_my_turn = function ()
{
    return this.my_game.players_array[this.my_game.currentPlayer_index] === this;
};

/**
 * Checks the Game object for the current highest bet on the table.
 * @returns {number}    highest wager
 */
Player.prototype.check_top_wager = function ()
{
    return this.my_game.topWager_number;
};

/**
 * Adds chips from the hand to the chips wagered on the table.
 * Bets all chips if the number of chips wagered is more than what the player has in hand.
 * @param chips_num     number of chips wagered
 * @returns {string}    'normal' if player has enough funds and 'all in'
 */
Player.prototype.wager_chips = function (chips_num)
{
    if (chips_num <= this.chips_number) {
        this.chips_number -= chips_num;
        this.wager_number += chips_num;
        return "normal";
    }
    else {
        chips_num = this.chips_number;
        this.chips_number = 0;
        this.wager_number += chips_num;
        return "all in";
    }
};

/**
 * Adds a Card object to the hand_array of the Player object.
 * @param card  Card object you want to add to the hand
 */
Player.prototype.add_to_hand = function (card)
{
    this.hand_array.push(card);
};

/**
 * Removes a Card object from the hand_array of the Player object.
 * @returns {Card}  the Card object that was removed from the hand
 */
Player.prototype.remove_from_hand = function ()
{
    return this.hand_array.pop();
};

/**
 * Removes chips from the hand and wagers them on the table.
 * In Texas Holdem, blinds are mandatory bets that get the action going.
 * @param chips_num  the number chips to be wagered (for small blind or big blind)
 */
Player.prototype.pay_blind = function (chips_num)
{
    this.wager_chips(chips_num);
    console.log(this.name_text + " paid " + this.wager_number + " chips for blind (" + this.chips_number + " left)")
};

/**
 * Player action that flags the player as 'folded' and ends the turn.
 * In Texas Holdem, the act of folding means you decline to wager chips, automatically loosing the round.
 */
Player.prototype.fold = function ()
{
    if (this.check_if_my_turn() === true)
    {
        play_sound(this.click_audio);
        this.folded_bool = true;
        console.log(this.name_text + " folded");
        this.my_game.end_turn();
    }
    else {console.log("you can't do that right now")}
};

/**
 * Player action that bets enough chips to match the current highest bet on the table.
 * In Texas Holdem, the act of calling means you match the price another player is willing to bet.
 */
Player.prototype.call = function ()
{
    if (this.check_if_my_turn() === true && this.check_top_wager() > this.wager_number)
    {
        play_sound(this.click_audio);
        this.wager_chips(this.check_top_wager()-this.wager_number);
        console.log(this.name_text + " called for " + this.wager_number + " chips (" + this.chips_number + " left)");
        this.madeAction_bool = true;
        this.my_game.end_turn();
    }
    else {console.log("you can't call right now")}
};

/**
 * Player action that bets twice the amount of the current highest bet on the table.
 * In Texas Holdem, the act of raising means you raise the bar for the bets, and your opponents have to bet just as much.
 */
Player.prototype.raise = function ()
{
    if (this.check_if_my_turn() === true && this.check_top_wager() !== 0)
    {
        play_sound(this.click_audio);
        let confirm = this.wager_chips((this.check_top_wager()*2)-this.wager_number);
        if (confirm === "normal")
        {
            this.my_game.topWager_number = this.wager_number;
            console.log(this.name_text + " raised to " + this.wager_number + " chips (" + this.chips_number + " left)");
        }
        if (confirm === "all in")
        {
            if (this.my_game.topWager_number < this.wager_number)
            {
                this.my_game.topWager_number = this.wager_number
            }
            console.log(this.name_text + " went all in!");
        }
        this.madeAction_bool = true;
        this.my_game.end_turn();
    }
    else {console.log("you can't raise right now")}
};

/**
 * Player action that bets the value of the big blind onto the table.
 * In Texas Holdem, the act of betting means you place an initial bet if there are no other bets on the table.
 */
Player.prototype.bet = function()
{
    if (this.check_if_my_turn() === true && this.check_top_wager() === 0)
    {
        play_sound(this.click_audio);
        this.wager_chips(this.my_game.bigBlind_number);
        this.my_game.topWager_number = this.wager_number;
        console.log(this.name_text + " bet " + this.wager_number + " chips (" + this.chips_number + " left)");
        this.madeAction_bool = true;
        this.my_game.end_turn();
    }
    else {console.log("you can't bet right now")}
};

/**
 * Player action that ends the turn if the player already has the current highest bet or there are no bets.
 * In Texas Holdem, the act of checking means the player can pass their turn if no one made a bet yet, or they already matched the bet.
 */
Player.prototype.check = function()
{
    if (this.check_if_my_turn() === true && this.check_top_wager() === this.wager_number)
    {
        play_sound(this.click_audio);
        console.log(this.name_text + " checked ");
        this.madeAction_bool = true;
        this.my_game.end_turn();
    }
    else {console.log("you can't check right now")}
};

/**
 * Used by Game object to take the players wager on the table at the end of the round
 * @returns {number}    number of chips wagered
 */
Player.prototype.take_wager = function ()
{
    let chips_num = this.wager_number;
    this.wager_number = 0;
    return chips_num;
};

/**
 * Used by Game object to add chips to the player's hand if they won the round
 * @param chips_num     number of chips won from the pot
 */
Player.prototype.award_chips = function (chips_num)
{
    this.chips_number += chips_num;

};
