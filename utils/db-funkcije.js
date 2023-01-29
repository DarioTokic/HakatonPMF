var pg = require('pg')
var hash = require('./hash')
const {request} = require("express");

var config = {
    user:'goitxeuw',
    database:'goitxeuw',
    password:'QoIiDGQMf5clHuIBHU_Ol8KgJGAkgqcF',
    host:'snuffleupagus.db.elephantsql.com',
    port:5432,
    max: 100,
    idleTimeoutMillis: 30000
};
var pool = new pg.Pool(config);

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

let funkcije = {};

funkcije.query = async function (q,p) {
    const client = await pool.connect()
    let res
    try {
        await client.query('BEGIN')
        try {
            res = await client.query(q,p)
            await client.query('COMMIT')
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        }
    } finally {
        client.release()
    }
    return res.rows;
}


funkcije.povuciEvente = async function(req, res, next){
    try{
        req.eventi = await funkcije.query("select * from event where aktivnost = true;", [])
    }
    catch (err){console.log(err) ;res.render('alert', {messsage:err})}
    next();
}


funkcije.povuciUmjetnike = async function(req, res, next){
    try{
        req.umjetnici = await funkcije.query("select * from umjetnik;", [])
            /*req.umjetnici.forEach(umjetnik => {
                umjetnik.eventi = req.funkcije.query("select * from event where id_umjetnik = $1;", [umjetnik.umjetnik_id])
            })*/
    }
    catch (err){res.render('alert', {messsage:err})}
    next();
}

funkcije.povuciKlubove = async function(req, res, next){
    try { req.klubovi =await funkcije.query("select * from klub", []) }
    catch (err){res.render('alert', {messsage:err})}
    next();
}

/***
 * LOGIN I REGISTRACIJA
 */

funkcije.provjeriUsernameUmjetnika = async function(ime){
    return await funkcije.query(`SELECT username FROM umjetnik where username = $1`, [ime]);
};
funkcije.provjeriMailUmjetnika = async function(mail){
    return await funkcije.query(`SELECT email FROM umjetnik where email = $1`, [mail]);
};
funkcije.provjeriRegistracijuUmjetnika = async function(username, email, password, password2, zanr, opis, cijenaod, cijenado, profilna, req, res){
    let errors = [];
    if(password != password2){
        errors.push({poruka: "Sifre se ne poklapaju!"});
    }
    if((await funkcije.provjeriUsernameUmjetnika(username)).length != 0){
        errors.push({poruka: "Username vec postoji!"});
    }
    if(password.length < 6){
        errors.push({poruka: "Password ne smije biti kraci od 6 karaktera!"});
    }
    if((await funkcije.provjeriMailUmjetnika(email)).length != 0){
        errors.push({poruka: "Email vec postoji"});
    }
    if(errors.length > 0){
        res.render('signup', {err: errors});
    }
    let kriptovanaLozinka = await hash.hashirajLozinku(password);
    await funkcije.query(`INSERT INTO umjetnik (email, username, lozinka, zanr, opis, cijena_od, cijena_do, profilna)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [email, username, kriptovanaLozinka, zanr, opis, cijenaod, cijenado, profilna]);
    res.redirect('/login')
};
funkcije.provjeriUsernameKafica = async function(ime){
    return await funkcije.query(`SELECT username FROM klub where username = $1`, [ime]);
};
funkcije.provjeriMailKafica = async function(mail){
    return await funkcije.query(`SELECT email FROM klub where email = $1`, [mail]);
};
funkcije.provjeriRegistracijuKafica = async function(username, email, password, password2, lokacija, opis, cijenaod, cijenado, profilna, req, res){
    let errors2 = [];
    if(password != password2){
        errors2.push({poruka: "Sifre se ne poklapaju!"});
    }
    if((await funkcije.provjeriUsernameKafica(username)).length != 0){
        errors2.push({poruka: "Username vec postoji!"});
    }
    if(password.length < 6){
        errors2.push({poruka: "Password ne smije biti kraci od 6 karaktera!"});
    }
    if((await funkcije.provjeriMailKafica(email)).length != 0){
        errors2.push({poruka: "Email vec postoji"});
    }
    if(errors2.length > 0){
        res.render('signup', {err: errors2});
    }
    let kriptovanaLozinka = await hash.hashirajLozinku(password);
    await funkcije.query(`INSERT INTO klub (email, username, lozinka, lokacija, opis, cijena_od, cijena_do, profilna)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [email, username, kriptovanaLozinka, lokacija, opis, cijenaod, cijenado, profilna]);
    res.redirect('/login')
};
funkcije.lozinkaUmjetnika = async function(ime){
    return await funkcije.query(`SELECT lozinka FROM umjetnik WHERE email = $1`, [ime]);
}
funkcije.dajUmjetnika  = async function(ime){
    return await funkcije.query(`SELECT * FROM umjetnik WHERE email = $1`, [ime]);
}
funkcije.provjeriLoginUmjetnika = async function(ime, password, req, res){
    let ime2 = await funkcije.provjeriMailUmjetnika(ime);

    let errors3 = [];
    if(ime2.length == 0){
        errors3.push({poruka: "Nepostojeci email"});
        return res.redirect('back')
    }
        let sifra  = await funkcije.lozinkaUmjetnika(ime2[0].email);

        let lozin = sifra[0].lozinka;
        if(!(await hash.provjeri(password, lozin))){
            errors3.push({poruka: "Pogresna lozinka"});
            return res.redirect('back')
        }

    let podaci = await funkcije.dajUmjetnika(ime2[0].email);
    let token = {
        id: podaci[0].umjetnik_id,
        ime: podaci[0].username,
        tip: "umjetnik"
    }
    let hashiranToken = await hash.hashirajToken(token);
    res.cookie("cookie_sesija", hashiranToken, {maxAge: 3*60*60*1000});
    res.redirect("/umjetnik");
}

