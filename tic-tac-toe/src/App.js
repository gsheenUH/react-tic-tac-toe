import { useState, useEffect } from "react";

/** Let user pick rows & columns (with initial states). */
function BoardSizeSelector({ rows, cols, onSizeChange }) {
  const [localRows, setLocalRows] = useState(rows);
  const [localCols, setLocalCols] = useState(cols);

  function handleSubmit(e) {
    e.preventDefault();
    onSizeChange(localRows, localCols);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <label style={{ marginRight: "10px" }}>
        Rows:
        <input
          type="number"
          min="1"
          value={localRows}
          onChange={(e) => setLocalRows(Number(e.target.value))}
          style={{ width: "50px", marginLeft: "5px" }}
        />
      </label>
      <label style={{ marginRight: "10px" }}>
        Columns:
        <input
          type="number"
          min="1"
          value={localCols}
          onChange={(e) => setLocalCols(Number(e.target.value))}
          style={{ width: "50px", marginLeft: "5px" }}
        />
      </label>
      <button type="submit">Set Board Size</button>
    </form>
  );
}

/** A single square in the grid. */
function Square({ value, onSquareClick }) {
  return (
    <button
      className="square"
      onClick={onSquareClick}
      style={{
        width: "40px",
        height: "40px",
        display: "inline-block",
        margin: 0,
        padding: 0,
        textAlign: "center",
        verticalAlign: "top",
        border: "1px solid #999",
        fontSize: "24px",
        fontWeight: "bold"
      }}
    >
      {value}
    </button>
  );
}

/**
 * Safely copies the overlap region from the old board
 * into a new board sized newRows*newCols.
 */
function remapBoard(oldSquares, oldRows, oldCols, newRows, newCols) {
  const newSquares = Array(newRows * newCols).fill(null);
  const minRows = Math.min(oldRows, newRows);
  const minCols = Math.min(oldCols, newCols);

  // Copy overlap
  for (let r = 0; r < minRows; r++) {
    for (let c = 0; c < minCols; c++) {
      const oldIndex = r * oldCols + c;
      const newIndex = r * newCols + c;
      newSquares[newIndex] = oldSquares[oldIndex];
    }
  }
  return newSquares;
}

/**
 * Defensive NxM winner-check:
 * If board.length !== rows*cols, we skip the check entirely
 * so we don't go out of bounds.
 */
function checkGenericWinner(board, rows, cols) {
  // If there's a mismatch, bail out
  if (board.length !== rows * cols) {
    return null;
  }

  const K = Math.min(rows, cols);

  // Helper to safely retrieve a cell (with bounds checks)
  function getCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    const idx = r * cols + c;
    if (idx < 0 || idx >= board.length) return null;
    return board[idx];
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const symbol = getCell(r, c);
      if (!symbol) continue;

      // 1) Horizontal
      let count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // 2) Vertical
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r + offset, c) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // 3) Diagonal down-right
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r + offset, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // 4) Diagonal up-right
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r - offset, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;
    }
  }

  return null; // no winner
}

/** Minimax logic for NxM board. */
function minimax(board, rows, cols, depth, isMaximizing) {
  const winner = checkGenericWinner(board, rows, cols);
  if (winner === "X") return 10;
  if (winner === "O") return -10;
  if (!board.includes(null)) return 0; // draw

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = "X";
        const score = minimax(board, rows, cols, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(bestScore, score);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = "O";
        const score = minimax(board, rows, cols, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(bestScore, score);
      }
    }
    return bestScore;
  }
}

