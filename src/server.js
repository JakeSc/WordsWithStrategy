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


// Test -----------------------------------------------------------------------
var TestServer = Maple.Class(function(clientClass) {

    Maple.Server(this, clientClass, [
        'echo'
    ]);

}, Maple.Server, {

    started: function() {
        this.log('Started');
        this.generateBoard(this._boardWidth, this._boardHeight);
    },

    update: function(t, tick) {
        if (tick % 50 === 0) {
            this.broadcast('echo', ['Server', tick, this.getRandom()]);
        }
    },

    stopped: function() {
        this.log('Stopped');
    },

    connected: function(client) {
        this.log('Client has connected:', client.id, client.isBinary);
        client.send('echo', ['board', this._serializedBoard]);
    },

    message: function(client, type, tick, data) {
        this.log('New Message received:', client, type, tick, data);
    },

    requested: function(req, res) {
        this.log('HTTP Request');
    },

    disconnected: function(client) {
        this.log('Client has disconnected:', client.id);
    },


    _board: '',
    _boardWidth: 3,
    _boardHeight: 4,
    _serializedBoard: '',

    _serializeBoard: function() {
        var string = this._boardWidth + ' ' + this._boardHeight + ' ';

        for (y=0; y < this._boardHeight; y++) {
            string += this._board[y].join('');
        }
        return string;
    },

    generateBoard: function(width, height) {

        var letters = [];
        var numVowels = Math.floor(Math.random()*4) + 3; // 3..7

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

            for (x=0; x < width; x++) {
                this._board[y][x] = letters.pop();
            }

        }

        this.log(this._board);

        this._serializedBoard = this._serializeBoard();
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
    port: 4000,
    logicRate: 10 // only update logic every 10 ticks
});

