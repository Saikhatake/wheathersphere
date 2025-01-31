import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './App.css';

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const apikey = "feff206daa60b539abe8fae8f2ab7f29";

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const url = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apikey}`;

        fetchWeatherData(url);
      });
    }
  }, []);

  const fetchWeatherData = async (url) => {
    try {
      const response = await axios.get(url);
      const data = response.data;
      setWeatherData(data);
      weatherReport(data);
      saveWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const searchByCity = async () => {
    try {
      const urlsearch = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
      const response = await axios.get(urlsearch);
      const data = response.data;
      setWeatherData(data);
      weatherReport(data);
      saveWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
    setCity('');
  };

  const saveWeatherData = async (data) => {
    try {
      const response = await axios.post('http://localhost:5000/api/weather', {
        city: data.name,
        country: data.sys.country,
        temperature: Math.floor(data.main.temp - 273),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        pressure: data.main.pressure,
      });
      console.log('Weather data saved to database:', response.data);
    } catch (error) {
      console.error('Error saving weather data to database:', error);
    }
  };

  const weatherReport = async (data) => {
    const urlcast = `http://api.openweathermap.org/data/2.5/forecast?q=${data.name}&appid=${apikey}`;
    try {
      const response = await axios.get(urlcast);
      const forecast = response.data;
      setForecastData(forecast);
      hourForecast(forecast);
      dayForecast(forecast);

      document.getElementById('city').innerText = `${data.name}, ${data.sys.country}`;
      document.getElementById('temperature').innerText = `${Math.floor(data.main.temp - 273)} °C`;
      document.getElementById('clouds').innerText = data.weather[0].description;

      // New weather components
      document.getElementById('humidity').innerText = `${data.main.humidity}%`;
      document.getElementById('wind-speed').innerText = `${data.wind.speed} m/s`;
      document.getElementById('pressure').innerText = `${data.main.pressure} hPa`;

      let icon1 = data.weather[0].icon;
      let iconurl = `http://api.openweathermap.org/img/w/${icon1}.png`;
      document.getElementById('img').src = iconurl;

      displayLocalTime(data.dt, data.timezone);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    }
  };

  const displayLocalTime = (timestamp, timezoneOffset) => {
    const localTime = dayjs.utc(timestamp * 1000).timezone(timezoneOffset);
    const formattedTime = localTime.format('dddd, MMMM D, YYYY [at] h:mm:ss A');
    document.getElementById('local-time').innerText = formattedTime;
  };

  const hourForecast = (forecast) => {
    document.querySelector('.templist').innerHTML = '';
    for (let i = 0; i < 5; i++) {
      let date = new Date(forecast.list[i].dt * 1000);
      let hourR = document.createElement('div');
      hourR.setAttribute('class', 'next');

      let div = document.createElement('div');
      let time = document.createElement('p');
      time.setAttribute('class', 'time');
      time.innerText = date.toLocaleTimeString(undefined, 'Asia/Kolkata').replace(':00', '');

      let temp = document.createElement('p');
      temp.innerText = `${Math.floor(forecast.list[i].main.temp_max - 273)} °C / ${Math.floor(forecast.list[i].main.temp_min - 273)} °C`;

      div.appendChild(time);
      div.appendChild(temp);

      let desc = document.createElement('p');
      desc.setAttribute('class', 'desc');
      desc.innerText = forecast.list[i].weather[0].description;

      hourR.appendChild(div);
      hourR.appendChild(desc);
      document.querySelector('.templist').appendChild(hourR);
    }
  };

  const dayForecast = (forecast) => {
    document.querySelector('.weekF').innerHTML = '';
    for (let i = 8; i < forecast.list.length; i += 8) {
      let div = document.createElement('div');
      div.setAttribute('class', 'dayF');

      let day = document.createElement('p');
      day.setAttribute('class', 'date');
      day.innerText = new Date(forecast.list[i].dt * 1000).toDateString(undefined, 'Asia/Kolkata');
      div.appendChild(day);

      let temp = document.createElement('p');
      temp.innerText = `${Math.floor(forecast.list[i].main.temp_max - 273)} °C / ${Math.floor(forecast.list[i].main.temp_min - 273)} °C`;
      div.appendChild(temp);

      let description = document.createElement('p');
      description.setAttribute('class', 'desc');
      description.innerText = forecast.list[i].weather[0].description;
      div.appendChild(description);

      document.querySelector('.weekF').appendChild(div);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchByCity(); // Trigger searchByCity function when Enter key is pressed
    }
  };

  return (
    <div>
      <div className="header">
        <h1>WeatherSphere</h1>
        <div>
          <input
            id="city-input"
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress} // Add the onKeyPress handler here
          />
          <button id="search" onClick={searchByCity}>Search</button>
        </div>
      </div>

      <main>
        <div className="weather">
          <h2 id="city">Delhi, IN</h2>
          <div className="temp-box">
            <img src="/weathericon.png" alt="" id="img" />
            <p id="temperature">26 °C</p>
          </div>
          <span id="clouds">Broken Clouds</span>
          <p id="local-time">Time will be shown here</p>

          {/* New Weather Details */}
          <div className="weather-details">
            <p><strong>Humidity:</strong> <span id="humidity">--</span></p>
            <p><strong>Wind Speed:</strong> <span id="wind-speed">--</span></p>
            <p><strong>Pressure:</strong> <span id="pressure">--</span></p>
          </div>
        </div>

        {/* Divider */}
        <div className="divider1"></div>

        {/* Upcoming forecast */}
        <div className="forecstH">
          <p className="cast-header">Upcoming forecast</p>
          <div className="templist"></div>
        </div>

        {/* Next 4 days forecast */}
        <div className="forecstD">
          <p className="cast-header">Next 4 days forecast</p>
          <div className="weekF"></div>
        </div>
      </main>
    </div>
  );
}

export default App;
