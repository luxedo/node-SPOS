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
const { crc8 } = require("crc");

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
  },
  steps: {
    required: { steps: "array" },
    optional: { steps_names: { type: "array", default: [] } }
  },
  categories: {
    required: { categories: "array" }
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
  },
  steps: {
    input: "number",
    encoder: encoders.encodeSteps,
    decoder: decoders.decodeSteps
  },
  categories: {
    input: "string",
    encoder: encoders.encodeCategories,
    decoder: decoders.decodeCategories
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

/*
 * Validates the a block, throwing errors if the block is malformed.
 * @param {object} block The block to be validated.
 * @return {object} block A clone of the block.
 * @throws ReferenceError, RangeError
 */
function validateBlock(block) {
  // Check required keys
  if (!("key" in block))
    throw new ReferenceError(`Block ${JSON.stringify(block)} must have 'key'.`);
  if (typeof block.key != "string")
    throw RangeError(`Block ${block.key} 'key' must be a string .`);
  if (!("type" in block))
    throw new ReferenceError(`Block ${block.key} must have 'type'.`);
  if (!(block.type in TYPES))
    throw new RangeError(
      `Block ${block.key} has type: ${
        block.type
      }, should be one of: ${Object.keys(TYPES).join(", ")}.`
    );

  // Check required settings
  const type_keys = TYPES_KEYS[block.type];
  type_keys.required = "required" in type_keys ? type_keys.required : {};
  type_keys.optional = "optional" in type_keys ? type_keys.optional : {};
  for (const [key, value] of Object.entries(type_keys.required)) {
    if (!(key in block))
      throw new ReferenceError(`Block ${block.key} must have key '${key}'`);
    else if (value == "block") {
      validateBlock(block[key]);
    } else if (value == "items") {
      for (innerBlock of block.items) validateBlock(innerBlock);
    } else if (value == "array") {
      if (!Array.isArray(block[key]))
        throw new RangeError(
          `Block ${block.key} '${key}' must be of type '${value}'`
        );
    } else if (!(typeof block[key] == value))
      throw new RangeError(
        `Block ${block.key} '${key}' must be of type '${value}'`
      );
  }

  // Check optional settings
  for (const [key, value] of Object.entries(type_keys.optional)) {
    if (key in block)
      if (value.type == "array") {
        if (!Array.isArray(block[key]))
          throw RangeError(
            `Value for block '${
              block.key
            }' has wrong type '${typeof value} instead of 'array'.`
          );
      } else if (!(typeof block[key] == value.type)) {
        throw RangeError(
          `Block ${block.key} key ${key} must be of type ${value}`
        );
      }
    if (
      block.type == "steps" &&
      "steps_names" in block &&
      block.steps_names.length != block.steps.length + 1
    ) {
      throw RangeError(
        `'steps_names' for block ${block.key} has to have length 1 + len(steps).`
      );
    }
  }

  // Check for unexpected keys
  for (const key of Object.keys(block)) {
    if (
      !(
        key in type_keys.required ||
        key in type_keys.optional ||
        ["key", "type", "value"].includes(key)
      )
    )
      throw ReferenceError(
        `Block '${block.key}' has an unexpected key '${key}'.`
      );
  }

  return block;
}

/*
 * Validates a binary message.
 * @param {string} message The binary message to be decoded.
 * @throws RangeError
 */
function validateBinMessage(message) {
  if (message.replace(/[01]/g, "") != "")
    throw RangeError("Message must a string representing a binary value.");
}

/*
 * Fills `block` with default options if applicable.
 * @param {object} block The block to fill.
 * @return {object} block A clone of the block.
 */
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
  if (block.type == "steps" && block.steps_names.length == 0) {
    let steps_names = [`x<${block.steps[0]}`];
    for (let i = 0; i < block.steps.length - 1; i++) {
      steps_names.push(`${block.steps[i]}<=x<${block.steps[i + 1]}`);
    }
    steps_names.push(`x>=${block.steps[block.steps.length - 1]}`);
    block.steps_names = steps_names;
  }
  return block;
}

/*
 * Encodes value with the block specification.
 * @param value The value to encode.
 * @param {object} block The block specification.
 * @return {string} A binary string.
 */
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

/*
 * Decodes value with the block specification.
 * @param {string} message The binary message to be decoded.
 * @param {object} block The block specification.
 * @return value The value of the message.
 */
function decodeBlock(message, block) {
  block = validateBlock(block);
  block = fillDefaults(block);
  validateBinMessage(message);
  const type = TYPES[block.type];
  return type.decoder(message, block);
}

/*
 * Encodes an array of values according to the block specification in items.
 * @param {array} values The values to encode.
 * @param {array} items The array of block specifications.
 * @return {array} messages The array of encoded values as a binary string.
 */
function encodeItems(values, items) {
  if (values.length != items.length)
    throw RangeError("Arrays 'messages' and 'items' differ in length.");
  if (values.length == 0)
    throw RangeError("Empty inputs for 'messages' and 'items'");
  return items.map((block, idx) => encodeBlock(values[idx], block));
}

/*
 * Decodes an array of values according to the block specification in items.
 * @param {array} messages The array of encoded values as a binary string.
 * @param {array} items The array of block specifications.
 * @return {array} values The decoded values.
 */
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

