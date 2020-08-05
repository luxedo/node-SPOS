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
const { utils } = require("../spos/utils.js");

const DELTA = 0.1;

assert.arrayCloseTo = (actual, expected, delta = DELTA) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, idx) => {
    if (utils.isObject(actual[idx]))
      assert.objectCloseTo(actual[idx], expected[idx], delta);
    else if (Array.isArray(actual[idx]))
      assert.arrayCloseTo(actual[idx], expected[idx], delta);
    else if (utils.isString(actual[idx]) || utils.isBoolean(actual[idx]))
      assert.equal(actual[idx], expected[idx]);
    else assert.closeTo(actual[idx], expected[idx], delta);
  });
};

assert.objectCloseTo = (actual, expected, delta = DELTA) => {
  let keysA = Object.keys(actual);
  let keysE = Object.keys(expected);
  keysA.sort();
  keysE.sort();
  assert.deepEqual(keysA, keysE);
  Object.keys(actual).forEach((key) => {
    if (utils.isObject(actual[key]))
      assert.objectCloseTo(actual[key], expected[key], delta);
    else if (Array.isArray(actual[key]))
      assert.arrayCloseTo(actual[key], expected[key], delta);
    else if (utils.isString(actual[key]) || utils.isBoolean(actual[key]))
      assert.equal(actual[key], expected[key]);
    else assert.closeTo(actual[key], expected[key], delta);
  });
};

