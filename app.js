require('dotenv').config();
const app = require('express')();
const line = require('@line/bot-sdk');
let request = require('sync-request');
const cron = require('node-cron');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const config_line = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const config_gg = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
};
app.post('/webhook', line.middleware(config_line), (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) =>
    res.json(result)
  );
});
const client = new line.Client(config_line);
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  if (event.message.text == 'help') {
    const help =
      'コマンド一覧（スペースがなしでを打ったら、適用情報が出ます）\nhelp          : マニュアル\nrules         :ルール参照\nwifi            :wifi参照\ncleaning   :掃除当番\ntrash         :ゴミ当番\nweather    :天気情報\nfate           :占い';
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: help,
    });
  }
  if (event.message.text == 'wifi') {
    const wifi = {
      type: 'flex',
      altText: '天気情報',
      contents: {
        type: 'carousel',
        contents: [
          {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'image',
                  url: 'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/jack1_wifi.jpg',
                  size: 'full',
                  aspectMode: 'cover',
                  aspectRatio: '2:3',
                  gravity: 'top',
                },
              ],
              paddingAll: '0px',
            },
          },
          {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'image',
                  url: 'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/jack2_wifi.jpg',
                  size: 'full',
                  aspectMode: 'cover',
                  aspectRatio: '2:3',
                  gravity: 'top',
                },
              ],
              paddingAll: '0px',
            },
          },
        ],
      },
    };
    return client.replyMessage(event.replyToken, wifi);
  }
  if (event.message.text == 'rules') {
    const rules =
      'JACK‘S RULE \n\nここは壁の薄い木造シェアハウスです 配慮をもってお互い気持ちよく生活しましょう \n\nJACKでの共有事項が連絡されるため LINEは必ず確認するようにしてください。\n\n\n---全般--- \n\n◉共有物は丁寧に扱う、使ったら片付ける\n\n◉住人以外を呼ぶ際は、必ずグループに連絡してください。\n\n◉室内用スリッパで外出禁止、外履き用を室内で履くの禁止 他人のスリッパをかってにはかない\n\n◉喫煙は外の喫煙スペースでお願いします\n\n◉宅配物の時間指定できるものはなるべく自身が在宅している時に指定してください。\n\n◉外出時、リビングを利用する時、自分の部屋を一定時間離れる時は部屋の電気をつけっぱなしにするのやめましょう。地球はあなた1人のものじゃありません。\n\n\n---リビングの使用に関して--- \n\n◉食器はその都度洗う(つけ置き以外) \n\n◉台所、テーブルなど使って汚したところはきれいにしてから退出して下さい。\n\n◉濡れたままの食器を棚に戻さないで下さい。また食器を戻す時は同じお皿でまとめてください。 \n\n◉食器乾燥機の乾いている食器の上に洗った食器を置くのやめましょう(禁止)\n\n◉生ゴミがたまっていたら袋をしばって可燃ごみ箱に入れて下さい。 袋がしばれないほど溜めるの禁止(禁止) \n\n◉生ゴミを直接ごみ箱に捨てない(禁止) 虫がわきます。 \n\n◉炊飯器を使ったら次の人が使えるよう中身は移動してスイッチを切ってください。 \n\n◉シンクに水が溜まるほど排水溝にゴミが溜まっていたら、無視せずネットを変えてください。 \n\n◉リビングを離れる時は自分がエアコンや電気、テレビをつけていなくても、最後に退出する際は消してください。\n\n\n---深夜の過ごし方--- \n\n◉就寝時間0時〜6時の間に電話をしたい人は家の外に出て電話📞 室内で電話しないでください\n\n◉夜中は静かに歩きドアも静かに閉めてください。 \n\n◉夏は窓を開けると風圧で勢いよくドアが閉まります。そっと閉めてください。 上にも横にもひびきます。\n\n\n---ゴミ出し--- \n\n◉生物や残飯を直接可燃ごみ箱に入れないでください\n\n◉ごみ箱のフタが(注意)閉まらない ＝袋の替え時です❗️ \n\n◉牛乳パック(牛乳)やヨーグルトの容器は 洗って！折りたたんで！捨てる 可燃ゴミ袋は有料です、なるべくコンパクトにして捨てましょう \n\n◉ダンボールや紙資源に出せるものはできる範囲で可燃ゴミではなくリサイクル♻️へ ※ダンボールは自分でだす！→紙資源袋に入れないでください。\n\n◉ペットボトルのキャップとラベルは可燃ゴミ、本体は潰してから！♻️のごみ箱に入れて下さい。 \n\n◉可燃ゴミ→月、木 リビング、2F、お風呂場、猫のトイレなどまとめて捨てます。 誰かがやるからと思わずたまにはしましょう。\n\n◉資源ゴミ 第二土曜日 お隣マンション前に朝9時までに出す ---掃除--- \n\n◉スケジュール表を確認してください。 \n\n◉掃除当番でなくても共有部分はたまには軽く掃除機とかクイックルワイパーしましょう\n\n◉リビングで食事をしてる人がいるときは掃除機などほこりがまう行為はやめましょう \n\n◉食器、フライパンはスポンジで洗う、シンク、排水溝は#専用ブラシを使う';
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: rules,
    });
  }
  if (event.message.text == 'cleaning') {
    const clean = await getClean();
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: clean,
    });
  }
  if (event.message.text == 'trash') {
    const trash = await getTrash();
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: trash,
    });
  }
  if (event.message.text == 'weather') {
    const weather = await getWeather();
    return client.replyMessage(event.replyToken, weather);
  }
  if (event.message.text == 'fate') {
    const fate = await getFate();
    return client.replyMessage(event.replyToken, fate);
  }
  
}
async function getClean() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  await doc.useServiceAccountAuth(config_gg);
  await doc.loadInfo(); 
  const sheet = doc.sheetsByIndex[0]; 
  const rows = await sheet.getRows();
  const headers = sheet.headerValues;
  var head = '';
  var row = '';
  var mess = '';
  rows.forEach((e) => {
    var i = 0;
    headers.forEach((r) => {
      if (i == 0) {
        mess += e[r] + '\n';
      }
      if (i > 0) {
        mess += r + ':' + e[r] + ' \n';
      }
      i++;
    });
    mess += '\n';
  });
  console.log(mess);
  return mess;
}

