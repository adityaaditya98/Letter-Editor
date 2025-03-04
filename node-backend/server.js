const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));


app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));


app.get("/auth/google/callback", 
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/dashboard",
    failureRedirect: "http://localhost:3000/login",
  })
);


app.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not Authenticated" });
  }
});


app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000");
  });
});

//////////////////////////////////////////////////////

const SAVE_DIRECTORY = path.join(__dirname, "saved_letters");

// Ensure the directory exists
if (!fs.existsSync(SAVE_DIRECTORY)) {
  fs.mkdirSync(SAVE_DIRECTORY);
}

app.post("/save-letter", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  const uniqueFilename = `letter_${Date.now()}_${uuidv4()}.txt`;
  const filePath = path.join(SAVE_DIRECTORY, uniqueFilename);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error saving letter:", err);
      return res.status(500).json({ message: "Failed to save file" });
    }
    res.status(200).json({ message: "Letter saved successfully", filename: uniqueFilename });
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

