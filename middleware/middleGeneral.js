exports.language = function(req, res, next) {
  if(!req.cookies.lang) {
    res.cookie('lang', 'es', { maxAge:999999999, secure:true, httpOnly:true, Domain:'tecnoagora.com', Path:'/', SameSite:'Lax' });
    req.lang = 1;
  }
  else {
    if(req.cookies.lang == 'cat') req.lang = 0;
    else if(req.cookies.lang == 'es') req.lang = 1;
    else if(req.cookies.lang == 'en') req.lang = 2;
    else {
      res.cookie('lang', 'es', { maxAge:999999999, secure:true, httpOnly:true, Domain:'tecnoagora.com', Path:'/', SameSite:'Lax' });
      req.lang = 1;
    }
  }
  next();
}
