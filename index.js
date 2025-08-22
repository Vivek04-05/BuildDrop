const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const bplist = require("bplist-parser");
const plist = require("plist");

const app = express();
const PORT = 3000;

const baseUrl = "https://62589867902f.ngrok-free.app"; // Chnage everytime as you run ngrok . or not if you have your own server .

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[DEBUG] Setting upload destination to /uploads");
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    console.log(`[DEBUG] Setting upload filename: ${filename}`);
    cb(null, filename);
  }
});
const upload = multer({ storage });

// Serve frontend
app.use(express.static("public"));

// Serve uploaded IPA + plist with correct content types
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, filePath) => {
    console.log(`[DEBUG] Serving file: ${filePath}`);
    if (filePath.endsWith(".plist")) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
    }
    if (filePath.endsWith(".ipa")) {
      res.setHeader("Content-Type", "application/octet-stream");
    }
  }
}));

// Extract Info.plist from IPA
function extractInfoPlist(ipaPath) {
  console.log(`[DEBUG] Extracting Info.plist from IPA: ${ipaPath}`);
  const zip = new AdmZip(ipaPath);
  const entries = zip.getEntries();

  const infoEntry = entries.find(e =>
    /Payload\/[^/]+\.app\/Info\.plist$/.test(e.entryName)
  );
  if (!infoEntry) {
    console.error("[ERROR] Info.plist not found in IPA");
    throw new Error("Info.plist not found in IPA");
  }

  console.log(`[DEBUG] Found Info.plist entry: ${infoEntry.entryName}`);
  const buf = infoEntry.getData();
  const isBinary = buf.slice(0, 8).toString() === "bplist00";
  console.log(`[DEBUG] Info.plist is binary? ${isBinary}`);

  const info = isBinary ? bplist.parseBuffer(buf)[0] : plist.parse(buf.toString("utf8"));
  console.log("[DEBUG] Parsed Info.plist:", info);
  return info;
}

// Build manifest.plist
function buildManifest({ ipaUrl, bundleId, version, title }) {
  console.log("[DEBUG] Generating manifest.plist with data:", { ipaUrl, bundleId, version, title });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>items</key>
    <array>
      <dict>
        <key>assets</key>
        <array>
          <dict>
            <key>kind</key>
            <string>software-package</string>
            <key>url</key>
            <string>${ipaUrl}</string>
          </dict>
        </array>
        <key>metadata</key>
        <dict>
          <key>bundle-identifier</key>
          <string>${bundleId}</string>
          <key>bundle-version</key>
          <string>${version}</string>
          <key>kind</key>
          <string>software</string>
          <key>title</key>
          <string>${title}</string>
        </dict>
      </dict>
    </array>
  </dict>
</plist>`;
}

// Upload route
app.post("/upload", upload.single("ipaFile"), (req, res) => {
  try {
    console.log("[DEBUG] /upload route called");

    if (!req.file) {
      console.error("[ERROR] No file uploaded");
      return res.status(400).send("No file uploaded");
    }

    console.log("[DEBUG] File uploaded:", req.file);

    
    // const baseUrl = "https://ea7e193cc66c.ngrok-free.app";

    console.log(`[DEBUG] Base URL: ${baseUrl}`);

    const ipaFilename = req.file.filename;
    const ipaUrl = `${baseUrl}/uploads/${ipaFilename}`;
    console.log(`[DEBUG] IPA URL: ${ipaUrl}`);

    // Parse metadata
    const info = extractInfoPlist(req.file.path);
    const bundleId = info.CFBundleIdentifier;
    const version = info.CFBundleShortVersionString || info.CFBundleVersion || "1.0";
    const title = info.CFBundleDisplayName || info.CFBundleName || "My App";

    console.log("[DEBUG] Extracted metadata:", { bundleId, version, title });

    // Create manifest.plist
    const manifestName = ipaFilename.replace(/\.ipa$/i, ".plist");
    const manifestPath = path.join("uploads", manifestName);
    const manifestUrl = `${baseUrl}/uploads/${manifestName}`;

    const manifestXml = buildManifest({ ipaUrl, bundleId, version, title });
    fs.writeFileSync(manifestPath, manifestXml, "utf8");
    console.log(`[DEBUG] Manifest written to: ${manifestPath}`);
    console.log(`[DEBUG] Manifest URL: ${manifestUrl}`);

    const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;
    console.log(`[DEBUG] Installation URL: ${installUrl}`);

    res.json({
      message: "File uploaded successfully",
      bundleId,
      version,
      title,
      directIpaUrl: ipaUrl,
      manifestUrl,
      installUrl
    });

  } catch (err) {
    console.error("[ERROR] Failed to process IPA:", err);
    res.status(500).send("Failed to process IPA");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
