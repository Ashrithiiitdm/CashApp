import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import {
  ArrowBackIcon,
  FlipCameraIcon,
  ImageIcon,
} from "../components/Icons";

const QRScanner = () => {
  const navigate = useNavigate();

  const [cameraFacing, setCameraFacing] = useState("environment");

  // Refs
  const scannerRef = useRef(null);
  const isLockedRef = useRef(false);      // prevents double scan
  const isStoppingRef = useRef(false);    // prevents double stop
  const fileInputRef = useRef(null);

  // =========================
  // START CAMERA SCANNER
  // =========================
  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        isStoppingRef.current = false;

        const devices = await Html5Qrcode.getCameras();
        if (!devices.length) return;

        const selectedCamera =
          devices.find(d =>
            cameraFacing === "environment"
              ? d.label.toLowerCase().includes("back")
              : d.label.toLowerCase().includes("front")
          ) || devices[0];

        await html5QrCode.start(
          selectedCamera.id,
          { fps: 10, qrbox: 250 },
          onScanSuccess,
          () => { }
        );
      } catch (err) {
        console.error("Camera start error:", err);
      }
    };

    startScanner();

    // ✅ SINGLE, SAFE CLEANUP
    return () => {
      try {
        html5QrCode?.stop().catch(() => { });
        html5QrCode?.clear().catch(() => { });
      } catch { }
    };
  }, [cameraFacing]);


  // =========================
  // QR SUCCESS HANDLER
  // =========================
  const onScanSuccess = async (decodedText) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;

    try {
      if (
        scannerRef.current?.isScanning &&
        !isStoppingRef.current
      ) {
        isStoppingRef.current = true;
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch { }

    console.log("Scanned:", decodedText);
    alert(`Scanned: ${decodedText}`);

    // navigate("/payment", { state: { id: decodedText } });
  };

  const safeStopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
    } catch { }

    try {
      await scannerRef.current.clear();
    } catch { }
  };

  // =========================
  // IMAGE UPLOAD SCANNER
  // =========================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await safeStopScanner(); // 🔴 FULL STOP

      const imageScanner = new Html5Qrcode("image-reader");
      const result = await imageScanner.scanFile(file, true);
      onScanSuccess(result);

    } catch (err) {
      alert("No QR code found in image");
    } finally {
      e.target.value = "";
    }
  };



  // =========================
  // BACK NAVIGATION
  // =========================
  const goBack = async () => {
    await safeStopScanner();
    navigate(-1);
  };




  return (
    <div className="min-h-screen w-full bg-[#1581BF] flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-black w-11/12 max-w-[420px] min-h-[750px] rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="absolute top-0 left-0 w-full z-30 p-8 flex justify-between items-center text-white mt-4">
          <button
            onClick={goBack}
            className="p-3 bg-white/20 rounded-full backdrop-blur-md"
          >
            <ArrowBackIcon className="w-6 h-6 text-white" />
          </button>

          <h2 className="text-lg font-semibold">Scan QR Code</h2>

          <button
            onClick={() => {
              isLockedRef.current = false;
              setCameraFacing((p) =>
                p === "environment" ? "user" : "environment"
              );
            }}
            className="p-3 bg-white/20 rounded-full backdrop-blur-md"
          >
            <FlipCameraIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* CAMERA VIEW */}
        <div className="absolute inset-0 z-0 bg-black">
          <div
            id="reader"
            className="w-full h-full"
            style={{ minHeight: "100%", minWidth: "100%" }}
          />
        </div>

        {/* OVERLAY */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 rounded-3xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-400 animate-scan-vertical" />
          </div>
          <p className="mt-8 text-white text-sm bg-black/40 px-4 py-1 rounded-full">
            Align QR code within the frame
          </p>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="absolute bottom-12 z-20 w-full flex justify-center">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-3 bg-white/20 px-8 py-4 rounded-full text-white"
          >
            <ImageIcon className="w-5 h-5" />
            Upload from Gallery
          </button>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
          border-radius: 40px;
        }
        @keyframes scan-vertical {
          0% { top: 10px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-vertical {
          animation: scan-vertical 2s infinite;
        }
      `}</style>
      <div id="image-reader" className="hidden" />
    </div>

  );
};

export default QRScanner;
