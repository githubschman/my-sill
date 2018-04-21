import React, { Component } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListView,
  LayoutAnimation,
  Platform,
  UIManager,
  Picker,
  Button,
  Image
} from 'react-native'
import _ from 'lodash'
import moment from 'moment'
import { firebaseApp } from '../../firebase'
import Icon from 'react-native-vector-icons/Ionicons'
import { observer, inject } from 'mobx-react/native'
import { Actions } from 'react-native-mobx'
const pix = require('../../assets/images/plantpicturecollection');

// seedPics array
const seedPics = [pix.seed0, pix.seed1, pix.seed2, pix.seed3, pix.seed4, 
                  pix.seed5, pix.seed6, pix.seed7, pix.seed8, pix.seed9, 
                  pix.seed10, pix.seed11, pix.seed12, pix.seed13, 
                  pix.seed14, pix.seed0]


@inject("appStore") @observer
export default class SeedShop extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoading: true,
      isFinished: false,
      counter: 100,
      isEmpty: false,
      dataSource: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      userInfo: {level: 0, points: 0, totalPoints: 0},
      selectedItem: {},
      show: false,
      amount: 1,
      ownInventory: false,
      userInventory: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2}),
      singlePlant: false
    }
    this.uid = this.props.appStore.user.uid;
    this.userRef = firebaseApp.database().ref('/users/' + this.uid);
    this.itemRef = firebaseApp.database().ref('/users/' + this.uid + '/user_inventory');
  }

  componentDidMount() {

    this.userRef.on('value', (snapshot) => {
      let userInfo = snapshot.val()
      this.props.appStore.gold = userInfo.gold
      this.props.appStore.user_level = userInfo.user_level
      this.props.appStore.level_points = userInfo.level_points
      this.props.appStore.user_inventory = userInfo.user_inventory

      this.setState({userInfo: {level: this.props.appStore.user_level, points: this.props.appStore.gold, totalPoints: this.props.appStore.level_points}, isLoading: false })
      
      firebaseApp.database().ref('items_for_sale/').orderByChild('createdAt').on('value',
      (snapshot) => {    
        if (snapshot.val()) {
          this.setState({ isEmpty: false, dataSource: this.state.dataSource.cloneWithRows((_.toArray(snapshot.val()))) })
        }
        else {
          this.setState({ isEmpty: true })
        }
        this.setState({ isLoading: false })
      })
      this.itemRef.on('value', (snapshot) => {
        if(snapshot.val()){
          _.toArray(snapshot.val()).forEach(item => {
            this.props.appStore.user_inventory[item.name] = item
          })
          this.setState({userInventory: this.state.userInventory.cloneWithRows(_.toArray(snapshot.val()))})
        }   
      })
    })
  }

  componentWillReceiveProps(){
    this.setState({show: false, amount: 1, ownInventory: false, selectedItem: {}});
  }

  componentDidUpdate() {
    //LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
  }

  
  showInventory = () => {
    if(!this.state.ownInventory){
      this.setState({show: true, ownInventory: true})
    } else {
      this.setState({show: false, amount: 1, ownInventory: false})
    }
  }
  
  backToInventory = () => {
    this.setState({show: false, amount: 1, ownInventory: false, selectedItem: {}})
  }
  
  purchase = () => {
    // saving the item info value before resetting local state
    let itemPrice = this.state.selectedItem.price;
    let newPoints = this.state.userInfo.points;
    let item = this.state.selectedItem;
    let selectedAmount = Number(this.state.amount);
    
    // resetting local state to avoid buying before gold update bug on slow networks
    this.backToInventory();
    
    // seeing if the user already has the item in their inventory, if so incrementing
    !this.props.appStore.user_inventory[item.name] ? this.props.appStore.user_inventory[item.name] = item : this.props.appStore.user_inventory[item.name].amount += Number(selectedAmount);
    
    this.itemRef.on('value', snapshot => {
      let inventory = snapshot.val();
      let amt = inventory[item.name] && inventory[item.name].amount ? inventory[item.name].amount + selectedAmount : selectedAmount;
      item.amount = amt;


      this.itemRef.update({[item.name]: this.props.appStore.user_inventory[item.name]})
      // updating local points and backend gold
      this.userRef.update({'gold' :  newPoints - (itemPrice * selectedAmount)})
      this.setState({userInfo : {points: newPoints - (itemPrice * selectedAmount)}})
    })
  }
  
  _renderRow = (item) => {
    // lets you preview the next level
    if (this.props.appStore.user_level >= item.level_req - 1) {
      return (
        <TouchableOpacity onPress={() => this._moreInfo(item)}>
        <View style={styles.card}>
        <Text style={styles.title}>{ item.name }</Text>
            {item.type === "seed" && item.name !== "Mystery" ? 
            <Image source={seedPics[item.id%(seedPics.length)]} style={styles.seedImage}/> :
            <Image source={pix[item.type]} style={styles.seedImage}/> }
            <Text style={styles.info}>Cost: {item.price} g</Text>
            <Text style={styles.info}>Level {item.level_req} required</Text>
            </View>
        </TouchableOpacity>
      )
    } else {
      return null;
    }
  }
  
  truncate = (name, amount) => {
    let dot = '.'
    let dots = 20 - (name.length + amount.toString().length);
    if (dots < 0) {
      dots = 0;
    }
    return `${name} ${dot.repeat(dots)} ${amount}`
  }

  _renderInventory = (item) => {
    if(item.name && item.amount > 0){
      let text = this.truncate(item.name, item.amount)
      return (
        <TouchableOpacity>
          <View style={styles.inventoryCard}>
          <Text style={styles.inventory}>{text}</Text>
        </View>
        </TouchableOpacity>
      )
    }else{
      return <Text> </Text>
    } 
  }
  
  _onEndReached = () => {
    if (!this.state.isEmpty && !this.state.isFinished && !this.state.isLoading) {
      this.setState({ isLoading: true })
      firebaseApp.database().ref('items_for_sale/').off()
      firebaseApp.database().ref('items_for_sale/').orderByChild('createdAt').limitToLast(this.state.counter+10).on('value',
      (snapshot) => {
        if (_.toArray(snapshot.val()).length < this.state.counter) {
          this.setState({ isFinished: true })
        }
        if (snapshot.val()) {
          this.setState({ isEmpty: false })
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows((_.toArray(snapshot.val()))),
          })
        }
        this.setState({ isLoading: false })
      })
    }
  }
  
  _renderFooter = () => {
      return (
        <View style={styles.waitView}>
          <Text style={styles.info}> Level up to see more seeds! </Text>
        </View>
      )
  }
  
  _moreInfo = (item) => {
    this.setState({selectedItem: item, show: true, ownInventory: false})
  }
  
  _userEdit = () => {
    Actions.setting()
  }
  
  _logOut = () => {
    firebaseApp.auth().signOut()
    .then(() => {
      this.props.appStore.username = ""
      this.props.appStore.user = {}
      this.props.appStore.post_count = 0
      Actions.login({ type: 'replace' });
    }, function(error) {
      console.log(error)
    });
  }
  
  componentWillUnmount() {
    firebaseApp.database().ref('/users' + this.uid).child('user_level').off()
    firebaseApp.database().ref('items_for_sale/'+ this.uid +'/posts').off()
  }

  render() {
    let purchaseFor = "Purchase For " + this.state.selectedItem.price * this.state.amount + 'g';

    return (
      <View style={!this.state.selectedItem.name ? styles.container : styles.itemContainer}>
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>
              {!this.state.selectedItem.name ? 'SEED SHOP' : ''}
            </Text>
          </View>
          
          {!this.state.selectedItem.name ? <TouchableOpacity onPress={() => this.showInventory()}> 
            <View style={styles.profileCountsContainer}>
              {/* !this.state.show  ? <Image source={pix.infoUp} style={styles.infoButton}/> : <Image source={pix.infoDown} style={styles.infoButton}/> */}
            </View>
          </TouchableOpacity>
          : null}
          <View style={styles.profileCountsContainer}>
            <Text style={styles.profileCounts}>
              {this.state.userInfo.points} g
            </Text>
          </View>
        </View>

        
        {this.state.ownInventory && this.state.show ? 
          <View style={styles.profileCountsContainer}> 

          <ListView
            automaticallyAdjustContentInsets={true}
            initialListSize={1}
            dataSource={this.state.userInventory}
            renderRow={this._renderInventory}
            onEndReachedThreshold={1}
          />
          
        </View> : <View><Text></Text></View>}

        {this.state.selectedItem.name && !this.state.ownInventory && this.state.show ?
          <View style={styles.profileCountsContainerSingle}>
            <Text style={styles.title}> {this.state.selectedItem.name} </Text>
            <Text style={styles.info}> {this.state.selectedItem.description} </Text>
            {this.state.selectedItem.type === "seed" && this.state.selectedItem.name !== "mystery" ? 
            <Text style={styles.water}> (Water every {this.state.selectedItem.survival} hours) </Text> : null}
            {this.state.selectedItem.type === "seed" && this.state.selectedItem.name !== "mystery"  ? 
            <Image source={seedPics[this.state.selectedItem.id%(seedPics.length)]} style={styles.singleSeedImage}/> :
            <Image source={pix[this.state.selectedItem.type]} style={styles.singleSeedImage}/> }
            
            
            { this.state.selectedItem.level_req > this.props.appStore.user_level ? 
                <Text style={styles.info}> Level {this.state.selectedItem.level_req} required!</Text> :
              <View style={styles.center}>
                <TouchableOpacity onPress={() => this.setState({amount: this.state.amount + 1})}>
                  <Image source={pix.infoUp} style={styles.picker}/>
                </TouchableOpacity>
                <Text style={styles.amount}> {this.state.amount < 10 ? '0' + this.state.amount : this.state.amount} </Text>
                <TouchableOpacity onPress={() => this.state.amount > 1 ? this.setState({amount: this.state.amount - 1}) : null}>
                  <Image source={pix.infoDown} style={styles.picker}/>
                </TouchableOpacity>
              </View>   
                
            }

            { this.props.appStore.user_level >= this.state.selectedItem.level_req &&
              this.state.userInfo.points >= this.state.selectedItem.price * this.state.amount ?

              <View>
                <TouchableOpacity style={styles.button} onPress={() => this.purchase()}>
                  <Text style={styles.buttonText}> {purchaseFor} </Text>
                </TouchableOpacity>
              </View>
            :            
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}> { this.props.appStore.user_level < this.state.selectedItem.level_req ? 'Lvl ' + this.state.selectedItem.level_req + ' Required!' : 'Need More Gold!'} </Text>
            </TouchableOpacity> }   
            

          </View> :  
          <ListView
            automaticallyAdjustContentInsets={true}
            initialListSize={100}
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            renderFooter={this._renderFooter}
            onEndReached={this._onEndReached}
            onEndReachedThreshold={1}
          />}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7DAFA3'
  },
  itemContainer: {
    flex: 1,
    backgroundColor: '#8fc9bb'
  },
  center: {
    alignItems: 'center',
  },
  button: {
    bottom: 0,
    marginBottom: 20,
    backgroundColor: '#005c50',
    borderRadius: 20,
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Press Start 2P',
    fontSize: 15,
    padding: 20
  },
  goBack: {
    color: '#fff',
    fontFamily: 'Press Start 2P',
    fontSize: 15,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    height: 65,
    margin: 3,
    borderRadius: 2,
    backgroundColor: '#8fc9bb'
  },
  profileNameContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    color: '#fff'
  },
  profileName: {
    marginLeft: 10,
    fontSize: 12,
    fontFamily: 'Press Start 2P',
    color: '#fff',
  },
  profileCountsContainerSingle: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 5,
    backgroundColor: '#8fc9bb'
  },
  profileCountsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 5,
    backgroundColor: '#8fc9bb'
  },
  profileCounts: {
    fontFamily: 'Press Start 2P',
    fontSize: 12,
    color: '#fff'
  },
  seedImage: {
    width: 300,
    height: 300
  },
  singleSeedImage: {
    width: 230,
    height: 230
  },
  countsName: {
    fontSize: 10,
    fontFamily: 'Press Start 2P',
    color: '#ffffff'
  },
  waitView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  card: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#628980',
    margin: 2,
    alignItems: 'center',
  },
  inventoryCard: {
    flex: 1,
    borderBottomWidth: 5,
    borderColor: '#8fc9bb',
    margin: 2,
    alignItems: 'center',
  },
  infoButton: {
    height: 30,
    width: 30
  },
  title: {
    fontFamily: 'Pxlvetica',
    textAlign: 'center',
    fontSize: 45,
    color: '#fff',
    fontWeight: 'bold',
  },
  inventory: {
    fontFamily: 'Press Start 2P',
    color: '#fff',
    fontSize: 16,
  },
  info: {
    padding: 3,
    textAlign: 'center',
    fontFamily: 'Pxlvetica',
    fontSize: 22,
    color: '#fff'
  },
  water: {
    padding: 0,
    textAlign: 'center',
    fontFamily: 'Pxlvetica',
    fontSize: 18,
    color: '#fff'
  },
  amount: {
    textAlign: 'center',
    fontFamily: 'Pxlvetica',
    fontSize: 30,
    paddingRight: 5,
    color: '#fff'
  },
  picker: {
    height: 30,
    width: 30,
    alignItems: 'center'
  },
  pickerText: {
    fontFamily: 'Pxlvetica',
    color: '#fff',
  },
  unavailable: {
    opacity: 0.4
  }
})

//    fontFamily: 'PressStart2P',