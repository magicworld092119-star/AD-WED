import React, { useState, useEffect, useRef, useCallback } from 'react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

// Pre-defined log lines for the terminal effect
const LOG_MESSAGES = [
  "sys Agentic core booting...",
  "sys connecting to models - online",
  "memory warming long-term memory - 3 brands loaded",
  "embed index ready - semantic search online",
  "sys ready - listening for work",
  "static gpt-image - 1080x1350 - rendering",
  "script write - hooks=3 body=255w",
  "http GET /api/artifacts 200",
  "embed text-embedding-3-small dim=1536",
  "brand import assets - 4 products",
  "vision claude-vision - reading frame 14/22",
  "memory search semantic+keyword - 12 hits",
  "classify content_type=organic",
  "swipe analysis complete - awareness=Problem-Aware",
  "carousel 5 slides - shared template",
  "skill inspiration.find sources=meta,tiktok",
  "whisper transcribe 0:11 - music only",
  "http POST /api/brain 200 1.24s",
  "orch plan -> 6 steps - 4 sub-brains"
];

function generateTimestamp() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

export default function AgenticBackground() {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Initialize tsparticles
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  // Handle auto-scrolling of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Simulate real-time logs
  useEffect(() => {
    // Initial batch of logs to fill the screen slightly
    const initialLogs = Array(15).fill(null).map(() => ({
      time: generateTimestamp(),
      text: LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)],
      id: Math.random().toString(36).substring(7)
    }));
    setLogs(initialLogs);

    const interval = setInterval(() => {
      setLogs(prevLogs => {
        const newLog = {
          time: generateTimestamp(),
          text: LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)],
          id: Math.random().toString(36).substring(7)
        };
        // Keep max 40 logs to prevent memory issues
        return [...prevLogs.slice(-39), newLog];
      });
    }, 1500 + Math.random() * 2000); // Random interval between 1.5s and 3.5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-transparent overflow-hidden pointer-events-none">

      {/* Particle Network Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: { enable: true, mode: "grab" },
              resize: true,
            },
            modes: {
              grab: { distance: 140, links: { opacity: 0.5, color: "#f97316" } },
            },
          },
          particles: {
            color: { value: ["#f97316", "#fb923c", "#fed7aa"] },
            links: {
              color: "#f97316",
              distance: 150,
              enable: true,
              opacity: 0.24,
              width: 1,
              shadow: {
                enable: true,
                color: "#f97316",
                blur: 2,
                offset: {
                  x: 0,
                  y: 0,
                },
              },
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: true,
              speed: 0.8,
              straight: false,
            },
            number: { density: { enable: true, area: 800 }, value: 60 },
            opacity: { value: { min: 0.1, max: 0.5 } },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="absolute inset-0"
      />


      {/* Subtle overlay gradient to ensure text readability in main content */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/50 to-orange-50/80 dark:via-slate-950/50 dark:to-slate-950/80" />
    </div>
  );
}
