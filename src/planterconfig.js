export const hour = 3600000;  


export const setUpPlant = (stageArr, item, today, mystery) => { 
  return Object.assign({}, item, {stage_times: stageArr,
                                  mystery: mystery, 
                                  watered: 0, 
                                  survival: today.getTime() + (hour * 24), 
                                  time_growing: item.survival * hour + today.getTime(), 
                                  amount: null})
}

export class Planter {
  constructor(id) {
    this.id = id
  }
  
  hoed = false;
  currentPlant = {
    id: 0,
    name: "",
    watered: 0,
    stage: 0,
    time: 0,
    type : "",
    name : "",
    price : 0,
    level_req : 0,
    survival : 0,
    high: 0,
    low: 0,
    best_sun : "",
    stage : 0,
    total_time : 0,
    time_growing : 0,
    sell_val : 0,
    description : "...",
    weatherCheck: 0
  }
}