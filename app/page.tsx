"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function HomePage() {
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
        const content = JSON.parse(json.content);
        if (json.notify) {
          toast(toastTitle(content.posture), { description: content.advice });
        }
        console.log("Posture result:", json);
      } catch (err) {
        console.error("API error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}
    >
      <video ref={videoRef} autoPlay playsInline width={640} height={480} />
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