function findBestMove(board, rows, cols, currentPlayer) {
  let bestVal = currentPlayer === "X" ? -Infinity : Infinity;
  let bestMove = null;

  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = currentPlayer;
      const score = minimax(
        board,
        rows,
        cols,
        0,
        currentPlayer === "X" // isMaximizing
      );
      board[i] = null;

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

/** A generalized board that renders rows*cols squares. */
function Board({ board, rows, cols, xIsNext, humanPlayer, onPlay, winner }) {
  function handleClick(index) {
    // If there's a winner or the cell is taken, ignore
    if (winner || board[index]) return;

    const currentPlayer = xIsNext ? "X" : "O";
    // Only let the human player for that side click
    if (humanPlayer === currentPlayer) {
      const nextBoard = board.slice();
      nextBoard[index] = currentPlayer;
      onPlay(nextBoard);
    }
  }

  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else if (!board.includes(null)) {
    status = "Game ended in a draw";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  const rowsArray = [];
  for (let r = 0; r < rows; r++) {
    const colsArray = [];
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      colsArray.push(
        <Square
          key={index}
          value={board[index]}
          onSquareClick={() => handleClick(index)}
        />
      );
    }
    rowsArray.push(
      <div key={r} style={{ lineHeight: "0" }}>
        {colsArray}
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: "10px" }}>{status}</div>
      {rowsArray}
    </>
  );
}

/** Main Game component that can change board size mid-play. */
export default function Game() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // We store just a single-board "history" for simplicity.
  const [board, setBoard] = useState(() => Array(3 * 3).fill(null));

  // Keep track of how many moves have been made to determine xIsNext
  const [moveCount, setMoveCount] = useState(0);

  // Which side does the human control?
  const [humanPlayer, setHumanPlayer] = useState("X");

  // Let's see who the next player is
  const xIsNext = (moveCount % 2 === 0);

  // Check for a winner with defensive logic
  const winner = checkGenericWinner(board, rows, cols);

  // If it's the AI's turn, run findBestMove
  useEffect(() => {
    if (winner || !board.includes(null)) return; // game done

    const currentPlayer = xIsNext ? "X" : "O";
    if (humanPlayer !== currentPlayer) {
      // AI plays
      const boardCopy = board.slice();
      const bestIndex = findBestMove(boardCopy, rows, cols, currentPlayer);
      if (bestIndex != null) {
        boardCopy[bestIndex] = currentPlayer;
        // Give a short delay so we see the change
        setTimeout(() => {
          handleMove(boardCopy);
        }, 300);
      }
    }
  }, [xIsNext, board, humanPlayer, rows, cols, winner]);

  /** Called whenever we want to update the board (human or AI). */
  function handleMove(nextBoard) {
    setBoard(nextBoard);
    setMoveCount(moveCount + 1);
  }

  /** Called when the user changes the board size mid-play. */
  function handleSizeChange(newRows, newCols) {
    // 1) Create a new board from the old board using remapBoard
    const newSquares = remapBoard(board, rows, cols, newRows, newCols);

    // 2) Update rows, cols, board, but keep the same moveCount
    //    so that X vs O turn doesn't break
    setRows(newRows);
    setCols(newCols);
    setBoard(newSquares);
  }

  /** Reset the board entirely */
  function resetGame() {
    setBoard(Array(rows * cols).fill(null));
    setMoveCount(0);
  }

  function handleSwapPlayers() {
    setHumanPlayer((prev) => (prev === "X" ? "O" : "X"));
  }

  const switchLabel =
    humanPlayer === "X" ? "Switch to Player O" : "Switch to Player X";

  return (
    <div style={{ margin: "20px" }}>
      <BoardSizeSelector
        rows={rows}
        cols={cols}
        onSizeChange={handleSizeChange}
      />

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <Board
            board={board}
            rows={rows}
            cols={cols}
            xIsNext={xIsNext}
            humanPlayer={humanPlayer}
            onPlay={handleMove}
            winner={winner}
          />
        </div>

        <div>
          <div style={{ marginBottom: "10px" }}>
            <button onClick={resetGame} style={{ marginRight: "10px" }}>
              Reset Game
            </button>
            <button onClick={handleSwapPlayers}>{switchLabel}</button>
          </div>
          {winner && <p>Game Over!</p>}
          <p>Human is: {humanPlayer}</p>
          <p>Rows: {rows}, Cols: {cols}</p>
          <p>Move count: {moveCount}</p>
        </div>
      </div>
    </div>
  );
}
