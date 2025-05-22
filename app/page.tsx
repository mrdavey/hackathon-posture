"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PerformanceGraph, { DataPoint } from "@/components/PerformanceGraph";

export default function HomePage() {
  const [history, setHistory] = useState<DataPoint[]>([]);
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
        console.log("Response:", json);
        const posture = JSON.parse(json.posture);
        if (json.notifyPosture) {
          toast(toastTitle(posture.posture), { description: posture.advice });
        }

        const expression = JSON.parse(json.expression);
        if (expression.expression === "focused") {
          toast("💪 Stay Focused!", {
            description: expression.advice,
          });
        } else if (expression.expression === "emotional") {
          toast("😊 How Are You Feeling?", {
            description: expression.advice,
          });
        } else if (expression.expression === "neutral") {
          toast("😐 Neutral Expression", {
            description: expression.advice,
          });
        }
        console.log("Posture result:", json);

        setHistory((h) => [
          ...h,
          {
            timestamp: Date.now(),
            postureScore: posture.score,
            expressionScore: expression.score,
          },
        ]);
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
