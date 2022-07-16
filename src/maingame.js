"use strict";

function createEnum(values) {
	const enumObject = {};
	for (let i=0; i<values.length; i++) {
		enumObject[i] = values[i];
		enumObject[values[i]] = values[i];
	}
	enumObject.length = values.length;
	return Object.freeze(enumObject);
}

const MovementRanges = createEnum(['King', 'Ferz', 'Wazir', 'Alfil', 'Dabbaaba', 'Knight']);

class Die {
	constructor(value=null){
		if(value===null){
			this.value = MovementRanges.King;
		} else {
			this.value = value;
		}

		this.domElement = document.createElement('div');
		// this.dieImage = document.createTextNode(this.value);
		this.domElement.innerHTML = this.value;
		// this.domElement.appendChild(this.dieImage);
		this.domElement.classList.add('die');
	}

	roll(){
		let newValueIndex = Math.floor(Math.random() * MovementRanges.length);
		this.value = MovementRanges[newValueIndex];
		// this.dieImage.textContent = this.value;
		this.domElement.innerHTML = this.value;
	}
}

class Piece {
	constructor(playerNumber=0){
		this.playerNumber = playerNumber;
		this.row = null;
		this.col = null;

		this.domElement = document.createElement('div');
		// this.dieImage = document.createTextNode(this.value);
		this.domElement.innerHTML = "Player " + playerNumber + "'s piece";
		// this.domElement.appendChild(this.dieImage);
		this.domElement.classList.add('piece');
	}
}

class Board {
	constructor(numRows, numCols, initialPiecePositions){
		this.numRows = numRows;
		this.numCols = numCols;

		this.domElements_tiles = new Array(this.numRows);
		this.domElement = document.createElement('div')
		this.domElement.classList.add('board_table');
		this.domElement.style.gridTemplateColumns = 'repeat('+this.numCols+', 100px [col-start])';
		this.domElement.style.gridTemplateRows = 'repeat('+this.numRows+', 100px [col-start])';
		
		// set up board tiles
		for (let y = 0; y < this.numRows; y++) {
			this.domElements_tiles[y] = new Array(this.numCols);

			for (let x = 0; x < this.numCols; x++) {
				let thisTile = document.createElement('div');
				thisTile.id = 'board_tile_' + y + '_' + x;
				thisTile.classList.add('board_tile');
				this.domElement.appendChild(thisTile);

				this.domElements_tiles[y][x] = thisTile;
			}
		}

		this.pieces = {};
		// set up player pieces on these tiles
		for (const [player, positions] of Object.entries(initialPiecePositions)){
			this.pieces[player] = [];
			for (const pieceposition of positions){
				let thisPiece = new Piece(player);
				this.pieces[player].push(thisPiece);
				thisPiece.row = pieceposition[0];
				thisPiece.col = pieceposition[1];

				this.domElements_tiles[thisPiece.row][thisPiece.col].appendChild(thisPiece.domElement);
			}
		}
	}
}

class ActionButton {
	/** a button that can swap between "roll dice" and "end turn"
	 *  The argument is a list of states with elements in the form
	 * {
	 *    'text': button text
	 *    'fnc': onclick function
	 * }
	 */
	constructor(states){
		this.domElement = document.createElement('button');
		this.domElement.type = 'button';
		this.domElement.classList.add('actionbutton');

		this.currState = 0;
		this.states = states;
		this.changeState(this.currState);
	}

	changeState(newState=null){
		if(newState === null){
			newState = (this.currState+1) % this.states.length;
		}
		this.currState = newState;
		this.domElement.textContent = this.states[this.currState]['text'];
		this.domElement.onclick = this.states[this.currState]['fnc'];
	}
}

class GameInstance {
	static NUM_ROWS = 6;
	static NUM_COLS = 9;
	static NUM_DICE = 3;
	static INITIAL_PIECE_POSITIONS = {
		"0": [[0, 0],[1, 0],[2, 0],[3, 0],[4, 0],[5, 0]],
		"1": [[0, 8],[1, 8],[2, 8],[3, 8],[4, 8],[5, 8]]
	};

	/** arguments are the divs where this constructor will place the visual elements  */
	constructor(boardLocation, diceLocation, captureLocation){
		this.playerTurn = 0;

		// set up board
		this.board = new Board(GameInstance.NUM_ROWS, GameInstance.NUM_COLS, GameInstance.INITIAL_PIECE_POSITIONS);
		boardLocation.appendChild(this.board.domElement);

		// set up dice sidebar
		this.playerTurnText = document.createElement('div');
		this.playerTurnText.style.textAlign = 'center';
		this.playerTurnText.textContent = 'Player ' + this.playerTurn + '\'s Turn';
		diceLocation.appendChild(this.playerTurnText);

		let thisThis = this; // for scoping
		this.rollDiceButton = new ActionButton([
			{'text': 'Roll Dice!', 'fnc': function(clickEvent){thisThis.rollDice();} },
			{'text': 'End Turn!', 'fnc': function(clickEvent){thisThis.changePlayer();} }
		]);
		diceLocation.appendChild(this.rollDiceButton.domElement);

		this.dice = new Array(GameInstance.NUM_DICE);
		for(let i=0; i < GameInstance.NUM_DICE; i++) {
			this.dice[i] = new Die();
			diceLocation.appendChild(this.dice[i].domElement);
		}
	}

	rollDice() {
		this.dice.forEach(function(d){
			d.roll();
		});
		this.rollDiceButton.changeState();
	}

	changePlayer(){
		this.playerTurn = (this.playerTurn+1) % 2; // probably unnecessarily complicated way of swapping between player 0 and 1
		this.playerTurnText.textContent = 'Player ' + this.playerTurn + '\'s Turn';

		this.rollDiceButton.changeState();
	}
}