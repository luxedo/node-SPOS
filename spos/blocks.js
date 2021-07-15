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
const { utils } = require("./utils.js");

class BlockABC {
  constructor(blockSpec) {
    this.input = [];
    this.required = {};
    this.optional = {};

    this.initVariables();

    this.blockSpec = blockSpec;
    if ("bits" in blockSpec) this.bits = blockSpec.bits;
    if ("value" in blockSpec) {
      this.value = blockSpec.value;
    }
  }

  initVariables() {}

  validateBlockSpecKeys(blockSpec) {
    // Check required settings
    for (const [key, value] of Object.entries(this.required)) {
      if (!(key in blockSpec))
        throw new ReferenceError(`Block must have key ${key}`);
      if (!this.validateType(value, blockSpec[key]))
        throw new RangeError(
          `Block ${blockSpec.key} key '${key}' has unexpected type.`
        );
    }

    // Check optional settings
    Object.entries(this.optional).forEach(([key, value]) => {
      if (key in blockSpec) this.validateType(value, blockSpec[key]);
      else {
        this.blockSpec[key] = value.default;
      }
    });

    // Check for unexpected keys
    Object.keys(blockSpec).forEach((key) => {
      if (
        !(
          Object.keys(this.required).includes(key) ||
          Object.keys(this.optional).includes(key) ||
          ["key", "type", "value"].includes(key)
        )
      )
        throw new ReferenceError(
          `Block '${blockSpec.key}' has an unexpected key '${key}'.`
        );
    });
  }

  /* Abstract Method*/
  initializeBlock(blockSpec) {}

  validateValue(value) {
    if (this.validateType(this.input, value)) return true;
    throw RangeError(`Unexpected type for value ${value}, ${this.input}.`);
  }

  validateType(types, value) {
    types = Array.isArray(types) ? types : [types];
    for (let tp of types) {
      if (tp == null) return true;
      else if (tp == "boolean" && typeof value == "boolean") return true;
      else if (tp == "integer" && Number.isInteger(value)) return true;
      else if (tp == "number" && utils.isNumber(value)) return true;
      else if (tp == "string" && utils.isString(value)) return true;
      else if (tp == "bin" && utils.isString(value) && value.match(/^[0-1]+$/))
        return true;
      else if (
        tp == "hex" &&
        utils.isString(value) &&
        value.match(/^([0-9a-zA-Z]{2})+$/)
      )
        return true;
      else if (tp == "array" && Array.isArray(value)) return true;
      else if (tp == "object" && utils.isObject(value)) return true;
      else if (tp == "blocklist" && Array.isArray(value)) return true;
      else if (tp == "blocks" && utils.isObject(value)) return true;
    }
    return false;
  }

  /* Abstract Method*/
  _binEncode(value) {}
  binEncode(value) {
    if (this.value) {
      return this._binEncode(this.value);
    }
    this.validateValue(value);
    return this._binEncode(value);
  }

  /* Abstract Method*/
  _binDecode(message) {}
  binDecode(message) {
    return this._binDecode(message);
  }

  consume(message) {
    let bits = this.accumulateBits(message);
    let value = this.binDecode(message.slice(0, bits));
    return [value, message.slice(bits)];
  }

  accumulateBits(message) {
    return this.bits;
  }
}

class BooleanBlock extends BlockABC {
  initVariables() {
    this.input = ["boolean", "integer"];
    this.bits = 1;
  }

  _binEncode(value) {
    value = Number.isInteger(value) ? value !== 0 : value;
    return value === true ? "1" : "0";
  }

  _binDecode(message) {
    return message === "1";
  }
}

class BinaryBlock extends BlockABC {
  initVariables() {
    this.input = ["bin", "hex"];
    this.required = { bits: "integer" };
  }

  _binEncode(value) {
    value = !(value.replace(/[01]/g, "") == "")
      ? (value = parseInt(value, 16)
          .toString(2)
          .padStart(value.length * 4, "0"))
      : value;
    return value.padStart(this.bits, "0").slice(0, this.bits);
  }

  _binDecode(message) {
    return message;
  }
}

