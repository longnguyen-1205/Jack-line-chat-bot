const line = require('@line/bot-sdk');
const cron = require('node-cron');
let request = require('sync-request');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');

require('dotenv').config();
const config_line = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const config_gg = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
};



cron.schedule('0 0 8 * * *', () => {
  daily();
}, {
  scheduled: true,
  timezone: "Asia/Tokyo"
});



async function daily() {
  const client = new line.Client(config_line);

  //weather
  var url = `https://www.jma.go.jp/bosai/forecast/data/forecast/400000.json`;
  var body = request('GET', url).body.toString();
  let weather = JSON.parse(body)[0].timeSeries[0].areas.find(
    (a) => a.area.code === '400010'
  );
  let temperature = JSON.parse(body)[0].timeSeries[2].areas.find(
    (a) => a.area.code === '82182'
  );
  var text = '';
  var code = JSON.parse(fs.readFileSync('weather-code.json', 'utf8'));
  text += weather.area.name + ':' + code[weather.weatherCodes[0]][3] + '\n';
  text += '天気:' + weather.weathers[0] + '\n';
  text +=
    '気温(°C):' + temperature.temps[0] + '-' + temperature.temps[1] + '\n';
  text += '風:' + weather.winds[0] + '\n';
  text += '波:' + weather.waves[0] + '\n';

  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth() + 1;
  var date = d.getDate();
  var day = d.getDay();
  var j_day = ['日', '月', '火', '水', '木', '金', '土'];
  var daily = month + '月' + date + '日';

  //fate
  url = `http://api.jugemkey.jp/api/horoscope/free/${year}/${month}/${date}`;

  body = request('GET', url).body.toString();
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

  //trash
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  await doc.useServiceAccountAuth(config_gg);

  await doc.loadInfo(); // loads document properties and worksheets
  var sheet = doc.sheetsByIndex[1]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  var rows = await sheet.getRows();
  var headers = sheet.headerValues;
  var trash_day = '-----------';
  var trash_human = '--------';
  var duty_color = '1f7ff4';
  var duty_BG =
    'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/souji.png';
  headers.forEach((r) => {
    if (r == daily) {
      if (rows[0][r]) {
        trash_day = rows[0][r];
      }
      if (rows[1][r]) {
        trash_human = rows[1][r];
      }
    }
  });
  if (trash_day.search('える') > -1) {
    duty_color = 'ff0f33';
    duty_BG =
      'https://storage.googleapis.com/line-chatbot-375411.appspot.com/weather-img/moeru.png';
  }

  // cleaning_dutty
  sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  rows = await sheet.getRows();
  headers = sheet.headerValues;
  var clean_day = 0;
  for (let i = 1; i < headers.length; i++) {
    var month_d = parseInt(headers[i].substring(0, headers[i].search('月')));
    var date_d = parseInt(
      headers[i].substring(headers[i].search('月') + 1, headers[i].search('日'))
    );
    if (month_d == 1 && month == 12) {
      var year_d = year + 1;
    } else {
      var year_d = year;
    }
    if (d - new Date(year_d, month_d - 1, date_d) < 0) {
      clean_day = i - 1;
      break;
    }
  }
  var clean = [];
  rows.forEach((e) => {
    var mess = {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: e[headers[0]],
          color: '#aaaaaa',
          size: 'sm',
          flex: 4,
          wrap: true,
        },
        {
          type: 'text',
          text: e[headers[clean_day]],
          wrap: true,
          color: '#666666',
          size: 'sm',
          flex: 5,
        },
      ],
    };
    clean.push(mess);
  });

  const message = {
    type: 'flex',
    altText: 'おはようございます',
    contents: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text:
                  year +
                  '年' +
                  month +
                  '月' +
                  date +
                  '日' +
                  '(' +
                  j_day[day] +
                  ')',
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
        {
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
        {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '当番',
                align: 'center',
                color: '#ffffff',
                weight: 'bold',
                size: 'xxl',
              },
            ],
            backgroundColor: '#' + duty_color,
          },
          hero: {
            type: 'image',
            url: duty_BG,
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
                text: trash_day,
                weight: 'bold',
                size: 'xl',
                color: '#bcb1b3',
              },
              {
                type: 'text',
                text: trash_human,
              },
              {
                type: 'text',
                text: '今週の掃除当番',
                weight: 'bold',
                size: 'xl',
                margin: 'xxl',
                color: '#034596',
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'lg',
                spacing: 'sm',
                contents: clean,
              },
            ],
          },
          styles: {
            header: {
              separator: true,
            },
          },
        },
      ],
    },
  };
  client
    .pushMessage(process.env.JACK_GROUP_ID, message)
    .then(() => {})
    .catch((err) => {
      console.log(err);
    });
}
