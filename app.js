const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()


//APIs 1 Register user ApI

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const hashPassword = await bcrypt.hash(password, 15)

  const UserQuery = `
  SELECT * 
  FROM user 
  WHERE 
  username = "${username}";`

  const dbUser = await db.get(UserQuery)

  if (dbUser === undefined) {
    const userCreate = `
    INSERT INTO
    user(username,name,password,gender,location)
    VALUES(
      '${username}',
      '${name}',
      '${hashPassword}',
      '${gender}',
      '${location}'
    );
     `
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(userCreate)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// APIs 2 Login
app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const loginUserQuery = `
  SELECT * 
  FROM user
  WHERE 
  username = "${username}"
  `
  const dbUser = await db.get(loginUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password)
    if (isPasswordCorrect === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

module.exports = app
