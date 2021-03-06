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

const { blocks } = require("./blocks.js");
const { utils } = require("./utils.js");

/*
 * Encodes value with the block specification to binary.
 * @param value The value to encode.
 * @param {object} block The block specification.
 * @return {string} A binary string.
 */
function encodeBlock(value, blockSpec) {
  return new blocks.Block(blockSpec).binEncode(value);
}

/*
 * Decodes binary with the block specification.
 * @param {string} message The binary message to be decoded.
 * @param {object} block The block specification.
 * @return value The value of the message.
 */
function decodeBlock(value, blockSpec) {
  return new blocks.Block(blockSpec).binDecode(value);
}

/*
 * Validates a payload specification, throwing errors if it is malformed.
 * @param {payloadSpec} block The block to be validated.
 * @throws ReferenceError, RangeError
 */
function validatePayloadSpec(payloadSpec) {
  if (!("name" in payloadSpec))
    throw new ReferenceError(`payloadSpec must have key 'name'.`);
  if (typeof payloadSpec.name != "string")
    throw new RangeError(`payloadSpec 'name' must be a string.`);
  if (!("version" in payloadSpec))
    throw new ReferenceError(`payloadSpec must have key 'version'.`);
  if (!Number.isInteger(payloadSpec.version))
    throw new RangeError(`payloadSpec 'version' must be an integer.`);
  if (!("body" in payloadSpec))
    throw new ReferenceError(`payloadSpec must have key 'body'.`);
  if (!Array.isArray(payloadSpec.body))
    throw new RangeError(`payloadSpec 'body' must be an array.`);
  if ("meta" in payloadSpec) {
    if (!utils.isObject(payloadSpec.meta))
      throw new RangeError(`payloadSpec.meta must be an object.`);
    if ("crc8" in payloadSpec.meta && typeof payloadSpec.meta.crc8 != "boolean")
      throw new RangeError(`payloadSpec.meta.crc8 must be boolean.`);
    if ("header" in payloadSpec.meta) {
      if (!Array.isArray(payloadSpec.meta.header))
        throw new RangeError(`payloadSpec.meta.header must be an array.`);
      validatePayloadSpec({
        name: "header",
        version: 0,
        body: payloadSpec.meta.header,
      });
    }
    let keys = Object.keys(payloadSpec.meta).filter(
      (key) =>
        ["encode_version", "version_bits", "crc8", "header"].indexOf(key) == -1
    );
    if (keys.length)
      throw new RangeError(`Unexpected keys in payloadSpec ${keys}`);
  }
  let keys = Object.keys(payloadSpec).filter(
    (key) => ["name", "body", "version", "meta"].indexOf(key) == -1
  );
  if (keys.length)
    throw new RangeError(`Unexpected keys in payloadSpec ${keys}`);
}

/*
 * Validates an arrya of  payload specifications, throwing errors if any
 * of them are malformed. Also checks if there are two payloadSpecs with
 * the same version number and if the names don't match.
 * @param {payloadSpec} block The block to be validated.
 * @throws ReferenceError, RangeError
 */
function validatePayloadSpecs(payloadSpecs) {
  if (!Array.isArray(payloadSpecs))
    throw RangeError("PayloadSpecs expected to be an array.");
  payloadSpecs.forEach(validatePayloadSpec);
  let names = new Set(payloadSpecs.map((ps) => ps.name));
  let versions = new Set(payloadSpecs.map((ps) => ps.version));
  if (names.size > 1)
    throw RangeError(`Name mismatch in payloadSpecs ${names}`);
  if (versions.size !== payloadSpecs.length)
    throw RangeError(
      `Confliting payloadSpecs versions ${payloadSpecs.map((ps) => ps.version)}`
    );
}

/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @return {string} message The message as a binary string.
 */
function binEncode(payloadData, payloadSpec) {
  validatePayloadSpec(payloadSpec);
  let meta = payloadSpec.meta || {};
  let message = "";

  if (meta.encode_version) {
    message += encodeBlock(payloadSpec.version, {
      key: "version",
      type: "integer",
      bits: meta.version_bits,
    });
  }

  if (meta.header) {
    message += new blocks.Block({
      key: "header",
      type: "object",
      blocklist: meta.header.filter(
        (blockSpec) => !blockSpec.hasOwnProperty("value")
      ),
    }).binEncode(payloadData);
  }

  message += new blocks.Block({
    key: "payload",
    type: "object",
    blocklist: payloadSpec.body,
  }).binEncode(payloadData);

  message = message.padEnd(Math.ceil(message.length / 8) * 8, "0");

  if (meta.crc8) {
    message += utils.crc8Encode(message);
  }
  return message;
}

