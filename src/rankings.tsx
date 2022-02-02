const words = require('./data/fives.json');
const wordFreqs = require('./data/frequencies.json');
const letterFreqs = require('./data/letter_frequencies.json');

export const rankLetterFreq = (wordList: string[]) => {
    // Reference file for letter frequencies
    console.log('CALLED RANK LETTER FREQ');
}

export const rankWordFreq = (wordList: string[]) => {
    // Reference file for word frequencies
    console.log('CALLED RANK WORD FREQ');

    let out = wordList.sort((a: string, b:string) => {
        return wordFreqs[a] - wordFreqs[b];
    }).reverse();

    return out;
}

export const rankSolnDivision = (wordList: string[]) => {
    // Rank by number of letters in a word
    //  that are ~50% present in wordList
    console.log('CALLED RANK SOLN DIVISION');

    let presences = new Map<string, number>();
    let increment = 1 / wordList.length;

    wordList.forEach((word: string) => {
        let letters = new Set(word);
        letters.forEach((letter: string) => {
            if (presences.has(letter)) {
                let old = presences.get(letter) || 0;
                presences.set(letter, old + increment);
            } else {
                presences.set(letter, increment);
            }
        })
    });

    let letterVals = new Map<string, number>();
    Array.from(presences.keys()).forEach((letter: string) => {
        letterVals.set(letter, 0.5 - Math.abs(0.5 - presences.get(letter)!));
    });

    let wordVals = new Map<string, number>();
    wordList.forEach((word: string) => {
        let letters = new Set(word);
        let total = 0;
        letters.forEach((letter: string) => total += letterVals.get(letter)!);
        wordVals.set(word, total);
    })

    // Sort by largest sum of values from letterVals for each letter in word 
    let out = wordList.sort((a: string, b: string) => {
        return wordVals.get(a)! - wordVals.get(b)!;
    }).reverse();

    // console.log(`Total number of words: ${wordList.length}`);
    // console.log('LETTER PRESENCES:')
    // console.log(presences);
    // console.log(letterVals);
    // console.log(wordVals);
    // console.log(out);

    return out;
}