/**
 * Game object used as the central game engine to run the poker game.
 * @constructor
 */
function Game() {
    this.players_array = [new Player("Mikhail",this),new Player("Isabel",this)];
    this.dealer_index = null;
    this.currentPlayer_index = null;
    this.sharedCard_array = [];
    this.playing_deck = new Deck(52);
    this.discard_deck = new Deck(0);
    this.pot_number = 0;
    this.smallBlind_number = 1;
    this.bigBlind_number = 2;
    this.topWager_number = 0;
    this.phase_number = 0; //0=preflop, 1=flop, 2=turn, 3=river
    this.cardFlip_audio = new Audio('sounds/card_flip.wav');
    this.cardFlip_delay = 500;

    this.setup = function () {
        console.log("setting up game");
        this.cardFlip_audio.playbackRate = 1;
        this.playing_deck.shuffle_deck();
        this.dealer_index = 0;
        console.log("dealer: " + this.players_array[this.dealer_index].name_text);
        this.start_round();
    };
    this.setup();
}

/**
 * Performs necessary actions to begin a new round of poker.
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.start_round = async function () {
    console.log("\nstarting round");
    await sleep(1000);
    this.deal_cards();
    this.collect_blinds();
    this.update_html_values();
    this.topWager_number = this.bigBlind_number;
    this.currentPlayer_index = this.dealer_index;
    await sleep(this.cardFlip_delay*5);
    console.log(this.players_array[this.dealer_index].name_text + "'s turn");
};

/**
 * Deals 2 cards from the playing_deck to all the players
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.deal_cards = async function () {
    console.log("dealing cards");
    for (let i=0; i<this.players_array.length; i++) {
        for (let j=0; j<2; j++)
        {
            this.players_array[i].add_to_hand(this.playing_deck.draw_card());
            if (i===this.dealer_index)
            {
                play_sound(this.cardFlip_audio);
                await sleep(this.cardFlip_delay);
                document.getElementById("card" + j + "_" + i).src = this.players_array[i].hand_array[j].path_text;
            }
        }
    }
    this.players_array.map(x => console.log(x.name_text + " got " + x.hand_array[0].name_text + " and " + x.hand_array[1].name_text));
};

/**
 * Takes mandatory bets from all players at the start of the round
 */
Game.prototype.collect_blinds = function () {
    console.log("collecting blinds");
    if (this.dealer_index === 0)
    {
        this.players_array[0].pay_blind(this.smallBlind_number);
        this.players_array[1].pay_blind(this.bigBlind_number);
    }
    else if (this.dealer_index === 1)
    {
        this.players_array[0].pay_blind(this.bigBlind_number);
        this.players_array[1].pay_blind(this.smallBlind_number);
    }
};

/**
 * Updates the text fields on the web page to reflect the current number of chips
 */
Game.prototype.update_html_values = function () {
    document.getElementById("chips_0").innerHTML = this.players_array[0].chips_number;
    document.getElementById("chips_1").innerHTML = this.players_array[1].chips_number;
    document.getElementById("wager_0").innerHTML = this.players_array[0].wager_number;
    document.getElementById("wager_1").innerHTML = this.players_array[1].wager_number;
    document.getElementById("pot").innerHTML = this.pot_number;
};

/**
 * Ends a player's turn and checks if the betting round should end go on to the next phase
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.end_turn = async function () {
    this.update_html_values();
    if (this.players_array[0].folded_bool === true)
    {
        this.collect_wagers();
        this.topWager_number = 0;
        this.players_array[0].madeAction_bool = false;
        this.players_array[1].madeAction_bool = false;
        this.end_round(1)
    }
    else if (this.players_array[1].folded_bool === true)
    {
        this.collect_wagers();
        this.topWager_number = 0;
        this.players_array[0].madeAction_bool = false;
        this.players_array[1].madeAction_bool = false;
        this.end_round(0);
    }
    else if (this.check_if_wagers_same() && this.check_if_everyone_acted())
    {
        await sleep(1000);
        console.log("phase ends");
        this.phase_number++;
        this.collect_wagers();
        this.topWager_number = 0;
        this.players_array[0].madeAction_bool = false;
        this.players_array[1].madeAction_bool = false;
        if (this.currentPlayer_index === this.dealer_index)
        {
            this.switch_current_player()
        }
        if (this.phase_number === 1)
        {
            this.show_flop();
        }
        if (this.phase_number === 2)
        {
            this.show_turn();
        }
        if (this.phase_number === 3)
        {
            this.show_river();
        }
        if (this.phase_number === 4)
        {
            this.showdown();
            return;
        }
        console.log(this.players_array[this.currentPlayer_index].name_text + "'s turn");
    }
    else
    {this.switch_current_player()}
    this.update_html_values();
};

/**
 * Checks if the amount of chips wagered by both players is the same amount
 * @returns {boolean}   true if amounts are the same and false if not
 */
