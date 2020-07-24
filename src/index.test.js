import { Network, Source, Target } from ".";
import { prepareDataForTraining } from "./utils/training";

const csvParse = require("csv-parse");

test("running the algorithm on benchmark data", (done) => {
  // new network to train
  const network = new Network();

  // how many samples do we have and how many times do we want to iterate
  const numTrainingSamples = 75;
  const trainingIterations = 10;

  // load in raw CSV data
  var input = require("./data/iris.data");

  // parse CSV data using csv-parse lib
  csvParse(input, { comment: "#" }, function (err, unshuffled) {
    // prepare the data by:
    // 1. splitting training and test data
    // 2. repeating the training data for each iteration
    // 3. shuffling the repeated training data
    var [training, testData] = prepareDataForTraining(
      unshuffled,
      numTrainingSamples,
      trainingIterations
    );

    // all IO data for thoughtnet is represented with binary
    const sourceDataToBinary = (datumArray) => {
      return datumArray
        .slice(0, -1)
        .map((x) => {
          let [left, right] = x.split(".").map((s) => parseInt(s));
          var n = (left >>> 0).toString(2);
          n = "0000".substr(n.length) + n;
          var k = (right >>> 0).toString(2);
          k = "0000".substr(k.length) + k;
          return n + k;
        })
        .join("");
    };

    const binaryClassificationMap = {
      "Iris-setosa": "00",
      "Iris-versicolor": "01",
      "Iris-virginica": "10",
    };

    // source and target data are initialized with a generator and the size of each datum
    const source = new Source(function* () {
      for (const datum of training) {
        yield sourceDataToBinary(datum);
      }
      for (const datum of testData) {
        yield sourceDataToBinary(datum);
      }
    }, 32);

    const target = new Target(function* () {
      for (let i = 0; i < training.length; i++) {
        if (training[i].length > 1) {
          yield binaryClassificationMap[training[i][training[i].length - 1]];
        }
      }
    }, 2);

    // sources and targets must be attached to the network
    network.attachSource(source);

    network.attachTarget(target);

    console.log("starting training (may take a while)");
    training.forEach(() => {
      network.runOnce();
    });
    console.log("finished training");

    // collect number correct with test data
    const correct = testData.reduce((acc, cur) => {
      // run the network forward to get the result
      // since our source data goes through training data then test data
      // we can rely on the order instead of explicitly saying to use test data
      const [result, reward] = network.forward();

      // we also need to grab what the test data expected
      let target = binaryClassificationMap[cur[cur.length - 1]];

      // add to the correct count if we guessed right
      return acc + (result.join("") == target);
    }, 0);

    console.log(
      `${correct} correct out of ${testData.length} test samples, ${numTrainingSamples} training samples, and ${trainingIterations} iterations.`
    );

    // fail the test if we got less than half correct
    expect(correct).toBeGreaterThan(38);
    done();
  });
});
