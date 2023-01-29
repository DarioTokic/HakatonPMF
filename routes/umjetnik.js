var express = require('express');
var router = express.Router();
let funkcije = require('../utils/db-funkcije')
let hash = require('../utils/hash')

const multer = require('multer');
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/event_images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({storage: storage})

router.get('/', funkcije.povuciPodatkeUmjetnika, async(req, res, next)=>{
    let korisnik = false;
    if(typeof(req.cookies.cookie_sesija) !== 'undefined') {await funkcije.postaviTipKorisnika(req, res, ()=>{});korisnik = req.tip; }
    res.render('umjetnik', {umjetnik: req.umjetnik, korisnik})
} )

router.post('/proposal', upload.single("image"), funkcije.predlloziLokalu)

router.post('/napraviEvent/:id', async function(req, res, next){
    let id = req.params.id;
    await funkcije.napraviEvent(id, req, res, next);
    res.redirect('/')
});
router.get('/obrisiProposal/:id', async function(req, res, next){
    let id = req.params.id;
    await funkcije.obrisiProposal(id, req, res, next);
    res.redirect('/umjetnik');
});

module.exports = router;