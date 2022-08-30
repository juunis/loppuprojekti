let endpoint =
  "https://f1o1zfeje5.execute-api.us-east-1.amazonaws.com/test2/test";

let news = document.querySelector(".quoteDetails");

fetch(endpoint)
  .then(function (response) {
    return response.json();

    //console.log(endpoint);
  })

  .then(function (jsonData) {
    news.textContent = JSON.stringify(jsonData.body);
  });