async function getTrash() {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  await doc.useServiceAccountAuth(config_gg);

  await doc.loadInfo(); 
  const sheet = doc.sheetsByIndex[1]; 
  const rows = await sheet.getRows();
  const headers = sheet.headerValues;
  var head = '';
  var row = '';
  var mess = '';

  headers.forEach((r) => {
    mess += r + ':\n';
    for (let i = 0; i < 2; i++) {
      mess += '-' + rows[i][r];
    }
    mess += '\n';
  });
  return mess;
}

async function getWeather() {
  var url = `https://www.jma.go.jp/bosai/forecast/data/forecast/400000.json`;
  var body = request('GET', url).body.toString();
  let weather = JSON.parse(body)[0].timeSeries[0].areas.find(
    (a) => a.area.code === '400010'
  );
  let temperature = JSON.parse(body)[0].timeSeries[2].areas.find(
    (a) => a.area.code === '82182'
  );
  var text = '';
  var code = JSON.parse(fs.readFileSync('weathercode.json', 'utf8'));
  text += weather.area.name + ':' + code[weather.weatherCodes[0]][3] + '\n';
  text += '天気:' + weather.weathers[0] + '\n';
  text +=
    '気温(°C):' + temperature.temps[0] + '-' + temperature.temps[1] + '\n';
  text += '風:' + weather.winds[0] + '\n';
  text += '波:' + weather.waves[0] + '\n';

  var d = new Date(
    Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
  );
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var date = d.getDate();
  var day = d.getDay();
  var j_day = ['日', '月', '火', '水', '木', '金', '土'];

  return (message = {
    type: 'flex',
    altText: '天気情報',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text:
              year + '年' + month + '月' + date + '日' + '(' + j_day[day] + ')',
            align: 'center',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'xxl',
          },
        ],
        backgroundColor: '#74FF33',
      },
      hero: {
        type: 'image',
        url:
          'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/img' +
          weather.weatherCodes[0] +
          '.png',
        size: 'full',
        aspectRatio: '20:13',
        action: {
          type: 'postback',
          label: 'action',
          data: 'hello',
        },
        margin: 'none',
        align: 'center',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '福岡地方',
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '天気:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: weather.weathers[0],
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '気温:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text:
                      temperature.temps[0] +
                      '->' +
                      temperature.temps[1] +
                      ' (°C)',
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '　風:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1,
                    align: 'start',
                  },
                  {
                    type: 'text',
                    text: weather.winds[0],
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '　波:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: weather.waves[0],
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5,
                  },
                ],
              },
            ],
          },
          {
            type: 'image',
            url: 'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/weather_icon.jpg',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'filler',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'Have a nice day!',
                size: 'xxl',
                align: 'center',
              },
            ],
            margin: 'sm',
          },
        ],
        flex: 0,
      },
      styles: {
        header: {
          separator: true,
        },
      },
    },
  });
}
async function getFate() {
  var d = new Date(
    Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000
  );
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var date = d.getDate();

  let url = `http://api.jugemkey.jp/api/horoscope/free/${year}/${month}/${date}`;
  let body = request('GET', url).body.toString();
  let horoscope = JSON.parse(body).horoscope;
  let data = horoscope[Object.keys(horoscope)[0]];
  let fate = data[Math.floor(Math.random() * data.length)];
  let total = ['', '末吉', '小吉', '中吉', '吉', '大吉'];
  let total_BC = ['', '7b8af7', 'af42f7', 'f957ef', 'f7ab31', 'ed446e'];
  let money = fate.money;
  let job = fate.job;
  let love = fate.love;
  let item = fate.item;
  let content = fate.content;
  let color = fate.color;
  let sign = fate.sign;
  let goldstar =
    'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png';
  let graystar =
    'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gray_star_28.png';

  var money_star = [graystar, graystar, graystar, graystar, graystar];
  var job_star = [graystar, graystar, graystar, graystar, graystar];
  var love_star = [graystar, graystar, graystar, graystar, graystar];
  for (let i = 0; i < money; i++) {
    money_star[i] = goldstar;
  }
  for (let i = 0; i < job; i++) {
    job_star[i] = goldstar;
  }
  for (let i = 0; i < love; i++) {
    love_star[i] = goldstar;
  }

  return (message = {
    type: 'flex',
    altText: '運勢情報',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '今日の運勢',
            align: 'center',
            size: 'xxl',
            color: '#5656d8',
            weight: 'bold',
          },
        ],
        backgroundColor: '#a1aced',
      },
      hero: {
        type: 'image',
        url: 'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/uranai.jpg',
        size: 'full',
        aspectRatio: '20:13',
        action: {
          type: 'postback',
          label: 'action',
          data: 'hello',
        },
        margin: 'none',
        align: 'center',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: total[fate.total],
                weight: 'bold',
                size: 'xl',
                align: 'center',
                color: '#ffffff',
              },
            ],
            backgroundColor: '#' + total_BC[fate.total],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '金運:',
                    color: '#aaaaaa',
                    flex: 1,
                  },
                  {
                    type: 'icon',
                    url: money_star[0],
                  },
                  {
                    type: 'icon',
                    url: money_star[1],
                  },
                  {
                    type: 'icon',
                    url: money_star[2],
                  },
                  {
                    type: 'icon',
                    url: money_star[3],
                  },
                  {
                    type: 'icon',
                    url: money_star[4],
                  },
                  {
                    type: 'text',
                    text: money.toString(),
                    flex: 3,
                    color: '#a9a9a9',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '仕事:',
                    color: '#aaaaaa',
                    flex: 1,
                  },
                  {
                    type: 'icon',
                    url: job_star[0],
                  },
                  {
                    type: 'icon',
                    url: job_star[1],
                  },
                  {
                    type: 'icon',
                    url: job_star[2],
                  },
                  {
                    type: 'icon',
                    url: job_star[3],
                  },
                  {
                    type: 'icon',
                    url: job_star[4],
                  },
                  {
                    type: 'text',
                    text: job.toString(),
                    flex: 3,
                    color: '#a9a9a9',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: '恋愛:',
                    color: '#aaaaaa',
                    flex: 1,
                  },
                  {
                    type: 'icon',
                    url: love_star[0],
                  },
                  {
                    type: 'icon',
                    url: love_star[1],
                  },
                  {
                    type: 'icon',
                    url: love_star[2],
                  },
                  {
                    type: 'icon',
                    url: love_star[3],
                  },
                  {
                    type: 'icon',
                    url: love_star[4],
                  },
                  {
                    type: 'text',
                    text: love.toString(),
                    flex: 3,
                    color: '#a9a9a9',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '内容:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: content,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5,
                  },
                ],
              },
              {
                type: 'text',
                text: 'ラッキー物',
                weight: 'bold',
                align: 'center',
                color: '#46c42d',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'アイテム',
                    color: '#fc2f2f',
                  },
                  {
                    type: 'text',
                    text: 'カラー',
                    color: '#c9c90c',
                  },
                  {
                    type: 'text',
                    text: '星座名',
                    color: '#4ca5ff',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: item,
                    wrap: true,
                  },
                  {
                    type: 'text',
                    text: color,
                    wrap: true,
                  },
                  {
                    type: 'text',
                    text: sign,
                    wrap: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      styles: {
        header: {
          separator: true,
        },
      },
    },
  });
}

app.listen(process.env.PORT);
