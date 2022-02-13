import { letters, status } from './constants'
import { useEffect, useState } from 'react'

import { EndGameModal } from './components/EndGameModal'
import { WordListModal } from './components/WordListModal'
import { InfoModal } from './components/InfoModal'
import { Keyboard } from './components/Keyboard'
import { SettingsModal } from './components/SettingsModal'
import answers from './data/answers'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ReactComponent as Info } from './data/Info.svg'
import { ReactComponent as Settings } from './data/Settings.svg'

import { rankLetterFreq, rankWordFreq, rankSolnDivision } from './rankings'
const words = require('./data/words').default as { [key: string]: boolean }
const fives = require('./data/fives.json');

const state = {
  playing: 'playing',
  won: 'won',
  lost: 'lost',
}

export const difficulty = {
  easy: 'easy',
  normal: 'normal',
  hard: 'hard',
}

const getRandomAnswer = () => {
  const randomIndex = Math.floor(Math.random() * answers.length)
  return answers[randomIndex].toUpperCase()
}

type State = {
  answer: () => string
  gameState: string
  board: string[][]
  cellStatuses: string[][]
  currentRow: number
  currentCol: number
  letterStatuses: () => { [key: string]: string }
  submittedInvalidWord: boolean
}

function App() {
  const initialStates: State = {
    answer: () => getRandomAnswer(),
    gameState: state.playing,
    board: [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ],
    cellStatuses: Array(6).fill(Array(5).fill(status.unguessed)),
    currentRow: 0,
    currentCol: 0,
    letterStatuses: () => {
      const letterStatuses: { [key: string]: string } = {}
      letters.forEach((letter) => {
        letterStatuses[letter] = status.unguessed
      })
      return letterStatuses
    },
    submittedInvalidWord: false,
  }

  const [answer, setAnswer] = useLocalStorage('stateAnswer', initialStates.answer())
  const [gameState, setGameState] = useLocalStorage('stateGameState', initialStates.gameState)
  const [board, setBoard] = useLocalStorage('stateBoard', initialStates.board)
  const [cellStatuses, setCellStatuses] = useLocalStorage(
    'stateCellStatuses',
    initialStates.cellStatuses
  )
  const [currentRow, setCurrentRow] = useLocalStorage('stateCurrentRow', initialStates.currentRow)
  const [currentCol, setCurrentCol] = useLocalStorage('stateCurrentCol', initialStates.currentCol)
  const [letterStatuses, setLetterStatuses] = useLocalStorage(
    'stateLetterStatuses',
    initialStates.letterStatuses()
  )
  const [submittedInvalidWord, setSubmittedInvalidWord] = useLocalStorage(
    'stateSubmittedInvalidWord',
    initialStates.submittedInvalidWord
  )

  const [currentStreak, setCurrentStreak] = useLocalStorage('current-streak', 0)
  const [longestStreak, setLongestStreak] = useLocalStorage('longest-streak', 0)
  const [modalIsOpen, setIsOpen] = useState(false)
  const [firstTime, setFirstTime] = useLocalStorage('first-time', true)
  const [infoModalIsOpen, setInfoModalIsOpen] = useState(firstTime)
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false)
  const [difficultyLevel, setDifficultyLevel] = useLocalStorage('difficulty', difficulty.normal)
  const getDifficultyLevelInstructions = () => {
    if (difficultyLevel === difficulty.easy) {
      return 'Guess any 5 letters'
    } else if (difficultyLevel === difficulty.hard) {
      return "Guess any valid word using all the hints you've been given"
    } else {
      return 'Guess any valid word'
    }
  }
  const eg: { [key: number]: string } = {}
  const [exactGuesses, setExactGuesses] = useLocalStorage('exact-guesses', eg)

  const showResults = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const handleInfoClose = () => {
    setFirstTime(false)
    setInfoModalIsOpen(false)
  }

  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false)
  const toggleDarkMode = () => setDarkMode((prev: boolean) => !prev)

  useEffect(() => {
    if (gameState !== state.playing) {
      setTimeout(() => {
        showResults()
      }, 500)
    }
  }, [gameState])

  const getCellStyles = (rowNumber: number, colNumber: number, letter: string) => {
    if (rowNumber === currentRow) {
      if (letter) {
        return `nm-inset-background dark:nm-inset-background-dark text-primary dark:text-primary-dark ${
          submittedInvalidWord ? 'border border-red-800' : ''
        }`
      }
      return 'nm-flat-background dark:nm-flat-background-dark text-primary dark:text-primary-dark'
    }

    switch (cellStatuses[rowNumber][colNumber]) {
      case status.green:
        return 'nm-inset-n-green text-gray-50'
      case status.yellow:
        return 'nm-inset-yellow-500 text-gray-50'
      case status.gray:
        return 'nm-inset-n-gray text-gray-50'
      default:
        return 'nm-flat-background dark:nm-flat-background-dark text-primary dark:text-primary-dark'
    }
  }

  const addLetter = (letter: string) => {
    setSubmittedInvalidWord(false)
    setBoard((prev: string[][]) => {
      const newBoard = [...prev]
      newBoard[currentRow][currentCol] = letter
      return newBoard
    })
    if (currentCol < 4) {
      setCurrentCol((prev: number) => prev + 1);
    } else {
      setCellStatuses((prev: any) => {
        const newCellStatuses = [...prev];
        newCellStatuses[currentRow] = [...prev[currentRow]];

        for (let i = 0; i < newCellStatuses[currentRow].length; i++) {
          newCellStatuses[currentRow][i] = status.gray;
        }

        return newCellStatuses;
      })

      setCurrentCol(0);
      setCurrentRow((prev: number) => prev + 1);
    }
  }

  // returns an array with a boolean of if the word is valid and an error message if it is not
  const isValidWord = (word: string): [boolean] | [boolean, string] => {
    if (word.length < 5) return [false, `please enter a 5 letter word`]
    if (difficultyLevel === difficulty.easy) return [true]
    debugger
    if (!words[word.toLowerCase()]) return [false, `${word} is not a valid word. Please try again.`]
    if (difficultyLevel === difficulty.normal) return [true]
    const guessedLetters = Object.entries(letterStatuses).filter(([letter, letterStatus]) =>
      [status.yellow, status.green].includes(letterStatus)
    )
    const yellowsUsed = guessedLetters.every(([letter, _]) => word.includes(letter))
    const greensUsed = Object.entries(exactGuesses).every(
      ([position, letter]) => word[parseInt(position)] === letter
    )
    if (!yellowsUsed || !greensUsed)
      return [false, `In hard mode, you must use all the hints you've been given.`]
    return [true]
  }

  const onEnterPress = () => {
    playAgain();
  }

  const onDeletePress = () => {
    setSubmittedInvalidWord(false)
    if (currentCol === 0) {
      if (currentRow > 0) {
        setCurrentCol(5);
        setCurrentRow((prev: number) => prev - 1);
      }
    }

    setBoard((prev: any) => {
      const newBoard = [...prev]
      newBoard[currentRow][currentCol - 1] = ''
      return newBoard
    })

    setCellStatuses((prev: any) => {
      const newCellStatuses = [...prev];
      newCellStatuses[currentRow][currentCol - 1] = status.unguessed;
      return newCellStatuses;
    })

    if (currentCol > 0) {
      setCurrentCol((prev: number) => prev - 1);
    }
  }

  const updateCellStatuses = (word: string, rowNumber: number) => {
    const fixedLetters: { [key: number]: string } = {}
    setCellStatuses((prev: any) => {
      const newCellStatuses = [...prev]
      newCellStatuses[rowNumber] = [...prev[rowNumber]]
      const wordLength = word.length
      const answerLetters: string[] = answer.split('')

      // set all to gray
      for (let i = 0; i < wordLength; i++) {
        newCellStatuses[rowNumber][i] = status.gray
      }

      // check greens
      for (let i = wordLength - 1; i >= 0; i--) {
        if (word[i] === answer[i]) {
          newCellStatuses[rowNumber][i] = status.green
          answerLetters.splice(i, 1)
          fixedLetters[i] = answer[i]
        }
      }

      // check yellows
      for (let i = 0; i < wordLength; i++) {
        if (answerLetters.includes(word[i]) && newCellStatuses[rowNumber][i] !== status.green) {
          newCellStatuses[rowNumber][i] = status.yellow
          answerLetters.splice(answerLetters.indexOf(word[i]), 1)
        }
      }

      return newCellStatuses
    })
    setExactGuesses((prev: { [key: number]: string }) => ({ ...prev, ...fixedLetters }))
  }

  const isRowAllGreen = (row: string[]) => {
    return row.every((cell: string) => cell === status.green)
  }

  // every time cellStatuses updates, check if the game is won or lost
  useEffect(() => {
    const cellStatusesCopy = [...cellStatuses]
    const reversedStatuses = cellStatusesCopy.reverse()
    const lastFilledRow = reversedStatuses.find((r) => {
      return r[0] !== status.unguessed
    })

    if (gameState === state.playing && lastFilledRow && isRowAllGreen(lastFilledRow)) {
      setGameState(state.won)

      let streak = currentStreak + 1
      setCurrentStreak(streak)
      setLongestStreak((prev: number) => (streak > prev ? streak : prev))
    } else if (gameState === state.playing && currentRow === 6) {
      setGameState(state.lost)
      setCurrentStreak(0)
    }
  }, [
    cellStatuses,
    currentRow,
    gameState,
    setGameState,
    currentStreak,
    setCurrentStreak,
    setLongestStreak,
  ])

  const updateLetterStatuses = (word: string) => {
    setLetterStatuses((prev: { [key: string]: string }) => {
      const newLetterStatuses = { ...prev }
      const wordLength = word.length
      for (let i = 0; i < wordLength; i++) {
        if (newLetterStatuses[word[i]] === status.green) continue

        if (word[i] === answer[i]) {
          newLetterStatuses[word[i]] = status.green
        } else if (answer.includes(word[i])) {
          newLetterStatuses[word[i]] = status.yellow
        } else {
          newLetterStatuses[word[i]] = status.gray
        }
      }
      return newLetterStatuses
    })
  }

  const onClickFunc = (row: number, col: number) => {
    if (currentRow <= row) return;

    const roll = [status.gray, status.yellow, status.green];
    let givenLetter = board[row][col];

    setCellStatuses((prev: any) => {
      const newCellStatuses = [...prev];
      newCellStatuses[row] = [...prev[row]];

      if (prev[row][col] == status.unguessed) {
        newCellStatuses[row][col] = status.gray;
      } else {
        let curr = prev[row][col];
        newCellStatuses[row][col] = roll[(roll.indexOf(curr) + 1) % roll.length];
      }

      return newCellStatuses;
    })

  }

  const buildExpression = (grays: Set<string>, yellows: Map<string, string>, greens: string) => {
    const constraints = ['', '', '', '', ''];

    // Add yellow constraints
    yellows.forEach((yellow: any) => {
      for (let i = 0; i < yellow.length; i++) {
        let char = yellow[i];
        if (char != '.') {
          constraints[i] += char;
        }
      }
    });

    // Add gray constraints
    const grayString = [...grays].join('');
    for (let i = 0; i < constraints.length; i++) {
      constraints[i] += grayString
    }

    const parts = [...constraints];
    for (let i = 0; i < greens.length; i++) {
      if (greens[i] != '.') {
        parts[i] = greens[i];
      } else {
        parts[i] = `[^${constraints[i]}]`
      }
    }

    const expression = RegExp(`^${parts.join('')}$`.toLowerCase());
    return expression;
  }

  const checkFullWords = () => {
    let out = true;
    board.forEach((row: string[]) => {
      let a = row[0] == '';
      let b = row[4] == '';
      let result = !(a == b);
      if (!(a == b)) {
        out = false;
      }
    });

    return out;
  }

  const getSolutions = () => {
    // Optimization to avoid calls on just 3 letters
    // if (board[0][4] == '') {
    let fullWords = checkFullWords();
    console.log(`Dont check?: ${fullWords}`);
    if (!fullWords) {
      console.log('NOT CHECKING BECAUSE NOT FULL BOARD');
      return [];
    } else {
      console.log('CHECKING NOW')
    }
    let grays = new Set<string>();
    let yellows = new Map<string, string>();
    let greens = '.....';

    board.forEach((row: string[], rowInd: number) => {
      row.forEach((char: string, colInd: number) => {
        if (char) {
          let status = cellStatuses[rowInd][colInd];

          switch (status) {
            case "gray":
              grays.add(char);
              break;

            case "yellow":
              if (yellows.has(char)) {
                const str = yellows.get(char);
                if (str) {
                  const newStr = str.split('');
                  newStr[colInd] = char;
                  yellows.set(char, newStr.join(''));
                }
              } else {
                let start = '.....'.split('');
                start[colInd] = char;
                yellows.set(char, start.join(''));
              }
              break;

            case "green":
              if (greens[colInd] == '.') {
                const str = greens.split('');
                str[colInd] = char;
                greens = str.join('');
              } else {
                if (greens[colInd] != char) {
                  console.log(`##ERROR: Green char already defined as ${greens[colInd]} at ${colInd}: ${greens}`)
                }
              }
              break;

          }
        }
      });
    });

    const expression = buildExpression(grays, yellows, greens);
    const yellowLetters = Array.from(yellows.keys());

    let validWords = [...fives];
    validWords = validWords.filter((word: string) => expression.test(word));
    yellowLetters.forEach((letter: string) => {
      letter = letter.toLowerCase();
      validWords = validWords.filter((word: string) => word.includes(letter));
    })

    validWords = rankWords(validWords);
    return validWords;
  }

  const rankWords = (wordList: string[]) => {
    const letterWeight = 1;
    const wordFreqWeight = 6;
    const divisionWeight = 2;

    let rankings = new Map<string, number>();

    wordList.forEach((word: string) => {
      rankings.set(word, 0);
    });

    rankLetterFreq(wordList).forEach((word: string, i: number) => {
      let old = rankings.get(word);
      if (old) {
        rankings.set(word, old+(i*letterWeight));
      } else {
        rankings.set(word, (i*letterWeight));
      }
    })

    rankWordFreq(wordList).forEach((word: string, i: number) => {
      let old = rankings.get(word);
      if (old) {
        rankings.set(word, old+(i*wordFreqWeight));
      } else {
        rankings.set(word, (i*wordFreqWeight));
      }
    });

    rankSolnDivision(wordList).forEach((word: string, i: number) => {
      let old = rankings.get(word);
      if (old) {
        rankings.set(word, old+(i*divisionWeight));
      } else {
        rankings.set(word, (i*divisionWeight));
      }
    });

    wordList.sort((a: string, b: string) => {
      return rankings.get(a)! - rankings.get(b)!;
    });

    return wordList;
  }

  const playAgain = () => {
    setAnswer(initialStates.answer())
    setGameState(initialStates.gameState)
    setBoard(initialStates.board)
    setCellStatuses(initialStates.cellStatuses)
    setCurrentRow(initialStates.currentRow)
    setCurrentCol(initialStates.currentCol)
    setLetterStatuses(initialStates.letterStatuses())
    setSubmittedInvalidWord(initialStates.submittedInvalidWord)
    setExactGuesses({})

    closeModal()
  }

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? 'hsl(231, 16%, 25%)' : 'hsl(231, 16%, 92%)',
      zIndex: 99,
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      height: 'calc(100% - 2rem)',
      width: 'calc(100% - 2rem)',
      backgroundColor: darkMode ? 'hsl(231, 16%, 25%)' : 'hsl(231, 16%, 92%)',
      boxShadow: `${
        darkMode
          ? '0.2em 0.2em calc(0.2em * 2) #252834, calc(0.2em * -1) calc(0.2em * -1) calc(0.2em * 2) #43475C'
          : '0.2em 0.2em calc(0.2em * 2) #A3A7BD, calc(0.2em * -1) calc(0.2em * -1) calc(0.2em * 2) #FFFFFF'
      }`,
      border: 'none',
      borderRadius: '1rem',
      maxWidth: '475px',
      maxHeight: '650px',
      position: 'relative',
    },
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`flex flex-col justify-between h-fill bg-background dark:bg-background-dark`}>
        <header className="flex items-center py-2 px-3 text-primary dark:text-primary-dark">
          <button
            type="button"
            onClick={() => setSettingsModalIsOpen(true)}
            className="p-1 rounded-full"
          >
            <Settings />
          </button>
          <h1 className="flex-1 text-center text-xl xxs:text-2xl sm:text-4xl tracking-wide font-bold font-righteous">
            WORD MASTER
          </h1>
          <button
            type="button"
            onClick={() => setInfoModalIsOpen(true)}
            className="p-1 rounded-full"
          >
            <Info />
          </button>
        </header>
        <div className="flex items-center bottom-8 flex-col py-3 flex-1 justify-center relative">
          <div className="relative">
            <div className="grid grid-cols-5 grid-flow-row gap-4">
              {board.map((row: string[], rowNumber: number) =>
                row.map((letter: string, colNumber: number) => (
                  <span
                    key={colNumber}
                    onClick={() => onClickFunc(rowNumber, colNumber)}
                    className={`${getCellStyles(
                      rowNumber,
                      colNumber,
                      letter
                    )} inline-flex items-center font-medium justify-center text-lg w-[13vw] h-[13vw] xs:w-14 xs:h-14 sm:w-20 sm:h-20 rounded-full`}
                  >
                    {letter}
                  </span>
                ))
              )}
            </div>

            <div
              className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2`}
            >
              <div className={darkMode ? 'dark' : ''} id="buttonContainer">
                <button
                  autoFocus
                  type="button"
                  id="resetButton"
                  className="mx-[8px] rounded-lg z-10 px-6 py-2 text-lg nm-flat-background dark:nm-flat-background-dark hover:nm-inset-background dark:hover:nm-inset-background-dark text-primary dark:text-primary-dark"
                  onClick={() => {onEnterPress()}}
                >
                  RESET
                </button>
                <button
                  autoFocus
                  type="button"
                  id="startButton"
                  className="mx-[8px] rounded-lg z-10 px-6 py-2 text-lg nm-flat-background dark:nm-flat-background-dark hover:nm-inset-background dark:hover:nm-inset-background-dark text-primary dark:text-primary-dark"
                  onClick={() => {showResults()}}
                >
                  FIND SOLUTIONS
                </button>
              </div>
            </div>

            <div
              className={`absolute -bottom-24 left-1/2 transform -translate-x-1/2 ${
                gameState === state.playing ? 'hidden' : ''
              }`}
            >
              <div className={darkMode ? 'dark' : ''}>
                <button
                  autoFocus
                  type="button"
                  className="rounded-lg z-10 px-6 py-2 text-lg nm-flat-background dark:nm-flat-background-dark hover:nm-inset-background dark:hover:nm-inset-background-dark text-primary dark:text-primary-dark"
                  onClick={playAgain}
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <InfoModal
          isOpen={infoModalIsOpen}
          handleClose={handleInfoClose}
          darkMode={darkMode}
          styles={modalStyles}
        />
        <WordListModal
          isOpen={modalIsOpen}
          handleClose={closeModal}
          styles={modalStyles}
          darkMode={darkMode}
          gameState={gameState}
          state={state}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          answer={answer}
          playAgain={closeModal}
          wordList={getSolutions().slice(0, 20)}
          totalLen={getSolutions().length}
        />
        <SettingsModal
          isOpen={settingsModalIsOpen}
          handleClose={() => setSettingsModalIsOpen(false)}
          styles={modalStyles}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          difficultyLevel={difficultyLevel}
          setDifficultyLevel={setDifficultyLevel}
          levelInstructions={getDifficultyLevelInstructions()}
        />
        <div className={`h-auto relative ${gameState === state.playing ? '' : 'invisible'}`}>
          <Keyboard
            letterStatuses={letterStatuses}
            addLetter={addLetter}
            onEnterPress={onEnterPress}
            onDeletePress={onDeletePress}
            gameDisabled={gameState !== state.playing}
          />
        </div>
      </div>
    </div>
  )
}

export default App