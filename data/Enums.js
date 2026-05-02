export const UnitType = Object.freeze({
    SOLDIER: 'SOLDIER',
    RIDER:   'RIDER',
    TANK:    'TANK',
});

export const CellType = Object.freeze({
    NEUTRAL:  'NEUTRAL',
    BONUS_ATK:'BONUS_ATK',
    BONUS_DEF:'BONUS_DEF',
    TRAP:     'TRAP',
    P1_TER:   'P1_TER',
    P2_TER:   'P2_TER',
});

export const GamePhase = Object.freeze({
    PLACEMENT: 'PLACEMENT',
    MOVEMENT:  'MOVEMENT',
    ACTION:    'ACTION',
    FINISHED:  'FINISHED',
});

export const SceneType = Object.freeze({
    LOADING: 'LOADING',
    HOME:    'HOME',
    GAME:    'GAME',
});

export const ActionType = Object.freeze({
    ATTACK:  'ATTACK',
    DEFEND:  'DEFEND',
    CAPTURE: 'CAPTURE',
});