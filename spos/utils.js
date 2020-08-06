/*
SPOS - Small Payload Object Serializer
Copyright (C) 2020 Luiz Eduardo Amaral <luizamaral306@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