Game.prototype.check_if_wagers_same = function () {
    return this.players_array[0].wager_number === this.players_array[1].wager_number;
};

/**
 * Checks if all players performed an action this round
 * @returns {boolean}   true if both players acted this round and false if not
 */
Game.prototype.check_if_everyone_acted = function () {
    return this.players_array[0].madeAction_bool && this.players_array[1].madeAction_bool;
};

/**
 * Switches player who's turn it is
 */
Game.prototype.switch_current_player = function () {
    if (this.currentPlayer_index === 0)
    {
        this.hide_player_cards(0);
        this.show_player_cards(1);
        this.currentPlayer_index = 1;
    }
    else
    {
        this.hide_player_cards(1);
        this.show_player_cards(0);
        this.currentPlayer_index = 0
    }
    console.log(this.players_array[this.currentPlayer_index].name_text + "'s turn");
};

/**
 * Switches player who is the dealer
 */
Game.prototype.switch_dealer = function ()
{
    if (this.dealer_index === 0)
    {this.dealer_index = 1}
    else {this.dealer_index = 0}
    console.log("dealer is now " + this.players_array[this.dealer_index].name_text);
};

/**
 * Hides both cards on the page for a single player
 * @param player_index  the player index of the player who's cards you want to hide
 */
Game.prototype.hide_player_cards = function(player_index)
{
    document.getElementById("card" + 0 + "_" + player_index).src = "images/red_back.png";
    document.getElementById("card" + 1 + "_" + player_index).src = "images/red_back.png";
};

/**
 * Reveals both cards on the page for a single player
 * @param player_index  the player index of the player who's cards you want to reveal
 */
Game.prototype.show_player_cards = function(player_index)
{
    document.getElementById("card" + 0 + "_" + player_index).src = this.players_array[player_index].hand_array[0].path_text;
    document.getElementById("card" + 1 + "_" + player_index).src = this.players_array[player_index].hand_array[1].path_text;
};

/**
 * Takes wagered chips from players and puts them in the pot
 */
Game.prototype.collect_wagers = function() {
    let into_pot = this.players_array[0].take_wager() + this.players_array[1].take_wager();
    this.add_to_pot(into_pot);
    console.log(into_pot + " chips went into the pot (" + this.pot_number + " total)");
};

/**
 * Adds chips to the pot
 * @param chips_num     number of chips to be added
 */
Game.prototype.add_to_pot = function(chips_num) {
    this.pot_number += chips_num;
};

/**
 * Removes chips from pot
 * @returns {number}    number of chips to be removed
 */
Game.prototype.remove_from_pot = function() {
    let chips = this.pot_number;
    this.pot_number = 0;
    return chips;
};

/**
 * Draws a community card fom the playing_deck
 */
Game.prototype.draw_shaded_card = function () {
    this.sharedCard_array.push(this.playing_deck.draw_card());
};

/**
 * Draws a card from the playing_deck and puts it straight into the discard_deck
 */
Game.prototype.burn_card = function () {
    this.discard_deck.add_card(this.playing_deck.draw_card());
};

/**
 * Puts a community card into the discard_deck
 */
Game.prototype.discard_shared_card = function () {
    this.discard_deck.add_card(this.sharedCard_array.pop());
};

