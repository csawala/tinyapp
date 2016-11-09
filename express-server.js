'use strict'

const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const PORT = process.env.PORT || 8080 // default port 8080

// assign EJS as templating engine
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))

// =======================================================
// =======================================================
function generateRandomString() {
  let
  fromCharCode
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.get("/", (req, res) => {
  res.end("Hello!")
})

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase }
  res.render("urls_index", templateVars)
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  }
  res.render("urls_show", templateVars)
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new")
})

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
})

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})