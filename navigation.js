function showScreen(screenId){
    const screens = [
        'homescreen',
        'roomSetupScreen',
        'waitingRoomScreen',
        'multiplayerGameScreen',
        'itemShopScreen',
        'gameFinishScreen'
    ]

    screens.forEach(id => {
        const element = document.getElementById(id);
        if(element) {
            element.style.display = 'none';
        }
    });

    const targetElement = document.getElementById(screenId);
    if(targetElement) {
        targetElement.style.display = 'block';
    } else {
        console.error(`Screen with id '${screenId}' not found`) ;
    }
    }

async function startMultiplayerGame(){
    //logic later
}

async function handleNewGame(){
    //logic later
}

document.addEventListener('DOMContentLoaded', ()=> {
    
    showScreen('multiplayerGameScreen');

    //homepage
    const competitiveBtn = document.getElementById('comepetiveMode');
    const customBtn = document.getElementById('customMode');

    if(competitiveBtn){
        competitiveBtn.addEventListener('click', () => showScreen('roomSetupScreen'));
    }

    if(customBtn){
        customBtn.addEventListener('click', () => showScreen('roomSetupScreen'));
    }

    //roomsetup 

    const createRoomBtn = document.getElementById('createRoomConfirm');
    const joinRoomBtn = document.getElementById('joinRoomConfirm');
    const backHomeBtn = document.getElementById('backToHomeFromRoom');

    if(createRoomBtn){
        createRoomBtn.addEventListener('click', ()=> showScreen('waitingRoomScreen'));
    }

    if(joinRoomBtn){
        joinRoomBtn.addEventListener('click', ()=> showScreen('waitingRoomScreen'));
    }

    if(backHomeBtn){
        backHomeBtn.addEventListener('click', ()=> showScreen('homescreen'));
    }


    //waiting room
    const startGameBtn = document.getElementById('startGameBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');

    if(startGameBtn){
        startGameBtn.addEventListener('click', () => showScreen('multiplayerGameScreen'));
    }

    if(leaveRoomBtn){
        leaveRoomBtn.addEventListener('click', ()=> showScreen('roomSetupScreen'));
    }

});