class IntegerBlock extends BlockABC {
  initVariables() {
    this.input = ["integer"];
    this.required = { bits: "integer" };
    this.optional = {
      offset: { type: "integer", default: 0 },
      mode: {
        type: "string",
        default: "truncate",
        choices: ["truncate", "remainder"],
      },
    };
  }

  _binEncode(value) {
    const overflow = Math.pow(2, this.bits) - 1;
    value -= this.blockSpec.offset;
    if (this.blockSpec.mode == "remainder") {
      value %= Math.pow(2, this.blockSpec.bits);
    } else {
      value = Math.min(overflow, Math.max(0, value));
    }
    return value.toString(2).padStart(this.bits, "0");
  }

  _binDecode(message) {
    return this.blockSpec.offset + parseInt(message, 2);
  }
}

class FloatBlock extends BlockABC {
  initVariables() {
    this.input = ["number"];
    this.required = { bits: "integer" };
    this.optional = {
      lower: { type: "number", default: 0 },
      upper: { type: "number", default: 1 },
      approximation: {
        type: "string",
        default: "round",
        choices: ["round", "floor", "ceil"],
      },
    };
  }

  _binEncode(value) {
    const bits = this.bits;
    const upper = this.blockSpec.upper;
    const lower = this.blockSpec.lower;
    const approximation =
      this.blockSpec.approximation == "ceil"
        ? Math.ceil
        : this.blockSpec.approximation == "floor"
        ? Math.floor
        : utils.round2Even;
    const overflow = Math.pow(2, this.bits) - 1;
    const delta = upper - lower;
    value = (overflow * (value - lower)) / delta;
    value = approximation(Math.min(overflow, Math.max(0, value)));
    return value.toString(2).padStart(this.bits, "0");
  }

  _binDecode(message) {
    const overflow = Math.pow(2, this.bits) - 1;
    return (
      (parseInt(message, 2) * (this.blockSpec.upper - this.blockSpec.lower)) /
        overflow +
      this.blockSpec.lower
    );
  }
}

class PadBlock extends BlockABC {
  initVariables() {
    this.input = [null];
    this.required = { bits: "integer" };
  }
  _binEncode(value) {
    return "".padStart(this.bits, "1");
  }
  _binDecode(message) {
    return null;
  }
}

class ArrayBlock extends BlockABC {
  initVariables() {
    this.input = ["array"];
    this.required = { length: "integer", blocks: "blocks" };
    this.optional = { fixed: { type: "boolean", default: false } };
  }

  initializeBlock(blockSpec) {
    this.bits = Math.ceil(Math.log2(blockSpec.length + 1));
    this.lengthBlock = new Block({
      key: "length",
      type: "integer",
      bits: this.bits,
    });
    this.itemsBlock = new Block(blockSpec.blocks);
  }
  _binEncode(value) {
    let message = "";
    let length;
    if (this.blockSpec.fixed) {
      length = this.blockSpec.length;
    } else {
      length =
        value.length > this.blockSpec.length
          ? this.blockSpec.length
          : value.length;
      message += this.lengthBlock.binEncode(length);
    }
    message += value
      .slice(0, length)
      .reduce((acc, v, idx) => acc + this.itemsBlock.binEncode(v), "");
    return message;
  }
  _binDecode(message) {
    let length;
    if (!this.blockSpec.fixed) {
      [length, message] = this.lengthBlock.consume(message);
    } else {
      length = this.blockSpec.length;
    }
    let value = [];
    for (let i = 0; i < length; i++) {
      let v;
      [v, message] = this.itemsBlock.consume(message);
      value.push(v);
    }
    return value;
  }
  accumulateBits(message) {
    let bits = 0;
    let length, msg;
    if (!this.blockSpec.fixed) {
      [length, msg] = this.lengthBlock.consume(message);
      bits += this.bits;
    } else {
      length = this.blockSpec.length;
      msg = message;
    }
    bits += length * this.itemsBlock.accumulateBits(msg);
    return bits;
  }
}

class ObjectBlock extends BlockABC {
  initVariables() {
    this.input = ["object"];
    this.required = { blocklist: "blocklist" };
  }

