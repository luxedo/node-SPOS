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

module.exports.decoders = {
  decodeBoolean: message => {
    return message == "1";
  },
  decodeBinary: message => {
    return message;
  },
  decodeInteger: (message, block) => {
    return block.settings.offset + parseInt(message, 2);
  },
  decodeFloat: (message, block) => {
    const bits = block.settings.bits;
    const upper = block.settings.upper;
    const lower = block.settings.lower;
    const delta = upper - lower;
    const overflow = Math.pow(2, bits) - 1;
    return (parseInt(message, 2) * delta) / overflow + lower;
  },
  decodePad: message => {
    return message.length;
  },
  decodeArray: (message, block) => {}
};