/*
 * Decodes a binary string according to the block specification in items.
 * @param {array} message The binary string of the encoded values.
 * @param {array} items The array of block specifications.
 * @return {array} values The decoded values.
 */
function decodeMessage(message, items) {
  let messages = [];
  items = items.map(block => fillDefaults(block));
  for (block of items) {
    const bits = accumulateBits(message, block);
    messages.push(message.substring(0, bits));
    message = message.substring(bits);
  }
  return decodeItems(messages, items);
}

/*
 * Calculates the ammount of bits used in the block according to message.
 * @param {array} message The binary string of the encoded value.
 * @param {object} block The block specification.
 * @return {number} bits The bits used in the block.
 */
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

/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @return {string} message The message as a binary string.
 */
function binEncode(payloadData, payloadSpec) {
  const values = payloadSpec.items.map(block =>
    "value" in block ? block.value : getSubitem(block.key, payloadData)
  );
  let message = encodeItems(values, payloadSpec.items).join("");
  message = message.padEnd(Math.ceil(message.length / 8) * 8, "0");
  if (payloadSpec.crc8) {
    message += crc8Encode(message);
  }
  return message;
}

/*
 * Decodes message  according to payloadSpec.
 * @param {string} message The message as a binary string.
 * @param {object} payloadSpec Payload specifications.
 * @return {array} payloadData The object containing the decoded values.
 */
function binDecode(message, payloadSpec) {
  const values = decodeMessage(message, payloadSpec.items);
  const payloadData = Object.fromEntries(
    payloadSpec.items.map((block, idx) => [block.key, values[idx]])
  );
  for (const [key, value] of Object.entries(payloadData)) {
    if (value.type == "pad") delete payloadData[key];
  }
  if (payloadSpec.crc8 === true) {
    const msg = message.slice(0, -8);
    const hash = message.substr(message.length - 8);
    payloadData["crc8"] = crc8Encode(msg) === hash;
  }
  return payloadData;
}

/*
 * Gets a subitem from "obj" according to "key" layers. Eg:
 *
 * getSubitem("key1.key2", {"key1": {"key2": True}}) Returns the
 * value of "key2" inside "key1".
 * @param {str} key Key with items splitted with "." (eg "results.count.armigera")
 * @param {object} obj Object to gather valule from.
 * @return value Nested value according to key.
 */
function getSubitem(key, obj) {
  for (let i of key.split(".")) {
    obj = obj[i]
  }
  return obj
}

/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @return {string} message The message as an hex string.
 */
function hexEncode(payloadData, payloadSpec) {
  const message = binEncode(payloadData, payloadSpec);
  let hex = "";
  for (let i = 0; i < message.length / 8; i++) {
    hex += parseInt(message.substring(8 * i, 8 * (i + 1)), 2)
      .toString(16)
      .padStart(2, "0");
  }
  return hex;
}

/*
 * Decodes message  according to payloadSpec.
 * @param {string} message The message as an hex string.
 * @param {object} payloadSpec Payload specifications.
 * @return {array} payloadData The object containing the decoded values.
 */
function hexDecode(message, payloadSpec) {
  const bits = message.length * 4;
  let bin = "";
  for (let i = 0; i < message.length / 2; i++) {
    bin += parseInt(message.substring(2 * i, 2 * (i + 1)), 16)
      .toString(2)
      .padStart(8, "0");
  }
  return binDecode(bin, payloadSpec);
}

/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @return {Uint8Array} message The message as an Uint8Array.
 */
function encode(payloadData, payloadSpec) {
  return hexStringToByte(hexEncode(payloadData, payloadSpec));
}

/*
 * Decodes message  according to payloadSpec.
 * @param {string} message The message as an hex string.
 * @param {object} payloadSpec Payload specifications.
 * @return {array} payloadData The object containing the decoded values.
 */
function decode(message, payloadSpec) {
  return hexDecode(byteToHexString(message), payloadSpec);
}

function crc8Encode(message) {
  hex = "";
  for (let i = 0; i < message.length / 8; i++) {
    hex += parseInt(message.substring(8 * i, 8 * (i + 1)), 2)
      .toString(16)
      .padStart(2, "0");
  }
  return crc8(Buffer.from(hex, "hex"))
    .toString(2)
    .padStart(8, "0");
}

function hexStringToByte(str) {
  let a = [];
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

function byteToHexString(uint8arr) {
  let hexStr = "";
  for (let i = 0; i < uint8arr.length; i++) {
    let hex = (uint8arr[i] & 0xff).toString(16);
    hex = hex.length === 1 ? "0" + hex : hex;
    hexStr += hex;
  }
  return hexStr;
}

module.exports.validateBlock = validateBlock;
module.exports.fillDefaults = fillDefaults;
module.exports.encodeBlock = encodeBlock;
module.exports.decodeBlock = decodeBlock;
module.exports.encodeItems = encodeItems;
module.exports.decodeItems = decodeItems;
module.exports.binEncode = binEncode;
module.exports.binDecode = binDecode;
module.exports.hexEncode = hexEncode;
module.exports.hexDecode = hexDecode;
module.exports.encode = encode;
module.exports.decode = decode;
