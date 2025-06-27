import React, { useEffect, useState } from "react";

// Backend configuration
const BACKEND_BASE_URL = "http://localhost:3001";

// Utility: fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${BACKEND_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("Could not parse response.");
  }
  if (!res.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
}

// Board rendering helpers
function getStatusText(status, winner) {
  if (status === "X_WON" || status === "O_WON") {
    return `Game Over! Winner: ${winner}`;
  }
  if (status === "DRAW") {
    return "Game Over! It's a draw.";
  }
  if (status === "IN_PROGRESS") {
    return null;
  }
  return status;
}

// PUBLIC_INTERFACE
export default function TicTacToe() {
  // Game state from backend
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [winner, setWinner] = useState(null);

  // UI state
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState("");
  const [startingPlayer, setStartingPlayer] = useState("X"); // Option to start with O
  const [showStartOptions, setShowStartOptions] = useState(true);

  // Start a new game
  async function startNewGame(e) {
    if (e) e.preventDefault();
    setApiLoading(true);
    setError("");
    try {
      const res = await apiRequest("/game", {
        method: "POST",
        body: JSON.stringify({ starting_player: startingPlayer }),
      });
      setGameId(res.game_id);
      setBoard(res.board);
      setCurrentPlayer(res.current_player);
      setStatus(res.status);
      setWinner(res.winner);
      setShowStartOptions(false);
    } catch (e) {
      setError(e.message);
    }
    setApiLoading(false);
  }

  // Make a move
  async function handleCellClick(row, col) {
    if (status !== "IN_PROGRESS") return;
    if (!gameId) return;
    // Do not allow clicking non-empty, or if not user's turn
    if (board[row][col]) return;
    setApiLoading(true);
    setError("");
    try {
      const res = await apiRequest(`/game/${gameId}/move`, {
        method: "POST",
        body: JSON.stringify({ row, col, player: currentPlayer }),
      });
      setBoard(res.board);
      setStatus(res.status);
      setWinner(res.winner);
      // Only switch currentPlayer if game is still in progress
      if (res.status === "IN_PROGRESS") {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    } catch (e) {
      setError(e.message);
    }
    setApiLoading(false);
  }

  // Reset to allow new game
  const handleReset = () => {
    setGameId(null);
    setBoard([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    setCurrentPlayer("X");
    setStatus("IN_PROGRESS");
    setWinner(null);
    setError("");
    setShowStartOptions(true);
  };

  // Fetch current state if gameId changes, e.g., after reload
  useEffect(() => {
    if (!gameId) return;
    setApiLoading(true);
    apiRequest(`/game/${gameId}`)
      .then((res) => {
        setBoard(res.board);
        setCurrentPlayer(res.current_player);
        setStatus(res.status);
        setWinner(res.winner);
      })
      .catch(() => {})
      .finally(() => setApiLoading(false));
    // eslint-disable-next-line
  }, [gameId]);

  // Render board
  const renderBoard = () => (
    <div className="ttt-board">
      {board.map((rowArr, rowIdx) => (
        <div className="ttt-row" key={rowIdx}>
          {rowArr.map((cell, colIdx) => (
            <button
              key={colIdx}
              className="ttt-cell"
              onClick={() => handleCellClick(rowIdx, colIdx)}
              disabled={Boolean(cell) || status !== "IN_PROGRESS" || apiLoading}
              aria-label={
                cell ? `Cell ${rowIdx + 1},${colIdx + 1} ${cell}` : `Cell ${rowIdx + 1},${colIdx + 1} empty`
              }
            >
              {cell ? cell : ""}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="ttt-app">
      <h1 className="ttt-title">Tic Tac Toe</h1>
      <p className="ttt-desc">Player vs Player — React + FastAPI</p>
      {showStartOptions ? (
        <form className="ttt-start-menu" onSubmit={startNewGame}>
          <label>
            Starting Player:&nbsp;
            <select
              value={startingPlayer}
              onChange={(e) => setStartingPlayer(e.target.value)}
              disabled={apiLoading}
            >
              <option value="X">X</option>
              <option value="O">O</option>
            </select>
          </label>
          <button type="submit" className="ttt-btn" disabled={apiLoading}>
            {apiLoading ? "Starting..." : "Start New Game"}
          </button>
        </form>
      ) : (
        <>
          {renderBoard()}
          <div className="ttt-info">
            <div>
              {status === "IN_PROGRESS" ? (
                <span>
                  Current turn: <span className="ttt-player">{currentPlayer}</span>
                </span>
              ) : (
                <span className="ttt-result">{getStatusText(status, winner)}</span>
              )}
            </div>
            <button className="ttt-btn ttt-btn-reset" onClick={handleReset} disabled={apiLoading}>
              {status === "IN_PROGRESS" ? "Restart" : "Play Again"}
            </button>
          </div>
        </>
      )}
      {gameId && (
        <div className="ttt-gameid">
          <span>Game ID: {gameId}</span>
        </div>
      )}
      {error && <div className="ttt-error">⚠ {error}</div>}
      <footer className="ttt-footer">
        <hr />
        <small>
          Built with <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">React</a> &amp;{" "}
          <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer">FastAPI</a>
        </small>
      </footer>
    </div>
  );
}