/**
 * Reveals first 3 cards from the top of the playing_deck and puts them on the table
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.show_flop = async function () {
    this.burn_card();
    this.draw_shaded_card();
    this.draw_shaded_card();
    this.draw_shaded_card();
    console.log("the flop:");
    this.sharedCard_array.map(x => console.log(x.name_text));
    for (let i=0; i<this.sharedCard_array.length; i++)
    {
        play_sound(this.cardFlip_audio);
        await sleep(this.cardFlip_delay);
        document.getElementById("card" + i + "_share").src = this.sharedCard_array[i].path_text;
    }
};

/**
 * Reveals 4th card from the top of the playing_deck and puts it on the table
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.show_turn = async function () {
    this.burn_card();
    this.draw_shaded_card();
    console.log("the turn:");
    this.sharedCard_array.map(x => console.log(x.name_text));
    play_sound(this.cardFlip_audio);
    await sleep(this.cardFlip_delay);
    document.getElementById("card" + 3 + "_share").src = this.sharedCard_array[3].path_text;
};

/**
 * Reveals 5th card from the top of the playing_deck and puts it on the table
 * @returns {Promise<void>}     a Promise that can be used check if this action was completed properly
 */
Game.prototype.show_river = async function () {
    this.burn_card();
    this.draw_shaded_card();
    console.log("the river:");
    this.sharedCard_array.map(x => console.log(x.name_text));
    play_sound(this.cardFlip_audio);
    await sleep(this.cardFlip_delay);
    document.getElementById("card" + 4 + "_share").src = this.sharedCard_array[4].path_text;
};

/**
 * Calls the ranking function to find the index of the winning player, and passes it the the end_round function
 */
Game.prototype.showdown = function ()
{
    let winningPlayer_index = this.ranking();
    this.show_player_cards(1);
    this.show_player_cards(0);
    this.end_round(winningPlayer_index);
};

/**
 * Ends the round, displays the winner, and sets up variables to start a new round
 * @param winningPlayer_index
 * @returns {Promise<void>}
 */
Game.prototype.end_round  = async function (winningPlayer_index)
{
    if (winningPlayer_index !== -1) {
        let message = this.players_array[winningPlayer_index].name_text + " won the pot (" + this.pot_number + " chips)";
        console.log(message);
        document.getElementById("announce").innerHTML = message;
        this.players_array[winningPlayer_index].award_chips(this.remove_from_pot());
    }
    else {
        let message = "Draw: both players split the pot";
        console.log(message);
        document.getElementById("announce").innerHTML = message;
        let pot_total = this.remove_from_pot();
        this.players_array[0].award_chips(pot_total/2);
        this.players_array[1].award_chips(pot_total/2);
    }
    if (this.players_array[0].chips_number === 0)
    {
        let message = this.players_array[0].name_text + " lost all their money: GAME OVER";
        console.log(message);
        document.getElementById("announce").innerHTML = message;
        return;
    }
    if (this.players_array[1].chips_number === 0)
    {
        let message = this.players_array[1].name_text + " lost all their money: GAME OVER";
        console.log(message);
        document.getElementById("announce").innerHTML = message;
        return;
    }
    await sleep(15000);
    this.phase_number = 0;
    this.players_array[0].folded_bool=false;
    this.players_array[1].folded_bool=false;
    this.discard_cards();
    this.switch_dealer();
    this.start_round();
};

/**
 * ranks the player hands and finds the player with the highest ranked hand
 * @returns {number}    the index of the player with the best hand
 */
