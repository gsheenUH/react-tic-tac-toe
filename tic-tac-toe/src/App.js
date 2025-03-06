import { useState, useEffect } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

/** Attempts to find the best move for the specified squares/board. */
function findBestMove(squares, player) {
  // 1. If this player can force a win, choose that
  let move = winningMove(squares, player);
  if (move != null) return move;

  // 2. If the other player is about to win, block it
  const otherPlayer = (player === "X") ? "O" : "X";
  move = winningMove(squares, otherPlayer);
  if (move != null) return move;

  // 3. Otherwise, pick the first available square in priority:
  const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const idx of moveOrder) {
    if (!squares[idx]) {
      return idx;
    }
  }

  // If no squares are left
  return null;
}

/**
 * Returns the index of a winning move for `player` (X or O) if one exists,
 * or null otherwise.
 */
function winningMove(squares, player) {
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      squares[i] = player;      // place a temporary move
      if (calculateWinner(squares) === player) {
        squares[i] = null;     // revert
        return i;              // winning move found
      }
      squares[i] = null;       // revert
    }
  }
  return null;
}

/** Returns "X" or "O" if there's a winner, or null if none. */
function calculateWinner(squares) {
  // Regex approach from your Challenge #1
  // Matches any winning 3-in-a-row in a 9-character string.
  const re = /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/;
  const boardString = squares.map((square) => (square ? square : "-")).join("");

  const match = re.exec(boardString);
  if (match) {
    return match[1] || match[2] || match[3] || match[4];
  }
  return null;
}

/** Board component: Renders the 3x3 grid and handles the HUMAN's turn. */
function Board({ squares, xIsNext, humanPlayer, onPlay }) {
  function handleClick(i) {
    // If there's a winner or the cell is occupied, ignore.
    if (calculateWinner(squares) || squares[i]) {
      return;
    }

    // Figure out which player is about to move:
    const currentPlayer = xIsNext ? "X" : "O";

    // If the HUMAN is controlling that player, let them move:
    if (humanPlayer === currentPlayer) {
      const nextSquares = squares.slice();
      nextSquares[i] = currentPlayer;
      onPlay(nextSquares);
    }
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else if (!squares.includes(null)) {
    status = "Game ended in a draw";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  return (
    <>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);

  // Which side is the human controlling? "X" or "O"
  const [humanPlayer, setHumanPlayer] = useState("X");

  const currentSquares = history[currentMove];
  const xIsNext = (currentMove % 2 === 0);

  // Auto-Play logic: If it's the computer's turn, find best move.
  useEffect(() => {
    const winner = calculateWinner(currentSquares);
    if (winner || !currentSquares.includes(null)) {
      // Game is over, or no empty squares => no auto-play
      return;
    }

    // It's X's turn, but the user is not X, then Computer should play X
    if (xIsNext && humanPlayer !== "X") {
      const squaresCopy = currentSquares.slice();
      const bestIndex = findBestMove(squaresCopy, "X");
      if (bestIndex != null) {
        squaresCopy[bestIndex] = "X";
        // Slight delay so user can see the move
        setTimeout(() => {
          handlePlay(squaresCopy);
        }, 300);
      }
    }
    // It's O's turn, but the user is not O, then Computer should play O
    else if (!xIsNext && humanPlayer !== "O") {
      const squaresCopy = currentSquares.slice();
      const bestIndex = findBestMove(squaresCopy, "O");
      if (bestIndex != null) {
        squaresCopy[bestIndex] = "O";
        // Slight delay so user can see the move
        setTimeout(() => {
          handlePlay(squaresCopy);
        }, 300);
      }
    }
  }, [xIsNext, currentSquares, humanPlayer]);

  /** Called any time we want to update the board (X or O move). */
  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(moveIndex) {
    setCurrentMove(moveIndex);
  }

  function resetGame() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
  }

  // If the human was X, switch to O. If they were O, switch to X.
  function handleSwapPlayers() {
    setHumanPlayer((prev) => (prev === "X" ? "O" : "X"));
  }

  const winner = calculateWinner(currentSquares);

  // For the button label, show which side you'll be switching TO.
  const switchLabel =
    humanPlayer === "X" ? "Switch to Player O" : "Switch to Player X";

  const moves = history.map((stepSquares, move) => {
    let description;
    if (move > 0) {
      description = "Go to move #" + move;
    } else {
      description = "Go to game start";
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <Board
          squares={currentSquares}
          xIsNext={xIsNext}
          humanPlayer={humanPlayer}
          onPlay={handlePlay}
        />
      </div>

      <div className="game-info">
        <ol>{moves}</ol>
        <div>
          <button onClick={resetGame} style={{ marginRight: "10px" }}>
            Reset Game
          </button>
          <button onClick={handleSwapPlayers}>{switchLabel}</button>
        </div>
        {winner && <p style={{ marginTop: 15 }}>Game Over!</p>}
        <p style={{ marginTop: 10 }}>Player is: {humanPlayer}</p>
      </div>
    </div>
  );
}
