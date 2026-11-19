// A genome is one candidate policy.
//
// This project uses neuroevolution rather than gradient descent:
// each genome stores weights, those weights choose actions, and
// evolution keeps and mutates the genomes that perform best.
const GENOME_INPUTS = 5;

function createRandomGenome() {
  // Start with random policies so the first generation explores
  // many different flap patterns.
  return {
    weights: Array.from(
      { length: GENOME_INPUTS },
      () => Math.random() * 2 - 1
    )
  };
}

function cloneGenome(genome) {
  // Always copy the weights. Mutating a child must not accidentally
  // mutate its parent or the historical champion.
  return {
    weights: [...genome.weights]
  };
}

function chooseAction(genome, observation) {
  // With no pipe to look at, waiting is safer than making a decision
  // from incomplete information.
  if (!observation) {
    return 0;
  }

  // These are the policy's state features. The first value is a bias,
  // which lets the policy produce a non-zero decision even when all
  // observed features are close to zero.
  //
  // Normalization puts the features on roughly similar scales. Without
  // it, a large-valued feature could dominate simply because of its units.
  const inputs = [
    1,
    observation.birdY / 640,
    observation.birdVelocity / 10,
    observation.distanceToPipe / 360,
    observation.verticalDistanceToGapCenter / 640
  ];

  let decision = 0;

  // This is a linear policy: weighted inputs are added together and
  // the sign of the result maps to one of two discrete actions.
  for (let i = 0; i < inputs.length; i++) {
    decision += inputs[i] * genome.weights[i];
  }

  return decision > 0 ? 1 : 0;
}

function mutateGenome(genome, mutationRate = 0.2, mutationStrength = 0.5) {
  // A child begins as a copy of a successful parent.
  const mutatedGenome = cloneGenome(genome);

  for (let i = 0; i < mutatedGenome.weights.length; i++) {
    if (Math.random() < mutationRate) {
      // Mutation supplies exploration. Some weights remain unchanged,
      // while selected weights receive a small random perturbation.
      mutatedGenome.weights[i] +=
        (Math.random() * 2 - 1) * mutationStrength;
    }
  }

  return mutatedGenome;
}