const WEATHER_ICONS = {
  0: "☀️",
  1: "🌤",
  2: "⛅",
  3: "☁️",
  45: "🌫",
  48: "🌫",
  51: "🌦",
  53: "🌦",
  55: "🌦",
  61: "🌧",
  63: "🌧",
  65: "🌧",
  71: "🌨",
  73: "🌨",
  75: "🌨",
  80: "🌦",
  81: "🌧",
  82: "⛈",
  95: "⛈",
  96: "⛈",
  99: "⛈",
};

const HOURS_TO_SHOW = 5;

const weatherFetch = fetch(
  "https://api.open-meteo.com/v1/forecast?latitude=46.5547&longitude=15.6459&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&timezone=Europe%2FLjubljana&forecast_days=2",
).then((res) => (res.ok ? res.json() : Promise.reject()));

const twilightFetch = fetch(
  "https://api.sunrise-sunset.org/json?lat=46.5547&lng=15.6459&date=today&formatted=0",
)
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then((data) => data.results)
  .catch(() => null);

function span(className, text) {
  const el = document.createElement("span");
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

Promise.all([weatherFetch, twilightFetch])
  .then(([{ current, hourly, daily }, twilight]) => {
    const nowEl = document.getElementById("weather-now");
    const hoursEl = document.getElementById("weather-hours");
    const sunEl = document.getElementById("weather-sun");
    if (!nowEl || !hoursEl || !sunEl) return;

    nowEl.replaceChildren(
      span("weather-now-icon", WEATHER_ICONS[current.weather_code] ?? "🌡"),
      span("weather-now-temp", `${Math.round(current.temperature_2m)}°C`),
    );

    const now = Date.now();
    const startIndex = hourly.time.findIndex(
      (t) => new Date(t).getTime() > now,
    );
    const from = startIndex === -1 ? 0 : startIndex;

    hoursEl.replaceChildren(
      ...hourly.time.slice(from, from + HOURS_TO_SHOW).map((time, i) => {
        const idx = from + i;
        const icon = WEATHER_ICONS[hourly.weather_code[idx]] ?? "🌡";
        const hour = new Date(time).toLocaleTimeString("en-GB", {
          timeZone: "Europe/Ljubljana",
          hour: "2-digit",
          minute: "2-digit",
        });
        const temp = Math.round(hourly.temperature_2m[idx]);

        const wrapper = document.createElement("div");
        wrapper.className = "weather-hour";
        wrapper.append(
          span("weather-hour-time", hour),
          span("weather-hour-icon", icon),
          span("weather-hour-temp", `${temp}°`),
        );
        return wrapper;
      }),
    );

    const formatSunTime = (iso) =>
      new Date(iso).toLocaleTimeString("en-GB", {
        timeZone: "Europe/Ljubljana",
        hour: "2-digit",
        minute: "2-digit",
      });

    const left = document.createElement("div");
    left.className = "weather-sun-group weather-sun-left";
    if (twilight) {
      left.appendChild(
        span(null, `Dawn ${formatSunTime(twilight.civil_twilight_begin)}`),
      );
    }
    left.appendChild(span(null, `Sunrise ${formatSunTime(daily.sunrise[0])}`));

    const right = document.createElement("div");
    right.className = "weather-sun-group weather-sun-right";
    right.appendChild(span(null, `Sunset ${formatSunTime(daily.sunset[0])}`));
    if (twilight) {
      right.appendChild(
        span(null, `Dusk ${formatSunTime(twilight.civil_twilight_end)}`),
      );
    }

    const labels = document.createElement("div");
    labels.className = "weather-sun-labels";
    labels.append(left, right);

    sunEl.replaceChildren(labels);
  })
  .catch(() => {});
