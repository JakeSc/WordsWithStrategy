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
var Maple = require('../Maple');
var $ = require('jQuery');
var Lazy = require('Lazy');
var fs = require('fs');

var BOARD_WIDTH = 3;
var BOARD_HEIGHT = 3;

var ERROR_ALREADY_PLAYED = -1;
var ERROR_NOT_IN_DICTIONARY = -2;
var WORD_ACCEPTED = 1;


// Test -----------------------------------------------------------------------
var TestServer = Maple.Class(function(clientClass) {

    Maple.Server(this, clientClass, [
        'echo',
        'board',            // Initial board, like 4 4 M0S0B0R0K0E0N0L0E0S0O0V0A0Y0F0T0
        'gameUpdate',       // Broadcast for when someone makes a move
        'clientInfo',
        'move',
        'moveResponse',
        'gameOver'
    ]);

}, Maple.Server, {

    started: function() {
        this.log('Started');
        this._populateWordList();
        this._generateBoard(this._boardWidth, this._boardHeight);
        this._pointTotals = {};
    },

    update: function(t, tick) {
        if (tick % 500 === 0) {
            this.broadcast('echo', ['Server', tick, this.getRandom()]);
        }
    },

    stopped: function() {
        this.log('Stopped');
    },

    connected: function(client) {
        this.log('Client has connected:', client.id, client.isBinary);

        this._pointTotals[client._conn.clientId] = 0;
        this._serializePointTotals();

        client.send('clientInfo', [client._conn.clientId]);
        client.send('board', [this._boardWidth + ' ' + this._boardHeight + ' ' + this._serializedBoard, this._serializedPointTotals]);
    },

    message: function(client, type, tick, data) {
        this.log('New Message received:', client._conn.clientId, type, data);
        if (type === 'move' && data[0]) {
            var playerID = client._conn.clientId;
            var moveResult = this._makeClientMove(playerID, data[0]);

            client.send('moveResponse', [this._lastWordAttempted, moveResult]);

            switch (moveResult) {
                case WORD_ACCEPTED:
                    this.broadcast('gameUpdate', [playerID, this._lastWordPlayed, this._serializedBoard, this._serializedPointTotals]);
                    break;
                case ERROR_ALREADY_PLAYED:
                    break;
                case ERROR_NOT_IN_DICTIONARY:
                    break;
                default:
            }

            var winnerID = this._isGameOver();
            if (winnerID != 0) {
                this.broadcast('gameOver', [winnerID]);
            }

        }
    },

    requested: function(req, res) {
        this.log('HTTP Request');
    },

    disconnected: function(client) {
        this.log('Client has disconnected:', client.id);
    },


    _board: [],
    _boardWidth: BOARD_WIDTH,
    _boardHeight: BOARD_HEIGHT,
    _serializedBoard: '',
    _serializedPointTotals: '',
    _boardColors: [],

    _availableWords: [],
    _playedWords: [],
    _lastWordPlayed: '',
    _lastWordAttempted: '',
    _pointTotals: {},

    _serializeGame: function() {
        this._serializeBoard();
        this._serializePointTotals();
    },

    _serializeBoard: function() {
        var string = '';

        // for (y=0; y < this._boardHeight; y++) {
        //     string += this._board[y].join('');
        // }
        // for (i=1; i < this._boardHeight * this._boardWidth * 2; i += 2) {
        //     string[i] = '_'
        // }
        this._pointTotals = {0: 0};
        for (y=0; y < this._boardHeight; y++) {

            for (x=0; x < this._boardWidth; x++) {
                string += this._board[y][x];
                var clientID = this._boardColors[y][x];
                string += clientID;

                if (typeof this._pointTotals[clientID] != 'number')
                    this._pointTotals[clientID] = 0;
                this._pointTotals[clientID]++;
            }
        }

        this.log('Serialized: '+ string);

        this._serializedBoard = string;
    },

    _serializePointTotals: function() {
        var string = '';

        for (var clientID in this._pointTotals) {
            string += clientID + ':' + this._pointTotals[clientID] + ',';
        }
        string = string.substring(0, string.length-1);  // Kill that last comma

        this._serializedPointTotals = string;
    },

    _generateBoard: function(width, height) {

        var letters = [];
        var numVowels = Math.floor(Math.random()*4) + 4; // 4..8

        for (i=0; i < width*height - numVowels; i++) {
            letters.push(this._randomConsonant());
        }
        for (i=0; i < numVowels; i++) {
            letters.push(this._randomVowel());
        }

        // Shuffle
        letters.sort(function() { return 0.5 - Math.random();});

        this._board = [];
        
        for (y=0; y < height; y++) {
            this._board[y] = [];
            this._boardColors[y] = [];

            for (x=0; x < width; x++) {
                this._board[y][x] = letters.pop();
                this._boardColors[y][x] = 0;
            }
        }

        this.log(this._board);

        this._serializeBoard();
    },

    _randomLetter: function() {
        return String.fromCharCode(Math.floor(Math.random()*26 + 'A'.charCodeAt()));
    },
    _randomConsonant: function() {
        var letters = 'BCDFGHJKLMNPQRSTVWXYZTHNRDSF';
        return letters.charAt(Math.floor(Math.random()*letters.length));
    },
    _randomVowel: function() {
        var letters = 'AAEEIOU';
        return letters.charAt(Math.floor(Math.random()*letters.length));
    },

    _makeClientMove: function(clientID, letterIndexes) {
        letterIndexes = letterIndexes.split(',');

        this.log('letterIndexes: '+ letterIndexes);
        this.log('board: '+ this._serializedBoard);

        var letters = [];

        for (var i=0; i < letterIndexes.length; i++) {
            var boardIndex = letterIndexes[i];
            var y = Math.floor(boardIndex / this._boardWidth);
            var x = boardIndex % this._boardWidth;
            //this.log('['+ boardIndex +']: ['+ y +', '+ x +']');
            letters.push(this._board[y][x]);
        }

        this.log("Client just played: " + letters);

        word = letters.join('');
        this._lastWordAttempted = word;

        if (this._alreadyPlayedWord(word)) {
            this.log('Already played');
            return ERROR_ALREADY_PLAYED;
        }
        if (!this._wordInDictionary(word)) {
            this.log('Not in dictionary');
            return ERROR_NOT_IN_DICTIONARY;
        }

        this._lastWordPlayed = word;

        for (var i=0; i < letterIndexes.length; i++) {
            var boardIndex = letterIndexes[i];
            var y = Math.floor(boardIndex / this._boardWidth);
            var x = boardIndex % this._boardWidth;
            this._boardColors[y][x] = clientID;
        }


        this._playedWords.push(word);
        this.log(this._playedWords);

        this._serializeGame();

        return WORD_ACCEPTED;
    },

    _alreadyPlayedWord: function(word) {
        return ($.inArray(word, this._playedWords) != -1);
    },

    _wordInDictionary: function(word) {
        console.log('Searching for word: '+ word);
        if (this._availableWords.length == 0) {
            this.log("Empty wordlist");
            return false;
        }
        return ($.inArray(word.toLowerCase(), this._availableWords) != -1);
    },

    // Returns 0 or the ID of the winner. Expects serialized pointTotals.
    _isGameOver: function() {
        if (this._pointTotals[0] == 0) {
            // Game over. Find winner.
            var winnerID = 0;
            for (var i in this._serializedPointTotals) {
                if (this._serializedPointTotals[i] > this._serializedPointTotals[winnerID]) {
                    winnerID = i;
                }
            }
            return winnerID;
        }

        return 0;
    },

    _populateWordList: function() {
        var that = this;
        // this._availableWords = [];
        new Lazy(fs.createReadStream('lib/enable.txt'))
            .lines
            .forEach(function(line) { 
                that._availableWords.push(line.toString().trim());
            })
            .join(function(a) {
                that.log('Read wordlist of '+ that._availableWords.length +' words.');
            });
    }

});


var TestClient = Maple.Class(function(server, conn, isBinary) {
    Maple.ServerClient(this, server, conn, isBinary );

}, Maple.ServerClient, {

    message: function(type, tick, data) {
        console.log('Client got message:', type, tick, data);
    }

});


var srv = new TestServer(TestClient);
srv.start({
    port: 80,
    logicRate: 100 // only update logic every 10 ticks
});

