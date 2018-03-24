import { observable, autorun } from 'mobx'
import { GoogleAnalyticsTracker } from 'react-native-google-analytics-bridge'
import { Actions } from 'react-native-mobx'
import { firebaseApp } from '../firebase'
import { hour, Planter } from '../planterconfig'

class AppStore {
  
  // user info
  @observable username = '';
  @observable user = {};

  // planters
  @observable planters = [];
  @observable user_level = 0;
  @observable gold = 0;
  @observable user_inventory = {};
  @observable level_points = 0;
  @observable user_long = "";
  @observable user_lat = "";
  @observable weather = [0, 'sunny'];
  @observable weatherPic = 'default';
  @observable stats = {grown: 0, killed: 0};
  @observable idealWeather = { 0: false, 1: false, 2: false, 3: false};
  @observable levelPercentage = 1;
  @observable mute = false;
  @observable allSounds = {};


  fetchWeather(userRef) {
    const timeNow = new Date().getTime();
    userRef.child('weatherCheckTime').once('value')
      .then(snapshot => snapshot.val())
      .then(weatherCheckTime => {
        if (timeNow - weatherCheckTime.time >= 3600000) {
          fetch('https://api.darksky.net/forecast/' + process.env.WEATHER_KEY + '/' + this.user_lat  + ',' + this.user_long).then((response) => response.json()).then((res) => {
            let summary = res.hourly.summary
            // let weekly = [[res.daily.data[0].icon, Math.floor(res.daily.data[0].temperatureMax)], [res.daily.data[1].icon, Math.floor(res.daily.data[1].temperatureMax)], [res.daily.data[2].icon, Math.floor(res.daily.data[2].temperatureMax)]]
            this.weather = {temp: res.currently.temperature, sun: res.currently.summary.toLowerCase().split(' ').join('')} // , forecast: {summary, weekly}}
            userRef.child('weatherCheckTime').update({time: timeNow});
            userRef.child('weather').update({temp: this.weather.temp, sun: this.weather.sun});
          })
          .catch(err => {
            this.weather = {temp: 50, sun: 'sunny'}
          });
        } else {
          userRef.child('weather').once('value')
            .then(snapshot => snapshot.val())
            .then(weather => {
              this.weather = weather;
            })
        }
      })
      .catch(err => {
        this.weather = {temp: 50, sun: 'sunny'}
      })
  }

  calculatePlantStage = (plantId, userRef) => {
    let today = new Date();
    let timeNow = today.getTime();
    let newStage = 1;
    let oldStage;
    let weatherCheckNum; 
    userRef.child('planters').child(plantId).child('currentPlant').once('value')
      .then(snapshot => snapshot.val())
      .then(plant => {
          oldStage = plant.stage;
          weatherCheckNum = plant.weatherCheck || 0;
          let plantNotWatered = plant.watered < 1;
          let pastWateringWindow = timeNow >= plant.survival; 
  
        if(plant && pastWateringWindow && plantNotWatered) return [plant, false];
        else return [plant, true];
      })
      .then(result => {

        let plant = result[0];
        let watered = result[1];
        let times = plant.stage_times;
    
        if(plant.stage === 5 && watered) newStage = 5
        else if(watered === false || plant.stage === "dead") newStage = "dead"
        else if(plant.stage < 5) newStage = times && times.reduce((level, time) => { 
            if(timeNow >= time) return level + 1 
            else return level
        }, 0)
        return !!(plant.name && newStage) 
      })
      .then(passedStageUpReqs => {
        if (passedStageUpReqs) this.stageUpPlant(userRef, plantId, newStage, oldStage, weatherCheckNum)
      })
      .catch(console.error)
  }

  stageUpPlant = (userRef, plantId, newStage, oldStage, weatherCheckNum) => {

    let today = new Date();
    let timeNow = today.getTime();
    let newSurvival = timeNow + (hour * 24);
    let change = newStage > oldStage ? 0 : weatherCheckNum;
    let newlyKilled = newStage === 'dead' && newStage !== oldStage ? true : false;
    
    if (newlyKilled) this.upKillStat(userRef);
    if (newStage !== oldStage){
      userRef.child('planters').child(plantId).child('currentPlant').update({survival: newSurvival, stage: newStage, weatherCheck: change})
    } else {
      userRef.child('planters').child(plantId).child('currentPlant').update({stage: newStage, weatherCheck: change})
    }
  }

  upKillStat = (userRef) => {
    userRef.child('stats').once('value')
    .then(snapshot => snapshot.val())
    .then(stats => {
      // updated to update profile view
      this.stats.killed = this.stats.killed + 1;
      let newStats = stats;
      let killCount = stats.killed + 1;
      newStats.killed = killCount;
      userRef.update({stats: newStats});
    })
    .catch(console.error);
  }

