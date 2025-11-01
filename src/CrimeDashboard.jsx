import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  MapPin,
  Clock,
  RefreshCw,
  Upload,
  X,
  CheckCircle,
  Shield,
  Activity,
  Bell,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";

const CrimeDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // API endpoints
  const BASE_URL =
    "https://q6js4x6jy5.execute-api.ap-south-1.amazonaws.com/prod";
  const API_ENDPOINT = `${BASE_URL}/alerts`;
  const UPLOAD_ENDPOINT = `${BASE_URL}/upload`;

  // Fetch alerts from API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINT);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      let items = [];
      if (data.body) {
        const parsedBody = JSON.parse(data.body);
        items = parsedBody.items || [];
      } else {
        items = data.items || [];
      }

      setAlerts(items);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
      setUploadSuccess(false);
    } else {
      setUploadError("Please select a valid image file");
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // Upload file to S3
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadError(null);

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.status}`);
      }

      const data = await response.json();
      const uploadData = data.body ? JSON.parse(data.body) : data;

      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);

      setTimeout(() => fetchAlerts(), 3000);
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err) {
      setUploadError(err.message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const stats = {
    total: alerts.length,
    high: alerts.filter((a) => a.alert_level === "HIGH").length,
    normal: alerts.filter((a) => a.alert_level === "NORMAL").length,
  };

  const getAlertCoordinates = (alert, index) => {
    const baseLocations = {
      knife: { x: 30, y: 45 },
      gun: { x: 65, y: 30 },
      street: { x: 50, y: 70 },
    };

    let base = { x: 50, y: 50 };
    if (alert.key.includes("knife")) base = baseLocations.knife;
    else if (alert.key.includes("gun")) base = baseLocations.gun;
    else if (alert.key.includes("street")) base = baseLocations.street;

    const offset = (index % 10) * 2;
    return {
      x: Math.min(95, base.x + (offset % 15) - 7),
      y: Math.min(95, base.y + Math.floor(offset / 3) - 7),
    };
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Shield size={32} color="#3b82f6" style={styles.headerIcon} />
          <div>
            <h1 style={styles.headerTitle}>Crime Analysis Dashboard</h1>
            <p style={styles.headerSubtitle}>
              Real-time AI-powered threat detection
            </p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.liveIndicator}>
            <Activity size={16} color={autoRefresh ? "#10b981" : "#6b7280"} />
            <span
              style={{
                ...styles.liveDot,
                backgroundColor: autoRefresh ? "#10b981" : "#6b7280",
              }}
            ></span>
            <span style={styles.liveText}>
              {autoRefresh ? "Live Monitoring" : "Paused"}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={styles.headerButton}
          >
            {autoRefresh ? "Pause" : "Resume"}
          </button>
          <button
            onClick={fetchAlerts}
            style={{ ...styles.headerButton, backgroundColor: "#2563eb" }}
          >
            <RefreshCw size={16} />
            <span style={styles.buttonText}>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <div style={styles.container}>
          {/* Upload Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Upload size={20} style={styles.sectionIcon} />
              Upload Image for Analysis
            </h2>

            {uploadSuccess && (
              <div style={styles.successAlert}>
                <CheckCircle size={20} />
                <span>
                  Upload successful! Processing image... Dashboard will update
                  in a few seconds.
                </span>
              </div>
            )}

            {uploadError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={20} />
                <span>{uploadError}</span>
              </div>
            )}

            <div style={styles.uploadGrid}>
              {/* Drag & Drop Area */}
              <div
                style={{
                  ...styles.dropZone,
                  borderColor: isDragging ? "#3b82f6" : "#4b5563",
                  backgroundColor: isDragging
                    ? "rgba(59, 130, 246, 0.1)"
                    : "#374151",
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={48} color="#9ca3af" style={styles.uploadIcon} />
                <p style={styles.dropText}>Drag & drop your image here</p>
                <p style={styles.orText}>or</p>
                <label style={styles.browseButton}>
                  Browse Files
                  <input
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                </label>
                <p style={styles.uploadHint}>
                  Supported: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>

              {/* Preview */}
              <div style={styles.previewContainer}>
                {previewUrl ? (
                  <div style={styles.preview}>
                    <button
                      onClick={handleClearFile}
                      style={styles.closeButton}
                    >
                      <X size={16} />
                    </button>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={styles.previewImage}
                    />
                    <div style={styles.fileInfo}>
                      <p style={styles.fileDetail}>
                        <strong>File:</strong> {selectedFile?.name}
                      </p>
                      <p style={styles.fileDetail}>
                        <strong>Size:</strong>{" "}
                        {(selectedFile?.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        style={{
                          ...styles.uploadButton,
                          opacity: uploading ? 0.6 : 1,
                          cursor: uploading ? "not-allowed" : "pointer",
                        }}
                      >
                        {uploading ? (
                          <>
                            <div style={styles.spinner}></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            Upload & Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.noPreview}>
                    <Bell size={48} color="#6b7280" />
                    <p style={{ marginTop: "16px" }}>No file selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>Total Alerts</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: "#ef4444" }}>
                {stats.high}
              </div>
              <div style={styles.statLabel}>High Priority</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: "#10b981" }}>
                {stats.normal}
              </div>
              <div style={styles.statLabel}>Normal</div>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div style={styles.lastUpdate}>
              <Clock size={14} />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          {/* Live Alert Map */}
          {alerts.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <MapPin size={20} style={styles.sectionIcon} />
                Live Alert Map
              </h2>
              <div style={styles.mapContainer}>
                <svg style={styles.mapGrid}>
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="white"
                        strokeOpacity="0.2"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div style={{ ...styles.mapLabel, top: "10px", left: "10px" }}>
                  North District
                </div>
                <div
                  style={{ ...styles.mapLabel, bottom: "10px", right: "10px" }}
                >
                  South District
                </div>
                <div style={{ ...styles.mapLabel, top: "10px", right: "10px" }}>
                  East District
                </div>
                <div
                  style={{ ...styles.mapLabel, bottom: "10px", left: "10px" }}
                >
                  West District
                </div>

                {alerts.slice(0, 20).map((alert, index) => {
                  const coords = getAlertCoordinates(alert, index);
                  const isHigh = alert.alert_level === "HIGH";

                  return (
                    <div
                      key={alert.AlertId || index}
                      style={{
                        position: "absolute",
                        left: `${coords.x}%`,
                        top: `${coords.y}%`,
                        transform: "translate(-50%, -50%)",
                        cursor: "pointer",
                      }}
                      title={`${alert.alert_level} - ${alert.key}`}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: isHigh ? "#ef4444" : "#10b981",
                          border: `2px solid ${isHigh ? "#fca5a5" : "#86efac"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "white",
                          animation: isHigh ? "pulse 2s infinite" : "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        {isHigh && "!"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.mapLegend}>
                <div style={styles.legendItem}>
                  <span
                    style={{ ...styles.legendDot, backgroundColor: "#ef4444" }}
                  ></span>
                  High Priority ({stats.high})
                </div>
                <div style={styles.legendItem}>
                  <span
                    style={{ ...styles.legendDot, backgroundColor: "#10b981" }}
                  ></span>
                  Normal ({stats.normal})
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={20} />
              <span>
                <strong>Error:</strong> {error}
              </span>
            </div>
          )}

          {/* Loading State */}
          {loading && alerts.length === 0 && (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading alerts...</p>
            </div>
          )}

          {/* Alerts List */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Bell size={20} style={styles.sectionIcon} />
              Recent Alerts ({alerts.length})
            </h2>

            {!loading && alerts.length === 0 && (
              <div style={styles.emptyState}>
                <AlertCircle size={48} color="#6b7280" />
                <p style={styles.emptyText}>No alerts found</p>
                <p style={styles.emptySubtext}>
                  Upload an image above to generate alerts
                </p>
              </div>
            )}

            {alerts.map((alert, index) => (
              <div
                key={alert.AlertId || index}
                style={{
                  ...styles.alertCard,
                  borderLeftColor:
                    alert.alert_level === "HIGH" ? "#ef4444" : "#10b981",
                }}
              >
                <div style={styles.alertHeader}>
                  <span
                    style={{
                      ...styles.alertBadge,
                      backgroundColor:
                        alert.alert_level === "HIGH" ? "#ef4444" : "#10b981",
                    }}
                  >
                    {alert.alert_level}
                  </span>
                  <span style={styles.alertTime}>
                    <Clock size={14} style={{ marginRight: "4px" }} />
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>

                <div style={styles.alertFile}>
                  <strong>File:</strong> {alert.key}
                </div>

                {alert.rekognition?.suspicious?.length > 0 && (
                  <div style={styles.suspiciousBox}>
                    <div style={styles.suspiciousTitle}>
                      ⚠️ Suspicious Objects Detected:
                    </div>
                    <div style={styles.tagsContainer}>
                      {alert.rekognition.suspicious.map((label, i) => (
                        <span key={i} style={styles.suspiciousTag}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alert.rekognition?.labels?.length > 0 && (
                  <div style={styles.labelsSection}>
                    <div style={styles.labelsTitle}>Detected Labels:</div>
                    <div style={styles.tagsContainer}>
                      {alert.rekognition.labels
                        .slice(0, 8)
                        .map((labelData, i) => {
                          const label = Array.isArray(labelData)
                            ? labelData[0]
                            : labelData.name || labelData.Name;
                          const confidence = Array.isArray(labelData)
                            ? labelData[1]
                            : labelData.confidence || labelData.Confidence;

                          return (
                            <span key={i} style={styles.labelTag}>
                              {label} ({Math.round(confidence)}%)
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <Shield size={24} color="#3b82f6" />
            <div style={styles.footerInfo}>
              <p style={styles.footerTitle}>AI-Powered Crime Analysis System</p>
              <p style={styles.footerSubtitle}>
                AWS Serverless Architecture | Real-time Threat Detection
              </p>
            </div>
          </div>

          <div style={styles.footerCenter}>
            <p style={styles.madeBy}>
              Made by <strong style={styles.authorName}>Atharv Agarwal</strong>
            </p>
            <p style={styles.rollNumber}>23BDS1173</p>
          </div>

          <div style={styles.footerRight}>
            <a
              href="https://github.com"
              style={styles.socialLink}
              title="GitHub"
            >
              <Github size={20} />
            </a>
            <a
              href="https://linkedin.com"
              style={styles.socialLink}
              title="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="mailto:atharv@example.com"
              style={styles.socialLink}
              title="Email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.copyright}>
            © 2025 Crime Analysis Dashboard. Powered by Amazon Web Services.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a",
    color: "white",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    backgroundColor: "#1e293b",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #334155",
    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIcon: {
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
    color: "#f1f5f9",
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "4px 0 0 0",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  liveIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    backgroundColor: "#334155",
    borderRadius: "20px",
  },
  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  liveText: {
    fontSize: "13px",
    color: "#cbd5e1",
    fontWeight: "500",
  },
  headerButton: {
    padding: "8px 16px",
    backgroundColor: "#334155",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.2s",
  },
  buttonText: {
    display: "inline",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  section: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "20px",
    marginTop: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#f1f5f9",
  },
  sectionIcon: {
    flexShrink: 0,
  },
  successAlert: {
    padding: "16px",
    backgroundColor: "#064e3b",
    border: "1px solid #10b981",
    borderRadius: "8px",
    marginBottom: "16px",
    color: "#d1fae5",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  errorAlert: {
    padding: "16px",
    backgroundColor: "#7f1d1d",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    marginBottom: "16px",
    color: "#fecaca",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  dropZone: {
    border: "2px dashed",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    transition: "all 0.3s",
    backgroundColor: "#334155",
  },
  uploadIcon: {
    marginBottom: "16px",
  },
  dropText: {
    color: "#cbd5e1",
    marginBottom: "8px",
    fontSize: "16px",
  },
  orText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "16px",
  },
  browseButton: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "16px",
  },
  previewContainer: {
    display: "flex",
    flexDirection: "column",
  },
  preview: {
    backgroundColor: "#334155",
    borderRadius: "12px",
    padding: "16px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  previewImage: {
    width: "100%",
    height: "200px",
    objectFit: "contain",
    borderRadius: "8px",
    marginBottom: "16px",
    backgroundColor: "#1e293b",
  },
  fileInfo: {
    marginTop: "16px",
  },
  fileDetail: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "8px",
  },
  uploadButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background-color 0.2s",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  noPreview: {
    backgroundColor: "#334155",
    borderRadius: "12px",
    padding: "64px 16px",
    textAlign: "center",
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
    border: "1px solid #334155",
  },
  statNumber: {
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#f1f5f9",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  lastUpdate: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  mapContainer: {
    position: "relative",
    backgroundColor: "#334155",
    borderRadius: "12px",
    height: "400px",
    overflow: "hidden",
  },
  mapGrid: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  mapLabel: {
    position: "absolute",
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  mapLegend: {
    marginTop: "16px",
    display: "flex",
    gap: "24px",
    fontSize: "14px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#94a3b8",
  },
  legendDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "48px",
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    margin: "0 auto 16px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#94a3b8",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px",
    backgroundColor: "#334155",
    borderRadius: "12px",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "16px",
    marginBottom: "8px",
    marginTop: "16px",
  },
  emptySubtext: {
    color: "#64748b",
    fontSize: "14px",
  },
  alertCard: {
    backgroundColor: "#334155",
    padding: "16px",
    borderRadius: "12px",
    borderLeft: "4px solid",
    marginBottom: "16px",
    transition: "transform 0.2s",
    cursor: "pointer",
  },
  alertHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  alertBadge: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
  },
  alertTime: {
    fontSize: "14px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
  },
  alertFile: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "12px",
  },
  suspiciousBox: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
  suspiciousTitle: {
    fontWeight: "600",
    color: "#fca5a5",
    marginBottom: "8px",
    fontSize: "14px",
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  suspiciousTag: {
    padding: "4px 8px",
    backgroundColor: "#7f1d1d",
    color: "#fecaca",
    borderRadius: "4px",
    fontSize: "12px",
  },
  labelsSection: {
    marginTop: "12px",
  },
  labelsTitle: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "8px",
  },
  labelTag: {
    padding: "4px 8px",
    backgroundColor: "#475569",
    color: "#cbd5e1",
    borderRadius: "4px",
    fontSize: "11px",
  },
  footer: {
    backgroundColor: "#1e293b",
    borderTop: "2px solid #334155",
    padding: "24px 32px",
    marginTop: "auto",
  },
  footerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
    alignItems: "center",
    marginBottom: "16px",
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  footerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  footerTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f1f5f9",
    margin: 0,
  },
  footerSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  footerCenter: {
    textAlign: "center",
  },
  madeBy: {
    fontSize: "14px",
    color: "#cbd5e1",
    margin: "0 0 4px 0",
  },
  authorName: {
    color: "#3b82f6",
    fontWeight: "700",
    fontSize: "16px",
  },
  rollNumber: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500",
    margin: 0,
  },
  footerRight: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  socialLink: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#cbd5e1",
    textDecoration: "none",
    transition: "all 0.3s",
    border: "1px solid #475569",
  },
  footerBottom: {
    maxWidth: "1400px",
    margin: "0 auto",
    paddingTop: "16px",
    borderTop: "1px solid #334155",
    textAlign: "center",
  },
  copyright: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
};

export default CrimeDashboard;
