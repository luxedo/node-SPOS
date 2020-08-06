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

/* These tests requires the python version of SPOS installed */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

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
                  `echo ${message}| spos -p ${pSpecFile} -f hex -d`,
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
                    assert.objectCloseTo(decoded, jsDecoded);
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
      const payloadSpec = files[pSpecFile];
      it(`Random decodeFromSpecs ${idx}`, function (done) {
        this.timeout(20000);
        exec(`spos -p ${pSpecFile} -f hex -r`, (error, stdout, stderr) => {
          if (error || stderr || !stdout) {
            throw error;
          }
          const message = stdout;
          exec(
            `echo ${message}| spos -p ${pSpecFile} -f hex -d`,
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
              assert.objectCloseTo(decoded, jsDecoded);
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
