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
const { blocks } = require("./blocks.js");
const { utils } = require("./utils.js");
const { crc8 } = require("crc");

function encodeBlock(value, blockSpec) {
  return new blocks.Block(blockSpec).binEncode(value);
}

function decodeBlock(value, blockSpec) {
  return new blocks.Block(blockSpec).binDecode(value);
}

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
      blocklist: meta.header.filter((blockSpec) => !blockSpec.value),
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

function binDecode(message, payloadSpec) {
  validatePayloadSpec(payloadSpec);
  meta = payloadSpec.meta || {};
  msgMeta = {
    name: payloadSpec.name,
    version: payloadSpec.version,
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
      blocklist: meta.header.filter((blockSpec) => !blockSpec.value),
    }).consume(message);
    msgMeta.header = Object.assign(
      {},
      msgMeta.header,
      meta.header
        .filter((blockSpec) => blockSpec.value)
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

function encode(payloadData, payloadSpec, output = "bin") {
  let message = binEncode(payloadData, payloadSpec);
  if (output === "bin") return message;
  else if (output === "hex") return utils.binToHex(message);
  else if (output === "bytes") return utils.hexToBytes(utils.binToHex(message));
  else
    throw RangeError(
      `Invalid output ${output}. Chose from 'bin', 'hex' or 'bytes'`
    );
}

function decode(message, payloadSpec, input = "bin") {
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

function decodeFromSpecs(message, payloadSpecs) {
  validatePayloadSpecs(payloadSpecs);
  for (let payloadSpec of payloadSpecs) {
    try {
      return decode(message, payloadSpec);
    } catch (err) {}
  }
  throw RangeError("Message did not match any version.");
}

module.exports.encodeBlock = encodeBlock;
module.exports.decodeBlock = decodeBlock;
module.exports.encode = encode;
module.exports.decode = decode;
module.exports.decodeFromSpecs = decodeFromSpecs;