describe("Encodes/Decodes Block", () => {
  describe("Encodes/Decodes Boolean", () => {
    it("Encodes/Decodes true to '1' and vice versa", () => {
      const block = {
        key: "boolean true",
        type: "boolean",
      };
      const t = true;
      const a = "1";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes false to '0' and vice versa", () => {
      const block = {
        key: "boolean false",
        type: "boolean",
      };
      const t = false;
      const a = "0";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes integer to boolean", () => {
      const block = {
        key: "boolean false",
        type: "boolean",
      };
      const e1 = 0;
      const t1 = false;
      const a1 = "0";
      assert.equal(spos.encodeBlock(e1, block), a1);
      assert.equal(spos.decodeBlock(a1, block), t1);
      const e2 = 1;
      const t2 = true;
      const a2 = "1";
      assert.equal(spos.encodeBlock(e2, block), a2);
      assert.equal(spos.decodeBlock(a2, block), t2);
    });
  });
  describe("Encodes/Decodes Binary", () => {
    it("Encodes/Decodes a binary block", () => {
      const block = {
        key: "encode binary",
        type: "binary",
        bits: 16,
      };
      const t = "1010111010101011";
      assert.equal(spos.encodeBlock(t, block), t);
      assert.equal(spos.decodeBlock(t, block), t);
    });
    it("Encodes/Decodes an hex block", () => {
      const block = {
        key: "encode binary",
        type: "binary",
        bits: 32,
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
        bits: 6,
      };
      const t = "1010111010101011";
      const a = "101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Truncates an hex value", () => {
      const block = {
        key: "encode hex truncate",
        type: "binary",
        bits: 6,
      };
      const t = "deadbeef";
      const a = "110111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads a binary value", () => {
      const block = {
        key: "encode binary pad",
        type: "binary",
        bits: 18,
      };
      const t = "1010111010101011";
      const a = "001010111010101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads an hex value", () => {
      const block = {
        key: "encode hex pad",
        type: "binary",
        bits: 34,
      };
      const t = "deadbeef";
      const a = "0011011110101011011011111011101111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Throws an error when passing a malformed input", () => {
      const block = {
        key: "encode hex pad",
        type: "binary",
        bits: 34,
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
        bits: 4,
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
        offset: 200,
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
        bits: 6,
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
        offset: 220,
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
        bits: 8,
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
        approximation: "floor",
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
        approximation: "ceil",
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
        upper: 2,
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
        lower: -2,
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
        lower: -2,
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
        bits: 4,
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
        bits: 4,
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
        bits: 2,
      };
      const a = "11";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), null);
    });
    it("Pads message with length 6", () => {
      const block = {
        key: "pad 6",
        type: "pad",
        bits: 6,
      };
      const a = "111111";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), null);
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
          bits: 6,
        },
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
          bits: 6,
        },
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
          bits: 6,
        },
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
            bits: 6,
          },
        },
      };
      const t = [
        [1, 2],
        [3, 4, 5],
      ];
      const a = "0010000010000001000010000011000011000100000101";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
  });

  describe("Encodes/Decodes object", () => {
    it("Encodes/Decodes object", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "hello",
            type: "integer",
            bits: 5,
          },
          {
            key: "catto",
            type: "boolean",
          },
        ],
      };
      const t = {
        hello: 14,
        catto: false,
      };
      const a = "011100";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes nested object", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "hello",
            type: "integer",
            bits: 5,
          },
          {
            key: "catto",
            type: "boolean",
          },
          {
            key: "neko",
            type: "object",
            blocklist: [
              {
                key: "birds",
                type: "integer",
                bits: 4,
              },
            ],
          },
        ],
      };
      const t = {
        hello: 14,
        catto: false,
        neko: {
          birds: 9,
        },
      };
      const a = "0111001001";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.deepEqual(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes with dot notation", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "best.best",
            type: "boolean",
          },
          {
            key: "nest.hello",
            type: "integer",
            bits: 5,
          },
          {
            key: "nest.catto",
            type: "boolean",
          },
          {
            key: "nest.neko",
            type: "object",
            blocklist: [
              {
                key: "birds",
                type: "integer",
                bits: 4,
              },
            ],
          },
        ],
      };
      const t = {
        best: { best: true },
        nest: {
          hello: 14,
          catto: false,
          neko: {
            birds: 9,
          },
        },
      };
      assert.deepEqual(spos.decodeBlock(spos.encodeBlock(t, block), block), t);
    });
    it("Object RangeError", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "hello",
            type: "integer",
            bits: 5,
          },
          {
            key: "catto",
            type: "boolean",
          },
          {
            key: "neko",
            type: "object",
            blocklist: [
              {
                key: "birds",
                type: "integer",
                bits: 4,
              },
            ],
          },
        ],
      };
      const t = {
        hello: 14,
        catto: false,
      };
      assert.throws(() => spos.encodeBlock(t, block), RangeError);
    });
    it("Array in object", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "data",
            type: "array",
            bits: 5,
            blocks: {
              key: "catto",
              type: "integer",
              bits: 4,
            },
          },
        ],
      };
      const t = {
        data: [1, 2, 3, 4],
      };
      assert.deepEqual(spos.decodeBlock(spos.encodeBlock(t, block), block), t);
    });
    it("Array in object", () => {
      const block = {
        key: "object",
        type: "object",
        blocklist: [
          {
            key: "data",
            type: "array",
            bits: 5,
            blocks: {
              key: "catto",
              type: "object",
              blocklist: [
                {
                  key: "neko",
                  type: "integer",
                  bits: 4,
                },
              ],
            },
          },
        ],
      };
      const t = {
        data: [{ neko: 1 }, { neko: 2 }, { neko: 3 }, { neko: 4 }],
      };
      assert.deepEqual(spos.decodeBlock(spos.encodeBlock(t, block), block), t);
    });
  });
  describe("Encodes/Decodes String", () => {
    it("Encodes/Decodes String", () => {
      const block = {
        key: "message",
        type: "string",
        length: 12,
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
        length: 12,
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
          0: "%",
        },
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
        steps_names: ["critical", "low", "charged", "full"],
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
        steps_names: ["critical", "low", "charged", "full"],
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
        steps_names: ["critical", "low", "charged", "full"],
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
        steps_names: ["critical", "low", "charged", "full"],
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
        steps: [0, 5, 10],
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
        steps_names: ["one", "two"],
      };
      const t = 1;
      assert.throws(() => spos.encodeBlock(t, block), RangeError);
    });
    it("Throws an error if 'steps' is not ordered.", () => {
      const block = {
        key: "steps",
        type: "steps",
        steps: [0, 5, 10, 6],
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
        categories: ["fighter", "wizard", "rogue"],
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
        categories: ["fighter", "wizard", "rogue"],
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
        categories: ["fighter", "wizard", "rogue"],
      };
      const t = "rogue";
      const a = "10";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes Categories unknown", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue"],
      };
      const t = "missing category";
      const a = "11";
      const t_dec = "unknown";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes Categories error", () => {
      const block = {
        key: "categories",
        type: "categories",
        categories: ["fighter", "wizard", "rogue", "mage"],
      };
      const a = "111";
      const t_dec = "error";
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
  });
});

