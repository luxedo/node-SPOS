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

const encoders = {
  encodeBoolean: (value, block) => {
    return value == true ? "1" : "0";
  },
  encodeBinary: (value, block) => {
    value = !(value.replace(/[01]/g, "") == "")
      ? (value = parseInt(value, 16)
          .toString(2)
          .padStart(value.length * 4, "0"))
      : value;
    const bits = block.bits;
    return value.padStart(bits, "0").slice(0, bits);
  },
  encodeInteger: (value, block) => {
    const overflow = Math.pow(2, block.bits) - 1;
    value = Math.min(overflow, Math.max(0, value - block.offset));
    return value.toString(2).padStart(block.bits, "0");
  },
  encodeFloat: (value, block) => {
    const bits = block.bits;
    const upper = block.upper;
    const lower = block.lower;
    const approximation =
      block.approximation == "round"
        ? Math.round
        : block.approximation == "floor"
        ? Math.floor
        : block.approximation == "ceil"
        ? Math.ceil
        : undefined;
    const overflow = Math.pow(2, block.bits) - 1;
    const delta = upper - lower;
    value = (overflow * (value - lower)) / delta;
    value = approximation(Math.min(overflow, Math.max(0, value)));
    return value.toString(2).padStart(block.bits, "0");
  },
  encodePad: (value, block) => {
    return "".padStart(block.bits, "1");
  },
  encodeArray: (value, block, encodeBlock) => {
    let message = "";
    message += encoders.encodeInteger(value.length, {
      bits: block.bits,
      offset: 0
    });
    const maxLength = Math.pow(2, block.bits) - 1;
    for (let i = 0; i < Math.min(value.length, maxLength); i++) {
      message += encodeBlock(value[i], block.blocks);
    }
    return message;
  },
  encodeObject: (value, block, encodeItems) => {
    const values = block.items.map(inner_block => value[inner_block["key"]]);
    return encodeItems(values, block.items).join("");
  },
  encodeString: (value, block, rev_alphabeth) => {
    const rev_custom_alphabeth = {};
    for (let [key, value] of Object.entries(block.custom_alphabeth))
      rev_custom_alphabeth[value] = parseInt(key);
    value = value.padStart(block.length, " ").substring(0, block.length);
    return value
      .split("")
      .map(char =>
        char in rev_custom_alphabeth
          ? rev_custom_alphabeth[char]
          : char in rev_alphabeth
          ? rev_alphabeth[char]
          : char == " "
          ? 62
          : 63
      )
      .map(index => encoders.encodeInteger(index, { bits: 6, offset: 0 }))
      .join("");
  },
  encodeSteps: (value, block) => {
    const bits = Math.ceil(Math.log(block.steps.length + 1, 2));
    block.steps.push(Infinity);
    const _value = block.steps.reduce(
      (acc, cur, idx) => (acc != -1 ? acc : value < cur ? idx : -1),
      -1
    );
    return encoders.encodeInteger(_value, { bits: bits, offset: 0 });
  },
  encodeCategories: (value, block) => {
    const bits = Math.ceil(Math.log(block.categories.length + 1, 2));
    const index = block.categories.indexOf(value);
    const _value = index != -1 ? index : block.categories.length;
    return encoders.encodeInteger(_value, { bits: bits, offset: 0 });
  }
};

module.exports.encoders = encoders;
