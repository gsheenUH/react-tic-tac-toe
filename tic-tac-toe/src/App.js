import { useState, useEffect } from 'react';

function Square({value, onSquareClick}) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );    
}

function findBestMove(squares) {
  // 1. If O can force a win right now, choose that
  let move = winningMove(squares, "O");
  if (move != null) return move;

  // 2. If X is about to win, block it
  move = winningMove(squares, "X");
  if (move != null) return move;

  // 3. Otherwise, pick the first available square 
  //    according to the priority [4, 0, 2, 6, 8, 1, 3, 5, 7]
  const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const idx of moveOrder) {
    if (!squares[idx]) {
      return idx;
    }
  }

  // If we get here, there was no empty square
  return null;
}

/**
 * Helper to find a winning move for the given `player` (X or O).
 * Returns the index of a winning move if found, or null otherwise.
 */
function winningMove(squares, player) {
  for (let i = 0; i < squares.length; i++) {
    if (!squares[i]) {
      // Temporarily place the player in this spot
      squares[i] = player;
      if (calculateWinner(squares) === player) {
        squares[i] = null; // revert the change
        return i;
      }
      squares[i] = null; // revert the change
    }
  }
  return null;
}

function Board({ xIsNext, squares, onPlay}) {

  function handleClick(i){
    const winner = calculateWinner(squares);

    // If square is taken or the game is already won, ignore the click
    if (squares[i] || winner) {
      return;
    }

    // Only let the user place X if it's X's turn
    if (!xIsNext) {
      return;
    }

    // Step 1) Make a fresh copy of squares for X's move
    const nextSquaresX = squares.slice();
    nextSquaresX[i] = "X";

    // Step 2) Update state with X's move
    onPlay(nextSquaresX);
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

function calculateWinner(squares) {
  const re = /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/;

  // Replace null or empty squares with '-'
  const boardString = squares.map((square) => (square ? square : "-")).join("");

  const match = re.exec(boardString);

  if (match) {
    // One of the capturing groups 1, 2, 3, or 4 will hold the "X" or "O"
    return match[1] || match[2] || match[3] || match[4];
  }

  return null;
}

export default function Game(){
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  // Use useEffect to make O's move after X has played
  useEffect(() => {
    // Only make O's move if it's O's turn and the game isn't over
    if (!xIsNext && !calculateWinner(currentSquares) && currentSquares.includes(null)) {
      const nextSquaresO = currentSquares.slice();
      const oBestIndex = findBestMove(nextSquaresO);
      
      if (oBestIndex !== null) {
        nextSquaresO[oBestIndex] = "O";
        
        // Add a small delay so user can see X's move first
        setTimeout(() => {
          handlePlay(nextSquaresO);
        }, 300);
      }
    }
  }, [xIsNext, currentSquares]);

  function handlePlay(nextSquares){
    const nextHistory = [...history.slice(0, currentMove+1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function resetGame(){
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
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
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
        <button onClick={resetGame} style={{ marginTop: '10px' }}>
          Reset Game
        </button>
      </div>
    </div>
  )
}