'use strict';
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const server = express();
server.use(cors());
const PORT =parseInt(process.env.PORT) || 3500;

server.get('/location', (req,res)=>{
   const locations = require('./data/location.json');
    const data = new Location('Lynnwood',locations);
    res.json(data);
});

server.get('/weather', (req,res)=>{
    const weatherData = require('./data/weather.json');
    weatherData.data.forEach(element=>{
        new Weather(element);
    });
    const copyWeather = [...weatherArray];
    weatherArray=[];
    res.json(copyWeather);

     
 });
 let weatherArray =[];
 function Weather(obj){
    this.forecast = obj.weather.description;
    this.time = obj.datetime;
    weatherArray.push(this);
 }





function Location(city,locData){
    this.search_query = city;
    this.formatted_query=locData[0].display_name;
    this.latitude = locData[0].lat;
    this.longitude = locData[0].lon;
}

server.get('*',(req,res)=>{
    res.status(404).send(" location Not found ")
});

server.use((error,req,res)=>{
    
    res.status(500).send(error);
})


server.listen(PORT, ()=>{
  console.log('the server is lestining on port '+PORT);
});