funkcije.lozinkaKluba = async function(ime){
    return await funkcije.query(`SELECT lozinka FROM klub WHERE email = $1`, [ime]);
}
funkcije.dajKlub  = async function(ime){
    return await funkcije.query(`SELECT * FROM klub WHERE email = $1`, [ime]);
}
funkcije.provjeriLoginKluba = async function(ime, password, req, res){
    let ime2 = await funkcije.provjeriMailKafica(ime);
    console.info(ime2)
    let errors4 = [];
    if(ime2.length == 0){
        errors4.push({poruka: "Nepostojeci email"});
        res.render('/login', {err: errors4});
    }
    let sifra = await funkcije.lozinkaKluba(ime2[0].email);
    let lozin = sifra[0].lozinka;
    if(!(await hash.provjeri(password, lozin))){
        errors4.push({poruka:"Pogresna lozinka"});
        res.render('/login', {err:errors4});
    }
    let podaci = await funkcije.dajKlub(ime2[0].email);
    let token = {
        id: podaci[0].klub_id,
        ime: podaci[0].username,
        tip: "lokal"
    }
    let hashiranToken = await hash.hashirajToken(token);
    res.cookie("cookie_sesija", hashiranToken, {maxAge: 3*60*60*1000});
    res.redirect("/lokal");
}

/*
 * ZA UMJETNIKA
 */

