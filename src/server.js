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

// Test -----------------------------------------------------------------------
var TestServer = Maple.Class(function(clientClass) {

    Maple.Server(this, clientClass, [
        'echo',
        'board',            // Initial board, like 4 4 M0S0B0R0K0E0N0L0E0S0O0V0A0Y0F0T0
        'boardUpdate',      // Broadcast for when someone makes a move
        'clientInfo',
        'move',
        'moveResponse'
    ]);

}, Maple.Server, {

    started: function() {
        this.log('Started');
        this.generateBoard(this._boardWidth, this._boardHeight);
        // this._clientIndex = 0;
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
        client.send('clientInfo', [client._conn.clientId]);
        client.send('board', [this._boardWidth + ' ' + this._boardHeight + ' ' + this._serializedBoard]);
    },

    message: function(client, type, tick, data) {
        this.log('New Message received:', client._conn.clientId, type, data);
        if (type === 'move' && data[0]) {
            var moveIsValid = this._makeClientMove(client._conn.clientId, data[0]);

            if (moveIsValid) {
                client.send('moveResponse', ['1']);
                this.broadcast('boardUpdate', [this._serializedBoard]);
            } else {
                client.send('moveResponse', ['0']);
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
    _boardWidth: 4,
    _boardHeight: 8,
    _serializedBoard: '',
    _boardColors: [],

    _playedWords: [],

    _serializeBoard: function() {
        var string = '';

        // for (y=0; y < this._boardHeight; y++) {
        //     string += this._board[y].join('');
        // }
        // for (i=1; i < this._boardHeight * this._boardWidth * 2; i += 2) {
        //     string[i] = '_'
        // }

        for (y=0; y < this._boardHeight; y++) {

            for (x=0; x < this._boardWidth; x++) {
                string += this._board[y][x];
                string += this._boardColors[y][x];
            }
        }

        this.log('Serialized: '+ string);

        this._serializedBoard = string;
    },

    generateBoard: function(width, height) {

        var letters = [];
        var numVowels = Math.floor(Math.random()*4) + 4; // 4..8

        for (i=0; i < width*height - numVowels; i++) {
            letters.push(this._randomConsonant());
        }
        for (i=0; i < numVowels; i++) {
            letters.push(this._randomVowel());
        }

        this.log(letters);

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
            this._boardColors[y][x] = clientID;
            letters.push(this._board[y][x]);
        }

        this.log("Client just played: " + letters);

        letters = letters.join('');

        if ($.inArray(letters, this._playedWords) != -1) {
            this.log('already played');
            return false;
        }
        this._playedWords.push(letters);
        this.log(this._playedWords);

        this._serializeBoard();

        return true;
    },

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

