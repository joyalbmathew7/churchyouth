
import { useEffect, useRef, useState } from "react";
import "./FlappyGame.css";

const GAME_WIDTH = 360;
const GAME_HEIGHT = 500;
const BIRD_SIZE = 42;
const BIRD_X = 75;
const PIPE_WIDTH = 56;
const PIPE_GAP = 155;
const GRAVITY = 0.38;
const JUMP_POWER = -6.5;

function createPipe(x) {
  const minTop = 65;
  const maxTop = GAME_HEIGHT - PIPE_GAP - 100;

  return {
    x,
    top: minTop + Math.random() * (maxTop - minTop),
    scored: false,
  };
}

export default function FlappyGame() {
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem("church-flappy-best")) || 0;
    } catch {
      return 0;
    }
  });

  const canvasRef = useRef(null);
  const faceRef = useRef(null);
  const frameRef = useRef(null);
  const gameRef = useRef(null);
  const statusRef = useRef("ready");
  const scoreRef = useRef(0);
  const bestRef = useRef(best);
  const crashAudioRef = useRef(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const face = new Image();
    face.src = "/game/face.png";
    faceRef.current = face;

    const crashAudio = new Audio("/game/crash.mp3");
    crashAudio.preload = "auto";
    crashAudioRef.current = crashAudio;

    const groundY = GAME_HEIGHT - 30;

    gameRef.current = {
      birdY: 220,
      velocity: 0,
      pipes: [createPipe(260), createPipe(470)],
      lastPipeX: 470,
      frame: 0,
    };

    function draw() {
      // Sky
      ctx.fillStyle = "#8bdcff";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (const cloud of [
        [45, 85],
        [235, 140],
        [150, 45],
      ]) {
        ctx.beginPath();
        ctx.arc(cloud[0], cloud[1], 22, 0, Math.PI * 2);
        ctx.arc(cloud[0] + 22, cloud[1] + 5, 17, 0, Math.PI * 2);
        ctx.fill();
      }

      const game = gameRef.current;

      // Pipes
      for (const pipe of game.pipes) {
        const bottomY = pipe.top + PIPE_GAP;

        ctx.fillStyle = "#36b844";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.fillRect(
          pipe.x - 5,
          pipe.top - 18,
          PIPE_WIDTH + 10,
          18
        );

        ctx.fillRect(
          pipe.x,
          bottomY,
          PIPE_WIDTH,
          groundY - bottomY
        );
        ctx.fillRect(
          pipe.x - 5,
          bottomY,
          PIPE_WIDTH + 10,
          18
        );

        // Pipe highlights
        ctx.fillStyle = "#80ef76";
        ctx.fillRect(pipe.x + 8, 0, 7, pipe.top - 18);
        ctx.fillRect(
          pipe.x + 8,
          bottomY + 18,
          7,
          groundY - bottomY - 18
        );

        ctx.strokeStyle = "#187a2a";
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.strokeRect(
          pipe.x,
          bottomY,
          PIPE_WIDTH,
          groundY - bottomY
        );
      }

      // Ground
      ctx.fillStyle = "#dfc47b";
      ctx.fillRect(0, groundY, GAME_WIDTH, 30);
      ctx.fillStyle = "#55bd4b";
      ctx.fillRect(0, groundY, GAME_WIDTH, 7);

      // Your face — no wings or extra character graphics
      const face = faceRef.current;
      if (face?.complete && face.naturalWidth > 0) {
        ctx.save();
        ctx.translate(
          BIRD_X + BIRD_SIZE / 2,
          game.birdY + BIRD_SIZE / 2
        );

        const angle = Math.max(
          -0.35,
          Math.min(0.8, game.velocity * 0.07)
        );

        ctx.rotate(angle);
        ctx.drawImage(
          face,
          -BIRD_SIZE / 2,
          -BIRD_SIZE / 2,
          BIRD_SIZE,
          BIRD_SIZE
        );
        ctx.restore();
      } else {
        ctx.fillStyle = "#f4a261";
        ctx.beginPath();
        ctx.arc(
          BIRD_X + BIRD_SIZE / 2,
          game.birdY + BIRD_SIZE / 2,
          BIRD_SIZE / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    function crash() {
      if (statusRef.current !== "playing") return;

      statusRef.current = "over";
      setStatus("over");

      const audio = crashAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // The browser may block audio playback.
        });
      }

      if (scoreRef.current > bestRef.current) {
        bestRef.current = scoreRef.current;
        setBest(scoreRef.current);

        try {
          localStorage.setItem(
            "church-flappy-best",
            String(scoreRef.current)
          );
        } catch {
          // The game still works if storage is unavailable.
        }
      }
    }

    function update() {
      const game = gameRef.current;

      if (statusRef.current === "playing") {
        game.frame += 1;
        game.velocity += GRAVITY;
        game.birdY += game.velocity;

        // Move pipes
        for (const pipe of game.pipes) {
          pipe.x -= 2.2;

          // Score when passing a pipe
          if (
            !pipe.scored &&
            pipe.x + PIPE_WIDTH < BIRD_X
          ) {
            pipe.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }

          // Bird collision box
          const birdLeft = BIRD_X + 5;
          const birdRight = BIRD_X + BIRD_SIZE - 5;
          const birdTop = game.birdY + 5;
          const birdBottom = game.birdY + BIRD_SIZE - 5;

          const overlapsPipe =
            birdRight > pipe.x &&
            birdLeft < pipe.x + PIPE_WIDTH;

          if (
            overlapsPipe &&
            (birdTop < pipe.top ||
              birdBottom > pipe.top + PIPE_GAP)
          ) {
            crash();
          }
        }

        // Add new pipes
        const lastPipe = game.pipes[game.pipes.length - 1];

        if (lastPipe && lastPipe.x < GAME_WIDTH - 200) {
          game.pipes.push(createPipe(GAME_WIDTH + 20));
        }

        game.pipes = game.pipes.filter(
          (pipe) => pipe.x > -PIPE_WIDTH - 10
        );

        // Ground and ceiling collision
        if (
          game.birdY < 0 ||
          game.birdY + BIRD_SIZE > groundY
        ) {
          crash();
        }
      }

      draw();
      frameRef.current = requestAnimationFrame(update);
    }

    function jump() {
      if (statusRef.current === "playing") {
        gameRef.current.velocity = JUMP_POWER;
      }
    }

    function handleKeyDown(event) {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    frameRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function startGame() {
    const game = gameRef.current;
    if (!game) return;

    game.birdY = 220;
    game.velocity = 0;
    game.pipes = [createPipe(260), createPipe(470)];
    game.lastPipeX = 470;
    game.frame = 0;

    scoreRef.current = 0;
    setScore(0);

    statusRef.current = "playing";
    setStatus("playing");
  }

  function jump() {
    if (statusRef.current === "playing" && gameRef.current) {
      gameRef.current.velocity = JUMP_POWER;
    }
  }

  return (
    <section className="flappy-section">
      <div className="flappy-heading">
        <h2>Take a Little Break!</h2>
        <p>Can you fly through the pipes without crashing?</p>
      </div>

      <div className="flappy-game">
        <div className="flappy-score">
          <span>Score: {score}</span>
          <span>Best: {best}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onPointerDown={jump}
          className="flappy-canvas"
          aria-label="Flappy face game. Tap to fly."
        />

        {status !== "playing" && (
          <div className="flappy-overlay">
            <h3>
              {status === "ready"
                ? "Ready to Fly?"
                : "Oops! You Crashed!"}
            </h3>

            <p>
              {status === "ready"
                ? "Tap or press Space to fly."
                : `Your score: ${score}`}
            </p>

            <button onClick={startGame}>
              {status === "ready" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>

      <p className="flappy-help">
        Tap the game or press Space / ↑ to fly.
      </p>
    </section>
  );
}
