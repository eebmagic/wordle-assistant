import { letters, status } from './constants'
import { useEffect, useState } from 'react'

import { WordListModal } from './components/WordListModal'
import { InfoModal } from './components/InfoModal'
import { Keyboard } from './components/Keyboard'
import { SettingsModal } from './components/SettingsModal'
import answers from './data/answers'
import { useLocalStorage } from './hooks/useLocalStorage'
import { ReactComponent as Info } from './data/Info.svg'
import { ReactComponent as Settings } from './data/Settings.svg'

import { rankLetterFreq, rankWordFreq, rankSolnDivision } from './rankings'
const fives = require('./data/fives.json');

type State = {
  board: string[][]
  cellStatuses: string[][]
  currentIndex: number
  letterStatuses: () => { [key: string]: string }
}

function App() {
  const initialStates: State = {
    board: [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ],
    cellStatuses: Array(6).fill(Array(5).fill(status.unguessed)),
    currentIndex: 0,
    letterStatuses: () => {
      const letterStatuses: { [key: string]: string } = {}
      letters.forEach((letter) => {
        letterStatuses[letter] = status.unguessed
      })
      return letterStatuses
    },
  }

  const [board, setBoard] = useLocalStorage('stateBoard', initialStates.board)
  const [cellStatuses, setCellStatuses] = useLocalStorage(
    'stateCellStatuses',
    initialStates.cellStatuses
  )
  const [currentIndex, setCurrentIndex] = useLocalStorage('stateCurrentIndex', initialStates.currentIndex)
  const [letterStatuses, setLetterStatuses] = useLocalStorage(
    'stateLetterStatuses',
    initialStates.letterStatuses()
  )

  const [modalIsOpen, setIsOpen] = useState(false)
  const [infoModalIsOpen, setInfoModalIsOpen] = useLocalStorage('infoModalOpen', true)
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false)

  const showResults = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const handleInfoClose = () => {
    setInfoModalIsOpen(false)
  }

  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false)
  const toggleDarkMode = () => setDarkMode((prev: boolean) => !prev)

  const getCellStyles = (rowNumber: number, colNumber: number, letter: string) => {
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

  // Helper for typing/deleting
  const getPosition = (ind: number) => {
    const width = 5;
    let row = Math.floor(ind / width);
    let col = ind % width;

    return {'row': row, 'col': col};
  }

  const addLetter = (letter: string) => {
    // Get coordinate position
    const pos = getPosition(currentIndex);

    // Add letter
    setBoard((prev: string[][]) => {
      const newBoard = [...prev]
      newBoard[pos.row][pos.col] = letter;

      return newBoard
    })

    // Update statuses at end of row
    if (pos.col >= 4) {
      setCellStatuses((prev: any) => {
        const newCellStatuses = [...prev];
        newCellStatuses[pos.row] = [...prev[pos.row]];

        for (let i = 0; i < newCellStatuses[pos.row].length; i++) {
          newCellStatuses[pos.row][i] = status.gray;
        }

        return newCellStatuses;
      })
    }

    // Increment index
    setCurrentIndex((prev: number) => prev + 1);
  }

  const onEnterPress = () => {
    playAgain();
  }

  const onDeletePress = () => {
    // Don't delete if already at front
    if (currentIndex === 0) return;

    // Get coordinates from previous index
    const pos = getPosition(currentIndex - 1);

    // Delete letter
    setBoard((prev: any) => {
      const newBoard = [...prev]
      newBoard[pos.row][pos.col] = ''
      return newBoard
    })

    // Update statuses for row where deleted
    setCellStatuses((prev: any) => {
      const newCellStatuses = [...prev];
      for (let i = 0; i < newCellStatuses[pos.row].length; i++) {
        newCellStatuses[pos.row][i] = status.unguessed;
      }
      return newCellStatuses;
    })

    // Increment index
    setCurrentIndex((prev: number) => prev - 1);
  }

  // Rotate through cell states
  const onClickFunc = (row: number, col: number) => {
    if (getPosition(currentIndex).row <= row) return;

    const order = [status.gray, status.yellow, status.green];

    setCellStatuses((prev: any) => {
      const newCellStatuses = [...prev];
      newCellStatuses[row] = [...prev[row]];

      if (prev[row][col] === status.unguessed) {
        newCellStatuses[row][col] = status.gray;
      } else {
        let curr = prev[row][col];
        newCellStatuses[row][col] = order[(order.indexOf(curr) + 1) % order.length];
      }

      return newCellStatuses;
    })

  }

  // Build regex expression to filter words
  const buildExpression = (grays: Set<string>, yellows: Map<string, string>, greens: string) => {
    const constraints = ['', '', '', '', ''];

    // Add yellow constraints
    yellows.forEach((yellow: any) => {
      for (let i = 0; i < yellow.length; i++) {
        let char = yellow[i];
        if (char !== '.') {
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
      if (greens[i] !== '.') {
        parts[i] = greens[i];
      } else {
        parts[i] = `[^${constraints[i]}]`
      }
    }

    const expression = RegExp(`^${parts.join('')}$`.toLowerCase());
    return expression;
  }

  // Check that full row of letters is written before searching for solutions
  const checkFullWords = () => {
    let out = true;
    board.forEach((row: string[]) => {
      let a = row[0] === '';
      let b = row[4] === '';
      let result = !(a === b);
      if (result) {
        out = false;
      }
    });

    if (board[0][0] === '') {
      out = false;
    }

    return out;
  }

  // Get all valid words, sorted by preferred order
  const getSolutions = () => {
    // Optimization to avoid calls on just 3 letters
    let fullWords = checkFullWords();
    if (!fullWords) {
      return [];
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
              if (greens[colInd] === '.') {
                const str = greens.split('');
                str[colInd] = char;
                greens = str.join('');
              } else {
                if (greens[colInd] !== char) {
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

  // Sort a list of words by various ranking functions
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
    setBoard(initialStates.board)
    setCellStatuses(initialStates.cellStatuses)
    setCurrentIndex(initialStates.currentIndex)
    setLetterStatuses(initialStates.letterStatuses())

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
            WORDLE RECS
          </h1>
          <button
            type="button"
            onClick={() => setInfoModalIsOpen(true)}
            className="p-1 rounded-full"
          >
            <Info />
          </button>
        </header>
        <div id="board" className="flex items-center bottom-8 flex-col py-3 flex-1 justify-center relative">
          <div className="relative">
            <div className="grid grid-cols-5 grid-flow-row gap-4">
              {board.map((row: string[], rowNumber: number) =>
                row.map((letter: string, colNumber: number) => {
                  return <span
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
                })
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
          wordList={getSolutions().slice(0, 20)}
          totalLen={getSolutions().length}
        />
        <SettingsModal
          isOpen={settingsModalIsOpen}
          handleClose={() => setSettingsModalIsOpen(false)}
          styles={modalStyles}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div className={`h-auto relative`}>
          <Keyboard
            addLetter={addLetter}
            onEnterPress={onEnterPress}
            onDeletePress={onDeletePress}
          />
        </div>
      </div>
    </div>
  )
}

export default App
