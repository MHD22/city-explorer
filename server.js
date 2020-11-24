
'use strict';

//App dependencies:
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pg = require('pg');

//App setup:
const superagent = require('superagent');
const server = express();
server.use(cors());
const PORT =process.env.PORT || 3500;
const client = new pg.Client(process.env.DATABASE_URL);

//Routes
server.get('/location',locationHandler);
server.get('/weather',weatherHandler);
server.get('/trails',trailHandler);

// handlers:
function locationHandler (req,res){

    let locationName = req.query.city;
    checkLocation(locationName).then((result)=>{
        console.log(result);
        if(result.length){
            res.json(result[0]);
        }
        else{
        getLocData(req,res,locationName)
        .then(data=>{ // return the current location object as it declared in the constuctor
            let SQL = `INSERT INTO locations VALUES ($1,$2,$3,$4)`;
            let safaValues = [
                data.search_query,
                data.formatted_query,
                data.latitude,
                data.longitude
            ];
            client.query(SQL,safaValues).then(()=>{
                console.log('location added successfully..');
                res.json(data);   
            }).catch((e)=>{errorHandler(e,req,res)});
        })
        .catch(()=>{errorHandler('Failed in the location handler',req,res)});}
            
            
    })
};

function weatherHandler(req,res){
    let locationName = req.query.search_query;
    getLocData(req,res,locationName)
    .then(data=>{
        let lat = data.latitude;
        let lon = data.longitude;
        let url =`https://api.weatherbit.io/v2.0/forecast/daily?key=${process.env.WEATHER_API_KEY}&lat=${lat}&lon=${lon}&days=8`;

        superagent.get(url)
        .then(wData=>{ // weather API response data
            let weatherArray= wData.body.data.map(element=> new Weather(element));
            res.json(weatherArray);
        })
        .catch(()=>{errorHandler("error inside superagent..loc data")})

    })
    .catch(()=>{errorHandler('error in the get location data ..')})
};

function trailHandler(req,res) {
    let locationName = req.query.search_query;
    getLocData(req,res,locationName)
    .then(data=>{
        let lat = data.latitude;
        let lon = data.longitude;
        console.log("befor fetching ...",lat,lon);
        let url =`https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=15&key=${process.env.TRAIL_API_KEY}`;

        superagent.get(url)
        .then(tData=>{
            // res.json(tData.body.trails);
            const trailsArray= tData.body.trails.map((obj)=>new Trail(obj));
            res.json(trailsArray);
        })
        .catch(()=>{errorHandler("error in the response of trails..")})
        
          
    })
    .catch(()=>{errorHandler("error in trailHandler..",req,res)});
};

// helper functions: 

function getLocData(req,res,locationName){
    
    let locKey = process.env.LOCATION_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${locKey}&q=${locationName}&format=json`;

    return superagent.get(url)
            .then(data => {
                
                let locationData = new Location(locationName, data.body);
                return(locationData);
            })
            .catch(() => {
                errorHandler('Location .. Something went wrong!! inside get loc data', req, res);
            });
}

function checkLocation (city) {
    let safeValue = [city];
    let SQL = `SELECT * FROM locations WHERE search_query = $1`;
    return client.query(SQL, safeValue)
    .then(result=>{
        return result.rows;
    });
}	


//constructors:
 function Weather(obj){
    this.forecast = obj.weather.description;
    this.time = obj.datetime;
   
 }

function Location(city,locData){
    this.search_query = city;
    this.formatted_query=locData[0].display_name;
    this.latitude = locData[0].lat;
    this.longitude = locData[0].lon;
}

function Trail(obj) {
    this.name =obj.name;
    this.location=obj.location;
    this.length=obj.length;
    this.stars=obj.stars;
    this.star_votes=obj.starVotes;
    this.summary=obj.summary;
    this.trail_url = obj.url;
    this.conditions=obj.conditionDetails;
    this.condition_date=obj.conditionDate.split(' ')[0];
    this.condition_time=obj.conditionDate.split(' ')[1];  
}



// handle all routes and errors
function anyRoute(req,res){
    res.status(404).send(" location Not found ")
};

function errorHandler(error,req,res){
    
    res.status(500).send(error);
};

server.get('*',anyRoute);
server.use(errorHandler);

client.connect().then(()=>{
    server.listen(PORT, ()=>{
      console.log('the server is lestining on port '+PORT);
    });

})
.catch(e=>console.log('error, conniction with db is failed--- ',e0));
