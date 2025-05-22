"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PerformanceGraph, { DataPoint } from "@/components/PerformanceGraph";
import confetti from "canvas-confetti";

export default function HomePage() {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [postureHistory, setPostureHistory] = useState("");
  const [expressionHistory, setExpressionHistory] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    setup();

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      try {
        const res = await fetch("/api/analyze-posture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const json = await res.json();

        const posture = JSON.parse(json.posture);
        if (json.notifyPosture) {
          const postureHistory = `Posture: ${posture.posture}, Score: ${posture.score}, Advice: ${posture.advice}`;
          setPostureHistory((h) => `${postureHistory}\n${h}`);
          console.log("🧘", postureHistory);
        }

        const expression = JSON.parse(json.expression);
        if (json.notifyExpression) {
          const expressionHistory = `Expression: ${expression.expression}, Score: ${expression.score}, Advice: ${expression.advice}`;
          setExpressionHistory((h) => `${expressionHistory}\n${h}`);
          console.log("❤️", expressionHistory);
        }

        setHistory((h) => [
          ...h,
          {
            timestamp: Date.now(),
            postureScore: posture.score,
            expressionScore: expression.score,
          },
        ]);

        const agentRes = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            posture: posture.score,
            postureAdvice: posture.advice,
            expression: expression.score,
            expressionAdvice: expression.advice,
            postureHistory,
            expressionHistory,
          }),
        });
        const agentResult = await agentRes.json();
        const agentJson = JSON.parse(agentResult.content);
        const { tool, args } = agentJson;

        console.log(
          `🤖 Agent chose tool: ${tool}, with args: ${JSON.stringify(args)}`
        );

        // 3) Dispatch the chosen tool
        if (tool === "showToast") {
          toast(args.title, { description: args.message });
        } else if (tool === "scheduleReminder") {
          console.log("Scheduling reminder");
          // parse ISO-8601 duration (e.g. "PT1M")
          const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(args.when);
          let delay = 0;
          if (match) {
            const [, h = "0", m = "0", s = "0"] = match;
            delay = +h * 3600e3 + +m * 60e3 + +s * 1e3;
          }
          setTimeout(() => {
            toast("⏰ Reminder", { description: args.message });
          }, delay);
        } else if (tool === "confetti") {
          console.log("🎉 Confetti!");
          // args.amount is 0–100
          // scale to particleCount (e.g. max 2000)
          const count = Math.round((args.amount / 100) * 2000);
          confetti({
            particleCount: count,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error("API error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", textAlign: "center" }}>
      <video ref={videoRef} autoPlay playsInline width={640} height={480} />
      <div style={{ marginTop: "2rem" }}>
        <PerformanceGraph data={history} />
      </div>
    </main>
  );
}

const toastTitle = (posture: string) => {
  switch (posture) {
    case "great":
      return "👏 Great posture!";
    case "good":
      return "👍 Good posture!";
    case "poor":
      return "😢 Poor posture!";
    case "terrible":
      return "‼ Terrible posture!";
    default:
      return "Posture analysis";
  }
};
