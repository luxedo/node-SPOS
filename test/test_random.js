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

/* These tests requires the python version of SPOS installed */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const { assert } = require("chai");
const spos = require("spos");
const { utils } = require("../spos/utils.js");

const DELTA = 0.1;

assert.arrayCloseTo = (actual, expected, delta = DELTA, message = "") => {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, idx) => {
    if (utils.isObject(actual[idx]))
      assert.objectCloseTo(actual[idx], expected[idx], delta, message);
    else if (Array.isArray(actual[idx]))
      assert.arrayCloseTo(actual[idx], expected[idx], delta, message);
    else if (utils.isString(actual[idx]) || utils.isBoolean(actual[idx]))
      assert.equal(actual[idx], expected[idx], message);
    else assert.closeTo(actual[idx], expected[idx], delta, message);
  });
};

assert.objectCloseTo = (actual, expected, delta = DELTA, message = "") => {
  let keysA = Object.keys(actual);
  let keysE = Object.keys(expected);
  keysA.sort();
  keysE.sort();
  assert.deepEqual(keysA, keysE, message);
  Object.keys(actual).forEach((key) => {
    if (utils.isObject(actual[key]))
      assert.objectCloseTo(actual[key], expected[key], delta, message);
    else if (Array.isArray(actual[key]))
      assert.arrayCloseTo(actual[key], expected[key], delta, message);
    else if (utils.isString(actual[key]) || utils.isBoolean(actual[key]))
      assert.equal(actual[key], expected[key], message);
    else assert.closeTo(actual[key], expected[key], delta, message);
  });
};

describe("Random payloads tests", () => {
  const jsonDir = "test/json/";
  const N = 100;
  fs.readdir(jsonDir, (err, files) => {
    if (err) console.error(err);
    files
      .filter((file) => file.match("spec"))
      .forEach((file) => {
        const pSpecFile = path.join(jsonDir, file);
        it(`Encodes ${pSpecFile} random payloads`, function (done) {
          this.timeout(20000);
          for (let i = 0; i < N; i++) {
            exec(`spos -p ${pSpecFile} -f hex -r`, (error, stdout, stderr) => {
              if (error || stderr || !stdout) {
                throw error;
              }
              const message = stdout;
              fs.readFile(pSpecFile, (err, data) => {
                if (err) throw err;
                const payloadSpec = JSON.parse(data);
                exec(
                  `echo ${message}| spos -p ${pSpecFile} -f hex -d -m`,
                  (error, stdout, stderr) => {
                    if (error || stderr || !stdout) {
                      throw error;
                    }
                    const decoded = JSON.parse(stdout);
                    const jsDecoded = spos.decode(
                      message.replace(/^0[xX]/, ""),
                      payloadSpec,
                      "hex"
                    );
                    assert.objectCloseTo(
                      decoded,
                      jsDecoded,
                      DELTA,
                      "pyDecoded: \n" +
                        JSON.stringify(decoded, null, 2) +
                        "\njsDecoded: \n" +
                        JSON.stringify(jsDecoded, null, 2)
                    );
                  }
                );
              });
            });
          }
          setImmediate(done);
        });
      });
  });
});

describe("Random decodeFromSpecs tests", () => {
  const jsonDir = "test/json/";
  const N = 100;
  fs.readdir(jsonDir, (err, files) => {
    if (err) console.error(err);
    files = Object.fromEntries(
      files
        .filter((file) => file.match("spec"))
        .map((file) => {
          const pSpecFile = path.join(jsonDir, file);
          return [pSpecFile, JSON.parse(fs.readFileSync(pSpecFile))];
        })
    );
    const payloadSpecs = Object.values(files);
    new Array(N).fill(0).forEach((n, idx) => {
      const pSpecFile = choose(Object.keys(files));
      it(`Random decodeFromSpecs ${idx}`, function (done) {
        this.timeout(20000);
        exec(`spos -p ${pSpecFile} -f hex -r`, (error, stdout, stderr) => {
          if (error || stderr || !stdout) {
            throw error;
          }
          const message = stdout;
          exec(
            `echo ${message}| spos -p ${pSpecFile} -f hex -d -m`,
            (error, stdout, stderr) => {
              if (error || stderr || !stdout) {
                throw error;
              }
              const decoded = JSON.parse(stdout);
              const jsDecoded = spos.decodeFromSpecs(
                message.replace(/^0[xX]/, ""),
                payloadSpecs,
                "hex"
              );
              assert.objectCloseTo(
                decoded,
                jsDecoded,
                DELTA,
                "pyDecoded: \n" +
                  JSON.stringify(decoded, null, 2) +
                  "\njsDecoded: \n" +
                  JSON.stringify(jsDecoded, null, 2)
              );
              setImmediate(done);
            }
          );
        });
      });
    });
  });
});

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}
