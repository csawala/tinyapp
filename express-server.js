'use strict'

const express = require("express")
const bodyParser = require("body-parser")
const bcrypt = require('bcrypt')
const cookieSession = require('cookie-session')

const app = express()
const PORT = process.env.PORT || 8080 // default port 8080

// assign app.____
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieSession({
  name: 'session',
  keys: ['random key'], // not sure what to put here...
  maxAge: 60 * 60 * 1000 // 1 hour cookie life
}))

// =================================================================
// ========================= DECLARATIONS ==========================
// =================================================================
const userDatabase = {                // Assigning test user
  "ABcd01": { id: "ABcd01", email: "asdfgh@test.com", hashword: bcrypt.hashSync("test", 10) }
}

const urlDatabase = {                 // Assigning test URL's to test user
  "b2xVn2":  ["http://www.lighthouselabs.ca", "ABcd01"],
  "9sm5xK":  ["http://www.google.com", "ABcd01"]
}

const generateRandomString = function() {
  let randStr = ''
  // I reallllllllly dislike this method, but it seems the cleanest and easier to understand
  const randOptions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 6; i++){          // Assign 6 char random Alphanumeric sequence
    randStr += randOptions.charAt(Math.floor(Math.random() * 61) + 1)
  }
  return randStr
}

const findOwnedUrls = function(user) {    // USE COOKIE TO FIND URLS FOR USER
  // CHECK OWNER OF SHORTURL
  let returnData = {}
  for (var short in urlDatabase) {
    if (urlDatabase[short][1] == user) {
      returnData[short] = urlDatabase[short][0]
    }
  }
  return returnData
}

// =================================================================
// ========================= APP STUFF =============================
// =================================================================

// ========================= URL STUFF =============================
app.get("/", (req, res) => {
  res.redirect("/urls")
})

app.get("/urls", (req, res) => {                      // ======== Main Page
  let templateVars = { username: "" }
  if (req.session.logged_user){
    templateVars.username = userDatabase[req.session.logged_user].email
    templateVars.urls = findOwnedUrls(req.session.logged_user) // find associated URLs to cookie/user
  }

  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => {                  // ========= Create new Shortlink
  let templateVars = {}
  if (req.session.logged_user){
    templateVars.username = userDatabase[req.session.logged_user].email
    res.render("urls_new", templateVars)
    return
  } else {
    templateVars.username = ""
  }
  res.redirect("/urls")
})

app.get("/urls/:id", (req, res) => {                  // ========= Update/Show Short Screen
  let templateVars = {
    shortURL: req.params.id,
  }
  if (req.session.logged_user){
    templateVars.longURL = urlDatabase[req.params.id][0]
    templateVars.username = userDatabase[req.session.logged_user].email
  } else {
    res.redirect("/urls")   // do not show update screen if not logged in
    return
  }

  res.render("urls_show", templateVars)
})

app.post("/urls", (req, res) => {                     // ========= Create new URL
  let testURL = req.body.longURL
  if (!testURL.includes("://")) {
    res.redirect(400, "urls/new")     // will only allow urls w/ '://'
    return
  }

  let shortURL = generateRandomString()
  urlDatabase[shortURL] = []
  urlDatabase[shortURL][0] = req.body.longURL           // new URL always index 0
  urlDatabase[shortURL][1] = req.session.logged_user    // associated owner always index 1

  res.redirect("/urls/" + shortURL)
})

app.get("/u/:shortURL", (req, res) => {               // ========= Short Link Redirect
  if (!urlDatabase[req.params.shortURL]) {  // checks that link exists
    res.redirect(404, "/urls")
    return
  }

  let longURL = urlDatabase[req.params.shortURL][0]
  res.redirect(longURL)         // will redirect for anybody as long as it exists
})

app.post("/urls/:shortURL/update", (req, res) => {    // ========= Update URL
  let testURL = req.body.longURL
  if ((urlDatabase[req.params.shortURL][1] == req.session.logged_user) && testURL.includes("://")) {
    urlDatabase[req.params.shortURL][0] = req.body.longURL      // ensures user is URL owner & input isn't blank
  }

  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) =>{     // ======== Remove URL
  if (urlDatabase[req.params.shortURL][1] == req.session.logged_user) {
    delete urlDatabase[req.params.shortURL]     // will only delete if user & URL owner match
  }
  res.redirect("/urls")
})

// ========================== REGISTER ==============================

app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: userDatabase
  }

  res.render("register")
})

app.post("/register", (req, res) => {
  for (var match in userDatabase){
    if (userDatabase[match].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, userDatabase[match].hashword)) {
        req.session.logged_user = match
        res.redirect("/urls")         // USER & PASSWORD MATCH -- log user in automatically & redirect
        return
      }
      res.redirect(400, "/")    // USER MATCH, PASSWORD INCORRECT
      return
    }
  }

  if (!req.body.password || !req.body.email) {
    res.redirect(400, "/urls")      // EMAIL or PASSWORD CANNOT BE BLANK
    return
  }

  let randStr = generateRandomString()
  userDatabase[randStr] = {     // ACTUAL CREATION OF NEW USER
    id: randStr,
    email: req.body.email,
    hashword: bcrypt.hashSync(req.body.password, 10)
  }

  req.session.logged_user = randStr     // INITIALIZE NEW COOKIE
  res.redirect("/urls")
})

// ========================== LOG IN ===============================

app.post("/login", (req, res) => {
  let templateVars = {};

  for (var match in userDatabase){
    if ((userDatabase[match].email == req.body.username)
      && bcrypt.compareSync(req.body.password, userDatabase[match].hashword)) {  // USER & PASS MATCH
      templateVars.username = userDatabase[match].email
      req.session.logged_user = match

      res.redirect("/urls")
      return
    } else if ((userDatabase[match].email == req.body.username)         // PASSWORD MISMATCH
      && (bcrypt.compareSync(req.body.password, userDatabase[match].hashword) === false)) {

      res.redirect(403, "/")
      return
    }
  }

  res.redirect(403, "/register") // NO USER FOUND
})

app.post("/logout", (req, res) => {
  req.session = null      // DELETE CURRENT COOKIE DATA
  res.redirect("/urls")
})

// =================================================================
// ========================= LISTENING =============================
// =================================================================

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)   // CONFIRMATION OF SERVER RUNNING
})