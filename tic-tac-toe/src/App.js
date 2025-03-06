import { useState, useEffect } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

/**
 * Returns "X" or "O" if there's a winner, otherwise null. 
 */
function checkWinner(board) {
  // Simple loop-based approach for clarity:
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Minimax function:
 * - board: current array of 9 elements: "X", "O", or null
 * - depth: the current level in the game tree
 * - isMaximizing: true if we are computing the move for "X" (the maximizing player)
 *
 * Returns an integer score: +10 (X win), -10 (O win), 0 (draw), 
 * or an intermediate score if the game isn't done yet.
 */
function minimax(board, depth, isMaximizing) {
  const winner = checkWinner(board);
  if (winner === "X") {
    return 10;
  } else if (winner === "O") {
    return -10;
  }

  // If no winner but board is full => draw
  if (!board.includes(null)) {
    return 0;
  }

  // If it's the maximizing player's turn ("X")
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        // Try placing "X" here
        board[i] = "X";
        const score = minimax(board, depth + 1, false);
        board[i] = null; // undo move
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  }
  // Otherwise, the minimizing player's turn ("O")
  else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = "O";
        const score = minimax(board, depth + 1, true);
        board[i] = null; // undo
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

/**
 * findBestMove: 
 *   - board: the current squares array of size 9
 *   - currentPlayer: "X" or "O" indicating who is about to move
 *
 * Returns the index (0..8) of the optimal move for currentPlayer.
 * If no moves are available, returns null.
 */
function findBestMove(board, currentPlayer) {
  let bestVal = (currentPlayer === "X") ? -Infinity : Infinity;
  let bestMove = null;

  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = currentPlayer;

      // Call minimax:
      // If the current player is "X" => isMaximizing = true
      // If the current player is "O" => isMaximizing = false
      const score = minimax(board, 0, (currentPlayer === "X"));

      board[i] = null;

      // Update bestVal/bestMove for "X" (max) or "O" (min)
      if (currentPlayer === "X") {
        if (score > bestVal) {
          bestVal = score;
          bestMove = i;
        }
      } else {
        if (score < bestVal) {
          bestVal = score;
          bestMove = i;
        }
      }
    }
  }
  return bestMove;
}

/**
 * Returns the index of a winning move for `player` (X or O) if one exists,
 * or null otherwise.
 *//*
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
}*/

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
  const winner = checkWinner(squares);

  function handleClick(i) {
    // If there's a winner or that cell is taken, ignore
    if (winner || squares[i]) return;

    // Figure out who is about to move: X or O
    const currentPlayer = xIsNext ? "X" : "O";

    // Only allow clicks if the *human* controls this current player
    if (humanPlayer === currentPlayer) {
      const nextSquares = squares.slice();
      nextSquares[i] = currentPlayer;
      onPlay(nextSquares);
    }
  }

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

    // Game is over
    if (winner || !currentSquares.includes(null)) {
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
