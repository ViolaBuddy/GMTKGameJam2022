"use strict";

function createEnum(values) {
	const enumObject = {};
	for (var i=0; i<values.length; i++) {
		enumObject[i] = values[i];
		enumObject[values[i]] = values[i];
	}
	enumObject.length = values.length;
	return Object.freeze(enumObject);
}

const MovementRanges = createEnum(['King', 'Rook', 'Bishop', 'Ferz', 'Wazir', 'Alfil', 'Dabbaaba', 'Knight']);

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
		console.log(newValueIndex);
		this.value = MovementRanges[newValueIndex];
		// this.dieImage.innerText = this.value;
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
	static NUM_ROWS = 6;
	static NUM_COLS = 9;
	static INITIAL_PIECE_POSITIONS = {
		"0": [[0, 0], [2, 0], [4, 0]],
		"1": [[1, 8], [3, 8], [5, 8]]
	};

	constructor(){
		this.domElements_tiles = new Array(Board.NUM_ROWS);
		this.domElement = document.createElement('table')
		this.domElement.classList.add('board_table');

		// set up board tiles
		for (var y = 0; y < Board.NUM_ROWS; y++) {
			this.domElements_tiles[y] = new Array(Board.NUM_COLS);

			let thisTR = document.createElement('tr');
			thisTR.id = 'board_row_' + y;
			this.domElement.appendChild(thisTR);

			for (var x = 0; x < Board.NUM_COLS; x++) {
				let thisTD = document.createElement('td');
				thisTD.id = 'board_cell_' + y + '_' + x;
				thisTD.classList.add('board_cell');
				thisTR.appendChild(thisTD);

				this.domElements_tiles[y][x] = thisTD;
			}
		}

		this.pieces = {};
		// set up player pieces on these tiles
		for (const [player, positions] of Object.entries(Board.INITIAL_PIECE_POSITIONS)){
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