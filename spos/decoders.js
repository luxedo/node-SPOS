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

const decoders = {
  decodeBoolean: message => {
    return message == "1";
  },
  decodeBinary: message => {
    return message;
  },
  decodeInteger: (message, block) => {
    return block.offset + parseInt(message, 2);
  },
  decodeFloat: (message, block) => {
    const bits = block.bits;
    const upper = block.upper;
    const lower = block.lower;
    const delta = upper - lower;
    const overflow = Math.pow(2, bits) - 1;
    return (parseInt(message, 2) * delta) / overflow + lower;
  },
  decodePad: message => {
    return message.length;
  },
  decodeArray: (message, block, decodeMessage) => {
    const length = decoders.decodeInteger(message.substring(0, block.bits), {
      bits: block.bits,
      offset: 0
    });
    items = [];
    for (let i = 0; i < length; i++) {
      items.push(block.blocks);
    }
    if (length > 0) {
      return decodeMessage(message.substring(block.bits), items);
    }
    return [];
  },
  decodeObject: (message, block, decodeMessage) => {
    const values = decodeMessage(message, block.items);
    return Object.fromEntries(
      new Map(
        values.map((value, idx) => {
          return [block.items[idx]["key"], value];
        })
      )
    );
  },
  decodeString: (message, block, alphabeth) => {
    return new Array(message.length / 6)
      .fill(0)
      .map((_, i) => message.substring(6 * i, 6 * (i + 1)))
      .map(message => decoders.decodeInteger(message, { bits: 6, offset: 0 }))
      .map(index =>
        index in block.custom_alphabeth
          ? block.custom_alphabeth[index]
          : alphabeth[index]
      )
      .join("");
  },
  decodeSteps: (message, block) => {
    const bits = Math.ceil(Math.log(block.steps_names.length, 2));
    value = decoders.decodeInteger(message, { bits: bits, offset: 0 });
    return block.steps_names[value];
  },
  decodeCategories: (message, block) => {
    let categories = block.categories;
    categories.push("error");
    const bits = Math.ceil(Math.log(categories.length, 2));
    const value = decoders.decodeInteger(message, { bits: bits, offset: 0 });
    return categories[value];
  }
};

module.exports.decoders = decoders;