describe("validate block", () => {
  it("Throws an exception when passing a block without key", () => {
    const block = {
      type: "boolean",
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when key is not a string", () => {
    const block = {
      key: 1,
    };
    assert.throws(() => spos.encodeBlock(true, block), RangeError);
  });
  it("Throws an exception when passing a block without type", () => {
    const block = {
      key: "testKey",
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when passing a block with an unknown type", () => {
    const block = {
      key: "test",
      type: "unknown",
    };
    assert.throws(() => spos.encodeBlock(true, block), RangeError);
  });
  it("Throws an exception when missing a required key", () => {
    const block = {
      key: "test",
      type: "binary",
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
  it("Throws an exception when the type of a required key is invalid", () => {
    const block = {
      key: "test",
      type: "binary",
      bits: "err",
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when passing wrong type for required array", () => {
    const block = {
      key: "test",
      type: "categories",
      categories: "err",
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when passing wrong type for optional array", () => {
    const block = {
      key: "test",
      type: "steps",
      steps: [1, 2],
      steps_names: "err",
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when the type of an optional key is invalid", () => {
    const block = {
      key: "test",
      type: "integer",
      bits: 6,
      offset: "err",
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when the block as an unexpected key", () => {
    const block = {
      key: "test",
      type: "integer",
      bits: 6,
      offset: 0,
      error_key: true,
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
});

describe("validate value", () => {
  it("Throws an exception when the array input has wrong type", () => {
    const block = {
      key: "test",
      type: "array",
      bits: 6,
      blocks: {
        key: "array value",
        type: "boolean",
      },
    };
    const value = "err";
    assert.throws(() => spos.encodeBlock(value, block), RangeError);
  });
});

describe("validate payloadSpec", () => {
  it("validates payload spec missing name key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      version: 0,
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), ReferenceError);
  });
  it("validates payload spec wrong type for name key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: 123,
      version: 0,
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("validates payload spec missing version key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), ReferenceError);
  });
  it("validates payload spec wrong type for version key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: "0",
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("validates payload spec missing body key", () => {
    const payloadData = {};
    const payloadSpec = {
      name: "body",
      version: 0,
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), ReferenceError);
  });
  it("validates payload spec wrong type for body key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "body",
      version: 0,
      body: {
        key: "art",
        type: "boolean",
      },
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("validates payload spec unexpected keys", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: 0,
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
      extra: true,
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
});

describe("Encodes/Decodes payloadData", () => {
  it("Test getSubitems", () => {
    const payloadData = {
      holy: {
        grail: true,
        deeper: {
          mariana: 11,
        },
      },
    };
    const payloadSpec = {
      name: "subitems",
      version: 0,
      body: [
        {
          key: "holy.grail",
          type: "boolean",
        },
        {
          key: "holy.deeper.mariana",
          type: "integer",
          bits: 7,
        },
      ],
    };
    const decoded = spos.decode(
      spos.encode(payloadData, payloadSpec),
      payloadSpec
    );
    assert.objectCloseTo(decoded.body, payloadData);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
    });
  });
  it("Bin Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45,
    };
    const payloadSpec = {
      name: "payload",
      version: 0,

      body: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 },
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"],
          },
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13,
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50,
        },
      ],
    };
    const message =
      "0000001111101100101000000011000010000001010010011001011000000010110100101010101011100011";
    const enc = spos.encode(payloadData, payloadSpec, "bin");
    assert.equal(enc, message);
    const decoded = spos.decode(enc, payloadSpec, "bin");
    payloadData.msg_version = 1;
    assert.objectCloseTo(decoded.body, payloadData);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
    });
  });
  it("Hex Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45,
    };
    const payloadSpec = {
      name: "payload",
      version: 0,

      body: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 },
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"],
          },
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13,
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50,
        },
      ],
    };
    const message = "03eca03081499602d2aae3";
    const enc = spos.encode(payloadData, payloadSpec, "hex");
    assert.equal(enc, message);
    const decoded = spos.decode(enc, payloadSpec, "hex");
    payloadData.msg_version = 1;
    assert.objectCloseTo(decoded.body, payloadData);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
    });
  });
  it("Bytes Encodes/Decodes payloadData", () => {
    const payloadData = {
      confidences: [0.9, 0.8, 0.7],
      categories: ["bike", "bike", "scooter"],
      timestamp: 1234567890,
      voltage: 12,
      temperature: 45,
    };
    const payloadSpec = {
      name: "payload",
      version: 0,

      body: [
        {
          key: "confidences",
          type: "array",
          bits: 8,
          blocks: { key: "confidence", type: "float", bits: 4 },
        },
        {
          key: "categories",
          type: "array",
          bits: 8,
          blocks: {
            key: "category",
            type: "categories",
            categories: ["bike", "skate", "scooter"],
          },
        },
        { key: "msg_version", type: "integer", value: 1, bits: 6 },
        { key: "timestamp", type: "integer", bits: 32 },
        {
          key: "voltage",
          type: "float",
          bits: 8,
          lower: 10,
          upper: 13,
        },
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50,
        },
      ],
    };
    const message = [3, 236, 160, 48, 129, 73, 150, 2, 210, 170, 227];

    const enc = spos.encode(payloadData, payloadSpec, "bytes");
    assert.arrayCloseTo(enc, message);
    const decoded = spos.decode(enc, payloadSpec, "bytes");
    payloadData.msg_version = 1;
    assert.objectCloseTo(decoded.body, payloadData);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
    });
  });
  it("Throws errors trying to encode/decode with invalid format", () => {
    const payloadData = {
      data: true,
    };
    const payloadSpec = {
      name: "format",
      version: 0,
      body: [
        {
          key: "data",
          type: "boolean",
        },
      ],
    };
    assert.throws(
      () => spos.encode(payloadData, payloadSpec, "err"),
      RangeError
    );
    assert.throws(
      () =>
        spos.decode(spos.encode(payloadData, payloadSpec), payloadSpec, "err"),
      RangeError
    );
  });
});
describe("Encodes/Decodes payloadSpec with meta", () => {
  it("Encodes version", () => {
    const payloadData = {
      temperature: 45,
    };
    const payloadSpec = {
      name: "test encode version",
      version: 0,
      meta: {
        encode_version: true,
        version_bits: 6,
      },
      body: [
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50,
        },
      ],
    };
    const decoded = spos.decode(
      spos.encode(payloadData, payloadSpec),
      payloadSpec
    );
    assert.objectCloseTo(decoded.body, payloadData);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
    });
  });
  it("Throws an error if versions don't match", () => {
    const payloadData = {
      temperature: 45,
    };
    const payloadSpec = {
      name: "test encode version",
      version: 0,
      meta: {
        encode_version: true,
        version_bits: 6,
      },
      body: [
        {
          key: "temperature",
          type: "float",
          bits: 8,
          lower: 5,
          upper: 50,
        },
      ],
    };
    const encoded = spos.encode(payloadData, payloadSpec);
    payloadSpec.version = 1;
    assert.throws(() => spos.decode(encoded, payloadSpec), RangeError);
  });
  it("Calculates and validates crc8", () => {
    const payloadData = {
      value1: 1,
      value2: "kitten",
      value3: 0.9,
      value4: true,
      value5: 0.2,
    };
    const payloadSpec = {
      name: "crc payload",
      version: 0,
      meta: {
        crc8: true,
      },
      body: [
        {
          key: "value1",
          type: "integer",
          bits: 8,
        },
        {
          key: "value2",
          type: "categories",
          categories: ["cat", "kitten", "cute"],
        },
        { key: "value3", type: "float", bits: 8 },
        {
          key: "value4",
          type: "boolean",
        },
        {
          key: "value5",
          type: "steps",
          steps: [0.1, 0.9],
          steps_names: ["a", "b", "c"],
        },
      ],
    };
    const decPayload = JSON.parse(JSON.stringify(payloadData));
    decPayload.value5 = "b";
    const message = "00000001011110011010100000100101";
    assert.equal(spos.encode(payloadData, payloadSpec), message);
    const decoded = spos.decode(message, payloadSpec);
    assert.objectCloseTo(decoded.body, decPayload);
    assert.deepEqual(decoded.meta, {
      name: payloadSpec.name,
      version: payloadSpec.version,
      crc8: true,
    });
  });
  it("validates payload spec wrong type for meta key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: 0,
      meta: [],
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("validates payload spec wrong type for meta.crc8 key", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: 0,
      meta: {
        crc8: "error",
      },
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("validates payload unexpected key for meta object", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: 0,
      meta: {
        extra: true,
      },
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("Encodes data in header", () => {
    const payloadData = {
      value1: 1,
      value2: "kitten",
      value3: 0.9,
      value4: true,
      value5: 0.2,
    };
    const payloadSpec = {
      name: "header data",
      version: 0,
      meta: {
        crc8: true,
        header: [
          {
            key: "value4",
            type: "boolean",
          },
          {
            key: "value5",
            type: "steps",
            steps: [0.1, 0.9],
            steps_names: ["a", "b", "c"],
          },
        ],
      },
      body: [
        {
          key: "value1",
          type: "integer",
          bits: 8,
        },
        {
          key: "value2",
          type: "categories",
          categories: ["cat", "kitten", "cute"],
        },
        { key: "value3", type: "float", bits: 8 },
      ],
    };
    const enc = spos.encode(payloadData, payloadSpec);
    const message = "10100000001011110011000010110101";
    assert.equal(enc, message);
    assert.objectCloseTo(spos.decode(enc, payloadSpec), {
      meta: {
        name: "header data",
        version: 0,
        crc8: true,
        header: { value4: true, value5: "b" },
      },
      body: { value1: 1, value2: "kitten", value3: 0.9 },
    });
  });
  it("validates payload unexpected type for meta.header array", () => {
    const payloadData = {
      art: true,
    };
    const payloadSpec = {
      name: "name",
      version: 0,
      meta: {
        header: "err",
      },
      body: [
        {
          key: "art",
          type: "boolean",
        },
      ],
    };
    assert.throws(() => spos.encode(payloadData, payloadSpec), RangeError);
  });
  it("Does not encodes static data in header", () => {
    const payloadData = {
      value1: 1,
      value2: "kitten",
      value3: 0.9,
      value4: true,
      value5: 0.2,
    };
    const payloadSpec = {
      name: "header data",
      version: 0,
      meta: {
        crc8: true,
        header: [
          {
            key: "value4",
            type: "boolean",
          },
          {
            key: "value5",
            type: "steps",
            steps: [0.1, 0.9],
            steps_names: ["a", "b", "c"],
          },
          {
            key: "static1",
            value: "my static message",
          },
          {
            key: "static2",
            value: ["static too", 2],
          },
        ],
      },
      body: [
        {
          key: "value1",
          type: "integer",
          bits: 8,
        },
        {
          key: "value2",
          type: "categories",
          categories: ["cat", "kitten", "cute"],
        },
        { key: "value3", type: "float", bits: 8 },
      ],
    };
    const enc = spos.encode(payloadData, payloadSpec);
    const message = "10100000001011110011000010110101";
    assert.equal(enc, message);
    assert.objectCloseTo(spos.decode(enc, payloadSpec), {
      meta: {
        name: "header data",
        version: 0,
        crc8: true,
        header: {
          value4: true,
          value5: "b",
          static1: "my static message",
          static2: ["static too", 2],
        },
      },
      body: { value1: 1, value2: "kitten", value3: 0.9 },
    });
  });
});

describe("Encodes/Decodes from multiple payloadSpecs", () => {
  beforeEach(() => {
    this.payload_spec_0 = {
      name: "my spec",
      version: 0,
      meta: { encode_version: true, version_bits: 6 },
      body: [
        { key: "sensor x", type: "boolean" },
        { key: "sensor y", type: "integer", bits: 10 },
      ],
    };
    this.payload_spec_1 = {
      name: "my spec",
      version: 1,
      meta: { encode_version: true, version_bits: 6 },
      body: [
        { key: "sensor a", type: "float", bits: 6 },
        { key: "sensor b", type: "integer", bits: 10 },
      ],
    };
    this.payload_spec_2 = {
      name: "my spec",
      version: 2,
      meta: { encode_version: true, version_bits: 6 },
      body: [
        { key: "temperature", type: "float", bits: 10 },
        { key: "sunlight", type: "float", bits: 8 },
      ],
    };
    this.payload_spec_3 = {
      name: "my spec",
      version: 3,
      meta: { encode_version: true, version_bits: 6 },
      body: [
        { key: "night", type: "boolean" },
        { key: "fog", type: "boolean" },
      ],
    };
    this.specs = [
      this.payload_spec_0,
      this.payload_spec_1,
      this.payload_spec_2,
      this.payload_spec_3,
    ];
  });
  it("Encodes/Decodes from multiple payloadSpecs", () => {
    let t0 = { "sensor x": false, "sensor y": 19 };
    let enc0 = spos.encode(t0, this.payload_spec_0);
    let dec0 = spos.decodeFromSpecs(enc0, this.specs);
    assert.objectCloseTo(dec0.body, t0);
    assert.objectCloseTo(dec0.meta, {
      name: this.payload_spec_0.name,
      version: this.payload_spec_0.version,
    });
    let t1 = { "sensor a": 0.4, "sensor b": 500 };
    let enc1 = spos.encode(t1, this.payload_spec_1);
    let dec1 = spos.decodeFromSpecs(enc1, this.specs);
    assert.objectCloseTo(dec1.body, t1);
    assert.objectCloseTo(dec1.meta, {
      name: this.payload_spec_1.name,
      version: this.payload_spec_1.version,
    });
  });
  it("thows an error for version mismatch", () => {
    let t = { "sensor x": false, "sensor y": 19 };
    let enc = spos.encode(t, this.payload_spec_0);
    enc = enc.slice(0, 2) + "1" + enc.slice(3);
    assert.throws(() => spos.decodeFromSpecs(enc, this.specs), RangeError);
  });
  it("thows an error for name mismatch", () => {
    let t = { "sensor x": false, "sensor y": 19 };
    let enc = spos.encode(t, this.payload_spec_0);
    this.specs[0].name = "error";
    assert.throws(() => spos.decodeFromSpecs(enc, this.specs), RangeError);
  });
  it("thows an error for duplicate version", () => {
    let t = { "sensor x": false, "sensor y": 19 };
    let enc = spos.encode(t, this.payload_spec_0);
    this.specs[0].version = 3;
    assert.throws(() => spos.decodeFromSpecs(enc, this.specs), RangeError);
  });
  it("thows an error if payloadSpecs is not an array", () => {
    let t = { "sensor x": false, "sensor y": 19 };
    let enc = spos.encode(t, this.payload_spec_0);
    this.specs[0].version = 3;
    assert.throws(
      () => spos.decodeFromSpecs(enc, { not: "array" }),
      RangeError
    );
  });
});
