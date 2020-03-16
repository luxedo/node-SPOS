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
const { encoders } = require("./encoders.js");
const { decoders } = require("./decoders.js");
const { validators } = require("./validators.js");

const TYPES_SETTINGS = {
  boolean: {},
  binary: {
    required: {
      bits: "number"
    }
  },
  integer: {
    required: {
      bits: "number"
    },
    optional: {
      offset: { type: "number", default: 0 }
    }
  },
  float: {
    required: {
      bits: "number"
    }, 
    optional: {
      upper: {type: "number", default: 1},
      lower: {type: "number", default: 0},
      approximation: {type: "string", default: "round"}
    }
  }
};
const TYPES = {
  boolean: {
    input: Number,
    encoder: encoders.encodeBoolean,
    decoder: decoders.decodeBoolean
  },
  binary: {
    input: String,
    validator: validators.validateBinary,
    encoder: encoders.encodeBinary,
    decoder: decoders.decodeBinary
  },
  integer: {
    input: Number,
    encoder: encoders.encodeInteger,
    decoder: decoders.decodeInteger
  },
  float: {
    input: Number,
    encoder: encoders.encodeFloat,
    decoder: decoders.decodeFloat
  }
};

function validateBlock(block) {
  // Test required keys
  if (!("name" in block))
    throw new ReferenceError(
      `Block ${JSON.stringify(block)} must have 'name'.`
    );
  else if (!("type" in block))
    throw new ReferenceError(`Block ${block.name} must have 'type'.`);
  else if (!(block.type in TYPES))
    throw new RangeError(
      `Block ${block.name} has type: ${
        block.type
      }, should be one of: ${Object.keys(TYPES).join(", ")}.`
    );

  // Test required settings
  const type_settings = TYPES_SETTINGS[block.type];
  if ("required" in type_settings) {
    if (!("settings" in block))
      throw new ReferenceError(`Block ${block.name} must have 'settings' key.`);
    for (const [key, value] of Object.entries(type_settings.required)) {
      if (!(key in block.settings))
        throw new ReferenceError(
          `Block ${block.name} settings must have key '${key}'`
        );
      if (!(typeof block.settings[key] == value))
        throw new RangeError(
          `Block ${block.name} settings.${key} must be of type ${value}`
        );
    }
  }

  // Test optional settings
  if ("optional" in type_settings) {
    for (const [key, value] of Object.entries(type_settings.optional)) {
      if (!(key in block.settings)) {
        block.settings[key] = value.default;
      }
      else if (!(typeof block.settings[key] == value.type))
        throw RangeError(
          `Block ${block.name} settings.${key} must be of type ${value}`
        );
      else {
      }
    }
  }

  return block
}

function validateValue(value, type) {
  if ("validator" in type) type.validator(value);
  //if (!(typeof(value) == type["input"])) {
  //  console.log('nooo')
  //}
}

function validateMessage(message) {
  if (message.replace(/[01]/g, "") != "")
    throw RangeError("Message must a string representing a binary value.");
}

function encodeBlock(value, block) {
  block = validateBlock(block);
  const type = TYPES[block.type];
  validateValue(value, type);
  return type.encoder(value, block);
}

function decodeBlock(message, block) {
  validateBlock(block);
  validateMessage(message);
  const type = TYPES[block.type];
  return type.decoder(message, block);
}

module.exports.validateBlock = validateBlock;
module.exports.encodeBlock = encodeBlock;
module.exports.decodeBlock = decodeBlock;
