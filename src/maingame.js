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

const MovementRanges = createEnum(['Ferz', 'Wazir', 'Alfil', 'Dabbaaba', 'HKnight', 'VKnight']);
function getOffsetFromMovementRanges(mv) {
	switch(mv){
		case MovementRanges.Ferz:
			return [[1,1],[1,-1],[-1,1],[-1,-1]];
		case MovementRanges.Wazir:
			return [[1,0],[-1,0],[0,1],[0,-1]];
		case MovementRanges.Alfil:
			return [[2,2],[2,-2],[-2,2],[-2,-2]];
		case MovementRanges.Dabbaaba:
			return [[2,0],[-2,0],[0,2],[0,-2]];
		case MovementRanges.HKnight:
			return [[1,2],[1,-2],[-1,2],[-1,-2]];
		case MovementRanges.VKnight:
			return [[2,1],[2,-1],[-2,1],[-2,-1]];
		default:
			return null;
	}
}


class Die {
	constructor(value=null){
		if(value===null){
			this.value = MovementRanges[0];
		} else {
			this.value = value;
		}

		this.isDisabled = false;

		this.domElement = document.createElement('div');
		this.domElement.classList.add('die');
		this.domElement.innerHTML = this.value;
		// this.domElement.appendChild(this.dieImage);
	}

	roll(){
		let newValueIndex = Math.floor(Math.random() * MovementRanges.length);
		this.value = MovementRanges[newValueIndex];
		// this.dieImage.textContent = this.value;
		this.domElement.innerHTML = this.value;
	}

	disable(){
		this.isDisabled = true;
		this.domElement.onclick = null;

		this.domElement.innerHTML = this.value + ' (used)';
		// this.domElement.appendChild(this.dieImage);
	}

	enable(fnc){
		this.isDisabled = false;
		this.domElement.onclick = fnc;
		
		this.domElement.innerHTML = this.value;
		// this.domElement.appendChild(this.dieImage);
	}
}

