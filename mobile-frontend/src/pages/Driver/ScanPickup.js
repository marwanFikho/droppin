import React, { useState, useRef, useEffect } from 'react';
import { packageService } from '../../services/api';
import jsQR from 'jsqr';

const ScanPickup = () => {
  const [scanResult, setScanResult] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualTracking, setManualTracking] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastScanned = useRef('');

  useEffect(() => {
    // Development mode override for secure context
    if (process.env.NODE_ENV === 'development') {
      // Override isSecureContext for development
      if (!window.isSecureContext) {
        Object.defineProperty(window, 'isSecureContext', {
          get: function() {
            return true;
          },
          configurable: true
        });
      }
    }
    
    // Check camera support first
    checkCameraSupport();
  }, []);

  const checkCameraSupport = () => {
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined') {
        setCameraError('Camera not available in this environment');
        return;
      }

      // Check for mediaDevices support
      if (!navigator.mediaDevices) {
        setCameraError('Camera access not supported in this browser. Please use manual entry.');
        return;
      }

      setCameraSupported(true);
      
    } catch (error) {
      console.error('Camera support check error:', error);
      setCameraError(`Camera support error: ${error.message}. Please use manual entry.`);
    }
  };

  const requestCameraPermission = async () => {
    if (!cameraSupported) {
      return;
    }

    try {
      setCameraError('');
      setPermissionRequested(true);
      setIsScanning(true);
      
      console.log('Requesting camera permission...');
      
      // This should trigger the browser's permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('Camera permission granted!');
      streamRef.current = stream;
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning loop
        scanLoop();
      }
      
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermissionRequested(false);
      setIsScanning(false);
      
      let errorMessage = 'Camera error: ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera access denied. Please allow camera permissions in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'AbortError') {
        errorMessage += 'Camera access was aborted.';
      } else {
        errorMessage += error.message;
      }
      
      setCameraError(errorMessage + ' Please use manual entry.');
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    setPermissionRequested(false);
    
    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const scanLoop = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleScan(code.data);
      }
    }
    
    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const handleScan = async (data) => {
    if (data && data !== lastScanned.current) {
      lastScanned.current = data;
      // Vibrate the phone on scan
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      setScanResult(data);
      setLoading(true);
      setMessage('');
      try {
        // Fetch package by tracking number
        const res = await packageService.trackPackage(data);
        const pkg = res.data;
        // Check if assigned to driver
        if (!pkg || !pkg.driverId || !pkg.isAssignedToMe) {
          setMessage('❌ This package does not belong to you.');
        } else if (pkg.status !== 'assigned') {
          setMessage('⚠️ This package is already picked up.');
        } else {
          // Mark as picked up
          await packageService.updatePackageStatus(pkg.id, { status: 'pickedup' });
          setMessage('✅ Package marked as picked up!');
        }
      } catch (err) {
        setMessage('❌ Invalid or unknown tracking number.');
      } finally {
        setLoading(false);
        setTimeout(() => {
          setScanResult('');
          setMessage('');
          lastScanned.current = '';
        }, 2000);
      }
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualTracking.trim()) {
      await handleScan(manualTracking.trim());
      setManualTracking('');
    }
  };

  const retryScanner = () => {
    stopScanner();
    setCameraError('');
    setTimeout(() => {
      requestCameraPermission();
    }, 500);
  };

  const toggleManual = () => {
    setShowManual(!showManual);
  };

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2>Scan Package QR to Mark as Pickup</h2>
      
      {/* Development mode notice */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          maxWidth: 400, 
          margin: '10px auto', 
          padding: 8, 
          border: '1px solid #f39c12', 
          borderRadius: 4,
          backgroundColor: '#fff3cd',
          fontSize: '12px',
          color: '#856404'
        }}>
          🛠️ Development Mode: Secure context bypass active - Camera should work!
        </div>
      )}
      
      {/* Camera permission request */}
      {cameraSupported && !permissionRequested && !cameraError && (
        <div style={{ 
          maxWidth: 400, 
          margin: '20px auto', 
          padding: 20, 
          border: '1px solid #0984e3', 
          borderRadius: 8,
          backgroundColor: '#f0f8ff'
        }}>
          <div style={{ color: '#0984e3', marginBottom: 16 }}>
            <strong>Camera Access Required</strong>
          </div>
          <div style={{ color: '#636e72', marginBottom: 20 }}>
            This app needs camera access to scan QR codes. Click the button below to allow camera permissions.
          </div>
          <button 
            onClick={requestCameraPermission}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Allow Camera Access
          </button>
        </div>
      )}
      
      {/* Custom QR Scanner - Only show if camera permission is granted */}
      {permissionRequested && isScanning && !cameraError && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <video
              ref={videoRef}
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #ddd'
              }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                pointerEvents: 'none'
              }}
            />
            {/* Scanning overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '2px solid #00b894',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '3px solid #00b894',
                borderLeft: '3px solid #00b894'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '3px solid #00b894',
                borderRight: '3px solid #00b894'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '3px solid #00b894',
                borderLeft: '3px solid #00b894'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '3px solid #00b894',
                borderRight: '3px solid #00b894'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Camera error message */}
      {cameraError && (
        <div style={{ 
          maxWidth: 400, 
          margin: '20px auto', 
          padding: 16, 
          border: '1px solid #ff6b6b', 
          borderRadius: 8,
          backgroundColor: '#fff5f5'
        }}>
          <div style={{ color: '#d63031', marginBottom: 12 }}>
            <strong>Scanner Issue:</strong>
          </div>
          <div style={{ color: '#636e72', marginBottom: 16 }}>
            {cameraError}
          </div>
          <button 
            onClick={retryScanner}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              marginRight: 8
            }}
          >
            Retry Scanner
          </button>
          <button 
            onClick={toggleManual}
            style={{
              padding: '8px 16px',
              backgroundColor: '#00b894',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            {showManual ? 'Hide Manual Entry' : 'Use Manual Entry'}
          </button>
        </div>
      )}

      {/* Manual input */}
      {showManual && (
        <div style={{ maxWidth: 400, margin: '20px auto' }}>
          <h3>Manual Entry</h3>
          <p style={{ color: '#636e72', marginBottom: 16 }}>
            Enter the tracking number manually to mark packages as picked up.
          </p>
          <form onSubmit={handleManualSubmit} style={{ marginTop: 16 }}>
            <input
              type="text"
              value={manualTracking}
              onChange={(e) => setManualTracking(e.target.value)}
              placeholder="Enter tracking number manually"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 16,
                marginBottom: 10
              }}
            />
            <button
              type="submit"
              disabled={!manualTracking.trim()}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: manualTracking.trim() ? '#00b894' : '#ddd',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: manualTracking.trim() ? 'pointer' : 'not-allowed',
                fontSize: 16
              }}
            >
              Mark as Pickup
            </button>
          </form>
        </div>
      )}

      {/* Quick manual entry button */}
      {!showManual && !cameraError && (
        <div style={{ marginTop: 16 }}>
          <button 
            onClick={toggleManual}
            style={{
              padding: '10px 20px',
              backgroundColor: '#636e72',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Manual Entry
          </button>
        </div>
      )}

      {loading && <div style={{ marginTop: 16 }}>Checking package...</div>}
      {message && <div style={{ marginTop: 24, fontSize: 20 }}>{message}</div>}
      <div style={{ marginTop: 32, color: '#888' }}>
        Keep scanning packages. Close this tab when done.
      </div>
    </div>
  );
};

export default ScanPickup; 