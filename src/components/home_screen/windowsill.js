import React, { Component } from 'react'
const Sound = require('react-native-sound');
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ListView,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  Alert,
  Dimensions,
  InteractionManager,
} from 'react-native';
// backgrounds:
import BackgroundImage from '../../views/background'
import SingleBackgroundImage from '../../views/single_background'
// all pictures
const pix = require("../../assets/images/plantpicturecollection"); 

import Icon from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share'
import { Actions } from 'react-native-mobx'
import _ from 'lodash'
import { observer,inject } from 'mobx-react/native'
import { getColor } from '../config'
import { firebaseApp } from '../../firebase'
import { createStageArr, decreaseInventory, newMessage, thumbNail, sillType, plantPic } from '../../../utils'
import { hour, setUpPlant, Planter } from '../../planterconfig';



require('../../../secrets')

@inject("appStore") @observer
export default class WindowSill extends Component {
  constructor(props) {
    super(props)
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
    this.state = {
      isLoading: true,
      isEmpty: false,
      isFinished: false,
      message: null,
      weather: {},
      planters: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      userInventory: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      singlePlant: false,
      selectedPlanter: {},
      showInventory: false,
      notRecentlyPlanted: true,
      tempPlant: {},
      timer: 0,
      connected: true,
      watered: false, // temporary watered on local state for graphics reasons
      sillPic: 'default',
      toggleInfo: false,
      wateringCan: false,
      song: {},
      songIsPlaying: false,
      allSounds: {}
    }

    this.styles = styles;

    let d = Dimensions.get('window');
    const { height, width } = d;
    let isSmall = (height < 650) && !(height === 812 || width === 812) ? true : false;
    let isX = (height === 812 || width === 812) ? true : false;

    if (isX) {
      this.styles = bigStyles;
    }

    if (isSmall) {
      this.styles = smallStyles;
    }

    this.store = this.props.appStore
    this.uid = this.store.user.uid
    this.userRef = firebaseApp.database().ref('/users/' + this.uid)

  }

  componentWillMount(){
    this.refresh((result) => {this.setState({connected: result})})
  }

  refresh (cb) { 
    httpAddress = 'https://www.sarahhubschman.com/sill';
    let xhr = new XMLHttpRequest();
    xhr.open('GET', httpAddress);
    xhr.onreadystatechange = (e) => {
      if (xhr.readyState !== 4) { //code for completed request
        return;
      }
      if (xhr.status === 200) { //successful response
        cb(true);
      } else {
        cb(false) ;
      }
    };
    xhr.send();
  }

