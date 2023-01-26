const express = require("express"); // importando o express de node_modules
const expressHandlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const app = express();
const handlers = require("./lib/handlers");
const fortune = require("./lib/middleware/fortune");
const { weatherMiddleware } = require ("./lib/middleware/weather");
const { credentials } = require('./config');
const cookieParser = require('cookie-parser')
const expressSession = require("express-session")
const flashMiddleware = require('./lib/middleware/flash')
const cartValidation = require('./lib/cartValidation');
const RedisStore = require('connect-redis')(expressSession)
require('./routes')(app)
const cors = require('cors')


app.get('/api/vacations', handlers.getVacationsApi)
app.get('api/vacation/:sku', handlers.getVacationsBySkuApi)
app.post('/api/vacations/:sku/notify-qhen-in-season',
handlers.addVacationsInSeasonListenerApi)
app.delete('/api/vacation/:sku', handlers.requestDeleteVacationApi)
app.use('/api',cors())

app.use(cartValidation.resetValidation)
app.use(cartValidation.checkWaivers)
app.use(cartValidation.checkGuestCounts)

app.use(flashMiddleware)

app.use(cookieParser(credentials.cookieSecret))
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  store: new RedisStore({
    url: credentials.redis.url,
    logErrors: true, // altamente recomendado
  })
}))


// configure Handlebars view engine
app.engine("handlebars", expressHandlebars.engine({
  defaultLayout: "main",
  helpers: {
    section: function(name, options) {/*  only change here  */
      if (!this._sections) {
        this._sections = {};
      }
      this._sections[name] = options.fn(this);

      return null;
    }
  }
}));

app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000;
// eslint-disable-next-line no-undef
app.use(express.static(__dirname + "/public"));
app.use(weatherMiddleware);


app.post("/api/newsletter-singup", handlers.api.newsletterSingup);



//página 404 personalizada
app.use((req, res) => {
  res.type("text/plain");
  res.status(404);
  res.send("404 - not found");
});
// página 500 personalizada
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  //middleware
  console.log(err.message);
  res.type("text/plain");
  res.status(500);
  res.send("500 - Server Error");
});

app.listen(port, () => console.log(`Express started in ` + `${app.get('env')}
 mode at http://localhost:${port} ` + `; press CTRL-C to terminate.`))