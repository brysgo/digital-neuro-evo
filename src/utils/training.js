import { shuffle } from "./array";

export function prepareDataForTraining(data, numTrainingSamples, iterations) {
  // split training and test data
  const trainingSamples = data.slice(0, numTrainingSamples);
  const testSamples = data.slice(numTrainingSamples);

  // multiply the training samples by the iterations
  let duplicatedTrainingSamples = [];
  for (let i = 0; i < iterations; i++) {
    duplicatedTrainingSamples = duplicatedTrainingSamples.concat(
      trainingSamples
    );
  }

  // shuffle the order so our network doesn't memorize it
  duplicatedTrainingSamples = shuffle(duplicatedTrainingSamples);

  return [duplicatedTrainingSamples, testSamples];
}
