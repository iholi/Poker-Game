/**
 * Deck object that stores many Card objects.
 * @param card_num  number of cards in the deck
 * @constructor
 */
function Deck(card_num) {
    this.cards_array = [];

    this.setup = function() {
        let ranks = card_num/4;
        for (let i=0; i<ranks; i++)
        {
            this.add_card(new Card(i+2,"Hearts"));
            this.add_card(new Card(i+2,"Diamonds"));
            this.add_card(new Card(i+2,"Clubs"));
            this.add_card(new Card(i+2,"Spades"));
        }
    };
    this.setup();
}

/**
 * Adds a Card object to the top of the cards_array stack.
 * @param card  Card object to be added
 */
Deck.prototype.add_card = function (card) {
    this.cards_array.push(card);
};

/**
 * Removes a Card object from the top of the cards_array stack.
 * @returns {Card}  the Card object that was removed
 */
Deck.prototype.draw_card = function () {
    return this.cards_array.pop();
};

/**
 * Shuffles the cards_array randomly.
 */
Deck.prototype.shuffle_deck = function () {
    console.log("shuffling deck");
    for (let i = this.cards_array.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards_array[i], this.cards_array[j]] = [this.cards_array[j], this.cards_array[i]];
    }
    //for printing out cards in array to console
    /*
    this.cards_array.map(x => console.log(x.rank_number,x.suit_text,x.path_text));
    console.log(this.cards_array.length + " cards");
    */
    //for testing hand ranker
    /*
    this.add_card(new Card(9,"Spades")); //river  table
    this.add_card(new Card(2,"Spades"));
    this.add_card(new Card(13,"Hearts")); //turn table
    this.add_card(new Card(13,"Clubs"));
    this.add_card(new Card(12,"Hearts")); //flop table
    this.add_card(new Card(14,"Hearts")); //flop table
    this.add_card(new Card(14,"Clubs")); //flop table
    this.add_card(new Card(2,"Clubs"));
    this.add_card(new Card(14,"Spades")); //player 1
    this.add_card(new Card(14,"Hearts")); //player 1
    this.add_card(new Card(11,"Hearts")); //player 0
    this.add_card(new Card(10,"Hearts")); //player 0
    */
};