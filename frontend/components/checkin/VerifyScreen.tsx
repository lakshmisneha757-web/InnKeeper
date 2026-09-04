"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  X,
} from "lucide-react";
import { ScreenShell } from "./ScreenShell";
import { Button } from "@/components/ui/button";
import { submitIdentity } from "@/lib/api-client";
import { useCheckIn } from "./CheckInProvider";

import { useTranslation } from "react-i18next";
import "@/i18n";

type VerifyResult = { status: "verified" | "failed"; score: number; errorReason?: string } | null;

export function VerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, setIdVerified } = useCheckIn();

  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Revoke object URLs on unmount / replacement to avoid leaking memory.
  useEffect(() => () => { if (idPreview) URL.revokeObjectURL(idPreview); }, [idPreview]);
  useEffect(() => () => { if (selfiePreview) URL.revokeObjectURL(selfiePreview); }, [selfiePreview]);

  const handlePick = (file: File | null, setFile: (f: File | null) => void, setPreview: (u: string | null) => void) => {
    setResult(null);
    setError(null);
    setFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Unable to access camera. Please allow camera permissions or upload a selfie file.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
            handlePick(file, setSelfieFile, setSelfiePreview);
          }
        },
        "image/jpeg",
        0.92
      );
    }
    stopCamera();
  };

  const runVerification = async () => {
    if (!idFile || !selfieFile) return;
    setVerifying(true);
    setError(null);
    setResult(null);
    try {
      const response = await submitIdentity(token, idFile, selfieFile);
      setVerifying(false);

      if (response && (response.status === "verified" || response.status === "failed")) {
        const finalStatus = response.status === "verified" && response.score >= 40 && response.distance <= 0.75 ? "verified" : "failed";
        setResult({
          status: finalStatus,
          score: response.score ?? 0,
          errorReason: finalStatus === "verified"
            ? undefined
            : response.errorReason || "Verification failed — the uploaded photos do not match. Please upload a clear ID and selfie of the same person.",
        });
        setIdVerified(finalStatus === "verified");
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch {
      setVerifying(false);
      setError("Network error. Please check your connection and try again.");
    }
  };

  const hasFiles = !!idFile && !!selfieFile;
  const canContinue = hasFiles;

  return (
    <ScreenShell
      stepIndex={1}
      onBack={() => router.push(`/checkin/${token}`)}
      title={t("checkin.verifyIdentityTitle")}
      subtitle={t("checkin.verifyIdentitySub")}
      footer={
        <Button onClick={() => router.push(`/checkin/${token}/payment`)} disabled={!canContinue}>
          {t("common.next")} <ArrowRight className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-3 mt-1">
        <UploadCard
          icon={<Upload className="h-5 w-5" />}
          title={t("checkin.uploadDlTitle")}
          preview={idPreview}
          onSelect={(f) => handlePick(f, setIdFile, setIdPreview)}
          inputProps={{ accept: "image/*" }}
        />

        <UploadCard
          icon={<Camera className="h-5 w-5" />}
          title={t("checkin.takeSelfieTitle")}
          preview={selfiePreview}
          onSelect={(f) => handlePick(f, setSelfieFile, setSelfiePreview)}
          onOpenCamera={startCamera}
          inputProps={{ accept: "image/*", capture: "user" }}
        />

        {/* Network / connection error banner */}
        {error && (
          <div className="pt-1">
            <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 px-3.5 py-3 mb-3 text-[13px]">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
            <Button onClick={runVerification} disabled={verifying}>
              <RefreshCw className="h-4 w-4" /> {t("checkin.retryVerification")}
            </Button>
          </div>
        )}

        {!error && !result && hasFiles && (
          <div className="pt-1">
            <Button onClick={runVerification} disabled={verifying}>
              {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("checkin.verifyingId")}</> : t("checkin.verifyIdentityBtn")}
            </Button>
          </div>
        )}

        {result?.status === "verified" && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3.5 animate-popIn">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-[14px] font-medium text-emerald-800">{t("checkin.verificationSuccessful")}</span>
            <span className="ml-auto text-[12px] font-semibold text-emerald-600/90">{result.score}% match</span>
          </div>
        )}

        {result?.status === "failed" && (
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3.5 border border-red-100 animate-popIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span className="text-[14px] font-semibold text-red-800">{t("checkin.verificationFailedTryAgain")}</span>
              {result.score > 0 && (
                <span className="ml-auto text-[12px] font-semibold text-red-600/90">{result.score}% match</span>
              )}
            </div>
            <p className="text-[12.5px] text-red-700/90 mt-1.5 pl-7 mb-3">
              {result.errorReason || t("checkin.verifyFailedRetry")}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setError(null);
                setSelfieFile(null);
                setSelfiePreview(null);
              }}
            >
              <RefreshCw className="h-4 w-4" /> {t("checkin.retakePhoto")}
            </Button>
          </div>
        )}
      </div>

      {/* Live WebCam Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-white font-medium text-base">{t("checkin.takeSelfieTitle")}</h3>
              <button
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 border-2 border-white/20 rounded-full m-8 pointer-events-none" />

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                  <p className="text-sm text-slate-200 mb-4 leading-relaxed">{cameraError}</p>
                  <Button variant="outline" onClick={stopCamera}>
                    Close & Upload File
                  </Button>
                </div>
              )}
            </div>

            {!cameraError && (
              <div className="p-5 flex items-center justify-center gap-4 bg-slate-900">
                <button
                  onClick={capturePhoto}
                  className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-500 border-4 border-white flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                >
                  <Camera className="h-7 w-7" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-[12.5px] text-slate-400 leading-relaxed">
          {t("checkin.encryptionInfo")}
        </p>
      </div>
    </ScreenShell>
  );
}

function UploadCard({
  icon,
  title,
  preview,
  onSelect,
  onOpenCamera,
  inputProps,
}: {
  icon: React.ReactNode;
  title: string;
  preview: string | null;
  onSelect: (file: File | null) => void;
  onOpenCamera?: () => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = !!preview;

  const handleClick = () => {
    if (onOpenCamera) {
      onOpenCamera();
    } else {
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={[
        "w-full rounded-2xl border-2 border-dashed px-4 py-4 flex items-center gap-3.5 text-left transition-all duration-200",
        isDone
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        {...inputProps}
      />
      <div
        onClick={handleClick}
        className={[
          "h-11 w-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden cursor-pointer transition-colors",
          isDone ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-blue-600",
        ].join(" ")}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
        <p className="text-[14px] font-medium text-slate-900">{title}</p>
        <p className="text-[12.5px] text-slate-400">
          {isDone ? "Tap to replace" : `Tap to ${title.toLowerCase()}`}
        </p>
      </div>

      {onOpenCamera && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[12px] font-medium text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded-lg shrink-0"
        >
          File
        </button>
      )}

      {isDone && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
    </div>
  );
}

