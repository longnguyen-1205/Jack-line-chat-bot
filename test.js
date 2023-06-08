const translate = require('@iamtraction/google-translate');
var a= ""
translate('Tu es incroyable!', { to: 'en' }).then(res => {
    a= res.text;
    console.log(res.text); // OUTPUT: You are amazing!
  }).catch(err => {
    console.error(err);
  });
  console.log(a);