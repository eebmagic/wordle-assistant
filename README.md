# Wordle Recs

🔗 https://eebmagic.github.io/wordle-recs/

This page is intended to help find words that are valid solutions in [Wordle](https://www.powerlanguage.co.uk/wordle/).

## Using

- Type out all the words that you've already guessed in Wordle and click letters to cycle through colorings until the page matches the current state in your wordle game.

- Click the `FIND SOLUTIONS` button to show the list of valid words left.


## Approach Details

- Valid words are first filtered with a regex through all five letter words.
- Valid words are then sorted three ways:
    1. Word frequency in english
    2. Combined letter frequency ([similar to strategy of guessting R,S,T,L,N,E in Wheel of Fortune](https://uproxx.com/edge/wheel-of-fortune-wordle-strategies/))
    3. Containing letters that would divide remaining words by nearly half
        - If a word contains a letter that is contained in almost half of the remaining list then it will be ranked higher
- Each of these three heuristics are weighted and combined for final sorting of the valid word list
- The top 20 words are listed and the rest are cut off

