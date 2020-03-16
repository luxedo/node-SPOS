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

module.exports.encoders = {
  encodeBoolean: (value, block) => {
    return value == true ? "1" : "0";
  },
  encodeBinary: (value, block) => {
    value = !(value.replace(/[01]/g, "") == "")
      ? (value = parseInt(value, 16)
          .toString(2)
          .padStart(value.length * 4, "0"))
      : value;
    const bits = block.settings.bits;
    return value.padStart(bits, "0").slice(0, bits);
  },
  encodeInteger: (value, block) => {
    const overflow = Math.pow(2, block.settings.bits) - 1;
    value = Math.min(overflow, Math.max(0, value - block.settings.offset));
    return value.toString(2).padStart(block.settings.bits, "0");
  },
  encodeFloat: (value, block) => {
    const bits = block.settings.bits;
    const upper = block.settings.upper;
    const lower = block.settings.lower;
    const approximation =
      block.settings.approximation == "round"
        ? Math.round
        : block.settings.approximation == "floor"
        ? Math.floor
        : block.settings.approximation == "ceil"
        ? Math.ceil
        : undefined;
    const overflow = Math.pow(2, block.settings.bits) - 1;
    const delta = upper - lower;
    value = (overflow * (value - lower)) / delta;
    value = approximation(Math.min(overflow, Math.max(0, value)));
    return value.toString(2).padStart(block.settings.bits, "0");
  }
};
