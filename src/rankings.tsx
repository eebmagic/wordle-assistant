const words = require('./data/fives.json');
const wordFreqs = require('./data/frequencies.json');
const letterFreqs = require('./data/letter_frequencies.json');

const getWordLetterFreq = (word: string) => {
    let sum = 0;
    let letters = [];
    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        let f = letterFreqs[char];
        sum += f;
        letters.push(f);
    }

    return {'sum':sum, 'letters':letters};
}

const getMaxLetterCount = (word: string) => {
    let counts = new Map<string, number>();
    for (let i = 0; i < word.length; i++) {
        let char = word[i];
        if (counts.has(char)) {
            counts.set(char, counts.get(char)! + 1);
        } else {
            counts.set(char, 1);
        }
    }
    return 5 - Math.max.apply(null, Array.from(counts.values()));
}

export const rankLetterFreq = (wordList: string[]) => {
    // Reference file for letter frequencies
    // Rank all words given by their letter's frequencies according to file

    // Build dict of word values based on above function
    let letterFreqs = new Map<string, number>();
    wordList.forEach((word: string) => {
        letterFreqs.set(word, getWordLetterFreq(word).sum);
    });

    let largest = Math.max.apply(null, Array.from(letterFreqs.values()));
    wordList.forEach((word: string) => {
        letterFreqs.set(word, letterFreqs.get(word)! + ((largest * 0.2) * getMaxLetterCount(word)));
    })

    // Sort by built data
    let out = wordList.sort((a: string, b: string) => {
        return letterFreqs.get(a)! - letterFreqs.get(b)!;
    }).reverse();

    return out;
}

export const rankWordFreq = (wordList: string[]) => {
    // Reference file for word frequencies
    let out = wordList.sort((a: string, b:string) => {
        return wordFreqs[a] - wordFreqs[b];
    }).reverse();

    return out;
}

export const rankSolnDivision = (wordList: string[]) => {
    // Rank by number of letters in a word
    //  that are ~50% present in wordList
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

    return out;
}