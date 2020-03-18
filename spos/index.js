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

const TYPES_KEYS = {
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
      upper: { type: "number", default: 1 },
      lower: { type: "number", default: 0 },
      approximation: { type: "string", default: "round" }
    }
  },
  pad: {
    required: {
      bits: "number"
    }
  },
  array: {
    required: {
      bits: "number",
      blocks: "block"
    }
  },
  object: {
    required: { items: "items" }
  },
  string: {
    required: { length: "number" },
    optional: { custom_alphabeth: { type: "object", default: {} } }
  }
};
const TYPES = {
  boolean: {
    input: "boolean",
    encoder: encoders.encodeBoolean,
    decoder: decoders.decodeBoolean
  },
  binary: {
    input: "string",
    validator: validators.validateBinary,
    encoder: encoders.encodeBinary,
    decoder: decoders.decodeBinary
  },
  integer: {
    input: "number",
    encoder: encoders.encodeInteger,
    decoder: decoders.decodeInteger
  },
  float: {
    input: "number",
    encoder: encoders.encodeFloat,
    decoder: decoders.decodeFloat
  },
  pad: {
    encoder: encoders.encodePad,
    decoder: decoders.decodePad
  },
  array: {
    input: "array",
    validator: validators.validateArray,
    encoder: (value, block) => encoders.encodeArray(value, block, encodeBlock),
    decoder: (value, block) => decoders.decodeArray(value, block, decodeMessage)
  },
  object: {
    input: "object",
    encoder: (value, block) => encoders.encodeObject(value, block, encodeItems),
    decoder: (value, block) =>
      decoders.decodeObject(value, block, decodeMessage)
  },
  string: {
    input: "string",
    encoder: (value, block) =>
      encoders.encodeString(value, block, BASE64_REV_ALPHABETH),
    decoder: (value, block) =>
      decoders.decodeString(value, block, BASE64_ALPHABETH)
  }
};

const _b64_alphabeth =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const BASE64_ALPHABETH = Object.fromEntries(
  new Map(_b64_alphabeth.split("").map((c, i) => [i, c]))
);
const BASE64_REV_ALPHABETH = Object.fromEntries(
  new Map(_b64_alphabeth.split("").map((c, i) => [c, i]))
);

function validateBlock(block) {
  // Test required keys
  if (!("key" in block))
    throw new ReferenceError(`Block ${JSON.stringify(block)} must have 'key'.`);
  else if (typeof block.key != "string")
    throw RangeError(`Block ${block.key} 'key' must be a string .`);
  else if (!("type" in block))
    throw new ReferenceError(`Block ${block.key} must have 'type'.`);
  else if (!(block.type in TYPES))
    throw new RangeError(
      `Block ${block.key} has type: ${
        block.type
      }, should be one of: ${Object.keys(TYPES).join(", ")}.`
    );

  // Test required settings
  const type_keys = TYPES_KEYS[block.type];
  if ("required" in type_keys) {
    for (const [key, value] of Object.entries(type_keys.required)) {
      if (!(key in block))
        throw new ReferenceError(`Block ${block.key} must have key '${key}'`);
      if (value == "block") {
        validateBlock(block[key]);
      } else if (value == "items") {
        for (innerBlock of block.items) validateBlock(innerBlock);
      } else if (!(typeof block[key] == value))
        throw new RangeError(
          `Block ${block.key} '${key}' must be of type '${value}'`
        );
    }
  }

  // Test optional settings
  if ("optional" in type_keys) {
    for (const [key, value] of Object.entries(type_keys.optional)) {
      if (key in block && !(typeof block[key] == value.type))
        throw RangeError(
          `Block ${block.key} settings.${key} must be of type ${value}`
        );
      else {
      }
    }
  }

  return block;
}

function fillDefaults(block) {
  block = JSON.parse(JSON.stringify(block));
  const type_keys = TYPES_KEYS[block.type];
  if ("optional" in type_keys) {
    for (const [key, value] of Object.entries(type_keys.optional)) {
      if (!(key in block)) {
        block[key] = value.default;
      }
    }
  }
  return block;
}

function validateMessage(message) {
  if (message.replace(/[01]/g, "") != "")
    throw RangeError("Message must a string representing a binary value.");
}

function encodeBlock(value, block) {
  block = validateBlock(block);
  const type = TYPES[block.type];
  block = fillDefaults(block);
  if ("validator" in type) type.validator(value);
  if ("input" in type) {
    if (type.input == "array") {
      if (!Array.isArray(value))
        throw RangeError(
          `Value for block '${
            block.key
          }' has wrong type '${typeof value} instead of 'array'.`
        );
    } else if (!(typeof value == type.input))
      throw RangeError(
        `Value for block '${
          block.key
        }' has wrong type '${typeof value} instead of '${type.input}'.`
      );
  }
  return type.encoder(value, block);
}

function decodeBlock(message, block) {
  block = validateBlock(block);
  block = fillDefaults(block);
  validateMessage(message);
  const type = TYPES[block.type];
  return type.decoder(message, block);
}

function encodeItems(values, items) {
  if (values.length != items.length)
    throw RangeError("Arrays 'messages' and 'items' differ in length.");
  if (values.length == 0)
    throw RangeError("Empty inputs for 'messages' and 'items'");
  return items.map((block, idx) => encodeBlock(values[idx], block));
}
function decodeItems(messages, items) {
  let acc_message = "";
  if (messages.length != items.length)
    throw RangeError("Arrays 'messages' and 'items' differ in length.");
  if (messages.length == 0)
    throw RangeError("Empty inputs for 'messages' and 'items'");
  return items.map((block, idx) => {
    const message = messages[idx];
    acc_message += message;
    if (block.type == "crc8") return decodeBlock(acc_message, block);
    return decodeBlock(message, block);
  });
}

function decodeMessage(message, items) {
  let messages = [];
  for (block of items) {
    const bits = accumulateBits(message, block);
    messages.push(message.substring(0, bits));
    message = message.substring(bits);
  }
  return decodeItems(messages, items);
}

function accumulateBits(message, block) {
  acc = 0;
  if ("bits" in block) acc += block.bits;
  if (block.type == "boolean") acc += 1;
  else if (block.type == "crc8") acc += 8;
  else if (block.type == "string") acc += block.length * 6;
  else if (block.type == "array") {
    let bits = block.bits;
    const length = decoders.decodeInteger(message.substring(0, bits), {
      bits: bits,
      offset: 0
    });
    acc += length * accumulateBits(message.substring(bits), block.blocks);
  } else if (block.type == "object") {
    for (let i = 0; i < block.items.length; i++) {
      const bits = accumulateBits(message, block.items[i]);
      message = message.substring(bits);
      acc += bits;
    }
  } else if (block.type == "steps") {
    acc += Math.ceil(Math.log(block.steps_names.length, 2));
  } else if (block.type == "categories") {
    acc += Math.ceil(Math.log(block.categories.length + 1, 2));
  }
  return acc;
}

module.exports.validateBlock = validateBlock;
module.exports.encodeBlock = encodeBlock;
module.exports.decodeBlock = decodeBlock;
