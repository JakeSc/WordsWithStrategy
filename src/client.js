/**
  * Copyright (c) 2012 Ivo Wetzel.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */

Tile = Class(function() {

});

/*global Class, Maple */
var Test = Class(function() {
    Maple.Client(this, 30, 60);

}, Maple.Client, {

    started: function() {
        this.log('Client started');
    },

    update: function(t, tick) {
        // this.log('update');
    },

    render: function(t, dt, u) {
        // this.log('render');
    },

    stopped: function() {
        this.log('Stopped');
    },

    connected: function() {
        console.log('Connection established');
    },

    message: function(type, tick, data) {
        this.log('Message received:', type, data);
        if (!type || !data[0])
            return;
        if (type == 'clientInfo') {
            this._clientID = data[0];
            $('#clientInfo').html(this._clientID);
        } else if (type == 'board') {
            if (data[0]) {
                this._buildBoard(data[0]);
                this._initGame();
            }
        } else if (type == 'moveResponse') {
            $('#submit').removeClass('loading');
            this.log(data[0]);
            $('.tile').css('visibility', 'visible');
            $('#submit').css('visibility', 'hidden');
            $('#entry').html('');
            if (data[0] == '0') {
                $('#message').html('Invalid submission').addClass('bad').removeClass('good');
            } else if (data[0] == '1') {
                $('#message').html('Accepted').addClass('good').removeClass('bad');
            }
        } else if (type == 'boardUpdate') {
            this._updateBoard(data[0]);
        }
        this.log('Type: '+ type);
    },

    syncedMessage: function(type, tick, data) {
        //this.log('Synced message received:', type, data);
    },

    closed: function(byRemote, errorCode) {
        this.log('Connection closed:', byRemote, errorCode);
    },


    _board: [],
    _boardWidth: 0,
    _boardHeight: 0,

    _canvasHeight: 0,
    _canvasWidth: 0,

    _currentEntry: [],

    // Initial board/DOM construction
    _buildBoard: function(boardString) {
        this._parseFullBoardString(boardString);
        this._drawBoard();
        this.log(this._board);
    },

    // Updating board state on page
    _updateBoard: function(boardString) {
        var boardArray = boardString.split('');
        this._parseBoardArray(boardArray);
        this._updateBoardColors();
    },

    _parseFullBoardString: function(boardString) {
        var arr = boardString.split(' ');
        this._boardWidth = parseInt(arr.shift());
        this._boardHeight = parseInt(arr.shift());

        arr = arr.shift().split('');

        this._parseBoardArray(arr);
    },

    // Build this._board and this._boardColors arrays
    _parseBoardArray: function(boardArray) {
        var board = [];
        var boardColors = []

        this.log('boardArray: '+ boardArray);
        for (var y=0; y < this._boardHeight; y++) {
            board[y] = [];
            boardColors[y] = [];
            for (x=0; x < this._boardWidth; x++) {
                // board[y] = arr.splice(0, this._boardWidth);
                var index = y * this._boardWidth + x;
                board[y][x] = boardArray.shift();
                boardColors[y][x] = boardArray.shift();
            }
        }

        this._board = board;
        this._boardColors = boardColors;

        this.log('Colors: '+ this._boardColors);
    },

    _updateBoardColors: function() {
        for (y=0; y < this._boardHeight; y++) {
            for (x=0; x < this._boardWidth; x++) {
                var index = y * this._boardWidth + x;
                var tileOwner = this._boardColors[y][x];  // The clientID of the owner of that tile
                var colorClass = (tileOwner == this._clientID) ? 'mine' : 'theirs';
                colorClass = (tileOwner == 0) ? 'neutral' : colorClass;
                // console.log('Color '+ index +': '+ this._boardColors[y][x]);
                $('#tile'+ index).removeClass('neutral').removeClass('mine').removeClass('theirs').addClass(colorClass);
            }
        }
    },

    _drawBoard: function() {
        var table = $('<table id="board"></table>');
        for (var y=0; y < this._boardHeight; y++) {
            var row = $('<tr></tr>');
            for (var x=0; x < this._boardWidth; x++) {
                var index = y * this._boardWidth + x;
                var td = $('<td class="tile" data-index="'+index+'">'+this._board[y][x]+'</td>');
                td.attr('id', 'tile'+ index);
                td.css('width', 100/this._boardWidth+'%');
                td.css('height', 100/this._boardHeight+'%');
                row.append(td);
            }
            table.append(row);
        }
        $('#game').prepend(table);
    },

    _initGame: function() {
        var that = this;
        $('.tile').click(function() {
            $('#submit').css('visibility', 'visible');
            $('#entry').append($(this).clone().css('width', 'inherit'));
            $('#message').html('').removeClass('good').removeClass('bad');
            this.style.visibility = 'hidden';
            that._currentEntry.push($(this).attr('data-index'));
        });
        $('#entry').keypress(function(event) {
            if (event.which == 13) {

            }
        });
        $('#submit').click(function(event) {
            that._submitEntry();
        });

        this._currentEntry = [];
    },

    _submitEntry: function() {
        this.send('move', [this._currentEntry.join(',')]);
        this._currentEntry = [];
        $('#submit').addClass('loading');
    }

});

var client = new Test();
// client.connect('jake.jit.su', 80);
client.connect('localhost', 80);

