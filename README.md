# node-SPOS

> **SPOS** stands for **Small Payload Object Serializer**.

<--
[![codecov](https://codecov.io/gh/luxedo/spos/branch/master/graph/badge.svg)](https://codecov.io/gh/luxedo/spos) [![CodeFactor](https://www.codefactor.io/repository/github/luxedo/spos/badge)](https://www.codefactor.io/repository/github/luxedo/spos) [![PyPI version](https://badge.fury.io/py/spos.svg)](https://badge.fury.io/py/spos) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
-->

`SPOS` is a tool for serializing objects. This tool focuses in
maintaining a consistent payload size while sacrificing precision.
Applications with limited bandwidth like [LoRa](https://lora-alliance.org/)
or [Globalstar](https://www.globalstar.com/en-us/) are ideal candidates
for `SPOS`. Spos is built as a library for `python3` and a command line
tool.

This is and implementation of the `SPOS` specification in `NodeJS`. See 
https://github.com/luxedo/SPOS for details.

## Quick Start

To encode data, `SPOS` needs two arguments to serialize the data: The `payload_data` to be serialized and the [payload specification](https://github.com/luxedo/SPOS#Payload-specification).

```javascript
const spos = require("spos")
payload_spec = {
  "name": "example payload",
  "version": "1.0.0",
  "items": [{
    "type": "integer",
    "name": "payload_version",
    "value": 1,  // 01
    "settings": {
      "bits": 2
    }
  }, {
    "type": "integer",
    "name": "integer 1",
    "key": "int_data",
    "settings": {
      "bits": 6
    }
  }, {
    "type": "float",
    "name": "float 1",
    "key": "float_data",
    "settings": {
      "bits": 6
    }
}]
payload_data = {
  "int_data": 13,    // 001101
  "float_data": 0.6  // 010011 (19/32 or 0.59375)
}

message = spos.encode(payload_data, payload_spec)
"0b01001101010011"
```

Decoding data

```javascript
const spos = require("spos")
payload_spec = {
  "name": "example payload",
  "version": "1.0.0",
  "items": [{
    "type": "integer",
    "name": "payload_version",
    "value": 1,  # 01
    "settings": {
      "bits": 2
    }
  }, {
    "type": "integer",
    "name": "integer 1",
    "key": "int_data",
    "settings": {
      "bits": 6
    }
  }, {
    "type": "float",
    "name": "float 1",
    "key": "float_data",
    "settings": {
      "bits": 6
    }
}]
message = "0b01001101010011"
payload_data = spos.decode(message, payload_spec)
{
  "payload_version": 1,
  "int_data": 13,
  "float_data": 0.59375
}
```

## Functions

```python
def encode(payload_data, payload_spec):
    """
    Encodes a message from payload_data according to payload_spec.
    Returns the message as a binary string.

    Args:
        payload_data (dict): The list of values to encode.
        payload_spec (dict): Payload specifications.

    Returns:
        message (str): Binary string of the message.
    """
```

```python
def decode(message, payload_spec):
    """
    Decodes a binary message according to payload_spec.

    Args:
        message (str): Binary string of the message.
        payload_spec (dict): Payload specifications.

    Returns:
        payload_data (dict): Payload data.
    """
```

```python
def hex_encode(payload_data, payload_spec):
"""
Encodes a message from payload_data according to payload_spec.
Returns the message as an hex string.

    Args:
        payload_data (dict): The list of values to encode.
        payload_spec (dict): Payload specifications.

    Returns:
        message (str): Binary string of the message.
    """

```

```python
def hex_decode(message, payload_spec):
    """
    Decodes an hex message according to payload_spec.

    Args:
        message (str): Hex string of the message.
        payload_spec (dict): Payload specifications.

    Returns:
        payload_data (dict): Payload data.
    """
```

## Command line usage

```python
# Encode data
cat payload_data | spos -p payload_spec.json

# Decode data
cat message | spos -d -p payload_spec.json
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