/*
 * Decodes binary message according to payloadSpec.
 * @param {string} message The message as a binary string.
 * @param {object} payloadSpec Payload specifications.
 * @return {array} payloadData The object containing the decoded values.
 */
function binDecode(message, payloadSpec) {
  validatePayloadSpec(payloadSpec);
  let meta = payloadSpec.meta || {};
  let msgMeta = {
    name: payloadSpec.name,
    version: payloadSpec.version,
    message: "0x" + utils.binToHex(message),
  };

  if (meta.crc8) {
    msgMeta.crc8 = utils.crc8Validate(message);
    message = message.slice(0, -8);
  }

  if (meta.encode_version) {
    [msgMeta.version, message] = new blocks.Block({
      key: "version",
      type: "integer",
      bits: meta.version_bits,
    }).consume(message);
    if (msgMeta.version != payloadSpec.version)
      throw RangeError(
        `Received message version doesn't match. ${payloadSpec.version} != ${msgMeta.version}`
      );
  }

  if (meta.header) {
    [msgMeta.header, message] = new blocks.Block({
      key: "header",
      type: "object",
      blocklist: meta.header.filter((blockSpec) => !("value" in blockSpec)),
    }).consume(message);
    msgMeta.header = Object.assign(
      {},
      msgMeta.header,
      meta.header
        .filter((blockSpec) => "value" in blockSpec)
        .reduce((acc, blockSpec) => {
          acc[blockSpec.key] = blockSpec.value;
          return acc;
        }, {})
    );
  }

  let payloadData = new blocks.Block({
    key: "payload",
    type: "object",
    blocklist: payloadSpec.body,
  }).binDecode(message);

  return { meta: msgMeta, body: payloadData };
}

/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @param {string} output the output message format (bytes|hex|bin)
 * @return {Uint8Array|hex string|bin string} message
 */
function encode(payloadData, payloadSpec, output = "bytes") {
  let message = binEncode(payloadData, payloadSpec);
  if (output === "bin") return message;
  else if (output === "hex") return utils.binToHex(message);
  else if (output === "bytes") return utils.hexToBytes(utils.binToHex(message));
  else
    throw RangeError(
      `Invalid output ${output}. Chose from 'bin', 'hex' or 'bytes'`
    );
}

/*
 * Decodes message according to payloadSpec.
 * @param {Uint8Array|hex string|bin string} message
 * @param {object} payloadSpec Payload specifications.
 * @param {string} input the input message format (bytes|hex|bin)
 * @return {object} decoded The object containing the decoded values.
 */
function decode(message, payloadSpec, input = "bytes") {
  if (input === "bin") return binDecode(message, payloadSpec);
  else if (input === "hex")
    return binDecode(utils.hexToBin(message), payloadSpec);
  else if (input === "bytes")
    return binDecode(utils.hexToBin(utils.bytesToHex(message)), payloadSpec);
  else
    throw RangeError(
      `Invalid input ${input}. Chose from 'bin', 'hex' or 'bytes'`
    );
}

/*
 * Decodes message according to one payloadSpec in payloadSpecs.
 * @param {Uint8Array|hex string|bin string} message
 * @param {array} payloadSpecs Array of payload specifications.
 * @param {string} input the input message format (bytes|hex|bin)
 * @return {object} decoded The object containing the decoded values.
 */
function decodeFromSpecs(message, payloadSpecs, input = "bytes") {
  validatePayloadSpecs(payloadSpecs);
  for (let payloadSpec of payloadSpecs) {
    try {
      return decode(message, payloadSpec, input);
    } catch (err) {
      // Ignore and try the next payloadSpec
    }
  }
  throw RangeError("Message did not match any version.");
}

module.exports.encodeBlock = encodeBlock;
module.exports.decodeBlock = decodeBlock;
module.exports.encode = encode;
module.exports.decode = decode;
module.exports.decodeFromSpecs = decodeFromSpecs;
module.exports.utils = utils;
module.exports.validatePayloadSpec = validatePayloadSpec;
