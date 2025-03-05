const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google Signup/Login Route
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"] }));

// Google Callback Route
app.get("/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/dashboard",
    failureRedirect: "http://localhost:3000/login",
  })
);

// Get Authenticated User
app.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not Authenticated" });
  }
});

// Logout Route
app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000");
  });
});

// Ensure Local Save Directory Exists
const SAVE_DIRECTORY = path.join(__dirname, "saved_letters");
if (!fs.existsSync(SAVE_DIRECTORY)) {
  fs.mkdirSync(SAVE_DIRECTORY);
}

// Save Letter & Upload to Google Drive
app.post("/save-letter", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  // Remove HTML tags before saving
  const plainTextContent = content
  .replace(/<\/?[^>]+(>|$)/g, '')  // Remove all HTML tags
  .replace(/&nbsp;/g, ' ')         // Replace non-breaking spaces
  .replace(/\s+/g, ' ')            // Remove extra whitespace
  .trim();

  const uniqueFilename = `letter_${Date.now()}_${uuidv4()}.txt`;
  const filePath = path.join(SAVE_DIRECTORY, uniqueFilename);

  fs.writeFile(filePath, plainTextContent, async (err) => {
    if (err) {
      console.error("Error saving letter:", err);
      return res.status(500).json({ message: "Failed to save file" });
    }

    try {
      const googleDriveUrl = await uploadToGoogleDrive(req.user.accessToken, filePath, uniqueFilename);
      res.status(200).json({ message: "Letter saved successfully", filename: uniqueFilename, googleDriveUrl });
    } catch (error) {
      console.error("Google Drive upload failed:", error);
      res.status(500).json({ message: "Failed to upload to Google Drive" });
    }
  });
});

// Upload File to Google Drive (Creates Folder If Missing)
async function uploadToGoogleDrive(accessToken, filePath, filename) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth });

  // Check if "Saved Letters" folder exists, otherwise create it
  let folderId = await getOrCreateFolder(drive, "Saved Letters");

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  const media = {
    mimeType: "text/plain",
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  return response.data.webViewLink;
}

// Get or Create Folder in Google Drive
async function getOrCreateFolder(drive, folderName) {
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id; // Return existing folder ID
  } else {
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: "id",
    });

    return folder.data.id; // Return new folder ID
  }
}

// Start Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});


