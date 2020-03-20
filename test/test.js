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
const { assert } = require("chai");
const spos = require("spos");

const DELTA = 0.01;

assert.payload = (payloadSpec, payloadData, decoded) => {
  assert.items(payloadSpec.items, payloadData, decoded);
};

assert.items = (items, payloadData, decoded) => {
  for (let block of items) {
    if ("value" in block) {
      assert.equal(block.value, decoded[block.key]);
    } else {
      assert.block(block, payloadData[block.key], decoded[block.key]);
    }
  }
};

assert.block = (block, expected, actual) => {
  if (block.type == "array") {
    for (let i = 0; i < expected.length; i++) {
      assert.block(block.blocks, expected[i], actual[i]);
    }
  } else if (block.type == "object") {
    assert.items(block.items, expected, actual);
  } else if (block.type == "float") {
    block = spos.fillDefaults(block);
    const delta = (block.upper - block.lower) / block.bits;
    assert.closeTo(expected, actual, delta);
  } else {
    assert.equal(expected, actual);
  }
};

describe("validateBlock", () => {
  it("Throws an exception when passing a block without key", () => {
    const block = {
      type: "boolean"
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when passing a block without type", () => {
    const block = {
      type: "boolean"
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when passing a block with an unknown type", () => {
    const block = {
      key: "test",
      type: "unknown"
    };
    assert.throws(() => spos.encodeBlock(true, block), RangeError);
  });
  it("Throws an exception when missing a required key", () => {
    const block = {
      key: "test",
      type: "binary"
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
  it("Throws an exception when the type of a required key is invalid", () => {
    const block = {
      key: "test",
      type: "binary",
      bits: "err"
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when the type of an optional key is invalid", () => {
    const block = {
      key: "test",
      type: "integer",
      bits: 6,
      offset: "err"
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when the block as an unexpected key", () => {
    const block = {
      key: "test",
      type: "integer",
      bits: 6,
      offset: 0,
      error_key: true
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
});

describe("validateValue", () => {});

describe("validateMessage", () => {
  it("Throws an exception when passing a string that doesn't represent a binary", () => {
    const block = {
      key: "test",
      type: "boolean"
    };
    assert.throws(() => spos.decodeBlock("error", block), RangeError);
  });
});

describe("Encodes/Decodes Block", () => {
  describe("Encodes/Decodes Boolean", () => {
    it("Encodes/Decodes true to '1' and vice versa", () => {
      const block = {
        key: "boolean true",
        type: "boolean"
      };
      const t = true;
      const a = "1";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes false to '0' and vice versa", () => {
      const block = {
        key: "boolean false",
        type: "boolean"
      };
      const t = false;
      const a = "0";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
  });

  describe("Encodes/Decodes Binary", () => {
    it("Encodes/Decodes a binary block", () => {
      const block = {
        key: "encode binary",
        type: "binary",
        bits: 16
      };
      const t = "1010111010101011";
      assert.equal(spos.encodeBlock(t, block), t);
      assert.equal(spos.decodeBlock(t, block), t);
    });
    it("Encodes/Decodes an hex block", () => {
      const block = {
        key: "encode binary",
        type: "binary",
        bits: 32
      };
      const t = "deadbeef";
      const a = "11011110101011011011111011101111";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), a);
    });
    it("Truncates a binary value", () => {
      const block = {
        key: "encode binary truncate",
        type: "binary",
        bits: 6
      };
      const t = "1010111010101011";
      const a = "101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Truncates an hex value", () => {
      const block = {
        key: "encode hex truncate",
        type: "binary",
        bits: 6
      };
      const t = "deadbeef";
      const a = "110111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads a binary value", () => {
      const block = {
        key: "encode binary pad",
        type: "binary",
        bits: 18
      };
      const t = "1010111010101011";
      const a = "001010111010101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads an hex value", () => {
      const block = {
        key: "encode hex pad",
        type: "binary",
        bits: 34
      };
      const t = "deadbeef";
      const a = "0011011110101011011011111011101111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Throws an error when passing a malformed input", () => {
      const block = {
        key: "encode hex pad",
        type: "binary",
        bits: 34
      };
      const t = "error";
      assert.throws(() => spos.encodeBlock(t, block), RangeError);
    });
  });

  describe("Encodes/Decodes Integer", () => {
    it("Encodes/Decodes an integer", () => {
      const block = {
        key: "integer",
        type: "integer",
        bits: 4
      };
      const t = 9;
      const a = "1001";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes an integer with offset", () => {
      const block = {
        key: "integer offset",
        type: "integer",
        bits: 6,
        offset: 200
      };
      const t = 210;
      const a = "001010";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes an integer without overflowing", () => {
      const block = {
        key: "integer offset",
        type: "integer",
        bits: 6
      };
      const t = 210;
      const a = "111111";
      const t_dec = 63;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes an integer without underflowing", () => {
      const block = {
        key: "integer offset",
        type: "integer",
        bits: 6,
        offset: 220
      };
      const t = 210;
      const a = "000000";
      const t_dec = 220;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
  });

  describe("Encodes/Decodes Float", () => {
    it("Encodes/Decodes a float value", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 8
      };
      const t = 0.5;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float with floor approximation", () => {
      const block = {
        key: "float floor",
        type: "float",
        bits: 2,
        approximation: "floor"
      };
      const t = 0.5;
      const a = "01";
      const t_dec = 0.33;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float with ceil approximation", () => {
      const block = {
        key: "float ceil",
        type: "float",
        bits: 2,
        approximation: "ceil"
      };
      const t = 0.5;
      const a = "10";
      const t_dec = 0.66;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float with upper boundary", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 8,
        upper: 2
      };
      const t = 1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float with lower boundary", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 8,
        upper: 0,
        lower: -2
      };
      const t = -1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float without overflowing", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 8,
        upper: 0,
        lower: -2
      };
      const t = -1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float without overflowing", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 4
      };
      const t = 2;
      const a = "1111";
      const t_dec = 1;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float without underflowing", () => {
      const block = {
        key: "float",
        type: "float",
        bits: 4
      };
      const t = -1;
      const a = "0000";
      const t_dec = 0;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
  });

  describe("Encodes/Decodes Pad", () => {
    it("Pads message with length 2", () => {
      const block = {
        key: "pad 2",
        type: "pad",
        bits: 2
      };
      const a = "11";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), a.length);
    });
    it("Pads message with length 6", () => {
      const block = {
        key: "pad 6",
        type: "pad",
        bits: 6
      };
      const a = "111111";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), a.length);
    });
  });

  describe("Encodes/Decodes Array", () => {
    it("Encodes/Decodes an array", () => {
      const block = {
        key: "array",
        type: "array",
        bits: 8,
        blocks: {
          key: "array value",
          type: "integer",
          bits: 6
        }
      };
      const t = [1, 2, 3];
      const a = "00000011000001000010000011";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Truncates an array large the maximum length", () => {
      const block = {
        key: "array",
        type: "array",
        bits: 2,
        blocks: {
          key: "array value",
          type: "integer",
          bits: 6
        }
      };
      const t = [1, 2, 3, 4, 5];
      const a = "11000001000010000011";
      const t_dec = [1, 2, 3];
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes an empty array", () => {
      const block = {
        key: "array",
        type: "array",
        bits: 3,
        blocks: {
          key: "array value",
          type: "integer",
          bits: 6
        }
      };
      const t = [];
      const a = "000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes a nested array", () => {
      const block = {
        key: "array",
        type: "array",
        bits: 4,
        blocks: {
          key: "nested array",
          type: "array",
          bits: 6,
          blocks: {
            key: "array value",
            type: "integer",
            bits: 6
          }
        }
      };
      const t = [
        [1, 2],
        [3, 4, 5]
      ];
      const a = "0010000010000001000010000011000011000100000101";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
  });

  describe("Encodes/Decodes Object", () => {
    it("Encodes/Decodes Object", () => {
      const block = {
        key: "object",
        type: "object",
        items: [
          {
            key: "hello",
            type: "integer",
            bits: 5
          },
          {
            key: "catto",
            type: "boolean"
          }
        ]
      };
      const t = {
        hello: 14,
        catto: false
      };
      const a = "011100";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes Nested Object", () => {
      const block = {
        key: "object",
        type: "object",
        items: [
          {
            key: "hello",
            type: "integer",
            bits: 5
          },
          {
            key: "catto",
            type: "boolean"
          },
          {
            key: "neko",
            type: "object",
            items: [
              {
                key: "birds",
                type: "integer",
                bits: 4
              }
            ]
          }
        ]
      };
      const t = {
        hello: 14,
        catto: false,
        neko: {
          birds: 9
        }
      };
      const a = "0111001001";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Object RangeError", () => {
      const block = {
        key: "object",
        type: "object",
        items: [
          {
            key: "hello",
            type: "integer",
            bits: 5
          },
          {
            key: "catto",
            type: "boolean"
          },
          {
            key: "neko",
            type: "object",
            items: [
              {
                key: "birds",
                type: "integer",
                bits: 4
              }
            ]
          }
        ]
      };
      const t = {
        hello: 14,
        catto: false
      };
      assert.throws(() => spos.encodeBlock(t, block), RangeError);
    });
  });
  describe("Encodes/Decodes String", () => {
    it("Encodes/Decodes String", () => {
      const block = {
        key: "message",
        type: "string",
        length: 12
      };
      const t = "my message";
      const a =
        "111110111110100110110010111110100110011110101100101100011010100000011110";
      const t_dec = "++my+message";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes String with an unknown character", () => {
      const block = {
        key: "message",
        type: "string",
        length: 12
      };
      const t = "my message%";
      const a =
        "111110100110110010111110100110011110101100101100011010100000011110111111";
      const t_dec = "+my+message/";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });

    it("Encodes/Decodes String with a custom alphabeth", () => {
      const block = {
        key: "message",
        type: "string",
        length: 12,
        custom_alphabeth: {
          0: "%"
        }
      };
      const t = "my message%";
      const a =
        "111110100110110010111110100110011110101100101100011010100000011110000000";
      const t_dec = "+my+message%";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
  });
  describe("Encodes/Decodes Steps", () => {
    it("Encodes/Decodes Steps", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10],
        steps_names: ["critical", "low", "charged", "full"]
      };
      const t = 2;
      const a = "01";
      const t_dec = "low";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes index 0", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10],
        steps_names: ["critical", "low", "charged", "full"]
      };
      const t = -1;
      const a = "00";
      const t_dec = "critical";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes lower boundary", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10],
        steps_names: ["critical", "low", "charged", "full"]
      };
      const t = 5;
      const a = "10";
      const t_dec = "charged";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes last index", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10],
        steps_names: ["critical", "low", "charged", "full"]
      };
      const t = 11;
      const a = "11";
      const t_dec = "full";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Generates steps names if 'steps_names' is not provided.", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10]
      };
      const t = 1;
      const a = "01";
      const t_dec = "0<=x<5";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Throws an error if 'steps_names' doesn't have the correct length.", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10],
        steps_names: ["one", "two"]
      };
      const t = 1;
      assert.throws(() => spos.encodeBlock(t, block), RangeError);
    });
  });
  describe("Encodes/Decodes Categories", () => {
    it("Encodes/Decodes Categories 1", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue"]
      };
      const t = "wizard";
      const a = "01";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes Categories 2", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue"]
      };
      const t = "fighter";
      const a = "00";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes Categories 3", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue"]
      };
      const t = "rogue";
      const a = "10";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes Categories error", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue"]
      };
      const t = "unknown";
      const a = "11";
      const t_dec = "error";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
  });
});

