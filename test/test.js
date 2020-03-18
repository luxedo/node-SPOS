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

describe("validateBlock", () => {
  it("Throws an exception when passing a block without name.", () => {
    const block = {
      type: "boolean"
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when passing a block without type.", () => {
    const block = {
      type: "boolean"
    };
    assert.throws(() => spos.encodeBlock(true, block), ReferenceError);
  });
  it("Throws an exception when passing a block with an unknown type.", () => {
    const block = {
      name: "test",
      type: "unknown"
    };
    assert.throws(() => spos.encodeBlock(true, block), RangeError);
  });
  it("Throws an exception when missing the settings argument.", () => {
    const block = {
      name: "test",
      type: "binary"
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
  it("Throws an exception when missing a key in a required settings argument.", () => {
    const block = {
      name: "test",
      type: "binary",
      settings: {}
    };
    assert.throws(() => spos.encodeBlock("0101", block), ReferenceError);
  });
  it("Throws an exception when the type of a required settings item is invalid.", () => {
    const block = {
      name: "test",
      type: "binary",
      settings: { bits: "err" }
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
  it("Throws an exception when the type of an optional settings item is invalid.", () => {
    const block = {
      name: "test",
      type: "integer",
      settings: { bits: 6, offset: "err" }
    };
    assert.throws(() => spos.encodeBlock("0101", block), RangeError);
  });
});

describe("validateValue", () => {});

describe("validateMessage", () => {
  it("Throws an exception when passing a string that doesn't represent a binary.", () => {
    const block = {
      name: "test",
      type: "boolean"
    };
    assert.throws(() => spos.decodeBlock("error", block), RangeError);
  });
});

describe("Encodes/Decodes Block", () => {
  describe("Encodes/Decodes Boolean", () => {
    it("Encodes/Decodes true to '1' and vice versa.", () => {
      const block = {
        name: "boolean true",
        type: "boolean"
      };
      const t = true;
      const a = "1";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes false to '0' and vice versa.", () => {
      const block = {
        name: "boolean false",
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
        name: "encode binary",
        type: "binary",
        settings: {
          bits: 16
        }
      };
      const t = "1010111010101011";
      assert.equal(spos.encodeBlock(t, block), t);
      assert.equal(spos.decodeBlock(t, block), t);
    });
    it("Encodes/Decodes an hex block", () => {
      const block = {
        name: "encode binary",
        type: "binary",
        settings: {
          bits: 32
        }
      };
      const t = "deadbeef";
      const a = "11011110101011011011111011101111";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), a);
    });
    it("Truncates a binary value", () => {
      const block = {
        name: "encode binary truncate",
        type: "binary",
        settings: {
          bits: 6
        }
      };
      const t = "1010111010101011";
      const a = "101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Truncates an hex value", () => {
      const block = {
        name: "encode hex truncate",
        type: "binary",
        settings: {
          bits: 6
        }
      };
      const t = "deadbeef";
      const a = "110111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads a binary value", () => {
      const block = {
        name: "encode binary pad",
        type: "binary",
        settings: {
          bits: 18
        }
      };
      const t = "1010111010101011";
      const a = "001010111010101011";
      assert.equal(spos.encodeBlock(t, block), a);
    });
    it("Pads an hex value", () => {
      const block = {
        name: "encode hex pad",
        type: "binary",
        settings: {
          bits: 34
        }
      };
      const t = "deadbeef";
      const a = "0011011110101011011011111011101111";
      assert.equal(spos.encodeBlock(t, block), a);
    });
  });

  describe("Encodes/Decodes Integer", () => {
    it("Encodes/Decodes an integer.", () => {
      const block = {
        name: "integer",
        type: "integer",
        settings: {
          bits: 4
        }
      };
      const t = 9;
      const a = "1001";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes an integer with offset.", () => {
      const block = {
        name: "integer offset",
        type: "integer",
        settings: {
          bits: 6,
          offset: 200
        }
      };
      const t = 210;
      const a = "001010";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t);
    });
    it("Encodes/Decodes an integer without overflowing.", () => {
      const block = {
        name: "integer offset",
        type: "integer",
        settings: {
          bits: 6
        }
      };
      const t = 210;
      const a = "111111";
      const t_dec = 63;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.equal(spos.decodeBlock(a, block), t_dec);
    });
    it("Encodes/Decodes an integer without underflowing.", () => {
      const block = {
        name: "integer offset",
        type: "integer",
        settings: {
          bits: 6,
          offset: 220
        }
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
        name: "float",
        type: "float",
        settings: {
          bits: 8
        }
      };
      const t = 0.5;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float with floor approximation.", () => {
      const block = {
        name: "float floor",
        type: "float",
        settings: {
          bits: 2,
          approximation: "floor"
        }
      };
      const t = 0.5;
      const a = "01";
      const t_dec = 0.33;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float with ceil approximation.", () => {
      const block = {
        name: "float ceil",
        type: "float",
        settings: {
          bits: 2,
          approximation: "ceil"
        }
      };
      const t = 0.5;
      const a = "10";
      const t_dec = 0.66;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float with upper boundary.", () => {
      const block = {
        name: "float",
        type: "float",
        settings: {
          bits: 8,
          upper: 2
        }
      };
      const t = 1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float with lower boundary.", () => {
      const block = {
        name: "float",
        type: "float",
        settings: {
          bits: 8,
          upper: 0,
          lower: -2
        }
      };
      const t = -1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float without overflowing.", () => {
      const block = {
        name: "float",
        type: "float",
        settings: {
          bits: 8,
          upper: 0,
          lower: -2
        }
      };
      const t = -1;
      const a = "10000000";
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t, DELTA);
    });
    it("Encodes/Decodes a float without overflowing.", () => {
      const block = {
        name: "float",
        type: "float",
        settings: {
          bits: 4
        }
      };
      const t = 2;
      const a = "1111";
      const t_dec = 1;
      assert.equal(spos.encodeBlock(t, block), a);
      assert.closeTo(spos.decodeBlock(a, block), t_dec, DELTA);
    });
    it("Encodes/Decodes a float without underflowing.", () => {
      const block = {
        name: "float",
        type: "float",
        settings: {
          bits: 4
        }
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
        name: "pad 2",
        type: "pad",
        settings: {
          bits: 2
        }
      };
      const a = "11";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), a.length);
    });
    it("Pads message with length 6", () => {
      const block = {
        name: "pad 6",
        type: "pad",
        settings: {
          bits: 6
        }
      };
      const a = "111111";
      assert.equal(spos.encodeBlock(null, block), a);
      assert.equal(spos.decodeBlock(a, block), a.length);
    });
  });

  describe("Encodes/Decodes Array", () => {
    //it("Encodes/Decodes an array", () => {
    //  const block = {
    //    name: "array",
    //    type: "array",
    //    settings: {
    //      bits: 8,
    //      blocks: {
    //        name: "array value",
    //        type: "integer",
    //        settings: {
    //          bits: 6
    //        }
    //      }
    //    }
    //  };
    //  const a = "11";
    //  assert.equal(spos.encodeBlock(null, block), a);
    //  assert.equal(spos.decodeBlock(a, block), a.length);
    //});
    // it("Pads message with length 6", () => {
    //   const block = {
    //     name: "pad 6",
    //     type: "pad",
    //     settings: {
    //       bits: 6
    //     }
    //   };
    //   const a = "111111"
    //   assert.equal(spos.encodeBlock(null, block), a);
    //   assert.equal(spos.decodeBlock(a, block), a.length);
    // });
  });
  // def test_array_block(self):
  // def test_array_truncate(self):
  // def test_array_empty(self):
  // def test_array_nested(self):
});
