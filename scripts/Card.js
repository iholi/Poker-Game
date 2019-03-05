/**
 * Card object that stores information about its rank, suit, name, and image path.
 * @param rank  rank of the card
 * @param suit  suit of the card
 * @constructor
 */
function Card(rank,suit)
{
this.rank_number = rank;
this.suit_text = suit;
this.name_text = this.rank_number + "_" + this.suit_text;
this.path_text = "images/" + this.rank_number + this.suit_text + ".png";
}