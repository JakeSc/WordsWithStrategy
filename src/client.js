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

/*global Class, Maple */
var Test = Class(function() {
    Maple.Client(this, 30, 60);

}, Maple.Client, {

    started: function() {
        this.log('Client started');
    },

    update: function(t, tick) {
        //this.log('Running');
    },

    render: function(t, dt, u) {

    },

    stopped: function() {
        this.log('Stopped');
    },

    connected: function() {
        console.log('Connection established');
    },

    message: function(type, tick, data) {
        this.log('Message received:', type, data);
        if (data[0] && data[0] == 'board') {
            if (data[1]) {
                this._updateBoard(data[1]);
                this._initGame();
            }
        }
    },

    syncedMessage: function(type, tick, data) {
        this.log('Synced message received:', type, data);
    },

    closed: function(byRemote, errorCode) {
        this.log('Connection closed:', byRemote, errorCode);
    },


    _board: [],
    _boardWidth: 0,
    _boardHeight: 0,

    _canasHeight: 0,
    _canvasWidth: 0,

    _updateBoard: function(boardString) {
        this._board = this._parseBoardString(boardString);
        this._drawBoard();
        this.log(this._board);
    },

    _parseBoardString: function(boardString) {
        var arr = boardString.split(' ');
        this._boardWidth = parseInt(arr.shift());
        this._boardHeight = parseInt(arr.shift());
        var board = [];

        arr = arr.shift().split('');
        for (var y=0; y < this._boardHeight; y++) {
            board[y] = arr.splice(0, this._boardWidth);
        }

        return board;
    },

    _drawBoard: function() {
        this._canvasHeight = 400;
        this._canvasWidth = 400;
        var canvas = $('<canvas id="board" width="'+this._canvasWidth+'" height="'+this._canvasHeight+'"></canvas>')[0];
        var context = canvas.getContext('2d');

        var boxWidth = this._canvasWidth / this._boardWidth;
        var boxHeight = this._canvasHeight / this._boardHeight;
        var fontSize = 64;
        for (var y=0; y < this._boardHeight; y++) {
            for (var x=0; x < this._boardWidth; x++) {
                var boxX = x * boxWidth + 8.5;
                var boxY = y * boxHeight + 8.5;
                context.fillStyle = 'blue';
                context.strokeStyle = 'black';
                context.lineWidth = 2;
                context.fillRect(boxX, boxY, boxWidth - 14.5, boxHeight - 14.5);
                context.strokeRect(boxX, boxY, boxWidth - 14.5, boxHeight - 14.5);

                context.font = 'bold '+ fontSize +'px sans-serif';
                context.lineWidth = 1;
                context.fillStyle = 'black';
                context.fillText(this._board[y][x], boxX + 35, boxY + 64);
            }
        }

        document.body.appendChild(canvas);
    },

    _initGame: function() {

    }

});

var client = new Test();
client.connect('localhost', 4000);

