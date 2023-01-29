var express = require('express');
var router = express.Router();
let funkcije = require('../utils/db-funkcije')
const hash = require("../utils/hash");

const multer = require('multer');
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/profile_images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({storage: storage})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/events')
});

router.get('/events', funkcije.povuciEvente, funkcije.povuciUmjetnike, funkcije.povuciKlubove, async function(req, res, next) {
  let korisnik = false;
  if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
  res.render('index', { eventi: req.eventi, umjetnici: req.umjetnici, lokali: req.klubovi, korisnik})
});


router.get('/umjetnici',funkcije.povuciUmjetnike, funkcije.postaviTipKorisnika, async function(req, res, next) {
  let korisnik = false;
  if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
  res.render('umjetnici', { umjetnici: req.umjetnici, tip: req.tip, korisnik})
});


router.get('/klubovi',funkcije.povuciKlubove , funkcije.postaviTipKorisnika, async function(req, res, next) {
  let korisnik = false;
  if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
  res.render('lokali', { lokali: req.klubovi, tip: req.tip, korisnik})
});

router.get('/signup', async (req, res, next)=>{
  let korisnik = false;
  if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
  res.render('signup', {korisnik});
})

router.post('/signup/umjetnik', upload.single("image"), (req, res, next ) => {
  let {email, username, zanr, password, re_password, cijena_od, cijena_do, opis} = req.body;
  let imagePath = req.file.path;
    funkcije.provjeriRegistracijuUmjetnika(username, email, password, re_password, zanr, opis, cijena_od, cijena_do, imagePath, req, res);
})

router.post('/signup/lokal', upload.single("image"), (req, res, next ) => {
  let {email, username, lokacija, password, re_password, cijena_od, cijena_do, opis} = req.body;
  let imagePath = req.file.path;
  funkcije.provjeriRegistracijuKafica(username, email, password, re_password, lokacija, opis, cijena_od, cijena_do, imagePath, req, res);
})

router.get('/login', async (req, res, next)=>{
  let korisnik = false;
  if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
  res.render('login', {korisnik});
})

router.post('/login/umjetnik', async (req, res, next) => {
  let {email, password} = req.body;
  await funkcije.provjeriLoginUmjetnika(email, password, req, res);
})

router.post('/login/lokal', async (req, res, next) => {
  let {email, password} = req.body;
  await funkcije.provjeriLoginKluba(email, password, req, res);
})

router.get('/logout', funkcije.obrisiCookie, function (req, res, next){
  res.redirect('/events');
});

router.post('/povecajGoste/:id', funkcije.dolazim);


module.exports = router;