  preloadSoungs() {

    let snow = new Sound('snow.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let rain = new Sound('rain.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let rainNight = new Sound('rain-night.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let snowNight = new Sound('snow-night.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let nightSongArr = ['clear-night.mp3', 'clear-night2.mp3', 'clear-night3.mp3'];
    let nightSoundPath = nightSongArr[Math.floor(Math.random() * nightSongArr.length)];

    let clearNight = new Sound(nightSoundPath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let defaultSongArr = ['sunny-day.mp3', 'sunny-day2.mp3', 'sunny-day3.mp3', 'sunny-day4.mp3'];
    let defaultSoundPath = defaultSongArr[Math.floor(Math.random() * defaultSongArr.length)];

    let defaultSound = new Sound(defaultSoundPath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let clouds = new Sound('cloudy.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let storm = new Sound('thunder.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let fogSongArr = ['fog.mp3', 'fog2.mp3'];
    let fogSoundPath = fogSongArr[Math.floor(Math.random() * fogSongArr.length)];

    let fog = new Sound(fogSoundPath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let hoeSound = new Sound('hoe.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let waterSound = new Sound('water.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
    });

    let allSounds = {
      'snow-night': snowNight,
      'snow': snow,
      'rain-night': rainNight,
      'rain': rain,
      'default': defaultSound,
      'default-night': clearNight,

      'default-hot': defaultSound,
      'default-cold': defaultSound,
      'fog': fog,
      'cloud': clouds,
      'storm': storm,
      'storm-night': storm,

      'hoeSound': hoeSound,
      'waterSound': waterSound
    };

    this.setState({allSounds: allSounds});
    this.store.allSounds = allSounds;
    
  }

  componentDidMount() {

    // Preloading all the songs (and sounds)
    Sound.setCategory('Ambient');
    this.preloadSoungs()

    let fetchingWeather = this.store.fetchWeather(this.userRef);
    let checkingUserLevel = this.store.checkUserLevel(this.userRef);

    InteractionManager.runAfterInteractions(() => {      
      let fetchingUserInfo = this.userRef.on('value', (snapshot) => {
        let userInfo = snapshot.val();
        this.store.planters = userInfo.planters;
        this.store.user_inventory = userInfo.user_inventory;
        if(this.store.user_inventory.Hoe) {
          delete this.store.user_inventory.Hoe;
       }
        this.setState({planters: this.state.planters.cloneWithRows(_.toArray(this.store.planters)), userInventory: this.state.userInventory.cloneWithRows(_.toArray(this.store.user_inventory))})   
      })
      Promise.all([fetchingWeather, fetchingUserInfo, checkingUserLevel])
        .then(() => this.interval = setInterval(this.intervalCheck, 10000))
        .catch(console.error);
    });

  }

  intervalCheck = () => {
    let plantId = 0;
    let today = new Date();
    let timeNow = today.getTime();
    let newLevel;

    while(plantId < 4){
      this.store.calculatePlantStage(plantId, this.userRef);
      this.store.checkWeatherAgainstPlants(plantId, this.userRef, this.store.weather);
      plantId++;
    }

    this.setState({sillPic: sillType(this.store.weather.temp, this.store.weather.sun)});
    if (this.store.weatherPic !== this.state.sillPic) {
      this.store.weatherPic = this.state.sillPic;
    }

    this.setState({song: this.state.allSounds[this.store.weatherPic]});

    this.refresh((result) => {this.setState({connected: result})});

    // if ya boy is on the move
    navigator.geolocation.getCurrentPosition((loc)=>{
      this.store.user_long = String(loc.coords.longitude);
      this.store.user_lat =  String(loc.coords.latitude);
    }, null, { enableHighAccuracy: true}); 

      if (!this.state.songIsPlaying){
        this.state.song.play((success) => {
          if (success) {
            console.log('successfully finished playing');
          }
        });
        this.setState({songIsPlaying: true});
        // loops song forever
        this.state.song.setNumberOfLoops(-1);
      }

  }

  componentDidUpdate() {
    //LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }

  goToEmpty = (planter) => {
    this.setState({singlePlant: true, selectedPlanter: planter});
  }

  waterPlant = (planterId) => {
    let today = new Date();
    let timeNow = today.getTime();
    let newSurvival = timeNow + (hour * 24);
    if (this.state.selectedPlanter.currentPlant.name || this.state.tempPlant.name) {
      let selectedPlanter = Object.assign({}, this.state.selectedPlanter, {watered: true})
      this.setState({watered: true, selectedPlanter: selectedPlanter});
      this.userRef.child('planters').child(planterId).child('currentPlant').update({survival: newSurvival, watered: 1});
    } else {
      this.setState({watered: false})
    }

    if (this.state.allSounds.waterSound.getVolume() > 0) {
      this.state.allSounds.waterSound.setVolume(10.0);
      this.state.allSounds.waterSound.play((success) => {
        if (success) {
          console.log('successfully finished playing');
        }
      });
    }
  }

  componentWillReceiveProps() {
    this.setState({message: null, tempPlant: {}, notRecentlyPlanted: true, singlePlant: false, showInventory: false, watered: false})
  }

  pluck = () => {

    let plantId = this.state.selectedPlanter.id;
    let pluckingPlant = this.store.pluck(plantId, this.userRef);
    
    Promise.all([pluckingPlant])
      .then(() => this.setState({selectedPlanter: new Planter(this.state.selectedPlanter.id)}))
      .catch(console.error);
  }

  
  getDirtType = (planter) => {
    let dirtType = pix.dirt;
    if(planter.currentPlant && !planter.currentPlant.name && planter.hoed) {
      // if no plant but hoed
      dirtType = pix.hoedDirt;
    } else if (planter.currentPlant && planter.currentPlant.watered) {
      dirtType = pix.wetDirt;
    }
    return dirtType;
  }

  plantMysterySeed = () => {
    firebaseApp.database().ref('items_for_sale/').orderByChild('createdAt').on('value',
    (snapshot) => {
      if (snapshot.val()) {
        let itemsForSale = snapshot.val();
        let seedAmount = 0;
        for (item in itemsForSale) {
          if (itemsForSale[item].type === 'seed') {
            seedAmount++;
          }
        }
        let randomId = Math.floor(Math.pow((Math.random()), 2) * seedAmount);
        let selectedSeed = {};
        let itemNames = Object.keys(itemsForSale);
        for (let i = 0; i < itemNames.length; i++) {
          if (itemsForSale[itemNames[i]].id === randomId) {
            selectedSeed = itemsForSale[itemNames[i]];
            break;
          }
        } 
        if (selectedSeed !== null) {
          let today = new Date();
          let totalGrowTime = selectedSeed.total_time;
          let stageArr = createStageArr(today.getTime(), totalGrowTime / 5);
          this.setState({notRecentlyPlanted: false, tempPlant: {name: selectedSeed.name, stage: 1, id: this.state.selectedPlanter.id, best_sun: selectedSeed.best_sun, high: selectedSeed.high, low: selectedSeed.low, mystery: true}});
          let newItem = setUpPlant(stageArr, selectedSeed, today, true);
          let id = this.state.selectedPlanter.id;
          let planterRef = this.userRef.child('planters').child(id);
          planterRef.update({currentPlant: newItem});
        }
      }
    })
  }

  getHoursTillNextStage = () => {
    let currentPlant = this.state.selectedPlanter.currentPlant ? this.state.selectedPlanter.currentPlant : this.state.tempPlant;
    let stageTimes = currentPlant.stage_times;
    let today = new Date();
    let now = today.getTime();
    let nextStage = stageTimes[currentPlant.stage];
    let timeTill = Math.floor((nextStage - now) / hour);

    return timeTill;
  }
  
  plantSeed = (item, planterId) => {
    let today = new Date();
    let id = this.state.selectedPlanter.id;
    let planterRef = this.userRef.child('planters').child(id);
    this.setState({showInventory: false})

    if (item.type === "mystery") {
      this.plantMysterySeed();
      setTimeout(() => decreaseInventory(item, this.store, this.userRef), 100);
    } else if (item.type === 'seed') {     
      let totalGrowTime = item.total_time;
      let stageArr = createStageArr(today.getTime(), totalGrowTime / 5);
      // set temp plant info:
      this.setState({notRecentlyPlanted: false, tempPlant: {name: item.name, stage_times: stageArr, sell_val: item.sell_val, stage: 1, id: this.state.selectedPlanter.id, best_sun: item.best_sun, high: item.high, low: item.low}});
      let newItem = setUpPlant(stageArr, item, today, false);
      planterRef.update({currentPlant: newItem});
      setTimeout(() => decreaseInventory(item, this.store, this.userRef), 100);
    } 
    
    else if (item.type === 'fertilizer') {
  
      let sellVal = this.state.selectedPlanter.currentPlant.sell_val;
      let newSellVal = sellVal + (item.price / 2);

      let oldStageTimes = this.state.selectedPlanter.currentPlant.stage_times;
      let newStageTimes = [];
      let percentDecrease = (item.price / 10 * 3600000) + 5; // this will change for each fertilizer
      
      oldStageTimes.forEach(oldTime => {
        newStageTimes.push(Math.floor(oldTime - percentDecrease));
      });
      
      let updatedPlant = Object.assign({}, this.state.selectedPlanter.currentPlant, {stage_times: newStageTimes, sell_val: newSellVal})
      this.setState({selectedPlanter: {id: id, currentPlant: updatedPlant}, tempPlanter: {id: planterId}})
      planterRef.update({currentPlant: updatedPlant})
      setTimeout(() => decreaseInventory(item, this.store, this.userRef), 100);
    }
    else if (item.type === 'tool') {
      this.userRef.child('planters').child(id).once('value')
      .then(res => res.val())
      .then(planter => {
        if (planter.currentPlant.stage !== 'dead') {
          let tempPlanter = Object.assign({}, this.state.selectedPlanter, {hoed: true});
          this.setState({selectedPlanter: tempPlanter});
          planterRef.update({hoed: true});
        }
        else {
          let emptyPlant = new Planter(planterId);
          this.setState({selectedPlanter: emptyPlant});
          planterRef.update({hoed: false, currentPlant: new Planter(planterId)});
        }
        if (this.state.allSounds.hoeSound.getVolume() > 0){
          this.state.allSounds.hoeSound.setVolume(10.0);
          this.state.allSounds.hoeSound.play((success) => {
            if (success) {
              console.log('successfully finished playing');
            }
          });
        }
      })
      .catch(console.error);
    }
  }
  
  renderInventory = (item, id) => {
    let planter = this.state.selectedPlanter;
    let singlePlant = this.state.singlePlant;
    let amt = '';
    let seedtxt = '';
    let itemTitle = item.name.toUpperCase();
    
    if (item && item.price && item.amount > 1) {
      amt = ' x ' + item.amount;
    }

    if (item.type === 'seed' && item.amount <= 1) {
      seedtxt = ' SEED';
    }

    if (item.amount > 1 && item.type === 'seed') {
      seedtxt = ' SEEDS';
    }
    
    let wholeTitle = itemTitle + seedtxt + amt;
    if (item.name && (item.amount >= 1)) {
      return (
        <View style={this.styles.card}>
         <Text style={this.styles.title}>{wholeTitle}</Text>
          <TouchableOpacity onPress={()=> this.plantSeed(item, (planter.id))}>
            {item.type === 'fertilizer' && (singlePlant && planter.currentPlant.name && planter.currentPlant.stage < 5 ) ? <Text style={this.styles.toolVerb}> use </Text> : null}
            {(item.type === 'seed' || item.type === "mystery") && singlePlant && !planter.currentPlant.name && this.state.notRecentlyPlanted && planter.hoed ? <Text style={this.styles.toolVerb}> plant seed </Text> : null}
            {item.type === 'tool' && (planter.currentPlant && planter.currentPlant.stage === 'dead') || item.type === 'tool' && singlePlant && !planter.currentPlant.name && this.state.notRecentlyPlanted && !planter.hoed ? <Text style={this.styles.toolVerb}> use tool </Text> : null}
          </TouchableOpacity>
        
        {item.name === 'Hoe' ? <View style={this.styles.card}>
          <Text style={this.styles.title}>WATERING CAN</Text>
          <TouchableOpacity onPress={() => this.state.singlePlant && (this.state.selectedPlanter.currentPlant.name || this.state.tempPlant.name) ? this.waterPlant(this.state.selectedPlanter.id) : <Text></Text>}>
          {this.state.singlePlant && this.state.selectedPlanter.hoed ? <Text style={this.styles.toolVerb}>water plant</Text> : null}
          </TouchableOpacity> 
        </View> : null}
      </View>
      )
    } else return (
      <View>
      <TouchableOpacity>
        {item.type === 'tool' ? <Text style={this.styles.title}>{item.name.toUpperCase()} x{item.amount}</Text> : null}
      </TouchableOpacity>
      </View>)
    }
    
    timer = (plantId) => {
      let today = new Date();
      let timeNow = today.getTime();
      
      this.userRef.child('planters').child(plantId).child('currentPlant').once('value')
      .then(snapshot => snapshot.val())
      .then(plant => {
        let stage = plant.stage - 1
        let stageTime = plant.stage_times[stage]
        this.setState({timer: stageTime}) 
      });
    }
    
    //  plants will be here!
    renderPlanters = (planter) => {
      
      let dirt = pix.wetDirt;
      let planterPic = this.getPlanterPic(planter.id);
      let plant = planter.currentPlant;
      let plantName = plant && plant.name ? plant.name.split(' ').join('').toLowerCase() : '';

      if (planter && planter.currentPlant && planter.currentPlant.name) {
        return (
          <TouchableOpacity onPress={() => {this.timer(planter.id), this.setState({selectedPlanter: planter, singlePlant: true, message: null})}}>
          <View style={this.styles.item}>
          {plant && plantName && plant.stage && plant.stage !== 'dead' && plant.stage > 1 ?  
            <Image source={pix[plantName][plant.stage]} style={this.styles.planterPlant}/>
            : null}
          <Image source={dirt} style={this.styles.planterDirt}/>
          <Image source={planterPic} style={this.styles.planterPlanter}/>
          </View>
          </TouchableOpacity>
        )
      }
      else {
        return (
          <TouchableOpacity onPress={() => this.goToEmpty(planter)}>
          <View style={this.styles.item}>
          <Image source={dirt} style={this.styles.planterDirt}/>
          <Image source={planterPic} style={this.styles.planterPlanter}/>
          </View>
          </TouchableOpacity>
        )
      }
    }
    
    getPlanterPic = (id) => {
      switch(id) {
        case 0:
        return pix.planter1Pic;
        case 1:
        return pix.planter2Pic;
        case 2:
        return pix.planter3Pic;
        case 3:
        return pix.planter4Pic;
        default:
        return pix.planter1Pic;
      }
    }
    
    getSillPic = (weather) => {
      switch(weather) {
        case 'default':
          return pix.defaultPic;
        case 'default-night':
          return pix.defaultNightPic;
        case 'snow':
          return pix.snowPic;
        case 'snow-night':
          return pix.snowNightPic;
        case 'rain':
          return pix.rainPic;
        case 'rain-night':
          return pix.rainNightPic;
        case 'cloud':
          return pix.cloudPic;
        case 'fog':
          return pix.fogPic;
        case 'storm':
          return pix.stormPic;
        case 'storm-night':
          return pix.stormNightPic;
        case 'default-hot':
          return pix.defaultHotPic;
        case 'default-cold':
          return pix.defaultColdPic;
        default:
          return pix.defaultPic;
      }
    }

    showPlantName = (curr, temp) => {
      let plant = temp.name ? temp : curr;
      if (!plant.mystery) {
        return true;
      }
      if (plant.mystery && plant.stage > 1) {
        return true
      }
      return false
    }
    
    componentWillUnmount() {
      firebaseApp.database().ref('users').off()
      clearInterval(this.interval)   
    }

    render() {
         
      // images....
      let planter = this.state.selectedPlanter;
      let currentPlant = planter.currentPlant || null;
      let plant = planter.currentPlant;
      let plantName = plant && plant.name ? plant.name.split(' ').join('').toLowerCase() : '';
      let dirt = pix.wetDirt;
      let timeTill = ''

      if (this.state.singlePlant && plant.name && plant.name.length > 0 && plant.stage !== 'dead') {
        let time = this.getHoursTillNextStage();
        if (time <= 0) {
          time = 1;
        } else {
          time = time + 1;
        }
        timeTill = time === 1 ? `${time} hour until next stage` : `${time} hours until next stage`;
      }
  
      if (!this.state.watered) {
        dirt = this.getDirtType(planter);
      }
      let planterPic = this.getPlanterPic(planter.id);
      let windowsill = this.getSillPic(this.store.weatherPic);
      let wateringcan = pix.wateringCan;
      
      if(this.state.connected){
        return (
          <View style={this.styles.container}>
  
            {/* windowsill and background pics */}
            {!this.state.singlePlant ? <Image source={windowsill}  style={this.styles.sill}/> : <Text></Text>}
            {!this.state.singePlant ? <Image source={pix.pipePic} style={this.styles.pipe}/> : <Text></Text> } 
            {!this.state.singlePlant ? <BackgroundImage/> : <SingleBackgroundImage />}
  
            {/* single plant and planters view */}
            {this.state.singlePlant ? 
              <View style={this.styles.singlePlantContainer}>

              {plant && plantName && plant.stage && plant.stage !== 'dead' && plant.stage > 1 ?  
              <Image source={pix[plantName][plant.stage]} style={this.styles.singlePlant}/>
              : null}
                <Image source={dirt} style={this.styles.singlePlantDirt} />
                <Image source={planterPic} style={this.styles.singlePlantPlanter} />
                <Image source={windowsill}  style={this.styles.sillClose}/>
                {this.state.tempPlant.name || currentPlant.name ?
                <TouchableOpacity style={this.styles.plantInfoButton} onPress={() => this.setState({toggleInfo: !this.state.toggleInfo, wateringCan: !this.state.wateringCan})}> 
                  {!this.state.toggleInfo ? <Text style={this.styles.showinfo}>info</Text> : <Image source={pix.infoDown} style={this.styles.arrow}/>}
                </TouchableOpacity> : <Text></Text>
                }

                  {(this.state.tempPlant.name || currentPlant.name) && this.state.toggleInfo ? <View style={this.styles.plantInfo} > 
                  {this.showPlantName(currentPlant, this.state.tempPlant) ? <Text style={this.styles.plantTitle}> {(currentPlant.name || this.state.tempPlant.name)}  </Text>  : <Text style={this.styles.plantTitle}> ??? </Text>}
                    {currentPlant.stage === 'dead' ? <Text style={this.styles.info}> dead :( </Text> : <Text style={this.styles.info}> stage {currentPlant.stage || this.state.tempPlant.stage} </Text>}
                    <Text style={this.styles.info}> likes: {(currentPlant.high+currentPlant.low)/2 || (this.state.tempPlant.high + this.state.tempPlant.low)/2}° {currentPlant.best_sun || this.state.tempPlant.best_sun} </Text>
                    {this.store.idealWeather[this.state.selectedPlanter.id] === true ? <Text style={this.styles.info}> ideal weather! </Text> : <Text></Text>} 
                    {currentPlant.stage === 5 ? <TouchableOpacity style={this.styles.button} onPress={() => this.pluck()}><Text style={this.styles.info}> sell for {currentPlant.sell_val || this.state.tempPlant.sell_val}g </Text></TouchableOpacity> : <Text style={this.styles.time}>{timeTill}</Text> }
                    </View> : <Text></Text>}
                
      

              </View>
            :
            
            <ListView
                contentContainerStyle={this.styles.list}
                automaticallyAdjustContentInsets={false}
                dataSource={this.state.planters}
                renderRow={this.renderPlanters}
                scrollEnabled={false}
              /> 
              
            }
  
            {/* !this.state.singlePlant ? <Image source={pix.outlet} style={this.styles.outlet}/> :  <View></View> */}
            <View style={this.styles.inventoryBorder}></View>
            { this.state.showInventory ?
              <View style={this.styles.showInventory}>
                <TouchableOpacity style={this.styles.showInventory} onPress={() => this.setState({showInventory: !this.state.showInventory})}><Text style={this.styles.x}>x</Text></TouchableOpacity>
                <ListView
                  automaticallyAdjustContentInsets={true}
                  initialListSize={10}
                  dataSource={this.state.userInventory}
                  renderRow={this.renderInventory}
                  onEndReachedThreshold={1}
                />
              </View>
              : 
              <TouchableOpacity style={this.styles.showInventory} onPress={() => this.setState({showInventory: !this.state.showInventory})}><Text style={this.styles.arrowText}>inventory</Text></TouchableOpacity>}
            </View>
        );
      } else {
        return (<View style={this.styles.errorcontainer}> 
            <Image source={pix.wifi}/> 
            <Text style={this.styles.needsWifiTitle}>These plants need the internet to grow!</Text>
            <Text style={this.styles.needsWifi}>Connect to WiFi or venture into an area with service.</Text>
          </View>)
      }
    }
  }

  const smallStyles = StyleSheet.create({
    container: {
      flex: 2,
      justifyContent: 'center'
    },
    errorcontainer: {
      flex: 1,
      alignItems: 'center',
      top: 100,
      textAlign: 'center'
    },
    planter: {
      flex: 4
    },
    waitView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
    },
    card: {
      flex: 1,
      alignItems: 'center',
      textAlign: 'center',
      backgroundColor: '#8fc9bb'
    },
    wateringCan: {
      alignItems: 'center',
      textAlign: 'center',
      backgroundColor: '#8fc9bb'
    },
    title: {
      fontFamily: 'Press Start 2P',
      fontSize: 10,
      fontWeight: '800',
      padding: 5,
      color: '#fff',
    },
    plantTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: '#005c50',
      fontFamily: 'Press Start 2P',
      paddingTop: 10,
      paddingBottom: 5
    },
    arrowText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#005c50',
      fontFamily: 'Press Start 2P', 
      padding: 5
    },
    x: {
      fontSize: 10,
      fontWeight: '800',
      color: '#005c50',
      fontFamily: 'Press Start 2P',
      padding: 2
    },
    toolVerb: {
      fontSize: 10,
      color: '#fff',
      fontFamily: 'Press Start 2P',
      backgroundColor: '#005c50',
      width: 200,
      padding: 10,
      textAlign: 'center',
    },
    showinfo: {
      fontSize: 10,
      color: '#fff',
      fontFamily: 'Press Start 2P',
      backgroundColor: '#005c50',
      width: 100,
      padding: 10,
      margin: 5,
      textAlign: 'center',
    },
    postInfo: {
      padding: 3,
      alignItems: 'center',
    },
    postButtons: {
      padding: 5,
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    button: {
      flex: 3,
      padding: 5,
      margin: 6,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#999',
      alignItems: 'center',
      backgroundColor: '#005c50',
    },
    arrow: {
      height: 30,
      width: 30,
      fontSize: 10,
      fontWeight: '800',
      color: '#005c50',
      fontFamily: 'Press Start 2P',
    },
    info: {
      fontFamily: 'Press Start 2P',
      color: '#fff',
      fontSize: 12,
      paddingBottom: 5
    },
    time: {
      alignItems: 'center',
      paddingBottom: 10,
      paddingLeft: 10,
      fontFamily: 'Press Start 2P',
      color: '#005c50',
      fontSize: 10
    },
    bold: {
      fontWeight: 'bold',
    },
    pipe: {
      zIndex: -1,
      position: 'absolute'
    },
    sillClose: {
      height: 600,
      width: 600,
      zIndex: 0,
      justifyContent:'center',
      top: -145,
      left: -150,
      position: 'absolute'
    },
    list: {
      justifyContent: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      top: 270,
    },
    plantInfo: {
      zIndex: 100,
      position: 'absolute',
      top: 0,
      right: 0
    },
    plantInfoButton: {
      zIndex: 101,
      position: 'absolute',
      top: 0,
      right: 0
    },
    item: {
      margin: 10,
      width: 50,
      height: 100
    },
    sill: { ///// 
      height: 450,
      width: 450,
      zIndex: 0,
      justifyContent:'center',
      alignItems: 'center',
      top: 5,
      right: -70,
      position: 'absolute'
    },
    planterPlant: { ///
      right: -30,
      position: 'absolute',
      top: 20,
      zIndex: 3,
      height: 110,
      width: 110
    },
    planterDirt: { ///
      right: -30,
      position: 'absolute',
      top: 20,
      zIndex: 2,
      height: 110,
      width: 110
    },
    planterPlanter: { ///
      right: -30,
      position: 'absolute',
      top: 20,
      zIndex: 1,
      height: 110,
      width: 110
    },
    outlet: {
      height: 40,
      width: 40,
      bottom: 80,
      right: 50,
      position: 'absolute'
    },
    singlePlantContainer: {
      flex: 1,
      flexDirection:'row',
      alignItems: 'center',
      justifyContent:'center'
    },
    singlePlant: {
      position: 'absolute',
      top: 95,
      right: 15,
      zIndex: 5,
      height: 300,
      width: 300
    },
    showInventory: {
      backgroundColor: '#8fc9bb',
    },
    inventoryBorder: {
      backgroundColor: '#005c50',
      height: 3
    },
    singlePlantDirt: {
      position: 'absolute',
      top: 95,
      right: 15,
      zIndex: 4,
      height: 300,
      width: 300
    },
    singlePlantPlanter: {
      position: 'absolute',
      top: 95,
      right: 15,
      zIndex: 3,
      height: 300,
      width: 300
    },
    needsWifi: {
      padding: 5,
      textAlign: 'center',
      fontSize: 20,
      fontFamily: 'Pxlvetica',
      color: '#ffffff'
    },
    needsWifiTitle: {
      padding: 10,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: 'Press Start 2P',
      color: '#ffffff'
    }
  })


const styles = StyleSheet.create({
  container: {
    flex: 2,
    justifyContent: 'center'
  },
  errorcontainer: {
    flex: 1,
    alignItems: 'center',
    top: 100,
    textAlign: 'center'
  },
  planter: {
    flex: 4
  },
  waitView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#8fc9bb'
  },
  wateringCan: {
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#8fc9bb'
  },
  title: {
    fontFamily: 'Press Start 2P',
    fontSize: 16,
    fontWeight: '800',
    padding: 5,
    color: '#fff',
  },
  plantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
    paddingTop: 10,
    paddingBottom: 5
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P', 
    padding: 5
  },
  x: {
    fontSize: 20,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
    padding: 2
  },
  toolVerb: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Press Start 2P',
    backgroundColor: '#005c50',
    width: 200,
    padding: 10,
    textAlign: 'center',
  },
  showinfo: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Press Start 2P',
    backgroundColor: '#005c50',
    width: 100,
    padding: 10,
    margin: 5,
    textAlign: 'center',
  },
  postInfo: {
    padding: 3,
    alignItems: 'center',
  },
  postButtons: {
    padding: 5,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  button: {
    flex: 3,
    padding: 5,
    margin: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    backgroundColor: '#005c50',
  },
  arrow: {
    height: 30,
    width: 30,
    fontSize: 12,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
  },
  info: {
    fontFamily: 'Press Start 2P',
    color: '#fff',
    fontSize: 15,
    paddingBottom: 5
  },
  time: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingLeft: 10,
    fontFamily: 'Press Start 2P',
    color: '#005c50',
    fontSize: 10
  },
  bold: {
    fontWeight: 'bold',
  },
  sill: {
    height: 520,
    width: 520,
    zIndex: 0,
    justifyContent:'center',
    alignItems: 'center',
    top: 10,
    left: -60,
    position: 'absolute'
  },
  pipe: {
    zIndex: -1,
    position: 'absolute'
  },
  sillClose: {
    height: 800,
    width: 800,
    zIndex: 0,
    justifyContent:'center',
    top: -155,
    left: -195,
    position: 'absolute'
  },
  list: {
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    top: 270,
  },
  plantInfo: {
    zIndex: 100,
    position: 'absolute',
    top: 0,
    right: 0
  },
  plantInfoButton: {
    zIndex: 101,
    position: 'absolute',
    top: 0,
    right: 0
  },
  item: {
    margin: 10,
    width: 70,
    height: 150
  },
  planterPlant: {
    left: -30,
    position: 'absolute',
    top: 60,
    zIndex: 3,
    height: 140,
    width: 140
  },
  planterDirt: {
    left: -30,
    position: 'absolute',
    top: 60,
    zIndex: 2,
    height: 140,
    width: 140
  },
  planterPlanter: {
    left: -30,
    position: 'absolute',
    top: 60,
    zIndex: 1,
    height: 140,
    width: 140
  },
  outlet: {
    height: 40,
    width: 40,
    bottom: 80,
    right: 50,
    position: 'absolute'
  },
  singlePlantContainer: {
    flex: 1,
    flexDirection:'row',
    alignItems: 'center',
    justifyContent:'center'
  },
  singlePlant: {
    position: 'absolute',
    top: 170,
    left: -2,
    zIndex: 5,
    height: 400,
    width: 400
  },
  showInventory: {
    backgroundColor: '#8fc9bb',
  },
  inventoryBorder: {
    backgroundColor: '#005c50',
    height: 3
  },
  singlePlantDirt: {
    position: 'absolute',
    top: 170,
    left: -2,
    zIndex: 4,
    height: 400,
    width: 400
  },
  singlePlantPlanter: {
    position: 'absolute',
    top: 170,
    left: -2,
    zIndex: 3,
    height: 400,
    width: 400
  },
  needsWifi: {
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Pxlvetica',
    color: '#ffffff'
  },
  needsWifiTitle: {
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Press Start 2P',
    color: '#ffffff'
  }
});


const bigStyles = StyleSheet.create({
  container: {
    flex: 2,
    justifyContent: 'center'
  },
  errorcontainer: {
    flex: 1,
    alignItems: 'center',
    top: 100,
    textAlign: 'center'
  },
  planter: {
    flex: 4
  },
  waitView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#8fc9bb'
  },
  wateringCan: {
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#8fc9bb'
  },
  title: {
    fontFamily: 'Press Start 2P',
    fontSize: 16,
    fontWeight: '800',
    padding: 5,
    color: '#fff',
  },
  plantTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
    paddingTop: 10,
    paddingBottom: 5
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P', 
    padding: 5
  },
  x: {
    fontSize: 20,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
    padding: 2
  },
  toolVerb: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Press Start 2P',
    backgroundColor: '#005c50',
    width: 200,
    padding: 10,
    textAlign: 'center',
  },
  showinfo: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Press Start 2P',
    backgroundColor: '#005c50',
    width: 100,
    padding: 10,
    margin: 5,
    textAlign: 'center',
  },
  postInfo: {
    padding: 3,
    alignItems: 'center',
  },
  postButtons: {
    padding: 5,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  button: {
    flex: 3,
    padding: 5,
    margin: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    backgroundColor: '#005c50',
  },
  arrow: {
    height: 30,
    width: 30,
    fontSize: 12,
    fontWeight: '800',
    color: '#005c50',
    fontFamily: 'Press Start 2P',
  },
  info: {
    fontFamily: 'Press Start 2P',
    color: '#fff',
    fontSize: 15,
    paddingBottom: 5
  },
  time: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingLeft: 10,
    fontFamily: 'Press Start 2P',
    color: '#005c50',
    fontSize: 10
  },
  bold: {
    fontWeight: 'bold',
  },
  sill: {
    height: 520,
    width: 520,
    zIndex: 0,
    justifyContent:'center',
    alignItems: 'center',
    top: 30,
    left: -60,
    position: 'absolute'
  },
  pipe: {
    zIndex: -1,
    position: 'absolute'
  },
  sillClose: {
    height: 800,
    width: 800,
    zIndex: 0,
    justifyContent:'center',
    top: -180,
    left: -195,
    position: 'absolute'
  },
  list: {
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    top: 270,
  },
  plantInfo: {
    zIndex: 100,
    position: 'absolute',
    top: 0,
    right: 0
  },
  plantInfoButton: {
    zIndex: 101,
    position: 'absolute',
    top: 0,
    right: 0
  },
  item: {
    margin: 10,
    width: 70,
    height: 150
  },
  planterPlant: {
    left: -30,
    position: 'absolute',
    top: 70,
    zIndex: 3,
    height: 140,
    width: 140
  },
  planterDirt: {
    left: -30,
    position: 'absolute',
    top: 70,
    zIndex: 2,
    height: 140,
    width: 140
  },
  planterPlanter: {
    left: -30,
    position: 'absolute',
    top: 70,
    zIndex: 1,
    height: 140,
    width: 140
  },
  outlet: {
    height: 40,
    width: 40,
    bottom: 80,
    right: 50,
    position: 'absolute'
  },
  singlePlantContainer: {
    flex: 1,
    flexDirection:'row',
    alignItems: 'center',
    justifyContent:'center'
  },
  singlePlant: {
    position: 'absolute',
    top: 150,
    left: 1, // 
    zIndex: 5,
    height: 400,
    width: 400
  },
  showInventory: {
    backgroundColor: '#8fc9bb',
    paddingBottom: 50
  },
  inventoryBorder: {
    backgroundColor: '#005c50',
    height: 3
  },
  singlePlantDirt: {
    position: 'absolute',
    top: 150,
    left: 1,
    zIndex: 4,
    height: 400,
    width: 400
  },
  singlePlantPlanter: {
    position: 'absolute',
    top: 150,
    left: 1,
    zIndex: 3,
    height: 400,
    width: 400
  },
  needsWifi: {
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Pxlvetica',
    color: '#ffffff'
  },
  needsWifiTitle: {
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Press Start 2P',
    color: '#ffffff'
  }
});