const apiKey = "2909fb0e6e7e830543aa4ac998edd7d5"; // Replace with your OpenWeatherMap key

function getWeatherByCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return alert("Please enter a city name");
  fetchWeather(`q=${city}`);
}

function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      // ✅ Clear city input when using current location
      document.getElementById("cityInput").value = "";

      fetchWeather(`lat=${latitude}&lon=${longitude}`);
    });
  } else {
    alert("Geolocation not supported.");
  }
}

function fetchWeather(query) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?${query}&units=metric&appid=${apiKey}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data.city || !data.list) {
        alert("Weather data not found.");
        return;
      }

      document.getElementById("weatherCard").classList.remove("hidden");

      const today = new Date().toISOString().split("T")[0];
      const todayData = data.list.filter((item) =>
        item.dt_txt.startsWith(today)
      );

      const avgTemp = (
        todayData.reduce((sum, item) => sum + item.main.temp, 0) /
        todayData.length
      ).toFixed(1);

      document.getElementById("locationName").innerText = data.city.name;
      document.getElementById("currentTemp").innerText =
        `Current: ${data.list[0].main.temp.toFixed(1)} °C`;
      document.getElementById("avgTemp").innerText =
        `Avg Temp Today: ${avgTemp} °C`;

      const forecastHTML = todayData
        .map(
          (item) =>
            `<div>
              <strong>${item.dt_txt.split(" ")[1].slice(0, 5)}</strong>
              <p>${item.main.temp.toFixed(1)} °C</p>
            </div>`
        )
        .join("");

      document.getElementById("forecast").innerHTML = forecastHTML;

      suggestOutfit(avgTemp);
    })
    .catch((err) => {
      console.error("Error fetching weather:", err);
      alert("Something went wrong fetching weather data.");
    });
}

function suggestOutfit(temp) {
  let msg = "";
  temp = parseFloat(temp);

  if (temp <= 10) msg = "Wear a heavy jacket and layers 🧥🧤";
  else if (temp <= 20) msg = "Wear a hoodie or light sweater 👕";
  else if (temp <= 30) msg = "T-shirt weather! 😎";
  else msg = "Very hot! Wear light clothes and stay hydrated 🥵";

  document.getElementById("outfitSuggestion").innerHTML = `
    <h3>👗 Outfit Suggestion</h3>
    <p>${msg}</p>
  `;
}
document.getElementById("wardrobeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("itemName").value;
  const type = document.getElementById("itemType").value;
  const warmth = parseInt(document.getElementById("warmth").value);

  const newItem = { name, type, warmth };
  const wardrobe = JSON.parse(localStorage.getItem("wardrobe")) || [];
  wardrobe.push(newItem);
  localStorage.setItem("wardrobe", JSON.stringify(wardrobe));

  document.getElementById("itemName").value = "";
  document.getElementById("warmth").value = "";

  displayWardrobe();
});

function displayWardrobe() {
  const wardrobe = JSON.parse(localStorage.getItem("wardrobe")) || [];
  const list = document.getElementById("wardrobeList");
  list.innerHTML = "";

  wardrobe.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} (${item.type}, warmth: ${item.warmth})
      <button onclick="deleteItem(${index})" style="float:right; background:red; color:white; border:none; border-radius:5px; padding:2px 8px; cursor:pointer;">❌</button>`;
    list.appendChild(li);
  });
}
function deleteItem(index) {
  let wardrobe = JSON.parse(localStorage.getItem("wardrobe")) || [];
  wardrobe.splice(index, 1); // Remove 1 item at given index
  localStorage.setItem("wardrobe", JSON.stringify(wardrobe));
  displayWardrobe(); // Refresh the list
}


function suggestOutfit(temp) {
  let msg = "";
  let level = 0;
  temp = parseFloat(temp);

  if (temp <= 10) {
    msg = "Wear a heavy jacket and layers 🧥🧤";
    level = 4;
  } else if (temp <= 20) {
    msg = "Wear a hoodie or light sweater 👕";
    level = 3;
  } else if (temp <= 30) {
    msg = "T-shirt weather! 😎";
    level = 2;
  } else {
    msg = "Very hot! Wear light clothes and stay hydrated 🥵";
    level = 1;
  }

  const wardrobe = JSON.parse(localStorage.getItem("wardrobe")) || [];
  const match = wardrobe.filter((item) => item.warmth <= level + 1 && item.warmth >= level);

  const matchHTML = match.length
    ? match.map((item) => `<li>${item.name} (${item.type})</li>`).join("")
    : "<li>No matching outfit found in wardrobe 😢</li>";

  document.getElementById("outfitSuggestion").innerHTML = `
    <h3>👗 Outfit Suggestion</h3>
    <p>${msg}</p>
    <ul>${matchHTML}</ul>
  `;
}

// Call on page load to show saved wardrobe
displayWardrobe();

async function getAIOutfitSuggestion(city, temp, condition, humidity) {
  const prompt = `You are a fashion stylist. Give an outfit recommendation for someone in ${city} where the temperature is ${temp}°C, weather condition is "${condition}", and humidity is ${humidity}%. The outfit should be comfortable, practical, and stylish.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}` // or leave it empty if not using right now

    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    })
  });

  const data = await response.json();
  const aiText = data.choices?.[0]?.message?.content || "No suggestion found.";
  document.getElementById("aiSuggestionText").textContent = aiText;
}
document.getElementById("selfieInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = function (event) {
    img.src = event.target.result;
  };

  img.onload = function () {
    const canvas = document.getElementById("selfieCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Sample center area
    const imageData = ctx.getImageData(
      img.width / 2 - 10,
      img.height / 2 - 10,
      20,
      20
    ).data;

    let r = 0, g = 0, b = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      r += imageData[i];
      g += imageData[i + 1];
      b += imageData[i + 2];
    }

    const pixelCount = imageData.length / 4;
    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    const skinTone = getSkinToneCategory(r, g, b);
    const weather = document.getElementById("locationName").textContent
      ? document.getElementById("forecast").textContent.toLowerCase()
      : "";

    const suggestion = getColorSuggestion(skinTone, weather);
    document.getElementById("colorSuggestion").innerText = suggestion;
  };

  reader.readAsDataURL(file);
});

function getSkinToneCategory(r, g, b) {
  const avg = (r + g + b) / 3;
  if (avg < 100) return "deep";
  if (avg < 170) return "medium";
  return "light";
}

function getColorSuggestion(skinTone, weatherText) {
  let colors = "";

  if (skinTone === "deep") colors += "Gold, burnt orange, rich plum";
  else if (skinTone === "medium") colors += "Olive, mustard, coral";
  else colors += "Beige, sky blue, rose pink";

  if (weatherText.includes("rain") || weatherText.includes("cloud")) {
    return `🌥 It's cloudy – ${colors} will pop today!`;
  } else if (weatherText.includes("sun")) {
    return `☀️ Sunny day – Try wearing ${colors} for a radiant look!`;
  } else {
    return `👕 Based on your tone, try: ${colors}`;
  }
}