funkcije.povuciPodatkeUmjetnika = async function(req, res, next){
    let dekodiran = await hash.dehashirajToken(req.cookies.cookie_sesija)
    req.tip = dekodiran.tip;
    try { [req.umjetnik] = await funkcije.query("select * from umjetnik where umjetnik_id = $1", [dekodiran.id])}

    catch (err){res.render('alert', {messsage:err})}

    try { req.umjetnik.eventi = await funkcije.query("select * from event where umjetnik_id = $1", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    try { req.umjetnik.prijedlozi = await funkcije.query("select * from proposal where umjetnik_id = $1 and potvrdio_umjetnik = true", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    try { req.umjetnik.ponude = await funkcije.query("select * from proposal where umjetnik_id = $1 and potvrdio_klub = true", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    next();
}

funkcije.predlloziLokalu = async (req, res)=> {

    try {   //umjetnik_id, klub_id, vrijeme, trajanje, cijena, ulaz, potvrdio_umjetnik, potvrdio_klub
        let dekodiran = await hash.dehashirajToken(req.cookies.cookie_sesija)
        let imagePath = req.file.path;
        funkcije.query("insert into proposal (umjetnik_id, klub_id, vrijeme, trajanje, cijena, cijena_ulaznice, potvrdio_umjetnik, potvrdio_klub, ime, naslovna) values($1, $2, $3, $4, $5, $6, true, false, $7, $8)", [dekodiran.id, req.body.klub_id,req.body.vrijeme, req.body.trajanje, req.body.cijena, req.body.ulaz, req.body.ime, imagePath])
    }
    catch (err){}

    res.redirect('back')
}


/*
 *  ZA LOKAL
 */

funkcije.povuciPodatkeLokala = async function(req, res, next){
    let dekodiran = await hash.dehashirajToken(req.cookies.cookie_sesija)
    req.tip = dekodiran.tip;
    try { [req.lokal] = await funkcije.query("select * from klub where klub_id = $1", [dekodiran.id])}

    catch (err){res.render('alert', {messsage:err})}

    try { req.lokal.eventi = await funkcije.query("select * from event where klub_id = $1", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    try { req.lokal.prijedlozi = await funkcije.query("select * from proposal where klub_id = $1 and potvrdio_klub = true", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    try { req.lokal.ponude = await funkcije.query("select * from proposal where klub_id = $1 and potvrdio_umjetnik = true", [dekodiran.id]) }
    catch (err){res.render('alert', {messsage:err})}

    next();
}


funkcije.postaviTipKorisnika = async function (req, res, next){
    try {
        let dekodiran = await hash.dehashirajToken(req.cookies.cookie_sesija);
        req.tip = dekodiran.tip;
    }
    catch (err){
    }
    next();
}

funkcije.predlloziUmjetniku = async (req, res)=> {

    try {   //umjetnik_id, klub_id, vrijeme, trajanje, cijena, ulaz, potvrdio_umjetnik, potvrdio_klub
        let dekodiran = await hash.dehashirajToken(req.cookies.cookie_sesija)
        let imagePath = req.file.path;
        funkcije.query("insert into proposal (umjetnik_id, klub_id, vrijeme, trajanje, cijena, cijena_ulaznice, potvrdio_umjetnik, potvrdio_klub, ime, naslovna) values($1, $2, $3, $4, $5, $6, true, false, $7, $8)", [req.body.umjetnik_id, dekodiran.id,req.body.vrijeme, req.body.trajanje, req.body.cijena, req.body.ulaz, req.body.ime, imagePath])
    }
    catch (err){}

    res.redirect('back')
}


funkcije.dolazim = (req, res) => {
    funkcije.query(`UPDATE event SET broj_gostiju = broj_gostiju + 1 WHERE event_id = $1`, [req.params.id]);
}
/*{

*
funkcije.ime = async function(req, res, next){
    try { await funkcije.query("", []) }
    catch (err){res.render('alert', {messsage:err})}
}
* */

funkcije.obrisiCookie = function(req, res, next){
    res.cookie("cookie_sesija", '', {maxAge: -1});
    next();
}
funkcije.napraviEvent = async function(id, req, res, next){
    let [result] = await funkcije.query(`SELECT * FROM proposal where proposal_id = $1`, [id]);
    await funkcije.query(`INSERT into event(umjetnik_id, klub_id, vrijeme, trajanje, cijena, cijena_ulaznica, ime, naslovna)
                             VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [result.umjetnik_id, result.klub_id, result.vrijeme,result.trajanje, result.cijena, result.cijena_ulaznice,
            result.ime, result.naslovna])
}
funkcije.obrisiProposal = async function(id){
    await funkcije.query(`DELETE FROM proposal where proposal_id = $1`, [id]);
}
module.exports = funkcije;