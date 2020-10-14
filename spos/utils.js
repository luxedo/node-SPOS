/*
SPOS - Small Payload Object Serializer

MIT License

Copyright (c) 2020 [Luiz Eduardo Amaral](luizamaral306@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const { crc8 } = require("crc");

function crc8Encode(message) {
  hex = "";
  for (let i = 0; i < message.length / 8; i++) {
    hex += parseInt(message.substring(8 * i, 8 * (i + 1)), 2)
      .toString(16)
      .padStart(2, "0");
  }
  return crc8(Buffer.from(hex, "hex")).toString(2).padStart(8, "0");
}

function binToHex(message) {
  let hex = "";
  for (let i = 0; i < message.length / 8; i++) {
    hex += parseInt(message.substring(8 * i, 8 * (i + 1)), 2)
      .toString(16)
      .padStart(2, "0");
  }
  return hex;
}

function hexToBytes(hex) {
  let a = [];
  for (let i = 0, len = hex.length; i < len; i += 2) {
    a.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

function hexToBin(hex) {
  let bin = "";
  for (let i = 0; i < hex.length / 2; i++) {
    bin += parseInt(hex.substring(2 * i, 2 * (i + 1)), 16)
      .toString(2)
      .padStart(8, "0");
  }
  return bin;
}

function bytesToHex(uint8arr) {
  let hexStr = "";
  for (let i = 0; i < uint8arr.length; i++) {
    let hex = (uint8arr[i] & 0xff).toString(16);
    hex = hex.length === 1 ? "0" + hex : hex;
    hexStr += hex;
  }
  return hexStr;
}

module.exports.utils = {
  isNumber: (value) => typeof value === "number" && isFinite(value),
  isString: (value) => typeof value === "string" || value instanceof String,
  isBoolean: (value) => typeof value === "boolean",
  isObject: (value) =>
    Object.prototype.toString.call(value) === "[object Object]",
  isSorted: (array) =>
    array.every((val, idx, arr) => idx === 0 || arr[idx - 1] <= val),
  round2Even: (n) => {
    const round = Math.round(n);
    return n.toString().replace(/.*\./, "") == 5
      ? round % 2 == 1
        ? round - 1
        : round
      : round;
  },
  crc8Encode,
  crc8Validate: (message) =>
    crc8Encode(message.slice(0, -8)) === message.slice(-8),
  binToHex,
  hexToBytes,
  hexToBin,
  bytesToHex,
};
