# node-SPOS

> **SPOS** stands for **Small Payload Object Serializer**.

[![codecov](https://codecov.io/gh/luxedo/node-spos/branch/master/graph/badge.svg)](https://codecov.io/gh/luxedo/node-spos) [![CodeFactor](https://www.codefactor.io/repository/github/luxedo/node-spos/badge)](https://www.codefactor.io/repository/github/luxedo/node-spos) [![npm version](https://badge.fury.io/js/spos.svg)](https://badge.fury.io/js/spos) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> This is and implementation of the `SPOS` specification in `Javascript`. See
> HTTPS://github.com/luxedo/SPOS for details.

`SPOS` is a tool for serializing simple objects. This tool focuses in
maintaining a consistent payload size while sacrificing precision.
Applications with limited bandwidth like [LoRa](https://lora-alliance.org/)
or [Globalstar](https://www.globalstar.com/en-us/) are ideal candidates
for `SPOS`. `SPOS` has implementations for
python3 ([SPOS](https://github.com/luxedo/SPOS)) and
node.js ([node-SPOS](https://github.com/luxedo/node-SPOS)).

> In this document we will be using JSON notation to describe payload
> specifications and payload data. For each programming language there's
> usually an analogous data type for each notation. Eg:
> `object <=> dict`, `array <=> list`, etc.

## Quick Start

To encode data, `SPOS` needs two arguments to serialize the data: The `payload_data` to be serialized and the [payload specification](https://github.com/luxedo/SPOS#Payload-specification).

```javascript
const spos = require("spos")
payload_spec = {
  name: "example payload",
  version: 1,
  body: [{
    type: "integer",
    key: "constant_data",
    value: 2,  # 10
    bits: 2
  }, {
    type: "integer",
    key: "int_data",
    bits: 6
  }, {
    type: "float",
    key: "float_data",
    bits: 6
}]
payload_data = {
  int_data: 13,    // 001101
  float_data: 0.6  // 010011 (19/32 or 0.59375)
}
message = spos.binEncode(payload_data, payload_spec, output="bin")
"01001101010011"
```

Decoding data

```javascript
const spos = require("spos")
const payload_spec = {
  name: "example payload",
  version: 1,
  body: [{
    type: "integer",
    key: "constant_data",
    value: 2,
    bits: 2
  }, {
    type: "integer",
    key: "int_data",
    bits: 6
  }, {
    type: "float",
    key: "float_data",
    bits: 6
}]
const message = "0b10001101010011"
const decoded = spos.decode(message, payload_spec, input="bin")
decoded
{
  meta: {
    name: "example payload",
    version: 1,
  },
  body: {
    constant_data: 2,
    int_data: 13,
    float_data: 0.59375
  }
}

```

## Installation

```bash
npm install spos
```

## Functions

```javascript
/*
 * Encodes the payloadData according to payloadSpec.
 * @param {array} payloadData The object containing the values to be encoded.
 * @param {object} payloadSpec Payload specifications.
 * @param {string} output the output message format (bytes|hex|bin)
 * @return {Uint8Array|hex string|bin string} message
 */
function encode(payloadData, payloadSpec, output = "bytes")
```

```javascript
/*
 * Decodes message according to payloadSpec.
 * @param {Uint8Array|hex string|bin string} message
 * @param {object} payloadSpec Payload specifications.
 * @param {string} input the input message format (bytes|hex|bin)
 * @return {object} decoded The object containing the decoded values.
 */
function decode(message, payloadSpec, input = "bytes")
```

```javascript
/*
 * Decodes message according to one payloadSpec in payloadSpecs.
 * @param {Uint8Array|hex string|bin string} message
 * @param {array} payloadSpecs Array of payload specifications.
 * @param {string} input the input message format (bytes|hex|bin)
 * @return {object} decoded The object containing the decoded values.
 */
function decodeFromSpecs(message, payloadSpecs, input = "bytes")
```

## License

> SPOS - Small Payload Object Serializer
> Copyright (C) 2020 Luiz Eduardo Amaral <luizamaral306@gmail.com>
>
> This program is free software: you can redistribute it and/or modify
> it under the terms of the GNU General Public License as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
>
> This program is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
> GNU General Public License for more details.
>
> You should have received a copy of the GNU General Public License
