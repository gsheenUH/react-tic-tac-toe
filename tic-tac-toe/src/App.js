import { useState, useEffect } from "react";

function BoardSizeSelector({ initialRows = 3, initialCols = 3, onSizeChange }) {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);

  function handleSubmit(e) {
    e.preventDefault();
    onSizeChange(rows, cols);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <label style={{ marginRight: "10px" }}>
        Rows: 
        <input 
          type="number" 
          min="1" 
          value={rows} 
          onChange={(e) => setRows(Number(e.target.value))} 
          style={{ width: "60px", marginLeft: "5px" }}
        />
      </label>
      <label style={{ marginRight: "10px" }}>
        Columns: 
        <input 
          type="number" 
          min="1" 
          value={cols} 
          onChange={(e) => setCols(Number(e.target.value))} 
          style={{ width: "60px", marginLeft: "5px" }}
        />
      </label>
      <button type="submit">Set Board Size</button>
    </form>
  );
}

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
        fontWeight: "bold",
      }}
    >
      {value}
    </button>
  );
}

function checkGenericWinner(board, rows, cols) {
  const K = Math.min(rows, cols);

  function getCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    return board[r * cols + c];
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const symbol = getCell(r, c);
      if (!symbol) continue;

      // Horizontal
      let count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // Vertical
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r + offset, c) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // Diagonal down-right
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r + offset, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;

      // Diagonal up-right
      count = 1;
      for (let offset = 1; offset < K; offset++) {
        if (getCell(r - offset, c + offset) === symbol) {
          count++;
        } else break;
      }
      if (count === K) return symbol;
    }
  }
  return null;
}

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
        bestScore = Math.max(score, bestScore);
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
        bestScore = Math.min(score, bestScore);
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
        currentPlayer === "X" // isMaximizing?
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

function Board({ board, rows, cols, xIsNext, humanPlayer, onPlay, winner }) {
  function handleClick(index) {
    if (winner || board[index]) return; // ignore if game over or cell taken

    const currentPlayer = xIsNext ? "X" : "O";
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

  // Render NxM
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
      <div key={r} className="board-row" style={{ lineHeight: "0" }}>
        {colsArray}
      </div>
    );
  }

  return (
    <>
      <div className="status" style={{ marginBottom: "10px" }}>
        {status}
      </div>
      {rowsArray}
    </>
  );
}

export default function Game() {
  // Rows & cols stored in state so user can switch
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // Build an initial empty board of size rows*cols
  const [history, setHistory] = useState([Array(rows * cols).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);

  // Track which player the user is controlling
  const [humanPlayer, setHumanPlayer] = useState("X");

  // Re-build the board whenever the user changes board size
  // You might want to reset the game as well
  function handleSizeChange(newRows, newCols) {
    setRows(newRows);
    setCols(newCols);
    // Reset everything for the new board dimension
    setHistory([Array(newRows * newCols).fill(null)]);
    setCurrentMove(0);
    setHumanPlayer("X"); // Optional: revert to X by default
  }

  const currentBoard = history[currentMove];
  const xIsNext = (currentMove % 2 === 0);

  // If we have a winner, store it
  const winner = checkGenericWinner(currentBoard, rows, cols);

  // useEffect: if it's AI's turn, compute best move with minimax
  useEffect(() => {
    if (winner || !currentBoard.includes(null)) return; // game done

    const currentPlayer = xIsNext ? "X" : "O";
    if (humanPlayer !== currentPlayer) {
      // AI turn
      const boardCopy = currentBoard.slice();
      const bestIndex = findBestMove(boardCopy, rows, cols, currentPlayer);
      if (bestIndex != null) {
        boardCopy[bestIndex] = currentPlayer;
        setTimeout(() => {
          handlePlay(boardCopy);
        }, 300);
      }
    }
  }, [xIsNext, currentBoard, humanPlayer, winner, rows, cols]);

  function handlePlay(nextBoard) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextBoard];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(moveIdx) {
    setCurrentMove(moveIdx);
  }

  function resetGame() {
    setHistory([Array(rows * cols).fill(null)]);
    setCurrentMove(0);
  }

  function handleSwapPlayers() {
    setHumanPlayer(prev => (prev === "X" ? "O" : "X"));
  }

  const switchLabel = humanPlayer === "X" ? "Switch to Player O" : "Switch to Player X";

  const moves = history.map((stepBoard, moveIdx) => {
    const desc = moveIdx > 0 ? "Go to move #" + moveIdx : "Go to game start";
    return (
      <li key={moveIdx}>
        <button onClick={() => jumpTo(moveIdx)}>{desc}</button>
      </li>
    );
  });

  return (
    <div style={{ margin: "20px" }}>
      {/* 1) BoardSizeSelector at top */}
      <BoardSizeSelector onSizeChange={handleSizeChange} />

      <div className="game" style={{ display: "flex", flexDirection: "row" }}>
        <div className="game-board" style={{ marginRight: "20px" }}>
          <Board
            board={currentBoard}
            rows={rows}
            cols={cols}
            xIsNext={xIsNext}
            humanPlayer={humanPlayer}
            onPlay={handlePlay}
            winner={winner}
          />
        </div>

        <div className="game-info">
          <ol>{moves}</ol>
          <div style={{ marginTop: "10px" }}>
            <button onClick={resetGame} style={{ marginRight: "10px" }}>
              Reset Game
            </button>
            <button onClick={handleSwapPlayers}>
              {switchLabel}
            </button>
          </div>
          {winner && <p style={{ marginTop: "15px" }}>Game Over!</p>}
          <p style={{ marginTop: "10px" }}>
            Human is currently: <strong>{humanPlayer}</strong>
          </p>
          <p>Rows: {rows}, Columns: {cols}</p>
          <p>
            Note: It takes some time to load the first move for any board larger than 3x3
          </p>
        </div>
      </div>
    </div>
  );
}
