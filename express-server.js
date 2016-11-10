'use strict'

const express = require("express")
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser')

const app = express()
const PORT = process.env.PORT || 8080 // default port 8080

// assign app.____
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())

// =======================================================
// ==================== DECLARATIONS =====================
// =======================================================
const generateRandomString = function() {
  let randStr = ''
  // I reallllllllly dislike this method, but it seems the cleanest to make sense of
  const randOptions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 6; i++){
    randStr += randOptions.charAt(Math.floor(Math.random() * 61) + 1)
  }
  return randStr
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

// =======================================================
// ==================== APP STUFF ========================
// =======================================================

// ==================== URL STUFF ========================
app.get("/", (req, res) => {
  res.redirect("/urls")
})

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies.logged_user
  }
  res.render("urls_index", templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies.logged_user
  }
  res.render("urls_new", templateVars)
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.logged_user
  }
  res.render("urls_show", templateVars)
})

app.post("/urls", (req, res) => {
  console.log(req.body)  // debug statement to see POST parameters
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  res.redirect("/urls/" + shortURL)
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL)
})

app.post("/urls/:shortURL/update", (req, res) => {
  console.log(req.body)  // debug statement to see POST parameters
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) =>{
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
})

// ===================== LOGGING =========================

app.post("/login", (req, res) => {
  let templateVars = {
    username: req.body["username"],
    password: req.body["password"]
  }
  res.cookie("logged_user", templateVars.username)
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  res.clearCookie("logged_user")
  res.redirect("/urls")
})

// =======================================================
// ==================== LISTENING ========================
// =======================================================

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})