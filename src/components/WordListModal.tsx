import { ReactComponent as Close } from '../data/Close.svg'
import Modal from 'react-modal'

Modal.setAppElement('#root')

type Props = {
  isOpen: boolean
  handleClose: () => void
  styles: any
  darkMode: boolean
  gameState: any
  state: any
  currentStreak: any
  longestStreak: any
  answer: any
  playAgain: any
  wordList: string[]
  totalLen: number
}

export const WordListModal = ({
  isOpen,
  handleClose,
  styles,
  darkMode,
  gameState,
  state,
  currentStreak,
  longestStreak,
  answer,
  playAgain,
  wordList,
  totalLen
}: Props) => {
  const CloseButton = () => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <button
          autoFocus
          type="button"
          className="rounded-lg px-6 py-2 mt-8 text-lg nm-flat-background dark:nm-flat-background-dark hover:nm-inset-background dark:hover:nm-inset-background-dark text-primary dark:text-primary-dark"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    )
  }

  const WordList = () => {
    return (
      <div className={darkMode ? 'dark' : ''}>
        {wordList.map((word: string, wordNumber: number) =>
          <p key={word}>
            <strong>
              {word}
            </strong>
          </p>
        )}
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={styles}
      contentLabel="Game End Modal"
    >
      <div className={darkMode ? 'dark' : ''}>
        <div className="h-full flex flex-col items-center justify-center max-w-[300px] mx-auto text-primary dark:text-primary-dark">
          <button
            className="absolute top-4 right-4 rounded-full nm-flat-background dark:nm-flat-background-dark text-primary dark:text-primary-dark p-1 w-6 h-6 sm:p-2 sm:h-8 sm:w-8 hover:nm-inset-background dark:hover:nm-inset-background-dark"
            onClick={handleClose}
          >
            <Close />
          </button>

          <p><strong>{`[Total Remaining Words: ${totalLen}]`}</strong></p>
          <br/>

          <WordList />

          <CloseButton />
        </div>
      </div>
    </Modal>
  )
}