  initializeBlock(blockSpec) {
    this.blocklist = blockSpec.blocklist.map((b_spec) => new Block(b_spec));
  }
  getValue(key, obj) {
    let ks = key.split(".");
    if (ks.length > 1) return this.getValue(ks.slice(1).join("."), obj[ks[0]]);
    return obj[key];
  }
  nestObject(obj) {
    let newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      let kSplit = key.split(".");
      let newVal;
      if (kSplit.length > 1) {
        let inKey = kSplit[0];
        let newKey = kSplit.slice(1).join(".");
        let nest = {};
        nest[newKey] = value;
        newVal = this.nestObject(nest);
        newObj[inKey] = this.mergeObj(newObj[inKey] || {}, newVal);
      } else {
        if (Array.isArray(value)) {
          if (utils.isObject(value[0]))
            newObj[key] = value.map(this.nestObject);
          else newObj[key] = value;
        } else if (utils.isObject(value)) {
          newObj[key] = this.mergeObj(newObj[key] || {}, value);
        } else {
          newObj[key] = value;
        }
      }
    }
    return newObj;
  }
  removeNull(obj) {
    let newObj = {};
    for (const [key, val] of Object.entries(obj)) {
      if (utils.isObject(val)) {
        newObj[key] = this.removeNull(obj[key]);
      } else {
        newObj[key] = val;
      }
      if (newObj[key] == null) {
        delete newObj[key];
      }
    }
    return newObj;
  }
  mergeObj(obj1, obj2) {
    let merged = JSON.parse(JSON.stringify(obj1));
    for (const [key, val] of Object.entries(obj2)) {
      if (utils.isObject(val)) {
        merged[key] = this.mergeObj(merged[key] || {}, val);
      } else {
        merged[key] = val;
      }
    }
    return merged;
  }
  _binEncode(value) {
    return this.blocklist
      .map((block) =>
        block.binEncode(this.getValue(block.blockSpec.key, value))
      )
      .join("");
  }
  _binDecode(message) {
    let values = {};
    for (let block of this.blocklist) {
      let v;
      [v, message] = block.consume(message);
      values[block.blockSpec.key] = v;
    }
    return this.removeNull(this.nestObject(values));
  }
  accumulateBits(message) {
    return this.blocklist.reduce(
      ([bits, message], block) => {
        let b = block.accumulateBits(message);
        return [bits + b, message.slice(b)];
      },
      [0, message]
    )[0];
  }
}

class StringBlock extends BlockABC {
  initVariables() {
    this.input = ["string"];
    this.required = { length: "integer" };
    this.optional = { custom_alphabeth: { type: "object", default: {} } };
  }

  initializeBlock(blockSpec) {
    const _b64_alphabeth =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    this.alphabeth = utils.fromEntries(
      new Map(
        _b64_alphabeth.split("").map((c, i) => {
          if (i in blockSpec.custom_alphabeth)
            return [blockSpec.custom_alphabeth[i], i];
          return [c, i];
        })
      )
    );
    this.rev_alphabeth = Object.entries(this.alphabeth).reduce(
      (acc, [key, value]) => {
        acc[value] = key;
        return acc;
      },
      {}
    );
    this.letterBlock = new Block({ key: "letter", type: "integer", bits: 6 });
  }
  _binEncode(value) {
    value = value
      .padStart(this.blockSpec.length, " ")
      .substring(0, this.blockSpec.length);
    return value
      .split("")
      .map((char) =>
        char in this.alphabeth ? this.alphabeth[char] : char == " " ? 62 : 63
      )
      .map((index) => this.letterBlock.binEncode(index))
      .join("");
  }
  _binDecode(message) {
    return new Array(message.length / 6)
      .fill(0)
      .map((_, i) => message.substring(6 * i, 6 * (i + 1)))
      .map((message) => this.letterBlock.binDecode(message))
      .map((index) => this.rev_alphabeth[index])
      .join("");
  }
}

class StepsBlock extends BlockABC {
  initVariables() {
    this.input = "number";
    this.required = { steps: "array" };
    this.optional = { steps_names: { type: "array", default: [] } };
  }