  checkWeatherAgainstPlants = (planterId, userRef, currWeather) => {

    let conditionsMet = 0
   
    userRef.child('planters').child(planterId).once('value')
      .then(res => res.val())
      .then(planter => planter.currentPlant)
      .then(plant => {
        if (plant.name && plant.stage < 5) {
          // 
          this.idealWeather[planterId] = 'none!';
          let currTemp = currWeather.temp
          let high = plant.high
          let low = plant.low
          let compareSun = plant.best_sun.replace(' ', '');
          let currArr = currWeather.sun.split(' ');

          if(currTemp >= low && currTemp <= high) conditionsMet++;
          if(currArr.includes(compareSun)) conditionsMet++;
        }
        return [conditionsMet, plant, currWeather.sun]
        })
        .then(data => {
          let conditionsMet = data[0];
          if (conditionsMet === 1) {
            this.idealWeather[planterId] = true;
            if(!data[1].weatherCheck || data[1].weatherCheck == null || data[1].weatherCheck === undefined) {
              return this.conditionOne(planterId, userRef)
            }
          }
          else if (conditionsMet === 2) {
            this.idealWeather[planterId] = true;
            if(!data[1].weatherCheck || data[1].weatherCheck == null || data[1].weatherCheck === undefined) {
              return this.conditionTwo(planterId, userRef)
            }
          } 
          else {
            this.idealWeather[planterId] = 'false';
          }
        })
        .catch(console.error)
  }

  conditionOne = (planterId, userRef) => {
    let planterRef = userRef.child('planters').child(planterId)
    planterRef.once('value')
      .then(res => res.val())
      .then(planter => planter.currentPlant)
      .then(plant => {

        let stage = plant.stage - 1;
        let copy = [...plant.stage_times];
        let diff = copy[1] - copy[0];
        let newStageTimes = [];

        copy.forEach((time, i) => {
          if(i < stage) newStageTimes.push(time)
          else if (i === stage) newStageTimes.push(time - (hour * plant.stage))
          else if(i > stage) newStageTimes.push(newStageTimes[i-1] + diff)
        });
        // view will display optimal weather
        let updatedPlant = Object.assign({}, plant, {stage_times: newStageTimes, weatherCheck: 1});
        planterRef.update({currentPlant: updatedPlant});
      })
      .catch(console.error)
  }

  conditionTwo = (planterId, userRef) => {
    let planterRef = userRef.child('planters').child(planterId);
    planterRef.once('value')
      .then(res => res.val())
      .then(planter => planter.currentPlant)
      .then(plant => {
        let updatedPlant = Object.assign({}, plant, {watered: 1, stage: plant.stage + 1, weatherCheck: 1});
        planterRef.update({currentPlant: updatedPlant})
      })
      .catch(console.error)
  }

  checkUserLevel = (userRef) => {
    userRef.once('value')
      .then(res => res.val())
      .then(user => {
        let pts = user && user.level_points || 0;
        let lvl = this.getLvl(pts);
        this.levelPercentage = this.nextLvlPercent(pts, lvl);
        return lvl;
      })
      .then(level => userRef.update({user_level: level}))
      .catch(console.error)
  }

  getLvl = pts => Math.floor(3 * Math.log(pts) / Math.log(15));

  nextLvlPercent = (pts, lvl) => {
    let newLevel = 0;
    let nextLvlAmt = 0;
    let ptsUntilNext = 0;
    
    while (newLevel <= lvl) {
      newLevel = this.getLvl(nextLvlAmt);
      nextLvlAmt++;
    }
    
    return pts / nextLvlAmt || 1;
  }

  pluck = (planterId, userRef) => {
    let planterRef = userRef.child('planters').child(planterId)

    userRef.once('value')
      .then(res => res.val())
      .then(user => {
        // update usergold and remove plant
        let currentPlant = user.planters[planterId].currentPlant;
        let plantWorth = Number(currentPlant.sell_val);

        if(currentPlant.name !== 'name'){
          // updated to update profile view
          this.stats.grown = this.stats.grown + 1;
          this.checkUserLevel(userRef);
          let userPlants = Object.assign({}, user.stats.plants, {[currentPlant.name] : {name: currentPlant.name || '', amt: (user.stats.plants[currentPlant.name] ? user.stats.plants[currentPlant.name].amt : 0) + 1}})
          let newStats = Object.assign({}, user.stats, {grown: user.stats.grown + 1}, {plants: userPlants})
          userRef.update({stats: newStats, gold: user.gold + plantWorth, level_points: user.level_points + plantWorth})
          planterRef.update({hoed: false, currentPlant: new Planter(planterId)})
        }
      })
      .catch(console.error)
  }

}

const appStore = new AppStore()

export default appStore
