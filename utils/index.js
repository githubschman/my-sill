export const createStageArr = (startTime, sub) => {
    return [(startTime + sub), (startTime + (sub * 2)), (startTime + (sub * 3)), (startTime + (sub * 4)), (startTime + sub * 5)];   
}

export const decreaseInventory = (item, props, userRef) => {
    props.user_inventory[item.name].amount = props.user_inventory[item.name].amount - 1;
    if(props.user_inventory.Hoe) {
       delete props.user_inventory.Hoe;
    }
    userRef.update({user_inventory: props.user_inventory});
}

export const sillType = (temp, sun) => {
    
    // FOR AM OR PM SILLS
    let date = new Date();
    let fulltime = date.toLocaleString('en-US', { hour: 'numeric', hour12: true });
    let time = fulltime.split(' ');
    let h = Number(time[0]);
    let a = time[1];
    let pm = (a === 'PM' && (h > 6 && h < 12)) || (a === 'AM' && h < 6) || (a === 'AM' && h === 12);

    let str = 'default';
    let rainWords = ['rain', 'drizzle', 'snow'];
    if (sun && temp) {
        let precip = rainWords.reduce((acc, rain) => {
            return acc || sun.includes(rain);
        }, false);

        if (precip && temp <= 32) {
            str = 'snow';
        } else if (precip && temp > 32) {
            str = 'rain';
        }
    }
    
    if (pm) {
        str += '-night';
    }

    return str;
}
