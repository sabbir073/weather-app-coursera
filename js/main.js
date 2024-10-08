document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    const loadingText = document.getElementById('loading');
    const weatherInfo = document.getElementById('weather-info');

    // Fetch and parse CSV
    fetch('city_coordinates.csv')
        .then(response => response.text())
        .then(csvText => {
            const cities = parseCSV(csvText);
            populateCityDropdown(cities);
        })
        .catch(error => {
            console.error("Error fetching the CSV file", error);
        });

    // Parse CSV data
    function parseCSV(data) {
        const lines = data.trim().split('\n');
        const cities = [];

        for (let i = 1; i < lines.length; i++) {  // Skip header
            const [latitude, longitude, city, country] = lines[i].split(',');
            cities.push({ lat: latitude, lon: longitude, city, country });
        }

        return cities;
    }

    // Populate select box with cities
    function populateCityDropdown(cities) {
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = `${city.lat},${city.lon}`;
            option.textContent = `${city.city}, ${city.country}`;
            citySelect.appendChild(option);
        });
    }

    // Event listener for city selection
    citySelect.addEventListener('change', async () => {
        const [lat, lon] = citySelect.value.split(',');
        loadingText.classList.remove('hidden');
        weatherInfo.innerHTML = '';
    
        try {
            const apiUrl = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`;
            console.log('Fetching weather data from URL:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('API Response:', data); // Log the full API response
    
            if (data.dataseries && Array.isArray(data.dataseries)) {
                displayWeather(data.dataseries, data.init);  // Pass init time for date calculation
            } else {
                throw new Error('Invalid data structure: dataseries missing or not an array.');
            }
        } catch (error) {
            console.error("Error fetching weather data:", error);
            weatherInfo.innerHTML = `<p class="text-red-500">Error fetching weather data. Please try again.</p>`;
        } finally {
            loadingText.classList.add('hidden');
        }
    });
    
    // Map weather conditions from the API to human-readable names and image file names
    const weatherImageMap = {
        clearday: { img: 'clear.png', text: 'Clear Day' },
        clearnight: { img: 'clear.png', text: 'Clear Night' },
        cloudyday: { img: 'cloudy.png', text: 'Cloudy Day' },
        cloudynight: { img: 'cloudy.png', text: 'Cloudy Night' },
        mcloudyday: { img: 'mcloudy.png', text: 'Mostly Cloudy Day' },
        mcloudynight: { img: 'mcloudy.png', text: 'Mostly Cloudy Night' },
        pcloudyday: { img: 'pcloudy.png', text: 'Partly Cloudy Day' },
        pcloudynight: { img: 'pcloudy.png', text: 'Partly Cloudy Night' },
        lightrain: { img: 'lightrain.png', text: 'Light Rain' },
        lightrainnight: { img: 'lightrain.png', text: 'Light Rain Night' }, // New addition
        lightrainday: { img: 'lightrain.png', text: 'Light Rain Night' },
        lightsnow: { img: 'lightsnow.png', text: 'Light Snow' },
        rain: { img: 'rain.png', text: 'Rainy' },
        snow: { img: 'snow.png', text: 'Snowy' },
        tsrain: { img: 'tsrain.png', text: 'Thunderstorm Rain' },
        tstorm: { img: 'tstorm.png', text: 'Thunderstorm' },
        windy: { img: 'windy.png', text: 'Windy' },
        oshowerday: { img: 'oshower.png', text: 'Occasional Showers Day' }, // New addition
        oshowernight: { img: 'oshower.png', text: 'Occasional Showers Day' },
        ishowerday: { img: 'ishower.png', text: 'Isolated Showers Day' },   // New addition
        ishowernight: { img: 'ishower.png', text: 'Isolated Showers Night' }, // New addition
    };

    // Display weather data for 7 days
    // Display weather data for 7 distinct days
function displayWeather(weatherData, initTime) {
    weatherInfo.innerHTML = ''; // Clear previous weather data

    // Parse the init time into a Date object
    const year = parseInt(initTime.slice(0, 4), 10);
    const month = parseInt(initTime.slice(4, 6), 10) - 1;  // JS months are 0-indexed
    const day = parseInt(initTime.slice(6, 8), 10);
    const hour = parseInt(initTime.slice(8, 10), 10);

    const initDate = new Date(year, month, day, hour);
    let displayedDays = 0;
    let previousDate = null;

    weatherData.forEach(day => {
        if (displayedDays >= 7) return;  // Limit to 7 days

        const timepointHours = day.timepoint;  // timepoint is in hours
        const forecastDate = new Date(initDate);
        forecastDate.setHours(forecastDate.getHours() + timepointHours);  // Add the timepoint hours to initDate

        // Check if we are moving to a new day
        const currentDate = forecastDate.toDateString();
        if (currentDate !== previousDate) {
            previousDate = currentDate;
            displayedDays += 1;

            const weatherType = day.weather || 'unknown';
            const weatherDetails = weatherImageMap[weatherType] || { img: 'default.png', text: 'Unknown' };  // Use mapped image and text or fallback

            const temp = day.temp2m || 'N/A';

            const dayName = forecastDate.toLocaleString('en-US', { weekday: 'long' });
            const readableDate = forecastDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

            const weatherCard = `
                <div class="bg-white p-6 rounded-lg shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
                    <h3 class="font-bold text-xl mb-2">${dayName}, ${readableDate}</h3>
                    <img src="https://sabbir073.github.io/weather-app-coursera/images/${weatherDetails.img}" alt="${weatherType}" class="mx-auto mb-4 w-20 h-20 object-contain" />
                    <p class="text-lg font-semibold mb-1">${weatherDetails.text}</p>
                    <p class="text-gray-700">Temp: ${temp}°C</p>
                </div>
            `;

            weatherInfo.innerHTML += weatherCard; // Append the new weather card to the grid
        }
    });
}

});
