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


var ERROR_ALREADY_PLAYED    =   -1;
var ERROR_NOT_IN_DICTIONARY =   -2;
var WORD_ACCEPTED   =   1;


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
            if (data.length < 2) {
                return;
            }
                this._buildBoard(data[0]);
                this._updatePointTotals(data[1]);
                this._initGame();
        } else if (type == 'moveResponse') {
            if (data.length < 2) return;
            $('#submit').removeClass('loading');

            this._handleMoveResponse(data[0], parseInt(data[1]));

        } else if (type == 'gameUpdate') {
            if (data.length < 4) return;
            this._updateGame(data[2], data[3]);
            var playerID = data[0];
            if (playerID != this._clientID)
                this._setFeedback('Client ' + playerID + ' played word: <strong>' + data[1] + '</strong>', 'info');
            this.log(this._pointTotals);
        } else if (type == 'gameOver') {
            alert('Nice job, smarty-pants: '+ data[0]);
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
    _pointTotals: {},


    _updateGame: function(boardString, pointsString) {
        this._updateBoard(boardString);
        this._updatePointTotals(pointsString);
    },

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

    _updatePointTotals: function(pointsString) {
        // pointsString is like  0:12,1:6,2:7
        this._pointTotals = {};
        var pointsArray = pointsString.split(',');
        for (i in pointsArray) {
            var clientPoints = pointsArray[i].split(':');
            var clientID = parseInt(clientPoints[0]);
            this._pointTotals[clientID] = clientPoints[1];

            if (clientID != '0') {
                var pointContainer = $('#pointTotals');
                var playerPoints = $(pointContainer.children('.player.' + clientID));
                if (playerPoints.length == 0) {
                    playerPoints = $('<div class="player"> <div class="playerID"></div><div class="playerPoints"></div> </div>');
                    playerPoints.addClass(clientID + '');

                    if (parseInt(clientID) === parseInt(this._clientID)) {
                        playerPoints.children('.playerID').addClass('mine');
                    } else {
                        playerPoints.children('.playerID').addClass('theirs');
                    }
                    pointContainer.append(playerPoints);
                }
                playerPoints.children('.playerID').html(clientID);
                playerPoints.children('.playerPoints').html(clientPoints[1]);
            }
        }

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
        this._pointTotals = {};

        this.log('boardArray: '+ boardArray);
        for (var y=0; y < this._boardHeight; y++) {
            board[y] = [];
            boardColors[y] = [];
            for (x=0; x < this._boardWidth; x++) {
                // board[y] = arr.splice(0, this._boardWidth);
                var index = y * this._boardWidth + x;
                board[y][x] = boardArray.shift();
                var clientID =  boardArray.shift();
                boardColors[y][x] = clientID;

                if (typeof this._pointTotals[clientID] != 'number')
                    this._pointTotals[clientID] = 0;
                this._pointTotals[clientID]++;
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
                this._pointTotals 
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
        this._updateBoardColors();
    },

    _initGame: function() {
        var that = this;
        $('.tile').click(function() {
            $('#submit').css('visibility', 'visible');
            $('#entry').append($(this).clone().css('width', 'inherit'));
            that._clearFeedback();
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

    _clearFeedback: function() {
        $('#message').html('').removeClass('good').removeClass('bad').hide();
    },

    _setFeedback: function(text, goodBad) {
        $('#message').attr('class', goodBad);
        $('#message').html(text).show();
    },

    _submitEntry: function() {
        this.send('move', [this._currentEntry.join(',')]);
        this._currentEntry = [];
        $('#submit').addClass('loading');
    },

    _handleMoveResponse: function(word, response) {
        this.log('Move response: ' + response);
        $('.tile').css('visibility', 'visible');
        $('#submit').css('visibility', 'hidden');
        $('#entry').html('');

        switch (response) {
            case WORD_ACCEPTED:
                this._setFeedback('You played <strong>'+ word +'</strong>', 'good');
                break;
            case ERROR_NOT_IN_DICTIONARY:
                this._setFeedback('<strong>'+ word +'</strong> is not in the dictionary.', 'bad');
                break;
            case ERROR_ALREADY_PLAYED:
                this._setFeedback('<strong>'+ word +'</strong> was already played.', 'bad');
                break;
            default:
        }
    }

});

var client = new Test();
// client.connect('jake.jit.su', 80);
client.connect('localhost', 80);