Game.prototype.ranking = function()
{
    let player1Card = [];
    let player2Card = [];
    let tableCard = [];
    this.players_array[0].hand_array.map(card => player1Card.push(card));
    this.players_array[1].hand_array.map(card => player2Card.push(card));
    this.sharedCard_array.map(card => tableCard.push(card));
    let cards1 = Array.from(new Set(player1Card.concat(tableCard)));
    let cards2 = Array.from(new Set(player2Card.concat(tableCard)));
    cards1.sort(function (a,b) {return a.suit_text-b.suit_text});
    cards2.sort(function (a,b) {return a.suit_text-b.suit_text});
    cards1.sort(function (a,b) {return a.rank_number-b.rank_number});
    cards2.sort(function (a,b) {return a.rank_number-b.rank_number});
    cards1.map(card => console.log(card.rank_number + card.suit_text + "player1"));
    cards2.map(card => console.log(card.rank_number + card.suit_text + "player2"));

    let hand_rank = [];
    let hand_rank2 = [];
    let rank, rank2;

    function royalFlush()
    {
        let arrayCards = [];
        let highCards = [10,11,12,13,14];
        let suits = [];
        let heartsSuit = [10+"_Hearts",11+"_Hearts",12+"_Hearts",13+"_Hearts",14+"_Hearts"];
        let diamondsSuit = [10+"_Diamonds",11+"_Diamonds",12+"_Diamonds",13+"_Diamonds",14+"_Diamonds"];
        let spadesSuit = [10+"_Spades",11+"_Spades",12+"_Spades",13+"_Spades",14+"_Spades"];
        let clubsSuit = [10+"_Clubs",11+"_Clubs",12+"_Clubs",13+"_Clubs",14+"_Clubs"];


        for (let i = 0; i < cards1.length; i++)
        {
            arrayCards.push(cards1[i].rank_number);
            suits.push(cards1[i].name_text);
        }

        if (highCards.every(straightHigh => arrayCards.includes(straightHigh)) && heartsSuit.every(hearts => suits.includes(hearts)))
        {
            console.log("Player 1 have a royal FLush");
            rank = new Hand1("Royal flush p1", suits, 10);
            hand_rank.push(rank);
        }
        else if (highCards.every(straightHigh => arrayCards.includes(straightHigh)) && diamondsSuit.every(diamonds => suits.includes(diamonds)))
        {
            console.log("Player 1 have a royal FLush");
            rank = new Hand1("Royal flush p1", suits, 10);
            hand_rank.push(rank);
        }
        else if (highCards.every(straightHigh => arrayCards.includes(straightHigh)) && spadesSuit.every(spades => suits.includes(spades)))
        {
            console.log("Player 1 have a royal FLush");
            rank = new Hand1("Royal flush p1", suits, 10);
            hand_rank.push(rank);
        }
        else if(highCards.every(straightHigh => arrayCards.includes(straightHigh)) && clubsSuit.every(clubs => suits.includes(clubs)))
        {
            console.log("Player 1 have a royal FLush");
            rank = new Hand1("Royal flush p1", suits, 10);
            hand_rank.push(rank);
        }
        else
        {
            console.log("nothing");
        }

        let arrayCards2 = [];
        let highCards2 = [10,11,12,13,14];
        let suits2 = [];
        let heartsSuit2 = [10+"_Hearts",11+"_Hearts",12+"_Hearts",13+"_Hearts",14+"_Hearts"];
        let diamondsSuit2 = [10+"_Diamonds",11+"_Diamonds",12+"_Diamonds",13+"_Diamonds",14+"_Diamonds"];
        let spadesSuit2 = [10+"_Spades",11+"_Spades",12+"_Spades",13+"_Spades",14+"_Spades"];
        let clubsSuit2 = [10+"_Clubs",11+"_Clubs",12+"_Clubs",13+"_Clubs",14+"_Clubs"];


        for (let i = 0; i < cards2.length; i++)
        {
            arrayCards2.push(cards2[i].rank_number);
            suits2.push(cards2[i].name_text);
        }

        if (highCards2.every(straightHigh => arrayCards2.includes(straightHigh)) && heartsSuit2.every(hearts => suits2.includes(hearts)))
        {
            console.log("Player 2 have a royal FLush");
            rank2 = new Hand2("Royal flush p2", suits2, 20);
            hand_rank2.push(rank2);
        }
        else if (highCards2.every(straightHigh => arrayCards2.includes(straightHigh)) && diamondsSuit2.every(diamonds => suits2.includes(diamonds)))
        {
            console.log("Player 2 have a royal FLush");
            rank2 = new Hand2("Royal flush p2", suits2, 20);
            hand_rank2.push(rank2);
        }
        else if (highCards2.every(straightHigh => arrayCards2.includes(straightHigh)) && spadesSuit2.every(spades => suits2.includes(spades)))
        {
            console.log("Player 2 have a royal FLush");
            rank2 = new Hand2("Royal flush p2", suits2, 20);
            hand_rank2.push(rank2);
        }
        else if(highCards2.every(straightHigh => arrayCards2.includes(straightHigh)) && clubsSuit2.every(clubs => suits2.includes(clubs)))
        {
            console.log("Player 2 have a royal FLush");
            rank2 = new Hand2("Royal flush p2", suits2, 20);
            hand_rank2.push(rank2);
        }
        else
        {
            console.log("nothing");
        }
    }

    function straightFlush()
    {
        let count = 0;
        let cards_suits = [];
        let cards_suits2 = [];
        let suits1, suits2;
        for (let i = 1; i < cards1.length; i++)
        {
            if (cards1[i].rank_number === cards1[i-1].rank_number + 1)
            {
                count++;
            }
            cards_suits.push(cards1[i].name_text);
        }

        for (let i = 0; i < cards1.length-1; i++) {
             suits1 = [i];
            for (let j = i + 1; j < cards1.length; j++) {
                if (cards1[i].suit_text === cards1[j].suit_text) {
                    suits1.push(j);
                }
            }
        }
        if (suits1.length >= 5 && count >= 4) {
            console.log("Player 1 have a straight flush");
            rank = new Hand1("Straight flush p1", cards_suits, 9);
            hand_rank.push(rank);
        }

        let count2 = 0;
        for (let i = 1; i < cards2.length; i++)
        {
            if (cards2[i].rank_number === cards2[i-1].rank_number + 1)
            {
                count2++;
            }
            cards_suits2.push(cards2[i].name_text);
        }

        for (let i = 0; i < cards2.length-1; i++) {
            suits2 = [i];
            for (let j = i + 1; j < cards2.length; j++) {
                if (cards2[i].suit_text === cards2[j].suit_text) {
                    suits2.push(j);
                }
            }
            if (suits2.length >= 5 && count2 >= 4) {
                console.log("Player 2 have a straight flush");
                rank2 = new Hand2("Straight flush p2", cards_suits2, 19);
                hand_rank2.push(rank2);
            }
        }
    }

    function fourOfAKind()
    {

        for (let i = 0; i < cards1.length-1; i++)
        {
            let number = [i];
            for (let j = i+1; j < cards1.length; j++)
            {
                if (cards1[i].rank_number === cards1[j].rank_number)
                {
                    number.push(j);
                }
            }

            if (number.length === 4)
            {
                let arrayOfCards = [];
                for (i = 0; i < number.length; i++)
                {
                    let p1 = cards1[number[i]];
                    arrayOfCards.push(p1);
                }
                console.log("Player 1 have a 4 of a kind");
                rank = new Hand1("Four of a kind p1", arrayOfCards, 8);
                hand_rank.push(rank);
            }
        }

        for (let i = 0; i < cards2.length-1; i++)
        {
            let number2 = [i];
            for (let j = i+1; j < cards2.length; j++)
            {
                if (cards2[i].rank_number === cards2[j].rank_number)
                {
                    number2.push(j);
                }
            }

            if (number2.length === 4)
            {
                let arrayOfCards2 = [];
                for (i = 0; i < number2.length; i++)
                {
                    let p1 = cards2[number2[i]];
                    arrayOfCards2.push(p1);
                }
                console.log("Player 2 have a 4 of a kind");
                rank2 = new Hand2("Four of a kind p2", arrayOfCards2, 18);
                hand_rank2.push(rank2);
            }
        }
    }

    function fullHouse() {
        let pair, pair2;
        let fullHouses = [];
        let fullHouses2 = [];
        let three2;

        for (let i = 0; i < cards1.length - 1; i++) {
            pair = [i];

            for (let j = 1 + i; j < cards1.length; j++) {
                if (cards1[i].rank_number === cards1[j].rank_number) {
                    pair.push(j);
                }
            }
            fullHouses.push(cards1[i].name_text);
        }

        for (let i = 0; i < cards1.length - 1; i++) {
            let three = [i];
            for (let j = i + 1; j < cards1.length; j++) {
                if (cards1[i].rank_number === cards1[j].rank_number) {
                    three.push(j);
                }
            }

            if (three.length === 3 && pair.length === 2) {
                console.log("Player 1 have a full house");
                rank = new Hand1("Full house p1", fullHouses, 7);
                hand_rank.push(rank);
            }
        }

        for (let i = 0; i < cards2.length - 1; i++) {
            pair2 = [i];

            for (let j = 1 + i; j < cards2.length; j++) {
                if (cards2[i].rank_number === cards2[j].rank_number) {
                    pair2.push(j);
                }
            }
            fullHouses2.push(cards2[i].name_text);
        }

        for (let i = 0; i < cards2.length - 1; i++) {
            three2 = [i];
            for (let j = i + 1; j < cards2.length; j++) {
                if (cards2[i].rank_number === cards2[j].rank_number) {
                    three2.push(j);
                }
            }

            if (three2.length === 3 && pair2.length === 2) {
                console.log("Player 2 have a full house");
                rank2 = new Hand2("Full house p2", fullHouses2, 17);
                hand_rank2.push(rank2);
            }
        }
    }

    function flush()
    {
        for (let i = 0; i < cards1.length-1; i++)
        {
            let suit = [i];
            for (let j = i+1; j < cards1.length; j++)
            {
                if (cards1[i].suit_text === cards1[j].suit_text)
                {
                    suit.push(j);
                }
            }

            if (suit.length >= 5)
            {
                let arrayOfCards = [];
                for (i = 0; i < suit.length; i++)
                {
                    let p1 = cards1[suit[i]];
                    arrayOfCards.push(p1);
                }
                console.log("Player 1 have a flush");
                rank = new Hand1("Flush p1", arrayOfCards, 6);
                hand_rank.push(rank);
            }
        }

        for (let i = 0; i < cards2.length-1; i++)
        {
            let suit2 = [i];
            for (let j = i+1; j < cards2.length; j++)
            {
                if (cards2[i].suit_text === cards2[j].suit_text)
                {
                    suit2.push(j);
                }
            }

            if (suit2.length >= 5)
            {
                let arrayOfCards2 = [];
                for (i = 0; i < suit2.length; i++)
                {
                    let p1 = cards2[suit2[i]];
                    arrayOfCards2.push(p1);
                }
                console.log("Player 2 have a flush");
                rank2 = new Hand2("Flush p2", arrayOfCards2, 16);
                hand_rank2.push(rank2);
            }
        }
    }

    function straight()
    {
        let count = 0;
        for (let i = 1; i < cards1.length; i++)
        {
            if (cards1[i].rank_number === cards1[i-1].rank_number + 1)
            {
                count++;
                var cardp1 = cards1[i].rank_number;
                var cardp2 = cards1[i-1].rank_number + 1;

            }
            if(count >= 4)
            {
                console.log("Player 1 have a straight");
                rank = new Hand1("Straight p1", [cardp1,cardp2], 5);
                hand_rank.push(rank);
            }
        }

        let count2 = 0;
        for (let i = 1; i < cards2.length; i++)
        {
            if (cards2[i].rank_number === cards2[i-1].rank_number + 1)
            {
                count2++;
                var cardp3 = cards2[i].rank_number;
                var cardp4 = cards2[i-1].rank_number + 1;
;
            }
            if(count2 >= 4)
            {
                console.log("Player 2 have a straight");
                rank2 = new Hand2("Straight p2", [cardp3,cardp4], 15);
                hand_rank2.push(rank2)
            }
        }
    }

    function threeOfAKind()
    {
        for(let i = 0; i < cards1.length-2; i++)
        {
            for(let j = 1+i; j < cards1.length-1; j++)
            {
                if (cards1[i].rank_number === cards1[j].rank_number)
                {
                    for(let k = j+1; k < cards1.length; k++)
                    {
                        if(cards1[j].rank_number === cards1[k].rank_number)
                        {
                            let p1 = cards1[i].rank_number;
                            let p2 = cards1[j].rank_number;
                            let p3 = cards1[k].rank_number;
                            console.log("Player 1 have 3 of a kind");
                            rank = new Hand1("Three of a kind p1", [p1,p2,p3], 4);
                            hand_rank.push(rank);
                        }
                    }
                }
            }
        }

        for(let i = 0; i < cards2.length-2; i++)
        {
            for(let j = 1+i; j < cards2.length-1; j++)
            {
                if (cards2[i].rank_number === cards2[j].rank_number)
                {
                    for(let k = j+1; k < cards2.length; k++)
                    {
                        if(cards2[j].rank_number === cards2[k].rank_number)
                        {
                            let c1 = cards2[i].rank_number;
                            let c2 = cards2[j].rank_number;
                            let c3 = cards2[k].rank_number;
                            console.log("Player 2 have 3 of a kind");
                            rank2 = new Hand2("Three of a kind p2", [c1,c2,c3], 14);
                            hand_rank2.push(rank2);
                        }
                    }
                }
            }
        }

    }

    function twoPairs()
    {
        let pSize = [];
        for (let i = 0; i < hand_rank.length; i++)
        {
            if (hand_rank[i].rankings === "Pair p1")
            {
                pSize.push(hand_rank[i].arrayOfCards);
            }
        }

        if (pSize.length >= 2)
        {
            for (let i=0; i<pSize.length-1; i++)
            {
                for (let j=i+1; j<pSize.length; j++)
                {
                    if (pSize[i] !== pSize[j])
                    {
                        let p1 = pSize[i];
                        let p2 = pSize[j];
                        let twoPairs = p1.concat(p2);
                        console.log("Player 1 have 2 pair");
                        rank = new Hand1("Two pairs p1", twoPairs, 3);
                        hand_rank.push(rank);
                    }
                }
            }
        }

        let pSize2 = [];
        for (let i = 0; i < hand_rank2.length; i++)
        {
            if (hand_rank2[i].rankings2 === "Pair p2")
            {
                pSize2.push(hand_rank2[i].arrayOfCards2);
            }
        }

        if (pSize2.length >= 2)
        {
            for (let i=0; i<pSize2.length-1; i++)
            {
                for (let j=i+1; j<pSize2.length; j++)
                {
                    if (pSize2[i] !== pSize2[j]){
                        let p1 = pSize2[i];
                        let p2 = pSize2[j];
                        let twoPairs = p1.concat(p2);
                        console.log("Player 2 have 2 pair");
                        rank2 = new Hand2("Two pairs p2", twoPairs, 13);
                        hand_rank2.push(rank2);
                    }
                }
            }
        }
    }

    function pairs()
    {
        for(let i = 0; i < cards1.length-1; i++)
        {
            for(let j = 1+i; j < cards1.length; j++)
            {
                if(cards1[i].rank_number === cards1[j].rank_number)
                {
                    let p1 = cards1[i].rank_number;
                    let p2 = cards1[j].rank_number;
                    console.log("Player 1 have a pair");
                    rank = new Hand1("Pair p1", [p1,p2], 2);
                    hand_rank.push(rank);
                }
            }
        }

        for(let i = 0; i < cards2.length-1; i++)
        {
            for(let j  = 1+i; j < cards2.length; j++)
            {
                if(cards2[i].rank_number === cards2[j].rank_number)
                {
                    let p1 = cards2[i].rank_number;
                    let p2 = cards2[j].rank_number;
                    console.log("Player 2 have a pair");
                    rank2 = new Hand2("Pair p2", [p1,p2], 12);
                    hand_rank2.push(rank2);
                }
            }
        }
    }

    function highCard()
    {
        let largest = 0;
        let p1, p2;

        for (let i = 0; i < cards1.length; i++)
        {
            if (cards1[i].rank_number > largest)
            {
                largest = cards1[i].rank_number;
                p1 = cards1[i].rank_number;
                rank = new Hand1("High Card p1", [p1], 1);
                hand_rank.push(rank);
            }
        }
        console.log("Player 1 highest card is " + p1);

        let largest2 = 0;
        for (let i = 0; i < cards2.length; i++)
        {
            if (cards2[i].rank_number > largest2)
            {
                largest2 = cards2[i].rank_number;
                p2 = cards2[i].rank_number;
                rank2 = new Hand2("High Card p2", [p2], 11);
                hand_rank2.push(rank2);
            }
        }
        console.log("Player 2 highest card is " + p2);
    }

    royalFlush();
    straightFlush();
    fourOfAKind();
    fullHouse();
    flush();
    straight();
    threeOfAKind();
    twoPairs();
    pairs();
    highCard();

    var ranking1;
    function Hand1(rankings, arrayOfCards, numbers_) {
        this.rankings = rankings;
        this.arrayOfCards = arrayOfCards;
        this.numbers_ = numbers_;

        for (let i = 0; i < hand_rank.length; i++) {
            if (hand_rank[i].rankings === "Royal flush p1") {
                console.log("Player 1 highest rank is a royal flush");
                ranking1 = 10;
                return;
            } else if (hand_rank[i].rankings === "Straight flush p1") {
                console.log("Player 1 highest rank is a straight flush");
                ranking1 = 9;
                return;
            } else if (hand_rank[i].rankings === "Four of a kind p1") {
                console.log("Player 1 highest rank is a four of a kind");
                ranking1 = 8;
                return;
            } else if (hand_rank[i].rankings === "Full house p1") {
                console.log("Player 1 highest rank is a full house");
                ranking1 = 7;
                return;
            } else if (hand_rank[i].rankings === "Flush p1") {
                console.log("Player 1 highest rank is a flush");
                ranking1 = 6;
                return;
            }
            else if (hand_rank[i].rankings === "Straight p1") {
                console.log("Player 1 highest rank is a straight");
                ranking1 = 5;
                return;
            }
             else if (hand_rank[i].rankings === "Three of a kind p1") {
                console.log("Player 1 highest rank is a three of a kind");
                ranking1 = 4;
                return;
            } else if (hand_rank[i].rankings === "Two pairs p1") {
                console.log("Player 1 highest rank is two pairs");
                ranking1 = 3;
                return;
            } else if (hand_rank[i].rankings === "Pair p1") {
                console.log("Player 1 highest rank is a pair");
                ranking1 = 2;
                return
            } else if (hand_rank[i].rankings === "High Card p1") {
                console.log("Player 1 highest rank is a high card");
                ranking1 = 1;
                return;
            } else {
                console.log("nothing");
            }
        }
    }

    var ranking2;
    function Hand2(rankings2, arrayOfCards2, numbers_2) {
        this.rankings2 = rankings2;
            this.arrayOfCards2 = arrayOfCards2;
            this.numbers_2 = numbers_2;

            for (let i = 0; i < hand_rank2.length; i++) {
                if (hand_rank2[i].rankings2 === "Royal flush p2") {
                    console.log("Player 2 highest rank is a royal flush");
                    ranking2 = 10;
                    return;
                } else if (hand_rank2[i].rankings2 === "Straight flush p2") {
                    console.log("Player 2 highest rank is a straight flush");
                    ranking2 = 9;
                    return;
                } else if (hand_rank2[i].rankings2 === "Four of a kind p2") {
                    console.log("Player 2 highest rank is a four of a kind");
                    ranking2 = 8;
                    return;
                } else if (hand_rank2[i].rankings2 === "Full house p2") {
                    console.log("Player 2 highest rank is a full house");
                    ranking2 = 7;
                    return;
                } else if (hand_rank2[i].rankings2 === "Flush p2") {
                    console.log("Player 2 highest rank is a flush");
                    ranking2 = 6;
                    return;
                }
                else if (hand_rank2[i].rankings2 === "Straight p2") {
                    console.log("Player 2 highest rank is a straight");
                    ranking2 = 5;
                    return;
                }
                else if (hand_rank2[i].rankings2 === "Three of a kind p2") {
                    console.log("Player 2 highest rank is a three of a kind");
                    ranking2 = 4;
                    return;
                } else if (hand_rank2[i].rankings2 === "Two pairs p2") {
                    console.log("Player 2 highest rank is two pairs");
                    ranking2 = 3;
                    return;
                } else if (hand_rank2[i].rankings2 === "Pair p2") {
                    console.log("Player 2 highest rank is a pair");
                    ranking2 = 2;
                    return
                } else if (hand_rank2[i].rankings2 === "High Card p2") {
                    console.log("Player 2 highest rank is a high card");
                    ranking2 = 1;
                    return;
                } else {
                    console.log("nothing");
                }

            }
        }
    if(ranking2 > ranking1)
    {
        console.log("Player2 win");
        return 1;

    }
    if(ranking2 === ranking1)
    {
        return -1;
    }
    else
    {
        console.log("Player1 win");
        return 0;
    }
};

Game.prototype.discard_cards = function ()
{
    play_sound(this.cardFlip_audio);
    for (let i=0; i<this.players_array.length; i++)
    {
        for (let j=0; j<2; j++)
        {
            this.discard_deck.add_card(this.players_array[i].remove_from_hand());
            document.getElementById("card" + j + "_" + i).src = "images/red_back.png";
        }
    }
    for (let i=0; i<5; i++)
    {
        this.discard_deck.add_card(this.discard_shared_card());
        document.getElementById("card" + i + "_share").src = "images/red_back.png";
    }
};