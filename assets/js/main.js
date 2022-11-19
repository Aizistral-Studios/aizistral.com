const quotes = [
	"brush away all of the things you don't like",
	"hello, it's a message from the stars",
	"it's painful to never do more than dream of it",
	"just a little bit of courage can be the trigger",
	"let's strike while loving the moment",
	"one day in the rain, one day in the shine",
	"our hopes burn on, it's a brand new day",
	"so to not forget kindness, let's bloom",
	"stars of premonition are falling upon our chests",
	"the miracle is right here and now",
	"there's no spare time to be discouraged",
	"there's still room for our strength to grow",
	"try harder than anyone, maintain your passion",
	"was the sky this same color, when it all began?",
	"you'll find big changes to your world",
	"after all, life connects us to so many places",
	"because I'm sure the future us will have the answer",
	"dreams aren't meant to be experienced only as dreams",
	"even if we don't understand, let's look forward to it",
	"I want to keep growing as I'm a young dreamer",
	"I'm sure the world is shining with unknown power",
	"if we run away it'll always weigh on our hearts",
	"instead of fretting, just do it, go with a bang!",
	"it's like the night sky knows everything",
	"let's open the door from zero to one",
	"let's soar on the new trajectory drawn by our blue wings",
	"let's broadcast them, let them reach you quickly",
	"the ship's leaving, so let's sail for the future",
	"will the path always be straight? probably not",
	"with a smile, I'll play an arpeggio and become free"
];

$(function() {
	pickQuote();
});

function pickQuote() {
	var i = Math.floor(Math.random() * quotes.length);
	$('#projects').text(quotes[i]);
}