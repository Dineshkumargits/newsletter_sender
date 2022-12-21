require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const axios = require("axios");
const express = require("express");
const SENDGRID_API = process.env.SENDGRID_API;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/send_newsletter", async (req, res) => {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const query = "general";
  axios
    .get(
      `https://newsapi.org/v2/everything?q=${query}&from=${todayString}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`,
      {
        headers: {
          "Accept-Encoding": "application/json",
        },
      }
    )
    .then(async (response) => {
      const news = [];
      const limit = 10;
      if (response.data.articles.length > limit) {
        for (let i = 0; i < limit; i++) {
          news.push({
            image_uri: response.data.articles[i].urlToImage,
            news_url: response.data.articles[i].url,
            news_headline: response.data.articles[i].title,
            description: response.data.articles[i].description,
            author: response.data.articles[i].author,
          });
        }
        const personalizations = [
          {
            to: TO_EMAIL,
            dynamicTemplateData: {
              subject: "Latest news",
              general_headline: response.data.articles[5].title,
              news: news,
            },
          },
        ];
        /*
        With Multiple Emails
        const common_data = {
          dynamicTemplateData: {
            subject: "Latest news",
            general_headline: response.data.articles[5].title,
            news: news,
          },
        };
        const personalizations = [
          {
            to: "first@email.com",
            ...common_data,
          },
          {
            to: "second@email.com",
            ...common_data,
          },
          {
            to: "etc@email.com",
            ...common_data,
          },
        ];
        */

        const templateId = "d-b16d145889df465e80630808740b6a5c"; // <-- Your template id from sendgrid
        sgMail.setApiKey(SENDGRID_API);

        const data = {
          from: {
            email: FROM_EMAIL,
          },
          templateId: templateId,
          personalizations: personalizations,
        };
        await sgMail.sendMultiple(data, (error, result) => {
          if (error) {
            console.log(JSON.stringify(error));
          }
          if (result) {
            console.log(result);
          }
        });
        res.send("Newsletter email sent");
      } else {
        req.send("There are no enough articles to send mail");
      }
    })
    .catch((err) => {
      console.log("er", err);
      res.send("Something went wrong");
    });
});
