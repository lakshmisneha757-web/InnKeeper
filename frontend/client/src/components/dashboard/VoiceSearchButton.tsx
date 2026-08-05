import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";

export default function VoiceSearchButton() {
  const { setSearchQuery } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeMutation = trpc.ai.voiceTranscribe.useMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);

        try {
          // Upload to S3 via the storage proxy
          const uploadResponse = await fetch("/api/storage/upload", {
            method: "POST",
            headers: { "Content-Type": "audio/webm" },
            body: audioBlob,
          });

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json();
            const result = await transcribeMutation.mutateAsync({ audioUrl: url });
            if (result?.text) {
              setSearchQuery(result.text);
              toast.success(`Voice: "${result.text}"`);
            } else {
              toast.info("Could not transcribe. Try speaking clearly.");
            }
          } else {
            toast.error("Failed to upload audio");
          }
        } catch {
          toast.error("Failed to transcribe audio");
        }

        setIsTranscribing(false);
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.info("Recording... Click again to stop");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 transition-all ${
        isRecording ? "bg-red-500/10 border-red-500/30 text-red-600" : ""
      }`}
      onClick={toggleRecording}
      disabled={isTranscribing}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isTranscribing ? "Transcribing..." : isRecording ? "Stop" : "Voice"}
      </span>
      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-2 w-2 rounded-full bg-red-500"
        />
      )}
    </Button>
  );
}
