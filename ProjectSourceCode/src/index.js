// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
// set Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// db test
db.connect()
  .then(obj => {
    // Can check the server version here (pg-promise v10.1.0+):
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR', error.message || error);
  });

// ------------------------------------------  ROUTES  --------------------------------------------

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/login', (req, res) => {
  res.render('pages/login',{});
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const query = 'select * from users where users.email = $1 LIMIT 1';
  const values = [email];

  // get the user_id based on the emailid
  db.one(query, values)
    .then(data => {
      user.user_id = data.user_id;
      user.email = data.email;

      req.session.user = user;
      req.session.save();

      res.redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
});

// Add the registration route

// GET route for the registration page
app.get('/register', (req, res) => {
  res.render('pages/register', {
    title: 'Register Account',
    message: 'Please fill out the form to register.'
  });
});

app.post('/register', async (req, res) => 
{
  const { email, password } = req.body;
  if (!email || !password) 
  {
      return res.status(400).send('Email and password are required');
  }

  try 
  {
      const user = await db.one
      (
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
          [email, password]
      );
      res.render('pages/login');
  } 
  
  catch (error) 
  {
      console.error('Registration error:', error);
      res.status(500).send('Error registering the user');
  }
});



// logout endpoint
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout');
});

// -------------------------------------  START THE SERVER   ----------------------------------------------
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');
