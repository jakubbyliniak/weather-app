import {elements} from './el';
import Chart from 'chart.js';

/**
 * TODO
 * - add loading spinner during api fetching
 * - imporve code organization - move some code to dedicated functions
 * - move needed functions to dedicated componens
 * 
 */


window.addEventListener('load', () => {
    let long;
    let lat;
    const defaultScale = "C";
    const skycons = new Skycons({color: "white"});
    
    showChart();
    if(navigator.geolocation){
        // Allowed to use localization
        navigator.geolocation.getCurrentPosition(
            position => {
            lat = position.coords.latitude;
            long = position.coords.longitude;
            getWeatherData(lat,long);

        }, error =>{
            if (error.code === 1){
                // Use localization rejected;
                diplayFormAndFindLocation()             

            } else if (error.code === 2) {
                // Localization not found
                // Add scenrario if needed
            } else if (error.code === 3){
                // runtime error
                // Add scenario if needed
            }
        });  

    } else {
        // goelocation not supported by browser
        diplayFormAndFindLocation();     
    
    }

    function diplayFormAndFindLocation(){
        // display search form
        elements.searchLocation.style.visibility = 'visible';
        elements.searchLocation.addEventListener('submit', (e) =>{
        e.preventDefault();
        const input = elements.inputField.value;
        // find coordinates based on inputed value
        findCoordinates(input);
        });
    }

    function getWeatherData(lat, long){
        //gets weather data from darksky API
            const proxy = `https://cors-anywhere.herokuapp.com/`;
            const api = `${proxy}https://api.darksky.net/forecast/4345273fe79a1cb9bfbc069cc3179afd/${lat},${long}`;

            fetch(api)
            .then(response => {
                return response.json();
            })
            .then(data => {
                const {temperature, icon} = data.currently;
                // set forecast data object
                const forecast = data.daily.data;
                // removes current day from forecast
                forecast.shift();

                // sets the current date object for given location
                let curDate = new Date().toLocaleString("en-US", {timeZone: data.timezone});
                curDate = new Date(curDate);
                
                // DISPLAY ACTIONS BELOW CAN BE MOVED TO DEDICATED FUNCTION
                // displays the current time 
                elements.timeSection.innerHTML = `${curDate.getHours()} : ${(curDate.getMinutes()<10? '0' : '') + curDate.getMinutes()   }`;
                // display current temperature in default scale 
                elements.temperatureDegree.textContent = tempCalc(temperature, defaultScale);

                // display timezone
                elements.locationTimezone.textContent = data.timezone;
                // display icon of current wateher
                setIcons(icon, document.querySelector('.icon'));

                // change temperature to celsius/Farenheit after click on current temeratre
                elements.temperatureSection.addEventListener('click', () => {
                    if (elements.temperatureSpan.textContent === "F"){
                        convertTemp('C');
                    } else {
                        convertTemp('F');
                    }
                })

                // maps forecast temperatures and calculates to default scale to display on chart
                const fTemps = forecast.map(item => {
                    let res = {}
                    res =  tempCalc(item.temperatureMax, defaultScale);
                    return res;
                });
                // displays forecst temperature chart
                showChart(fTemps);
                
                // display forecast 
                forecast.forEach(f => {
                    displayForecast(f); 
                                                   
                });


            });
    }

    // finds coordinates of the location given in the form
    function findCoordinates(query){
        // api setup
        const proxy = `https://cors-anywhere.herokuapp.com/`;
        const apikey = '1e1056f823c04cd7a21507f97bd991a9'
        const api = `${proxy}https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apikey}`;
        clearCurrent();
        fetch(api)
            .then(response=>{
                //might not be needed if a response comes as json
                return response.json();
            })
            .then(data => {
                const coords = {
                    lat: data.results[0].geometry.lat,
                    lng: data.results[0].geometry.lng
                }
                getWeatherData(coords.lat, coords.lng)
                //return coords;
            });
    }

    // calculates the temperature to given format
    function tempCalc(temp, format){
        if (format === 'C'){
            return Math.ceil((temp - 32)*(5/9));
        } else {
            return Math.floor((temp * 1.8)+32);
        }
    }

    // redisplays temps after scale change
    function convertTemp(format){
        let temps = document.querySelectorAll('.temperature-degree');
        let places = document.querySelectorAll('.degree-type');
        //console.log(temps, format);
        // recalculate and replace temps
        temps.forEach(e =>{
            let t = parseInt(e.textContent);
            e.textContent = tempCalc(t,format);
        })
        // change scale character C/F
        places.forEach(e => {
            e.textContent = format;
        })
    }

    // sets icons
    function  setIcons(icon, iconID){        
        const currentIcon = icon.replace(/-/g,"_").toUpperCase();
        skycons.play();
        return skycons.set(iconID, Skycons[currentIcon]);
    }

    // clear icons - not needed in current build, left in case of future needs
    function clearIcon(container){
        const skycons = new Skycons();
        skycons.remove(container);
    }

    // clear current weather data - needed in case of inputing other query
    function clearCurrent(){        
        elements.temperatureDegree.textContent = "";
        elements.timeSection.innerHTML = "";
        elements.temperatureDegree.textContent = "";
        elements.locationTimezone.textContent = "";
        clearForecast();
    }

    // clear current forecast data - needed in case of inputing other query
    function clearForecast(){
        elements.forecast.innerHTML = "";
    }

    // display forecast data
    function displayForecast(item){

        // set the days names - needed for polish days and months name
        const days = ['Niedziela',
                      'Poniedziałek',
                      'Wtorek',
                      'Środa',
                      'Czwartek',
                      'Piątek',
                      'Sobota'];

        const months = ['Styczeń', 
                        'Luty', 
                        'Marzec', 
                        'Kwiecień', 
                        'Maj', 
                        'Czerwiec', 
                        'Lipiec', 
                        'Sierpień', 
                        'Wrzesień', 
                        'Październik',
                        'Listopad',
                        'Grudzień']
        // create new date object
        let day = new Date().toLocaleString("en-US", {timeZone: item.timezone});
        day = new Date(day);

        // convert unix date object to standard day number
        day.setTime(item.time*1000);

        // set markup
        const markup = `
            <div class="forecast-daily">
                <div class="forecast__element forecast__day">${days[ day.getDay() ]}</div>
                <div class="forecast__element forecast__date">${day.getDate()} ${months[ day.getMonth() ]}</div>
                <div class="forecast__element forecast__maxtemp temp-section"><h2 class="temperature-degree">${tempCalc(item.temperatureMax, defaultScale)}</h2><span>&#176</span><span class="degree-type">C</span></div>
                
                <div class="forecast__element forecast__icon">
                    <canvas id="icon-${item.time}" width="40" height="40"></canvas>
                </div>
                
            </div>
        `
        // sets the container
        const cont = elements.forecast;
        //display forecast
        cont.insertAdjacentHTML("beforeend", markup);
        // initiate icons in right containers
        setIcons(item.icon, document.querySelector(`#icon-${item.time}`));
    };

    // displays chart
    function showChart(data){
        
        var ctx = document.getElementById('myChart');
        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                // labels to be corrected, currently are static, have to be taken from forecast object
                labels: ['środa', 'czwartek', 'piątek', 'sobota', 'niedziela', 'poniedziałek', 'wtorek'],
                datasets: [{
                    label: 'Temperatury',
                    data: data,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)'
                        
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)'
                    
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    }
});