class Piece {
	constructor(playerNumber=0){
		this.playerNumber = playerNumber;
		this.row = null;
		this.col = null;

		this.domElement = document.createElement('div');
		// this.dieImage = document.createTextNode(this.value);
		this.domElement.innerHTML = "Player " + this.playerNumber + "'s piece";
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

	/** piece is a Piece that is already in this.pieces, destination is [y, x] */
	movePieceTo(piece, destination, checkWinFunction){
		// handle captures, if any
		let thisThis = this; // for scoping
		let capturedPieceIndex = null;
		this.pieces[(+piece.playerNumber+1)%2].forEach(function(opposingPiece, i){
			if(opposingPiece.row === destination[0] && opposingPiece.col === destination[1]){
				thisThis.domElements_tiles[destination[0]][destination[1]].removeChild(opposingPiece.domElement);
				opposingPiece.row = null;
				opposingPiece.col = null;
				capturedPieceIndex = i;
			}
		});
		// inelegant way of removing a captured piece only if the above forEach finds something to capture
		if(capturedPieceIndex !== null){
			this.pieces[(+piece.playerNumber+1)%2].splice(capturedPieceIndex, 1);
			checkWinFunction();
		}

		// then actually move the current piece
		this.domElements_tiles[destination[0]][destination[1]].appendChild(piece.domElement);
		piece.row = destination[0];
		piece.col = destination[1];
	}

	/** make this tile clickable */
	makeClickablePiece(row, col, fnc) {
		this.domElements_tiles[row][col].classList.add('clickable_piece');
		this.domElements_tiles[row][col].onclick = fnc;
	}

	/** make this target clickable */
	makeClickableTarget(row, col, fnc) {
		this.domElements_tiles[row][col].classList.add('clickable_target');
		this.domElements_tiles[row][col].onclick = fnc;
	}

	/** make this target no longer clickable */
	clearClickable(row, col) {
		this.domElements_tiles[row][col].classList.remove('clickable_piece');
		this.domElements_tiles[row][col].classList.remove('clickable_target');
		this.domElements_tiles[row][col].onclick = null;
	}

	/** make everything no longer clickable except for this tile */
	clearAllClickableExcept(row, col) {
		// set up board tiles
		for (let y = 0; y < this.numRows; y++) {
			for (let x = 0; x < this.numCols; x++) {
				if (row === y && col === x){
					// do nothing
				} else{
					this.clearClickable(y, x);
				}
			}
		}
	}

	/** make everything no longer clickable */
	clearAllClickable() {
		// set up board tiles
		for (let y = 0; y < this.numRows; y++) {
			for (let x = 0; x < this.numCols; x++) {
				this.clearClickable(y, x);
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

class AlertOverlay {
	/** the parameter domElement is the empty div that AlertOverlay will populate/use */
	constructor(domElement){
		this.domElement = domElement;
		this.messageTextDomElement = document.createElement('h2');
		this.domElement.appendChild(this.messageTextDomElement);

		this.domElement.appendChild(document.createElement('br'));

		// formatted as an .actionbutton but not actually an instance of the ActionButton class
		this.closeButtonDomElement = document.createElement('button');
		this.closeButtonDomElement.type = 'button';
		this.closeButtonDomElement.classList.add('actionbutton');
		this.domElement.appendChild(this.closeButtonDomElement);

		this.hide();
	}

	alert(message, closeButtonTxt, closeButtonFnc) {
		this.active = true;
		this.domElement.style.display = '';
		this.messageTextDomElement.textContent = message;

		this.closeButtonDomElement.textContent = closeButtonTxt;
		this.closeButtonDomElement.onclick = closeButtonFnc;
	}

	hide() {
		this.active = false;
		this.domElement.style.display = 'none';
	}
}

class GameInstance {
	static NUM_ROWS = 5;
	static NUM_COLS = 8;
	static NUM_DICE = 3;

	// // for testing
	// static INITIAL_PIECE_POSITIONS = {
	// 	'0': [[0, 2]],
	// 	'1': [[0, 5]]
	// };

	static INITIAL_PIECE_POSITIONS = {
		'0': [[0, 0],[1, 0],[2, 0],[3, 0],[4, 0]],
		'1': [[0, 7],[1, 7],[2, 7],[3, 7],[4, 7]]
	};

	/** arguments are the divs where this constructor will place the visual elements  */
	constructor(boardLocation, diceLocation, alertLocation){
		this.playerTurn = 0;
		this.chosenDie = null;
		this.activePiece = null;

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
			// {'text': 'Roll Dice!', 'fnc': function(clickEvent){thisThis.rollDice();} },
			{'text': '\xa0' /*&nbsp*/ , 'fnc': function(clickEvent){}}, // janky way to disable clicking
			{'text': 'End Turn!', 'fnc': function(clickEvent){thisThis.changePlayer();} }
		]);
		this.rollDiceButton.changeState(1);
		diceLocation.appendChild(this.rollDiceButton.domElement);

		this.dice = new Array(GameInstance.NUM_DICE);
		for(let i=0; i < GameInstance.NUM_DICE; i++) {
			this.dice[i] = new Die();
			diceLocation.appendChild(this.dice[i].domElement);
		}
		this.disableAllDice();

		// set up alert overlay
		this.alertOverlay = new AlertOverlay(alertLocation);

		// any initial function calls
		this.changePlayer(0);
	}

	rollDice() {
		let thisThis = this; // for scoping
		this.dice.forEach(function(d){
			d.roll();
			d.enable(function(clickEvent){
				thisThis.chosenDie = d.value;
				d.disable();
				thisThis.enableClickablePieces();
			});
		});
		this.rollDiceButton.changeState();
	}

	disableAllDice(){
		this.dice.forEach(function(d){
			d.disable();
		});
	}

	changePlayer(playerTurn=null){
		let thisThis = this; // for scoping
		this.board.clearAllClickable();

		if(playerTurn === null){
			this.disableAllDice();
			this.playerTurn = (this.playerTurn+1) % 2; // probably unnecessarily complicated way of swapping between player 0 and 1
		} else {
			this.playerTurn = playerTurn;
		}
		this.playerTurnText.textContent = 'Player ' + this.playerTurn + '\'s Turn';

		this.rollDiceButton.changeState();
		this.alertOverlay.alert(
			'Player ' + this.playerTurn + '\'s Turn',
			'Roll Dice!',
			function(clickEvent){
				thisThis.rollDice();
				thisThis.alertOverlay.hide();
			}
		);
	}

	enableClickablePieces(){
		let thisThis = this; // for scoping
		for(let piece of this.board.pieces[this.playerTurn]){
			this.board.makeClickablePiece(piece.row, piece.col, function(clickEvent){
				thisThis.board.clearAllClickableExcept(piece.row, piece.col);
				thisThis.activePiece = piece;
				thisThis.enableClickableTargets();
			})
		}
	}

	/** this.chosenDie and this.activePiece must not be null */
	enableClickableTargets(){
		let offsets = getOffsetFromMovementRanges(this.chosenDie);
		let final_coordinates = offsets.map(offset =>
			[offset[0]+this.activePiece.row, offset[1] + this.activePiece.col]
		).filter(coordinates =>
			// make sure we're not off the edge of the map...
			coordinates[0] >= 0 && coordinates[0]< GameInstance.NUM_ROWS &&
			coordinates[1] >= 0 && coordinates[1]< GameInstance.NUM_COLS &&
			// ...and also that none of the friendly pieces are in the way
			this.board.pieces[this.playerTurn].every(friendlyPiece =>
				!(coordinates[0]===friendlyPiece.row && coordinates[1]===friendlyPiece.col)
			)
		);

		let thisThis = this; // for scoping
		for(let final_coordinate of final_coordinates) {
			this.board.makeClickableTarget(final_coordinate[0], final_coordinate[1], function(clickEvent){
				thisThis.board.movePieceTo(thisThis.activePiece, final_coordinate, thisThis.checkWin.bind(thisThis));
				thisThis.board.clearAllClickable();
			});
		}
	}

	checkWin(){
		for(const [player, playerpieces] of Object.entries(this.board.pieces)) {
			if (playerpieces.length === 0){
				this.alertOverlay.alert(
					'Player ' + ((+player+1)%2) + ' won!',
					'Roll Dice!',
					function(clickEvent){}
				);
				// Disable all the other buttons
				this.board.clearAllClickable();
				this.rollDiceButton.changeState(0);
				this.disableAllDice();
				this.alertOverlay.closeButtonDomElement.disabled = true;
			}
		}
	}
}