  initializeBlock(blockSpec) {
    if (!utils.isSorted(this.blockSpec.steps))
      throw RangeError(`Steps Block must be ordered`);
    this.bits = Math.ceil(Math.log2(this.blockSpec.steps.length + 1));
    this.stepsBlock = new Block({
      key: "steps",
      type: "integer",
      bits: this.bits,
      offset: 0,
    });
    if (this.blockSpec.steps_names.length == 0) {
      this.blockSpec.steps_names = [`x<${this.blockSpec.steps[0]}`];
      for (let i = 0; i <= this.blockSpec.steps.length - 2; i++) {
        this.blockSpec.steps_names.push(
          `${this.blockSpec.steps[i]}<=x<${this.blockSpec.steps[i + 1]}`
        );
      }
      this.blockSpec.steps_names.push(
        `x>=${this.blockSpec.steps.slice(-1)[0]}`
      );
    }
    if (this.blockSpec.steps_names.length != this.blockSpec.steps.length + 1)
      throw RangeError(`steps_names' has to have length 1 + len(steps)`);
    this.blockSpec.steps.push(Infinity);
  }
  _binEncode(value) {
    const _value = this.blockSpec.steps.reduce(
      (acc, cur, idx) => (acc != -1 ? acc : value < cur ? idx : -1),
      -1
    );
    return this.stepsBlock.binEncode(_value);
  }
  _binDecode(message) {
    let value = this.stepsBlock.binDecode(message);
    return this.blockSpec.steps_names[value];
  }
}

class CategoriesBlock extends BlockABC {
  initVariables() {
    this.input = "string";
    this.required = { categories: "array" };
    this.optional = {
      error: {
        type: "string",
        default: null,
      },
    };
  }

  initializeBlock(blockSpec) {
    let length = this.blockSpec.categories.length;
    length +=
      !!this.blockSpec.error &&
      !this.blockSpec.categories.includes(this.blockSpec.error)
        ? 1
        : 0;
    this.bits = Math.ceil(Math.log2(length));
    this.categoriesBlock = new Block({
      key: "categories",
      type: "integer",
      bits: this.bits,
      offset: 0,
    });
  }
  _binEncode(value) {
    let index = this.blockSpec.categories.indexOf(value);
    if (index == -1) {
      if (this.blockSpec.categories.includes(this.blockSpec.error))
        index = this.blockSpec.categories.indexOf(this.blockSpec.error);
      else if (!!this.blockSpec.error) index = this.blockSpec.categories.length;
      else throw RangeError("Invalid value for category.");
    }
    return this.categoriesBlock.binEncode(index);
  }
  _binDecode(message) {
    let value = this.categoriesBlock.binDecode(message);
    return value < this.blockSpec.categories.length
      ? this.blockSpec.categories[value]
      : value == this.blockSpec.categories.length && !!this.blockSpec.error
      ? this.blockSpec.error
      : "error";
  }
}

class Block {
  constructor(blockSpec) {
    this.TYPES = {
      boolean: BooleanBlock,
      binary: BinaryBlock,
      integer: IntegerBlock,
      float: FloatBlock,
      pad: PadBlock,
      array: ArrayBlock,
      object: ObjectBlock,
      string: StringBlock,
      steps: StepsBlock,
      categories: CategoriesBlock,
    };
    this.blockSpec = JSON.parse(JSON.stringify(blockSpec));
    this.validateBlockSpec(this.blockSpec);
    this.block = new this.TYPES[blockSpec.type](this.blockSpec);
    this.block.validateBlockSpecKeys(this.blockSpec);
    this.block.initializeBlock(this.blockSpec);
    this.binEncode = this.block.binEncode.bind(this.block);
    this.binDecode = this.block.binDecode.bind(this.block);
    this.consume = this.block.consume.bind(this.block);
    this.accumulateBits = this.block.accumulateBits.bind(this.block);
  }
  validateBlockSpec(blockSpec) {
    if (!("key" in blockSpec))
      throw new ReferenceError(
        `Block ${JSON.stringify(blockSpec)} must have 'key'.`
      );
    if (!utils.isString(blockSpec.key))
      throw new RangeError(`Block ${blockSpec.key} 'key' must be a string .`);
    if (!("type" in blockSpec))
      throw new ReferenceError(`Block ${blockSpec.key} must have 'type'.`);
    if (!(blockSpec.type in this.TYPES))
      throw new RangeError(
        `Block ${blockSpec.key} has type: ${
          blockSpec.type
        }, should be one of: ${Object.keys(this.TYPES).join(", ")}.`
      );
  }
}

module.exports.blocks = {
  Block,
};