describe("Bin Encodes/Decodes payloadData", () => {
  it("Bin Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45
    };
    const payloadSpec = {
      items: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 }
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"]
          }
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50
        }
      ]
    };
    const message =
      "0000001111101100101100000011000010000001010010011001011000000010110100101010101011100011";
    assert.equal(spos.encodeBin(payloadData, payloadSpec), message);
    const decoded = spos.decodeBin(message, payloadSpec);
    assert.payload(payloadSpec, payloadData, decoded);
  });
});

describe("Calculates crc8", () => {
  it("Calculates and validates crc8", () => {
    const payloadData = {
      value1: 1,
      value2: "kitten",
      value3: 0.9,
      value4: true
    };
    const payloadSpec = {
      crc8: true,
      items: [
        {
          key: "value1",
          type: "integer",
          bits: 8
        },
        {
          key: "value2",
          type: "categories",
          categories: ["cat", "kitten", "cute"]
        },
        { key: "value3", type: "float", bits: 8 },
        {
          key: "value4",
          type: "boolean"
        }
      ]
    };
    const message = "00000001011110011010000001010100";
    assert.equal(spos.encodeBin(payloadData, payloadSpec), message);
    const decoded = spos.decodeBin(message, payloadSpec);
    assert.payload(payloadSpec, payloadData, decoded);
    assert.isTrue(decoded.crc8);
  });
});

describe("Hex Encodes/Decodes payloadData", () => {
  it("Hex Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45
    };
    const payloadSpec = {
      items: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 }
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"]
          }
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50
        }
      ]
    };
    const message = "03ecb03081499602d2aae3";
    assert.equal(spos.hexEncode(payloadData, payloadSpec), message);
    const decoded = spos.hexDecode(message, payloadSpec);
    assert.payload(payloadSpec, payloadData, decoded);
  });
});

describe("Encodes/Decodes payloadData", () => {
  it("Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45
    };
    const payloadSpec = {
      items: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 }
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"]
          }
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50
        }
      ]
    };
    const message = new Uint8Array([
      3,
      236,
      176,
      48,
      129,
      73,
      150,
      2,
      210,
      170,
      227
    ]);
    assert.deepEqual(spos.encode(payloadData, payloadSpec), message);
    const decoded = spos.decode(message, payloadSpec);
    assert.payload(payloadSpec, payloadData, decoded);
  });
});
